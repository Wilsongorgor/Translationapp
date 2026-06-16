import { app, BrowserWindow, Menu, ipcMain, clipboard, Tray, nativeImage, globalShortcut } from 'electron'
import path from 'path'
import fs from 'fs'
import axios from 'axios'
// @ts-ignore
// Google Translate via direct API

const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let clipboardTimer: NodeJS.Timeout | null = null
let lastClipText = ''
let isQuitting = false

let appSettings = {
  minimizeToTray: true,
  autoStart: false,
}

const logDir = path.join(process.cwd(), '.logs')
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
const logFile = path.join(logDir, 'app.log')
const errorLog = path.join(logDir, 'error.log')

function log(msg: string) {
  const ts = new Date().toLocaleString('zh-CN')
  const line = `[${ts}] ${msg}
`
  try { fs.appendFileSync(logFile, line) } catch {}
  console.log(line.trim())
}
function logError(msg: string, e?: any) {
  const ts = new Date().toLocaleString('zh-CN')
  let line = `[${ts}] ERROR: ${msg}\n`
  if (e) { line += (e.stack || JSON.stringify(e)) + '\\n' }
  try { fs.appendFileSync(errorLog, line) } catch {}
  console.error(line.trim())
}

try { log('App starting...') } catch {}

function detectLanguage(text: string): 'chinese' | 'other' {
  const chineseChars = text.match(/[\u4E00-\u9FFF]/g) || []
  const pct = (chineseChars.length / Math.max(text.length, 1)) * 100
  return pct > 30 ? 'chinese' : 'other'
}
function getAutoTarget(detected: 'chinese' | 'other'): string {
  return detected === 'chinese' ? 'English' : 'Chinese'
}
function getLangCode(lang: string): string {
  const map: Record<string, string> = {
    'Chinese': 'zh-CN', 'English': 'en', 'French': 'fr', 'Spanish': 'es',
    'German': 'de', 'Japanese': 'ja', 'Korean': 'ko',
  }
  return map[lang] || lang.split('-')[0].toLowerCase()
}

async function translateViaGoogle(text: string, targetCode: string): Promise<string> {
  const resp = await axios.get('https://translate.googleapis.com/translate_a/single', {
    params: {
      client: 'gtx',
      sl: 'auto',
      tl: targetCode,
      dt: 't',
      q: text,
    },
    timeout: 5000,
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  const result = resp.data?.[0]?.map((seg: any) => seg[0]).filter(Boolean).join('')
  if (result && result.trim()) return result
  throw new Error('Empty translation result')
}

async function translateViaMyMemory(text: string, targetCode: string): Promise<string> {
  const resp = await axios.get('https://api.mymemory.translated.net/get', {
    params: { q: text, langpair: 'en|' + targetCode },
    timeout: 8000,
  })
  const result = resp.data?.responseData?.translatedText
  if (result) return result
  throw new Error('MyMemory failed')
}

async function performTranslate(text: string, targetLang?: string) {
  log('Translating: ' + text.substring(0, 60))
  const detected = detectLanguage(text)
  const finalTarget = targetLang && targetLang !== 'auto'
    ? targetLang
    : getAutoTarget(detected)
  const code = getLangCode(finalTarget)

  let result: string | null = null
  try { result = await translateViaGoogle(text, code) }
  catch (e1) {
    try { result = await translateViaMyMemory(text, code) }
    catch (e2) { logError('All engines failed', e2) }
  }

  if (!result) throw new Error('All translation engines failed')

  return {
    success: true,
    data: result,
    detectedLanguage: detected === 'chinese' ? 'Chinese' : 'Other',
    targetLanguage: finalTarget,
  }
}

function startClipboardMonitor() {
  if (clipboardTimer) return
  lastClipText = clipboard.readText()
  log('Clipboard monitor started')
  clipboardTimer = setInterval(async () => {
    try {
      const current = clipboard.readText()
      if (current !== lastClipText && current.trim().length > 0 && current.trim().length < 1000) {
        lastClipText = current
        log('Clipboard: ' + current.substring(0, 50))
        try {
          const r = await performTranslate(current)
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('clipboard-translation', {
              text: current,
              translation: r.data,
              detected: r.detectedLanguage,
              target: r.targetLanguage,
            })
            if (!mainWindow.isVisible()) {
              mainWindow.show()
              mainWindow.focus()
            }
          }
        } catch (e) { logError('Quick translate failed', e) }
      }
    } catch (e) { logError('Clipboard monitor error', e) }
  }, 600)
}

function stopClipboardMonitor() {
  if (clipboardTimer) {
    clearInterval(clipboardTimer)
    clipboardTimer = null
  }
}

function registerShortcuts() {
  const registered = globalShortcut.register('CommandOrControl+Shift+T', async () => {
    log('Shortcut Ctrl+Shift+T triggered')
    const text = clipboard.readText()
    if (text.trim()) {
      try {
        const r = await performTranslate(text)
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('clipboard-translation', {
            text: text,
            translation: r.data,
            detected: r.detectedLanguage,
            target: r.targetLanguage,
          })
          mainWindow.show()
          mainWindow.focus()
        }
      } catch (e) { logError('Shortcut translate failed', e) }
    }
  })
  if (registered) log('Shortcut Ctrl+Shift+T registered')
  else logError('Failed to register shortcut')
}

function createWindow() {
  log('Creating window...')
  const winConfig: Electron.BrowserWindowConstructorOptions = {
    width: 1100, height: 700, minWidth: 800, minHeight: 500, show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  }
  const iconPaths = [
    path.join(process.cwd(), 'icon.jpg'),
    path.join(__dirname, 'icon.jpg'),
    path.join(__dirname, '../../icon.jpg'),
  ]
  for (const p of iconPaths) {
    if (fs.existsSync(p)) { winConfig.icon = p; break }
  }
  mainWindow = new BrowserWindow(winConfig)
  const url = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../../dist/index.html')}`
  mainWindow.loadURL(url)
  mainWindow.setTitle('Wilson \u7ffb\u8bd1')
  mainWindow.once('ready-to-show', () => { mainWindow?.show(); log('Window shown') })
  if (isDev) mainWindow.webContents.openDevTools()
  mainWindow.on('close', (event) => {
    if (isQuitting || !appSettings.minimizeToTray) { mainWindow = null; return }
    event.preventDefault()
    mainWindow?.hide()
    log('Window minimized to tray')
  })
  mainWindow.on('closed', () => { mainWindow = null })
}

function createTray() {
  log('Creating tray...')
  let iconImg: Electron.NativeImage
  try {
    const iconPath = path.join(process.cwd(), 'icon.jpg')
    if (fs.existsSync(iconPath)) {
      iconImg = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    } else { iconImg = nativeImage.createEmpty() }
  } catch { iconImg = nativeImage.createEmpty() }
  tray = new Tray(iconImg)
  tray.setToolTip('Wilson \u7ffb\u8bd1')
  const updateMenu = () => {
    const visible = mainWindow?.isVisible() ?? false
    tray?.setContextMenu(Menu.buildFromTemplate([
      { label: visible ? '\u9690\u85cf\u7a97\u53e3' : '\u663e\u793a\u7a97\u53e3',
        click: () => { if (mainWindow?.isVisible()) mainWindow.hide(); else { mainWindow?.show(); mainWindow?.focus() } } },
      { type: 'separator' },
      { label: '\u9000\u51fa\u7a0b\u5e8f',
        click: () => { isQuitting = true; stopClipboardMonitor(); app.quit() } },
    ]))
  }
  updateMenu()
  mainWindow?.on('show', updateMenu)
  mainWindow?.on('hide', updateMenu)
  tray.on('click', () => {
    if (mainWindow?.isVisible()) mainWindow.hide()
    else { mainWindow?.show(); mainWindow?.focus() }
  })
  log('Tray created')
}

ipcMain.handle('translate', async (_event, text: string, targetLang?: string) => {
  try { return await performTranslate(text, targetLang) }
  catch (error: any) { logError('Translate IPC failed', error); return { success: false, error: error.message || 'Translation failed' } }
})
ipcMain.handle('get-clipboard-text', async () => clipboard.readText())
ipcMain.handle('set-clipboard-text', async (_e, text: string) => { clipboard.writeText(text); return true })
ipcMain.handle('start-clipboard-monitor', async () => { startClipboardMonitor(); return { success: true } })
ipcMain.handle('stop-clipboard-monitor', async () => { stopClipboardMonitor(); return { success: true } })
ipcMain.handle('set-auto-start', async (_e, enabled: boolean) => {
  appSettings.autoStart = enabled
  app.setLoginItemSettings({ openAtLogin: enabled, openAsHidden: true })
  return { success: true }
})
ipcMain.handle('set-minimize-to-tray', async (_e, enabled: boolean) => {
  appSettings.minimizeToTray = enabled
  return { success: true }
})
ipcMain.handle('get-settings', async () => appSettings)

Menu.setApplicationMenu(Menu.buildFromTemplate([
  { label: '\u7f16\u8f91', submenu: [
    { role: 'undo', label: '\u64a4\u9500' }, { role: 'redo', label: '\u91cd\u505a' },
    { type: 'separator' }, { role: 'cut', label: '\u526a\u5207' }, { role: 'copy', label: '\u590d\u5236' },
    { role: 'paste', label: '\u7c98\u8d34' },
  ]},
  { label: '\u67e5\u770b', submenu: [
    { role: 'reload', label: '\u5237\u65b0' }, { role: 'forceReload', label: '\u5f3a\u5236\u5237\u65b0' },
    { role: 'toggleDevTools', label: '\u5f00\u53d1\u8005\u5de5\u5177' },
  ]},
]))

app.whenReady().then(() => {
  log('app.whenReady() triggered')
  createWindow()
  registerShortcuts()
  setTimeout(() => { try { createTray() } catch (e) { logError('Tray creation failed', e) } }, 500)
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (mainWindow === null) createWindow() })
app.on('will-quit', () => { globalShortcut.unregisterAll(); stopClipboardMonitor() })

