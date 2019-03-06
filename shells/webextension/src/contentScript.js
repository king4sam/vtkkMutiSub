'use strict';

const langMap = new Map([['ja', '日文'], ['zhHant', '繁體中文']]);

window._mutiSubs = new Map();
window._observers = [];
var langs = document.querySelector('#app-mount-point > div > div:nth-child(1) > div > div > div.video-wrapper.js-fs-wrapper > div.video-controls.yapi-controls > div.video-controls-main.yapi-panel > div.video-bottom-wrapper > div.rejc-dropdown.video-btn.btn--subtitle > div.rejc-dropdown__menu > ul').childNodes;

window.addEventListener('message', function(receivedMessage) {
  if (receivedMessage.data.source === 'subUrl') {
    const lang = receivedMessage.data.lang;
    console.info('got message from suburl', receivedMessage);
    console.info('fetching... ' + receivedMessage.data.lang);

    function getVtt(response) {
      const vtt = response.text();
      return vtt;
    }

    function addSubs(vtt) {
      if (!window._mutiSubs.has(lang)) {
        window._mutiSubs.set(lang, vtt);
        if (window._mutiSubs.size === langs.length - 2) {
          window.postMessage({
            source: 'subEnough',
          }, '*');
          makeSecondaryMenu();
        }
      }
    }

    fetch(receivedMessage.data.url)
      .then(getVtt)
      .then(addSubs);
  }
});

import getSubUrl from './getSubUrl';

var js = (
  '(function () {' +
  ' var tid = setInterval(' + getSubUrl.toString() + ', 5000);' +
  ' window.addEventListener("message", function(receivedMessage) {' +
  '   if (receivedMessage.data.source === "subEnough") {' +
  '     clearInterval(tid);' +
  '   }' +
  ' })' +
  '})();'
);


var script = document.createElement('script');
script.textContent = js;
document.documentElement.appendChild(script);
script.parentNode.removeChild(script);

function makeSecondaryMenu() {
  function enableSecondarySubtitle(lang) {
    console.info('enable : ', lang);
    window._observers.forEach(ob => ob.disconnect());
    window._observers = [];

    var vtt = window._mutiSubs.get(lang);

    var cues = vtt.split('\n\n').filter(cue => {
      return cue.includes('-->');
    });

    var video = document.querySelector('#app-mount-point > div > div:nth-child(1) > div > div > div.video-wrapper.js-fs-wrapper > div.dash-video-player > video');

    var cueElement = document.querySelector('#app-mount-point > div > div:nth-child(1) > div > div > div.video-wrapper.js-fs-wrapper > div.js-cue-overlay.cue-overlay');

    function calculateSeconds(timestr) {
      const regex = /(?<hour>\d{2}):(?<minute>\d{2}):(?<second>\d{2})/g;
      let m;
      let seconds = null;
      while ((m = regex.exec(timestr)) !== null) {
        if (m.index === regex.lastIndex) {
          regex.lastIndex++;
        }

        seconds = 0;
        seconds = parseInt(m.groups.hour, 10) * 3600 + parseInt(m.groups.minute, 10) * 60 + parseInt(m.groups.second, 10);
      }
      return seconds;
    }

    var structuredCues = cues.map(cue => {
      const arys = cue.split('\n');
      const times = arys[0].split('-->');
      const startTime = calculateSeconds(times[0]);
      const endTime = calculateSeconds(times[1]);
      arys.shift();
      return {
        startTime,
        endTime,
        sayings: arys.join(' '),
      };
    });

    function get2Cues() {
      var current = video.currentTime;
      var toShow = structuredCues.filter(cue => {
        return current >= cue.startTime && current <= cue.endTime;
      }).map(cur => cur.sayings)
        .reduce(function(acc, cur) {
          return acc + cur;
        }, '');
      return toShow;
    }

    var cueObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        var nowcues = get2Cues();
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0 && mutation.target.className.indexOf('cue-overlay ') !== -1 && mutation.target.innerText.indexOf(nowcues) === -1) {
          mutation.target.innerText = mutation.target.innerText + '\n' + nowcues;
        }
      });
    });

    // configuration of the observer:
    var config = {
      childList: true,
    };

    // pass in the target node, as well as the observer options
    cueObserver.observe(cueElement, config);

    window._observers.push(cueObserver);
  }
  var menu = document.querySelector('#app-mount-point > div > div:nth-child(1) > div > div > div.video-wrapper.js-fs-wrapper > div.video-controls.yapi-controls > div.video-controls-main.yapi-panel > div.video-bottom-wrapper > div.rejc-dropdown.video-btn.btn--subtitle > div.rejc-dropdown__menu');
  var ul = document.createElement('ul');
  var headli = document.createElement('li');
  headli.innerText = '第二字幕';
  ul.appendChild(headli);
  window._mutiSubs.forEach((value, key) => {
    const li = document.createElement('li');
    li.id = key;
    const check = document.createElement('span');
    check.classList.add('kktv');
    li.appendChild(check);
    const lang = document.createElement('span');
    lang.innerText = langMap.get(key);
    li.appendChild(lang);
    li.addEventListener('click', function() {
      var siblings = Array.apply(null, this.parentNode.childNodes).slice(1);
      siblings.forEach(ele => {
        ele.firstChild.classList.remove('kktv-check');
      });
      this.firstChild.classList.add('kktv-check');
      enableSecondarySubtitle(this.id);
    });
    ul.appendChild(li);
  });
  menu.appendChild(ul);
  menu.style.display = 'inline-flex';
}
