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
  const rateLimitInfo = document.getElementById('rateLimitInfo');
  const rateLimitText = document.getElementById('rateLimitText');
  const historyBtn = document.getElementById('historyBtn');
  const historySidebar = document.getElementById('historySidebar');
  const historyList = document.getElementById('historyList');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const historyOverlay = document.getElementById('historyOverlay');
  const emptyHistory = document.getElementById('emptyHistory');
  const pageTitle = document.getElementById('pageTitle');
  const pageUrl = document.getElementById('pageUrl');


  function getRemainingCount() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['requestTimestamps'], (result) => {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        let timestamps = result.requestTimestamps || [];
        
        timestamps = timestamps.filter(timestamp => timestamp > oneMinuteAgo);
        const remaining = Math.max(0, 3 - timestamps.length);
        resolve(remaining);
      });
    });
  }

  let lastRemainingCount = 3;
  let rateLimitUpdateInterval = null;

  async function updateRateLimitDisplay(force = false) {
    const remaining = await getRemainingCount();
    
    if (!force && remaining === lastRemainingCount) {
      return;
    }
    
    lastRemainingCount = remaining;
    rateLimitText.textContent = `剩餘次數：${remaining}/3`;
    
    if (remaining === 0) {
      rateLimitInfo.classList.add('rate-limit-exceeded');
      chrome.storage.local.get(['requestTimestamps'], (result) => {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        let timestamps = result.requestTimestamps || [];
        timestamps = timestamps.filter(timestamp => timestamp > oneMinuteAgo);
        if (timestamps.length > 0) {
          const oldestRequest = Math.min(...timestamps);
          const waitTime = Math.ceil((60000 - (now - oldestRequest)) / 1000);
          rateLimitText.textContent = `剩餘次數：0/3（等待 ${waitTime} 秒）`;
        }
      });
    } else {
      rateLimitInfo.classList.remove('rate-limit-exceeded');
    }
  }

  function startRateLimitUpdate() {
    if (rateLimitUpdateInterval) {
      clearInterval(rateLimitUpdateInterval);
    }
    rateLimitUpdateInterval = setInterval(() => {
      updateRateLimitDisplay();
    }, 5000);
  }

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
          updateRateLimitDisplay(true);
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

      loadingText.textContent = '步驟 1/3：正在分析網頁內容...';

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

      loadingText.textContent = '步驟 2/3：正在提取商品資訊...';
      await new Promise(resolve => setTimeout(resolve, 300));
      
      loadingText.textContent = '步驟 3/3：正在生成商品摘要...';
      const result = await generateFAQ(content, url);
      showResult(result);
      await saveHistory(result, url);
    } catch (error) {
      showError('生成商品摘要失敗：' + error.message);
    } finally {
      hideLoading();
      generateBtn.disabled = false;
      if (regenerateBtn) regenerateBtn.disabled = false;
      updateRateLimitDisplay(true);
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

  historyBtn.addEventListener('click', () => {
    showHistory();
  });

  closeHistoryBtn.addEventListener('click', () => {
    hideHistory();
  });

  historyOverlay.addEventListener('click', () => {
    hideHistory();
  });

  async function saveHistory(summary, url) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['history'], (result) => {
        let history = result.history || [];
        const historyItem = {
          id: Date.now(),
          summary: summary,
          url: url || '',
          timestamp: new Date().toLocaleString('zh-TW'),
          preview: summary.substring(0, 100).replace(/\n/g, ' ') + '...'
        };
        
        history.unshift(historyItem);
        
        if (history.length > 50) {
          history = history.slice(0, 50);
        }
        
        chrome.storage.local.set({ history: history }, () => {
          resolve();
        });
      });
    });
  }

  async function loadHistory() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['history'], (result) => {
        resolve(result.history || []);
      });
    });
  }

  async function showHistory() {
    const history = await loadHistory();
    historyList.innerHTML = '';
    
    if (history.length === 0) {
      emptyHistory.style.display = 'flex';
      historyList.style.display = 'none';
    } else {
      emptyHistory.style.display = 'none';
      historyList.style.display = 'block';
      
      history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const itemContent = document.createElement('div');
        itemContent.className = 'history-item-content';
        
        const itemHeader = document.createElement('div');
        itemHeader.className = 'history-item-header';
        
        const itemUrl = document.createElement('div');
        itemUrl.className = 'history-item-url';
        itemUrl.textContent = item.url || '當前網頁';
        itemUrl.title = item.url || '當前網頁';
        
        const itemTime = document.createElement('div');
        itemTime.className = 'history-item-time';
        itemTime.textContent = item.timestamp;
        
        itemHeader.appendChild(itemUrl);
        itemHeader.appendChild(itemTime);
        
        const itemPreview = document.createElement('div');
        itemPreview.className = 'history-item-preview';
        itemPreview.textContent = item.preview;
        
        itemContent.appendChild(itemHeader);
        itemContent.appendChild(itemPreview);
        
        const itemActions = document.createElement('div');
        itemActions.className = 'history-item-actions';
        
        const loadBtn = document.createElement('button');
        loadBtn.className = 'history-action-btn';
        loadBtn.title = '載入';
        loadBtn.innerHTML = '<span class="material-icons">visibility</span>';
        loadBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          loadHistoryItem(item);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'history-action-btn';
        deleteBtn.title = '刪除';
        deleteBtn.innerHTML = '<span class="material-icons">delete</span>';
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteHistoryItem(item.id);
        });
        
        itemActions.appendChild(loadBtn);
        itemActions.appendChild(deleteBtn);
        
        historyItem.appendChild(itemContent);
        historyItem.appendChild(itemActions);
        
        historyList.appendChild(historyItem);
      });
    }
    
    historySidebar.style.display = 'block';
    historyOverlay.style.display = 'block';
  }

  function hideHistory() {
    historySidebar.style.display = 'none';
    historyOverlay.style.display = 'none';
  }

  function loadHistoryItem(item) {
    showResult(item.summary);
    hideHistory();
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function deleteHistoryItem(id) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['history'], (result) => {
        let history = result.history || [];
        history = history.filter(item => item.id !== id);
        chrome.storage.local.set({ history: history }, () => {
          showHistory();
          resolve();
        });
      });
    });
  }

  const pageInfoCache = new Map();
  const CACHE_DURATION = 30000;

  async function loadCurrentPageInfo() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        showPageInfoError();
        return;
      }

      const cacheKey = `${tab.id}_${tab.url}`;
      const cached = pageInfoCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        displayPageInfo(cached.title, cached.url);
        return;
      }

      const title = tab.title || '未知網頁';
      const url = tab.url ? new URL(tab.url).hostname : '';
      
      pageInfoCache.set(cacheKey, {
        title,
        url,
        timestamp: Date.now()
      });

      displayPageInfo(title, url);
    } catch (error) {
      showPageInfoError();
    }
  }

  function displayPageInfo(title, url) {
    const titleSkeleton = document.getElementById('pageTitleSkeleton');
    const titleText = document.getElementById('pageTitleText');
    const urlSkeleton = document.getElementById('pageUrlSkeleton');
    const urlText = document.getElementById('pageUrlText');

    if (titleSkeleton && titleText) {
      titleSkeleton.style.display = 'none';
      titleText.style.display = '';
      titleText.textContent = title;
    } else if (pageTitle) {
      pageTitle.textContent = title;
    }

    if (urlSkeleton && urlText) {
      urlSkeleton.style.display = 'none';
      urlText.style.display = '';
      urlText.textContent = url;
      urlText.title = url;
    } else if (pageUrl) {
      pageUrl.textContent = url;
      pageUrl.title = url;
    }
  }

  function showPageInfoError() {
    const titleSkeleton = document.getElementById('pageTitleSkeleton');
    const titleText = document.getElementById('pageTitleText');
    
    if (titleSkeleton && titleText) {
      titleSkeleton.style.display = 'none';
      titleText.style.display = '';
      titleText.textContent = '無法載入網頁資訊';
    } else if (pageTitle) {
      pageTitle.textContent = '無法載入網頁資訊';
    }
    if (pageUrl) {
      pageUrl.textContent = '';
    }
  }

  generateBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !generateBtn.disabled) {
      e.preventDefault();
      generateFAQHandler();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target === document.body && !generateBtn.disabled) {
      generateFAQHandler();
    }
  });

  loadCurrentPageInfo();
  updateRateLimitDisplay(true);
  startRateLimitUpdate();
});

