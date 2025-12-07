# 學術寫作助手 (AcadAI)

Chrome 擴充功能，使用 AI 協助大學生進行學術寫作，包含論文大綱生成、報告結構規劃等功能。

## 功能特色

- 快速生成結構化的學術寫作大綱（論文、報告、作業）
- 支援輸入主題或選取網頁文字
- 現代化圓角介面設計
- 後端 API 保護，API 金鑰安全隱藏
- 一鍵複製生成的寫作大綱
- 適用於各種學術寫作類型

## 架構說明

本專案使用 Vercel 作為後端 API，保護 Groq API 金鑰不被暴露。

- **前端**：Chrome 擴充功能
- **後端**：Vercel Serverless Functions
- **API**：Groq AI

## 安裝步驟

### 1. 部署後端 API

請參考 [DEPLOY.md](DEPLOY.md) 進行 Vercel 部署。

### 2. 設定擴充功能

1. 部署完成後，取得您的 Vercel URL（例如：`https://your-app.vercel.app`）
2. 開啟 `background.js`
3. 將 `API_BASE_URL` 更新為您的 Vercel URL：
```javascript
const API_BASE_URL = 'https://your-app.vercel.app';
```

### 3. 載入擴充功能

1. 開啟 Chrome 瀏覽器，前往 `chrome://extensions/`
2. 開啟「開發人員模式」
3. 點擊「載入未封裝項目」
4. 選擇此專案資料夾

## 使用方式

1. 點擊擴充功能圖標開啟彈出視窗
2. 輸入學術寫作主題（論文、報告、作業等）或選取網頁文字後點擊「使用選取文字」
3. 點擊「生成寫作大綱」按鈕
4. 等待 AI 生成結構化大綱
5. 點擊複製按鈕複製生成的寫作大綱

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

