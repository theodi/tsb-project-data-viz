var tsb = tsb || { viz : {} };

tsb.viz.collaborations = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.year = tsb.config.currentYear;
    this.years = d3.range(this.year-4, this.year+1);

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
      .style('opacity', 0)
      .text(tsb.config.text.collaborationsTitle.replace('YEAR', this.year))

    var yearsGroup = this.yearsGroup = svg.append('g')
      .attr('transform', 'translate(10, 40)');

    this.years.forEach(function(year, yearIndex) {
      var yearBtn = yearsGroup.append('text')
        .attr('x', tsb.config.themes.current.titleFontSize * 2 * yearIndex)
        .attr('y', 0)
        .style('fill', '#333')
        .style('font-size', tsb.config.themes.current.titleFontSize*0.8 + 'px')
        .style('font-weight', '300')
        .text(year)
        .style('opacity', year == this.year ? 1 : 0.5);

      yearBtn.on('mouseover', function() {
        yearBtn.style('opacity', 1);
      }.bind(this))
      yearBtn.on('mouseleave', function() {
        yearBtn.style('opacity', year == this.year ? 1 : 0.5);
      }.bind(this))
      yearBtn.on('click', function() {
        yearsGroup.selectAll('text').style('opacity', 0.5);
        yearBtn.style('opacity', 1);
        this.year = year;
        this.loadData();
      }.bind(this))
    }.bind(this))

    this.legendLabels = [{label:'SME', size:5, outerSize:0}, {label:'Large', size:10, outerSize:0}, {label:'Academic', size:10, outerSize:13}]
    this.legendGroup = svg.append('g').attr('transform', 'translate(100, 400)');;

    this.legendGroup.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('fill', '#333')
      .style('font-weight', 'bold')
      .style('font-size', tsb.config.themes.current.titleFontSize/3 + 'px')
      .text('Organization size')

    var legendLabelIcons = this.legendGroup.selectAll('.legendLabel')
      .data(this.legendLabels)
      .enter();

    legendLabelIcons.append('circle')
      .attr('cx', function(d, i) { return 5 + i * 100; })
      .attr('cy', 30)
      .attr('r', 0)
      .style('stroke', '#333')
      .style('fill', '#FFF')
      .transition()
      .attr('r', function(d) { return d.size; })

    legendLabelIcons.append('circle')
      .attr('cx', function(d, i) { return 5 + i * 100; })
      .attr('cy', 30)
      .attr('r', 0)
      .style('stroke', 'rgba(30, 30, 30, 0.4)')
      .style('fill', 'transparent')
      .transition()
      .attr('r', function(d) { return d.outerSize; });

    legendLabelIcons.append('text')
      .text(function(d) { return d.label; })
      .attr('x', function(d, i) { return 5 + i * 100 + d.size*2; })
      .attr('y', 35)
      .style('fill', '#333')
      .style('font-size', tsb.config.themes.current.titleFontSize/3 + 'px')

    this.addToolTip();
    this.addBackBtn();
    this.resize(this.w, this.h);
  },
  addBackBtn: function() {
    this.backBtn = this.svg.append('g')
      .style('opacity', 0)

    this.backBtnHit = this.backBtn.append('rect')
      .attr('width', '1.8em')
      .attr('height', '1.8em')
      .style('fill', 'rgba(0,0,0,0.0)')
      .attr('rx', '5px')
      .attr('ry', '5px')
      .attr('stroke', 'rgba(0,0,0,0.1)')

    this.backBtnArrow = this.backBtn.append('text')
      .attr('x', '0.27em')
      .attr('y', '0.75em')
      .style('fill', '#AAA')
      .style('font-size', '200%')
      .style('font-weight', '300')
      .text('«')

    this.backBtn.on('mouseover', function() {
      this.backBtnArrow.style('fill', '#FFF');
      this.backBtnHit.style('fill', '#000');
    }.bind(this));

    this.backBtn.on('mouseleave', function() {
      this.backBtnArrow.style('fill', '#AAA');
      this.backBtnHit.style('fill', 'rgba(0,0,0,0)');
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

    this.backBtn.attr('transform', 'translate('+(leftMargin-titleFontSize*0.75)+','+titleFontSize*0.6+')');

    var yearsX = leftMargin + maxWidth - this.years.length * titleFontSize * 2;
    var yearsY = titleFontSize + containerMargin;

    this.yearsGroup.attr('transform', 'translate('+yearsX+','+yearsY+')');
    this.legendGroup.attr('transform', 'translate('+(leftMargin+containerMargin)+','+(this.h - 80)+')');
  },
  loadData: function() {
    if (this.rootGroup) {
      this.rootGroup
        .transition()
        .duration(500)
        .style('opacity', 0).remove();
    }
    tsb.viz.preloader.start();
    tsb.state.dataSource.getProjectsAndParticipantsForYear(this.year).then(function(data) {
      tsb.viz.preloader.stop().then(function() {
        this.title.transition()
          .style('opacity', 1)
        this.backBtn.transition()
          .style('opacity', 1)

        var participants = [];
        var participantsMap = {};
        var projects = [];
        var projectsMap = {};

        data.rows.forEach(function(row) {
          var project = projectsMap[row.project];
          if (!project) {
            project = {
              id: row.project,
              label: row.projectLabel,
              priorityArea: row.priorityArea,
              priorityAreaCode: tsb.common.extractPriorityAreaCode(row.priorityArea),
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

        var projectsByPriorityAreaCode = _.groupBy(projects, prop('priorityAreaCode'));
        var priorityAreaCodes = _.keys(projectsByPriorityAreaCode);
        var participantsByPriorityAreaCode = {};

        priorityAreaCodes.forEach(function(priorityAreaCode) {
          var projects = projectsByPriorityAreaCode[priorityAreaCode];
          var participants = _.uniq(_.flatten(_.pluck(projects, 'participants')));
          participantsByPriorityAreaCode[priorityAreaCode] = participants;
        })

        this.buildViz(participants, projects, participantsByPriorityAreaCode, projectsByPriorityAreaCode);
      }.bind(this));
    }.bind(this));
  },
  buildViz: function(participants, projects, participantsByPriorityAreaCode, projectsByPriorityAreaCode) {
    var svg = this.svg;
    var w = this.w;
    var h = this.h;
    var projectDistance = 50;
    var collaboratorDistance = 150;
    var tooltip = this.tooltip;
    var tooltipText = this.tooltipText;
    var tooltipBg = this.tooltipBg;
    var self = this;

    function exploreOrganization(org) {
      var rootGroup = self.rootGroup = svg.append('g');
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
        .text(org.label + ' (more ⨠)')
        .style('opacity', 0)

      rootNodeLabel
        .transition()
        .delay(500)
        .duration(1000)
        .style('opacity', 1)

      rootNodeLabel.on('mouseover', function(d) {
        rootNodeLabel.transition().style('opacity', 0.5)
      });

      rootNodeLabel.on('mouseleave', function(d) {
        rootNodeLabel.transition().style('opacity', 1)
      })

      rootNodeLabel.on('click', function(d) {
        window.open(d.id.replace('/id/', '/doc/'));
      })

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
        .style('fill', function(d) { return tsb.config.themes.current.priorityAreaColor[d.priorityAreaCode]; })
        .style('stroke', 'none');

      projectNodes
        .transition().duration(1000)
        .attr('x', function(d) { return d.x - 7; })
        .style('fill', function(d) { return tsb.config.themes.current.priorityAreaColor[d.priorityAreaCode]; })

      projectNodes.exit().transition().duration(1000).style('opacity', 0).remove()

      projectNodes.on('mouseover', function(d) {
        tooltip.style('display', 'block')
        var priorityAreaName = tsb.config.priorityAreaLabels[d.priorityAreaCode];
        var priorityAreaColor = tsb.config.themes.current.priorityAreaColor[d.priorityAreaCode];
        tooltipBg.style('fill', priorityAreaColor);
        self.setTooltipText(priorityAreaName + ': ' + d.label);
      })

      projectNodes.on('mouseout', function() {
        tooltip.style('display', 'none');
      })

      projectNodes.on('click', function(d) {
        window.open(d.id.replace('/id/', '/doc/'));
      })

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
        .style('fill', function(d) { return tsb.config.themes.current.priorityAreaColor[d.priorityAreaCode]; })
        .style('opacity', function(d, i) { return (i < 10) ? 1 : Math.max(0, 1 - (i - 10)/8) })
        .style('stroke', 'none')
        .transition()
        .delay(function(d, i) { return 500 + i * 50})
        .attr('y', function(d, i) { return -25 - i * 8; })
        .attr('height', function(d) { return 6; })

      collabolatorProjects.on('mouseover', function(d) {
        tooltip.style('display', 'block')
        var priorityAreaName = tsb.config.priorityAreaLabels[d.priorityAreaCode];
        var priorityAreaColor = tsb.config.themes.current.priorityAreaColor[d.priorityAreaCode];
        tooltipBg.style('fill', priorityAreaColor);
        self.setTooltipText(priorityAreaName + ': ' + d.label);
      })

      collabolatorProjects.on('mouseout', function() {
        tooltip.style('display', 'none');
      })


      collaboratorNodes.on('mouseover', function(d) {
        if (d3.event.target.nodeName == 'circle') {
          tooltip.style('display', 'block')
          tooltipBg.style('fill', '#000000');
          self.setTooltipText(d.label);
        }
      })

      collaboratorNodes.on('mouseout', function() {
        tooltip.style('display', 'none');
      })

      collaboratorNodes.on('click', function(d) {
        var collaboratorGroup = d3.event.target.parentNode;
        var numProjects = d3.select(collaboratorGroup).selectAll('.collaboratorProject').size();
        collabolatorProjects.transition()
          .duration(1000)
          .attr('x', function(pd, pi) {
            if (this.parentNode == collaboratorGroup) {
              return (pi - numProjects/2) * 40 - 7;
            }
            else return d3.select(this).attr('x');
          })
          .style('opacity', function(pd, pi) {
            if (this.parentNode == collaboratorGroup) {
              return 1;
            }
            else return 0;
          })
          .attr('y', -h*0.2)
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

        //collaborator.projects.forEach(function(project, projectIndex) {
        //  project.x = w/2 + (projectIndex - collaborator.projects.length/2) * 40;
        //  project.y = h*0.7;
        //})
      }.bind(this));

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
          return tsb.config.themes.current.priorityAreaColor[d.project.priorityAreaCode];
        })
        .style('opacity', 0)

      linkNodes
        .transition().duration(1000)
        .style('stroke', function(d) {
          return tsb.config.themes.current.priorityAreaColor[d.project.priorityAreaCode];
        })
        .attr('d', diagonal)
        .style('opacity', 1);

      linkNodes.exit().remove();

      tooltip.node().parentNode.appendChild(tooltip.node());
    }

    var randomParticipants = _.shuffle(participants);
    var startOrg = [0];
    for(var i=0; i<randomParticipants.length; i++) {
      var numCollaborators = 0;
      randomParticipants[i].projects.forEach(function(project) {
        numCollaborators += project.participants.length;
      })
      if (numCollaborators > 10) {
        startOrg = randomParticipants[i];
        break;
      }
    }
    exploreOrganization(startOrg);
  },
  setTooltipText: function(text) {
    var text2 = '';
    var text3 = '';
    this.tooltipText.text(text);
    this.tooltipText2.text(text2);
    var iterations = 0;
    var bgWidth = parseInt(this.tooltipBg.attr('width'));
    while (this.tooltipText[0][0].getBoundingClientRect().width > bgWidth - 10) {
      if (++iterations > 50) break;
      var spaceIndex = text.lastIndexOf(' ');
      if (spaceIndex > -1) {
        text2 = text.substr(spaceIndex+1) + ' ' + text2;
        text = text.substr(0, spaceIndex);
        this.tooltipText.text(text);
        this.tooltipText2.text(text2);
      }
      else {
        break;
      }
    }
    iterations = 0;
    while (this.tooltipText2[0][0].getBoundingClientRect().width > bgWidth - 10) {
      if (++iterations > 50) break;
      var spaceIndex = text.lastIndexOf(' ');
      if (spaceIndex > -1) {
        text3 = text2.substr(spaceIndex+1) + ' ' + text3;
        text2 = text2.substr(0, spaceIndex);
        this.tooltipText2.text(text2);
      }
      else {
        break;
      }
    }
    if (text3.length > 0) {
      text2 = text2 + ' ...';
      this.tooltipText2.text(text2);
    }
    if (text2.length > 0) {
      this.tooltipBg.attr('height', '2.5em')
    }
    else {
      this.tooltipBg.attr('height', '1.5em')
    }
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

    this.tooltipText2 = this.tooltip.append('text')
      .text('BLA BLA 2')
      .attr('dx', '0.5em')
      .attr('dy', '3em')
      .style('fill', '#FFF')
      .style('font-size', '12px')

    this.svg.on('mousemove', function(e) {
      this.tooltip.attr('transform', function(d) { return 'translate(' + (d3.event.x + 10) + ',' + (d3.event.y-20) + ')'; });
    }.bind(this))
  }
}
