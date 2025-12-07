export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允許' });
  }

  const { prompt } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: '請提供問題或內容' });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: '伺服器配置錯誤' });
  }

  try {
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
            content: '你是一個專業的學術助手，專門幫助大學生解答學術問題。請提供清晰、準確、易懂的解答，包含必要的解釋和範例。如果問題涉及計算或解題，請提供詳細的解題步驟。'
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
    const answer = data.choices[0].message.content;

    return res.status(200).json({ answer });
  } catch (error) {
    console.error('Groq API 錯誤:', error);
    return res.status(500).json({ 
      error: '解答問題失敗：' + error.message 
    });
  }
}

