- **Project Name**: Translation App
- **Type**: Desktop Application (Electron + React)
- **Status**: Scaffolding Complete ✅

## Project Overview

A minimalist translation desktop application for Windows with multiple translation modes:
- Word/phrase translation (click-to-translate)
- Input text translation
- Article/document translation
- AI-powered translation (via OpenAI)

## Architecture

- **Main Process**: Electron (TypeScript)
- **Renderer**: React 18 + Vite
- **Build System**: electron-builder for Windows packaging
- **Translation Backends**: Google Translate, Baidu, Alibaba Cloud, OpenAI

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- Git

### Development Setup
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. This launches both Vite dev server (port 5173) and Electron window

### Building for Production
1. Build optimization: `npm run build`
2. Create Windows installer/portable exe: `npm run dist`

### File Structure
```
src/
  main/         - Electron main process & preload scripts
  renderer/     - React components and UI
  api/          - Translation API wrappers
```

## Configuration

### API Keys Setup
- **OpenAI**: Set `REACT_APP_OPENAI_API_KEY` in .env or in-app settings
- **Baidu/Alibaba**: Create `.env` with credentials as needed

## Development Notes

- **Vite** handles React HMR in development
- **Electron** bridge via preload.ts for secure IPC
- **Clipboard access** implemented via Electron IPC
- CSS Modules for component styling isolation
