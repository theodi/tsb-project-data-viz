var server = require('webserver').create();
var service = server.listen('127.0.0.1:8080', function(request, response) {
  var page = require('webpage').create();
  var url = 'http://' + request.url.substr(request.url.indexOf('/')+1).replace('%3A',':/');
  console.log('loading... ' + url);
  page.viewportSize = { width: 1280, height: 720 };
  page.open(url, function () {
    console.log('loaded');
    setTimeout(function() {
      var header = '<img src="data:image/png;base64,';
      var image = page.renderBase64('PNG');
      var footer = '">';
      response.statusCode = 200;
      response.headers = {
        'Content-Type': 'text/html'
      }
      response.write(header+image+footer);
      response.close();
    }, 3000);
  });
});