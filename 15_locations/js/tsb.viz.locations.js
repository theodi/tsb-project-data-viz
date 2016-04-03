var tsb = tsb || { viz : {} };

var mapSVG = 'United_Kingdom_Map_-_Region.svg';

tsb.viz.locations = {
  init: function(svg, w, h) {
    this.svg = svg;
    this.w = w;
    this.h = h;
    this.mapScale = 0.18;
    this.offsetFromTop = 350;
    this.statsTop = 210;
    this.year = tsb.config.currentYear;
    this.years = d3.range(tsb.config.minYear, tsb.config.maxYear + 1);

    this.speedup = 1;
    this.mapAnimDelay = 1000/this.speedup;
    this.mapAnimTime = 2000/this.speedup;
    this.labelAnimTime = 1000/this.speedup;

    this.maxGrant = 170000000;
    this.alreadyOpened = false;

    this.bg = svg
    .append('rect')
    .attr('class', 'bg')
    .attr('width', tsb.state.w).attr('height', tsb.state.h)
    .attr('fill', '#DDDDDD');

    this.loadMap();
  },
  loadMap: function() {
      var mapScale = this.h / 1800;

      d3.xml(mapSVG, 'image/svg+xml', function(xml) {
        var svgDoc = document.importNode(xml.documentElement, true);
        var svgMap = svgDoc.getElementById('map');
        this.svg[0][0].appendChild(svgMap);
        var bb = svgMap.getBoundingClientRect();
        var mapX = -bb.left * mapScale;
        var mapY = -bb.top * mapScale;
        var mapWidth = (bb.right - bb.left) * mapScale;
        var mapHeight = (bb.bottom - bb.top) * mapScale;
        mapX += this.w/2 - mapWidth/2;
        mapY += this.h/2 - mapHeight/2;
        var map = this.svg.select('#map');
        map.attr('transform', 'translate(' + mapX + ',' + mapY + ') scale(' + mapScale + ',' + mapScale + ')');
        map.selectAll('path').style('fill', '#FFFFFF')

        this.loadData();
      }.bind(this));
  },
  createViz: function(rows) {
      tsb.viz.preloader.stop();

      tsb.config.odiColors = [
        '#2254F4', '#00B7FF', '#08DEF9', '#1DD3A7',
        '#0DBC37', '#67EF67', '#F9BC26', '#FF6700',
        '#D60303', '#EF3AAB', '#E6007C', '#B13198'
      ];

      var colors = {
        academic: '#2254F4',
        catapult: '#B13198',
        charity: '#1DD3A7',
        large: '#D60303',
        medium: '#FF6700',
        micro: '#F9BC26',
        pso: '#0DBC37',
        rto: '#0DBC37',
        small: '#F9BC26',
        unknown: '#000000'
      }
      var lats = [];
      var lngs = [];
      var sizes = {};
      var orgs = rows.map(function(org) {
          org.lat = parseFloat(org.lat);
          org.lng = parseFloat(org.lng);
          org.size = org.size.replace('http://tsb-projects.labs.theodi.org/def/concept/enterprise-size/', '')
          org.color = colors[org.size] || '#000000';
          lats.push(org.lat)
          lngs.push(org.lng);
          return org;
      })

      console.log(orgs)
      console.log(sizes)


      console.log(d3.min(lats), d3.max(lats), d3.min(lngs), d3.max(lngs))
      //uk lat long bounds
      function remap(value, low1, high1, low2, high2) {
          return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
      }

      var orgCircles = this.svg.selectAll('.company').data(orgs);

      orgs.sort(function(a, b) {
          return -(a.numProjects - b.numProjects);
      })

      /*
      orgCircles.enter()
        .append('rect')
            .attr('x', 720)
            .attr('width', 960 - 720)
            .attr('y', 65)
            .attr('height', 450 - 65)
            .attr('stroke', 'none')
            .attr('fill', 'none');
     */

     orgCircles.enter()
     .append('circle')
        .attr('r', function(d) { return Math.max(0.5, Math.min(Math.log(d.numProjects)/1.5, 7)) })
        .attr('cx', function(d) { return remap(d.lng, -7.2, 1.76, 720, 960); })
        .attr('cy', function(d) { return remap(d.lat, 49.8, 59.2, 450, 65); })
        .attr('fill', function(d) { return d.color })
        .attr('opacity', function(d) { return 0.5 });

      this.svg.selectAll('text.label').data(Object.keys(colors))
        .enter()
        .append('text')
        .attr('x', 1000 + 10)
        .attr('y', function(d, i) { return 50 + i * 14 })
        .text(function(d, i) { return d.toUpperCase() })
        .style('font-size', 10)

       this.svg.selectAll('rect.label').data(Object.keys(colors))
          .enter()
          .append('rect')
          .attr('x', 1000 - 0)
          .attr('y', function(d, i) { return 50 + i * 14 - 8 })
          .attr('width', 2)
          .attr('height', 10)
          .attr('fill', function(d, i) { return colors[d] })
  },
  loadData: function() {
    tsb.viz.preloader.start();
    Q.all([
        tsb.state.dataSource.getInstitutions(0, 3000),
        tsb.state.dataSource.getInstitutions(3000, 3000),
        tsb.state.dataSource.getInstitutions(6000, 3000)
    ])
    .then(function(results) {
        var rows = [];
        results.forEach(function(data) {
            rows = rows.concat(data.rows);
        })
        console.log(rows.length);
        this.createViz(rows);
    }.bind(this))
  }
}
