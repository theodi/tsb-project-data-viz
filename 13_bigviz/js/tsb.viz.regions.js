var tsb = tsb || { viz : {} };

tsb.viz.regions = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.mapScale = 0.18;
    this.offsetFromTop = 350;
    this.statsTop = 210;
    this.year = (new Date()).getFullYear();
    this.years = d3.range(this.year-4, this.year+1);

    this.speedup = 1;
    this.mapAnimDelay = 1000/this.speedup;
    this.mapAnimTime = 2000/this.speedup;
    this.labelAnimTime = 1000/this.speedup;

    this.maxGrant = 170000000;
    this.alreadyOpened = false;

    this.bg = svg
    .append('rect')
    .attr('class', 'bg')
    .attr('width', tsb.state.w).attr('height', tsb.state.h)
    .attr('fill', tsb.config.themes.current.regionsBgColor);

    this.title = svg
      .append('text')
      .attr('x', this.w * 0.03)
      .attr('y', '2em')
      .style('fill', '#333')
      .style('font-size', tsb.config.themes.current.titleFontSize + 'px')
      .style('font-weight', '300')
      .text(tsb.config.text.regionsTitle)
      .style('opacity', 0)

    this.subTitle = svg
      .append('text')
      .attr('dy', tsb.config.themes.current.titleFontSize * 1.25)
      .style('fill', '#333')
      .style('font-size', tsb.config.themes.current.titleFontSize + 'px')
      .style('font-weight', tsb.config.themes.current.subTitleFontWeight)
      .text(tsb.config.text.regionsTitle2)
      .style('opacity', 0);

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

    this.addBackBtn();
    this.addToolTip();
    this.resize(this.w, this.h);
    this.loadMap();
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
  },
  resize: function(w, h) {
    this.w = w;
    this.h = h;

    this.margin = this.w * 0.05;
    this.colWidth = 100;
    this.spacing = (this.w - 2 * this.margin - tsb.config.regionCodeList.length * this.colWidth)/(tsb.config.regionCodeList.length-1);

    var maxWidth = this.maxWidth = tsb.common.getMaxWidth(this.w);
    var leftMargin = this.leftMargin = (this.w - maxWidth)/2;
    var containerMargin = tsb.config.themes.current.containerMargin;
    var titleFontSize = tsb.config.themes.current.titleFontSize;

    this.title.attr('x', leftMargin + containerMargin);
    this.title.attr('y', titleFontSize + containerMargin);
    this.subTitle.attr('x', leftMargin + containerMargin);
    this.subTitle.attr('y', titleFontSize + containerMargin);

    this.backBtn.attr('transform', 'translate('+(leftMargin-titleFontSize*0.75)+','+titleFontSize*0.6+')');

    var yearsX = leftMargin + maxWidth - this.years.length * titleFontSize * 2;
    var yearsY = titleFontSize + containerMargin;

    this.yearsGroup.attr('transform', 'translate('+yearsX+','+yearsY+')');
  },
  loadMap: function() {
    d3.xml(tsb.config.ukMapSVG, 'image/svg+xml', function(xml) {
      var svgDoc = document.importNode(xml.documentElement, true);
      var svgMap = svgDoc.querySelector('.map');
      this.svg[0][0].appendChild(svgMap);
      var bb = svgMap.getBoundingClientRect();
      var mapX = -bb.left * this.mapScale;
      var mapY = -bb.top * this.mapScale;
      var mapWidth = (bb.right - bb.left) * this.mapScale;
      var mapHeight = (bb.bottom - bb.top) * this.mapScale;
      mapX += this.w/2 - mapWidth/2;
      mapY += this.h/2 - mapHeight/2;
      this.svg.select('.map').attr('transform', 'translate(' + mapX + ',' + mapY + ') scale(' + this.mapScale + ',' + this.mapScale + ')');

      this.loadData();
    }.bind(this));
  },
  explodeMap: function() {
    this.isVizOpened = true;
    tsb.config.regionCodeList.forEach(function(regionCode, regionIndex) {
      var regionInfo = tsb.config.regionsMap[regionCode];
      var region = this.svg.select('.' + regionInfo.id);
      var regionBbox = region.node().getBoundingClientRect();
      var regionWidth = regionBbox.right - regionBbox.left;
      regionX = this.margin + (this.spacing + this.colWidth) * regionIndex - regionBbox.left + this.colWidth/2 - regionWidth*0.8;
      var regionY = -regionBbox.top + this.offsetFromTop;

      if (regionCode == 'S92000003') {
        //scotland
        regionY -= this.h*0.05;
        regionX += 20;
      }

      region.transition()
        .delay(this.mapAnimDelay).duration(this.mapAnimTime)
        .attr('transform', 'translate('+regionX/this.mapScale+','+regionY/this.mapScale+')')
        .each('end', function() {
           region
            .on('mouseover', function() {
              region
                .transition()
                .style('fill', tsb.config.themes.current.regionsRegionHighlighColor)
                .selectAll('path')
                .style('fill', tsb.config.themes.current.regionsRegionHighlighColor);
            })
            .on('mouseleave', function() {
              region
                .transition()
                .style('fill', tsb.config.themes.current.regionsRegionColor)
                .selectAll('path')
                .style('fill', tsb.config.themes.current.regionsRegionColor);
            })
            .on('click', function() {
              this.openLink(this.year, null, regionInfo.name);
            }.bind(this))
        }.bind(this))

      region
        .style('fill', tsb.config.themes.current.regionsRegionColor)
        .selectAll('path')
        .style('fill', tsb.config.themes.current.regionsRegionColor);
    }.bind(this));
  },
  showTitles: function() {
    this.title.transition()
      .style('opacity', 1)

    this.subTitle.transition()
      .style('opacity', 1)

    this.backBtn.transition()
      .style('opacity', 1)
  },
  addRegionsLabels: function() {
    tsb.config.regionCodeList.forEach(function(regionCode, regionIndex) {
      var regionInfo = tsb.config.regionsMap[regionCode];
      var name = regionInfo.name;
      if (name.indexOf('Yorkshire') == 0) name = 'Yorkshire';
      var cx = this.margin + (this.spacing + this.colWidth) * regionIndex;

      var nameLabel = this.svg.append('text')
        .text(name)
        .attr('dx', cx)
        .attr('dy', this.offsetFromTop - 30)
        .style('font-size', 12 + 'px')
        .style('opacity', 0)
        .transition()
        .delay(this.mapAnimDelay + this.mapAnimTime/2)
        .duration(this.labelAnimTime)
        .style('opacity', 1)
    }.bind(this));
  },
  addRegionData: function(dataByRegion) {
    var statsTop = this.statsTop;
    var self = this;

    function colPos(d, i) {
      return self.margin + (self.spacing + self.colWidth) * i;
    }

    function calcNumProjects(d, i) {
      var data = dataByRegion[i];
      var totalNumProjects = data.rows.reduce(function(prev, area) {
        return prev + Number(area.numProjects);
      }, 0);
      return totalNumProjects;
    }

    function calcTotalGrant(d, i) {
      var data = dataByRegion[i];
      var totalGrantsSum = data.rows.reduce(function(prev, area) {
        return prev + Number(area.grantsSum);
      }, 0);
      var totalGrantsSumStr = '£'+Math.floor(totalGrantsSum/1000000) + 'm';
      return totalGrantsSumStr;
    }

    var projectLabels = this.svg.selectAll('.projectLabel').data(dataByRegion);

    projectLabels.enter()
      .append('text')
      .text('Projects')
      .attr('class', 'projectLabel')
      .style('fill', '#222')
      .style('opacity', 0)
      .style('font-size', '60%')
      .style('text-transform', 'uppercase')

    projectLabels
      .attr('dx', colPos.bind(this))
      .attr('dy', statsTop)
      .transition()
      .delay(this.mapAnimDelay+this.mapAnimTime)
      .duration(this.labelAnimTime)
      .style('opacity', 1)

    var projectsNumbers = this.svg.selectAll('.numProjects').data(dataByRegion);

    projectsNumbers.enter()
      .append('text')
      .attr('class', 'numProjects')
      .style('fill', '#222')
      .style('opacity', 0)
      .style('font-size', '120%')

    projectsNumbers
      .attr('dx', colPos.bind(this))
      .attr('dy', statsTop + 25)
      .text(calcNumProjects)
      .transition()
      .delay(this.mapAnimDelay+this.mapAnimTime)
      .duration(this.labelAnimTime)
      .style('opacity', 1)

    var grantsLabel = this.svg.selectAll('.grantLabel').data(dataByRegion);

    grantsLabel.enter()
      .append('text')
      .text('Grants')
      .attr('class', 'grantLabel')
      .style('fill', '#222')
      .style('opacity', 0)
      .style('font-size', '60%')
      .style('text-transform', 'uppercase')

    grantsLabel
      .attr('dx', colPos.bind(this))
      .attr('dy', statsTop + 55)
      .transition()
      .delay(this.mapAnimDelay+this.mapAnimTime)
      .duration(this.labelAnimTime)
      .style('opacity', 1)

    var totalGrants = this.svg.selectAll('.totalGrants').data(dataByRegion);

    totalGrants.enter()
      .append('text')
      .attr('class', 'totalGrants')
      .style('fill', '#222')
      .style('opacity', 0)
      .style('font-size', '120%')

    totalGrants
      .attr('dx', colPos.bind(this))
      .attr('dy', statsTop + 80)
      .text(calcTotalGrant)
      .transition()
      .delay(this.mapAnimDelay+this.mapAnimTime)
      .duration(this.labelAnimTime)
      .style('opacity', 1)

    var barsData = [];
    tsb.config.regionCodeList.map(function(regionCode, regionIndex) {
      var data = dataByRegion[regionIndex];
      data.rows.sort(function(a, b) {
        if (a.priorityArea > b.priorityArea) return 1;
        if (a.priorityArea < b.priorityArea) return -1;
        return 0;
      })
      while(data.rows.length < tsb.config.priorityAreas.length) {
        data.rows.push({
          priorityArea: tsb.config.priorityAreas[0],
          grantsSum: 0,
          numGrants: 0,
          umProjects: 0,
          year: 0
        })
      }
      data.rows.forEach(function(area, areaIndex) {
        var priorityAreaCode = tsb.common.extractPriorityAreaCode(area.priorityArea);
        var priorityAreaColor = tsb.config.themes.current.priorityAreaColor[priorityAreaCode];
        var barData = {
          regionCode: regionCode,
          regionIndex: regionIndex,
          area: area,
          areaIndex: areaIndex,
          priorityAreaCode: priorityAreaCode,
          priorityAreaColor: priorityAreaColor
        }
        barsData.push(barData);
      })
    })

    function areaBarHeight(d) {
      return Math.min(80, Math.max(5, 20 * d.area.grantsSum/12000000));
    }

    var areaBars = this.svg.selectAll('.areaBar').data(barsData);

    areaBars.exit().remove();
    areaBars.enter().append('rect')
      .attr('y', statsTop - 20)
      .attr('class', 'areaBar')
      .attr('width', 5)
      .attr('height', 0)

    areaBars
      .attr('fill', function(d) { return d.priorityAreaColor; })
      .transition()
      .attr('x', function(d) {
        return colPos(d.regionCode, d.regionIndex) + d.areaIndex * 7;
      })
      .delay(function(d) { return this.alreadyOpened ? 0 : this.mapAnimDelay+this.mapAnimTime+50*d.areaIndex; }.bind(this) )
      .duration(this.labelAnimTime)
      .attr('y', function(d) { return  statsTop - 20 - (areaBarHeight(d))})
      .attr('height', areaBarHeight)


    areaBars.on('mouseover', function(d) {
      this.tooltip.node().parentNode.appendChild(this.tooltip.node());
      this.tooltip.style('display', 'block')
      var areaName = tsb.config.priorityAreaLabels[d.priorityAreaCode];
      var grantsSum = '£' + Math.floor(d.area.grantsSum/1000000*10)/10 + 'm'
      this.tooltipText.text(areaName + ' : ' + grantsSum + ' for ' + d.area.numProjects + ' projects');
      this.tooltipBg.style('fill', d.priorityAreaColor)
    }.bind(this))

    areaBars.on('mouseleave', function(d) {
      this.tooltip.style('display', 'none')
    }.bind(this));

    areaBars.on('click', function(d) {
      var regionName = tsb.config.regionsMap[d.regionCode].name;
      this.openLink(this.year, d.priorityAreaCode, regionName);
    }.bind(this));
  },
  createViz: function(dataByRegion) {
    if (!this.alreadyOpened) {
      this.showTitles();
      this.explodeMap();
      this.addRegionsLabels();
    }
    this.addRegionData(dataByRegion);
    if (!this.alreadyOpened) {
      this.alreadyOpened = true;
    }
  },
  openLink: function(year, area, region) {
    var areaLabel = area ? tsb.config.priorityAreaLabels[area] : '';
    var start = year + '-01-01';
    var end = year + '-12-31';
    var region
    var url = tsb.config.domain +
      'projects?utf8=✓&search_string=&date_from='+start+'&date_to='+end+'&priority_area_label%5B'+areaLabel+'%5D&region_labels%5B'+region+'%5D=true';
    window.open(url);
  },
  loadData: function() {
    tsb.viz.preloader.start();
    setTimeout(function() {
      var results = [];
      var regionCodeList = tsb.common.keys(tsb.config.regionsMap);
      regionCodeList.forEach(function(regionCode, regionIndex) {
        results.push(tsb.state.dataSource.getAreaSummaryForYearInRegion(this.year, regionCode))
      }.bind(this));
      Q.all(results).then(function(dataByRegion) {
        tsb.viz.preloader.stop().then(function() {
          this.createViz(dataByRegion);
        }.bind(this))
      }.bind(this))
    }.bind(this), 2000)
  }
}
