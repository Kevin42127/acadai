// Chrome 擴充功能自動打包腳本 (Node.js)
// 使用方法: node package-extension.js

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

console.log('開始打包 Chrome 擴充功能...\n');

// 讀取 manifest.json
const manifestPath = path.join(__dirname, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version;
const name = manifest.name.replace(/[^\w\s]/g, '').replace(/\s/g, '-');

console.log(`擴充功能名稱: ${name}`);
console.log(`版本號: ${version}\n`);

// 建立輸出檔案名稱
const zipFileName = `${name}-v${version}.zip`;
const outputPath = path.join(__dirname, zipFileName);

// 如果已存在，先刪除
if (fs.existsSync(outputPath)) {
    console.log('刪除舊的打包檔案...');
    fs.unlinkSync(outputPath);
}

// 需要包含的檔案和資料夾
const includeFiles = [
    'manifest.json',
    'popup.html',
    'popup.js',
    'popup.css',
    'background.js',
    'content.js',
    'options.html',
    'options.js',
    'options.css',
    'icons'
];

// 檢查檔案是否存在
console.log('檢查必要檔案...');
const missingFiles = [];
includeFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`  ✓ ${file}`);
    } else {
        if (!['options.html', 'options.js', 'options.css'].includes(file)) {
            console.log(`  ✗ ${file} (缺少)`);
            missingFiles.push(file);
        } else {
            console.log(`  - ${file} (可選，已跳過)`);
        }
    }
});

if (missingFiles.length > 0) {
    console.log('\n錯誤: 缺少必要檔案！');
    process.exit(1);
}

// 建立 ZIP 檔案
console.log('\n建立 ZIP 檔案...');
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', {
    zlib: { level: 9 }
});

output.on('close', () => {
    const fileSize = archive.pointer() / 1024 / 1024;
    console.log('\n打包完成！');
    console.log(`檔案名稱: ${zipFileName}`);
    console.log(`檔案大小: ${fileSize.toFixed(2)} MB`);
    console.log(`檔案位置: ${outputPath}`);
    
    if (fileSize > 10) {
        console.log('\n警告: 檔案大小超過 10MB，可能無法上傳到 Chrome 網上應用程式商店！');
    }
});

archive.on('error', (err) => {
    console.error('打包錯誤:', err);
    process.exit(1);
});

archive.pipe(output);

// 添加檔案
includeFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            archive.directory(filePath, file);
            console.log(`  ✓ 添加資料夾: ${file}`);
        } else {
            archive.file(filePath, { name: file });
            console.log(`  ✓ 添加檔案: ${file}`);
        }
    }
});

archive.finalize();

