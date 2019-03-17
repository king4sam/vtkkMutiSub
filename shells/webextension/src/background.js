// handle page action icon
chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
  chrome.declarativeContent.onPageChanged.addRules([
    {
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: { hostEquals: 'https://www.kktv.me/play' },
        }),
      ],
      actions: [new chrome.declarativeContent.ShowPageAction()],
    },
  ]);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log(changeInfo);
  if (changeInfo.status === 'loading' && changeInfo.url.includes('https://www.kktv.me/play/')) {
    chrome.tabs.sendMessage(tabId, { operation: 'retry' });
  }
});

console.log('background');
