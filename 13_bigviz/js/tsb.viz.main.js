var tsb = {
  viz : {},
  settings : {
    w : window.innerWidth,
    h : 480,
    svg : null
  }
};

function init() {
  tsb.dataSource = new tsb.SPARQLDataSource();

  var svg = tsb.settings.svg = d3.select('#home-viz').append('svg')
    .attr('width', tsb.settings.w)
    .attr('height', tsb.settings.h);

  svg
    .append('rect')
    .attr('class', 'bg')
    .attr('width', tsb.settings.w).attr('height', tsb.settings.h)
    .attr('fill', '#222')

  tsb.viz.intro.init(svg, tsb.settings.w, tsb.settings.h);
}

window.onload = init;
