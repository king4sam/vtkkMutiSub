
'use strict';

console.info('contentscript!!');
window._mutiSubs = new Map();

window.addEventListener('message', function(receivedMessage) {
  if (receivedMessage.data.source === 'subUrl') {
    const lang = receivedMessage.data.lang;
    console.log('got message from suburl', receivedMessage);
    console.log('fetching... ' + receivedMessage.data.lang);

    function getVtt(response) {
      const vtt = response.text();
      return vtt;
    }

    function addSubs(vtt) {
      if (!window._mutiSubs.has(lang)) {
        window._mutiSubs.set(lang, vtt);
      }
    }

    fetch(receivedMessage.data.url)
    .then(getVtt)
    .then(addSubs);
  }
});

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
