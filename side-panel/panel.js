console.log('[Panel] Panel.js loaded');

let rawSummaryText = '';

// Helper function to convert basic markdown (bold, lists) to formatted HTML
function formatSummary(text) {
    if (!text) return "";
    
    // Escape HTML to prevent injection
    let safeText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Convert **bold** to <strong>bold</strong>
    safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Split by line and parse lists
    const lines = safeText.split('\n');
    let inList = false;
    let html = '';

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Match markdown bullets like "- item" or "* item" or "• item"
        const bulletMatch = line.match(/^[-*•]\s+(.*)$/);

        if (bulletMatch) {
            if (!inList) {
                html += '<ul style="margin: 8px 0; padding-left: 20px;">';
                inList = true;
            }
            html += `<li style="margin-bottom: 4px; line-height: 1.6;">${bulletMatch[1]}</li>`;
        } else {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += `<p style="margin: 8px 0; line-height: 1.6;">${line}</p>`;
        }
    }

    if (inList) {
        html += '</ul>';
    }

    return html;
}

// UI State controller
function updateUIState(state, data = '') {
    const welcomeCard = document.getElementById('welcome-card');
    const loader = document.getElementById('loader');
    const errorCard = document.getElementById('error-card');
    const errorText = document.getElementById('error-text');
    const container = document.getElementById('response-container');
    const text = document.getElementById('response-text');
    const timestamp = document.getElementById('timestamp');

    // Reset visibility of all major views
    if (welcomeCard) welcomeCard.style.display = 'none';
    if (loader) loader.style.display = 'none';
    if (errorCard) errorCard.style.display = 'none';
    if (container) container.style.display = 'none';

    switch (state) {
        case 'welcome':
            if (welcomeCard) welcomeCard.style.display = 'block';
            break;

        case 'loading':
            if (loader) loader.style.display = 'block';
            break;

        case 'error':
            if (errorCard) {
                errorCard.style.display = 'block';
                if (errorText) errorText.innerText = data || 'An unknown error occurred.';
            }
            break;

        case 'ready':
            if (container && text) {
                rawSummaryText = data;
                text.innerHTML = formatSummary(data);
                container.style.display = 'block';
                if (timestamp) timestamp.innerText = 'Just now';
            }
            break;
    }
}

// Load initial state from storage
chrome.storage.local.get(['uiState', 'latestSummary'], (result) => {
    if (result.uiState === 'loading') {
        updateUIState('loading');
    } else if (result.latestSummary) {
        if (result.latestSummary.startsWith('Error:')) {
            updateUIState('error', result.latestSummary.replace('Error: ', ''));
        } else {
            updateUIState('ready', result.latestSummary);
        }
    } else {
        updateUIState('welcome');
    }
});

// Trigger review scan and analysis
function triggerScan() {
    console.log('[Panel] Triggering scan...');
    updateUIState('loading');
    chrome.runtime.sendMessage({ action: 'SET_LOADING' });
    chrome.runtime.sendMessage({ action: 'get-reviews' });
}

// Connect to background script
const backgroundPort = chrome.runtime.connect({ name: 'sidepanel' });
console.log('[Panel] Connected to background');

document.addEventListener("DOMContentLoaded", () => {
    // Re-Scan button inside the report footer
    const getReviewBtn = document.getElementById('get-review');
    if (getReviewBtn) {
        getReviewBtn.addEventListener('click', triggerScan);
    }

    // Retry button inside the error card
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', triggerScan);
    }

    // Copy to Clipboard button inside the report footer
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            if (!rawSummaryText) return;
            navigator.clipboard.writeText(rawSummaryText)
                .then(() => {
                    const originalText = copyBtn.innerText;
                    copyBtn.innerText = '✅ Copied!';
                    setTimeout(() => {
                        copyBtn.innerText = originalText;
                    }, 2000);
                })
                .catch(err => {
                    console.error('[Panel] Copy failed:', err);
                });
        });
    }
});

// Listen for messages from background script via port
backgroundPort.onMessage.addListener((message) => {
    console.log('[Panel] Received message from background:', message);

    if (message.action === 'STATUS_UPDATE') {
        updateUIState('loading');
    }

    if (message.action === 'DISPLAY_SUMMARY') {
        const answer = message.answer || '';
        if (answer.startsWith('Error:')) {
            updateUIState('error', answer.replace('Error: ', ''));
        } else if (!answer) {
            updateUIState('error', 'No summary could be generated.');
        } else {
            updateUIState('ready', answer);
        }
    }
});
