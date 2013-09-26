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
