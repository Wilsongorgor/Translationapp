import { useState } from 'react'
import styles from './App.module.css'
import WordTranslator from './components/WordTranslator'
import InputTranslator from './components/InputTranslator'
import ArticleTranslator from './components/ArticleTranslator'
import AITranslator from './components/AITranslator'
import Settings from './components/Settings'
import ClipboardPopup from './components/ClipboardPopup'

type TabType = 'word' | 'input' | 'article' | 'ai'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('input')
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Wilson专属翻译</h1>
        <button
          className={styles.settingsBtn}
          onClick={() => setShowSettings(true)}
          title="打开设置"
        >
          ⚙️
        </button>
      </header>

      <nav className={styles.nav}>
        <button
          className={`${styles.tab} ${activeTab === 'word' ? styles.active : ''}`}
          onClick={() => setActiveTab('word')}
        >
          划词翻译
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'input' ? styles.active : ''}`}
          onClick={() => setActiveTab('input')}
        >
          输入翻译
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'article' ? styles.active : ''}`}
          onClick={() => setActiveTab('article')}
        >
          文章翻译
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'ai' ? styles.active : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          AI翻译
        </button>
      </nav>

      <main className={styles.content}>
        {activeTab === 'word' && <WordTranslator />}
        {activeTab === 'input' && <InputTranslator />}
        {activeTab === 'article' && <ArticleTranslator />}
        {activeTab === 'ai' && <AITranslator />}
      </main>

      {/* 设置模态框 */}
      {showSettings && (
        <div className={styles.modalOverlay} onClick={() => setShowSettings(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>设置</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowSettings(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <Settings />
            </div>
          </div>
        </div>
      )}

      <ClipboardPopup />
    </div>
  )
}
