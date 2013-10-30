var tsb = tsb || { viz : {} };

tsb.viz.collaborations = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.year = (new Date()).getFullYear();

    this.loadData();

    this.bg = svg
    .append('rect')
    .attr('class', 'bg')
    .attr('width', this.w).attr('height', this.h)
    .attr('fill', '#FFFFFF');

    this.title = svg
      .append('text')
      .style('fill', '#333')
      .style('font-size', tsb.config.themes.current.titleFontSize + 'px')
      .style('font-weight', tsb.config.themes.current.titleFontWeight)
      .text('Organization\'s projects and their collaborators in ' + this.year)

    this.addToolTip();
    this.addBackBtn();
    this.addPreloader();
    this.resize(this.w, this.h);
  },
  addPreloader: function() {
    var g = this.svg.append('g');
    var rw = 30;
    var rh = 30;
    function makeRect(parent, x, y, w, h, rotation, color) {
      var rg = parent.append('g');
      rg.attr('transform', 'translate('+(x)+','+y+') rotate('+rotation+') translate('+(w)+','+0+')');
      var r = rg.append('rect')
      .attr('x', -w/2)
      .attr('y', -h/2)
      .attr('width', w)
      .attr('height', h)
      .style('fill', color);
      return r;
    }

    var centerX = this.w/2;
    var centerY = this.h/2;

    var self = this;
    var bars = [];
    var colors = [
      tsb.config.odiColors[0],
      tsb.config.odiColors[3],
      tsb.config.odiColors[6],
      tsb.config.odiColors[9]
    ]
    bars[0] = makeRect(g, centerX, centerY, rw, rh*0, 0*0, colors[0]);
    bars[1] = makeRect(g, centerX, centerY, rw, rh*0, 1*0, colors[1]);
    bars[2] = makeRect(g, centerX, centerY, rw, rh*0, 2*0, colors[2]);
    bars[3] = makeRect(g, centerX, centerY, rw, rh*0, 3*0, colors[3]);


    makeRect(g, centerX, centerY+rh, rw, rh/5, 3*0, '#EEE');

    function anim(i) {
      bars[i]
        .attr('y', -rh/2)
        .style('fill', colors[i])
        .transition()
          .duration(400).attr('height', rh)
          .each('end', function() { anim((i+1)%4); })
        .transition().delay(400)
          .attr('height', rh*0)
          .attr('y', rh/2)
          .style('fill', colors[(i+1)%4])
    }

    anim(0);
  },
  addBackBtn: function() {
    this.backBtn = this.svg.append('g');

    this.backBtnHit = this.backBtn.append('rect')
      .attr('width', '2em')
      .attr('height', '2em')
      .style('fill', 'none')
      .attr('rx', '5px')
      .attr('ry', '5px')

    this.backBtnArrow = this.backBtn.append('text')
      .attr('x', '0.3em')
      .attr('y', '0.75em')
      .style('fill', '#AAA')
      .style('font-size', '200%')
      .style('font-weight', '300')
      .text('«')

    this.backBtn.on('mouseover', function() {
      this.backBtnArrow.style('fill', '#000');
    }.bind(this));

    this.backBtn.on('mouseleave', function() {
      this.backBtnArrow.style('fill', '#AAA');
    }.bind(this));

    this.backBtn.on('click', function() {
      document.location.href = "#introopened";
    }.bind(this));
  },
  resize: function(w, h) {
    this.w = w;
    this.h = h;

    var maxWidth = this.maxWidth = tsb.common.getMaxWidth(this.w);
    var leftMargin = this.leftMargin = (this.w - maxWidth)/2;
    var containerMargin = tsb.config.themes.current.containerMargin;
    var titleFontSize = tsb.config.themes.current.titleFontSize;

    this.bg
      .attr('width', this.w);

    this.title.attr('x', leftMargin + containerMargin);
    this.title.attr('y', titleFontSize + containerMargin);

    this.backBtn.attr('transform', 'translate('+(leftMargin-titleFontSize*0.5)+','+titleFontSize*0.6+')');
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

      rootNode.enter()
        .append('g')
        .attr('class', 'root');

      var rootNodeCircle = rootNode.append('circle')
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .attr('r', 0)
        .style('fill', 'white')
        .style('stroke', '#333')

      var rootNodeLabel = rootNode.append('text')
        .attr('x', function(d) { return d.x; })
        .attr('y', function(d) { return d.y + 30; })
        .attr('text-anchor', 'middle')
        .style('fill', 'black')
        .style('font-size', '12px')
        .text(org.label)

      rootNodeCircle
        .transition()
        .attr('r', participantSizeToRadius)

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
        collaborator.y = h * 0.5;
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
        .style('opacity', function(d, i) { return (i < 10) ? 1 : Math.max(0, 1 - (i - 10)/8) })
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
        tooltip.style('display', 'none');
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

    var randomParticipants = _.shuffle(participants);
    var startOrg = [0];
    for(var i=0; i<randomParticipants.length; i++) {
      if (randomParticipants[i].projects.length > 5) {
        //if (Math.random() > 0.9) console.log(participants[i].id);
        //if (participants[i].label.indexOf('Imperial') > -1) {
          startOrg = randomParticipants[i];
          break;
        }
      //}
    }
    exploreOrganization(startOrg);
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
