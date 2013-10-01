function SPARQLDataSource() {

}

SPARQLDataSource.endpoint = "proxy.php";

SPARQLDataSource.prototype.getProjects = function(callback) {
  var sparqler = new SPARQL.Service(SPARQLDataSource.endpoint);
  sparqler.setPrefix("tsb", "http://tsb-projects.labs.theodi.org/def/");
  sparqler.setPrefix("rdf", "http://www.w3.org/2000/01/rdf-schema#");
  sparqler.setOutput("json");
  var query = sparqler.createQuery();
  query.query(
    "SELECT ?s WHERE { ?s a tsb:Project . }",
    {failure: onFailure, success: onSuccess}
  );

  function onFailure(err) {
    if (callback) callback(err);
  }

  function onSuccess(json) {
    var projects = json.results.bindings.map(function(binding) {
      return { url : binding.s.value };
    })
    if (callback) callback(projects);
  }
}