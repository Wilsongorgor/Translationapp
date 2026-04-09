import { useState, useEffect } from 'react'
import { translateText } from '../../api/translator'
import { getPronunciation, speakWord } from '../utils/pronunciation'
import styles from './InputTranslator.module.css'

export default function InputTranslator() {
  const [inputText, setInputText] = useState('')
  const [translation, setTranslation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detectedLang, setDetectedLang] = useState<string>('')
  const [targetLang, setTargetLang] = useState<string>('')
  const [pronunciation, setPronunciation] = useState<{ uk: string; us: string } | null>(null)
  const [showPronunciation, setShowPronunciation] = useState(true)

  // 初始化时读取设置
  useEffect(() =>{
    const saved = localStorage.getItem('appSettings')
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        setShowPronunciation(settings.showPronunciation !== false)
      } catch (e) {
        console.error('Failed to parse settings:', e)
      }
    }
  }, [])

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError('请输入要翻译的文本')
      return
    }

    setLoading(true)
    setError('')
    setTranslation('')
    setDetectedLang('')
    setTargetLang('')
    setPronunciation(null)
    
    try {
      console.log('开始翻译，使用自动检测')
      // 不传递 targetLang，让主进程自动检测并选择
      const result = await translateText(inputText, undefined, 'google')
      console.log('翻译成功:', result)
      
      // 处理返回结果
      if (typeof result === 'object' && result !== null && 'translatedText' in result) {
        // 新的格式：包含检测信息
        setTranslation(result.translatedText)
        setDetectedLang(result.detectedLanguage || '')
        setTargetLang(result.targetLanguage || '')
        
        // 如果检测到非中文，尝试获取音标
        if (showPronunciation && result.detectedLanguage === 'Other') {
          const pron = await getPronunciation(inputText.trim().split(/\s+/)[0])
          setPronunciation(pron)
        }
      } else {
        // 旧的格式：直接返回翻译文本
        setTranslation(result as string)
        setDetectedLang('')
        setTargetLang('')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '翻译失败'
      console.error('翻译错误详情:', error)
      setError(`翻译失败: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setInputText('')
    setTranslation('')
    setError('')
    setDetectedLang('')
    setTargetLang('')
  }

  const handleSwap = () => {
    if (translation) {
      setInputText(translation)
      setTranslation(inputText)
      // 交换后重新检测
      const temp = detectedLang
      setDetectedLang(targetLang)
      setTargetLang(temp)
    }
  }

  const copyToClipboard = () => {
    window.electron?.setClipboardText(translation)
    alert('已复制到剪贴板')
  }

  const getClipboardText = async () => {
    const text = await window.electron?.getClipboardText()
    if (text) {
      setInputText(text)
      setError('')
    }
  }

  return (
    <div className={styles.container}>
      {/* 左侧：输入框 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className={styles.panel}>
          <div className={styles.header}>
            <h3>输入文本</h3>
            <button className={styles.pasteBtn} onClick={getClipboardText}>
              粘贴
            </button>
          </div>
          <textarea
            className={styles.textarea}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => {
              // Enter 键翻译（Shift+Enter 换行）
              if (e.code === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                e.preventDefault()
                e.stopPropagation()
                handleTranslate()
              }
            }}
            placeholder="输入要翻译的文本或粘贴内容...\n💡 提示: Enter 快速翻译 | Shift+Enter 换行"
          />
          <div className={styles.charCount}>{inputText.length} 字符</div>
        </div>

        {/* 控制面板 */}
        <div className={styles.controls}>
          <div style={{ padding: '12px', backgroundColor: '#f0f4f8', borderRadius: '6px', marginBottom: '12px' }}>
            <p style={{ margin: '4px 0', fontSize: '14px', color: '#555' }}>
              <strong>自动检测模式：</strong>
            </p>
            <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>
              • 输入非中文 → 自动翻译为<span style={{ color: '#d9534f', fontWeight: 'bold' }}> 中文</span>
            </p>
            <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>
              • 输入中文 → 自动翻译为<span style={{ color: '#5cb85c', fontWeight: 'bold' }}> 英文</span>
            </p>
          </div>

          {detectedLang && targetLang && (
            <div style={{ padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '6px', marginBottom: '12px', borderLeft: '3px solid #4caf50' }}>
              <p style={{ margin: '0', fontSize: '13px', color: '#2e7d32' }}>
                📝 检测语言: <strong>{detectedLang}</strong> → 翻译为: <strong>{targetLang}</strong>
              </p>
            </div>
          )}

          <button
            className={`${styles.translateBtn} ${loading ? styles.loading : ''}`}
            onClick={handleTranslate}
            disabled={loading}
          >
            {loading ? '翻译中...' : '翻译'}
          </button>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* 右侧：输出框 */}
      {translation && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className={styles.panel}>
            <div className={styles.header}>
              <h3>翻译结果</h3>
              <div>
                <button className={styles.pasteBtn} onClick={handleSwap} style={{ marginRight: '8px' }}>
                  交换
                </button>
                <button className={styles.pasteBtn} onClick={copyToClipboard}>
                  复制
                </button>
              </div>
            </div>
            <div
              className={styles.textarea}
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '12px', backgroundColor: '#f9f9f9' }}
            >
              {translation}
            </div>
            
            {/* 音标和发音显示 */}
            {showPronunciation && pronunciation && detectedLang === 'Other' && (
              <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '6px', borderLeft: '3px solid #4caf50' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold', color: '#2e7d32' }}>
                  🔤 英美音标和发音
                </p>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                  <div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#555', fontWeight: 'bold' }}>英式音标 (RP):</p>
                    <p style={{ margin: '0', fontSize: '14px', color: '#2e7d32', fontFamily: 'Arial, sans-serif' }}>
                      {pronunciation.uk}
                    </p>
                    <button
                      onClick={() => speakWord(inputText.trim().split(/\s+/)[0], 'en-GB')}
                      style={{
                        marginTop: '6px',
                        padding: '4px 12px',
                        background: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      🔊 发音
                    </button>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#555', fontWeight: 'bold' }}>美式音标 (GA):</p>
                    <p style={{ margin: '0', fontSize: '14px', color: '#2e7d32', fontFamily: 'Arial, sans-serif' }}>
                      {pronunciation.us}
                    </p>
                    <button
                      onClick={() => speakWord(inputText.trim().split(/\s+/)[0], 'en-US')}
                      style={{
                        marginTop: '6px',
                        padding: '4px 12px',
                        background: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      🔊 发音
                    </button>
                  </div>
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                  💡 英式 (British English) | 美式 (American English)
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
