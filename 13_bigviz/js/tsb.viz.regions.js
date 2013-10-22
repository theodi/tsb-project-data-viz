var tsb = tsb || { viz : {} };

tsb.viz.regions = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.mapScale = 0.25;
    this.offsetFromTop = 270;
    this.unusedShapes = ['Ireland', 'IsleOfMan', 'ChannelIslands', 'Border1', 'Border2', 'Border3'];

    svg
    .append('rect')
    .attr('class', 'bg')
    .attr('width', tsb.state.w).attr('height', tsb.state.h)
    .attr('fill', tsb.config.themes.current.regionsBgColor)

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

      this.svg.append('text')
        .text(name)
        .attr('dx', cx)
        .attr('dy', this.offsetFromTop - 50)
        .style('font-size', 12)
        .style('opacity', 0)
        .transition()
        .delay(mapAnimDelay + mapAnimTime/2)
        .duration(labelAnimTime)
        .style('opacity', 1)
        .attr('text-anchor', 'middle')

    }.bind(this));
  },
  loadData:function(){
    this.explodeMap();
  }
}
