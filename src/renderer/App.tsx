import { useState } from 'react'
import styles from './App.module.css'
import WordTranslator from './components/WordTranslator'
import InputTranslator from './components/InputTranslator'
import ArticleTranslator from './components/ArticleTranslator'
import AITranslator from './components/AITranslator'
import Settings from './components/Settings'
import ClipboardPopup from './components/ClipboardPopup'

const TABS = [
  { id: 'input' as const, label: '翻译', icon: '⇄' },
  { id: 'word' as const, label: '词典', icon: '🔍' },
  { id: 'article' as const, label: '文档', icon: '📝' },
  { id: 'ai' as const, label: 'AI', icon: '✨' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<'input'|'word'|'article'|'ai'>('input')
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className={styles.app}>
      <header className={styles.toolbar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>译</div>
          Wilson 翻译
        </div>
        <nav className={styles.tabBar}>
          {TABS.map(t => (
            <button key={t.id} className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
        <div className={styles.spacer} />
        <button className={styles.settingsBtn} onClick={() => setShowSettings(true)} title='设置'>⚙️</button>
      </header>
      <main className={styles.main}>
        {activeTab === 'word' && <WordTranslator />}
        {activeTab === 'input' && <InputTranslator />}
        {activeTab === 'article' && <ArticleTranslator />}
        {activeTab === 'ai' && <AITranslator />}
      </main>
      {showSettings && (
        <div className={styles.modalOverlay} onClick={() => setShowSettings(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h2>设置</h2>
              <button className={styles.modalClose} onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <div className={styles.modalBody}><Settings /></div>
          </div>
        </div>
      )}
      <ClipboardPopup />
    </div>
  )
}