const API_BASE_URL = 'https://acadaiwrite.vercel.app';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateOutline') {
    generateOutline(request.prompt)
      .then(outline => {
        sendResponse({ outline: outline });
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
    return true;
  }
  
  if (request.action === 'answerQuestion') {
    answerQuestion(request.prompt)
      .then(answer => {
        sendResponse({ answer: answer });
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
    return true;
  }
});

async function generateOutline(prompt) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-outline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API 請求失敗');
    }

    const data = await response.json();
    return data.outline;
  } catch (error) {
    throw new Error('生成寫作大綱失敗：' + error.message);
  }
}

async function answerQuestion(prompt) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/answer-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API 請求失敗');
    }

    const data = await response.json();
    return data.answer;
  } catch (error) {
    throw new Error('解答問題失敗：' + error.message);
  }
}

