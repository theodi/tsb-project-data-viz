var tsb = tsb || { viz : {} };

tsb.viz.network = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.institutionSize = 'small';
    this.institutionTopCount = 12;
    this.loadData();

    this.resize(w, h);

    this.voronoi = d3.geom.voronoi()
      .clipExtent([[0, 0], [this.w, this.h]])
      //.x(function(d) { return d.x; })
      //.y(function(d) { return d.y; })
    this.path = this.svg.append('g').selectAll('path');
  },
  organizationList: [],
  loadData: function() {
    tsb.state.dataSource.getInstitutions(this.institutionSize).then(function(data) {
      data.rows.forEach(function(row) {
        row.lat = Number(row.lat);
        row.lng = Number(row.lng);
        row.numProjects = Number(row.numProjects);
        row.id = row.org.substr(row.org.lastIndexOf('/')+1)
      });

      data.rows.sort(function(a, b) {
        return b.numProjects - a.numProjects;
      });

      var topBest = tsb.common.inital(data.rows, this.institutionTopCount);

      this.addOrganizations(topBest);
    }.bind(this));
  },
  addOrganizations: function(organizations) {
    organizations.forEach(function(organization, organizationIndex) {
      organization.x = this.lngX(organization.lng);
      organization.y = this.latY(organization.lat);

      this.organizationList.push([organization.x, organization.y]);

      var x = this.w / 2;
      var y = this.h / 2;
      var organizationGroup = this.svg.append('g')
        .attr('id', 'organizationGroup_' + organization.id)
        .attr('class', 'organizationGroup')
        .attr('transform', 'translate('+x+','+y+')');

      var organizationSite = this.svg.append('circle')
        .attr('cx', organization.x)
        .attr('cy', organization.y)
        .attr('r', 5)
        .style('stroke', '#44FF00')
        .style('fill', 'none')

      tsb.state.dataSource.getOrganizationCollaborators(organization.org).then(function(data) {
        this.addCollaborators(organization, organizationGroup, 50, data);
      }.bind(this));
    }.bind(this));
  },
  totalDots: 0,
  uniqueDots: {},
  uniqueDotsCount: 0,
  addCollaborators: function(organization, organizationGroup, radius, collaboratorsDataSet) {
    collaboratorsDataSet.rows.forEach(function(collaboratorInfo) {
      collaboratorInfo.lat = Number(collaboratorInfo.lat);
      collaboratorInfo.lng = Number(collaboratorInfo.lng);
      collaboratorInfo.x = Math.random()*this.w;//this.lngX(collaboratorInfo.lng) + 15 * Math.random();
      collaboratorInfo.y = Math.random()*this.h;//this.latY(collaboratorInfo.lat) + 15 * Math.random();
      collaboratorInfo.budgetAreaCode = tsb.common.extractBudgetAreaCode(collaboratorInfo.budgetArea);
      if (!this.uniqueDots[collaboratorInfo.collaboratorLabel]) {
        this.uniqueDots[collaboratorInfo.collaboratorLabel] = true;
        this.organizationList.push([collaboratorInfo.x, collaboratorInfo.y]);
        this.uniqueDotsCount++;
      }
      else {
        return;
      }
      this.totalDots++;
      var collaboratorSite = this.svg.append('circle')
        .attr('cx', collaboratorInfo.x)
        .attr('cy', collaboratorInfo.y)
        .attr('r', function() {
          if (collaboratorInfo.collaboratorSizeLabel == 'academic') return 10;
          if (collaboratorInfo.collaboratorSizeLabel == 'large') return 8;
          if (collaboratorInfo.collaboratorSizeLabel == 'medium') return 6;
          if (collaboratorInfo.collaboratorSizeLabel == 'small') return 5;
          if (collaboratorInfo.collaboratorSizeLabel == 'micro') return 4;
          return '#666666'
        })
        .style('stroke', 'none')
        .style('fill', function() {
          if (collaboratorInfo.collaboratorSizeLabel == 'academic') return '#0DBC37';
          if (collaboratorInfo.collaboratorSizeLabel == 'large') return '#00B7FF';
          if (collaboratorInfo.collaboratorSizeLabel == 'medium') return '#1DD3A7';
          if (collaboratorInfo.collaboratorSizeLabel == 'small') return '#F9BC26';
          if (collaboratorInfo.collaboratorSizeLabel == 'micro') return '#FF6700';
          return '#666666'
        })
    }.bind(this));
    this.updateMesh();
  },
  resize: function(w, h) {
    this.w = w;
    this.h = h;
    var dlng = 2.856445+5.458984;
    var dlat = 56.291349-49.95122;
    this.lngX = d3.scale.linear()
      //.domain([-10.458984, 2.856445])
      .domain([-5.458984, 1.3])
      //.range([(w-h)/2, h*dlat/dlng+(w-h)/2]);
      .range([0, w]);
    this.latY = d3.scale.linear()
      //.domain([61.291349, 49.95122])
      .domain([57.291349, 49.95122])
      .range([0, h]);
  },
  updateMesh: function() {
    this.path = this.path.data(d3.geom.delaunay(this.organizationList).map(function(d) { return "M" + d.join("L") + "Z"; }), String);
    this.path.exit().remove();
    this.path.enter().append("path")
      .style('fill', function(d, i) { return '#FFFFFF'; })
      .style('stroke', function(d, i) { return 'rgba(255,0,0,0.2)'; })
      .attr("d", String);
  },
  polygon: function(d) {
    return 'M' + d.join('L') + 'Z';
  },
  close: function() {

  }
}