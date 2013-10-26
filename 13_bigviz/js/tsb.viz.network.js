var tsb = tsb || { viz : {} };

tsb.viz.network = {
  init: function(svg, w, h) {
    this.institutionSize = 'academic';
    this.institutionTopCount = 12;
    this.loadData();
  },
  loadData: function() {
    tsb.state.dataSource.getInstitutions(this.institutionSize).then(function(data) {
      data.rows.forEach(function(row) {
        row.numProjects = Number(row.numProjects);
        row.id = row.org.substr(row.org.lastIndexOf('/')+1)
      });

      data.rows.sort(function(a, b) {
        return b.numProjects - a.numProjects;
      });

      var topBest = tsb.common.inital(data.rows, this.institutionTopCount);

      console.log(topBest);

      this.addOrganizations(topBest);
    }.bind(this));
  },
  addOrganizations: function(organizations) {
    organizations.forEach(function(organization, organizationIndex) {
      tsb.state.dataSource.getOrganizationCollaborators(organization.org).then(function(data) {
        this.addCollaborators(organization, organizationGroup, rowHeight/2, data);
      }.bind(this));
    }.bind(this));
  },
  addCollaborators: function(organization, organizationGroup, radius, collaboratorsDataSet) {
    collaboratorsDataSet.rows.forEach(function(collaboratorInfo) {
      collaboratorInfo.budgetAreaCode = tsb.common.extractBudgetAreaCode(collaboratorInfo.budgetArea);
    });
  },
  resize: function(w, h) {

  },
  close: function() {

  }
}