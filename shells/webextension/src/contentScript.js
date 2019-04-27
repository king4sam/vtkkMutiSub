import getSubUrl from './getSubUrl';

const configFontSize = '4vh';
const subCueId = 'subCue';
const cueOverlay = 'cue-overlay';
const kktvCheck = 'kktv-check';
const cueWrapperId = 'cueWrapper';
const disableSubtitle = 'disableSubtitle';
const vtkkSecondSubtitleId = 'vtkkSecondSubtitle';

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
window._renderer = [];

function getLocaleText(str) {
  return chrome.i18n.getMessage(str);
}

function clearCueRender() {
  window._renderer.forEach(renderer => clearInterval(renderer));
  window._renderer = [];
  const cue = document.getElementById(subCueId);
  if (cue) {
    cue.innerText = '';
  }
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

// language list item onclick handler
function secondarySubtitleOnclick() {
  const language = this.id;
  const siblings = Array.apply(null, this.parentNode.childNodes).slice(1);
  siblings.forEach(ele => {
    ele.firstChild.classList.remove(kktvCheck);
  });
  this.firstChild.classList.add(kktvCheck);

  clearCueRender();
  if (language !== disableSubtitle) {
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

    const timer = setInterval(() => {
      const nowcues = getCurrentCues(structuredCues);

      const originCue = document.querySelector(originCueSelector);

      let cueWrapper = document.getElementById(cueWrapperId);

      const videoWrapper = document.querySelector(videoWrapperSelector);

      const subCue = document.getElementById(subCueId);

      if (!cueWrapper) {
        const cueWrapperEle = document.createElement('div');
        cueWrapperEle.id = cueWrapperId;
        cueWrapperEle.appendChild(originCue);
        originCue.classList.remove(cueOverlay);
        cueWrapperEle.classList.add(cueOverlay);
        cueWrapper = cueWrapperEle;
        videoWrapper.appendChild(cueWrapperEle);
      }

      if (!subCue) {
        const secSubEle = document.createElement('div');
        secSubEle.id = subCueId;
        secSubEle.style.fontSize = configFontSize;
        secSubEle.innerText = `${nowcues}`;
        cueWrapper.appendChild(secSubEle);
      } else if (subCue.innerText !== nowcues) {
        subCue.innerText = `${nowcues}`;
      }
    }, 200);

    window._renderer.push(timer);
  }
}

async function receiveMessageHandler(receivedMessage) {
  const numLangs =
    (document.querySelector(langSelectSelector) || { children: [] }).children.length - 2;
  if (receivedMessage.data.source === 'subUrl') {
    const lang = receivedMessage.data.lang;
    console.info('got message from suburl', receivedMessage);
    console.info('fetching... ' + receivedMessage.data.lang);

    const vtt = await fetch(receivedMessage.data.url).then(res => res.text());

    if (!window._mutiSubs.has(lang)) {
      window._mutiSubs.set(lang, vtt);
      const langList = document.getElementById(vtkkSecondSubtitleId);
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
}

function setupLangMenu() {
  // create secondary menu
  const vtkkSecondSubtitle = document.getElementById(vtkkSecondSubtitleId);
  if (vtkkSecondSubtitle) {
    vtkkSecondSubtitle.parentNode.removeChild(vtkkSecondSubtitle);
  }

  const secondaryMenu = document.querySelector(secondaryMenuSelector);
  const langList = document.createElement('ul');
  langList.id = vtkkSecondSubtitleId;

  const dummyHead = document.createElement('li');
  try {
    dummyHead.innerText = getLocaleText('secondarySubtitle');
    langList.appendChild(dummyHead);
    secondaryMenu.appendChild(langList);
    secondaryMenu.style.display = 'inline-flex';
    langList.appendChild(
      genMenuListItem({
        lang: disableSubtitle,
        onclickcb: secondarySubtitleOnclick,
      })
    );
  } catch (error) {
    console.error('no menu');
  }

  // hanlde get subUrl message
  window.addEventListener('message', receiveMessageHandler);

  // injection, run in top world
  const js =
    '(function () {' +
    'console.info("injec suc");' +
    ' let tid = setInterval(' +
    getSubUrl.toString() +
    ', 5000);' +
    ' window.addEventListener("message", function(receivedMessage) {' +
    '   if (receivedMessage.data.source === "subEnough") {' +
    '     clearInterval(tid);' +
    '     console.info("subEnough");' +
    '   }' +
    ' })' +
    '})();';

  const script = document.createElement('script');
  script.textContent = js;
  document.documentElement.appendChild(script);
  script.parentNode.removeChild(script);
}

chrome.runtime.onMessage.addListener(function(request, sender) {
  // retry
  console.info('receive message', request);
  clearCueRender();
  window._mutiSubs.clear();
  window._renderer = [];
  window.removeEventListener('message', receiveMessageHandler);
  setupLangMenu();
});
