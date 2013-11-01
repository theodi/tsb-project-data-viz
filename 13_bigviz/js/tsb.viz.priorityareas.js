var tsb = tsb || { viz : {} };

tsb.viz.priorityAreas = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.minColumnWidth = 120;
    this.endYear = (new Date().getFullYear())+1;
    this.startYear = this.endYear-Math.ceil(this.w/this.minColumnWidth);
    this.duration = 60000;
    this.loadData();

    this.bg = svg
      .append('rect')
      .attr('class', 'bg')
      .attr('width', tsb.state.w).attr('height', tsb.state.h)
      .attr('fill', tsb.config.themes.current.priorityAreasBgColor);

    this.title = svg
      .append('text')
      .style('fill', '#333')
      .style('font-size', tsb.config.themes.current.titleFontSize + 'px')
      .style('font-weight', tsb.config.themes.current.titleFontWeight)
      .text(tsb.config.text.priorityAreasTitle.replace('START', this.startYear+1).replace('END', this.endYear-1))
      .style('opacity', 0)

    this.subTitle = svg
      .append('text')
      .attr('dy', tsb.config.themes.current.titleFontSize * 1.25)
      .style('fill', '#F00')
      .style('font-size', tsb.config.themes.current.titleFontSize + 'px')
      .style('font-weight', tsb.config.themes.current.subTitleFontWeight)
      .text('Space xploration')
      .style('opacity', 0);

    this.addBackBtn();
    this.resize(this.w, this.h);
  },
  addBackBtn: function() {
    this.backBtn = this.svg.append('g')
      .style('opacity', 0)

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
    this.subTitle.attr('x', leftMargin + containerMargin);
    this.subTitle.attr('y', titleFontSize + containerMargin);

    this.backBtn.attr('transform', 'translate('+(leftMargin-titleFontSize*0.5)+','+titleFontSize*0.6+')');
  },
  loadData: function() {
    var results = [];
    for(var year=this.startYear; year<=this.endYear; year++) {
      results.push(tsb.state.dataSource.getAreaSummaryForYear(year))
    }
    Q.all(results).then(function(data) {
      tsb.viz.preloader.stop().then(function() {
        this.title.transition()
          .style('opacity', 1)
        this.backBtn.transition()
          .style('opacity', 1)
        var mappedData = this.mapData(data);
        this.drawGraph(mappedData);
      }.bind(this))
    }.bind(this))
  },
  drawGraph: function(data) {
    tsb.common.log('drawGraph', data);
    var n = tsb.config.priorityAreas.length; // number of layers / budget areas
    var m = this.endYear - this.startYear + 1; // number of samples per layer / years
    var stack = d3.layout.stack().offset('wiggle');
    var layers = stack(data);

    var maxWidth = this.w;//this.maxWidth = tsb.common.getMaxWidth(this.w);
    var leftMargin = 0;//this.leftMargin = (this.w - maxWidth)/2;
    var containerMargin = tsb.config.themes.current.containerMargin;

    var width = maxWidth;
    var margin = leftMargin;
    var startYear = this.startYear;
    var endYear = this.endYear;
    var subTitle = this.subTitle;
    var svg = this.svg;
    var self = this;

    var x = d3.scale.linear()
      .domain([this.startYear, this.endYear])
      .range([leftMargin, margin+width]);

    var y = d3.scale.linear()
      .domain([0, d3.max(layers.concat(layers), function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
      .range([this.h*0.77, this.h*0.15]);

    var area = d3.svg.area()
      .x(function(d) { return x(d.x); })
      .y0(function(d) { return y(d.y0); })
      .y1(function(d) { return y(d.y0 + d.y); })
      //.interpolate('cardinal')

    var layerPaths = this.svg.selectAll('path')
      .data(layers)
    .enter().append('path')
      .attr('d', area)
      .style('fill', function(d) {
        return tsb.config.themes.current.priorityAreaColor[d[0].priorityArea];
      })
      .on('mouseenter', function(d) {
        layerPaths.transition()
        .style('opacity', function(od) {
          return (od == d) ? 1 : 0.25
        })
        subTitle
          .style('fill', tsb.config.themes.current.priorityAreaColor[d[0].priorityArea])
          .text(tsb.config.priorityAreaLabels[d[0].priorityArea])
        subTitle.transition()
          .style('opacity', 1)
        svg.selectAll('text.priorityAreasTotal')
          .data(d.slice(1, d.length-1))
          .attr('fill', function(d) {
            return tsb.config.themes.current.priorityAreaColor[d.priorityArea];
          })
          .text(function(d) {
            return '£'+Math.floor(d.grantsSum/1000000*10)/10 + 'm';
          })
          .transition()
          .style('opacity', 1)
        svg.selectAll('text.priorityAreasGrants')
          .data(d.slice(1, d.length-1))
          .attr('fill', function(d) {
            return tsb.config.themes.current.priorityAreaColor[d.priorityArea];
          })
          .text(function(d) { return d.numGrants + ' GRANTS'; })
          .transition()
          .style('opacity', 1)
      })
      .on('mouseleave', function(d) {
        svg.selectAll('text.priorityAreasTotal')
          .data(d.slice(1, d.length-1))
          .attr('fill', tsb.config.themes.current.defaultTextColor)
          .text(function(d) {
            var yearIndex = d.x - this.startYear;
            var sum = data.reduce(function(sum, area) {
              return sum + Number(area[yearIndex].grantsSum);
            }.bind(this), 0)
            return '£'+Math.floor(sum/1000000*10)/10 + 'm';
          }.bind(this))
          .transition()
          .style('opacity', 1)
        svg.selectAll('text.priorityAreasGrants')
          .data(d.slice(1, d.length-1))
          .attr('fill', tsb.config.themes.current.defaultTextColor)
          .text(function(d) {
            var yearIndex = d.x - this.startYear;
            var sum = data.reduce(function(sum, area) {
              return sum + Number(area[yearIndex].numGrants);
            }.bind(this), 0);
            return sum + ' GRANTS';
          }.bind(this))
          .transition()
          .style('opacity', 1)
        layerPaths.transition()
          .style('opacity', 1)
        subTitle.transition()
          .style('opacity', 0)
      }.bind(this))
      .on('click', function(d) {
        var clickedYear = startYear + Math.floor((endYear - startYear) * d3.event.clientX / width);
        var clickedArea = d[0].priorityArea;
        self.openLink(clickedYear, clickedArea)
      })

    //axis
    var yearLines = this.svg.selectAll('line.priorityAreas')
      .data(d3.range(this.startYear, this.endYear+1)).enter()
    yearLines.append('line')
        .attr('x1', x)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', this.h)
        .style('stroke', '#333')
        .style('opacity', 0.1);

    var yearLabels = this.svg.selectAll('text.priorityAreas')
      .data(d3.range(this.startYear+1, this.endYear))
      .enter()
        .append('text')
        .text(function(d) { return d; })
        .attr('text-anchor', 'middle')
        .attr('dx', 0)
        .attr('x', function(d) { return x(d); })
        .attr('y', this.h-20)
        .attr('fill', '#999')
        .attr('font-size', '80%')

    this.svg.selectAll('text.priorityAreasTotal')
      .data(data[0].slice(1, data[0].length-1))
      .enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('x', function(d) { return x(d.x); })
        .attr('y', this.h-70)
      .style('opacity', 0)
        .attr('font-size', '120%')
        .attr('class', 'priorityAreasTotal')

    this.svg.selectAll('text.priorityAreasGrants')
      .data(data[0].slice(1, data[0].length-1))
      .enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('x', function(d) { return x(d.x); })
        .attr('y', this.h-50)
        .style('opacity', 0)
        .attr('font-size', '70%')
        .attr('font-weight', '200')
        .attr('class', 'priorityAreasGrants')

    //fire totals updates
    this.svg.selectAll('path').on('mouseleave')(layers[0]);
  },
  openLink: function(year, area) {
    var areaLabel = tsb.config.priorityAreaLabels[area]
    var start = year + '-01-01';
    var end = year + '-12-31';
    var url = tsb.config.domain +
      '/projects?utf8=✓&search_string=&date_from='+start+'&date_to='+end+'&priority_area_label%5B'+areaLabel+'%5D=true';
    window.open(url);
  },
  mapData: function(data) {
    var byArea = {};
    var areas = [];
    var startYear = this.startYear;
    var endYear = this.endYear;
    tsb.config.priorityAreas.forEach(function(areaId) {
      var areaStats = [];
      byArea[areaId] = areaStats;
      areas.push(areaStats);
      for(var year=this.startYear; year<=this.endYear; year++) {
        areaStats[year-startYear] = { x: Number(year), y: 0, grantsSum:0, numGrants:0, priorityArea: areaId };
      }
    }.bind(this));
    data.forEach(function(year) {
      if (year.rows.length == 1 && year.rows[0].numGrants == 0) return;
      year.rows.forEach(function(grantArea) {
        var priorityAreaId = tsb.common.extractPriorityAreaCode(grantArea.priorityArea);
        byArea[priorityAreaId][grantArea.year-startYear].y = Number(grantArea.grantsSum);
        byArea[priorityAreaId][grantArea.year-startYear].grantsSum = grantArea.grantsSum;
        byArea[priorityAreaId][grantArea.year-startYear].numGrants = grantArea.numGrants;
        if (grantArea.year == endYear - 1)
          byArea[priorityAreaId][grantArea.year-startYear+1].y = Number(grantArea.grantsSum);
      });
    });
    return areas;
  }
};