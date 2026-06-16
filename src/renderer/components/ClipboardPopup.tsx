import { useState, useEffect } from 'react';
import styles from './ClipboardPopup.module.css';

interface PD { text: string; translation: string; detected: string; target: string }

export default function ClipboardPopup() {
  const [pop, setPop] = useState<PD|null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    window.electron?.startClipboardMonitor();
    window.electron?.onClipboardTranslation((data:PD)=>{
      setPop(data); setVisible(true);
      const t=setTimeout(()=>setVisible(false),8000);
      return ()=>{clearTimeout(t);window.electron?.stopClipboardMonitor();};
    });
  }, []);

  if(!visible||!pop) return null;

  return (<div className={styles.wrap}><div className={styles.card}>
    <div className={styles.head}><span>剪贴板翻译</span><button className={styles.closeBtn} onClick={()=>setVisible(false)}>✕</button></div>
    <div className={styles.body}>
      <div className={styles.section}><div className={styles.label}>原文 ({pop.detected})</div><div className={styles.text}>{pop.text.substring(0,150)}</div></div>
      <div className={styles.section}><div className={styles.label}>翻译 ({pop.target})</div><div className={styles.trans}>{pop.translation.substring(0,150)}</div></div>
    </div>
    <div className={styles.foot}>
      <button className={styles.btn} onClick={()=>window.electron?.setClipboardText(pop.translation)}>复制翻译</button>
      <button className={styles.btn} onClick={()=>window.electron?.setClipboardText(pop.text+'\n'+pop.translation)}>复制双语</button>
    </div>
  </div></div>);
}