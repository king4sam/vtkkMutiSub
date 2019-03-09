import getSubUrl from './getSubUrl';

function getLocaleText(str) {
  return chrome.i18n.getMessage(str);
}

const secondaryMenuSelector =
  '#app-mount-point > div > div:nth-child(1) > div > div > div.video-wrapper.js-fs-wrapper > div.video-controls.yapi-controls > div.video-controls-main.yapi-panel > div.video-bottom-wrapper > div.rejc-dropdown.video-btn.btn--subtitle > div.rejc-dropdown__menu';
const videoSelector =
  '#app-mount-point > div > div:nth-child(1) > div > div > div.video-wrapper.js-fs-wrapper > div.dash-video-player > video';
const originCueSelector =
  '#app-mount-point > div > div:nth-child(1) > div > div > div.video-wrapper.js-fs-wrapper > div.js-cue-overlay.cue-overlay';
const videoWrapperSelector =
  '#app-mount-point > div > div:nth-child(1) > div > div > div.video-wrapper.js-fs-wrapper';
const langSelectSelector =
  '#app-mount-point > div > div:nth-child(1) > div > div > div.video-wrapper.js-fs-wrapper > div.video-controls.yapi-controls > div.video-controls-main.yapi-panel > div.video-bottom-wrapper > div.rejc-dropdown.video-btn.btn--subtitle > div.rejc-dropdown__menu > ul';

window._mutiSubs = new Map();
window._observers = [];

// create secondary menu
const secondaryMenu = document.querySelector(secondaryMenuSelector);
const langList = document.createElement('ul');
const dummyHead = document.createElement('li');
dummyHead.innerText = getLocaleText('secondarySubtitle');
langList.appendChild(dummyHead);
secondaryMenu.appendChild(langList);
secondaryMenu.style.display = 'inline-flex';
langList.appendChild(
  genMenuListItem({
    lang: 'disableSubtitle',
    onclickcb: () => {
      window._observers.forEach(ob => ob.disconnect());
      window._observers = [];
    },
  })
);

function genMenuListItem({ lang, onclickcb }) {
  const li = document.createElement('li');
  li.id = lang;
  const check = document.createElement('span');
  check.classList.add('kktv');
  li.appendChild(check);
  const langText = document.createElement('span');
  langText.innerText = getLocaleText(lang);
  li.appendChild(langText);
  li.addEventListener('click', onclickcb);
  return li;
}

function getCurrentCues(structuredCues) {
  const video = document.querySelector(videoSelector);
  const current = video.currentTime * 1000;
  const toShow = structuredCues
    .filter(cue => {
      return current >= cue.startTime && current <= cue.endTime;
    })
    .map(cur => cur.sayings)
    .reduce(function(acc, cur) {
      return acc + cur;
    }, '');
  return toShow;
}

// language list item onclick handler
function secondarySubtitleOnclick() {
  const language = this.id;
  const siblings = Array.apply(null, this.parentNode.childNodes).slice(1);
  siblings.forEach(ele => {
    ele.firstChild.classList.remove('kktv-check');
  });
  this.firstChild.classList.add('kktv-check');

  window._observers.forEach(ob => ob.disconnect());
  window._observers = [];

  if (language !== getLocaleText('disableSubtitle')) {
    console.info('enable : ', language);
    const vtt = window._mutiSubs.get(language);

    const cues = vtt.split('\n\n').filter(cue => {
      return cue.includes('-->');
    });

    const structuredCues = cues.map(cue => {
      const arys = cue.split('\n');
      const times = arys[0].split('-->');
      const startTime = calculateMilliseconds(times[0]);
      const endTime = calculateMilliseconds(times[1]);
      arys.shift();
      return {
        startTime,
        endTime,
        sayings: arys.join(' '),
      };
    });

    setInterval(() => {
      const nowcues = getCurrentCues(structuredCues);
      console.info(nowcues);

      const originCue = document.querySelector(originCueSelector);

      let cueWrapper = document.getElementById('cueWrapper');

      const videoWrapper = document.querySelector(videoWrapperSelector);

      const subCue = document.getElementById('subCue');

      if (!cueWrapper) {
        const cueWrapperEle = document.createElement('div');
        cueWrapperEle.id = 'cueWrapper';
        cueWrapperEle.appendChild(originCue);
        originCue.classList.remove('cue-overlay');
        cueWrapperEle.classList.add('cue-overlay');
        cueWrapper = cueWrapperEle;
        videoWrapper.appendChild(cueWrapperEle);
      }

      if (!subCue) {
        const secSubEle = document.createElement('div');
        secSubEle.id = 'subCue';
        secSubEle.style.fontSize = '4vh';
        secSubEle.innerText = `${nowcues}`;
        cueWrapper.appendChild(secSubEle);
      } else {
        subCue.innerText = `${nowcues}`;
      }
    }, 200);
  }
}

function calculateMilliseconds(timestr) {
  const regex = /(?<hour>\d{2}):(?<minute>\d{2}):(?<second>\d{2}).(?<ms>\d{3})/g;
  let m;
  let milliseconds = null;
  while ((m = regex.exec(timestr)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    milliseconds = 0;
    milliseconds =
      parseInt(m.groups.hour, 10) * 3600000 +
      parseInt(m.groups.minute, 10) * 60000 +
      parseInt(m.groups.second, 10) * 1000 +
      parseInt(m.groups.ms, 10);
  }
  return milliseconds;
}

// hanlde get subUrl message
window.addEventListener('message', async function(receivedMessage) {
  const numLangs = document.querySelector(langSelectSelector).children.length - 2;
  if (receivedMessage.data.source === 'subUrl') {
    const lang = receivedMessage.data.lang;
    console.info('got message from suburl', receivedMessage);
    console.info('fetching... ' + receivedMessage.data.lang);

    const vtt = await fetch(receivedMessage.data.url).then(res => res.text());

    if (!window._mutiSubs.has(lang)) {
      window._mutiSubs.set(lang, vtt);

      const li = genMenuListItem({ lang, onclickcb: secondarySubtitleOnclick });
      langList.appendChild(li);

      if (window._mutiSubs.size === numLangs) {
        // stop time interval
        window.postMessage(
          {
            source: 'subEnough',
          },
          '*'
        );
      }
    }
  }
});

// injection, run in top world
const js =
  '(function () {' +
  ' let tid = setInterval(' +
  getSubUrl.toString() +
  ', 5000);' +
  ' window.addEventListener("message", function(receivedMessage) {' +
  '   if (receivedMessage.data.source === "subEnough") {' +
  '     clearInterval(tid);' +
  '   }' +
  ' })' +
  '})();';

const script = document.createElement('script');
script.textContent = js;
document.documentElement.appendChild(script);
script.parentNode.removeChild(script);
