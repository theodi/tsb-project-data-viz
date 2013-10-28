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
      console.log('projects', projects.length);

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

    participants.forEach(function(participant, participantIndex) {
      participant.index = participantIndex;
      participant.x = Math.random() * w;
      participant.y = Math.random() * h;
      var numProjects = participant.projects.length;
      participant.projects.forEach(function(project, projectIndex) {
        project.participant = participant;
        project.angle = Math.PI * 2 * projectIndex / numProjects;
      })
    })

    var participantLinks = [];
    var participantLinksMap = {};
    projects.forEach(function(project) {
      for(var i=0; i<project.participants.length; i++) {
        var participantA = project.participants[i];
        for(var j=i+1; j<project.participants.length; j++) {
          var participantB = project.participants[j];
          var linkABHash = participantA.index + '-' + participantB.index;
          var linkBAHash = participantB.index + '-' + participantA.index;
          if (!participantLinksMap[linkABHash] && !participantLinksMap[linkBAHash]) {
            participantLinksMap[linkABHash] = true;
            participantLinksMap[linkBAHash] = true;
            participantLinks.push([participantA.index, participantB.index]);
          }
        }
      }
      project.participants.forEach(function() {
        project.participants.forEach(function(participantB) {
          if (participantA == participantB) return;
        })
      })
    })

    var participantNodes = this.svg.selectAll('g.participant')
      .data(participants)
      .enter()
      .append('g')
        .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; })

    participantNodes
        .append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', function(d) {
          return d.projects.length;
        })
        .style('stroke', '#333')
        .style('fill', 'none');

    participantNodes.selectAll('circle.projects')
      .data(function(d) {
        return d.projects;
      })
      .enter().append('circle')
        .attr('cx', function(d, i) { return (d.participant.projects.length + participantRadius) * Math.cos(d.angle); })
        .attr('cy', function(d, i) { return (d.participant.projects.length + participantRadius) * Math.sin(d.angle); })
        .attr('r', function(d){
          return 4;
        })
        .style('fill', function(d) { return tsb.config.themes.current.budgetAreaColor[d.budgetAreaCode];})

    console.log('participantLinks', participantLinks.length);

    function participantProjectoionColor() {

    }

    var participantLinkLines = this.svg.selectAll('line.link')
      .data(participantLinks)
      .enter().append('line')
      .attr('x1', function(d) { return participants[d[0]].x; })
      .attr('y1', function(d) { return participants[d[0]].y; })
      .attr('x2', function(d) { return participants[d[1]].x; })
      .attr('y2', function(d) { return participants[d[1]].y; })
      .style('stroke', 'rgba(0,0,0,0.1)');
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
