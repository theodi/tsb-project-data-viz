var tsb = {
  viz : {},
  state : {
    w : window.innerWidth,
    h : 480,
    svg : null
  }
};

tsb.common = tsb.common || {};

tsb.common.extractPriorityAreaCode = function(priorityArea) {
  return priorityArea.substr(priorityArea.lastIndexOf('/') + 1);
}

tsb.common.inital = function(list, n) {
  return list.slice(0, n);
}

tsb.common.randomInRange = function(a, b) {
  return a + Math.random() * (b - a);
}

tsb.common.max = function(list, prop) {
  var m = 0;
  list.forEach(function(o) {
    if (o[prop] > m) {
      m = o[prop];
    }
  })
  return m;
}

tsb.common.keys = function(o) {
  var keys = [];
  for(var i in o) {
    keys.push(i);
  }
  return keys;
}

tsb.common.getMaxWidth = function(windowWidth) {
  var maxWidth;
  //tab stops based on http://getbootstrap.com/css/#grid
  if (windowWidth >= 1200) maxWidth = 1170;
  else if (windowWidth >= 992) maxWidth = 970;
  else if (windowWidth >= 768) maxWidth = 750;
  else maxWidth = windowWidth;

  return maxWidth;
}

tsb.common.log = function() {
  if (window.console) {
    window.console.log.apply(window.console, arguments);
  }
}

tsb.common.isMobile = (function() {
  var iOS = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );
  var Android = navigator.userAgent.toLowerCase().indexOf("android") > -1;
  var WindowsMobile = ( navigator.userAgent.match(/(Windows Phone)/g) ? true : false );
  var smallDevice = window.innerWidth <= 1024;
  var mobile = iOS || Android || WindowsMobile || smallDevice;
  return function() {
    return mobile;
  }
})();