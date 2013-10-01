var phantom = require('phantom');

phantom.create(function(ph) {
 ph.createPage(function(page) {
    page.set('viewportSize', {width:1280,height:720})
    page.open('http://theodi.github.io/tsb-project-data-viz/06_regions', function () {
      console.log('loaded');
      setTimeout(function() {
        var title = page.evaluate(function() {
            return document.body.style.background = "#FFFFFF";
        }, function() {
          page.render('05_grants_by_year.jpg', function() {
            ph.exit();
          });
        });
      }, 7000);
    });
  });
})
