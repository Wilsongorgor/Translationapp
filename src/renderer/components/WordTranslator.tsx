import { useState } from 'react';
import { translateText } from '../../api/translator';
import { getPronunciation, speakWord } from '../utils/pronunciation';
import styles from './WordTranslator.module.css';

export default function WordTranslator() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hist, setHist] = useState([]);
  const [dl, setDl] = useState('');
  const [tl, setTl] = useState('');
  const [pron, setPron] = useState(null);

  const search = async (text) => {
    if (!text?.trim()) return;
    setLoading(true); setError(''); setRes(''); setDl(''); setTl(''); setPron(null);
    try {
      const r = await translateText(text, undefined, 'google');
      if (typeof r === 'object' && r && 'translatedText' in r) {
        setRes(r.translatedText); setDl(r.detectedLanguage||''); setTl(r.targetLanguage||'');
        setHist(prev => [{text, trans:r.translatedText}, ...prev.slice(0,9)]);
        if (r.detectedLanguage === 'Other') {
          const p = await getPronunciation(text.trim().split(/\s+/)[0]);
          if (p) setPron(p);
        }
      } else { setRes(r); setHist(prev=>[{text,trans:r},...prev.slice(0,9)]); }
    } catch(e) { setError(e instanceof Error?e.message:'翻译失败'); }
    finally { setLoading(false); }
  };

  const copy = (t) => { window.electron?.setClipboardText(t); };

  return (
    <div className={styles.wrap}>
      <div className={styles.searchBar}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input className={styles.searchInput} value={q}
            onChange={e=>{setQ(e.target.value);setError('');}}
            onKeyDown={e=>{if(e.key==='Enter')search(q);}}
            placeholder='输入单词或短语...' />
          <button className={styles.searchBtn} onClick={()=>search(q)} disabled={loading||!q.trim()}>
            {loading?'查询中...':'查询'}
          </button>
        </div>
      </div>
      <div className={styles.body}>
        {error&&<div className={styles.errorCard}>{error}</div>}
        {loading&&<div className={styles.loading}>正在翻译...</div>}
        {!loading&&!error&&!res&&<div className={styles.empty}>输入单词或短语开始查询</div>}
        {!loading&&res&&(
          <div className={styles.card}>
            <div className={styles.wordRow}>
              <span className={styles.word}>{q.trim()}</span>
              {pron&&<span className={styles.phonetic}>UK: {pron.uk} / US: {pron.us}</span>}
            </div>
            {dl&&<span className={styles.detect}>{dl} → {tl}</span>}
            <div className={styles.transBlock}>
              <div className={styles.transLabel}>翻译</div>
              <div className={styles.transContent}>{res}</div>
            </div>
            {pron&&(
              <div className={styles.pronRow}>
                <div className={styles.pronChip}>
                  <span className={styles.pronChipLabel}>UK</span>
                  <span className={styles.pronChipText}>{pron.uk}</span>
                  <button className={styles.speakChip} onClick={()=>speakWord(q.trim(),'en-GB')}>🔊</button>
                </div>
                <div className={styles.pronChip}>
                  <span className={styles.pronChipLabel}>US</span>
                  <span className={styles.pronChipText}>{pron.us}</span>
                  <button className={styles.speakChip} onClick={()=>speakWord(q.trim(),'en-US')}>🔊</button>
                </div>
              </div>
            )}
            <div className={styles.cardActions}>
              <button className={styles.actBtn} onClick={()=>copy(res)}>复制翻译</button>
              <button className={styles.actBtn} onClick={()=>copy(q.trim()+'\n'+res)}>复制双语</button>
            </div>
          </div>
        )}
        {hist.length>0&&(
          <div className={styles.history}>
            <div className={styles.historyTitle}>历史记录</div>
            <div className={styles.historyTags}>
              {hist.map((h,i)=>(
                <div key={i} className={styles.historyTag} onClick={()=>{setQ(h.text);search(h.text);}}>
                  <span className={styles.historyOriginal}>{h.text.substring(0,18)}</span>
                  <span className={styles.historyArrow}>→</span>
                  <span className={styles.historyTrans}>{h.trans.substring(0,16)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}