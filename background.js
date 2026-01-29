let isOpen = false;

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "toggle-sidepanel") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return;

      if (!isOpen) {
        chrome.sidePanel.setOptions({
          tabId: tab.id,
          path: "sidepanel.html",
          enabled: true
        });

        chrome.sidePanel.open({ tabId: tab.id });
      } else {
        chrome.sidePanel.close({ tabId: tab.id });
      }

      isOpen = !isOpen;
    });
  }
});
