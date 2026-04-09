import { app, BrowserWindow, Menu, ipcMain, clipboard } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  })

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../../dist/index.html')}`

  mainWindow.loadURL(startUrl)

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

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

// IPC Handlers
ipcMain.handle('get-clipboard-text', async () => {
  return clipboard.readText()
})

ipcMain.handle('set-clipboard-text', async (_event, text: string) => {
  clipboard.writeText(text)
  return true
})

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
