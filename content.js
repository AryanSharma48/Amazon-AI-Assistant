const reviewElements = document.querySelectorAll('[data-hook="review"]');
let n = reviewElements.length;
console.log('Reviews found:', n);

const reviewArr = [];

for (let i = 0; i < n; i++) {
    reviewArr[i] = reviewElements[i].innerText;
    console.log(reviewArr[i]);
}

chrome.runtime.sendMessage({
    action: 'ASK_GEMINI',
    reviewArr
})
