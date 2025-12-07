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
  const functionButtons = document.querySelectorAll('.function-btn');
  const labelText = document.getElementById('labelText');
  const generateBtnText = document.getElementById('generateBtnText');
  const resultTitle = document.getElementById('resultTitle');
  const loadingText = document.getElementById('loadingText');

  let currentFunction = 'outline';

  functionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      functionButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFunction = btn.dataset.function;
      
      if (currentFunction === 'outline') {
        labelText.textContent = '學術寫作主題或內容';
        topicInput.placeholder = '請輸入論文、報告或作業主題';
        generateBtnText.textContent = '生成寫作大綱';
        resultTitle.textContent = '生成的寫作大綱';
        loadingText.textContent = '正在生成寫作大綱...';
      } else if (currentFunction === 'answer') {
        labelText.textContent = '問題或內容';
        topicInput.placeholder = '請輸入您的學術問題';
        generateBtnText.textContent = '解答問題';
        resultTitle.textContent = '問題解答';
        loadingText.textContent = '正在解答問題...';
      }
    });
  });


  generateBtn.addEventListener('click', async () => {
    const topic = topicInput.value.trim();
    
    if (!topic) {
      showError(currentFunction === 'outline' ? '請輸入學術寫作主題或內容' : '請輸入問題或內容');
      return;
    }

    hideError();
    hideResult();
    showLoading();
    generateBtn.disabled = true;

    try {
      let result;
      if (currentFunction === 'outline') {
        result = await generateOutline(topic);
      } else if (currentFunction === 'answer') {
        result = await answerQuestion(topic);
      }
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

  async function generateOutline(topic) {
    const prompt = `請為以下學術寫作主題生成一個結構化的大綱。這個大綱可以用於論文、報告、作業等各種學術寫作。大綱應該包含：
1. 標題
2. 摘要/前言
3. 主要章節（至少3-5個章節）
4. 每個章節下的子章節或要點
5. 結論

請使用清晰的層次結構，使用標題和列表來組織內容。格式要求：
- 使用 ## 表示主要章節
- 使用 ### 表示子章節
- 使用列表表示具體要點

學術寫作主題：${topic}`;

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'generateOutline',
        prompt: prompt
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        resolve(response.outline);
      });
    });
  }

  async function answerQuestion(question) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'answerQuestion',
        prompt: question
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        resolve(response.answer);
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

