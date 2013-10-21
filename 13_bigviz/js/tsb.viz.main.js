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

  //tsb.viz.intro.init(svg, tsb.state.w, tsb.state.h);
  tsb.viz.priorityAreas.init(svg, tsb.state.w, tsb.state.h);
}

window.onload = init;
