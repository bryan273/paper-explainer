import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'zh' | 'vi' | 'id';
export type Theme = 'light' | 'dark';
export type T4 = { en: string; zh: string; vi: string; id: string };
export const LANGS: { k: Lang; label: string }[] = [
  { k: 'en', label: 'English' }, { k: 'zh', label: '中文' }, { k: 'vi', label: 'Tiếng Việt' }, { k: 'id', label: 'Bahasa Indonesia' },
];
const LANG_KEY = 'suite-lang';   // shared with the older apps on the same site
const THEME_KEY = 'pl-theme';

const guessLang = (): Lang => {
  try { const s = localStorage.getItem(LANG_KEY); if (s === 'en' || s === 'zh' || s === 'vi' || s === 'id') return s; } catch { /* no storage */ }
  const n = (navigator.language || '').toLowerCase();
  return n.startsWith('zh') ? 'zh' : n.startsWith('vi') ? 'vi' : n.startsWith('id') || n.startsWith('ms') ? 'id' : 'en';
};
const guessTheme = (): Theme => {
  try { const s = localStorage.getItem(THEME_KEY); if (s === 'light' || s === 'dark') return s; } catch { /* no storage */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/** Pick the string of the current language; English when a language is missing. */
export const pick = <T,>(lang: Lang, v: { en: T; zh?: T; vi?: T; id?: T }): T => (v[lang] ?? v.en) as T;
/** Replace {name} placeholders. */
export const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

type Ctx = { lang: Lang; setLang: (l: Lang) => void; theme: Theme; setTheme: (t: Theme) => void; t: <T>(v: { en: T; zh?: T; vi?: T; id?: T }) => T };
const PrefsCtx = createContext<Ctx | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangS] = useState<Lang>(guessLang);
  const [theme, setThemeS] = useState<Theme>(guessTheme);
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* private mode */ }
  }, [lang]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* private mode */ }
  }, [theme]);
  const setLang = useCallback((l: Lang) => setLangS(l), []);
  const setTheme = useCallback((t: Theme) => setThemeS(t), []);
  const value = useMemo<Ctx>(() => ({ lang, setLang, theme, setTheme, t: (v) => pick(lang, v) }), [lang, theme, setLang, setTheme]);
  return <PrefsCtx.Provider value={value}>{children}</PrefsCtx.Provider>;
}

export function usePrefs(): Ctx {
  const c = useContext(PrefsCtx);
  if (!c) throw new Error('PrefsProvider missing');
  return c;
}
