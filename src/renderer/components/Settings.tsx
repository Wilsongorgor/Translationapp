import { useState, useEffect } from 'react';
import styles from './Settings.module.css';

interface S { minimizeToTray: boolean; autoStart: boolean; showPronunciation: boolean }

export default function Settings() {
  const [s, setS] = useState<S>({ minimizeToTray: true, autoStart: false, showPronunciation: true });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('appSettings');
    if(raw) try { setS(JSON.parse(raw)); } catch{}
  }, []);

  const toggle = (k: keyof S) => {
    const ns = { ...s, [k]: !s[k] };
    setS(ns); localStorage.setItem('appSettings', JSON.stringify(ns));
    if(k==='autoStart') window.electron?.setAutoStart(ns.autoStart);
    if(k==='minimizeToTray') window.electron?.setMinimizeToTray(ns.minimizeToTray);
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  return (<div className={styles.wrap}>
    {saved&&<div style={{marginBottom:16}}><span className={styles.saved}>✓ 已保存</span></div>}
    <div className={styles.group}><h3>窗口设置</h3>
      <div className={styles.item}><div className={styles.info}><label className={styles.label}>最小化到系统托盘</label><p className={styles.desc}>点击关闭按钮时最小化而不是退出</p></div>
        <label className={styles.toggle}><input type='checkbox' checked={s.minimizeToTray} onChange={()=>toggle('minimizeToTray')} /><span className={styles.slider}/></label></div>
      <div className={styles.item}><div className={styles.info}><label className={styles.label}>开机自动启动</label><p className={styles.desc}>系统启动时自动运行应用</p></div>
        <label className={styles.toggle}><input type='checkbox' checked={s.autoStart} onChange={()=>toggle('autoStart')} /><span className={styles.slider}/></label></div>
    </div>
    <div className={styles.group}><h3>翻译设置</h3>
      <div className={styles.item}><div className={styles.info}><label className={styles.label}>显示音标和发音</label><p className={styles.desc}>翻译结果中显示英美音标及发音按钮</p></div>
        <label className={styles.toggle}><input type='checkbox' checked={s.showPronunciation} onChange={()=>toggle('showPronunciation')} /><span className={styles.slider}/></label></div>
    </div>
    <div className={styles.tip}><p>设置会实时保存，关闭应用后仍然生效</p></div>
  </div>);
}