function SPARQLDataSource() {

}

SPARQLDataSource.endpoint = "proxy.php";

SPARQLDataSource.prototype.query = function(queryStr) {
  var deferred = Q.defer();
  var self = this;

  var sparqler = new SPARQL.Service(SPARQLDataSource.endpoint);
  sparqler.setPrefix("tsb", "http://tsb-projects.labs.theodi.org/def/");
  sparqler.setPrefix("rdf", "http://www.w3.org/2000/01/rdf-schema#");
  sparqler.setOutput("json");
  var query = sparqler.createQuery();
  query.query(queryStr, {
    failure: function(err) { deferred.reject(new Error(err)); },
    success: function(json) {
      var data = json.results.bindings.map(self.extractValues);
      var dataSet = DataSet.fromArray(data);
      deferred.resolve(dataSet);
    }
  });

  return deferred.promise;
}

SPARQLDataSource.prototype.extractValues = function(binding) {
  var o = {};
  for(var propertyName in binding) {
    o[propertyName] = binding[propertyName].value;
  }
  return o;
}

SPARQLDataSource.prototype.getProjects = function() {
  var q =" \
    SELECT (?p as ?uri) ?label \
    WHERE { \
      ?p a tsb:Project . \
      ?p rdf:label ?label \
    }";

  return this.query(q);
}

SPARQLDataSource.prototype.getProjectsParticipants = function() {
  var q =" \
    SELECT ?project ?projectLabel ?participant ?participantLabel \
    WHERE { \
      ?project a tsb:Project . \
      ?project rdf:label ?projectLabel . \
      ?project tsb:hasParticipant ?participant . \
      ?participant rdf:label ?participantLabel . \
    }";

  return this.query(q);
}