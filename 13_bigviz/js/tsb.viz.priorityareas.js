

var tsb = tsb || { viz : {} };

tsb.viz.priorityAreas = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.startYear = 2002;
    this.endYear = (new Date().getFullYear());
    this.duration = 60000;
    this.loadData();

    svg
    .append('rect')
    .attr('class', 'bg')
    .attr('width', tsb.state.w).attr('height', tsb.state.h)
    .attr('fill', tsb.config.themes.current.priorityAreasBgColor)

    var title = svg
      .append('text')
      .attr('x', '1em')
      .attr('y', '2em')
      .style('fill', '#333')
      .style('font-size', '200%')
      .style('font-weight', '300')
      .text('TSB spending by priority area (£)')

    this.subTitle = svg
      .append('text')
      .attr('x', '1em')
      .attr('y', '3.2em')
      .style('fill', '#F00')
      .style('font-size', '200%')
      .style('font-weight', '100')
      .text('Space xploration')
      .style('opacity', 0)
  },
  loadData: function() {
    var results = [];
    for(var year=this.startYear; year<=this.endYear; year++) {
      results.push(tsb.state.dataSource.getAreaSummaryForYear(year))
    }
    Q.all(results).then(function(data) {
      var mappedData = this.mapData(data);
      this.drawGraph(mappedData);
    }.bind(this))
  },
  drawGraph: function(data) {
    console.log('drawGraph', data);
    var n = tsb.config.budgetAreas.length; // number of layers / budget areas
    var m = this.endYear - this.startYear + 1; // number of samples per layer / years
    var stack = d3.layout.stack().offset('wiggle');
    var layers = stack(data);

    var width = this.w;
    var height = this.h * 0.8;
    var margin = 0;
    var startYear = this.startYear;
    var endYear = this.endYear;
    var subTitle = this.subTitle;
    var svg = this.svg;
    var self = this;

    var x = d3.scale.linear()
      .domain([this.startYear, this.endYear])
      .range([margin, width-margin]);

    var y = d3.scale.linear()
      .domain([0, d3.max(layers.concat(layers), function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
      .range([height, (this.h - height)/2]);

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
        return tsb.config.themes.current.budgetAreaColor[d[0].budgetArea];
      })
      .on('mouseenter', function(d) {
        layerPaths.transition()
        .style('opacity', function(od) {
          return (od == d) ? 1 : 0.25
        })
        subTitle
          .style('fill', tsb.config.themes.current.budgetAreaColor[d[0].budgetArea])
          .text(tsb.config.budgetAreaLabels[d[0].budgetArea])
        subTitle.transition()
          .style('opacity', 1)
        svg.selectAll('text.priorityAreasTotal')
          .data(d)
          .attr('fill', function(d) {
            return tsb.config.themes.current.budgetAreaColor[d.budgetArea];
          })
          .text(function(d) {
            return Math.floor(d.grantsSum/1000000*100)/100 + 'M';
          })
          .transition()
          .style('opacity', 1)
        svg.selectAll('text.priorityAreasGrants')
          .data(d)
          .attr('fill', function(d) {
            return tsb.config.themes.current.budgetAreaColor[d.budgetArea];
          })
          .text(function(d) { return d.numGrants + ' GRANTS'; })
          .transition()
          .style('opacity', 1)
      })
      .on('mouseleave', function(d) {
        layerPaths.transition()
          .style('opacity', 1)
        subTitle.transition()
          .style('opacity', 0)
        svg.selectAll('text.priorityAreasTotal').transition()
          .style('opacity', 0)
        svg.selectAll('text.priorityAreasGrants').transition()
          .style('opacity', 0)
      })
      .on('click', function(d) {
        var clickedYear = startYear + Math.floor((endYear - startYear + 1) * d3.event.clientX / width);
        var clickedArea = d[0].budgetArea;
        self.openLink(clickedYear, clickedArea)
      })

    //axis
    var yearLines = this.svg.selectAll('line.priorityAreas')
      .data(d3.range(this.startYear, this.endYear+1))
      .enter()
        .append('line')
        .attr('x1', x)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', this.h)
        .style('stroke', 'black')
        .style('opacity', 0.1)

    var yearLabels = this.svg.selectAll('text.priorityAreas')
      .data(d3.range(this.startYear+1, this.endYear+1))
      .enter()
        .append('text')
        .text(function(d) { return d; })
        .attr('text-anchor', 'middle')
        .attr('dx', -width / (this.endYear - this.startYear) /2)
        .attr('x', x)
        .attr('y', this.h-20)
        .attr('font-size', '80%')

    this.svg.selectAll('text.priorityAreasTotal')
      .data(data[0])
      .enter()
        .append('text')
        .text(function(d) { return d.grantsSum; })
        .attr('text-anchor', 'middle')
        .attr('dx', -width / (this.endYear - this.startYear) /2)
        .attr('x', function(d) { return x(d.x); })
        .attr('y', this.h-80)
      .style('opacity', 0)
        .attr('font-size', '120%')
        .attr('class', 'priorityAreasTotal')

    this.svg.selectAll('text.priorityAreasGrants')
      .data(data[0])
      .enter()
        .append('text')
        .text(function(d) { return d.numGrants + ' grants'; })
        .attr('text-anchor', 'middle')
        .attr('dx', -width / (this.endYear - this.startYear) /2)
        .attr('x', function(d) { return x(d.x); })
        .attr('y', this.h-50)
        .style('opacity', 0)
        .attr('font-size', '70%')
        .attr('class', 'priorityAreasGrants')
  },
  openLink: function(year, area) {
    var areaLabel = tsb.config.budgetAreaLabels[area]
    var start = year + '-01-01';
    var end = year + '-12-31';
    document.location.href = tsb.config.domain +
      '/projects?utf8=✓&search_string=&date_from='+start+'&date_to='+end+'&budget_area_label%5B'+areaLabel+'%5D=true';
  },
  mapData: function(data) {
    var byArea = {};
    var areas = [];
    var startYear = this.startYear;
    var endYear = this.endYear;
    tsb.config.budgetAreas.forEach(function(areaId) {
      var areaStats = [];
      byArea[areaId] = areaStats;
      areas.push(areaStats);
      for(var year=this.startYear; year<=this.endYear; year++) {
        areaStats[year-startYear] = { x: year, y: 0, grantsSum:0, numGrants:0, budgetArea: areaId };
      }
    }.bind(this));
    data.forEach(function(year) {
      if (year.rows.length == 1 && year.rows[0].numGrants == 0) return;
      year.rows.forEach(function(grantArea) {
        var budgetAreaId = tsb.common.extractBudgetAreaCode(grantArea.budgetArea);
        byArea[budgetAreaId][grantArea.year-startYear].y = Number(grantArea.grantsSum);
        byArea[budgetAreaId][grantArea.year-startYear].grantsSum = grantArea.grantsSum;
        byArea[budgetAreaId][grantArea.year-startYear].numGrants = grantArea.numGrants;
        if (grantArea.year < endYear)
          byArea[budgetAreaId][grantArea.year-startYear+1].y = Number(grantArea.grantsSum);
      });
    });
    return areas;
  }
};