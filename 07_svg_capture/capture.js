var page = require('webpage').create();
var system = require('system');
console.log('loading...');
page.viewportSize = { width: 1280, height: 720 };

var url = (system.args.length > 1) ? system.args[1] : 'http://theodi.org'
var destination = (system.args.length > 2) ? system.args[2] : 'screenshot.png';
page.open(url, function () {
  console.log('loaded');
  setTimeout(function() {
    var title = page.evaluate(function() {
        return document.body.style.background = "#FFFFFF";
    });
    page.render(destination);
    phantom.exit();
  }, 3000);
});