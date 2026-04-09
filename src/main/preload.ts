import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getClipboardText: () => ipcRenderer.invoke('get-clipboard-text'),
  setClipboardText: (text: string) =>
    ipcRenderer.invoke('set-clipboard-text', text),
  translateText: (text: string, targetLang?: string) =>
    ipcRenderer.invoke('translate', text, targetLang),
  startClipboardMonitor: () => ipcRenderer.invoke('start-clipboard-monitor'),
  stopClipboardMonitor: () => ipcRenderer.invoke('stop-clipboard-monitor'),
  onClipboardTranslation: (callback: (data: { text: string; translation: string; detected: string; target: string }) => void) =>
    ipcRenderer.on('clipboard-translation', (_event, data) => callback(data)),
  setAutoStart: (enabled: boolean) =>
    ipcRenderer.invoke('set-auto-start', enabled),
  setMinimizeToTray: (enabled: boolean) =>
    ipcRenderer.invoke('set-minimize-to-tray', enabled),
  getSettings: () => ipcRenderer.invoke('get-settings'),
}

contextBridge.exposeInMainWorld('electron', api)

declare global {
  interface Window {
    electron: typeof api
  }
}
