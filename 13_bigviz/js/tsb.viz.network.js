var tsb = tsb || { viz : {} };

tsb.viz.network = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.institutionSize = 'small';
    this.institutionTopCount = 5;

    this.force = d3.layout.force()
      .charge(-70)
      .linkDistance(25)
      .size([w, h]);

    this.loadData();
    this.resize(this.w, this.h);
  },
  organizationsByName: {},
  organizations: [],
  loadData: function() {
    tsb.state.dataSource.getInstitutions(this.institutionSize).then(function(data) {
      this.processRows(data.rows);

      data.rows.sort(function(a, b) {
        return b.numProjects - a.numProjects;
      });

      var organizationList = tsb.common.inital(data.rows, this.institutionTopCount);
      var loadedCollabolators = 0;
      organizationList.forEach(function(organization, organizationIndex) {
        tsb.state.dataSource.getOrganizationCollaborators(organization.org).then(function(data) {
          this.processRows(data.rows);
          organization.collaborators = data.rows;
          if (++loadedCollabolators == organizationList.length) {
            this.buildViz(organizationList);
          }
        }.bind(this));
      }.bind(this));
    }.bind(this));
  },
  processRows: function(rows) {
    rows.forEach(function(row) {
      row.lat = Number(row.lat);
      row.lng = Number(row.lng);
      row.x = this.lngX(row.lng);
      row.y = this.latY(row.lat);
      if (row.numProjects) row.numProjects = Number(row.numProjects);
      if (row.org) row.id = row.org.substr(row.org.lastIndexOf('/')+1)
    }.bind(this));
  },
  buildViz: function(organizations) {
    var organizationsNodes = [];
    var organizationsNodesLinks = [];
    var organizationsNodesLinksMap = {};
    var organizationsByName = {};


    organizations.forEach(function(organization) {
      organization.index = organizationsNodes.length;
      organizationsByName[organization.orgLabel] = organization;
      organizationsNodes.push(organization);
      organization.collaborators.forEach(function(collaborator) {
        if (organizationsByName[collaborator.collaboratorLabel]) {
          collaborator = organizationsByName[collaborator.collaboratorLabel];
          if (collaborator == organization) return;
        }
        else {
          collaborator.index = organizationsNodes.length;
          organizationsByName[collaborator.collaboratorLabel] = collaborator;
          organizationsNodes.push(collaborator);
        }
        var linkHash = organization.index + '-' + collaborator.index;
        if (!organizationsNodesLinksMap[linkHash]) {
          organizationsNodesLinksMap[linkHash] = true;
          organizationsNodesLinks.push({source:organization.index, target:collaborator.index});
        }
      });
    });

    this.force
      .nodes(organizationsNodes)
      .links(organizationsNodesLinks)
      .start();

    var organizationSites = this.svg.selectAll('circle.organization')
      .data(organizationsNodes)
        .enter()
        .append('circle')
        .attr('class', 'node')
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .attr('r', 3)
        .style('stroke', '#44FF00')
        .style('fill', 'none')

    var organizationsConnections = this.svg.selectAll('.link')
      .data(organizationsNodesLinks)
      .enter().append('line')
      .attr('class', 'link')
      .style('stroke', 'rgba(128, 90, 18, 0.1)')
      .style('stroke-width', 1);

    this.force.on('tick', function() {
      organizationsConnections
        .attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });

      organizationSites
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; });
    });
  },
  resize: function(w, h) {
    this.w = w;
    this.h = h;
    var dlng = 2.856445+5.458984;
    var dlat = 56.291349-49.95122;
    this.lngX = d3.scale.linear()
      //.domain([-10.458984, 2.856445])
      .domain([-5.458984, 1.3])
      .range([(w-h)/2, h*dlat/dlng+(w-h)/2]);
      //.range([0, w]);
    this.latY = d3.scale.linear()
      //.domain([61.291349, 49.95122])
      .domain([57.291349, 49.95122])
      .range([0, h]);
  },
}

/*
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
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; })
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

      organization.index = this.organizationList;
      this.organizationList.push(organization);

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
  organizationsByName: {},

  totalDots: 0,
  uniqueDots: {},
  uniqueDotsCount: 0,
  loadedSets: 0,
  addCollaborators: function(organization, organizationGroup, radius, collaboratorsDataSet) {
    this.loadedSets++;
    collaboratorsDataSet.rows.forEach(function(collaboratorInfo) {
      collaboratorInfo.lat = Number(collaboratorInfo.lat);
      collaboratorInfo.lng = Number(collaboratorInfo.lng);
      collaboratorInfo.x = this.lngX(collaboratorInfo.lng) + 15 * Math.random();
      collaboratorInfo.y = this.latY(collaboratorInfo.lat) + 15 * Math.random();
      //collaboratorInfo.x = Math.random()*this.w;
      //collaboratorInfo.y = Math.random()*this.h;
      collaboratorInfo.budgetAreaCode = tsb.common.extractBudgetAreaCode(collaboratorInfo.budgetArea);
      if (!this.uniqueDots[collaboratorInfo.collaboratorLabel]) {
        this.uniqueDots[collaboratorInfo.collaboratorLabel] = true;
        this.organizationList.push(collaboratorInfo);
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
    if (++this.loadedSets == this.institutionTopCount) {
      //this.updateMesh();
    }
  },
  resize: function(w, h) {
    this.w = w;
    this.h = h;
    var dlng = 2.856445+5.458984;
    var dlat = 56.291349-49.95122;
    this.lngX = d3.scale.linear()
      //.domain([-10.458984, 2.856445])
      .domain([-5.458984, 1.3])
      .range([(w-h)/2, h*dlat/dlng+(w-h)/2]);
      //.range([0, w]);
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
*/