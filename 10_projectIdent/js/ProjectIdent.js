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
    console.log(projects.uniqueValues.length);
  });
}

function init() {
  svg = d3.select('#home-viz').append('svg')
    .attr('width', w)
    .attr('height', h);

  loadData();
}


window.onload = init;



