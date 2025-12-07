document.addEventListener('DOMContentLoaded', async () => {
  const generateBtn = document.getElementById('generateBtn');
  const regenerateBtn = document.getElementById('regenerateBtn');
  const resultSection = document.getElementById('resultSection');
  const resultContent = document.getElementById('resultContent');
  const copyBtn = document.getElementById('copyBtn');
  const loadingDiv = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  const errorText = document.getElementById('errorText');
  const loadingText = document.getElementById('loadingText');
  const successMessage = document.getElementById('successMessage');
  const successText = document.getElementById('successText');


  async function checkRateLimit() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['requestTimestamps'], (result) => {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        let timestamps = result.requestTimestamps || [];
        
        timestamps = timestamps.filter(timestamp => timestamp > oneMinuteAgo);
        
        if (timestamps.length >= 3) {
          const oldestRequest = Math.min(...timestamps);
          const waitTime = Math.ceil((60000 - (now - oldestRequest)) / 1000);
          reject(new Error(`每分鐘最多生成3次，請等待 ${waitTime} 秒後再試`));
          return;
        }
        
        timestamps.push(now);
        chrome.storage.local.set({ requestTimestamps: timestamps }, () => {
          resolve();
        });
      });
    });
  }

  async function generateFAQHandler() {
    hideError();
    hideSuccess();
    hideResult();
    
    try {
      await checkRateLimit();
    } catch (error) {
      showError(error.message);
      return;
    }
    
    showLoading();
    generateBtn.disabled = true;
    if (regenerateBtn) regenerateBtn.disabled = true;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tab.url;
      
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
        showError('此頁面不支援內容分析，請在一般網頁上使用');
        return;
      }

      loadingText.textContent = '正在分析網頁內容...';

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const body = document.body;
          if (!body) return { full: '' };
          
          const extractText = (selector) => {
            try {
              const elements = document.querySelectorAll(selector);
              let text = '';
              elements.forEach(el => {
                const elText = el.innerText || el.textContent || '';
                if (elText.length > 50 && elText.length < 2000) {
                  text += elText + '\n\n';
                }
              });
              return text.trim();
            } catch (e) {
              return '';
            }
          };

          const productSelectors = [
            '[class*="product"]',
            '[class*="item"]',
            '[class*="detail"]',
            '[class*="info"]',
            '[id*="product"]',
            '[id*="item"]',
            'main',
            'article'
          ];
          
          let productContent = '';
          productSelectors.forEach(selector => {
            const text = extractText(selector);
            if (text.length > productContent.length) {
              productContent = text;
            }
          });
          
          const priceSelectors = [
            '[class*="price"]',
            '[class*="cost"]',
            '[id*="price"]',
            '[data-price]',
            '[itemprop="price"]'
          ];
          
          let priceInfo = '';
          priceSelectors.forEach(selector => {
            priceInfo += extractText(selector) + '\n';
          });
          
          const reviewSelectors = [
            '[class*="review"]',
            '[class*="rating"]',
            '[class*="comment"]',
            '[id*="review"]',
            '[class*="evaluation"]'
          ];
          
          let reviewInfo = '';
          reviewSelectors.forEach(selector => {
            reviewInfo += extractText(selector) + '\n';
          });
          
          const fullText = body.innerText || body.textContent || '';
          
          return {
            product: productContent.substring(0, 3000),
            price: priceInfo.substring(0, 1000),
            review: reviewInfo.substring(0, 2000),
            full: fullText
          };
        }
      });

      let content = '';
      if (results && results[0] && results[0].result) {
        const extractedData = results[0].result;
        if (typeof extractedData === 'object' && extractedData.full) {
          content = extractedData;
        } else {
          content = typeof extractedData === 'string' ? extractedData : extractedData.full || '';
        }
      }

      if (!content || (typeof content === 'object' && !content.full) || (typeof content === 'string' && !content.trim())) {
        showError('無法取得網頁內容，請確認網頁已完全載入');
        return;
      }

      if (typeof content === 'object') {
        if (content.full && content.full.length > 8000) {
          content.full = content.full.substring(0, 8000) + '...';
        }
      } else if (content.length > 8000) {
        content = content.substring(0, 8000) + '...';
      }

      loadingText.textContent = '正在生成商品摘要...';
      const result = await generateFAQ(content, url);
      showResult(result);
    } catch (error) {
      showError('生成商品摘要失敗：' + error.message);
    } finally {
      hideLoading();
      generateBtn.disabled = false;
      if (regenerateBtn) regenerateBtn.disabled = false;
    }
  }

  generateBtn.addEventListener('click', generateFAQHandler);

  if (regenerateBtn) {
    regenerateBtn.addEventListener('click', generateFAQHandler);
  }

  copyBtn.addEventListener('click', async () => {
    const text = resultContent.textContent;
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('已複製到剪貼簿');
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

  function showResult(summary) {
    resultContent.innerHTML = '';
    
    const lines = summary.split('\n');
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
      } else if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        const li = document.createElement('div');
        li.style.marginLeft = '16px';
        li.style.marginBottom = '6px';
        li.textContent = line.trim().replace(/^[-•]\s*/, '');
        container.appendChild(li);
      } else {
        const textNode = document.createTextNode(line + '\n');
        container.appendChild(textNode);
      }
    });
    
    resultContent.appendChild(container);
    resultSection.style.display = 'block';
    
    setTimeout(() => {
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
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

  function showSuccess(message) {
    hideError();
    successText.textContent = message;
    successMessage.style.display = 'flex';
    setTimeout(() => {
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    setTimeout(() => {
      hideSuccess();
    }, 3000);
  }

  function hideSuccess() {
    successMessage.style.display = 'none';
  }
});

