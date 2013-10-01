var DataSet = (function() {

  function extract(list, propertyName) {
    return list.map(function(item) { return item[propertyName] || 'Unknown' });
  }

  function unique(list) {
    var values = {};
    var result = [];
    list.forEach(function(value) {
      if (!values[value]) {
        values[value] = true;
        result.push(value);
      }
    });
    return result;
  }

  function DataSet() {
    this.rows = [];
  }

  DataSet.fromArray = function(array) {
    var ds = new DataSet();
    ds.rows = array;
    ds.columns = [];
    for(var columnName in array[0]) {
      ds.columns.push(columnName);
    }
    return ds;
  }

  DataSet.prototype.uniqueValues = function(fieldName) {
    return unique(extract(this.rows, fieldName));
  }

  DataSet.prototype.groupBy = function(fieldName) {
    var groups = {};
    groups.uniqueValues = [];
    this.rows.forEach(function(item) {
      if (!groups[item[fieldName]]) {
        groups[item[fieldName]] = new DataSet();
        groups.uniqueValues.push(fieldName);
      }
      groups[item[fieldName]].rows.push(item);
    })
    return groups;
  }

  return DataSet;

})();
