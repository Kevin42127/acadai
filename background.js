const API_BASE_URL = 'https://acadaiwrite.vercel.app';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateFAQ') {
    generateFAQ(request.content, request.url)
      .then(faq => {
        sendResponse({ faq: faq });
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
    return true;
  }
});

async function generateFAQ(content, url) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-faq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content, url })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API 請求失敗');
    }

    const data = await response.json();
    return data.faq;
  } catch (error) {
    throw new Error('生成 FAQ 失敗：' + error.message);
  }
}

