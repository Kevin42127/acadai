document.addEventListener('DOMContentLoaded', async () => {
  const mainContentDiv = document.getElementById('mainContent');
  const topicInput = document.getElementById('topicInput');
  const generateBtn = document.getElementById('generateBtn');
  const resultSection = document.getElementById('resultSection');
  const resultContent = document.getElementById('resultContent');
  const copyBtn = document.getElementById('copyBtn');
  const loadingDiv = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  const errorText = document.getElementById('errorText');
  const labelText = document.getElementById('labelText');
  const generateBtnText = document.getElementById('generateBtnText');
  const resultTitle = document.getElementById('resultTitle');
  const loadingText = document.getElementById('loadingText');


  generateBtn.addEventListener('click', async () => {
    hideError();
    hideResult();
    showLoading();
    generateBtn.disabled = true;

    try {
      let content = topicInput.value.trim();
      let url = '';

      if (!content) {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          url = tab.url;
          
          if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
            showError('此頁面不支援內容分析，請在一般網頁上使用，或手動輸入內容');
            return;
          }

          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              const body = document.body;
              if (!body) return '';
              
              const scripts = body.querySelectorAll('script, style, nav, header, footer, aside');
              scripts.forEach(el => el.remove());
              
              return body.innerText || body.textContent || '';
            }
          });

          if (results && results[0] && results[0].result) {
            content = results[0].result.trim();
          }

          if (!content) {
            showError('無法取得網頁內容，請手動輸入內容');
            return;
          }

          if (content.length > 5000) {
            content = content.substring(0, 5000) + '...';
          }
        } catch (error) {
          showError('無法取得網頁內容：' + error.message + '。請手動輸入內容');
          return;
        }
      }

      const result = await generateFAQ(content, url);
      showResult(result);
    } catch (error) {
      showError(error.message);
    } finally {
      hideLoading();
      generateBtn.disabled = false;
    }
  });

  copyBtn.addEventListener('click', async () => {
    const text = resultContent.textContent;
    try {
      await navigator.clipboard.writeText(text);
      const originalIcon = copyBtn.querySelector('.material-icons').textContent;
      copyBtn.querySelector('.material-icons').textContent = 'check';
      setTimeout(() => {
        copyBtn.querySelector('.material-icons').textContent = originalIcon;
      }, 2000);
    } catch (error) {
      showError('複製失敗：' + error.message);
    }
  });

  async function generateFAQ(content, url) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'generateFAQ',
        content: content,
        url: url
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        resolve(response.faq);
      });
    });
  }

  function showResult(outline) {
    resultContent.innerHTML = '';
    
    const lines = outline.split('\n');
    const container = document.createElement('div');
    
    lines.forEach(line => {
      if (line.startsWith('## ')) {
        const h3 = document.createElement('h3');
        h3.textContent = line.replace('## ', '');
        container.appendChild(h3);
      } else if (line.startsWith('### ')) {
        const h4 = document.createElement('h4');
        h4.textContent = line.replace('### ', '');
        container.appendChild(h4);
      } else {
        const textNode = document.createTextNode(line + '\n');
        container.appendChild(textNode);
      }
    });
    
    resultContent.appendChild(container);
    resultSection.style.display = 'block';
  }

  function showLoading() {
    loadingDiv.style.display = 'block';
  }

  function hideLoading() {
    loadingDiv.style.display = 'none';
  }

  function showError(message) {
    errorText.textContent = message;
    errorDiv.style.display = 'flex';
    setTimeout(() => {
      errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  function hideError() {
    errorDiv.style.display = 'none';
  }

  function hideResult() {
    resultSection.style.display = 'none';
  }
});

