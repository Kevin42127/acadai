# AcadAI - 網頁 FAQ 生成器

Chrome 擴充功能，自動分析網頁內容並生成常見問題（FAQ）列表，幫助快速理解網頁重點。

## 功能特色

- 自動分析當前網頁內容
- 智能生成 5-10 個相關常見問題
- 提供清晰、準確的答案
- 現代化圓角介面設計
- 後端 API 保護，API 金鑰安全隱藏
- 一鍵複製生成的 FAQ
- 支援手動輸入內容或自動取得網頁內容

## 架構說明

本專案使用 Vercel 作為後端 API，保護 Groq API 金鑰不被暴露。

- **前端**：Chrome 擴充功能
- **後端**：Vercel Serverless Functions
- **API**：Groq AI

## 安裝步驟

### 1. 部署後端 API

請參考 [DEPLOY.md](DEPLOY.md) 進行 Vercel 部署。

### 2. 設定擴充功能

1. 部署完成後，取得您的 Vercel URL（例如：`https://acadaiwrite.vercel.app`）
2. 開啟 `background.js`
3. 將 `API_BASE_URL` 更新為您的 Vercel URL：
```javascript
const API_BASE_URL = 'https://acadaiwrite.vercel.app';
```

**注意**：目前已經設定為 `https://acadaiwrite.vercel.app`，無需再次修改。

### 3. 載入擴充功能

1. 開啟 Chrome 瀏覽器，前往 `chrome://extensions/`
2. 開啟「開發人員模式」
3. 點擊「載入未封裝項目」
4. 選擇此專案資料夾

## 使用方式

1. 在任意網頁上點擊擴充功能圖標開啟彈出視窗
2. 留空輸入框將自動分析當前網頁內容，或手動輸入內容
3. 點擊「生成網頁 FAQ」按鈕
4. 等待 AI 分析內容並生成 FAQ 列表
5. 點擊複製按鈕複製生成的 FAQ

## 環境變數設定

後端 API 需要在 Vercel 設定環境變數：

- `GROQ_API_KEY`: 您的 Groq API 金鑰

詳細設定步驟請參考 [DEPLOY.md](DEPLOY.md)

## 圖標設定

專案包含 SVG 圖標檔案（`icons/icon.svg`），您需要將其轉換為 PNG 格式：

- `icon16.png` - 16x16 像素
- `icon48.png` - 48x48 像素  
- `icon128.png` - 128x128 像素

可以使用線上工具（如 [CloudConvert](https://cloudconvert.com/svg-to-png)）或圖片編輯軟體進行轉換。

## 技術架構

- Manifest V3
- Groq AI API
- Chrome Extension API
- Material Icons

## 授權

版權所有 © 學術寫作助手 (AcadAI)

