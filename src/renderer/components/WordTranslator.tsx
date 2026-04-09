import { useState } from 'react'
import { translateText } from '../../api/translator'
import styles from './WordTranslator.module.css'

export default function WordTranslator() {
  const [selectedText, setSelectedText] = useState('')
  const [translation, setTranslation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<Array<{ text: string; trans: string }>>([])
  const [detectedLang, setDetectedLang] = useState('')
  const [targetLang, setTargetLang] = useState('')

  const handleTextSelect = async (event: React.MouseEvent<HTMLDivElement>) => {
    const selected = window.getSelection()?.toString() || ''
    if (selected.trim()) {
      setSelectedText(selected)
      setError('')
      await handleTranslate(selected)
    }
  }

  const handleTranslate = async (text: string) => {
    if (!text.trim()) return

    setLoading(true)
    setError('')
    setTranslation('')
    setDetectedLang('')
    setTargetLang('')
    
    try {
      // Use undefined as targetLang to let main process auto-detect
      const result = await translateText(text, undefined, 'google')
      
      // Extract translatedText from result object
      if (typeof result === 'object' && result !== null && 'translatedText' in result) {
        setTranslation(result.translatedText)
        setDetectedLang(result.detectedLanguage || '')
        setTargetLang(result.targetLanguage || '')
        
        // Add to history with extracted text
        setHistory([{ text, trans: result.translatedText }, ...history.slice(0, 9)])
      } else {
        // Fallback for string result
        const translatedStr = result as string
        setTranslation(translatedStr)
        setHistory([{ text, trans: translatedStr }, ...history.slice(0, 9)])
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '翻译失败，请重试'
      setError(errorMsg)
      console.error('Translation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    window.electron?.setClipboardText(translation)
    alert('已复制到剪贴板')
  }

  return (
    <div className={styles.container}>
      <div className={styles.selectArea} onMouseUp={handleTextSelect}>
        <p className={styles.hint}>在这里选中文本进行翻译 - 自动检测语言</p>
        <div className={styles.placeholder}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
          magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
        </div>
      </div>

      <div className={styles.result}>
        <h3>翻译结果</h3>
        {error && <div className={styles.error}>{error}</div>}
        {detectedLang && <div className={styles.detection}>📝 检测语言: {detectedLang} → 翻译为: {targetLang}</div>}
        {loading ? (
          <p className={styles.loading}>翻译中...</p>
        ) : translation ? (
          <>
            <div className={styles.translation}>{translation}</div>
            <button className={styles.copyBtn} onClick={copyToClipboard}>
              复制
            </button>
          </>
        ) : (
          <p className={styles.empty}>选中文本以进行翻译</p>
        )}
      </div>

      {history.length > 0 && (
        <div className={styles.history}>
          <h4>翻译历史</h4>
          <ul>
            {history.map((item, idx) => (
              <li key={idx} onClick={() => handleTranslate(item.text)}>
                <span className={styles.original}>{item.text.substring(0, 30)}</span>
                <span className={styles.separator}>→</span>
                <span className={styles.trans}>{item.trans.substring(0, 30)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
