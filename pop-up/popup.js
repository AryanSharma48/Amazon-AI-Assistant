document.getElementById('btn').addEventListener('click', async () => {
    console.log('[Popup] Manual override clicked');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    if (tab && tab.id) {
        chrome.runtime.sendMessage({ 
            action: "OPEN_PANEL", 
            tabId: tab.id 
        });
        chrome.tabs.sendMessage(tab.id, { action: "MANUAL_TRIGGER" });
    }
    setTimeout(() => {
        window.close();
    }, 100);
});