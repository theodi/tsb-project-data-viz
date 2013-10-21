var tsb = {
  viz : {},
  state : {
    w : window.innerWidth,
    h : 480,
    svg : null
  }
};

function init() {
  tsb.state.dataSource = new tsb.SPARQLDataSource();

  var svg = tsb.state.svg = d3.select('#home-viz').append('svg')
    .attr('width', tsb.state.w)
    .attr('height', tsb.state.h);

  svg
    .append('rect')
    .attr('class', 'bg')
    .attr('width', tsb.state.w).attr('height', tsb.state.h)
    .attr('fill', '#222')

  tsb.viz.intro.init(svg, tsb.state.w, tsb.state.h);
}

window.onload = init;
