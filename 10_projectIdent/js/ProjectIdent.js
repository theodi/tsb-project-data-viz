var odiColors = [
  '#2254F4', '#00B7FF', '#08DEF9', '#1DD3A7',
  '#0DBC37', '#67EF67', '#F9BC26', '#FF6700',
  '#D60303', '#EF3AAB', '#E6007C', '#B13198'
];

var regionNameMap = [
  ['North West England', 'North West'],
  ['North East England', 'North East'],
  ['South West England', 'South West'],
  ['South East England', 'South East']
];

var dataSet;

var w = window.innerWidth;
var h = 480;

function loadData() {
  d3.csv('../data/TSB-data-public-2012.csv', function(error, rows) {
    //normalize region names
    rows.forEach(function(row) {
      regionNameMap.forEach(function(regionMapping) {
        if (row.Region == regionMapping[0]) {
          row.Region = regionMapping[1];
        }
      });
    });

    dataSet = DataSet.fromArray(rows);

    var projects = dataSet.groupBy('TSBProjectNumber');
    var projectList = [];
    projects.uniqueValues.forEach(function (projectId) {
      projectList.push(projects[projectId]);
    });

    console.log('Loaded', projectList.length, 'projects');

    var budgetAreaToColor = (function() {
      var colorMap = {};
      var idx = 0;
      return function(area) {
        if (area.trim() == 'TSB Programmes') area = 'TSBProgrammes';
        if (!colorMap[area]) {
          colorMap[area] = odiColors[idx++];
          if (!colorMap[area]) {
            colorMap[area] = '#DDD';
          }
          console.log('new mapping', area, colorMap[area], idx);
        }
        return colorMap[area];
      }
    })();

    function makeRect(x, y, w, h, color, className) {
      svg
        .append('g')
        .append('rect')
        .attr('class', className)
        .attr('x', x).attr('y', y+h)
        .attr('width', w).attr('height', 0)
        .attr('fill', color)
        .transition().delay(Math.random()*50000)
        .attr('y', y)
        .attr('height', h);
    }

    projectList.forEach(function(project, projectIndex) {
      spacingX = 8
      spacingY = 25
      margin = 40
      projectsPerLine = Math.floor((w - 2*margin) / spacingX)
      px = margin + (projectIndex % projectsPerLine) * spacingX
      py = margin + Math.floor(projectIndex / projectsPerLine) * spacingY
      pw = 5
      ph = 15
      budgetArea = project.rows[0]['AreaBudgetHolder']
      var color = budgetAreaToColor(budgetArea);
      //for(var i=0; i<project.rows.length; i++) {
      //  makeRect(px, py + 3*i, pw, 2, color, 'project');
      //}
      makeRect(px, py, pw, ph, color, 'project');
    })
  });
}

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


window.onload = init;



