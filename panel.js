console.log('[Panel] Panel.js loaded');

let backgroundPort = null;

// Connect to background script
backgroundPort = chrome.runtime.connect({ name: 'sidepanel' });
console.log('[Panel] Connected to background');

document.getElementById('get-review').addEventListener('click', () => {
    console.log('[Panel] Get Reviews button clicked');
    const responseContainer = document.getElementById('response-container');
    const responseText = document.getElementById('response-text');
    if (responseContainer && responseText) {
        responseContainer.style.display = 'block';
        responseText.innerText = 'Summarizing...';
    }
    chrome.runtime.sendMessage({ action: 'get-reviews' });
});

// Listen for messages from background script via port
backgroundPort.onMessage.addListener((message) => {
    console.log('[Panel] Received message from background:', message);

    if (message.action === 'DISPLAY_SUMMARY') {
        console.log('[Panel] Displaying summary:', message.answer);
        const responseContainer = document.getElementById('response-container');
        const responseText = document.getElementById('response-text');

        if (responseText && responseContainer) {
            responseText.innerText = message.answer || "No summary generated.";
            responseContainer.style.display = 'block';
        } else {
            console.error('[Panel] Elements not found');
        }
    }
});
