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
  function checkScene() {
    svg.remove();
    svg = tsb.state.svg = d3.select('#home-viz').append('svg')
    .attr('width', tsb.state.w)
    .attr('height', tsb.state.h);
    if (document.location.hash == '#intro') {
      tsb.viz.intro.init(svg, tsb.state.w, tsb.state.h);
    }
    else if (document.location.hash == '#priorityareas') {
      tsb.viz.priorityAreas.init(svg, tsb.state.w, tsb.state.h);
    }
    else if (document.location.hash == '#collaborations') {
      tsb.viz.collaborations.init(svg, tsb.state.w, tsb.state.h);
    }
    else if (document.location.hash == '#regions') {
      tsb.viz.regions.init(svg, tsb.state.w, tsb.state.h);
    }
    else {
      tsb.viz.intro.init(svg, tsb.state.w, tsb.state.h);
    }
  }
  checkScene();
}



window.onload = init;
