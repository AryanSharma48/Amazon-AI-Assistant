chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "SHOW_PROMPT") createFloatingButton();
    if (msg.action === "MANUAL_TRIGGER") scrapeAndSend();

    if (msg.action === "SUMMARY_COMPLETE") {
        const btn = document.getElementById('amazon-ai-btn');
        if (btn) {
            btn.innerText = "Summarized!";
            setTimeout(() => {
                btn.innerText = "Get New Summary!";
            }, 3000);
        }
    }
});

function createFloatingButton() {
    if (document.getElementById('amazon-ai-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'amazon-ai-btn';
    btn.innerHTML = `
        <span>Generate Summary</span>
        `;

    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: '2147483647',

        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 24px',
        borderRadius: '9999px',

        backgroundColor: '#232f3e',
        color: '#ffffff',
        border: '2px solid #FF9900',
        boxShadow: '0 4px 14px rgba(255, 153, 0, 0.3)',

        fontFamily: '"Amazon Ember", Arial, sans-serif',
        fontWeight: '600',
        fontSize: '14px',
        letterSpacing: '0.5px',

        cursor: 'pointer',
        transition: 'all 0.25s ease'
    });

    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'scale(1.05)';
        btn.style.backgroundColor = '#37475a';
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1)';
        btn.style.backgroundColor = '#232f3e';
    });

    btn.addEventListener('click', () => {
        btn.innerText = 'Thinking...';
        chrome.runtime.sendMessage({ action: "OPEN_PANEL" });
        chrome.runtime.sendMessage({ action: "SET_LOADING" });
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