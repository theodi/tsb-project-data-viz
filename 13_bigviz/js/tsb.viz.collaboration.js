var dataSet;

var w = window.innerWidth;
var h = 480;

function init() {
  svg = d3.select('#home-viz').append('svg')
    .attr('width', w)
    .attr('height', h);

  svg
    .append('rect')
    .attr('class', 'bg')
    .attr('width', w).attr('height', h)
    .attr('fill', '#222')

  loadData();
}

function loadData() {
}

window.onload = init;
