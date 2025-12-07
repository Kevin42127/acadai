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
    const prompt = `請根據以下商品網頁內容，自動生成一個結構化的商品摘要。要求：
1. 提取商品名稱和品牌
2. 整理價格資訊（原價、折扣價、優惠活動等）
3. 列出主要規格和特色功能
4. 整理商品優點（至少 3-5 個）
5. 整理商品缺點（如有，至少 2-3 個）
6. 說明適用對象和使用場景
7. 提供購買建議和總結
8. 使用清晰的格式：
   - 商品名稱用 ## 商品名稱 標記
   - 價格資訊用 ## 價格資訊 標記
   - 規格特色用 ## 規格特色 標記
   - 優點用 ## 優點 標記
   - 缺點用 ## 缺點 標記
   - 適用對象用 ## 適用對象 標記
   - 購買建議用 ## 購買建議 標記

網頁內容：
${content}

${url ? `網頁 URL: ${url}` : ''}

請生成商品摘要：`;

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
            content: '你是一個專業的商品分析助手，擅長分析商品網頁內容，自動生成結構清晰、實用的商品摘要，包括商品名稱、價格、規格、特色、優缺點、適用對象和購買建議。'
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
      error: '生成商品摘要失敗：' + error.message 
    });
  }
}

