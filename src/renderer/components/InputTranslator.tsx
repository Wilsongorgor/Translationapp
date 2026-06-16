import { useState, useEffect } from 'react';
import { translateText } from '../../api/translator';
import { getPronunciation, speakWord } from '../utils/pronunciation';
import styles from './InputTranslator.module.css';

export default function InputTranslator() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectedLang, setDetectedLang] = useState('');
  const [targetLang, setTargetLang] = useState('');
  const [pron, setPron] = useState(null);
  const [showPron, setShowPron] = useState(true);
  const [dstIdx, setDstIdx] = useState(2);
  const LANGS = ['自动检测','中文','English','日本語','한국어','Français','Español','Deutsch'];

  useEffect(() => {
    const s = localStorage.getItem('appSettings');
    if (s) try { setShowPron(JSON.parse(s).showPronunciation !== false); } catch(e){}
  }, []);

  const translate = async () => {
    if (!input.trim()) return setError('请输入文本');
    setLoading(true); setError(''); setResult(''); setDetectedLang(''); setTargetLang(''); setPron(null);
    try {
      const r = await translateText(input, undefined, 'google');
      if (typeof r === 'object' && r && 'translatedText' in r) {
        setResult(r.translatedText); setDetectedLang(r.detectedLanguage||''); setTargetLang(r.targetLanguage||'');
        if (showPron && r.detectedLanguage === 'Other') {
          const p = await getPronunciation(input.trim().split(/\s+/)[0]);
          if (p) setPron(p);
        }
      } else { setResult(r); }
    } catch(e) { setError('翻译失败: ' + (e instanceof Error?e.message:'')); }
    finally { setLoading(false); }
  };

  const paste = async () => { const t = await window.electron?.getClipboardText(); if(t){setInput(t);setError('');} };
  const copy = () => { window.electron?.setClipboardText(result); };
  const swap = () => { if(result){setInput(result);setResult('');setDetectedLang('');} };
  const clear = () => { setInput('');setResult('');setError('');setDetectedLang(''); };

  return (
    <div className={styles.wrap}>
      <div className={styles.langBar}>
        <span className={styles.langBtn}>{LANGS[0]}</span>
        <button className={styles.swapBtn}>⇄</button>
        <select className={styles.langSelect} value={dstIdx} onChange={e=>setDstIdx(Number(e.target.value))}>
          {LANGS.slice(1).map((l,i)=><option key={i} value={i+1}>{l}</option>)}
        </select>
      </div>
      <div className={styles.inputArea}>
        <textarea className={styles.textInput} value={input}
          onChange={e=>{setInput(e.target.value);setError('');}}
          onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();translate();}}}
          placeholder='输入文本，按 Enter 翻译' />
      </div>
      <div className={styles.controls}>
        <div style={{display:'flex',gap:8}}>
          <button className={styles.actionBtn} onClick={paste}>粘贴</button>
          <button className={styles.actionBtn} onClick={clear}>清空</button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <span className={styles.charCount}>{input.length} 字符</span>
          <button className={styles.translateBtn} onClick={translate} disabled={loading||!input.trim()}>
            {loading?'翻译中...':'翻译'}
          </button>
        </div>
      </div>
      {detectedLang&&targetLang&&!error&&(
        <div className={styles.detection}>📝 检测: <b>{detectedLang}</b> → <b>{targetLang}</b></div>
      )}
      {error&&<div className={styles.errorMsg}>{error}</div>}
      {result&&(
        <div className={styles.output}>
          <div className={styles.outputHead}>
            <span className={styles.outputLang}>翻译结果 {targetLang?('· '+targetLang):''}</span>
            <div className={styles.outputActions}>
              <button className={styles.actionBtn} onClick={swap}>替换</button>
              <button className={styles.actionBtn} onClick={copy}>复制</button>
            </div>
          </div>
          <div className={styles.transText}>{result}</div>
          {showPron&&pron&&detectedLang==='Other'&&(
            <div className={styles.pron}>
              <div className={styles.pronItem}>
                <span className={styles.pronLabel}>UK</span>
                <span className={styles.pronText}>{pron.uk}</span>
                <button className={styles.speakBtn} onClick={()=>speakWord(input.trim().split(/\s+/)[0],'en-GB')}>🔊</button>
              </div>
              <div className={styles.pronItem}>
                <span className={styles.pronLabel}>US</span>
                <span className={styles.pronText}>{pron.us}</span>
                <button className={styles.speakBtn} onClick={()=>speakWord(input.trim().split(/\s+/)[0],'en-US')}>🔊</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}