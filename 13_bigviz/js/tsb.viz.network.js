var tsb = tsb || { viz : {} };

tsb.viz.network = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.year = (new Date()).getFullYear();

    this.loadData();
    this.resize(this.w, this.h);

    this.bg = svg
    .append('rect')
    .attr('class', 'bg')
    .attr('width', this.w).attr('height', this.h)
    .attr('fill', '#FFFFFF');

    this.addToolTip();
  },
  loadData: function() {
    tsb.state.dataSource.getProjectsAndParticipantsForYear(this.year).then(function(data) {
      console.log('data loaded', data.rows.length);
      var participantList = data.groupBy('participant').values;
      var projectList = data.groupBy('project').values;

      console.log('participantList', participantList.length);
      participantList = participantList.filter(function(participantDataSet) {
        return participantDataSet.rows.length > 2
      })
      console.log('participantList', participantList.length);

      var participants = [];
      var participantMap = {};
      var projects = [];
      var projectMap = {};

      console.log('projectList', projectList.length);
      projectList = projectList.filter(function(projectDataSet) {
        return projectDataSet.rows.length > 2
      })
      projectList.forEach(function(projectInfo) {
        projectInfo.rows.forEach(function(projectParticipant) {
          var project = projectMap[projectParticipant.project];
          if (!project) {
            project = { label : '', participants : [] };
            projects.push(project);
            projectMap[projectParticipant.project] = project;
          }
        });
      })
      console.log('projectList', projectList.length);
      console.log('projects', projects.length, projects);

      participantList.forEach(function(participantInfo) {
        participantInfo.rows.forEach(function(participantProject) {
          var participant = participantMap[participantProject.participant];
          if (!participant) {
            participant = { label : participantProject.participantLabel, projects : [] };
            participants.push(participant);
            participantMap[participantProject.participant] = participant;
          }
          var project = projectMap[participantProject.project];
          if (project) {
            project.participants.push(participant);
            //if project is worthy
            participant.projects.push({
              id: participantProject.project,
              budgetArea: participantProject.budgetArea,
              budgetAreaCode: tsb.common.extractBudgetAreaCode(participantProject.budgetArea)
            })
          }
        })
      })

      this.buildViz(participants, projects);
    }.bind(this));
  },
  buildViz: function(participants, projects) {
    var w = this.w;
    var h = this.h;

    var participantRadius = 5;

    participants.forEach(function(pariticipant) {
      var numProjects = pariticipant.projects.length;
      pariticipant.projects.forEach(function(project, projectIndex) {
        project.angle = Math.PI * 2 * projectIndex / numProjects;
      })
    })

    var participantNodes = this.svg.selectAll('g.participant')
      .data(participants)
      .enter()
      .append('g')
        .attr('transform', function(d) { return 'translate('+Math.random() * w + ',' + Math.random() * h+')'; })

    participantNodes
        .append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', participantRadius)
        .style('fill', '#999');

    participantNodes.selectAll('circle.project')
      .data(function(d) {
        return d.projects;
      })
      .enter().append('circle')
        .attr('cx', function(d, i) { return 2 * participantRadius * Math.cos(d.angle); })
        .attr('cy', function(d, i) { return 2 * participantRadius * Math.sin(d.angle); })
        .attr('r', 3)

  },
  resize: function(w, h) {
    this.w = w;
    this.h = h;
  },
  addToolTip: function() {
    this.tooltip = this.svg.append('g');
    this.tooltip.style('display', 'none');

    this.tooltipBg = this.tooltip.append('rect')
      .attr('width', '240px')
      .attr('height', '1.3em')
      .style('fill', 'red')
      .attr('rx', '5px')
      .attr('ry', '5px')

    this.tooltipText = this.tooltip.append('text')
      .text('BLA BLA')
      .attr('dx', '0.5em')
      .attr('dy', '1.5em')
      .style('fill', '#FFF')
      .style('font-size', '12px')

    this.svg.on('mousemove', function(e) {
      this.tooltip.attr('transform', function(d) { return 'translate(' + (d3.event.x + 10) + ',' + (d3.event.y-20) + ')'; });
    }.bind(this))
  }
}
