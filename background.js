let isOpen = false;
let sidePanelPort = null;

// Listen for side panel connection
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sidepanel') {
    console.log('[Background] Side panel connected');
    sidePanelPort = port;

    port.onDisconnect.addListener(() => {
      console.log('[Background] Side panel disconnected');
      sidePanelPort = null;
    });
  }
});

// Handle toggle-sidepanel action from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "toggle-sidepanel") {
    console.log('[Background] Toggle sidepanel requested');
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return;

      if (!isOpen) {
        chrome.sidePanel.setOptions({
          tabId: tab.id,
          path: "sidepanel.html",
          enabled: true
        });

        chrome.sidePanel.open({ tabId: tab.id });
        console.log('[Background] Side panel opened');
      } else {
        chrome.sidePanel.close({ tabId: tab.id });
        console.log('[Background] Side panel closed');
      }

      isOpen = !isOpen;
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'get-reviews') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return;

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    });
  }
});

const GEMINI_KEY = env.GEMINI_KEY;

async function callGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  const data = await res.json();

  const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return answer;

}


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'ASK_GEMINI') {
    const prompt = `Summarize these reviews in 150 words or less and be concise and accurate and with both pros and cons included:\n${msg.reviewArr}`;

    callGemini(prompt)
      .then(answer => {
        if (!answer) {
          answer = "Gemini returned an empty response. Please check the background console for details.";
        }
        console.log('[Gemini] Got answer, sending to side panel');
        sendResponse({ success: true, answer });

        // Send to side panel via port
        if (sidePanelPort) {
          console.log('[Background] Sending DISPLAY_SUMMARY to panel');
          sidePanelPort.postMessage({
            action: 'DISPLAY_SUMMARY',
            answer: answer
          });
        } else {
          console.error('[Background] Side panel port not connected');
        }
      })
      .catch(err => {
        console.error('[Gemini] API Error:', err);
        if (sidePanelPort) {
          sidePanelPort.postMessage({
            action: 'DISPLAY_SUMMARY',
            answer: `Error: ${err.message}`
          });
        }
        sendResponse({ success: false, error: err.message });
      });

    return true;
  }
});

