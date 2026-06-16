import { useState } from 'react';
import { translateText } from '../../api/translator';
import styles from './ArticleTranslator.module.css';

export default function ArticleTranslator() {
  const [src, setSrc] = useState('');
  const [dst, setDst] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pct, setPct] = useState(0);

  const translate = async () => {
    if(!src.trim())return setError('请输入文章');
    setLoading(true);setError('');setPct(0);
    try {
      const paras = src.split('\n\n').filter(p=>p.trim());
      const out=[];
      for(let i=0;i<paras.length;i++){
        try{
          const r=await translateText(paras[i], undefined, 'google');
          out.push(typeof r==='object'&&r&&'translatedText' in r?r.translatedText:r);
        }catch{out.push('[翻译失败] '+paras[i]);}
        setPct(Math.round((i+1)/paras.length*100));
      }
      setDst(out.join('\n\n'));
    }catch(e){setError(e instanceof Error?e.message:'翻译失败');}
    finally{setLoading(false);}
  };

  const copy=()=>{window.electron?.setClipboardText(dst);};
  const download=()=>{
    const el=document.createElement('a');
    el.href=URL.createObjectURL(new Blob(['\uFEFF'+dst],{type:'text/plain;charset=utf-8'}));
    el.download='翻译结果.txt';
    document.body.appendChild(el);el.click();document.body.removeChild(el);
  };
  const clear=()=>{setSrc('');setDst('');setError('');};

  return (<div className={styles.wrap}>
    <div className={styles.panel}>
      <div className={styles.panelHead}><span className={styles.panelTitle}>原文</span><span className={styles.panelMeta}>{src.length} 字符</span></div>
      <div className={styles.panelContent}><textarea className={styles.textArea} value={src} onChange={e=>{setSrc(e.target.value);setError('');}} placeholder='粘贴文章内容...' /></div>
      <div className={styles.panelFooter}>
        <button className={styles.btnSecondary} onClick={clear}>清空</button>
        <div style={{flex:1}}/>
        <button className={styles.btnPrimary} onClick={translate} disabled={loading||!src.trim()}>{loading?'翻译中 '+pct+'%':'翻译文章'}</button>
      </div>
      {loading&&<div className={styles.progressWrap}><div className={styles.progressTrack}><div className={styles.progressFill} style={{width:pct+'%'}}/></div><div className={styles.progressText}>正在翻译...</div></div>}
      {error&&<div className={styles.errorToast}>{error}</div>}
    </div>
    <div className={styles.panel}>
      <div className={styles.panelHead}><span className={styles.panelTitle}>翻译结果</span>{dst&&<div style={{display:'flex',gap:6}}><button className={styles.btnSecondary} onClick={copy}>复制</button><button className={styles.btnSecondary} onClick={download}>下载</button></div>}</div>
      <div className={styles.panelContent}>{dst?<div className={styles.transOutput}>{dst}</div>:<div className={styles.placeholder}>翻译结果将显示在这里</div>}</div>
    </div>
  </div>);
}