var TSB = TSB || {};

if (!TSB.Viz) {
  TSB.Viz = {};
}
if (!TSB.Viz.Config) {
  TSB.Viz.Config = {
    bgColor: '#EFEFEF',
    assetsPath: 'assets'
  }
}

TSB.Viz.Project = (function() {

var w = window.innerWidth;
var h = window.innerHeight;
var svg;
var mapSVG = TSB.Viz.Config.assetsPath + '/United_Kingdom_Map_-_Region.svg';
var dataSet;
var minDotR = 3;
var tooltip;
var tooltipText;
var title;

var odiColors = [
  '#2254F4', '#00B7FF', '#08DEF9', '#1DD3A7',
  '#0DBC37', '#67EF67', '#F9BC26', '#FF6700',
  '#D60303', '#EF3AAB', '#E6007C', '#B13198'
];

var regionsMap = {
  'E12000001' : 'North East',
  'E12000002' : 'North West',
  'E12000003' : 'Yorkshire and The Humber',
  'E12000004' : 'East Midlands',
  'E12000005' : 'West Midlands',
  'E12000006' : 'East of England',
  'E12000007' : 'London',
  'E12000008' : 'South East',
  'E12000009' : 'South West',
  'S92000003' : 'Scotland',
  'N92000002' : 'Northern Ireland',
  'W92000004' : 'Wales'
};

var ds = new SPARQLDataSource(TSB.Viz.Config.sparqlEndpoint);
var exampleProject = 'http://tsb-projects.labs.theodi.org/id/project/100416';
var HIGHER_EDUCATION = 'http://tsb-projects.labs.theodi.org/def/concept/legal-entity-form/higher-education';

function regionNameToSvgId(name) {
  //make camel case and remove spaces
  var id = name.split(' ').map(function(s) { return s[0].toUpperCase() + s.substr(1);}).join('');
  return id;
}

function loadMap() {
  console.log('loadMap');

  svg.append('rect').attr('fill', TSB.Viz.Config.bgColor).attr('width', w).attr('height', h);

  var mapScale = h / 1800;

  d3.xml(mapSVG, 'image/svg+xml', function(xml) {
    var svgDoc = document.importNode(xml.documentElement, true);
    var svgMap = svgDoc.getElementById('map');
    svg[0][0].appendChild(svgMap);
    var bb = svgMap.getBoundingClientRect();
    var mapX = -bb.left * mapScale;
    var mapY = -bb.top * mapScale;
    var mapWidth = (bb.right - bb.left) * mapScale;
    var mapHeight = (bb.bottom - bb.top) * mapScale;
    mapX += w/2 - mapWidth/2;
    mapY += h/2 - mapHeight/2;
    var map = svg.select('#map');
    map.attr('transform', 'translate(' + mapX + ',' + mapY + ') scale(' + mapScale + ',' + mapScale + ')');

    for(var regionGovId in regionsMap) {
      var regionId = regionNameToSvgId(regionsMap[regionGovId]);
      svg.select('#' + regionId)
        .style('fill', '#DDD')
        .selectAll('path')
        .style('fill', '#DDD')
    }

    loadData(exampleProject);
  });
}

function addParticipantDot(participant) {
  var regionGovId = participant.participantRegion.substr(participant.participantRegion.lastIndexOf('/')+1);
  var regionId = regionNameToSvgId(regionsMap[regionGovId]);
  var region = svg.select('#' + regionId);
  var participantId = participant.participant.substr(participant.participant.lastIndexOf('/')+1);
  var isEduction = participant.participantEntityForm == HIGHER_EDUCATION;
  var regionBbox = region.node().getBoundingClientRect();
  var cx = (regionBbox.right + regionBbox.left)/2 - Math.random() * 2;
  var cy = (regionBbox.top + regionBbox.bottom)/2 - Math.random() * 2;
  var r = minDotR;
  var circle = svg.append('circle')
    .attr('cx', cx)
    .attr('cy', cy)
    .attr('r', r)
    .style('fill', isEduction ? odiColors[3] : odiColors[1])

  var dotObj = { ox : cx, oy: cy, x : cx, y : cy, circle : circle, r : r, selected : false, loaded: false, projects : {} }

  var projectLinks = [];

  circle.on('mouseenter', function() {
    d3.select(this).style('fill', odiColors[6]);
    tooltip.style('display', 'block');
    tooltipText.text(participant.participantLabel + ' ' + participantId);
    var w = tooltipText.node().getComputedTextLength();
    tooltip.select('rect').attr('width', w + 20)
  })
  circle.on('mouseleave', function() {
    tooltip.style('display', 'none');
    d3.select(this).style('fill', isEduction ? odiColors[3] : odiColors[1])
  })
  circle.on('click', function() {
    projectLinks.forEach(function(projectLink) {
      if (projectLink.style('display') == 'none') {
        projectLink.style('display', 'block');
      }
      else {
        projectLink.style('display', 'none');
      }
    });
  })

  ds.getOrganisationProjects(participant.participant).then(function(data) {
    dotObj.r = minDotR + Math.sqrt(data.rows.length);
    circle.transition().duration(500).attr('r', dotObj.r);
    dotObj.loaded = true;
    dotObj.projects = data;

    data.rows.sort(function(a, b) {
      return -(Number(a.numParticipants) - Number(b.numParticipants));
    })
    data.rows = data.rows.slice(0, Math.min(data.rows.length, 10));
    data.rows.forEach(function(project, i) {
      var projectLink = svg.append('g')
      .attr('class', 'projectLink');

      projectLinks.push(projectLink);

      projectLink.style('display', 'none');

      projectLink.attr('transform', function(d) { return 'translate(' + (dotObj.x) + ',' + (dotObj.y - (i + 1) * 22) + ')'; });

      var projectLinkBg = projectLink.append('rect')
        .attr('width', '20px')
        .attr('height', '20px')
        .style('fill', isEduction ? odiColors[3] : odiColors[1])
        .attr('rx', '5px')
        .attr('ry', '5px')

      projectLink.append('text')
        .style('fill', '#000000')
        .attr('dx', '3px')
        .attr('dy', '13px')
        .text(project.numParticipants)

      projectLink.on('mouseenter', function() {
        projectLinkBg.style('fill', odiColors[6]);
        tooltip.style('display', 'block');
        tooltipText.text(project.projectLabel);
        var w = tooltipText.node().getComputedTextLength();
        tooltip.select('rect').attr('width', w + 20)
      })
      projectLink.on('mouseleave', function() {
        tooltip.style('display', 'none');
        projectLinkBg.style('fill', isEduction ? odiColors[3] : odiColors[1])
      })
      projectLink.on('click', function() {
        projectLinks.forEach(function(projectLink) {
          projectLink.style('display', 'none');
        });
        svg.selectAll('.title').transition().attr('opacity', 0).remove();
        svg.selectAll('circle').transition().attr('r', 0).remove();
        svg.selectAll('line').transition().style('opacity', 0).remove();
        svg.selectAll('.projectLink').transition().attr('opacity', 0).remove();;
        tooltip.style('display', 'none');
        setTimeout(function() {
          loadData(project.project);
        }, 1000);
      });
    });
  });

  return dotObj;
}

function loadData(project) {
  var dots = [];

  ds.getProjectInfo(project).then(function(data) {
    var lines = [];

    var words = data.rows[0].projectLabel.split(' ');

    var mainLabel = svg.append('text')
      .text('PROJECT:')
      .attr('class', 'title')
      .attr('dx', '3.6em')
      .attr('dy', '5.5em')
      .style('fill', '#999')
      .style('font-size', '14px')

    var label = svg.append('text')
      .text('')
      .attr('dx', '2.5em')
      .attr('dy', '2.5em')
      .style('fill', '#000000')
      .style('font-size', '20px')

    var maxLineWidth = 400;

    var prevLine = '';
    var prevWord = '';
    var line = words[0];
    while(true) {
      label.text(line);
      var lineWidth = label.node().getComputedTextLength();
      if (lineWidth < maxLineWidth) {
        prevLine = line;
        prevWord = words.shift();
        if (!prevWord) {
          lines.push(line);
          break;
        }
        line += ' ' + prevWord;
      }
      else {
        line = prevLine;
        words.unshift(prevWord);
        lines.push(line);
        line = '';
      }
    }
    label.remove();

    lines.forEach(function(line, i) {
      svg.append('text')
      .text(line)
      .attr('class', 'title')
      .attr('dx', '2.5em')
      .attr('dy', (5.5 + 1.2*i)+'em')
      .style('fill', '#000000')
      .style('font-size', '20px')
    })
  })

  ds.getProjectParticipants(project).then(function(data) {
    var linkGroup = svg.append('g');
    data.rows.forEach(function(participant) {
      dots.push(addParticipantDot(participant));
    })

    var d3_geom_voronoi = d3.geom.voronoi().x(function(d) { return d.x; }).y(function(d) { return d.y; });

    function length(v) {
      return Math.sqrt(v.x*v.x + v.y*v.y);
    }

    function updateLayout() {
      dots.forEach(function(a) {
        dots.forEach(function(b) {
          if (a == b) return;
          var ab = {
            x : b.x - a.x,
            y : b.y - a.y
          }
          var dist = length(ab);
          var r = (a.r + b.r) * 1.5;
          if (dist < r) {
            var f = 1.0 - dist/r;
            a.x -= ab.x * 0.05 * f;
            a.y -= ab.y * 0.05 * f;
            b.x += ab.x * 0.05 * f;
            b.y += ab.y * 0.05 * f;
            a.circle.attr('cx', a.x);
            a.circle.attr('cy', a.y);
            b.circle.attr('cx', b.x);
            b.circle.attr('cy', b.y);
          }
        });
      })
    }

    var link = linkGroup.selectAll("line");
      link = link.data(d3_geom_voronoi.links(dots))
      link.enter().append("line")
      link
        .style('stroke', odiColors[1])
        .style('opacity', 0)
      link.transition()
        .duration(500)
        .style('opacity', 0.5)

    function updateLinks() {
      var link = linkGroup.selectAll("line");
      link = link.data(d3_geom_voronoi.links(dots))
      link.enter().append("line")
      link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; })
    }

    var updateCount = 0;
    var updateInterval = setInterval(function() {
      var numLoaded = 0;
      dots.forEach(function(dot) {
        if (dot.loaded) numLoaded++;
      });
      if (numLoaded == dots.length) {
        updateCount++;
      }
      if (updateCount > 60) {
        clearInterval(updateInterval);
      }
      updateLayout();
      updateLinks();
    }, 1000/30)


    if (tooltip) {
      tooltip.remove();
    }
    tooltip = svg.append('g')
      .attr('class', 'tooltip')

    tooltip.append('rect')
      .attr('width', 200)
      .attr('height', '1.6em')
      .style('fill', odiColors[6])
      .attr('rx', '5px')
      .attr('ry', '5px')

    tooltipText = tooltip.append('text')
      .text('BLA BLA')
      .attr('dx', '0.5em')
      .attr('dy', '1.5em')
      .style('fill', '#000')
      .style('font-size', '12px')

    svg.on('mousemove', function(e) {
      tooltip.attr('transform', function(d) { return 'translate(' + (d3.event.x + 10) + ',' + (d3.event.y-20) + ')'; });
    })
  });
}

return function(project, container, width, height) {
  w = width || w;
  h = height || h;
  exampleProject = project;
  svg = d3.select(container).append('svg')
    .attr('width', w)
    .attr('height', h);
    loadMap();
  }
}

)();