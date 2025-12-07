# Chrome 擴充功能自動打包腳本 (PowerShell)
# 使用方法: .\package-extension.ps1

Write-Host "開始打包 Chrome 擴充功能..." -ForegroundColor Green

# 讀取版本號
$manifest = Get-Content "manifest.json" | ConvertFrom-Json
$version = $manifest.version
$name = $manifest.name -replace '[^\w\s]', '' -replace '\s', '-'

Write-Host "擴充功能名稱: $name" -ForegroundColor Cyan
Write-Host "版本號: $version" -ForegroundColor Cyan

# 建立輸出檔案名稱
$zipFileName = "${name}-v${version}.zip"
$outputPath = Join-Path $PSScriptRoot $zipFileName

# 如果已存在，先刪除
if (Test-Path $outputPath) {
    Write-Host "刪除舊的打包檔案..." -ForegroundColor Yellow
    Remove-Item $outputPath -Force
}

# 需要包含的檔案和資料夾
$includeFiles = @(
    "manifest.json",
    "popup.html",
    "popup.js",
    "popup.css",
    "background.js",
    "content.js",
    "options.html",
    "options.js",
    "options.css",
    "icons"
)

# 檢查檔案是否存在
Write-Host "`n檢查必要檔案..." -ForegroundColor Cyan
$missingFiles = @()
foreach ($file in $includeFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        if ($file -ne "options.html" -and $file -ne "options.js" -and $file -ne "options.css") {
            Write-Host "  ✗ $file (缺少)" -ForegroundColor Red
            $missingFiles += $file
        } else {
            Write-Host "  - $file (可選，已跳過)" -ForegroundColor Yellow
        }
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "`n錯誤: 缺少必要檔案！" -ForegroundColor Red
    exit 1
}

# 建立臨時資料夾
$tempDir = Join-Path $env:TEMP "extension-pack-$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Write-Host "`n建立臨時資料夾: $tempDir" -ForegroundColor Cyan

try {
    # 複製檔案
    Write-Host "`n複製檔案..." -ForegroundColor Cyan
    foreach ($file in $includeFiles) {
        if (Test-Path $file) {
            $destPath = Join-Path $tempDir $file
            if (Test-Path $file -PathType Container) {
                Copy-Item -Path $file -Destination $destPath -Recurse -Force
                Write-Host "  ✓ 複製資料夾: $file" -ForegroundColor Green
            } else {
                Copy-Item -Path $file -Destination $destPath -Force
                Write-Host "  ✓ 複製檔案: $file" -ForegroundColor Green
            }
        }
    }

    # 建立 ZIP 檔案
    Write-Host "`n建立 ZIP 檔案..." -ForegroundColor Cyan
    Compress-Archive -Path "$tempDir\*" -DestinationPath $outputPath -Force
    
    # 取得檔案大小
    $fileSize = (Get-Item $outputPath).Length / 1MB
    Write-Host "`n打包完成！" -ForegroundColor Green
    Write-Host "檔案名稱: $zipFileName" -ForegroundColor Cyan
    Write-Host "檔案大小: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
    Write-Host "檔案位置: $outputPath" -ForegroundColor Cyan
    
    if ($fileSize -gt 10) {
        Write-Host "`n警告: 檔案大小超過 10MB，可能無法上傳到 Chrome 網上應用程式商店！" -ForegroundColor Yellow
    }
    
} finally {
    # 清理臨時資料夾
    Write-Host "`n清理臨時檔案..." -ForegroundColor Cyan
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "`n完成！" -ForegroundColor Green

