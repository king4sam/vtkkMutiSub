import getSubUrl from './getSubUrl';

const langMap = new Map([['ja', '日文'], ['zhHant', '繁體中文']]);

window._mutiSubs = new Map();
window._observers = [];

// create secondary menu 
const secondaryMenu = document.querySelector('#app-mount-point > div > div:nth-child(1) > div > div > div.video-wrapper.js-fs-wrapper > div.video-controls.yapi-controls > div.video-controls-main.yapi-panel > div.video-bottom-wrapper > div.rejc-dropdown.video-btn.btn--subtitle > div.rejc-dropdown__menu');
const langList = document.createElement('ul');
const dummyHead = document.createElement('li');
dummyHead.innerText = '第二字幕';
langList.appendChild(dummyHead);
secondaryMenu.appendChild(langList);
secondaryMenu.style.display = 'inline-flex';

const disableAllItem = genMenuListItem('無字幕', () => {
  window._observers.forEach(ob => ob.disconnect());
  window._observers = [];
});

langList.appendChild(disableAllItem);

function genMenuListItem(lang, fn) {
  const li = document.createElement('li');
  li.id = lang;
  const check = document.createElement('span');
  check.classList.add('kktv');
  li.appendChild(check);
  const langText = document.createElement('span');
  langText.innerText = lang === '無字幕'? lang: langMap.get(lang);
  li.appendChild(langText);
  li.addEventListener('click', fn);
  return li;
}

// language list item onclick handler
function secondarySubtitleOnclick() {
  const language = this.id;
  const siblings = Array.apply(null, this.parentNode.childNodes).slice(1);
  siblings.forEach(ele => {
    ele.firstChild.classList.remove('kktv-check');
  });
  this.firstChild.classList.add('kktv-check');

  console.info('enable : ', language);
  window._observers.forEach(ob => ob.disconnect());
  window._observers = [];

  var vtt = window._mutiSubs.get(language);

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


// hanlde get subUrl message 
window.addEventListener('message', async function(receivedMessage) {
  const numLangs = document.querySelector('#app-mount-point > div > div:nth-child(1) > div > div > div.video-wrapper.js-fs-wrapper > div.video-controls.yapi-controls > div.video-controls-main.yapi-panel > div.video-bottom-wrapper > div.rejc-dropdown.video-btn.btn--subtitle > div.rejc-dropdown__menu > ul').children.length - 2;
  if (receivedMessage.data.source === 'subUrl') {
    const lang = receivedMessage.data.lang;
    console.info('got message from suburl', receivedMessage);
    console.info('fetching... ' + receivedMessage.data.lang);

    const vtt = await fetch(receivedMessage.data.url).then(res => res.text());

    if (!window._mutiSubs.has(lang)) {
      window._mutiSubs.set(lang, vtt);

      const li = genMenuListItem(lang, secondarySubtitleOnclick);
      langList.appendChild(li);
      
      if (window._mutiSubs.size === numLangs) {
        // stop time interval
        window.postMessage({
          source: 'subEnough',
        }, '*');
      }
    }
  }
});

// injection, run in top world
const js = (
  '(function () {' +
  ' var tid = setInterval(' + getSubUrl.toString() + ', 5000);' +
  ' window.addEventListener("message", function(receivedMessage) {' +
  '   if (receivedMessage.data.source === "subEnough") {' +
  '     clearInterval(tid);' +
  '   }' +
  ' })' +
  '})();'
);

const script = document.createElement('script');
script.textContent = js;
document.documentElement.appendChild(script);
script.parentNode.removeChild(script);

