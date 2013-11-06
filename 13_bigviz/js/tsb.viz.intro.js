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
      .append('circle')
        .attr('class', 'cookieCutterBg')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', this.subVizBtnSize/2)
        //.style('fill', '#09c')
        .style('fill', 'rgba(0,0,0,0.001)')

    this.makePriorityAreasBtn(d3.select(subVizButtons[0][0]))
    this.makeRegionsButton(d3.select(subVizButtons[0][1]));
    this.makeCollaborationBtn(d3.select(subVizButtons[0][2]));

    subVizButtons
      .append('circle')
        .attr('class', 'cookieCutter')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 0)
        .style('fill', 'none')
        .style('stroke', '#09c')
        .style('stroke-width', 15)

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
          y: year/numYears * (3 * Math.random() - 0.2)};
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
      .domain([0, d3.max(layers1, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
      .range([-this.subVizBtnSize/3, this.subVizBtnSize/3]);

    var y2 = d3.scale.linear()
      .domain([0, d3.max(layers2, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
      .range([-this.subVizBtnSize/2, this.subVizBtnSize/2]);

    var area = d3.svg.area()
      .x(function(d) { return x(d.x); })
      .y0(function(d) { return y(d.y0); })
      .y1(function(d) {  return y(d.y0 + d.y); });

    var area2 = d3.svg.area()
      .x(function(d) { return x(d.x); })
      .y0(function(d) { return y2(d.y0); })
      .y1(function(d) {  return y2(d.y0 + d.y); });

    function areaColor(d) {
      return tsb.config.themes.current.priorityAreaColor[d[0].priorityArea];
    }

    function greyScaleAreaColor(d) {
      var rgb = areaColor(d);
      var c = d3.hsl(rgb);
      c.s = 0;
      c = c.brighter()
      return c.toString();
    }

    var layerPaths = parent.selectAll('path.stream').data(layers1)
    .enter().append('path')
      .attr('class', 'stream')
      .attr('d', area)
      .style('fill', areaColor)
      .style('opacity', 0)

    var layerPathsStroke = parent.selectAll('path.streamstroke').data(layers1)
      .enter().append('path')
      .attr('class', 'streamstroke')
      .attr('d', area)
      .style('fill', 'none')
      .style('stroke', 'rgba(255,255,255,0.25)')

    parent.on('mouseenter', function() {
      layerPaths.data(layers2)
        .transition()
        .duration(1000)
        .attr('d', area2)
        .style('opacity', 1)
      layerPathsStroke.data(layers2)
        .transition()
        .duration(1000)
        .attr('d', area2)
    })

    parent.on('mouseleave', function() {
      layerPaths.data(layers1)
        .transition()
        .duration(1000)
        .attr('d', area)
        .style('opacity', 0)
      layerPathsStroke.data(layers1)
        .transition()
        .duration(1000)
        .attr('d', area)
    })
  },
  makeRegionsButton: function(parent) {
    var mapGroup = parent.append('g');
    d3.xml(tsb.config.ukMapSVG, 'image/svg+xml', function(xml) {
      var svgDoc = document.importNode(xml.documentElement, true);
      var svgMap = svgDoc.querySelector('.map');
      mapGroup[0][0].appendChild(svgMap);
      var bb = svgMap.getBoundingClientRect();
      var mapWidth = (bb.right - bb.left);
      var mapHeight = (bb.bottom - bb.top);
      var mapScale = this.subVizBtnSize / mapWidth / 2.5;
      var mapScale2 = this.subVizBtnSize / mapWidth / 1.5;
      var mapX = -bb.left * mapScale;
      var mapY = -bb.top * mapScale;
      mapX += mapWidth/2 * mapScale * 0.8;
      mapY += -mapHeight/3 * mapScale;
      var mapX2 = -bb.left * mapScale2;
      var mapY2 = -bb.top * mapScale2;
      mapX2 += mapWidth/2 * mapScale2 * 0.8;
      mapY2 += -mapHeight/3 * mapScale2;
      var map = parent.select('.map');
      map.attr('transform', 'translate(' + mapX + ',' + mapY + ') scale(' + mapScale + ',' + mapScale + ')');

      tsb.config.regionCodeList.forEach(function(regionCode, regionIndex) {
        var regionInfo = tsb.config.regionsMap[regionCode];
        var region = mapGroup.select('.' + regionInfo.id);
        region
          .attr('class', region.attr('class') + ' regionShape')
          .selectAll('path')
           .style('stroke', '#FFF')
           .style('stroke-width', '5')
           .style('fill', 'none')

        var regionClone = region.node().cloneNode(true);
        regionClone.className = '';
        regionClone.id = '';
        map.node().appendChild(regionClone);

        region
          .attr('class', region.attr('class') + ' regionShape')
          .selectAll('path')
           .style('stroke', 'none')
           .style('fill', tsb.config.odiUsedColors[regionIndex%tsb.config.odiUsedColors.length])

        region
           .style('opacity', 0)

      });

      parent.on('mouseenter', function() {
        map.transition()
          .duration(1000)
          .attr('transform', 'translate(' + mapX2 + ',' + mapY2 + ') scale(' + mapScale2 + ',' + mapScale2 + ')');

        map.selectAll('.regionShape').transition()
          .duration(1000)
          .style('opacity', 1)
      })

      parent.on('mouseleave', function() {
        map.transition()
          .duration(1000)
          .attr('transform', 'translate(' + mapX + ',' + mapY + ') scale(' + mapScale + ',' + mapScale + ')');
        map.selectAll('.regionShape').transition()
          .duration(1000)
          .style('opacity', 0)
      })
    }.bind(this))
  },
  makeCollaborationBtn: function(parent) {
    var root = d3.range(0,1);
    var children = d3.range(0,3);
    var grandChildren = d3.range(0,16);
    var blockHeight = 10;
    var blockWidth = 20;

    var nodeGroup = parent.append('g');

    root = root.map(function(d, i) {
      return {
        x: -blockWidth/2,
        y: this.subVizBtnSize/4
      }
    }.bind(this))

    children = children.map(function(d, i) {
      return {
        x: (-Math.floor(children.length/2)+i)*blockWidth*2 - blockWidth/2,
        y: -this.subVizBtnSize/4
      }
    }.bind(this))

    grandChildren = grandChildren.map(function(d, i) {
      return {
        x: (-Math.floor(grandChildren.length/2)+i)*blockWidth*2 - blockWidth/2,
        y: -Math.floor(this.subVizBtnSize/1.5)
      }
    }.bind(this))

    nodeGroup.selectAll('rect.root')
      .data(root)
      .enter()
      .append('rect')
      .attr('x', function(d) { return d.x } )
      .attr('y', function(d) { return d.y } )
      .attr('width', blockWidth)
      .attr('height', blockHeight)
      .style('fill', 'none')
      .style('stroke', '#FFFFFF')

    nodeGroup.selectAll('rect.child')
      .data(children)
      .enter()
      .append('rect')
      .attr('x', function(d) { return d.x } )
      .attr('y', function(d) { return d.y } )
      .attr('width', blockWidth)
      .attr('height', blockHeight)
      .style('fill', 'none')
      .style('stroke', '#FFFFFF')

    nodeGroup.selectAll('rect.grandChild')
      .data(grandChildren)
      .enter()
      .append('rect')
      .attr('x', function(d) { return d.x } )
      .attr('y', function(d) { return d.y } )
      .attr('width', blockWidth)
      .attr('height', blockHeight)
      .style('fill', 'none')
      .style('stroke', '#FFFFFF')

    //LINKS

    var diagonal = d3.svg.diagonal().projection(function(d) { return [d.x+blockWidth/2, d.y]; });
    var links = [];

    children.forEach(function(child) {
      links.push({source:child, target:root[0]});
    })

    var childLinks = [];

    grandChildren.map(function(grandChild, grandChildIndex) {
      childLinks.push({source:grandChild, target:children[Math.floor(grandChildIndex/6)]});
    })

    console.log(links);

    var linkNodes = nodeGroup.selectAll('.link').data(links);

    linkNodes.enter().append('path')
      .attr('class', 'link')
      .style('fill', 'none')
      .style('stroke', '#FFFFFF')
      .style('opacity', '0.5')
      .attr('d', diagonal)

    var childLinkNodes = nodeGroup.selectAll('.childLink').data(childLinks);

    childLinkNodes.enter().append('path')
      .attr('class', 'childLink')
      .style('fill', 'none')
      .style('stroke', '#FFFFFF')
      .style('opacity', '0.0')
      .attr('d', diagonal)

    parent.on('mouseenter', function() {
      childLinkNodes.transition()
        .duration(1000)
        .style('opacity', '0.5')

      nodeGroup.transition()
        .duration(1000)
        .attr('transform', 'translate(0,'+(this.subVizBtnSize*0.4)+')')
    }.bind(this))

    parent.on('mouseleave', function() {
      childLinkNodes.transition()
        .duration(1000)
        .style('opacity', '0.0')
      nodeGroup.transition()
        .duration(1000)
        .attr('transform', 'translate(0,0)')
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
