document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const toggleKeyBtn = document.getElementById('toggleKey');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const statusDiv = document.getElementById('status');

  chrome.storage.sync.get(['groqApiKey'], (result) => {
    if (result.groqApiKey) {
      apiKeyInput.value = result.groqApiKey;
    }
  });

  toggleKeyBtn.addEventListener('click', () => {
    const type = apiKeyInput.type === 'password' ? 'text' : 'password';
    apiKeyInput.type = type;
    toggleKeyBtn.querySelector('.material-icons').textContent = 
      type === 'password' ? 'visibility' : 'visibility_off';
  });

  saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('請輸入 API 金鑰', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set({ groqApiKey: apiKey });
      showStatus('設定已儲存', 'success');
    } catch (error) {
      showStatus('儲存失敗：' + error.message, 'error');
    }
  });

  testBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('請先輸入 API 金鑰', 'error');
      return;
    }

    showStatus('測試連線中...', 'info');
    
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showStatus('連線成功！API 金鑰有效', 'success');
      } else {
        const error = await response.json();
        showStatus('連線失敗：' + (error.error?.message || '無效的 API 金鑰'), 'error');
      }
    } catch (error) {
      showStatus('連線失敗：' + error.message, 'error');
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status-message show ${type}`;
    setTimeout(() => {
      statusDiv.classList.remove('show');
    }, 5000);
  }
});

