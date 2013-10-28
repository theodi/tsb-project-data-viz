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
            size: row.participantSizeLabel,
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

      function prop(name) {
        return function(o) {
          return o[name];
        }
      }

      var projectsByBudgetAreaCode = _.groupBy(projects, prop('budgetAreaCode'));
      var budgetAreaCodes = _.keys(projectsByBudgetAreaCode);
      var participantsByBudgetAreaCode = {};

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

    function exploreOrganization(org) {
      var rootGroup = svg.append('g');
      var linkGroup = rootGroup.append('g');
      var nodeGroup = rootGroup.append('g');
      //ROOT
      org.x = w/2;
      org.y = h*0.9;

      var rootNode = nodeGroup.selectAll('.root').data([org])

      rootNode.enter().append('circle')
        .attr('class', 'root')
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .attr('r', 0)
        .style('fill', 'white')
        .style('stroke', '#333')

      rootNode
        .transition()
        .attr('r', participantSizeToRadius)

      rootNode.on('mouseover', function(d) {
        tooltip.style('display', 'block')
        tooltipText.text(d.label);
      })

      rootNode.on('mouseout', function() {
        tooltip.style('display', 'none');
      })

      rootNode.exit().remove()

      //PROJECTS

      org.projects.forEach(function(project, projectIndex) {
        project.x = w/2 + (projectIndex - org.projects.length/2) * 40;
        project.y = h*0.7;
      })

      function participantSizeToRadius(d) {
        if (d.size == 'micro') return 5;
        if (d.size == 'small') return 5;
        if (d.size == 'medium') return 5;
        if (d.size == 'large') return 10;
        if (d.size == 'academic') return 10;
      }

      var projectNodes = nodeGroup.selectAll('.project').data(org.projects);
      projectNodes.enter().append('rect')
        .attr('class', 'project')
        .attr('x', function(d) { return d.x - 7; })
        .attr('y', function(d) { return d.y; })
        .attr('width', function(d) { return 14; })
        .attr('height', function(d) { return 6; })
        .attr('r', 0)
        .style('fill', function(d) { return tsb.config.themes.current.budgetAreaColor[d.budgetAreaCode]; })
        .style('stroke', 'none');

      projectNodes
        .transition().duration(1000)
        .attr('x', function(d) { return d.x - 7; })
        .style('fill', function(d) { return tsb.config.themes.current.budgetAreaColor[d.budgetAreaCode]; })

      projectNodes.exit().transition().duration(1000).style('opacity', 0).remove()

      //COLLABORATORS

      var collaborators = _.filter(_.uniq(_.flatten(_.pluck(org.projects, 'participants'))), function(p) { return p != org; });
      collaborators.forEach(function(collaborator, collaboratorIndex) {
        collaborator.x = w/2 + (collaboratorIndex - collaborators.length/2) * 40;
        collaborator.y = h * 0.4;
      });

      var collaboratorNodes = nodeGroup.selectAll('.collaborator').data(collaborators);
      var g = collaboratorNodes.enter().append('g')
        .attr('class', 'collaborator')
        .attr('transform', function(d) { return 'translate(' + (d.x) + ',' + (d.y) + ')'; })
      g.append('circle').attr('class', 'collaboratorCircle')
      g.append('circle').attr('class', 'collaboratorCircleUni')

      collaboratorNodes.exit().remove()

      collaboratorNodes
        .attr('transform', function(d) { return 'translate(' + (d.x) + ',' + (d.y) + ')'; });

      var collaboratorCircle = collaboratorNodes.select('circle.collaboratorCircle');
      collaboratorCircle
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 0)
        .style('stroke', '#333')
        .style('fill', '#FFF')
        .transition()
        .delay(function(d,i) {
          return i * 30;
        })
        .attr('r', participantSizeToRadius);

      var collaboratorCircleUni = collaboratorNodes.select('circle.collaboratorCircleUni');
      collaboratorCircleUni
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 0)
        .style('stroke', 'rgba(30, 30, 30, 0.4)')
        .style('fill', 'transparent')
        .transition()
        .delay(function(d,i) {
          return i * 30;
        })
        .attr('r', function(d) {
          if (d.size != 'academic') return 0;
          return 3 + participantSizeToRadius(d);
        });

      var collabolatorProjects = collaboratorNodes.selectAll('.collaboratorProject')
        .data(function(d) {
          return d.projects;
        })
      collabolatorProjects.exit().transition().duration(1000).style('opacity', 0).remove()
      collabolatorProjects.enter().append('rect')
        .attr('class', 'collaboratorProject')
        .attr('x', function(d, i) { return -7; })
        .attr('y', function(d, i) { return -25 -i * 8 + 6; })
        .attr('width', function(d) { return 14; })
        .attr('height', function(d) { return 0; })
        .attr('r', 0)
        .style('fill', function(d) { return tsb.config.themes.current.budgetAreaColor[d.budgetAreaCode]; })
        .style('stroke', 'none')
        .transition()
        .delay(function(d, i) { return 500 + i * 50})
        .attr('y', function(d, i) { return -25 - i * 8; })
        .attr('height', function(d) { return 6; })

      collaboratorNodes.on('mouseover', function(d) {
        if (d3.event.target.nodeName == 'circle') {
          tooltip.style('display', 'block')
          tooltipText.text(d.label);
        }
      })

      collaboratorNodes.on('mouseout', function() {
        tooltip.style('display', 'none');
      })

      collaboratorNodes.on('click', function(d) {
        //console.log(d.x);
        var targetX = w/2;
        var targetY = h*0.9;
        var dx = targetX - d.x;
        var dy = targetY - d.y;
        rootGroup
          .transition()
          .duration(1000)
          .attr('transform', function(d) { return 'translate(' + (dx) + ',' + (dy) + ')'; })
          .each('end', function() {
            exploreOrganization(d);
            rootGroup
              .transition()
              .duration(1000)
              .style('opacity', 0).remove();
          })
      })

      //LINKS

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

      linkNodes.enter().append('path')
        .attr('class', 'link')
        .style('fill', 'none')
        .style('stroke', function(d) {
          return tsb.config.themes.current.budgetAreaColor[d.project.budgetAreaCode];
        })

      linkNodes
        .transition().duration(1000)
        .style('stroke', function(d) {
          return tsb.config.themes.current.budgetAreaColor[d.project.budgetAreaCode];
        })
        .attr('d', diagonal);

      linkNodes.exit().remove();

      tooltip.node().parentNode.appendChild(tooltip.node());
    }

    var startOrg = participants[0];
    for(var i=0; i<participants.length; i++) {
      if (participants[i].projects.length > 5) {
        if (i < 100) continue;
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
      .style('fill', '#000')
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
