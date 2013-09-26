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

  return DataSet;

})();
