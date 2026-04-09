# GitHub 推送指南

你的 Wilson Translation App 已准备好推送到 GitHub！

## ✅ 已完成
- ✅ 本地 Git 仓库已初始化
- ✅ 所有代码文件已提交
- ✅ .gitignore 已配置

## 🚀 推送到 GitHub 的步骤

### 步骤 1：在 GitHub 上创建新仓库
1. 访问 https://github.com/new
2. 填写以下信息：
   - **Repository name**: Wilson-Translation-App
   - **Description**: Windows 翻译应用 - Electron + React 构建的功能完整翻译工具
   - **Visibility**: 选择 Public（公开）
3. **重要**：不要勾选任何初始化选项（README、.gitignore、License）
4. 点击 "Create repository"

### 步骤 2：复制仓库 URL
创建完成后，你会看到类似这样的 URL：
```
https://github.com/你的用户名/Wilson-Translation-App.git
```

### 步骤 3：在本地执行推送命令

打开 PowerShell，进入项目目录，执行：

```powershell
# 添加远程仓库（替换 USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/USERNAME/Wilson-Translation-App.git

# 将主分支改名为 main
git branch -M main

# 推送到 GitHub
git push -u origin main
```

### 步骤 4：身份验证
当提示输入用户名时：
- **用户名**: 你的 GitHub 用户名
- **密码**: 使用 Personal Access Token（个人访问令牌）而不是账户密码
  - 访问 https://github.com/settings/tokens 生成新 token
  - Scopes 选择: repo, workflow
  - 复制 token 值，粘贴作为密码

### 步骤 5：验证
推送完成后：
1. 刷新 https://github.com/USERNAME/Wilson-Translation-App
2. 应该能看到所有项目文件
3. README.md 应该在主页显示

## 📊 项目统计
- 项目类型：Electron + React 桌面应用
- 编程语言：TypeScript + CSS + HTML
- 应用大小：164.68 MB
- 主要功能：多模式翻译、发音、剪贴板监听、系统托盘集成

## 📁 关键文件
- `package.json` - 项目配置和依赖
- `src/main/main.ts` - Electron 主进程
- `src/renderer/App.tsx` - React 主应用
- `README.md` - 项目说明文档
- `release/Wilson专属翻译/Wilson专属翻译.exe` - 可执行程序

## 🎯 推送后的操作（可选）

### 添加项目描述
1. 在 GitHub 仓库主页右上角点击齿轮图标
2. 添加 Description: "Windows 翻译应用"
3. 添加 Website: （如果有的话）
4. 添加 Topics: translation, electron, react, typescript, windows

### 创建 Release
1. 点击仓库右侧的 "Releases"
2. 点击 "Create a new release"
3. Tag version: v1.0.0
4. Release title: Release v1.0.0
5. Description: 粘贴本应用的主要特性
6. Attach binaries: 上传 `release/Wilson专属翻译/Wilson专属翻译.exe`
7. 发布 Release

## 💡 常见问题

**Q: 推送时出现 "fatal: refusing to merge unrelated histories"**
A: 如果已有历史，可以用 `--allow-unrelated-histories` 选项

**Q: 如何修改已推送的内容？**
A: 修改本地文件后，使用 `git add .` 和 `git commit -m "message"` 后再 `git push`

**Q: 如何协作开发？**
A: 
1. 添加协作者：Settings → Collaborators
2. 协作者 clone 仓库后可以推送更改

## 🔗 快速链接
- GitHub: https://github.com
- 创建仓库: https://github.com/new
- Token 设置: https://github.com/settings/tokens
- 你的仓库: https://github.com/username/Wilson-Translation-App

---
祝推送顺利！如有问题，参考 GitHub 官方文档：https://docs.github.com
