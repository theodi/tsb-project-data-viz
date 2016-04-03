var tsb = tsb || { viz : {} };

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
    .attr('fill', tsb.config.themes.current.regionsBgColor);

    this.loadData();
  },
  createViz: function(rows) {
      tsb.viz.preloader.stop();

      var lats = [];
      var lngs = [];
      var orgs = rows.map(function(org) {
          org.lat = parseFloat(org.lat);
          org.lng = parseFloat(org.lng);
          lats.push(org.lat)
          lngs.push(org.lng);
          return org;
      })

      console.log(d3.min(lats), d3.max(lats), d3.min(lngs), d3.max(lngs))

      //uk lat long bounds
      var x = d3.scale.linear().domain([-6, 2]).range([0, 300]);
      var y = d3.scale.linear().domain([59, 49]).range([0, 480]);

      this.svg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 300)
        .attr('height', 600)
        .style('stroke', '#FF0000')
        .style('fill', '#FFFFFF');

      var orgCircles = this.svg.selectAll('.company').data(orgs);

      orgCircles.enter()
        .append('circle')
            .attr('r', 1)
            .attr('cx', function(d) { return x(d.lng); })
            .attr('cy', function(d) { return y(d.lat); })
            .attr('fill', 'red');
    console.log(rows);
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
