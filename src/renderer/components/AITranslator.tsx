import { useState } from 'react'
import { translateText } from '../../api/translator'
import styles from './AITranslator.module.css'

export default function AITranslator() {
  const [sourceText, setSourceText] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('Chinese')
  const [translatedText, setTranslatedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '')
  const [showApiKeyInput, setShowApiKeyInput] = useState(!apiKey)

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      setError('API Key 不能为空')
      return
    }
    localStorage.setItem('openai_api_key', apiKey)
    setShowApiKeyInput(false)
    setError('')
  }

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setError('请输入要翻译的文本')
      return
    }
    if (!apiKey.trim()) {
      setError('请先设置 OpenAI API Key')
      setShowApiKeyInput(true)
      return
    }

    setLoading(true)
    setError('')
    setTranslatedText('')
    
    try {
      const result = await translateText(sourceText, targetLanguage, 'ai')
      setTranslatedText(result)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'AI 翻译失败，请检查 API Key 和网络连接'
      setError(errorMsg)
      console.error('Translation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    window.electron?.setClipboardText(translatedText)
    alert('已复制到剪贴板')
  }

  return (
    <div className={styles.container}>
      {showApiKeyInput && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>设置 OpenAI API Key</h3>
            <p>使用 AI 翻译需要配置 OpenAI API Key。您可以在 https://platform.openai.com/api-keys 获取</p>
            <input
              type="password"
              className={styles.input}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="输入您的 API Key..."
            />
            <div className={styles.modalButtons}>
              <button className={styles.confirmBtn} onClick={handleSaveApiKey}>
                确认
              </button>
              <button className={styles.cancelBtn} onClick={() => setShowApiKeyInput(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.header}>
          <h3>原始文本</h3>
          <button className={styles.settingsBtn} onClick={() => setShowApiKeyInput(true)}>
            ⚙️ API 设置
          </button>
        </div>
        <textarea
          className={styles.textarea}
          value={sourceText}
          onChange={(e) => {
            setSourceText(e.target.value)
            setError('')
          }}
          placeholder="输入要翻译的文本，AI 将进行智能翻译..."
        />
        <div className={styles.info}>
          <span className={styles.charCount}>{sourceText.length} 字符</span>
          <select
            className={styles.languageSelect}
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
          >
            <option value="Chinese">Chinese (中文)</option>
            <option value="English">English (英文)</option>
            <option value="Spanish">Spanish (西班牙文)</option>
            <option value="French">French (法文)</option>
            <option value="German">German (德文)</option>
            <option value="Japanese">Japanese (日文)</option>
            <option value="Korean">Korean (韩文)</option>
          </select>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.header}>
          <h3>AI 翻译结果</h3>
          {translatedText && (
            <button className={styles.copyBtn} onClick={copyToClipboard}>
              复制
            </button>
          )}
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <textarea
          className={styles.textarea}
          value={translatedText}
          readOnly
          placeholder="AI 翻译结果将显示在这里..."
        />
        <button
          className={`${styles.translateBtn} ${loading ? styles.loading : ''}`}
          onClick={handleTranslate}
          disabled={loading || !sourceText.trim()}
        >
          {loading ? '翻译中...' : '使用 AI 翻译'}
        </button>
      </div>

      <div className={styles.tips}>
        <h4>💡 AI 翻译特点</h4>
        <ul>
          <li>支持更复杂的语言结构理解</li>
          <li>提供更自然的翻译表达</li>
          <li>支持多语言互译</li>
          <li>可处理习语和文化表达</li>
        </ul>
      </div>
    </div>
  )
}
