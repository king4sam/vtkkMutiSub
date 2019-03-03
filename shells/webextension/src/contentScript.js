
'use strict';

console.info('contentscript!!');
var getSubUrl = require('./getSubUrl');

var js = (
  'setTimeout(' + getSubUrl.toString() + ', 5000);'
//   ';(' + getSubUrl.toString() + '(window))'
);

// This script runs before the <head> element is created, so we add the script
// to <html> instead.
var script = document.createElement('script');
script.textContent = js;
document.documentElement.appendChild(script);
script.parentNode.removeChild(script);
console.log('contentscript!!');

