function init() {
  tsb.common.log('tsb.init');
  tsb.state.dataSource = new tsb.SPARQLDataSource();

  var svg = tsb.state.svg = d3.select('#home-viz').append('svg')
    .attr('width', tsb.state.w)
    .attr('height', tsb.state.h);

  window.addEventListener('hashchange', checkScene, false);

  var currentViz = null;
  var currentVizGroup = svg.append('g');

  tsb.viz.preloader.init(svg, tsb.state.w, tsb.state.h);

  //TODO: hash scene linking is not working
  function checkScene() {
    tsb.common.log('tsb.checkScene', document.location.hash);
    if (currentViz && currentViz.close) {
      currentViz.close();
    }

    d3.select('#home-viz')
    .style('position', 'relative')

    currentVizGroup.selectAll('*').remove();
    //svg = tsb.state.svg = d3.select('#home-viz').append('svg')
    svg
    .attr('width', tsb.state.w)
    .style('position', 'absolute')
    .style('top', 0)
    .style('left', 0)
    .attr('height', tsb.state.h);
    var staticMode = (document.location.search == "?static=true");
    currentViz = tsb.viz.locations;
    tsb.viz.preloader.start();
    currentViz.init(currentVizGroup, tsb.state.w, tsb.state.h, staticMode);
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
