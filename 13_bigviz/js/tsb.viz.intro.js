var tsb = tsb || { viz : {} };

tsb.viz.intro = {
  canvas: null,
  init: function(svg, w, h, staticMode) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.staticMode = staticMode;
    this.year = (new Date().getFullYear());
    this.duration = 60000;
    this.minimizeDelay = 3000;
    this.minimizeTime = 2000;
    this.titleScale = 1;
    this.titleX = 0;
    this.titleY = 0;
    this.eatenLetters = -1;

    this.numClipPaths = 3;
    this.subVizBtnSize = 270;
    this.subVizBtnMargin = 160;

    tsb.common.log('tsb.intro.init');

    this.bg = svg
    .append('rect')
    .attr('class', 'bg')
    //.attr('width', this.w).attr('height', this.h)
    //.attr('fill', 'red');

    if (!this.canvas) {
      this.canvas = document.getElementById('home-viz-canvas');
      this.canvas.width = w;
      this.canvas.height = h;
      this.ctx = this.canvas.getContext('2d');
      this.ctx.fillStyle = tsb.config.themes.current.introBgColor;
      this.ctx.fillRect(0, 0, w, h);
    }
    this.loadData();
  },
  close: function() {
    if (this.updateLabelsAnim) {
      clearInterval(this.updateLabelsAnim);
     this.updateLabelsAnim = null;
    }
  },
  loadData: function() {
    tsb.common.log('tsb.intro.loading...');
    this.numProjects = 0;
    this.displayedNumProjects = 0;
    var svg = this.svg;
    var w = this.w;
    var h = this.h;
    tsb.state.dataSource.getProjectsForYear(this.year).then(function(projects) {
      tsb.viz.preloader.stop().then(function() {
        tsb.common.log('tsb.intro.loaded', projects.rows.length);

        this.createProjects(_.shuffle(projects.rows));
        var alreadyOpened = document.location.hash == '#introopened';
        this.addLabels(alreadyOpened);
        if (!this.staticMode) {
          this.addVizButtons();
          if (document.location.hash != '#introopened') {
            this.showVizButtons();
          }
        }
        if (alreadyOpened) {
          this.minimizeTime = 0;
          this.minimizeDelay = 0;
          this.eatenLetters = 50;
          this.showVizButtons();
        }
      }.bind(this));
    }.bind(this));
  },
  createProjects: function(projects) {
    var pw = 5;
    var ph = 20;
    var spacingX = 2;
    var spacingY = 10;
    var marginX = 8;
    var marginY = 5;

    var projectsPerRow = Math.floor(this.w - 2 * marginX) / (pw + spacingX);
    var numAvailableRows = Math.floor((this.h - 2 * marginY + spacingY) / (ph + spacingY));
    var maxNumProjects = numAvailableRows * projectsPerRow;
    var numFullRows = Math.floor(maxNumProjects / projectsPerRow);

    projects.forEach(function(project, projectIndex) {
      var distributedIndex = Math.floor(projectIndex * maxNumProjects / projects.length);
      var row = Math.floor(distributedIndex / projectsPerRow);
      var px = marginX + (distributedIndex % projectsPerRow) * (pw + spacingX);
      var py = marginY + row * (ph + spacingY);
      if (row > numFullRows) ph = 0; //don't draw invisible projects
      var priorityAreaCode = tsb.common.extractPriorityAreaCode(project.priorityArea);
      var color = tsb.config.themes.current.priorityAreaColor[priorityAreaCode];
      this.makeRect(px, py, pw, ph, color, 'project', distributedIndex);
    }.bind(this));
    this.drawRects();
  },
  rectangles: [],
  drawRects: function() {
    this.rectangles.forEach(function(rect) {
      if (rect.height == rect.prevHeight) return;
      rect.prevHeight = rect.height;
      this.ctx.fillStyle = rect.color;
      this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }.bind(this));
  },
  makeRect: function(x, y, w, h, color, className, projectIndex) {
    var rect = {
      x: x,
      y: y+h,
      width: w,
      height: this.staticMode ? h : 0,
      color: d3.rgb(color).darker(2).toString(),
      opacity: tsb.config.themes.current.priorityAreaColorAlpha
    };
    this.rectangles.push(rect);
    var projectRect = d3.select(rect);

    function interpolateProperty(propertyName, targetValue) {
      return function() {
          var i = d3.interpolateNumber(this[propertyName], targetValue);
          return function(t) { this[propertyName] = i(t); };
      };
    }

    if (this.staticMode) {
      this.numProjects++;
    }
    else {
      projectRect
        .transition().delay(Math.random()*this.duration)
        .tween('animy', interpolateProperty('y', y))
        .tween('animh', interpolateProperty('height', h))
        .each('end', this.onProjectAnimComplete.bind(this));
    }
  },
  makeRectOld: function(x, y, w, h, color, className, projectIndex) {
    var projectRect = this.svg
      .append('g')
      .append('rect')
      .attr('class', className)
      .attr('x', x).attr('y', y+h)
      .attr('width', w).attr('height', this.staticMode ? h : 0)
      .attr('fill', color)
      .style('opacity', tsb.config.themes.current.priorityAreaColorAlpha);

    if (this.staticMode) {
      this.numProjects++;
    }
    else {
      projectRect
        .transition().delay(Math.random()*this.duration)
        .attr('y', y)
        .attr('height', h)
        .each('end', this.onProjectAnimComplete.bind(this));
    }
  },
  onProjectAnimComplete: function() {
    if (!this.staticMode) {
      this.numProjects++;
      //this.updateLabels();
    }
  },
  addLabels: function(alreadyOpened) {
    var labelGroup = this.labelGroup = this.svg.append('g');

    this.title = labelGroup.append('text')
      .attr('dx', 0)
      .attr('dy', 0)
      .attr('fill', tsb.config.themes.current.introTextColor)
      .style('font-size', tsb.config.themes.current.titleFontSize * 2 + 'px')
      .style('font-weight', tsb.config.themes.current.introTextFontWeight)

    this.title2 = labelGroup.append('text')
      .attr('dx', 0)
      .attr('dy', 0)
      .attr('fill', tsb.config.themes.current.introTextColor)
      .style('font-size', tsb.config.themes.current.titleFontSize * 2 + 'px')
      .style('font-weight', tsb.config.themes.current.introTextFontWeight)

    this.projectCount = labelGroup.append('text')
      .attr('dx', 0)
      .attr('dy', tsb.config.themes.current.titleFontSize*2.5)
      .attr('fill', tsb.config.themes.current.introTextColor)
      .style('font-size', tsb.config.themes.current.titleFontSize * 2 + 'px')
      .style('font-weight', tsb.config.themes.current.introTextFontWeight);

    this.projectCount2 = labelGroup.append('text')
      .attr('dx', 0)
      .attr('dy', tsb.config.themes.current.titleFontSize*2.5)
      .attr('fill', tsb.config.themes.current.introTextColor)
      .style('font-size', tsb.config.themes.current.titleFontSize * 2 + 'px')
      .style('font-weight', tsb.config.themes.current.introTextFontWeight);

    this.subTitle = labelGroup.append('text')
      .attr('dx', 0)
      .attr('dy', tsb.config.themes.current.titleFontSize*2.5)
      .attr('fill', tsb.config.themes.current.introSubTitleTextColor)
      .style('font-size', tsb.config.themes.current.titleFontSize * 2 + 'px')
      .style('font-weight', tsb.config.themes.current.introTextFontWeight)
      .style('opacity', 0)
      .text('Explore more about:');

    this.subTitle2 = labelGroup.append('text')
      .attr('dx', 0)
      .attr('dy', tsb.config.themes.current.titleFontSize*2.5)
      .attr('fill', tsb.config.themes.current.introSubTitleTextColor)
      .style('font-size', tsb.config.themes.current.titleFontSize * 2 + 'px')
      .style('font-weight', tsb.config.themes.current.introTextFontWeight)
      .style('opacity', 0)
      .text('Explore more about:');

    labelGroup
      .style('opacity', (this.staticMode || alreadyOpened) ? 1 : 0)

    if (!this.staticMode) {
      labelGroup
        .transition().duration(2000)
        .style('opacity', 1);
    }

    if (this.updateLabelsAnim) {
      clearInterval(this.updateLabelsAnim);
    }
    this.updateLabelsAnim = setInterval(this.updateLabels.bind(this), 1/30);

    this.updateLabels();
    this.resize(this.w, this.h); //force layout update
  },
  updateLabels: function() {
    var titleText = tsb.config.text.introTitle.replace('YEAR', this.year);
    var projectCountText = tsb.config.text.introTitle2.replace('NUMPROJECTS', this.numProjects);

    if (this.eatenLetters >= 0) {
      this.eatenLetters += 0.5;
      var cut = Math.floor(this.eatenLetters);
      titleText += projectCountText.substr(0, cut);
      projectCountText = projectCountText.substr(cut);
    }

    this.title.text(titleText);
    this.title2.text(titleText);
    this.projectCount.text(projectCountText);
    this.projectCount2.text(projectCountText);

    this.drawRects();
  },
  resize: function(w, h) {
    this.w = w;
    this.h = h;

    var maxWidth = this.maxWidth = tsb.common.getMaxWidth(this.w);
    var leftMargin = this.leftMargin = (this.w - maxWidth)/2;
    var containerMargin = tsb.config.themes.current.containerMargin;
    var titleFontSize = tsb.config.themes.current.titleFontSize;

    if (this.titleScale == 1) {
      this.titleX = leftMargin + containerMargin;
      this.titleY = this.h/2 - tsb.config.themes.current.titleFontSize * 1.5;
    }
    else {
      this.titleX = leftMargin + containerMargin;
      this.titleY = titleFontSize + containerMargin;
    }

    this.bg
      .attr('width', this.w);

    if (this.labelGroup) {
      this.labelGroup
        .attr('transform', 'translate('+(this.titleX)+','+(this.titleY)+') scale('+this.titleScale+','+this.titleScale+')');
    }

    var margin = this.subVizBtnMargin;
    var spacing = (maxWidth - this.subVizBtnSize * this.numClipPaths) / (this.numClipPaths + 1);
    var marginTop = this.h/2 + this.subVizBtnSize/10;

    if (this.subVizButtons) {
      this.subVizButtons
        .attr('transform', function(d) {
          var x = leftMargin + d * spacing + d * this.subVizBtnSize + this.subVizBtnSize/2 + spacing;
          return 'translate('+x+','+marginTop+')';
        }.bind(this))
    }
  },
  addVizButtons: function() {
    this.makeClipPaths();
    this.resize(this.w, this.h);
  },
  makeClipPaths: function() {
    var maxWidth = this.maxWidth = tsb.common.getMaxWidth(this.w);
    var leftMargin = this.leftMargin = (this.w - maxWidth)/2;
    var containerMargin = tsb.config.themes.current.containerMargin;
    var titleFontSize = tsb.config.themes.current.titleFontSize;

    var subVizButtons = this.subVizButtons = this.svg.selectAll('circle')
      .data(d3.range(this.numClipPaths))
      .enter()
      .append('g')

    subVizButtons
      .append('clipPath')
        .attr('id', function(d) { return 'clipPath_' + d; })
      .append('circle')
        .attr('class', 'cookieCutter')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 0)
        .attr('fill', 'rgba(255,255,0,1)');

    subVizButtons
       .attr('clip-path', function(d) { return 'url(#clipPath_'+d+')'});

    subVizButtons
      .append('rect')
        .attr('x', -this.subVizBtnSize*0.6)
        .attr('y', -this.subVizBtnSize*0.6)
        .attr('width', this.subVizBtnSize*1.2)
        .attr('height', this.subVizBtnSize*1.2)
        .attr('fill', function(d) { return tsb.config.themes.current.introVizBtnBgColor; });

    this.makePriorityAreasBtn(d3.select(subVizButtons[0][0]))

    subVizButtons
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', tsb.config.themes.current.introVizBtnFontSize/2)
      .style('font-size', tsb.config.themes.current.introVizBtnFontSize + 'px')
      .attr('fill', function(d) { return tsb.config.themes.current.introVizBtnLabelColors[d]; })
      .text(function(d) { return tsb.config.introVizBtnLabels[d]; });

    subVizButtons.on('click', function(d) {
      document.location.href = tsb.config.introVizBtnLinks[d];
    })
  },
  makePriorityAreasBtn: function(parent) {
    var numYears = 12;
    var set1 = tsb.config.priorityAreas.map(function(priorityArea, priorityAreaIndex) {
      return d3.range(0, numYears).map(function(year) {
        return {
          priorityArea: priorityArea,
          x: year - 3,
          y: year/numYears * (3 * Math.random())};
      });
    })
    var set2 = tsb.config.priorityAreas.map(function(priorityArea, priorityAreaIndex) {
      return d3.range(0, numYears).map(function(year) {
        return {
          priorityArea: priorityArea,
          x: year - 5,
          y: year/numYears * (5 * Math.random())};
      });
    })
    var stack = d3.layout.stack().offset('wiggle');
    var layers1 = stack(set1);
    var layers2 = stack(set2);

    var x = d3.scale.linear()
      .domain([0, 5])
      .range([-this.subVizBtnSize/2, this.subVizBtnSize/2]);

    var y = d3.scale.linear()
      //.domain([0, 6])
      .domain([0, d3.max(layers2.concat(layers1), function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
      .range([-this.subVizBtnSize/2, this.subVizBtnSize/2]);

    var area = d3.svg.area()
      .x(function(d) { return x(d.x); })
      .y0(function(d) { return y(d.y0); })
      .y1(function(d) {  return y(d.y0 + d.y); });

    var layerPaths = parent.selectAll('path.stream').data(layers1)
    .enter().append('path')
      .attr('class', 'stream')
      .attr('d', area)
      .style('fill', function(d) {
        return tsb.config.themes.current.priorityAreaColor[d[0].priorityArea];
      })

    parent.on('mouseenter', function() {
      console.log('mouseenter')
      layerPaths.data(layers2)
        .transition()
        .duration(1000)
        .attr('d', area)
    })

    parent.on('mouseleave', function() {
      console.log('mouseleave')
      layerPaths.data(layers1)
        .transition()
        .duration(1000)
        .attr('d', area)
    })
  },
  showVizButtons: function() {
    var maxWidth = this.maxWidth = tsb.common.getMaxWidth(this.w);
    var leftMargin = this.leftMargin = (this.w - maxWidth)/2;
    var containerMargin = tsb.config.themes.current.containerMargin;
    var titleFontSize = tsb.config.themes.current.titleFontSize;

    this.labelGroup
      .transition()
      .delay(this.minimizeDelay)
      .duration(this.minimizeTime)
      .attr('transform', 'translate('+(leftMargin + containerMargin)+','+(titleFontSize + containerMargin)+') scale(0.5, 0.5)')
      .each('start', function() {
        if (this.eatenLetters == -1) {
          this.eatenLetters = 0; //start eating
        }
      }.bind(this))
      .each('end', function() {
        this.titleX = leftMargin + containerMargin;
        this.titleY = titleFontSize + containerMargin;
        this.titleScale = 0.5;
      }.bind(this));

      this.subTitle
        .transition()
        .delay(this.minimizeDelay + this.minimizeTime)
        .duration(this.minimizeTime)
        .style('opacity', 1)

      this.subTitle2
        .transition()
        .delay(this.minimizeDelay + this.minimizeTime)
        .duration(this.minimizeTime)
        .style('opacity', 1)

    this.subVizButtons.selectAll('.cookieCutter')
      .transition()
      .delay(function(d) { return this.minimizeDelay + this.minimizeTime*0.5 + d * this.minimizeTime*0.1}.bind(this))
      .duration(this.minimizeTime)
      .attr('r', this.subVizBtnSize/2)

    //TODO: show buttons here
  }
}
