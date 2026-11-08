import { useEffect, useState } from 'react';
import { usePrefs } from '@/lib/prefs';
import { useSettings, type Purpose } from '@/lib/settings';

const T = {
  en: {
    title: 'Settings', size: 'Text size', font: 'Font', purpose: 'What do you use it for?', purposeHint: 'The make form starts with a tone and length that fit.', lang: 'Language', theme: 'Theme', motion: 'Animations',
    sm: 'Small', md: 'Medium', lg: 'Large', sans: 'Clean', serif: 'Book', plain: 'Plain', study: 'Studying for a course', research: 'Reading research', teach: 'Teaching others', share: 'Sharing on social media',
    light: 'Light', dark: 'Dark', on: 'On', off: 'Off', done: 'Done', more: 'More languages (Tiếng Việt, Bahasa Indonesia) are on the way.',
  },
  zh: {
    title: '设置', size: '字号', font: '字体', purpose: '你主要用来做什么？', purposeHint: '制作表单会以合适的语气和时长开始。', lang: '语言', theme: '外观', motion: '动画',
    sm: '小', md: '中', lg: '大', sans: '简洁', serif: '书籍', plain: '朴素', study: '学习课程', research: '阅读研究', teach: '教学', share: '发布到社交媒体',
    light: '浅色', dark: '深色', on: '开', off: '关', done: '完成', more: '更多语言（越南语、印尼语）即将推出。',
  },
} as const;

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="askseg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)}>{o.l}</button>
      ))}
    </div>
  );
}

/** Reading comfort and who the person is, kept on this device and applied across the site. */
export default function SettingsDialog() {
  const { lang, setLang, theme, toggleTheme } = usePrefs();
  const [s, set] = useSettings();
  const [open, setOpen] = useState(false);
  const t = T[lang === 'zh' ? 'zh' : 'en'];
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener('pe-open-settings', on);
    return () => window.removeEventListener('pe-open-settings', on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);
  if (!open) return null;
  const purposes: Purpose[] = ['study', 'research', 'teach', 'share'];
  return (
    <div role="dialog" aria-modal="true" aria-label={t.title} className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="card stack modal-card" style={{ gap: 18 }}>
        <div className="row between">
          <h3 style={{ font: '700 20px var(--display)', margin: 0 }}>{t.title}</h3>
          <button type="button" className="btn ghost small" onClick={() => setOpen(false)} aria-label="Close">×</button>
        </div>
        <div className="set-row"><span>{t.purpose}<small className="muted">{t.purposeHint}</small></span>
          <div className="set-chips" role="radiogroup" aria-label={t.purpose}>
            {purposes.map((p) => (
              <button key={p} type="button" role="radio" aria-checked={s.purpose === p} onClick={() => set({ purpose: s.purpose === p ? '' : p })}>{t[p]}</button>
            ))}
          </div>
        </div>
        <div className="set-row"><span>{t.size}</span><Seg label={t.size} value={s.size} onChange={(v) => set({ size: v })} options={[{ v: 'sm', l: t.sm }, { v: 'md', l: t.md }, { v: 'lg', l: t.lg }]} /></div>
        <div className="set-row"><span>{t.font}</span><Seg label={t.font} value={s.font} onChange={(v) => set({ font: v })} options={[{ v: 'sans', l: t.sans }, { v: 'serif', l: t.serif }, { v: 'plain', l: t.plain }]} /></div>
        <div className="set-row"><span>{t.lang}</span><Seg label={t.lang} value={lang} onChange={(v) => setLang(v)} options={[{ v: 'en', l: 'English' }, { v: 'zh', l: '中文' }]} /></div>
        <div className="set-row"><span>{t.theme}</span><Seg label={t.theme} value={theme} onChange={(v) => { if (v !== theme) toggleTheme(); }} options={[{ v: 'light', l: t.light }, { v: 'dark', l: t.dark }]} /></div>
        <div className="set-row"><span>{t.motion}</span><Seg label={t.motion} value={s.motion ? 'on' : 'off'} onChange={(v) => set({ motion: v === 'on' })} options={[{ v: 'on', l: t.on }, { v: 'off', l: t.off }]} /></div>
        <p className="small muted" style={{ margin: 0 }}>{t.more}</p>
        <div><button type="button" className="btn primary" onClick={() => setOpen(false)}>{t.done}</button></div>
      </div>
    </div>
  );
}
