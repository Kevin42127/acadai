export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允許' });
  }

  const { content, url } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: '請提供網頁內容' });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: '伺服器配置錯誤' });
  }

  try {
    const prompt = `請根據以下網頁內容，自動生成一個常見問題（FAQ）列表。要求：
1. 生成 5-10 個最相關的常見問題
2. 每個問題應該有清晰、準確的答案
3. 問題應該涵蓋內容的主要重點
4. 答案應該基於提供的內容，準確且有用
5. 使用清晰的格式，問題用 ## 標記，答案緊跟在問題下方

網頁內容：
${content}

${url ? `網頁 URL: ${url}` : ''}

請生成 FAQ 列表：`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: '你是一個專業的內容分析助手，擅長根據網頁內容自動生成結構清晰、實用的常見問題（FAQ）列表。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ 
        error: error.error?.message || 'API 請求失敗' 
      });
    }

    const data = await response.json();
    const faq = data.choices[0].message.content;

    return res.status(200).json({ faq });
  } catch (error) {
    console.error('Groq API 錯誤:', error);
    return res.status(500).json({ 
      error: '生成 FAQ 失敗：' + error.message 
    });
  }
}

