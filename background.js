console.log('[SymbolSync][BG] service worker started');

// Relay symbol updates to every other ChartsWatcher tab.
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== 'symbolChanged' || !message.symbol) return;

  const senderTabId = sender.tab?.id;

  console.log('[SymbolSync][BG] symbolChanged from tab', senderTabId, 'symbol:', message.symbol);

  chrome.tabs.query({ url: 'https://app.chartswatcher.com/*' }, tabs => {
    console.log('[SymbolSync][BG] forwarding to tabs', tabs.map(t => t.id));
    for (const tab of tabs) {
      if (!tab.id || tab.id === senderTabId) continue; // avoid echoing back to source tab
      console.log('[SymbolSync][BG] send to tab', tab.id);
      chrome.tabs.sendMessage(tab.id, { type: 'applySymbol', symbol: message.symbol });
    }
  });
});
