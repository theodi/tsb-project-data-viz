var tsb = tsb || {};

tsb.config = {};
tsb.config.domain = 'http://tsb-projects.labs.theodi.org/';
tsb.config.sparqlEndpoint = 'http://tsb-projects.labs.theodi.org/sparql.json';
tsb.config.budgetAreaBase = 'http://tsb-projects.labs.theodi.org/id/budget-area/';

tsb.config.odiColors = [
  '#2254F4', '#00B7FF', '#08DEF9', '#1DD3A7',
  '#0DBC37', '#67EF67', '#F9BC26', '#FF6700',
  '#D60303', '#EF3AAB', '#E6007C', '#B13198'
];

tsb.config.regionsMap = {
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

tsb.config.themes = {
  odi: {
    budgetAreaColor : {
      'TRAN'            : '#FF0000',
      'TECH'            : '#FF0000',
      'MANF'            : '#FF0000',
      'SUST'            : '#FF0000',
      'tsb-programmes'  : '#FF0000',
      'DIGS'            : '#FF0000',
      'ENRG'            : '#FF0000',
      'HLTHCR'          : '#FF0000',
      'SPAC'            : '#FF0000',
    }
  }
}


