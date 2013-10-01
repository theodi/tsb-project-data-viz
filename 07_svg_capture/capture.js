var page = require('webpage').create();
console.log('loading...');
page.viewportSize = { width: 1280, height: 720 };
page.open('http://theodi.github.io/tsb-project-data-viz/06_regions', function () {
  console.log('loaded');
  setTimeout(function() {
    var title = page.evaluate(function() {
        return document.body.style.background = "#FFFFFF";
    });
    page.render('05_grants_by_year.jpg');
    phantom.exit();
  }, 3000);
});