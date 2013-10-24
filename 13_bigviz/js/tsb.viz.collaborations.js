var tsb = tsb || { viz : {} };

tsb.viz.collaborations = {
  init: function(svg, w, h) {
    console.log('collab', tsb.config.themes.current.collaborationsBgColor)
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.institutionSize = 'academic';
    this.institutionTopCount = 8;
    this.institutionsOnlyLocal = false;

    svg
    .append('rect')
    .attr('class', 'bg')
    .attr('width', tsb.state.w).attr('height', tsb.state.h)
    .attr('fill', tsb.config.themes.current.collaborationsBgColor);

    this.backBtn = svg.append('g')

    this.backBtnHit = this.backBtn.append('rect')
      .attr('x', '0.3em')
      .attr('y', '2.3em')
      .attr('width', '2em')
      .attr('height', '2em')
      .style('fill', 'none')
      .attr('rx', '5px')
      .attr('ry', '5px')

    this.backBtnArrow = this.backBtn.append('text')
      .attr('x', this.w * 0.01)
      .attr('y', '2em')
      .style('fill', '#AAA')
      .style('font-size', '200%')
      .style('font-weight', '300')
      .text('«')

    this.title = svg
      .append('text')
      .attr('x', this.w * 0.03)
      .attr('y', '2em')
      .style('fill', '#333')
      .style('font-size', '200%')
      .style('font-weight', '300')
      .text('University collaborations per TSB priority area')

    this.backBtn.on('mouseover', function() {
      this.backBtnArrow.style('fill', '#000');
    }.bind(this));

    this.backBtn.on('mouseleave', function() {
      this.backBtnArrow.style('fill', '#AAA');
    }.bind(this));

    this.backBtn.on('click', function() {
      document.location.href = "#introopened";
    }.bind(this));

    this.initDebugLayout();

    this.loadData();
  },
  resize: function(w, h) {
    this.w = w;
    this.h = h;
    this.updateDebugLayout();
  },
  initDebugLayout: function() {
    this.debugContainer = this.svg.append('rect')
      .attr('class', 'debug-bg')
      .style('fill', 'rgba(255,0,0,0.2)')
    this.updateDebugLayout();
  },
  updateDebugLayout: function() {
    var targetW = 0;
    //tab stops based on http://getbootstrap.com/css/#grid
    if (this.w >= 1200) targetW = 1170;
    else if (this.w >= 992) targetW = 970;
    else if (this.w >= 768) targetW = 750;
    else targetW = this.w;
    this.svg.select('rect.debug-bg')
      .attr('x', (this.w - targetW)/2)
      .attr('y', 0)
      .attr('width', targetW)
      .attr('height', this.h)
  },
  loadData: function() {
    var margin = 80;
    var w = this.w;
    var h = this.h;
    var self = this;
    var rectGrid = d3.layout.grid()
      .cols(4)
      .bands()
      .size([w-2*margin, h-2*margin])
      .padding([0, 0.4]);

    var lineFunction = d3.svg.line()
                             .x(function(d) { return d.x; })
                             .y(function(d) { return d.y; })
                             .interpolate("linear");

    tsb.state.dataSource.getInstitutions(self.institutionSize).then(function(data) {
      data.rows.forEach(function(row) {
        row.numProjects = Number(row.numProjects);
        row.id = row.org.substr(row.org.lastIndexOf('/')+1)
      });

      data.rows.sort(function(a, b) {
        return b.numProjects - a.numProjects;
      })

      var topBest = tsb.common.inital(data.rows, self.institutionTopCount);

      var maxNumProjects = tsb.common.max(topBest, 'numProjects');

      var sizeScale = d3.scale.linear().domain([0, maxNumProjects]).range([5, 10]);

      var point = self.svg.selectAll(".point")
        .data(rectGrid(topBest));
        point.enter()
        .append('g')
        .attr('id', function(d) { return 'g_' + d.id; })
        .attr("transform", function(d) {
          return "translate(" + (margin + d.x + rectGrid.nodeSize()[0]/2) + "," + (margin + d.y + rectGrid.nodeSize()[1]/2) + ")";
        })

      point.append("path")
        .attr("class", "point")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("fill", "none")
        .attr("d", function(d) { return lineFunction(self.superPoints(0, 4)); })
        .transition().duration(1000)
        .delay(function(d, i) { return i * 100; })
        .attr("d", function(d) { return lineFunction(self.superPoints(sizeScale(d.numProjects), 4)); })

      var textTop = 110;
      if (self.institutionTopCount == 20) textTop = 90;

      point.append("text")
        .attr("class", "pointLabel")
        .attr('y', textTop)
        .attr('text-anchor', 'middle')
        .attr('font-size', '80%')
        .text(function(d) { return d.orgLabel })
        .attr('fill', 'black')

      topBest.forEach(self.pullCollaborators);
    });
  },
  pullCollaborators: function(academicOrg, academicOrgIndex) {
    var g = d3.select('#g_' + academicOrg.id);
    var r = 60;
    if (this.institutionTopCount == 20) r = 50;
    var minr = 20;
    var sizes = {
      large: 4,
      medium: 3,
      small: 2,
      micro: 1,
      academic: 2
    };
    var self = this;
    var numAreas = 9;
    var angleStep = Math.PI * 2 / numAreas;
    var radiusStep = (r - minr)/3;
    tsb.state.dataSource.getOrganizationCollaborators(academicOrg.org).then(function(data) {
      randomPoints = d3.range(data.rows.length).map(function() {
        while(true) {
          x = Math.random() * 2 * r - r
          y = Math.random() * 2 * r - r
          len = Math.sqrt(x*x + y*y)
          if (len < r && len > minr) {
            return {x:x, y:y};
          }
        }
      })
      data.rows.forEach(function(collaboratorInfo, collaboratorIndex) {
        if (collaboratorInfo.collaborator == academicOrg.org) {
          return;
        }
        var isLocal = true;
        if (self.institutionsOnlyLocal && collaboratorInfo.collaboratorRegion != academicOrg.orgRegion) {
          isLocal = false;
        }

        var budgetAreaCode = tsb.common.extractBudgetAreaCode(collaboratorInfo.budgetArea);
        var areaColor = tsb.config.themes.current.budgetAreaColor[budgetAreaCode];
        var areaIndex = tsb.config.budgetAreas.indexOf(budgetAreaCode);
        var sizeLabel = collaboratorInfo.collaboratorSizeLabel;
        var size = sizes[sizeLabel];
        var angle = tsb.common.randomInRange(angleStep * areaIndex, angleStep * (areaIndex + 1))
        var radius = tsb.common.randomInRange(minr + radiusStep * (size - 1), minr + radiusStep * (size));
        if (sizeLabel=='academic') radius = minr * 0.8;

        var x = radius * Math.cos(angle);
        var y = radius * Math.sin(angle);

        circle = g.append('circle')
          .attr('r', size)
          .style('stroke', areaColor)
          .style('fill', (sizeLabel=='academic') ? areaColor : 'none')
          .style('opacity', isLocal ? 0.75 : 0.15)
          //.attr('cx', randomPoints[collaboratorIndex].x)
          //.attr('cy', randomPoints[collaboratorIndex].y)
          .attr('cx', x)
          .attr('cy', y);
      });

      //if (uniqueAreasOnce) {
      //  uniqueAreasOnce = false;
      //  for(var areaName in colorMap) {
      //    var color = colorMap[areaName];
      //    svg.append('text')
      //      .text(areaName)
      //      .attr('x', 50 + color.index * 100)
      //      .attr('y', 30)
      //      .style('fill', color.color)
      //  }
      //}
    })
  },
  onInstitutionSizeChange: function(e) {
    this.institutionSize = e.target.options[e.target.selectedIndex].value;
    this.init();
  },
  onInstitutionTopChange: function(e) {
    this.institutionTopCount = e.target.options[e.target.selectedIndex].value;
    this.init();
  },
  onInstitutionLocalChange: function(e) {
    var reach = e.target.options[e.target.selectedIndex].value;
    this.institutionsOnlyLocal = reach == 'local';
    this.init();
  },
  superPoints: function(r, p) {
    var npoints = 64;
    return d3.range(npoints).map(function(i) {
      var angle = Math.PI*2*i/(npoints-1);
      var xsign = 1;
      var ysign = 1;
      if (angle > 3 * Math.PI/2) {
        angle = 2 * Math.PI - angle;
        xsign = 1;
        ysign = -1;
      }
      else if (angle > 2 * Math.PI/2) {
        angle = angle - Math.PI;
        xsign = -1;
        ysign = -1;
      }
      else if (angle > Math.PI/2) {
        angle = Math.PI - angle;
        xsign = -1;
        ysign = 1;
      }
      return {
        x: xsign * r * Math.pow(Math.cos(angle), 2/p),
        y: ysign * r * Math.pow(Math.sin(angle), 2/p)
      }
    })
  }
};