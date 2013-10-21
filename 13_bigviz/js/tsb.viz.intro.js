var tsb = tsb || { viz : {} };

var regionNameMap = [
  ['North West England', 'North West'],
  ['North East England', 'North East'],
  ['South West England', 'South West'],
  ['South East England', 'South East']
];

tsb.viz.intro = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.loadData()
  },
  loadData: function() {
    var svg = this.svg;
    var w = this.w;
    var h = this.h;
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

      var numProjects = 0;

      var budgetAreaToColor = (function() {
        var colorMap = {
          'TSBProgrammes' : '#2254F4'
        };
        var idx = 1;
        return function(area) {
          if (area.trim() == 'TSB Programmes') area = 'TSBProgrammes';
          if (!colorMap[area]) {
            colorMap[area] = tsb.odiColors[idx++];
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
          .style('opacity', 0.5)
          .transition().delay(Math.random()*120000)
          .attr('y', y)
          .attr('height', h)
          .each('end', function() {
            projectCount.text(numProjects++ + ' projects');
          })
      }

      projectList.forEach(function(project, projectIndex) {
        spacingX = 8;
        spacingY = 25;
        margin = 40;
        projectsPerLine = Math.floor((w - 2*margin) / spacingX);
        px = margin + (projectIndex % projectsPerLine) * spacingX;
        py = margin + Math.floor(projectIndex / projectsPerLine) * spacingY;
        pw = 5;
        ph = 15;
        budgetArea = project.rows[0]['AreaBudgetHolder'];
        var color = budgetAreaToColor(budgetArea);
        makeRect(px, py, pw, ph, color, 'project');
      })

      var labelGroup = svg.append('g');
      labelGroup.append('text')
        .text('In 2012 we funded')
        .attr('dx', 100)
        .attr('dy', 200)
        .attr('fill', '#FFF')
        .style('font-size', '6em')
        .style('font-weight', '100')

      var projectCount = labelGroup.append('text')
        .text('0 projects')
        .attr('dx', 100)
        .attr('dy', 320)
        .attr('fill', '#FFF')
        .style('font-size', '6em')
        .style('font-weight', '100')

      labelGroup
        .style('opacity', 0)
        .transition().duration(2000)
        .style('opacity', 1)
    });
  }
}
