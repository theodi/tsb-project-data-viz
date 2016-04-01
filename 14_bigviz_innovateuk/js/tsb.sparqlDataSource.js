var tsb = tsb || {};

tsb.SPARQLDataSource = (function() {
  function SPARQLDataSource() {
  }

  SPARQLDataSource.prototype.createCORSRequest = function(method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
      xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
      xhr = new XDomainRequest();
      xhr.open(method, url);
    } else {
      xhr = null;
    }
    return xhr;
  }

  SPARQLDataSource.prototype.executeQuery = function(endpoint, query) {
    var deferred = Q.defer();
    var url = endpoint + '?query=' + encodeURIComponent(query);

    var xhr = this.createCORSRequest('GET', url);
    if (!xhr) {
      deferred.reject(new Error('CORS not supported!'));
      return;
    }

    xhr.onload = function() {
      deferred.resolve(JSON.parse(xhr.responseText));
    };

    xhr.onerror = function() {
      deferred.reject(new Error('Error making request to ' + url));
    };

    xhr.send();

    return deferred.promise;
  }

  SPARQLDataSource.prototype.query = function(queryStr) {
    var deferred = Q.defer();
    var self = this;

    this.executeQuery(tsb.config.sparqlEndpoint, queryStr).then(function(json) {
      var data = json.results.bindings.map(self.extractValues);
      var dataSet = tsb.DataSet.fromArray(data);
      deferred.resolve(dataSet);
    }).fail(function(err) {
      deferred.reject(err);
    })

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

  SPARQLDataSource.prototype.getProjectParticipants = function(projectId) {
    var q =" \
      SELECT ?participant ?participantLabel ?participantRegion ?participantEntityForm \
      WHERE { \
        <" + projectId + "> tsb:hasParticipant ?participant . \
        ?participant rdf:label ?participantLabel . \
        ?participant tsb:legalEntityForm ?participantEntityForm . \
        ?participant w3:hasSite ?participantSite . \
        ?participantSite tsb:region ?participantRegion . \
      }";

    return this.query(q);
  }

  SPARQLDataSource.prototype.getProjectInfo = function(projectId) {
    var q =" \
      SELECT ?projectLabel \
      WHERE { \
        <" + projectId + "> rdf:label ?projectLabel . \
      }";

    return this.query(q);
  }

  /*
  select (count(distinct(?o)) as ?numParticipants) ?project ?projectLabel where {
    ?o a <http://tsb-projects.labs.theodi.org/def/Organization> .
    ?o <http://tsb-projects.labs.theodi.org/def/participatesIn> ?project .
      {
        select ?project ?projectLabel  where {
          ?project a <http://tsb-projects.labs.theodi.org/def/Project> .
          ?project <http://www.w3.org/2000/01/rdf-schema#label> ?projectLabel .
          ?project <http://tsb-projects.labs.theodi.org/def/hasParticipant>  <http://tsb-projects.labs.theodi.org/id/organization/04190816> .
        } 
      }
  }  GROUP BY ?project ?projectLabel
  (/)
  */


  SPARQLDataSource.prototype.getOrganisationProjects = function(organisationId) {
    var q =" \
      SELECT (count(distinct(?o)) as ?numParticipants) ?project ?projectLabel \
      WHERE { \
        ?o a tsb:Organization . \
        ?o tsb:participatesIn ?project . \
        { \
          SELECT ?project ?projectLabel \
          WHERE { \
            ?project a tsb:Project . \
            ?project rdf:label ?projectLabel . \
            ?project tsb:hasParticipant  <" + organisationId + "> . \
          } \
        } \
      } \
      GROUP BY ?project ?projectLabel \
      ";

    return this.query(q);
  }

  SPARQLDataSource.prototype.getInstitutions = function(size) {
    if (!size) size = 'academic';
    var q =" \
    PREFIX tsb: <http://tsb-projects.labs.theodi.org/def/> \
    PREFIX esize: <http://tsb-projects.labs.theodi.org/def/concept/enterprise-size/> \
    PREFIX rdf: <http://www.w3.org/2000/01/rdf-schema#> \
    PREFIX w3: <http://www.w3.org/ns/org#> \
    PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> \
    SELECT ?org (count(?org) as ?numProjects) ?orgLabel ?orgRegion (?orgLat as ?lat) (?orgLng as ?lng) \
    WHERE { \
      ?org a tsb:Organization . \
      ?org rdf:label ?orgLabel . \
      ?org tsb:participatesIn ?project . \
      ?project a tsb:Project . \
      ?project rdf:label ?projectLabel . \
      ?org w3:hasSite ?orgSite . \
      ?orgSite tsb:region ?orgRegion . \
      ?orgSite geo:lat ?orgLat . \
      ?orgSite geo:long ?orgLng . \
      ?org tsb:enterpriseSize esize:"+size+" . \
    } \
    GROUP BY ?org ?orgLabel ?orgRegion ?orgLat ?orgLng\
    ";
    return this.query(q);
  }


  //org --participatesIn--> project -----------hasParticipant--> participant
  //                         competition                          label
  //                          priorityArea                          enterpriseSize
  //                           priorityAreaLabel                     label
  SPARQLDataSource.prototype.getOrganizationCollaborators = function(orgId) {
    var q =" \
    PREFIX tsb: <http://tsb-projects.labs.theodi.org/def/> \
    PREFIX esize: <http://tsb-projects.labs.theodi.org/def/concept/enterprise-size/> \
    PREFIX rdf: <http://www.w3.org/2000/01/rdf-schema#> \
    PREFIX w3: <http://www.w3.org/ns/org#> \
    PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> \
    select ?collaborator ?collaboratorLabel ?collaboratorSizeLabel ?priorityArea ?collaboratorRegion (?collaboratorLat as ?lat) (?collaboratorLng as ?lng) ?project \
    where { \
         <" + orgId + "> tsb:participatesIn ?project . \
         ?org tsb:participatesIn ?project . \
         ?project tsb:competition ?competition . \
         ?competition tsb:priorityArea ?priorityArea . \
         ?priorityArea rdf:label ?priorityAreaLabel . \
         ?project tsb:hasParticipant ?collaborator . \
         ?collaborator rdf:label ?collaboratorLabel . \
         ?collaborator tsb:enterpriseSize ?collaboratorSize . \
         ?collaborator w3:hasSite ?collaboratorSite . \
         ?collaboratorSite tsb:region ?collaboratorRegion . \
         ?collaboratorSite geo:lat ?collaboratorLat . \
         ?collaboratorSite geo:long ?collaboratorLng . \
         ?collaboratorSize rdf:label ?collaboratorSizeLabel . \
    } \
    group by ?collaborator ?collaboratorLabel ?collaboratorSizeLabel ?priorityArea ?collaboratorRegion ?collaboratorLat ?collaboratorLng ?project \
    ";
    return this.query(q);
  }


  SPARQLDataSource.prototype.getProjectsForYear = function(year) {
    var q =" \
    PREFIX tsb: <http://tsb-projects.labs.theodi.org/def/> \
    PREFIX ptime: <http://purl.org/NET/c4dm/timeline.owl#> \
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
    select ?priorityArea ?projectStartDate \
    where { \
        ?project a tsb:Project . \
        ?project tsb:projectDuration ?projectDuration . \
        ?projectDuration ptime:start ?projectStartDate . \
        ?project tsb:competition ?competition . \
        ?competition tsb:priorityArea ?priorityArea . \
        FILTER(?projectStartDate >= \""+year+"-01-01\"^^xsd:date) . \
        FILTER(?projectStartDate <= \""+year+"-12-31\"^^xsd:date) . \
    } \
    ";
    return this.query(q);
  }

  SPARQLDataSource.prototype.getProjectsAndParticipantsForYear = function(year) {
    var q =" \
    PREFIX tsb: <http://tsb-projects.labs.theodi.org/def/> \
    PREFIX ptime: <http://purl.org/NET/c4dm/timeline.owl#> \
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
    PREFIX rdf: <http://www.w3.org/2000/01/rdf-schema#> \
    select ?project ?projectLabel ?priorityArea ?participant ?participantLabel ?participantSizeLabel \
    where { \
        ?project a tsb:Project . \
        ?project tsb:projectDuration ?projectDuration . \
        ?projectDuration ptime:start ?projectStartDate . \
        ?project tsb:competition ?competition . \
        ?project tsb:hasParticipant ?participant . \
        ?project rdf:label ?projectLabel . \
        ?participant rdf:label ?participantLabel . \
        ?participant tsb:enterpriseSize ?participantSize . \
        ?participantSize rdf:label ?participantSizeLabel . \
        ?competition tsb:priorityArea ?priorityArea . \
        FILTER(?projectStartDate >= \""+year+"-01-01\"^^xsd:date) . \
        FILTER(?projectStartDate <= \""+year+"-12-31\"^^xsd:date) . \
    } \
    ";
    return this.query(q);
  }

  SPARQLDataSource.prototype.getAreaSummaryForYear = function(year) {
    var q =" \
      PREFIX tsb: <http://tsb-projects.labs.theodi.org/def/> \
      PREFIX ptime: <http://purl.org/NET/c4dm/timeline.owl#> \
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
      SELECT ?priorityArea (COUNT(?projectGrant) as ?numGrants) (SUM(?offerGrant) as ?grantsSum) ?year \
      WHERE { \
          ?project a tsb:Project . \
          ?project tsb:projectDuration ?projectDuration . \
          ?project tsb:supportedBy ?projectGrant . \
          ?projectGrant tsb:offerGrant ?offerGrant . \
          ?projectDuration ptime:start ?projectStartDate . \
          ?project tsb:competition ?competition . \
          ?competition tsb:priorityArea ?priorityArea . \
          FILTER(?projectStartDate >= \""+year+"-01-01\"^^xsd:date) . \
          FILTER(?projectStartDate <= \""+year+"-12-31\"^^xsd:date) . \
      } \
      GROUP BY ?priorityArea (YEAR(?projectStartDate) as ?year)\
    ";
    return this.query(q);
  }

  SPARQLDataSource.prototype.getAreaSummaryForYearInRegion = function(year, region) {
    var q =" \
      PREFIX tsb: <http://tsb-projects.labs.theodi.org/def/> \
      PREFIX ptime: <http://purl.org/NET/c4dm/timeline.owl#> \
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
      PREFIX w3: <http://www.w3.org/ns/org#> \
      SELECT ?priorityArea (COUNT(DISTINCT ?project) as ?numProjects) (COUNT(?projectGrant) as ?numGrants) (SUM(?offerGrant) as ?grantsSum) ?year \
      WHERE { \
          ?project a tsb:Project . \
          ?project tsb:projectDuration ?projectDuration . \
          ?project tsb:supportedBy ?projectGrant . \
          ?project tsb:hasParticipant ?participant . \
          ?participant w3:hasSite ?participantSite . \
          ?participantSite tsb:region <http://statistics.data.gov.uk/id/statistical-geography/" + region + "> .\
          ?projectGrant tsb:offerGrant ?offerGrant . \
          ?projectDuration ptime:start ?projectStartDate . \
          ?project tsb:competition ?competition . \
          ?competition tsb:priorityArea ?priorityArea . \
          FILTER(?projectStartDate >= \""+year+"-01-01\"^^xsd:date) . \
          FILTER(?projectStartDate <= \""+year+"-12-31\"^^xsd:date) . \
      } \
      GROUP BY ?priorityArea (YEAR(?projectStartDate) as ?year)\
    ";
    return this.query(q);
  }

  return SPARQLDataSource;
})();