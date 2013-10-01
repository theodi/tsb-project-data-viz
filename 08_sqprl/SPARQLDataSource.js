function SPARQLDataSource() {

}

SPARQLDataSource.endpoint = "proxy.php";

SPARQLDataSource.prototype.query = function(q)
  var deferred = Q.defer();

  var sparqler = new SPARQL.Service(SPARQLDataSource.endpoint);
  sparqler.setPrefix("tsb", "http://tsb-projects.labs.theodi.org/def/");
  sparqler.setPrefix("rdf", "http://www.w3.org/2000/01/rdf-schema#");
  sparqler.setOutput("json");
  var query = sparqler.createQuery();
  query.query(
    " \
    SELECT (?p as ?uri) ?label \
    WHERE { \
      ?p a tsb:Project . \
      ?p rdf:label ?label \
    }",
    {failure: onFailure, success: onSuccess}
  );

  function onFailure(err) {
    deferred.reject(new Error(err));
  }

  function onSuccess(json) {
    var projects = json.results.bindings.map(function(binding) {
      return { uri : binding.uri.value, label : binding.label.value };
    });
    deferred.resolve(projects[0]);
  }

  return deferred.promise;
}