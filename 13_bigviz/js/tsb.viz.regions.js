var tsb = tsb || { viz : {} };

tsb.viz.regions = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.mapScale = 0.25;
    this.offsetFromTop = 350;
    this.unusedShapes = ['Ireland', 'IsleOfMan', 'ChannelIslands', 'Border1', 'Border2', 'Border3'];
    this.year = (new Date()).getFullYear();

    this.maxGrant = 170000000;

    svg
    .append('rect')
    .attr('class', 'bg')
    .attr('width', tsb.state.w).attr('height', tsb.state.h)
    .attr('fill', tsb.config.themes.current.regionsBgColor);

    this.title = svg
      .append('text')
      .attr('x', this.w * 0.03)
      .attr('y', '2em')
      .style('fill', '#333')
      .style('font-size', '200%')
      .style('font-weight', '300')
      .text('TSB spending by region in ' + this.year)

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

    this.loadMap();
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

      this.unusedShapes.forEach(function(unusedShapeId) {
        this.svg.select('#' + unusedShapeId).style('display', 'none');
      }.bind(this));

      this.loadData();
    }.bind(this));
  },
  explodeMap: function() {
    var speedup = 1;
    var mapAnimDelay = 1000/speedup;
    var mapAnimTime = 2000/speedup;
    var labelAnimTime = 1000/speedup;
    var regionCodeList = tsb.common.keys(tsb.config.regionsMap);
    var offsetLeft = 0;
    var totalWidth = 0;
    var margin = this.w * 0.05;
    regionCodeList.forEach(function(regionCode, regionIndex) {
      var regionInfo = tsb.config.regionsMap[regionCode];
      var region = this.svg.select('.' + regionInfo.id);
      var regionBbox = region.node().getBoundingClientRect();
      var regionWidth = regionBbox.right - regionBbox.left;
      totalWidth += regionWidth;
    }.bind(this));

    var spacing = (this.w - totalWidth - 2 * margin)/(regionCodeList.length-1);

    regionCodeList.forEach(function(regionCode, regionIndex) {
      var regionInfo = tsb.config.regionsMap[regionCode];
      var region = this.svg.select('.' + regionInfo.id);
      var regionBbox = region.node().getBoundingClientRect();
      var regionWidth = regionBbox.right - regionBbox.left;
      regionX = margin + offsetLeft - regionBbox.left + regionIndex * spacing;
      var regionY = -regionBbox.top + this.offsetFromTop;
      offsetLeft += regionWidth;

      if (regionIndex == regionCodeList.length-1) {
        regionY -= this.h*0.1;
      }

      var cx = regionBbox.left + regionX + regionWidth/2;

      //this.svg.append('rect')
      //  .attr('x', regionBbox.left + regionX)
      //  .attr('y', regionBbox.top + regionY)
      //  .attr('width', regionBbox.right - regionBbox.left)
      //  .attr('height', regionBbox.bottom - regionBbox.top)
      //  .style('stroke', 'red')
      //  .style('fill', 'none')

      region.transition()
        .delay(mapAnimDelay).duration(mapAnimTime)
        .attr('transform', 'translate('+regionX/this.mapScale+','+regionY/this.mapScale+')');

      region
        .style('fill', tsb.config.themes.current.regionsRegionColor)
        .selectAll('path')
        .style('fill', tsb.config.themes.current.regionsRegionColor);

      var name = regionInfo.name;
      if (name.indexOf('Yorkshire') == 0) name = 'Yorkshire';

      var nameLabel = this.svg.append('text')
        .text(name)
        .attr('dx', cx)
        .attr('dy', this.offsetFromTop - 40)
        .style('font-size', 12)
        .style('opacity', 0)
        .transition()
        .delay(mapAnimDelay + mapAnimTime/2)
        .duration(labelAnimTime)
        .style('opacity', 1)
        .attr('text-anchor', 'middle')

      var nameLabelBBox = nameLabel.node().getBoundingClientRect();
      var dx = -(nameLabelBBox.right - nameLabelBBox.left)/2;

      var statsTop = 180;

      tsb.state.dataSource.getAreaSummaryForYearInRegion(this.year, regionCode).then(function(data) {
        console.log(regionInfo.name, data);
        var totalGrantsSum = data.rows.reduce(function(prev, area) {
          return prev + Number(area.grantsSum);
        }, 0);
        var totalNumProjects = data.rows.reduce(function(prev, area) {
          return prev + Number(area.numProjects);
        }, 0);
        var totalGrantsSumStr = Math.floor(totalGrantsSum/1000000*10)/10 + 'M';
        this.svg.append('text')
          .text('Projects')
          //.attr('class', 'label')
          .attr('dx', cx + dx)
          .attr('dy', statsTop)
          .style('fill', '#222')
          .style('opacity', 0)
          .style('font-size', '60%')
          .style('text-transform', 'uppercase')
          .transition()
          .delay(mapAnimDelay+mapAnimTime)
          .duration(labelAnimTime)
          .style('opacity', 1)

        this.svg.append('text')
          .text(totalNumProjects)
          //.attr('class', 'bigNum')
          .attr('dx', cx + dx)
          .attr('dy', statsTop + 25)
          .style('opacity', 0)
          .style('font-size', '120%')
          .transition()
          .delay(mapAnimDelay+mapAnimTime)
          .duration(labelAnimTime)
          .style('opacity', 1)

        this.svg.append('text')
          .text('Grants')
          //.attr('class', 'label')
          .attr('dx', cx + dx)
          .attr('dy', statsTop + 60)
          .style('fill', '#222')
          .style('opacity', 0)
          .style('font-size', '60%')
          .style('text-transform', 'uppercase')
          .transition()
          .delay(mapAnimDelay+mapAnimTime)
          .duration(labelAnimTime)
          .style('opacity', 1)

        this.svg.append('text')
          .text(totalGrantsSumStr)
          //.attr('class', 'bigNum')
          .attr('dx', cx + dx)
          .attr('dy', statsTop + 85)
          .style('opacity', 0)
          .style('font-size', '120%')
          .transition()
          .delay(mapAnimDelay+mapAnimTime)
          .duration(labelAnimTime)
          .style('opacity', 0.2 + 0.8*totalGrantsSum/this.maxGrant)

        data.rows.forEach(function(area, areaIndex) {
          var h = Math.max(5, 20 * area.grantsSum/10000000);
          var budgetAreaCode = tsb.common.extractBudgetAreaCode(area.budgetArea);
          var areaBar = this.svg.append('rect');

          areaBar
            .attr('x', cx + dx + areaIndex * 7)
            .attr('fill', tsb.config.themes.current.budgetAreaColor[budgetAreaCode])
            .attr('width', 5)
            .attr('y', statsTop - 20)
            .attr('height', 0)
            .transition()
            .delay(mapAnimDelay+mapAnimTime+50*areaIndex)
            .duration(labelAnimTime)
            .attr('y', statsTop - 20 - h)
            .attr('height', h);

          areaBar.on('mouseover', function() {
            this.tooltip.style('display', 'block')
            var areaName = tsb.config.budgetAreaLabels[budgetAreaCode];
            var grantsSum = Math.floor(area.grantsSum/1000000*10)/10 + 'M'
            this.tooltipText.text(areaName + ' : ' + grantsSum + ' for ' + area.numProjects + ' projects');
            this.tooltipBg.style('fill', tsb.config.themes.current.budgetAreaColor[budgetAreaCode])
          }.bind(this))

          areaBar.on('mouseout', function() {
            this.tooltip.style('display', 'none');
          }.bind(this))

            this.tooltip.node().parentNode.appendChild(this.tooltip.node());
        }.bind(this))
      }.bind(this));

    }.bind(this));
  },
  loadData:function(){
    this.explodeMap();
  }
}
