var tsb = tsb || { viz : {} };

tsb.viz.preloader = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;

    var g = this.svg.append('g');
    var rw = 30;
    var rh = 30;
    function makeRect(parent, x, y, w, h, color) {
      var r = parent.append('rect')
      .attr('x', x-w/2)
      .attr('y', y-h/2)
      .attr('width', w)
      .attr('height', h)
      .style('fill', color);
      return r;
    }

    var centerX = this.w/2;
    var centerY = this.h/2;

    var self = this;
    var bars = [];
    var colors = [
      tsb.config.odiColors[0],
      tsb.config.odiColors[3],
      tsb.config.odiColors[6],
      tsb.config.odiColors[9]
    ]
    bars[0] = makeRect(g, centerX, centerY, rw, rh*0, colors[0]);
    bars[1] = makeRect(g, centerX, centerY, rw, rh*0, colors[1]);
    bars[2] = makeRect(g, centerX, centerY, rw, rh*0, colors[2]);
    bars[3] = makeRect(g, centerX, centerY, rw, rh*0, colors[3]);

    var progressBG = makeRect(g, centerX, centerY+rh, rw, 2, '#999');
    var progress = makeRect(g, centerX-rw/3, centerY+rh, 0*rw/3, 2, 'rgba(0,0,0,0.5)');

    var playing = false;
    var lastPlayedAnim = 0;

    function anim(i) {
      lastPlayedAnim = i;
      bars[i]
        .attr('y', centerY-rh/2)
        .style('fill', colors[i])
        .transition()
          .duration(400).attr('height', rh)
          .each('end', function() { if (playing) anim((i+1)%4); })
        .transition().delay(400)
          .attr('height', rh*0)
          .attr('y', centerY + rh/2)
          .style('fill', colors[(i+1)%4])
    }

    this.start = function() {
      if (playing) return;
      playing = true;
      anim(lastPlayedAnim);
    }

    this.stop = function() {
      var deferred = Q.defer();
      playing = false;

      progressBG.transition()
        .attr('width', 0)
        .attr('x', centerX+rw/2)
      progress.transition()
        .attr('width', 0)
        .attr('x', centerX+rw/2)
        .each('end', function() {
          deferred.resolve();
        })
      return deferred.promise;
    }
  }
}