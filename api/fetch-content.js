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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `無法取得網頁內容：HTTP ${response.status}` 
      });
    }

    const html = await response.text();
    
    let cleanedHtml = html;
    
    cleanedHtml = cleanedHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleanedHtml = cleanedHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    cleanedHtml = cleanedHtml.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
    
    const bodyMatch = cleanedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let bodyContent = bodyMatch ? bodyMatch[1] : cleanedHtml;
    
    const mainContentSelectors = [
      /<main[^>]*>([\s\S]*?)<\/main>/i,
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*>([\s\S]*?)<\/section>/i
    ];
    
    let mainContent = '';
    for (const selector of mainContentSelectors) {
      const match = bodyContent.match(selector);
      if (match && match[1]) {
        const content = match[1];
        if (content.length > mainContent.length) {
          mainContent = content;
        }
      }
    }
    
    if (mainContent.length < 100) {
      mainContent = bodyContent;
    }
    
    mainContent = mainContent.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
    mainContent = mainContent.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
    mainContent = mainContent.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
    mainContent = mainContent.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
    mainContent = mainContent.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '');
    mainContent = mainContent.replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '');
    mainContent = mainContent.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1');
    
    const titleMatch = cleanedHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    const metaDescMatch = cleanedHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';
    
    const h1Matches = mainContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
    const h2Matches = mainContent.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
    const h3Matches = mainContent.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi) || [];
    
    const headings = [...h1Matches, ...h2Matches, ...h3Matches]
      .map(h => h.replace(/<[^>]+>/g, '').trim())
      .filter(h => h.length > 0);
    
    mainContent = mainContent.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n## $1\n');
    mainContent = mainContent.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');
    mainContent = mainContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1\n');
    mainContent = mainContent.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, '\n$1\n');
    mainContent = mainContent.replace(/<br[^>]*>/gi, '\n');
    mainContent = mainContent.replace(/<[^>]+>/g, ' ');
    
    mainContent = mainContent
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
    
    let textContent = '';
    
    if (title) {
      textContent += `標題：${title}\n\n`;
    }
    
    if (metaDesc) {
      textContent += `描述：${metaDesc}\n\n`;
    }
    
    if (headings.length > 0) {
      textContent += `主要標題：\n${headings.slice(0, 5).join('\n')}\n\n`;
    }
    
    textContent += `內容：\n${mainContent}`;
    
    if (!textContent || textContent.length < 100) {
      return res.status(400).json({ 
        error: '無法從網頁中提取足夠的文字內容' 
      });
    }

    const maxLength = 8000;
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

