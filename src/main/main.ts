import { app, BrowserWindow, Menu, ipcMain, clipboard, Tray, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs'
import axios from 'axios'
// @ts-ignore
import translate from 'translate-google'

const isDev = process.env.NODE_ENV === 'development'

// GPU崩溃修复 - 禁用硬件加速
app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null
let tray: Tray | null = null
let clipboardMonitorInterval: NodeJS.Timeout | null = null
let lastClipboardText: string = ''
let isQuitting: boolean = false  // 标记是否真正在退出应用

// 应用设置
let appSettings = {
  minimizeToTray: true,  // 默认最小化到托盘
  autoStart: false,
}

// ========== 崩溃诊断 ==========
// 最早的日志记录 - 不依赖app对象
console.log('[INIT] Electron进程开始...')

const logDir = path.join(process.cwd(), '.logs')

// 创建日志目录
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
  console.log(`[INIT] 日志目录: ${logDir}`)
} catch (e: any) {
  console.error('[FATAL] 无法创建日志目录:', e.message)
}

const logFile = path.join(logDir, 'app.log')
const errorLog = path.join(logDir, 'error.log')

function writeLog(msg: string): void
function writeLog(level: string, msg: string, error?: any): void
function writeLog(levelOrMsg: string, msg?: string, error?: any) {
  const ts = new Date().toLocaleString('zh-CN')
  
  // 处理两种调用方式
  let finalMsg: string
  if (msg === undefined) {
    // writeLog(msg) 形式
    finalMsg = levelOrMsg
  } else {
    // writeLog(level, msg, error) 形式
    finalMsg = `[${levelOrMsg}] ${msg}`
    if (error) {
      try {
        finalMsg += '\n' + JSON.stringify(error)
      } catch (e) {}
    }
  }
  
  const line = `[${ts}] ${finalMsg}\n`
  try {
    fs.appendFileSync(logFile, line)
  } catch (e) {}
  console.log(line.trim())
}

function writeErrorLog(msg: string): void
function writeErrorLog(msg: string, error: any): void
function writeErrorLog(msg: string, error?: any) {
  const ts = new Date().toLocaleString('zh-CN')
  let line = `[${ts}] ERROR: ${msg}\n`
  if (error) {
    try {
      if (error.stack) {
        line += `Stack: ${error.stack}\n`
      } else {
        line += `Details: ${JSON.stringify(error)}\n`
      }
    } catch (e) {}
  }
  try {
    fs.appendFileSync(errorLog, line)
  } catch (e) {}
  console.error(line.trim())
}

try {
  writeLog('应用启动开始...')
} catch (e) {
  console.error('[CRITICAL] 写入日志失败:', e)
}

// 全局错误处理
process.on('uncaughtException', (error) => {
  writeErrorLog('主进程未捕获异常', error)
  console.error('❌ 主进程崩溃:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  writeErrorLog('未处理的Promise拒绝', reason)
  console.error('❌ Promise拒绝:', reason)
})

// 应用崩溃处理
app.on('child-process-gone', (details: any) => {
  const detailsStr = details ? JSON.stringify(details, null, 2) : 'undefined'
  writeErrorLog(`子进程崩溃 - 完整信息: ${detailsStr}`)
  
  // 尝试重启应用或防止完全崩溃
  if (mainWindow && mainWindow.isDestroyed() === false) {
    writeLog('INFO', '主窗口仍存在，应用将继续运行')
  } else {
    writeLog('WARN', '主窗口已销毁，应用即将退出')
  }
})

function createWindow() {
  writeLog('INFO', '开始创建窗口...')
  
  // 构建icon路径 - 安全处理icon缺失的情况
  let windowConfig: any = {
    width: 1100,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  }
  
  // 验证preload.js存在
  const preloadPath = path.join(__dirname, 'preload.js')
  if (!fs.existsSync(preloadPath)) {
    writeErrorLog('Preload.js不存在', { path: preloadPath })
  } else {
    writeLog('INFO', '✓ Preload.js文件存在')
  }
  
  // 尝试找到icon文件
  try {
    const possiblePaths = [
      path.join(__dirname, '../../../icon.jpg'),  // 生产环境：../../../
      path.join(__dirname, '../../icon.jpg'),     // 开发环境：../../
      path.join(__dirname, 'icon.jpg'),           // 同级目录
      path.join(process.cwd(), 'icon.jpg'),       // 工作目录
      path.join(app.getAppPath(), '..', '..', 'icon.jpg'),  // 应用路径
    ]
    
    writeLog('INFO', `__dirname=${__dirname}, process.cwd()=${process.cwd()}`)
    
    for (const p of possiblePaths) {
      try {
        fs.accessSync(p)
        windowConfig.icon = p
        writeLog('INFO', `✓ 找到icon: ${p}`)
        break
      } catch (e) {
        // 继续尝试下一个路径
      }
    }
    
    if (!windowConfig.icon) {
      writeLog('WARN', 'Icon文件未找到，使用默认配置')
    }
  } catch (e) {
    writeErrorLog('Icon加载异常', e)
  }
  
  try {
    writeLog('INFO', '创建BrowserWindow...')
    mainWindow = new BrowserWindow(windowConfig)
    writeLog('INFO', '✓ BrowserWindow创建成功')
  } catch (e) {
    writeErrorLog('创建BrowserWindow失败', e)
    throw e
  }

  try {
    const startUrl = isDev
      ? 'http://localhost:5173'
      : `file://${path.join(__dirname, '../../dist/index.html')}`
    
    writeLog('INFO', `加载URL: ${startUrl}`)
    
    // 验证HTML文件存在（生产环境）
    if (!isDev) {
      const htmlPath = path.join(__dirname, '../../dist/index.html')
      if (!fs.existsSync(htmlPath)) {
        writeErrorLog('HTML文件不存在', { path: htmlPath })
      } else {
        writeLog('INFO', `✓ HTML文件存在: ${htmlPath}`)
      }
    }
    
    mainWindow!.loadURL(startUrl)
    writeLog('INFO', '✓ URL加载开始')
  } catch (e) {
    writeErrorLog('加载URL失败', e)
    throw e
  }

  mainWindow!.setTitle('Wilson专属翻译')

  if (isDev) {
    mainWindow!.webContents.openDevTools()
  }
  
  // 监听加载完成
  mainWindow!.webContents.on('did-finish-load', () => {
    writeLog('INFO', '✓ 内容加载完成')
  })
  
  mainWindow!.webContents.on('crashed', () => {
    writeErrorLog('渲染进程崩溃（crashed事件）', { reason: 'webContents crashed' })
  })
  
  mainWindow!.webContents.on('render-process-gone', (details: any) => {
    writeErrorLog('渲染进程终止（render-process-gone）', details)
  })

  // 监听didFailLoad
  mainWindow!.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    writeErrorLog('页面加载失败', { errorCode, errorDescription, validatedURL })
  })

  // 处理关闭按钮 - 默认最小化到托盘而不是真正关闭
  mainWindow!.on('close', (event) => {
    writeLog('INFO', `关闭事件，minimizeToTray=${appSettings.minimizeToTray}, isQuitting=${isQuitting}`)
    // 如果真正在退出（比如点击托盘的"退出程序"），不拦截
    if (isQuitting) {
      writeLog('INFO', '✓ 准许窗口关闭（正在退出应用）')
      return  // 允许真正的关闭
    }
    // 如果启用了"最小化到托盘"，则阻止关闭并最小化
    if (appSettings.minimizeToTray) {
      event.preventDefault()
      mainWindow?.hide()
      writeLog('INFO', '✓ 窗口已最小化到托盘')
    }
  })

  mainWindow!.on('closed', () => {
    writeLog('INFO', '窗口已关闭')
    mainWindow = null
  })
}

// 使用app.whenReady()而不是app.on('ready')，这样更稳健
app.whenReady().then(() => {
  try {
    writeLog('INFO', '------- app.whenReady()触发 -------')
    createWindow()
    
    // 延迟创建托盘以加快启动速度
    setTimeout(() => {
      try {
        writeLog('INFO', '创建系统托盘...')
        createTray()
      } catch (e) {
        writeErrorLog('创建托盘失败', e)
      }
    }, 500)
  } catch (e) {
    writeErrorLog('app.whenReady()处理异常', e)
    process.exit(1)
  }
}).catch((err) => {
  writeErrorLog('app.whenReady()失败', err)
  process.exit(1)
})

// 创建系统托盘
function createTray() {
  if (!mainWindow) {
    writeLog('WARN', '创建托盘失败：mainWindow为null')
    return
  }
  
  try {
    writeLog('INFO', '开始创建托盘...')
    
    // 尝试加载icon
    let trayIcon: any = undefined
    
    const possiblePaths = [
      path.join(__dirname, '../../../icon.jpg'),
      path.join(__dirname, '../../icon.jpg'),
      path.join(__dirname, 'icon.jpg'),
      path.join(process.cwd(), 'icon.jpg'),
    ]
    
    for (const p of possiblePaths) {
      try {
        fs.accessSync(p)
        trayIcon = p
        writeLog('INFO', `✓ 托盘icon找到: ${p}`)
        break
      } catch (e) {
        // 继续
      }
    }
    
    // 创建托盘
    if (trayIcon) {
      tray = new Tray(trayIcon)
      writeLog('INFO', '✓ 托盘已创建（含图标）')
    } else {
      // 使用空的nativeImage
      const emptyImage = nativeImage.createEmpty()
      tray = new Tray(emptyImage)
      writeLog('INFO', '✓ 托盘已创建（使用默认）')
    }
    
    if (!tray) {
      writeErrorLog('创建Tray对象失败', {})
      return
    }

    // 重建托盘菜单（避免菜单显示过期状态）
    const updateTrayMenu = () => {
      if (!tray) return
      const contextMenu = Menu.buildFromTemplate([
        {
          label: mainWindow && mainWindow.isVisible() ? '隐藏程序' : '显示程序',
          click: () => {
            if (mainWindow) {
              if (mainWindow.isVisible()) {
                mainWindow.hide()
                writeLog('INFO', '✓ 窗口已隐藏')
              } else {
                mainWindow.show()
                mainWindow.focus()
                writeLog('INFO', '✓ 窗口已显示')
              }
            }
          },
        },
        { type: 'separator' },
        {
          label: '退出程序',
          click: () => {
            writeLog('INFO', '用户点击托盘退出，设置isQuitting=true，然后执行 app.quit()')
            // 设置标志，允许close事件通过
            isQuitting = true
            // 现在quit会真正关闭应用
            app.quit()
          },
        },
      ])
      tray.setContextMenu(contextMenu)
    }
    
    // 初始化菜单
    updateTrayMenu()
    
    // 每次窗口显示/隐藏时更新菜单
    mainWindow?.on('show', updateTrayMenu)
    mainWindow?.on('hide', updateTrayMenu)
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide()
        } else {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    })
    
    writeLog('INFO', '✓ 托盘菜单已设置')
  } catch (e) {
    writeErrorLog('创建托盘异常', e)
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// 检测输入文本的语言
function detectLanguage(text: string): 'chinese' | 'other' {
  // 中文字符范围: [\u4E00-\u9FFF]
  const chineseRegex = /[\u4E00-\u9FFF]/g
  const chineseChars = text.match(chineseRegex) || []
  
  // 如果中文字符数多于总字符数的30%，认为是中文
  const chinesePercentage = (chineseChars.length / text.length) * 100
  
  console.log(`  语言检测: 中文字符${chineseChars.length}个, 占比${chinesePercentage.toFixed(1)}%`)
  
  if (chinesePercentage > 30) {
    console.log(`  ✓ 检测为中文`)
    return 'chinese'
  } else {
    console.log(`  ✓ 检测为非中文`)
    return 'other'
  }
}

// 根据检测的语言获取目标语言
function getAutoTargetLanguage(detectedLang: 'chinese' | 'other'): string {
  if (detectedLang === 'chinese') {
    console.log(`  自动目标语言: English (因为输入是中文)`)
    return 'English'
  } else {
    console.log(`  自动目标语言: Chinese (因为输入不是中文)`)
    return 'Chinese'
  }
}

// 获取源语言代码 - 默认假设源语言是英文
function getSourceLangCode(): string {
  // MyMemory API 需要明确的源语言，不能使用 'auto'
  // 可以后续改进为自动检测源语言，现在默认为英文
  return 'en'
}

// Helper function to get language code - 确保返回2字母ISO代码
function getLangCode(lang: string): string {
  const langMap: Record<string, string> = {
    'Chinese': 'zh',      // 改为 zh 而不是 zh-CN (MyMemory 需要2字母代码)
    'English': 'en',
    'French': 'fr',
    'Spanish': 'es',
    'German': 'de',
    'Japanese': 'ja',
    'Korean': 'ko',
  }
  const mapped = langMap[lang]
  if (!mapped) {
    // 如果是 zh-CN 这样的格式，提取前两个字母
    return lang.length > 2 ? lang.split('-')[0].toLowerCase() : lang.toLowerCase()
  }
  return mapped
}

// IPC Handlers for Clipboard
ipcMain.handle('get-clipboard-text', async () => {
  return clipboard.readText()
})

ipcMain.handle('set-clipboard-text', async (_event, text: string) => {
  clipboard.writeText(text)
  return true
})

// IPC Handlers for Settings
ipcMain.handle('set-auto-start', async (_event, enabled: boolean) => {
  appSettings.autoStart = enabled
  
  if (enabled) {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true,
    })
    console.log('[设置] 自动启动已启用')
  } else {
    app.setLoginItemSettings({
      openAtLogin: false,
    })
    console.log('[设置] 自动启动已禁用')
  }
  
  return { success: true }
})

ipcMain.handle('set-minimize-to-tray', async (_event, enabled: boolean) => {
  appSettings.minimizeToTray = enabled
  console.log(`[设置] 最小化到托盘: ${enabled}`)
  return { success: true }
})

ipcMain.handle('get-settings', async () => {
  return appSettings
})

// Translate via Google Translate API (最可靠的选项)
async function tryGoogleTranslateAPI(text: string, targetLangCode: string) {
  console.log(`\n[Google Translate]`)
  console.log(`  文本长度: ${text.length} 字符`)
  console.log(`  文本内容: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`)
  
  try {
    // Map our language codes to Google's language codes
    const googleLangMap: Record<string, string> = {
      'zh': 'zh-CN',
      'en': 'en',
      'fr': 'fr',
      'es': 'es',
      'de': 'de',
      'ja': 'ja',
      'ko': 'ko',
    }
    
    const googleLangCode = googleLangMap[targetLangCode] || targetLangCode
    
    console.log(`  源语言: auto`)
    console.log(`  目标语言代码: ${googleLangCode}`)
    
    // 调用 translate-google
    const translatedText = await translate(text, { to: googleLangCode })
    
    console.log(`  HTTP 状态码: 200`)
    
    if (translatedText && translatedText.trim().length > 0) {
      console.log(`  ✅ 翻译成功: "${translatedText.substring(0, 100)}${translatedText.length > 100 ? '...' : ''}"`)
      return translatedText
    }
    
    throw new Error('翻译结果为空')
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.log(`  ❌ 失败: ${errorMsg}`)
    throw error
  }
}

// Translate via MyMemory
async function tryMyMemoryAPI(text: string, targetLangCode: string, attempt = 1) {
  console.log(`\n[MyMemory 第${attempt}次尝试]`)
  console.log(`  文本长度: ${text.length} 字符`)
  console.log(`  文本内容: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`)  
  try {
    const sourceLang = getSourceLangCode()
    const langPair = `${sourceLang}|${targetLangCode}`
    
    console.log(`  源语言: ${sourceLang}`)
    console.log(`  目标语言: ${targetLangCode}`)
    console.log(`  LANGPAIR 参数: ${langPair}`)
    console.log(`  API URL: https://api.mymemory.translated.net/get`)
    
    const response = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: text,
        langpair: langPair,
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      validateStatus: () => true,  // 接受所有状态码，手动处理错误
    })

    console.log(`  HTTP 状态码: ${response.status}`)
    
    if (response.status !== 200) {
      console.log(`  ⚠️ HTTP ${response.status}: ${response.statusText}`)
      if (response.status >= 400) {
        console.log(`  响应体: ${JSON.stringify(response.data)}`)
      }
    }
    
    console.log(`  API 响应状态: ${response.data?.responseStatus}`)
    
    if (response.data?.responseData) {
      const respData = response.data.responseData
      console.log(`  API 响应详情:`, {
        translatedText: respData.translatedText ? respData.translatedText.substring(0, 100) : 'null',
        error: respData.error,
        match: respData.match,
      })
    }
    
    const result = response.data?.responseData?.translatedText
    const status = response.data?.responseStatus
    
    if (status === 200 && result && result.trim().length > 0) {
      console.log(`  ✅ 翻译成功: "${result.substring(0, 100)}${result.length > 100 ? '...' : ''}"`)  
      return result
    }
    
    const apiError = response.data?.responseData?.error || `HTTP ${response.status}`
    throw new Error(`API 返回状态 ${status}: ${apiError}`)  
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.log(`  ❌ 第${attempt}次失败：${errorMsg}`)
    
    // 详细的HTTP错误诊断
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as any
      console.log(`  HTTP 错误详情:`)
      console.log(`    - HTTP 状态码: ${axiosError.response?.status}`)
      console.log(`    - 状态文本: ${axiosError.response?.statusText}`)
      console.log(`    - 响应体: ${JSON.stringify(axiosError.response?.data)}`)
    } else if (error instanceof Error && 'code' in error) {
      const axiosError = error as any
      console.log(`  网络错误: ${axiosError.code}`)
    }
    
    // 如果是 403 或其他 4xx 错误，不重试，直接抛出
    if (error instanceof Error && (error.message.includes('403') || error.message.includes('4'))) {
      console.log(`  ℹ️ 不重试 4xx 错误`)
      throw error
    }
    
    if (attempt < 2) {
      console.log(`  ⏳ 等待2秒后重试...`)
      await new Promise(r => setTimeout(r, 2000))
      return tryMyMemoryAPI(text, targetLangCode, attempt + 1)
    }
    throw error
  }
}

// Translate via LibreTranslate (fallback)
async function tryLibreTranslateAPI(text: string, targetLangCode: string) {
  console.log(`\n[LibreTranslate 备用方案]`)
  console.log(`  文本长度: ${text.length} 字符`)
  console.log(`  文本内容: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`)  
  try {
    // Map language codes to LibreTranslate codes
    const libretranslateMap: Record<string, string> = {
      'zh': 'zh',
      'en': 'en',
      'fr': 'fr',
      'es': 'es',
      'de': 'de',
      'ja': 'ja',
      'ko': 'ko',
    }
    
    const libLangCode = libretranslateMap[targetLangCode] || targetLangCode
    
    console.log(`  源语言: auto (自动检测)`)
    console.log(`  目标语言: ${libLangCode}`)
    console.log(`  API URL: https://libretranslate.de/translate`)
    
    const response = await axios.post(
      'https://libretranslate.de/translate',
      {
        q: text,
        source: 'auto',
        target: libLangCode,
      },
      {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    )

    console.log(`  HTTP 状态码: ${response.status}`)
    
    const result = response.data?.translatedText
    
    if (result && result.trim().length > 0) {
      console.log(`  ✅ 翻译成功: "${result.substring(0, 100)}${result.length > 100 ? '...' : ''}"`)  
      return result
    }
    
    throw new Error(`无效的结果: ${result}`)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.log(`  ❌ 备用方案失败: ${errorMsg}`)
    throw error
  }
}

// IPC Handler for Translation - 在主进程中进行翻译
ipcMain.handle('translate', async (_event, text: string, targetLang?: string) => {
  try {
    console.log(`\n========== 开始翻译请求 ==========`)
    console.log(`输入文本: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`)
    
    // 自动检测输入文本的语言
    console.log(`[语言检测]`)
    const detectedLang = detectLanguage(text)
    
    // 自动确定目标语言（如果没有指定）
    let finalTargetLang = targetLang
    if (!finalTargetLang || finalTargetLang === 'auto') {
      finalTargetLang = getAutoTargetLanguage(detectedLang)
      console.log(`[自动模式] 用户未指定目标语言，已自动选择`)
    } else {
      console.log(`用户指定的目标语言: ${targetLang}`)
    }
    
    const targetLangCode = getLangCode(finalTargetLang)
    console.log(`语言代码转换: ${finalTargetLang} -> ${targetLangCode}`)
    console.log(``)
    
    let result: string | null = null
    let lastError: Error | null = null
    
    // 优先级顺序: Google Translate > LibreTranslate > MyMemory
    
    // 1. Try Google Translate (最可靠)
    try {
      console.log(`\n[调度器] 尝试方案1: Google Translate`)
      result = await tryGoogleTranslateAPI(text, targetLangCode)
      if (result) {
        console.log(`\n[主进程调度] ✅ Google Translate 成功`)
        console.log(`检测语言: ${detectedLang === 'chinese' ? '中文' : '非中文语言'}`)
        console.log(`目标语言: ${finalTargetLang}`)
        console.log(`结果: "${result.substring(0, 100)}${result.length > 100 ? '...' : ''}"`)
        console.log(`========== 翻译完成 ==========\n`)
        return { 
          success: true, 
          data: result,
          detectedLanguage: detectedLang === 'chinese' ? 'Chinese' : 'Other',
          targetLanguage: finalTargetLang,
        }
      }
    } catch (error) {
      lastError = error as Error
      console.log(`\n[调度器] Google Translate 失败，尝试备用方案...`)
    }
    
    // 2. Try LibreTranslate (次可靠)
    try {
      console.log(`\n[调度器] 尝试方案2: LibreTranslate`)
      result = await tryLibreTranslateAPI(text, targetLangCode)
      if (result) {
        console.log(`\n[主进程调度] ✅ LibreTranslate 成功`)
        console.log(`检测语言: ${detectedLang === 'chinese' ? '中文' : '非中文语言'}`)
        console.log(`目标语言: ${finalTargetLang}`)
        console.log(`结果: "${result.substring(0, 100)}${result.length > 100 ? '...' : ''}"`)
        console.log(`========== 翻译完成 ==========\n`)
        return { 
          success: true, 
          data: result,
          detectedLanguage: detectedLang === 'chinese' ? 'Chinese' : 'Other',
          targetLanguage: finalTargetLang,
        }
      }
    } catch (error) {
      lastError = error as Error
      console.log(`\n[调度器] LibreTranslate 失败，尝试备用方案...`)
    }
    
    // 3. Try MyMemory (最后的备用)
    try {
      console.log(`\n[调度器] 尝试方案3: MyMemory`)
      result = await tryMyMemoryAPI(text, targetLangCode)
      if (result) {
        console.log(`\n[主进程调度] ✅ MyMemory 成功`)
        console.log(`检测语言: ${detectedLang === 'chinese' ? '中文' : '非中文语言'}`)
        console.log(`目标语言: ${finalTargetLang}`)
        console.log(`结果: "${result.substring(0, 100)}${result.length > 100 ? '...' : ''}"`)
        console.log(`========== 翻译完成 ==========\n`)
        return { 
          success: true, 
          data: result,
          detectedLanguage: detectedLang === 'chinese' ? 'Chinese' : 'Other',
          targetLanguage: finalTargetLang,
        }
      }
    } catch (error) {
      lastError = error as Error
    }
    
    console.error(`\n[主进程调度] ❌ 所有翻译 API 都失败了`)
    throw lastError || new Error('无法获取翻译结果')
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`\n[主进程调度] ❌ 翻译异常: ${errorMsg}`)
    console.log(`========== 翻译失败 ==========\n`)
    return { success: false, error: errorMsg }
  }
})

// Clipboard Monitor IPC Handlers
ipcMain.handle('start-clipboard-monitor', async () => {
  if (clipboardMonitorInterval) {
    return { success: true, message: '剪贴板监听已在运行' }
  }

  console.log(`[剪贴板监听] 启动监听...`)
  lastClipboardText = clipboard.readText()

  clipboardMonitorInterval = setInterval(async () => {
    try {
      const currentText = clipboard.readText()

      // 检查剪贴板内容是否改变且满足翻译条件
      if (currentText !== lastClipboardText && currentText.trim().length > 0 && currentText.trim().length < 500) {
        lastClipboardText = currentText

        console.log(`[剪贴板监听] 检测到新内容: "${currentText.substring(0, 50)}${currentText.length > 50 ? '...' : ''}"`)

        // 异步翻译，不阻塞监听
        const translationResult = await performQuickTranslate(currentText)

        if (translationResult) {
          console.log(`[剪贴板监听] 翻译完成，发送消息给渲染进程`)
          mainWindow?.webContents.send('clipboard-translation', {
            text: currentText,
            translation: translationResult.translation,
            detected: translationResult.detected,
            target: translationResult.target,
          })
        }
      }
    } catch (error) {
      console.error(`[剪贴板监听] 错误:`, error)
    }
  }, 500) // 每500ms检查一次

  return { success: true, message: '剪贴板监听已启动' }
})

ipcMain.handle('stop-clipboard-monitor', async () => {
  if (clipboardMonitorInterval) {
    clearInterval(clipboardMonitorInterval)
    clipboardMonitorInterval = null
    console.log(`[剪贴板监听] 已停止`)
    return { success: true, message: '剪贴板监听已停止' }
  }
  return { success: false, message: '剪贴板监听未运行' }
})

// 快速翻译函数 - 在后台进行翻译
async function performQuickTranslate(text: string) {
  try {
    const detectedLang = detectLanguage(text)
    const targetLang = getAutoTargetLanguage(detectedLang)
    const targetLangCode = getLangCode(targetLang)

    let result: string | null = null

    // 快速尝试 - 只用Google Translate
    try {
      result = await tryGoogleTranslateAPI(text, targetLangCode)
      if (result) {
        return {
          translation: result,
          detected: detectedLang === 'chinese' ? 'Chinese' : 'Other',
          target: targetLang,
        }
      }
    } catch (_e) {
      // 失败则尝试LibreTranslate
      try {
        result = await tryLibreTranslateAPI(text, targetLangCode)
        if (result) {
          return {
            translation: result,
            detected: detectedLang === 'chinese' ? 'Chinese' : 'Other',
            target: targetLang,
          }
        }
      } catch (_e2) {
        // 继续失败则尝试MyMemory
        try {
          result = await tryMyMemoryAPI(text, targetLangCode)
          if (result) {
            return {
              translation: result,
              detected: detectedLang === 'chinese' ? 'Chinese' : 'Other',
              target: targetLang,
            }
          }
        } catch (_e3) {
          return null
        }
      }
    }

    return null
  } catch (error) {
    console.error(`[剪贴板快速翻译] 异常:`, error)
    return null
  }
}

// App Menu
const menu: (Electron.MenuItem | Electron.MenuItemConstructorOptions)[] = [
  {
    label: '编辑',
    submenu: [
      { role: 'undo', label: '撤销' },
      { role: 'redo', label: '重做' },
      { type: 'separator' },
      { role: 'cut', label: '剪切' },
      { role: 'copy', label: '复制' },
      { role: 'paste', label: '粘贴' },
    ],
  },
  {
    label: '查看',
    submenu: [
      { role: 'reload', label: '刷新' },
      { role: 'forceReload', label: '强制刷新' },
      { role: 'toggleDevTools', label: '开发者工具' },
    ],
  },
]

Menu.setApplicationMenu(Menu.buildFromTemplate(menu))
