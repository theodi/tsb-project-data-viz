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

tsb.config.bugetAreas = [ 'TRAN', 'TECH', 'MANF', 'SUST', 'tsb-programmes', 'DIGS', 'ENRG', 'HLTHCR', 'SPAC'];

tsb.config.themes = {
  odiDark: {
    introTextColor: '#FFFFFF',
    introTextFontWegith: 100,
    introBgColor: '#222222',
    budgetAreaColorAlpha: 0.65,
    budgetAreaColor : {
      'TRAN'            : '#00B7FF',
      'TECH'            : '#D60303',
      'MANF'            : '#FF6700',
      'SUST'            : '#0DBC37',
      'tsb-programmes'  : '#B13198',
      'DIGS'            : '#EF3AAB',
      'ENRG'            : '#F9BC26',
      'HLTHCR'          : '#1DD3A7',
      'SPAC'            : '#08DEF9',
    },
    priorityAreasBgColor: '#FFFFFF'
  },
  odiBright: {
    introTextColor: '#3333333',
    introTextFontWegith: 100,
    introBgColor: '#EEEEEE',
    budgetAreaColorAlpha: 0.15,
    budgetAreaColor : {
      'TRAN'            : '#00B7FF',
      'TECH'            : '#D60303',
      'MANF'            : '#FF6700',
      'SUST'            : '#0DBC37',
      'tsb-programmes'  : '#B13198',
      'DIGS'            : '#EF3AAB',
      'ENRG'            : '#F9BC26',
      'HLTHCR'          : '#1DD3A7',
      'SPAC'            : '#08DEF9',
    },
    priorityAreasBgColor: '#FFFFFF'
  }
}

tsb.config.themes.current = tsb.config.themes.odiDark;
//tsb.config.themes.current = tsb.config.themes.odiBright;

