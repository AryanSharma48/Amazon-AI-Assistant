document.getElementById('btn').addEventListener('click', e => {
    chrome.runtime.sendMessage({action : "toggle-sidepanel"});

    setTimeout(() => {
        window.close();
    },50);
})