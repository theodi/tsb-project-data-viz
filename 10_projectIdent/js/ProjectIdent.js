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
  d3.csv('../data/TSB-data-public-sample.csv', function(error, rows) {
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

    projectList.forEach(function(project, projectIndex) {
      spacingX = 10
      spacingY = 40
      margin = 20
      projectsPerLine = Math.floor((w - margin) / 10)
      px = margin + (projectIndex % projectsPerLine) * spacingX
      py = margin + Math.floor(projectIndex / projectsPerLine) * spacingY
      pw = 5
      ph = 20
      svg
        .append('g')
        .append('rect')
        .attr('class', 'project')
        .attr('x', px).attr('y', py)
        .attr('width', pw).attr('height', ph)
        .attr('fill', 'yellow')
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
    .attr('fill', 'red')

  loadData();
}


window.onload = init;



