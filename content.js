chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "SHOW_PROMPT") createFloatingButton();
    if (msg.action === "MANUAL_TRIGGER") scrapeAndSend();
});

function createFloatingButton() {
    if (document.getElementById('amazon-ai-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'amazon-ai-btn';
    btn.innerText = 'AI Summary';
    Object.assign(btn.style, {
        position: 'fixed', bottom: '20px', right: '20px', zIndex: '9999',
        padding: '12px 20px', backgroundColor: '#FFD814', color: '#111',
        border: 'none', borderRadius: '25px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        cursor: 'pointer', fontWeight: 'bold'
    });

    btn.addEventListener('click', () => {
        btn.innerText = 'Thinking...';
        chrome.runtime.sendMessage({ action: "OPEN_PANEL" });
        scrapeAndSend();
    });

    document.body.appendChild(btn);
}

function scrapeAndSend() {
    const reviewElements = document.querySelectorAll('[data-hook="review"]');
    if (reviewElements.length === 0) {
        alert("No reviews found! Are you on a product page?");
        return;
    }

    const reviewArr = [];
    const limit = Math.min(reviewElements.length, 25); // Limit to 25 reviews
    
    for (let i = 0; i < limit; i++) {
        reviewArr.push(reviewElements[i].innerText.replace(/\s+/g, ' ').trim());
    }

    console.log(`[Content] Sending ${reviewArr.length} reviews to Gemini.`);
    
    chrome.runtime.sendMessage({
        action: 'ASK_GEMINI',
        reviewArr: reviewArr
    });
}