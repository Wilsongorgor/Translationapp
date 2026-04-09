import { useState } from 'react'
import { translateText } from '../../api/translator'
import styles from './ArticleTranslator.module.css'

export default function ArticleTranslator() {
  const [articleText, setArticleText] = useState('')
  const [translatedArticle, setTranslatedArticle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)

  const handleTranslate = async () => {
    if (!articleText.trim()) {
      setError('请输入要翻译的文章')
      return
    }

    setLoading(true)
    setError('')
    setProgress(0)

    try {
      // Split article into paragraphs
      const paragraphs = articleText.split('\n\n').filter((p) => p.trim())
      const translations: string[] = []

      for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i]
        try {
          // Use undefined as targetLang to let main process auto-detect
          const result = await translateText(para, undefined, 'google')
          
          // Extract translatedText from result object
          if (typeof result === 'object' && result !== null && 'translatedText' in result) {
            translations.push(result.translatedText)
          } else {
            // Fallback for string result
            translations.push(result as string)
          }
        } catch (error) {
          console.error(`Paragraph ${i + 1} translation error:`, error)
          translations.push(`[翻译失败] ${para}`)
        }
        setProgress(Math.round(((i + 1) / paragraphs.length) * 100))
      }

      setTranslatedArticle(translations.join('\n\n'))
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '文章翻译失败，请重试'
      setError(errorMsg)
      console.error('Translation error:', error)
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const handleClear = () => {
    setArticleText('')
    setTranslatedArticle('')
    setError('')
  }

  const copyToClipboard = () => {
    window.electron?.setClipboardText(translatedArticle)
    alert('已复制到剪贴板')
  }

  const downloadTranslation = () => {
    const element = document.createElement('a')
    const file = new Blob([translatedArticle], { type: 'text/plain;charset=utf-8' })
    element.href = URL.createObjectURL(file)
    element.download = '翻译结果.txt'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.header}>
          <h3>原始文章</h3>
          <span className={styles.info}>{articleText.length} 字符</span>
        </div>
        <textarea
          className={styles.textarea}
          value={articleText}
          onChange={(e) => {
            setArticleText(e.target.value)
            setError('')
          }}
          placeholder="粘贴或输入要翻译的文章..."
        />
        <div className={styles.actions}>
          <button className={styles.btn} onClick={handleTranslate} disabled={loading || !articleText.trim()}>
            {loading ? `翻译中 ${progress}%` : '翻译文章'}
          </button>
          <button className={styles.btn} onClick={handleClear}>
            清空
          </button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {loading && <div className={styles.progressBar}></div>}
      </div>

      <div className={styles.section}>
        <div className={styles.header}>
          <h3>翻译结果</h3>
          {translatedArticle && (
            <div className={styles.resultActions}>
              <button className={styles.smallBtn} onClick={copyToClipboard}>
                复制
              </button>
              <button className={styles.smallBtn} onClick={downloadTranslation}>
                下载
              </button>
            </div>
          )}
        </div>
        <textarea
          className={styles.textarea}
          value={translatedArticle}
          readOnly
          placeholder="翻译结果将显示在这里..."
        />
      </div>
    </div>
  )
}
