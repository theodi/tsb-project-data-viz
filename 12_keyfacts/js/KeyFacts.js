var odiColors = [
  '#1DD3A7', '#2254F4', '#00B7FF', '#08DEF9',
  '#0DBC37', '#67EF67', '#F9BC26', '#FF6700',
  '#D60303', '#EF3AAB', '#E6007C', '#B13198'
];

var unusedShapes = ['Ireland', 'IsleOfMan', 'ChannelIslands', 'Border1', 'Border2', 'Border3'];

var mapSVG = '../data/United_Kingdom_Map_-_Region.svg';
var mapScale = 0.25;

var dataSet;

var w = window.innerWidth;
var h = 480;
var marginLeft = 1.75*h/3;
var spacing = (w - 2*marginLeft)/2;
var svg;

function loadData() {
  var n = 15, // number of layers
  m = 50, // number of samples per layer
  stack = d3.layout.stack().offset('wiggle'),
  layers0 = stack(d3.range(n).map(function() { return bumpLayer(m); })),
  layers1 = stack(d3.range(n).map(function() { return bumpLayer(m); }));

  var width = 400,
      height = 300;

  var x = d3.scale.linear()
      .domain([0, m - 1])
      .range([0, width]);

  var y = d3.scale.linear()
      .domain([0, d3.max(layers0.concat(layers1), function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
      .range([height, 0]);

  var color = d3.scale.linear()
      .range(["#aad", "#556"]);

  var colorGrey = d3.scale.linear()
      .range(["#666", "#DDD"]);

  var area = d3.svg.area()
      .x(function(d) { return x(d.x); })
      .y0(function(d) { return y(d.y0); })
      .y1(function(d) { return y(d.y0 + d.y); });

  var stackedGraph = svg.append('g')
    .attr("clip-path", "url(#clipMask)");
  var circleRight = stackedGraph.append('circle')
    .attr('cx', marginLeft + 2*spacing)
    .attr('cy', h/2)
    .attr('r', h/3)
    .attr('fill', '#DDD');

  var stackedGraphInside = stackedGraph.append('g')
    .attr('transform', 'translate('+(marginLeft+spacing*1.5+20)+',80)');


  stackedGraphInside.selectAll("path")
      .data(layers0)
    .enter().append("path")
      .attr("d", area)
      .style("stroke", 'transparent')
      //.style("fill", function(d,i) { return odiColors[i]; });
      .style("fill", function(d,i) { return colorGrey(Math.random()); })

  function transition() {
    stackedGraphInside.selectAll("path")
        .data(function() {
          var d = layers1;
          layers1 = layers0;
          return layers0 = d;
        })
      .transition()
        .duration(1500)
        .attr("d", area);
  }

  stackedGraph.on('mouseenter', function(e) {
    circleRight.transition().attr('fill', '#FFDD00');
    stackedGraphInside.transition().duration(2000).attr('transform', 'translate('+(marginLeft+spacing*1.5-30)+',80)');
    transition();
  })
  stackedGraph.on('mouseleave', function(e) {
    circleRight.transition().attr('fill', '#DDD')
    stackedGraphInside.transition().duration(2000).attr('transform', 'translate('+(marginLeft+spacing*1.5+20)+',80)');
    transition();
  })

  // Inspired by Lee Byron's test data generator.
  function bumpLayer(n) {

    function bump(a) {
      var x = 1 / (.1 + Math.random()),
          y = 2 * Math.random() - .5,
          z = 10 / (.1 + Math.random());
      for (var i = 0; i < n; i++) {
        var w = (i / n - y) * z;
        a[i] += x * Math.exp(-w * w);
      }
    }

    var a = [], i;
    for (i = 0; i < n; ++i) a[i] = 0;
    for (i = 0; i < 5; ++i) bump(a);
    return a.map(function(d, i) { return {x: i, y: Math.max(0, d)}; });
  }
}

function loadMap() {
  console.log('loadMap');
  d3.xml(mapSVG, 'image/svg+xml', function(xml) {
    var svgDoc = document.importNode(xml.documentElement, true);
    var svgMap = svgDoc.getElementById('map');
    var bb = svgMap.getBoundingClientRect();
    var mapX = -bb.left * mapScale - 100;
    var mapY = -bb.top * mapScale - 170;
    var mapWidth = (bb.right - bb.left) * mapScale;
    var mapHeight = (bb.bottom - bb.top) * mapScale;
    mapX += w/2 - mapWidth/2;
    mapY += h/2 - mapHeight/2;

    d3.select(svgMap)
      .attr('transform', 'translate(' + mapX + ',' + mapY + ') scale(' + mapScale + ',' + mapScale + ')');

    var mapContainer = svg.append('g')
      .attr("clip-path", "url(#clipMask)");

    mapContainer[0][0].appendChild(svgMap);

    unusedShapes.forEach(function(unusedShapeId) {
      svg.select('#' + unusedShapeId).style('display', 'none');
    });
  });
}

function makeLayout() {

  svg.append('circle')
    .attr('cx', marginLeft)
    .attr('cy', h/2)
    .attr('r', h/3)
    .attr('fill', '#00BB4D');

  svg.append('circle')
    .attr('cx', marginLeft + spacing)
    .attr('cy', h/2)
    .attr('r', h/3)
    .attr('fill', '#00B7FA');

  var clip = svg.append("clipPath")
    .attr('id', 'clipMask');

  clip.append('circle')
    .attr('cx', marginLeft)
    .attr('cy', h/2)
    .attr('r', h/3)
    .attr('fill', 'rgba(255,255,200,1)');

  clip.append('circle')
    .attr('cx', marginLeft + spacing)
    .attr('cy', h/2)
    .attr('r', h/3)
    .attr('fill', 'rgba(255,255,200,1)');

  clip.append('circle')
    .attr('cx', marginLeft + 2*spacing)
    .attr('cy', h/2)
    .attr('r', h/3)
    .attr('fill', 'rgba(255,255,200,1)');
}

function init() {
  svg = d3.select('#home-viz').append('svg')
    .attr('width', w)
    .attr('height', h);

  svg
    .append('rect')
    .attr('class', 'bg')
    .attr('width', w).attr('height', h)
    .attr('fill', '#FFF')

  makeLayout();
  loadData();
  loadMap();
}


window.onload = init;



