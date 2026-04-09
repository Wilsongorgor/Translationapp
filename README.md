# 翻译工具 (Translation App)

一个功能完整的桌面翻译应用，支持多种翻译模式和翻译引擎。

## 功能特性

### 📝 四大翻译模式
- **划词翻译** - 选中文本即时翻译，浮窗显示结果
- **输入翻译** - 支持输入文本或粘贴剪贴板内容进行翻译
- **文章翻译** - 批量翻译长篇文章，支持段落级翻译和下载功能
- **AI 翻译** - 基于 OpenAI GPT 的智能翻译，提供更自然的翻译表达

### 🌐 多引擎支持
- Google 翻译（免费）
- 百度翻译（需配置 API Key）
- 阿里翻译（需配置 API Key）
- OpenAI 翻译（需配置 API Key）

### 🎨 简约UI设计
- 现代化界面，视觉简洁
- 快速响应，使用流畅
- 适配 Windows PC

## 系统要求

- Windows 7 或更高版本
- 64 位系统

## 安装与使用

### 从源码开发

1. **克隆项目**
   ```bash
   git clone <repo-url>
   cd Translation
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **开发模式运行**
   ```bash
   npm run dev
   ```
   此命令会同时启动 Vite 开发服务器和 Electron 应用

4. **生产构建**
   ```bash
   npm run build
   ```

5. **打包为 Windows 执行文件**
   ```bash
   npm run dist
   ```
   生成的 exe 文件位于 `dist/` 目录

### 从发布版本安装

直接下载最新版本的 `.exe` 文件并运行安装器。

## 配置说明

### 设置翻译引擎 API Key

某些翻译引擎需要配置 API Key：

1. **百度翻译**
   - 创建 `.env` 文件
   ```
   REACT_APP_BAIDU_APPID=your_app_id
   REACT_APP_BAIDU_SECRET_KEY=your_secret_key
   ```

2. **OpenAI 翻译**
   - 在应用内设置界面配置 OpenAI API Key
   - 或创建 `.env` 文件
   ```
   REACT_APP_OPENAI_API_KEY=your_api_key
   ```

## 快速开始

### 输入翻译
1. 打开 "输入翻译" 标签页
2. 输入或粘贴要翻译的文本
3. 选择翻译引擎
4. 点击 "翻译" 按钮
5. 查看结果并复制到剪贴板

### 文章翻译
1. 打开 "文章翻译" 标签页
2. 粘贴整篇文章
3. 点击 "翻译文章" 按钮
4. 等待翻译完成
5. 下载或复制翻译结果

### AI 翻译
1. 打开 "AI 翻译" 标签页
2. 点击 "API 设置" 配置 OpenAI API Key
3. 输入要翻译的文本
4. 选择目标语言
5. 点击 "使用 AI 翻译" 按钮

## 项目结构

```
Translation/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── main.ts       # 主程序入口
│   │   └── preload.ts    # Electron 预加载脚本
│   ├── renderer/          # React 前端
│   │   ├── App.tsx       # 主应用组件
│   │   ├── main.tsx      # React 入口
│   │   ├── components/   # UI 组件
│   │   └── styles/       # 样式文件
│   └── api/              # API 模块
│       └── translator.ts # 翻译引擎封装
├── index.html            # HTML 模板
├── package.json          # 项目配置
├── vite.config.ts        # Vite 配置
└── tsconfig.json         # TypeScript 配置
```

## 开发

### 技术栈
- **框架**: Electron + React 18
- **构建工具**: Vite + TypeScript
- **打包工具**: electron-builder
- **HTTP 客户端**: Axios

### 运行开发环境
```bash
npm run dev
```

### 构建项目
```bash
npm run build
```

### 生成 Windows 安装包
```bash
npm run dist
```

可选参数：
- `--publish=onTagOrDraft` - 发布到 GitHub Release
- `-c` - 自定义配置

## 常见问题

### Q: 如何更换默认翻译引擎？
A: 在输入翻译页面的 "翻译引擎" 下拉菜单中选择。

### Q: 支持哪些语言对？
A: 支持 Google 翻译支持的所有语言对。具体语言列表请参考 Google 翻译官网。

### Q: 可以离线使用吗？
A: 不可以。应用需要网络连接才能使用翻译功能。

### Q: 如何报告 Bug？
A: 请在 GitHub Issues 中提交 Bug 报告，包括详细的重现步骤。

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 贡献

欢迎提交 PR 或 Issue！

## 更新日志

### v1.0.0
- 初始版本发布
- 支持四种翻译模式
- 支持多个翻译引擎
- 简约 UI 设计
