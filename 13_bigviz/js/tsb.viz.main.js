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

  window.addEventListener('hashchange', checkScene, false);

  var currentViz = null;

  function checkScene() {
    if (currentViz && currentViz.close) {
      currentViz.close();
    }

    svg.remove();
    svg = tsb.state.svg = d3.select('#home-viz').append('svg')
    .attr('width', tsb.state.w)
    .attr('height', tsb.state.h);
    var staticMode = (document.location.search == "?static=true");
    if (document.location.hash == '#introopened') {
      currentViz = tsb.viz.intro;
    }
    else if (document.location.hash == '#priorityareas') {
      currentViz = tsb.viz.priorityAreas;
    }
    else if (document.location.hash == '#collaborations') {
      currentViz = tsb.viz.collaborations;
    }
    else if (document.location.hash == '#regions') {
      currentViz = tsb.viz.regions;
    }
    else if (document.location.hash == '#network') {
      currentViz = tsb.viz.network;
    }
    else if (document.location.hash == '#collabgrid') {
      currentViz = tsb.viz.collabGrid;
    }
    else {
      currentViz = tsb.viz.intro;
    }

    currentViz.init(svg, tsb.state.w, tsb.state.h, staticMode);
  }
  checkScene();

  window.addEventListener('resize', function() {
    tsb.state.w = window.innerWidth;
    if (currentViz && currentViz.resize) {
      currentViz.resize(tsb.state.w, tsb.state.h);
    }

  })
}



window.onload = init;
