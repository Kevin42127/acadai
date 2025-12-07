let selectedText = '';

document.addEventListener('mouseup', () => {
  const text = window.getSelection().toString().trim();
  if (text) {
    selectedText = text;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    const text = window.getSelection().toString().trim() || selectedText;
    sendResponse({ text: text });
  }
  return true;
});

