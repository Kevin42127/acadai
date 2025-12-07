export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允許' });
  }

  const { url } = req.body;

  if (!url || !url.trim()) {
    return res.status(400).json({ error: '請提供網址' });
  }

  try {
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url)) {
      return res.status(400).json({ error: '無效的網址格式' });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `無法取得網頁內容：HTTP ${response.status}` 
      });
    }

    const html = await response.text();
    
    const scripts = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
    const styles = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
    const navs = html.match(/<nav[^>]*>[\s\S]*?<\/nav>/gi) || [];
    const headers = html.match(/<header[^>]*>[\s\S]*?<\/header>/gi) || [];
    const footers = html.match(/<footer[^>]*>[\s\S]*?<\/footer>/gi) || [];
    const asides = html.match(/<aside[^>]*>[\s\S]*?<\/aside>/gi) || [];

    let cleanedHtml = html;
    [...scripts, ...styles, ...navs, ...headers, ...footers, ...asides].forEach(tag => {
      cleanedHtml = cleanedHtml.replace(tag, '');
    });

    const textMatch = cleanedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = textMatch ? textMatch[1] : cleanedHtml;
    
    const textContent = bodyContent
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!textContent || textContent.length < 50) {
      return res.status(400).json({ 
        error: '無法從網頁中提取足夠的文字內容' 
      });
    }

    const maxLength = 5000;
    const content = textContent.length > maxLength 
      ? textContent.substring(0, maxLength) + '...' 
      : textContent;

    return res.status(200).json({ content, url });
  } catch (error) {
    console.error('抓取網頁內容錯誤:', error);
    return res.status(500).json({ 
      error: '抓取網頁內容失敗：' + error.message 
    });
  }
}

