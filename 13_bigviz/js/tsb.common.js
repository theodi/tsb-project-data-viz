var tsb = tsb || {};

tsb.odiColors = [
  '#2254F4', '#00B7FF', '#08DEF9', '#1DD3A7',
  '#0DBC37', '#67EF67', '#F9BC26', '#FF6700',
  '#D60303', '#EF3AAB', '#E6007C', '#B13198'
];

tsb.odiColorsMixed = [
  '#444444', '#2254F4', '#D60303',
  '#0DBC37', '#FF6700', '#00B7FF',
  '#E6007C', '#444444', '#444444',
  '#444444', '#444444', '#444444'
];

tsb.regionsMap = {
  'E12000001' : 'North East',
  'E12000002' : 'North West',
  'E12000003' : 'Yorkshire and The Humber',
  'E12000004' : 'East Midlands',
  'E12000005' : 'West Midlands',
  'E12000006' : 'East of England',
  'E12000007' : 'London',
  'E12000008' : 'South East',
  'E12000009' : 'South West',
  'S92000003' : 'Scotland',
  'N92000002' : 'Northern Ireland',
  'W92000004' : 'Wales'
};

tsb.themes = {
}

tsb.sparqlQuery = (function() {
  function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
      // XHR for Chrome/Firefox/Opera/Safari.
      xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
      // XDomainRequest for IE.
      xhr = new XDomainRequest();
      xhr.open(method, url);
    } else {
      // CORS not supported.
      xhr = null;
    }
    return xhr;
  }

  function makeQuery(sparqlEndpoint, query) {
    var deferred = Q.defer();

    var url = sparqlEndpoint + '?query=' + encodeURIComponent(query);

    var xhr = createCORSRequest('GET', url);
    if (!xhr) {
      deferred.reject(new Error('CORS not supported!'));
      return;
    }

    // Response handlers.
    xhr.onload = function() {
      console.log(xhr);
      deferred.resolve(JSON.parse(xhr.responseText));
    };

    xhr.onerror = function() {
      deferred.reject(new Error('Error making request to ' + url));
    };

    xhr.send();

    return deferred.promise;
  }

  return makeQuery;

})();


