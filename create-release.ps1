#!/usr/bin/env pwsh

$ErrorActionPreference = "Continue"

# 配置
$token = "YOUR_GITHUB_TOKEN"
$owner = "Wilsongorgor"
$repo = "Translationapp"
$tag = "v1.0.0"
$releaseName = "Wilson 翻译 v1.0.0"
$exePath = ".\release\Wilson专属翻译\Wilson专属翻译.exe"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Wilson Translation App - GitHub Release" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Step 1: 创建git tag
Write-Host "[1/3] 创建Git标签..." -ForegroundColor Cyan
git tag -a $tag -m "Release v1.0.0" 2>&1 | Out-Null
$tagResult = git push origin $tag 2>&1
if ($LASTEXITCODE -eq 0 -or $tagResult -like "*already exists*") {
    Write-Host "✅ Git标签已创建/存在" -ForegroundColor Green
} else {
    Write-Host "⚠️  标签处理: $tagResult" -ForegroundColor Yellow
}

# Step 2: 创建Release
Write-Host "[2/3] 创建GitHub Release..." -ForegroundColor Cyan

$releaseBody = @"
## 🎉 Wilson Translation App v1.0.0 发布！

完整功能的Windows翻译应用，采用 **Electron 27** 和 **React 18** 构建。

### ✨ 核心功能
- 📝 **单词/短语翻译** - 点击即时翻译
- 💬 **输入框翻译** - 自由文本翻译
- 📄 **文章翻译** - 长文本翻译支持
- 🤖 **AI翻译** - OpenAI集成翻译
- 🔊 **发音支持** - 英文单词自动发音
- 📋 **剪贴板监听** - 快速翻译复制内容
- 🎨 **系统托盘** - 后台运行模式

### 🐛 已修复问题（v1.0.0）
- ✅ Enter键触发翻译而非换行
- ✅ 所有英文单词发音支持（包括resource等）
- ✅ 应用图标完整显示
- ✅ 托盘退出程序正确关闭应用

### 💻 系统要求
- Windows 10/11 64位
- 无需安装，开箱即用
- 无需特殊依赖

### 🚀 快速开始
1. 下载 `Wilson专属翻译.exe`
2. 双击运行
3. 开始翻译！

### 📦 技术栈
- **框架**: Electron 27.0 + React 18.2
- **语言**: TypeScript 5.0
- **构建**: Vite 5.0 + electron-builder
- **样式**: CSS Modules

---
感谢使用Wilson翻译！ 🙏
"@

$uri = "https://api.github.com/repos/$owner/$repo/releases"
$headers = @{
    "Authorization" = "token $token"
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "PowerShell"
}

$body = @{
    tag_name = $tag
    name = $releaseName  
    body = $releaseBody
    draft = $false
    prerelease = $false
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $uri -Method Post -Headers $headers -Body $body `
        -ContentType "application/json" -UseBasicParsing -TimeoutSec 30
    $releaseData = ConvertFrom-Json $response.Content
    
    Write-Host "✅ Release已创建" -ForegroundColor Green
    Write-Host "   ID: $($releaseData.id)" -ForegroundColor Gray
    
    # Step 3: 上传exe文件
    Write-Host "[3/3] 上传可执行文件..." -ForegroundColor Cyan
    
    $uploadUrl = ($releaseData.upload_url -replace '\{.*?\}', '') + "?name=Wilson专属翻译.exe"
    
    if (Test-Path $exePath) {
        $exeSize = (Get-Item $exePath).Length / 1MB
        Write-Host "   文件大小: $([Math]::Round($exeSize, 2)) MB" -ForegroundColor Gray
        
        $exeData = [System.IO.File]::ReadAllBytes($exePath)
        
        $uploadResponse = Invoke-WebRequest -Uri $uploadUrl -Method Post -Headers $headers `
            -Body $exeData -ContentType "application/octet-stream" -UseBasicParsing -TimeoutSec 120
        $assetData = ConvertFrom-Json $uploadResponse.Content
        
        Write-Host "✅ 文件上传完成" -ForegroundColor Green
        Write-Host "   下载: $($assetData.browser_download_url)" -ForegroundColor Gray
        
        # 最终信息
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "🎉 Release 发布成功！" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "📍 Release页面:" -ForegroundColor Cyan
        Write-Host "   $($releaseData.html_url)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📥 下载链接:" -ForegroundColor Cyan
        Write-Host "   $($assetData.browser_download_url)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "🔗 仓库首页:" -ForegroundColor Cyan
        Write-Host "   https://github.com/$owner/$repo" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        
    } else {
        Write-Host "❌ exe文件不存在: $exePath" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ 错误: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "详情: $($_ | Select-Object *)" -ForegroundColor Red
}
