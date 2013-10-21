var tsb = tsb || { viz : {} };

tsb.viz.collaborations = {
  init: function(svg, w, h) {
    console.log('collab', tsb.config.themes.current.collaborationsBgColor)
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.institutionSize = 'academic';
    this.institutionTopCount = 12;
    this.institutionsOnlyLocal = false;

    svg
    .append('rect')
    .attr('class', 'bg')
    .attr('width', tsb.state.w).attr('height', tsb.state.h)
    .attr('fill', tsb.config.themes.current.collaborationsBgColor);
  },
  superPoints: function(r, p) {
    var npoints = 64;
    return seq(npoints).map(function(i) {
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