var tsb = tsb || {};

tsb.config = {};
tsb.config.domain = 'http://tsb-projects.labs.theodi.org/';
tsb.config.sparqlEndpoint = 'http://tsb-projects.labs.theodi.org/sparql.json';
tsb.config.budgetAreaBase = 'http://tsb-projects.labs.theodi.org/id/budget-area/';
tsb.config.ukMapSVG = 'assets/United_Kingdom_Map_-_Region.svg';

tsb.config.odiColors = [
  '#2254F4', '#00B7FF', '#08DEF9', '#1DD3A7',
  '#0DBC37', '#67EF67', '#F9BC26', '#FF6700',
  '#D60303', '#EF3AAB', '#E6007C', '#B13198'
];

tsb.config.regionsMap = {
  'E12000001' : { index:  0, name: 'North East', id: 'NorthEast'} ,
  'E12000002' : { index:  1, name: 'North West', id: 'NorthWest'} ,
  'E12000003' : { index:  2, name: 'Yorkshire and The Humber', id: 'YorkshireAndTheHumber'} ,
  'E12000004' : { index:  3, name: 'East Midlands', id: 'EastMidlands'} ,
  'E12000005' : { index:  4, name: 'West Midlands', id: 'WestMidlands'} ,
  'E12000006' : { index:  5, name: 'East of England', id: 'EastOfEngland'} ,
  'E12000007' : { index:  6, name: 'London', id: 'London'} ,
  'E12000008' : { index:  7, name: 'South East', id: 'SouthEast'} ,
  'E12000009' : { index:  8, name: 'South West', id: 'SouthWest'} ,
  'S92000003' : { index:  9, name: 'Scotland', id: 'Scotland'} ,
  'N92000002' : { index: 10, name: 'Northern Ireland', id: 'NorthernIreland'} ,
  'W92000004' : { index: 11, name: 'Wales', id: 'Wales' }
};

tsb.config.budgetAreas = [ 'SPAC', 'TRAN', 'TECH', 'MANF', 'SUST', 'tsb-programmes', 'DIGS', 'ENRG', 'HLTHCR' ];
tsb.config.budgetAreaLabels = {
  'SPAC' : 'Space',
  'TRAN' : 'Transport',
  'TECH' : 'Technology',
  'MANF' : 'Manufacturing',
  'SUST' : 'Sustainability',
  'tsb-programmes' : 'TSB Programmes',
  'DIGS' : 'Digital',
  'ENRG' : 'Energy' ,
  'HLTHCR' : 'Healthcare'
};

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
      'SPAC'            : '#08DEF9'
    },
    priorityAreasBgColor: '#FFFFFF',
    collaborationsBgColor: '#FFFFFF',
    regionsBgColor: '#FFFFFF'
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
    priorityAreasBgColor: '#FFFFFF',
    collaborationsBgColor: '#FFFFFF',
    regionsBgColor: '#FFFFFF'
  }
}

tsb.config.themes.current = tsb.config.themes.odiDark;
//tsb.config.themes.current = tsb.config.themes.odiBright;

