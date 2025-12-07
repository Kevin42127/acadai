@echo off
REM Chrome 擴充功能自動打包腳本 (批處理)
REM 使用方法: package-extension.bat

echo 開始打包 Chrome 擴充功能...

REM 檢查 PowerShell 是否可用
where powershell >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo 使用 PowerShell 執行打包...
    powershell -ExecutionPolicy Bypass -File "%~dp0package-extension.ps1"
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo 打包完成！
        pause
        exit /b 0
    ) else (
        echo.
        echo 打包失敗！
        pause
        exit /b 1
    )
) else (
    echo 錯誤: 找不到 PowerShell，請使用 package-extension.ps1 或安裝 PowerShell
    pause
    exit /b 1
)

