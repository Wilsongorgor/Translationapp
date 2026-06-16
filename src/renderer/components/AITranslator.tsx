import { useState } from 'react';
import { translateText } from '../../api/translator';
import styles from './AITranslator.module.css';

export default function AITranslator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key')||'');
  const [showKey, setShowKey] = useState(!apiKey);
  const [target, setTarget] = useState('Chinese');

  const saveKey = () => { if(!apiKey.trim())return setError('API Key 不能为空'); localStorage.setItem('openai_api_key',apiKey); setShowKey(false); setError(''); };

  const translate = async () => {
    if(!input.trim())return setError('请输入文本');
    if(!apiKey.trim()){setShowKey(true);return;}
    setLoading(true);setError('');setOutput('');
    try{const r=await translateText(input,target,'ai');setOutput(r);}
    catch(e){setError(e instanceof Error?e.message:'AI 翻译失败');}
    finally{setLoading(false);}
  };

  const copy = () => { window.electron?.setClipboardText(output); };
  const clear = () => { setInput('');setOutput('');setError(''); };

  return (<div className={styles.wrap}>
    {showKey&&(<div className={styles.overlay}><div className={styles.modal}>
      <h3>AI 翻译设置</h3>
      <p>请输入 OpenAI API Key，在 <a href='https://platform.openai.com/api-keys' target='_blank' rel='noopener' style={{color:'var(--primary)'}}>platform.openai.com</a> 获取。</p>
      <input className={styles.apiInput} type='password' value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder='sk-...' />
      <div className={styles.modalBtns}><button className={styles.btnPrimary} onClick={saveKey}>保存</button><button className={styles.btnSecondary} onClick={()=>setShowKey(false)}>取消</button></div>
    </div></div>)}
    <div className={styles.chipRow}><button className={styles.apiChip} onClick={()=>setShowKey(true)}>⚙ API 设置</button></div>
    <div className={styles.langBar}>
      <span className={styles.langBtn}>自动检测</span>
      <span style={{color:'var(--text-muted)',fontSize:16}}>→</span>
      <select className={styles.langSelect} value={target} onChange={e=>setTarget(e.target.value)}>
        <option value='Chinese'>中文</option><option value='English'>English</option><option value='Japanese'>日本語</option>
        <option value='Korean'>한국어</option><option value='French'>Français</option><option value='Spanish'>Español</option><option value='German'>Deutsch</option>
      </select>
    </div>
    <div className={styles.inputArea}>
      <textarea className={styles.textInput} value={input} onChange={e=>{setInput(e.target.value);setError('');}} placeholder='输入文本，AI 将提供更自然的翻译...' />
    </div>
    <div className={styles.controls}>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <button className={styles.actionBtn} onClick={clear}>清空</button>
        <span className={styles.aiBadge}>GPT-3.5</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:14}}>
        <span className={styles.charCount}>{input.length} 字符</span>
        <button className={styles.translateBtn} onClick={translate} disabled={loading||!input.trim()}>{loading?'翻译中...':'AI 翻译'}</button>
      </div>
    </div>
    {error&&<div className={styles.errorMsg}>{error}</div>}
    {output&&(<div className={styles.output}>
      <div className={styles.outputHead}>
        <span className={styles.outputLabel}>AI 翻译结果 {'· ' + target}</span>
        <button className={styles.actionBtn} onClick={copy}>复制</button>
      </div>
      <div className={styles.transText}>{output}</div>
    </div>)}
  </div>);
}