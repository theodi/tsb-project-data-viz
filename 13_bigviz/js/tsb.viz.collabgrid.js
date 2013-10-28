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
            label: row.participantLabel,
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
    var collaboratorDistance = 150;
    var tooltip = this.tooltip;
    var tooltipText = this.tooltipText;

    var linkGroup = svg.append('g');
    var nodeGroup = svg.append('g');

    function exploreOrganization(org) {
      org.x = w/2;
      org.y = h*0.8;

      var rootNode = nodeGroup.selectAll('.root').data([org]);
      rootNode.exit().remove()
      rootNode.enter().append('circle')
        .attr('class', 'root')
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .attr('r', 0)
        .style('fill', 'white')
        .style('stroke', '#333')
        .transition()
        .attr('r', 20)

      rootNode.on('mouseover', function(d) {
        console.log(d);
        tooltip.style('display', 'block')
        tooltipText.text(d.label);
      })

      rootNode.on('mouseout', function() {
        tooltip.style('display', 'none');
      })

      org.projects.forEach(function(project, projectIndex) {
        project.x = w/2 + (projectIndex - org.projects.length/2) * 40;
        project.y = h*0.5;
      })

      var projectNodes = nodeGroup.selectAll('.project').data(org.projects);
      projectNodes.exit().remove()
      projectNodes.enter().append('rect')
        .attr('class', 'project')
        .attr('x', function(d) { return d.x - 3; })
        .attr('y', function(d) { return d.y; })
        .attr('width', function(d) { return 6; })
        .attr('height', function(d) { return 14; })
        .attr('r', 0)
        .style('fill', function(d) { return tsb.config.themes.current.budgetAreaColor[d.budgetAreaCode]; })
        .style('stroke', 'none')
        .transition()
        .delay(function(d,i) {
          return i * 30;
        })
        .attr('r', 5);

      var collaborators = _.filter(_.uniq(_.flatten(_.pluck(org.projects, 'participants'))), function(p) { return p != org; });
      collaborators.forEach(function(collaborator, collaboratorIndex) {
        //collaborator.x = w/2 + collaboratorDistance * Math.cos(Math.PI*2*collaboratorIndex/(collaborators.length-1));
        //collaborator.y = h/2 + collaboratorDistance * Math.sin(Math.PI*2*collaboratorIndex/(collaborators.length-1));
        collaborator.x = w/2 + (collaboratorIndex - collaborators.length/2) * 40;
        collaborator.y = h * 0.2;
      });

      var collaboratorNodes = nodeGroup.selectAll('.collaborator').data(collaborators);
      collaboratorNodes.exit().remove()
      collaboratorNodes.enter().append('circle')
      .attr('class', 'collaborator')
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

      collaboratorNodes.on('mouseover', function(d) {
        console.log(d);
        tooltip.style('display', 'block')
        tooltipText.text(d.label);
      })

      collaboratorNodes.on('mouseout', function() {
        tooltip.style('display', 'none');
      })


      //do, are we displaying ourselves?

      var diagonal = d3.svg.diagonal().projection(function(d) { return [d.x, d.y]; });

      var links = [];
      org.projects.forEach(function(project) {
        links.push({ source:project, target:org, project: project});
        project.participants.forEach(function(participant) {
          if (participant != org) {
            links.push({source:project, target:participant, project: project});
          }
        })
      })

      var linkNodes = linkGroup.selectAll('.link').data(links);
      linkNodes.exit().remove();
      linkNodes.enter().append('path')
        .attr('class', 'link')
        .style('fill', 'none')
        .style('stroke', function(d) {
          console.log(d);
          return tsb.config.themes.current.budgetAreaColor[d.project.budgetAreaCode];
        })
        .attr('d', diagonal);

      tooltip.node().parentNode.appendChild(tooltip.node());
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
