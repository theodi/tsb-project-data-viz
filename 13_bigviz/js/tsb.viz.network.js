var tsb = tsb || { viz : {} };

tsb.viz.network = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.institutionSize = 'academic';
    this.institutionTopCount = 12;
    this.loadData();

    this.resize(w, h);
  },
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
        .style('fill', 'red')

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
      collaboratorInfo.x = this.lngX(collaboratorInfo.lng);
      collaboratorInfo.y = this.latY(collaboratorInfo.lat);
      collaboratorInfo.budgetAreaCode = tsb.common.extractBudgetAreaCode(collaboratorInfo.budgetArea);
      if (!this.uniqueDots[collaboratorInfo.collaboratorLabel]) {
        this.uniqueDots[collaboratorInfo.collaboratorLabel] = true;
        this.uniqueDotsCount++;
      }
      else {
        return;
      }
      this.totalDots++;
      var collaboratorSite = this.svg.append('circle')
        .attr('cx', collaboratorInfo.x)
        .attr('cy', collaboratorInfo.y)
        .attr('r', 1)
        .style('fill', 'blue')
    }.bind(this));
  },
  resize: function(w, h) {
    this.w = w;
    this.h = h;
    var dlng = 2.856445+5.458984;
    var dlat = 56.291349-49.95122;
    this.lngX = d3.scale.linear()
      //.domain([-10.458984, 2.856445])
      .domain([-5.458984, 2.856445])
      .range([(w-h)/2, h*dlat/dlng+(w-h)/2]);
    this.latY = d3.scale.linear()
      //.domain([61.291349, 49.95122])
      .domain([56.291349, 49.95122])
      .range([0, h]);
  },
  close: function() {

  }
}