import { useState, useEffect } from 'react'
import styles from './ClipboardPopup.module.css'

interface PopupData {
  text: string
  translation: string
  detected: string
  target: string
}

declare global {
  interface Window {
    electron?: {
      startClipboardMonitor: () => Promise<any>
      stopClipboardMonitor: () => Promise<any>
      onClipboardTranslation: (callback: (data: PopupData) => void) => void
      setClipboardText: (text: string) => Promise<void>
    }
  }
}

export default function ClipboardPopup() {
  const [popup, setPopup] = useState<PopupData | null>(null)
  const [visible, setVisible] = useState(false)
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // 启动剪贴板监听
    window.electron?.startClipboardMonitor()

    // 监听剪贴板翻译结果
    window.electron?.onClipboardTranslation((data: PopupData) => {
      console.log('[ClipboardPopup] 接收到翻译:', data)
      setPopup(data)
      setVisible(true)

      // 清除之前的自动隐藏计时器
      if (autoHideTimer) {
        clearTimeout(autoHideTimer)
      }

      // 10秒后自动隐藏
      const timer = setTimeout(() => {
        setVisible(false)
      }, 10000)

      setAutoHideTimer(timer)
    })

    return () => {
      if (autoHideTimer) clearTimeout(autoHideTimer)
      window.electron?.stopClipboardMonitor()
    }
  }, [autoHideTimer])

  const handleCopy = (text: string) => {
    window.electron?.setClipboardText(text)
    alert('已复制到剪贴板')
  }

  const handleClose = () => {
    setVisible(false)
    if (autoHideTimer) clearTimeout(autoHideTimer)
  }

  if (!visible || !popup) return null

  return (
    <div className={styles.popupContainer}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <div className={styles.title}>剪贴板翻译</div>
          <button className={styles.closeBtn} onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <div className={styles.label}>原文 ({popup.detected})</div>
            <div className={styles.text}>{popup.text.substring(0, 150)}</div>
          </div>

          <div className={styles.arrow}>↓</div>

          <div className={styles.section}>
            <div className={styles.label}>翻译 ({popup.target})</div>
            <div className={styles.translation}>{popup.translation.substring(0, 150)}</div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.copyBtn} onClick={() => handleCopy(popup.translation)}>
            复制翻译
          </button>
          <button className={styles.copyBtn} onClick={() => handleCopy(`${popup.text}\n${popup.translation}`)}>
            复制双语
          </button>
        </div>
      </div>
    </div>
  )
}
