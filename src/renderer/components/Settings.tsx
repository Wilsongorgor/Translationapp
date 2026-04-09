import { useState, useEffect } from 'react'
import styles from './Settings.module.css'

interface SettingsData {
  minimizeToTray: boolean
  autoStart: boolean
  showPronunciation: boolean
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>({
    minimizeToTray: true,  // 默认启用最小化到托盘
    autoStart: false,
    showPronunciation: true,
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // 从 localStorage 读取设置
    const savedSettings = localStorage.getItem('appSettings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error('Failed to parse settings:', e)
      }
    }
  }, [])

  const handleToggle = (key: keyof SettingsData) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    }
    setSettings(newSettings)
    localStorage.setItem('appSettings', JSON.stringify(newSettings))

    // 向主进程发送设置更新
    if (key === 'autoStart') {
      window.electron?.setAutoStart(newSettings.autoStart)
    }
    if (key === 'minimizeToTray') {
      window.electron?.setMinimizeToTray(newSettings.minimizeToTray)
    }

    // 显示保存成功提示
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>⚙️ 应用设置</h2>
        {saved && <span className={styles.success}>✓ 已保存</span>}
      </div>

      <div className={styles.settingsGroup}>
        <h3>窗口设置</h3>
        
        <div className={styles.settingItem}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>最小化到系统托盘</label>
            <p className={styles.description}>点击关闭按钮时最小化到系统托盘而不是退出应用</p>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.minimizeToTray}
              onChange={() => handleToggle('minimizeToTray')}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.settingItem}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>开启自动启动</label>
            <p className={styles.description}>系统启动时自动启动翻译应用</p>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.autoStart}
              onChange={() => handleToggle('autoStart')}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>

      <div className={styles.settingsGroup}>
        <h3>翻译设置</h3>
        
        <div className={styles.settingItem}>
          <div className={styles.settingInfo}>
            <label className={styles.label}>显示英美音标和发音</label>
            <p className={styles.description}>在翻译结果中显示英式和美式音标及发音</p>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.showPronunciation}
              onChange={() => handleToggle('showPronunciation')}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>

      <div className={styles.info}>
        <p>💡 设置会实时保存，关闭应用后仍然生效</p>
      </div>
    </div>
  )
}
