# Vercel 部署說明

## 前置準備

1. 確保您有 Vercel 帳號（可免費註冊）
2. 準備好 Groq API 金鑰

## 部署步驟

### 方法一：使用 Vercel CLI

1. 安裝 Vercel CLI：
```bash
npm i -g vercel
```

2. 登入 Vercel：
```bash
vercel login
```

3. 在專案根目錄部署：
```bash
vercel
```

4. 設定環境變數：
```bash
vercel env add GROQ_API_KEY
```
輸入您的 Groq API 金鑰

5. 部署到生產環境：
```bash
vercel --prod
```

### 方法二：使用 Vercel 網頁介面

1. 前往 [Vercel](https://vercel.com) 並登入
2. 點擊「New Project」
3. 連接您的 Git 倉庫（GitHub/GitLab/Bitbucket）
4. 或直接上傳專案資料夾
5. 在「Environment Variables」中新增：
   - 名稱：`GROQ_API_KEY`
   - 值：您的 Groq API 金鑰
6. 點擊「Deploy」

## 更新擴充功能設定

部署完成後，您會獲得一個 Vercel URL，例如：`https://acadaiwrite.vercel.app`

1. 開啟 `background.js`
2. 將 `API_BASE_URL` 更新為您的 Vercel URL：
```javascript
const API_BASE_URL = 'https://acadaiwrite.vercel.app';
```

**注意**：目前已經設定為 `https://acadaiwrite.vercel.app`，無需再次修改。

3. 更新 `manifest.json` 中的 `host_permissions`（如果需要）

## 環境變數設定

在 Vercel 專案設定中，確保設定以下環境變數：

- `GROQ_API_KEY`: 您的 Groq API 金鑰

## 測試 API

部署後，可以使用以下方式測試：

```bash
curl -X POST https://acadaiwrite.vercel.app/api/generate-outline \
  -H "Content-Type: application/json" \
  -d '{"prompt":"人工智慧的發展與應用"}'
```

## 注意事項

1. Vercel 免費方案有使用限制，請注意 API 呼叫次數
2. 建議設定速率限制以防止濫用
3. API 金鑰永遠不要提交到 Git 倉庫

