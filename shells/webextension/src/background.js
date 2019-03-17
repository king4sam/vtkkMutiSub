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
  if (changeInfo.status === 'complete' && tab.url.includes('https://www.kktv.me/play/')) {
    console.log('send retry');
    chrome.tabs.sendMessage(tabId, { operation: 'retry' });
  }
});

console.log('background');
