# Chrome 擴充功能打包說明

## 快速打包（推薦）

### 方法一：使用自動打包腳本（最簡單）

#### Windows PowerShell
```powershell
.\package-extension.ps1
```

#### Windows 批處理
```batch
package-extension.bat
```

#### Node.js（跨平台）
```bash
npm install
npm run package
```

腳本會自動：
- 讀取 `manifest.json` 中的版本號和名稱
- 過濾不需要的檔案（如 `api/`、`README.md` 等）
- 建立 ZIP 檔案，檔名格式：`AcadAI-v1.0.0.zip`
- 顯示檔案大小和位置

### 方法二：使用 Chrome 瀏覽器打包

## 方法一：使用 Chrome 瀏覽器打包（推薦）

### 步驟

1. **開啟 Chrome 擴充功能管理頁面**
   - 在 Chrome 瀏覽器中輸入：`chrome://extensions/`
   - 或點擊右上角三點選單 → 更多工具 → 擴充功能

2. **開啟開發人員模式**
   - 在右上角開啟「開發人員模式」開關

3. **載入擴充功能**
   - 點擊「載入未封裝項目」
   - 選擇專案資料夾（包含 `manifest.json` 的資料夾）

4. **打包擴充功能**
   - 點擊「打包擴充功能」按鈕
   - 選擇專案根目錄（包含 `manifest.json` 的資料夾）
   - 私鑰檔案（可選）：如果之前有打包過，選擇 `.pem` 檔案；首次打包可留空
   - 點擊「打包擴充功能」

5. **取得打包檔案**
   - 打包完成後，會在專案資料夾中生成：
     - `AcadAI.crx` - 擴充功能檔案（可安裝）
     - `AcadAI.pem` - 私鑰檔案（請妥善保管，用於後續更新）

## 方法二：手動建立 ZIP 檔案

### 需要包含的檔案

打包時需要包含以下檔案和資料夾：

```
AcadAI/
├── manifest.json          (必須)
├── popup.html            (必須)
├── popup.js              (必須)
├── popup.css             (必須)
├── background.js         (必須)
├── content.js            (必須)
├── options.html          (可選)
├── options.js            (可選)
├── options.css           (可選)
├── icons/                (必須)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── logo.png              (可選)
```

### 不需要包含的檔案

打包時**不要**包含以下檔案：

```
❌ api/                    (後端 API，不需要)
❌ node_modules/           (如果有)
❌ .git/                  (Git 資料夾)
❌ .gitignore
❌ README.md              (可選)
❌ DEPLOY.md              (可選)
❌ PACKAGE.md             (可選)
❌ package.json           (後端用，不需要)
❌ vercel.json            (後端用，不需要)
❌ env.example            (後端用，不需要)
❌ index.html             (首頁，不需要)
❌ index.css              (首頁用，不需要)
```

### 打包步驟（Windows）

1. **選擇需要打包的檔案**
   - 在檔案總管中選擇上述需要包含的檔案和資料夾

2. **建立 ZIP 檔案**
   - 右鍵點擊選取的檔案
   - 選擇「傳送到」→「壓縮的 (zipped) 資料夾」
   - 或使用壓縮軟體（如 7-Zip、WinRAR）建立 ZIP 檔案

3. **重新命名**
   - 將 ZIP 檔案重新命名為 `AcadAI-v1.0.0.zip`（版本號可自行調整）

### 打包步驟（Mac）

1. **選擇需要打包的檔案**
   - 在 Finder 中選擇上述需要包含的檔案和資料夾

2. **建立 ZIP 檔案**
   - 右鍵點擊選取的檔案
   - 選擇「壓縮 X 個項目」
   - 或使用終端機：
     ```bash
     zip -r AcadAI-v1.0.0.zip manifest.json popup.* background.js content.js options.* icons/
     ```

### 打包步驟（Linux）

```bash
# 在專案根目錄執行
zip -r AcadAI-v1.0.0.zip \
  manifest.json \
  popup.html popup.js popup.css \
  background.js \
  content.js \
  options.html options.js options.css \
  icons/
```

## 驗證打包檔案

### 測試 ZIP 檔案

1. 開啟 Chrome 擴充功能管理頁面：`chrome://extensions/`
2. 開啟「開發人員模式」
3. 點擊「載入未封裝項目」
4. 選擇 ZIP 檔案並解壓縮，或直接選擇解壓縮後的資料夾
5. 確認擴充功能正常運作

### 測試 CRX 檔案

1. 開啟 Chrome 擴充功能管理頁面：`chrome://extensions/`
2. 開啟「開發人員模式」
3. 將 `.crx` 檔案拖放到擴充功能頁面
4. 確認擴充功能正常運作

## 上傳到 Chrome 網上應用程式商店

如果要上傳到 Chrome 網上應用程式商店：

1. **準備檔案**
   - 使用 ZIP 檔案（不是 CRX）
   - 確保版本號在 `manifest.json` 中正確設定

2. **前往開發人員控制台**
   - 前往 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - 登入 Google 帳號

3. **上傳擴充功能**
   - 點擊「新增項目」
   - 上傳 ZIP 檔案
   - 填寫商店資訊（名稱、描述、截圖等）
   - 提交審核

## 注意事項

1. **版本號更新**
   - 每次打包前，記得在 `manifest.json` 中更新版本號
   - 格式：`"version": "1.0.0"`

2. **私鑰檔案**
   - `.pem` 檔案請妥善保管
   - 後續更新擴充功能時需要使用相同的私鑰

3. **測試**
   - 打包後務必測試擴充功能是否正常運作
   - 確認所有功能都能正常使用

4. **檔案大小**
   - Chrome 網上應用程式商店限制單一檔案大小為 10MB
   - 如果超過，需要優化圖片或移除不必要的檔案

