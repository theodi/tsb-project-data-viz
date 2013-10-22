var tsb = tsb || { viz : {} };

tsb.viz.regions = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.mapScale = 0.25;
    this.offsetFromTop = 230;
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
    var regionCodeList = tsb.common.keys(tsb.config.regionsMap);
    regionCodeList.forEach(function(regionCode, regionIndex) {
      var regionInfo = tsb.config.regionsMap[regionCode];
      var region = this.svg.select('.' + regionInfo.id);
      var regionBbox = region.node().getBoundingClientRect();
      var regionX = -regionBbox.left - (regionBbox.right - regionBbox.left)/2 + this.w*0.05 + this.w*0.05 + regionIndex * this.w*0.8/regionCodeList.length;
      var regionY = -regionBbox.top + this.offsetFromTop;
      if (regionIndex == 11) {
        regionX -= 70;
      }
      region.transition()
        .delay(1000).duration(2000)
        .attr('transform', 'translate('+regionX/this.mapScale+','+regionY/this.mapScale+')');
    }.bind(this));
  },
  loadData:function(){
    this.explodeMap();
  }
}
