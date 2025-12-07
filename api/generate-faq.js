export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允許' });
  }

  const { content, url } = req.body;

  if (!content || (typeof content === 'string' && !content.trim()) || (typeof content === 'object' && !content.full)) {
    return res.status(400).json({ error: '請提供網頁內容' });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: '伺服器配置錯誤' });
  }

  try {
    const contentData = typeof content === 'string' ? { full: content } : content;
    const structuredContent = contentData.product ? 
      `【商品資訊區塊】\n${contentData.product}\n\n【價格資訊區塊】\n${contentData.price || '未找到價格資訊'}\n\n【評價資訊區塊】\n${contentData.review || '未找到評價資訊'}\n\n【完整網頁內容】\n${contentData.full}` :
      contentData.full || content;

    const prompt = `你是一個專業的商品分析助手。請根據以下商品網頁內容，生成結構化的商品摘要。

**分析要求：**
1. 仔細提取商品名稱和品牌（優先從標題、h1、商品名稱區域提取）
2. 整理所有價格資訊（原價、折扣價、優惠活動、運費等）
3. 列出主要規格和特色功能（從規格表、特色列表提取）
4. 整理商品優點（至少 3-5 個，從評價、描述中提取，要具體不要空泛）
5. 整理商品缺點（如有，至少 2-3 個，從評價、評論中提取，要具體）
6. 說明適用對象和使用場景
7. 提供購買建議和總結

**輸出格式（嚴格遵守）：**
- 商品名稱：## 商品名稱
- 價格資訊：## 價格資訊
- 規格特色：## 規格特色
- 優點：## 優點
- 缺點：## 缺點
- 適用對象：## 適用對象
- 購買建議：## 購買建議

**注意事項：**
- 請使用繁體中文回應所有內容
- 如果某項資訊無法從內容中提取，請標註「資訊不足」
- 保持客觀，不要編造資訊
- 優缺點要具體，避免空泛描述（例如：不要只說「品質好」，要說明「材質耐用、做工精細」）
- 價格資訊要完整，包含所有優惠和折扣
- 規格要準確，不要猜測

網頁內容：
${structuredContent}

${url ? `網頁 URL: ${url}` : ''}

請生成商品摘要：`;

    const contentLength = structuredContent.length;
    const estimatedTokens = Math.ceil(contentLength / 4);
    const maxTokens = Math.max(1500, Math.min(3000, estimatedTokens + 1000));

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
            content: '你是一個專業的商品分析助手，擅長分析商品網頁內容，自動生成結構清晰、實用的商品摘要，包括商品名稱、價格、規格、特色、優缺點、適用對象和購買建議。你總是保持客觀，只提取實際存在的資訊，不會編造內容。請使用繁體中文回應所有內容。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: maxTokens,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ 
        error: error.error?.message || 'API 請求失敗' 
      });
    }

    const data = await response.json();
    let faq = data.choices[0].message.content;

    faq = faq
      .replace(/\n{3,}/g, '\n\n')
      .replace(/##\s+/g, '## ')
      .trim();

    const requiredSections = ['商品名稱', '價格資訊', '規格特色', '優點', '適用對象', '購買建議'];
    const missingSections = requiredSections.filter(section => 
      !faq.includes(`## ${section}`)
    );
    
    if (missingSections.length > 0) {
      console.warn('缺少必要欄位:', missingSections);
    }

    if (!faq || faq.length < 100) {
      return res.status(500).json({ 
        error: 'AI 回應內容過短，可能生成失敗' 
      });
    }

    return res.status(200).json({ faq });
  } catch (error) {
    console.error('Groq API 錯誤:', error);
    return res.status(500).json({ 
      error: '生成商品摘要失敗：' + error.message 
    });
  }
}

