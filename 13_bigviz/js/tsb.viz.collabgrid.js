var tsb = tsb || { viz : {} };

tsb.viz.collabGrid = {
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
      var participants = [];
      var participantsMap = {};
      var projects = [];
      var projectsMap = {};

      data.rows.forEach(function(row) {
        var project = projectsMap[row.project];
        if (!project) {
          project = {
            id: row.project,
            budgetArea: row.budgetArea,
            budgetAreaCode: tsb.common.extractBudgetAreaCode(row.budgetArea),
            participants: []
          }
          projectsMap[row.project] = project;
          projects.push(project);
        }
        var participant = participantsMap[row.participant];
        if (!participant) {
          participant = {
            id: row.participant,
            projects: []
          }
          participantsMap[row.participant] = participant;
          participants.push(participant);
        }
        if (project.participants.indexOf(participant) == -1) {
          project.participants.push(participant);
        }
        if (participant.projects.indexOf(project) == -1) {
          participant.projects.push(project);
        }
      })

      console.log('projects', projects.length, 'participants', participants.length);

      function prop(name) {
        return function(o) {
          return o[name];
        }
      }

      var projectsByBudgetAreaCode = _.groupBy(projects, prop('budgetAreaCode'));
      var budgetAreaCodes = _.keys(projectsByBudgetAreaCode);
      var participantsByBudgetAreaCode = {};

      console.log('projectsByBudgetAreaCode', projectsByBudgetAreaCode)

      budgetAreaCodes.forEach(function(budgetAreaCode) {
        var projects = projectsByBudgetAreaCode[budgetAreaCode];
        var participants = _.uniq(_.flatten(_.pluck(projects, 'participants')));
        participantsByBudgetAreaCode[budgetAreaCode] = participants;
      })

      this.buildViz(participants, projects, participantsByBudgetAreaCode, projectsByBudgetAreaCode);
    }.bind(this));
  },
  buildViz: function(participants, projects, participantsByBudgetAreaCode, projectsByBudgetAreaCode) {
    var svg = this.svg;
    var w = this.w;
    var h = this.h;
    var projectDistance = 50;
    var collabolatorDistance = 150;

    function exploreOrganization(org) {
      var rootNode = svg.selectAll('circle.root').data([org]);
      rootNode.exit().remove()
      rootNode.enter().append('circle')
        .attr('class', 'root')
        .attr('cx', w/2)
        .attr('cy', h/2)
        .attr('r', 0)
        .style('fill', 'none')
        .style('stroke', '#333')
        .transition()
        .attr('r', 20)

      org.projects.forEach(function(project, projectIndex) {
        project.x = w/2 + projectDistance * Math.cos(Math.PI*2*projectIndex/org.projects.length);
        project.y = h/2 + projectDistance * Math.sin(Math.PI*2*projectIndex/org.projects.length);
      })

      var projectNodes = svg.selectAll('circle.project').data(org.projects);
      projectNodes.exit().remove()
      projectNodes.enter().append('circle')
        .attr('class', 'project')
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .attr('r', 0)
        .style('stroke', function(d) { return tsb.config.themes.current.budgetAreaColor[d.budgetAreaCode]; })
        .style('fill', 'none')
        .transition()
        .delay(function(d,i) {
          return i * 30;
        })
        .attr('r', 5);

      var collabolators = _.uniq(_.flatten(_.pluck(org.projects, 'participants')));
      collabolators.forEach(function(collabolator, collabolatorIndex) {
        collabolator.x = w/2 + collabolatorDistance * Math.cos(Math.PI*2*collabolatorIndex/collabolators.length);
        collabolator.y = h/2 + collabolatorDistance * Math.sin(Math.PI*2*collabolatorIndex/collabolators.length);
      });

      var collabolatorNodes = svg.selectAll('circle.collabolator').data(collabolators);
      collabolatorNodes.exit().remove()
      collabolatorNodes.enter().append('circle')
      .attr('class', 'collabolator')
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .attr('r', 0)
        .style('stroke', 'none')
        .style('fill', '#333')
        .transition()
        .delay(function(d,i) {
          return i * 30;
        })
        .attr('r', 5);

    }

    var startOrg = participants[0];
    for(var i=0; i<participants.length; i++) {
      if (participants[i].projects.length > 5) {
        startOrg = participants[i];
        break;
      }
    }
    exploreOrganization(startOrg);
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
