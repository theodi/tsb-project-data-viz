

var tsb = tsb || { viz : {} };

tsb.viz.priorityAreas = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.startYear = 2004;
    this.endYear = (new Date().getFullYear());
    this.duration = 60000;
    this.loadData();

    svg
    .append('rect')
    .attr('class', 'bg')
    .attr('width', tsb.state.w).attr('height', tsb.state.h)
    .attr('fill', tsb.config.themes.current.priorityAreasBgColor)
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
    var n = tsb.config.bugetAreas.length; // number of layers / budget areas
    var m = this.endYear - this.startYear + 1; // number of samples per layer / years
    var stack = d3.layout.stack().offset('wiggle');
    var layers = stack(data);

    var width = this.w;
    var height = this.h * 0.8;

    var x = d3.scale.linear()
      .domain([this.startYear, this.endYear])
      .range([0, width]);

    var y = d3.scale.linear()
      .domain([0, d3.max(layers.concat(layers), function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
      .range([height, (this.h - height)/2]);

    var area = d3.svg.area()
      .x(function(d) { return x(d.x); })
      .y0(function(d) { return y(d.y0); })
      .y1(function(d) { return y(d.y0 + d.y); })

    this.svg.selectAll('path')
      .data(layers)
    .enter().append('path')
      .attr('d', area)
      .style('fill', function(d) {
        return tsb.config.themes.current.budgetAreaColor[d[0].budgetArea];
      });
  },
  mapData: function(data) {
    var byArea = {};
    var areas = [];
    var startYear = this.startYear;
    tsb.config.bugetAreas.forEach(function(areaId) {
      var areaStats = [];
      byArea[areaId] = areaStats;
      areas.push(areaStats);
      for(var year=this.startYear; year<=this.endYear; year++) {
        areaStats[year-startYear] = { x: year, y: 0, grantsSum:0, numGrants:0, budgetArea: areaId };
      }
    }.bind(this));
    data.forEach(function(year) {
      year.rows.forEach(function(grantArea) {
        var budgetAreaId = tsb.common.extractBudgetAreaCode(grantArea.budgetArea);
        byArea[budgetAreaId][grantArea.year-startYear].y = Number(grantArea.grantsSum);
        byArea[budgetAreaId][grantArea.year-startYear].grantsSum = grantArea.grantsSum;
        byArea[budgetAreaId][grantArea.year-startYear].numGrants = grantArea.numGrants;
      });
    });
    return areas;
  }
};