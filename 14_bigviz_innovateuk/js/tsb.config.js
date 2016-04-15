var tsb = tsb || {};



tsb.config = {};
tsb.config.oldDomain = 'http://tsb-projects.labs.theodi.org/'
tsb.config.domain = 'http://innovateuk.publishmydata.com/';
tsb.config.sparqlEndpoint = 'http://innovateuk.publishmydata.com/sparql.json';
tsb.config.ukMapSVG = 'assets/United_Kingdom_Map_-_Region.svg';

tsb.config.text = {};
tsb.config.text.introTitle = 'In YEAR we funded ';
tsb.config.text.introTitle2 = 'NUMPROJECTS innovative projects';
tsb.config.text.priorityAreasTitle = 'Funding by priority area during START - END';
tsb.config.text.regionsTitle = 'Funding by geographical region';
tsb.config.text.regionsTitle2 = 'based on location of head offices';
tsb.config.text.collaborationsTitle = 'Organizations, projects and collaborators';

tsb.config.odiColors = [
  '#2254F4', '#00B7FF', '#08DEF9', '#1DD3A7',
  '#0DBC37', '#67EF67', '#F9BC26', '#FF6700',
  '#D60303', '#EF3AAB', '#E6007C', '#B13198'
];

tsb.config.odiUsedColors = [
  '#00B7FF', '#D60303', '#FF6700', '#0DBC37',
  '#B13198', '#EF3AAB', '#F9BC26', '#1DD3A7',
  '#08DEF9',
];

tsb.config.regionCodeList = ['N92000002','E12000009','W92000004','E12000005','E12000002','S92000003','E12000001','E12000003','E12000004','E12000006','E12000007','E12000008'];

tsb.config.regionsMap = {
  'N92000002' : { name: 'Northern Ireland', id: 'NorthernIreland'} ,
  'E12000009' : { name: 'South West', id: 'SouthWest'} ,
  'W92000004' : { name: 'Wales', id: 'Wales' },
  'E12000005' : { name: 'West Midlands', id: 'WestMidlands'} ,
  'E12000002' : { name: 'North West', id: 'NorthWest'} ,
  'S92000003' : { name: 'Scotland', id: 'Scotland'} ,
  'E12000001' : { name: 'North East', id: 'NorthEast'} ,
  'E12000003' : { name: 'Yorkshire and The Humber', id: 'YorkshireAndTheHumber'} ,
  'E12000004' : { name: 'East Midlands', id: 'EastMidlands'} ,
  'E12000006' : { name: 'East of England', id: 'EastOfEngland'} ,
  'E12000007' : { name: 'London', id: 'London'} ,
  'E12000008' : { name: 'South East', id: 'SouthEast'}
};


tsb.config.priorityAreas = [
    'unknown','large','transport','healthcare','catapult','NREC',
    'high-value-manufacturing','energy','EPES','advanced-materials',
    'sustainability','buildings','ICT','digital','bioscience','SAF',
    'low-impact-buildings','nanotechnology','development','urban-living',
    'space','manufacturing','responsive','TSB-programmes','KTP','BISF','SBRI'
];

tsb.config.priorityAreaLabels = {
    'unknown':'Unknown',
    'large':'Large',
    'transport':'Transport',
    'healthcare':'Healthcare',
    'catapult':'Catapult',
    'NREC':'NREC',
    'high-value-manufacturing':'High Value Manufacturing',
    'energy':'Energy',
    'EPES':'EPES',
    'advanced-materials':'Advanced Materials',
    'sustainability':'Sustainability',
    'buildings':'Buildings',
    'ICT':'ICT',
    'digital':'Digital',
    'bioscience':'Bioscience',
    'SAF':'SAF',
    'low-impact-buildings':'Low Impact Buildings',
    'nanotechnology':'Nanotechnology',
    'development':'Development',
    'urban-living':'Urban Living',
    'space':'Space',
    'manufacturing':'Manufacturing',
    'responsive':'Responsive',
    'TSB-programmes':'TSB Programmes',
    'KTP':'KTP',
    'BISF':'BISF',
    'SBRI':'SBRI'
};

tsb.config.introVizBtnLabels = ['PRIORITY AREAS', 'REGIONS', 'COLLABORATIONS'];
tsb.config.introVizBtnLinks = ['#priorityareas', '#regions', '#collaborations'];

tsb.config.themes = {
  odiDark: {
    defaultTextColor: '#222222',
    containerMargin: 15,
    titleFontSize: 38,
    titleFontWeight: 300,
    subTitleFontWeight: 100,
    introTextColor: '#FFFFFF',
    introSubTitleTextColor: '#AAA',
    introTextFontWeight: 100,
    introBgColor: '#222222',
    introVizBtnFontSize: 24,
    introVizBtnBgColor: '#09c', //#DDDDDD',
    introVizBtnLabelColors3: ['#00bb4d', '#00b7fa', '#FFDD00'],
    introVizBtnLabelColors2: ['#0DBC37', '#00B7FF', '#F9BC26'],
    introVizBtnLabelColors: ['#FFF', '#FFF', '#FFF'],
    priorityAreaColorAlpha: 0.55,
    priorityAreaColor : {
      //TODO: group new categories
      'unknown'                        :'#00B7FF',
      'large'                          :'#D60303',
      'transport'                      :'#FF6700',
      'healthcare'                     :'#0DBC37',
      'catapult'                       :'#B13198',
      'NREC'                           :'#EF3AAB',
      'high-value-manufacturing'       :'#F9BC26',
      'energy'                         :'#1DD3A7',
      'EPES'                           :'#08DEF9',
      'advanced-materials'             :'#00B7FF',
      'sustainability'                 :'#D60303',
      'buildings'                      :'#FF6700',
      'ICT'                            :'#0DBC37',
      'digital'                        :'#B13198',
      'bioscience'                     :'#EF3AAB',
      'SAF'                            :'#F9BC26',
      'low-impact-buildings'           :'#1DD3A7',
      'nanotechnology'                 :'#08DEF9',
      'development'                    :'#00B7FF',
      'urban-living'                   :'#D60303',
      'space'                          :'#FF6700',
      'manufacturing'                  :'#0DBC37',
      'responsive'                     :'#B13198',
      'TSB-programmes'                 :'#EF3AAB',
      'KTP'                            :'#F9BC26',
      'BISF'                           :'#1DD3A7',
      'SBRI'                           :'#08DEF9'
    },
    priorityAreasBgColor: '#FFFFFF',
    collaborationsBgColor: '#FFFFFF',
    regionsBgColor: '#FFFFFF',
    regionsRegionColor: '#999',
    regionsRegionHighlighColor: '#000'
  }
}

tsb.config.themes.current = tsb.config.themes.odiDark;

tsb.config.minYear = 2011;
tsb.config.maxYear = (new Date()).getFullYear();
tsb.config.currentYear = (new Date()).getFullYear() - 1;
