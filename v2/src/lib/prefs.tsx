import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'zh' | 'vi' | 'id' | 'ja' | 'ko' | 'es' | 'fr' | 'de';
export type Theme = 'light' | 'dark';
/** What the person chose: follow the device (the default), or always light or dark. */
export type ThemeMode = 'system' | Theme;
/** A text in several languages: English is always there, the others may be missing (then the dictionary of that language, then English). */
export type Tr<T> = { en: T } & Partial<Record<Lang, T>>;
export type T4 = Tr<string>;
const ALL_LANGS: { k: Lang; label: string; short: string }[] = [
  { k: 'en', label: 'English', short: 'EN' }, { k: 'zh', label: '中文', short: '中' }, { k: 'vi', label: 'Tiếng Việt', short: 'VI' }, { k: 'id', label: 'Bahasa Indonesia', short: 'ID' },
  { k: 'ja', label: '日本語', short: 'JA' }, { k: 'ko', label: '한국어', short: 'KO' }, { k: 'es', label: 'Español', short: 'ES' }, { k: 'fr', label: 'Français', short: 'FR' }, { k: 'de', label: 'Deutsch', short: 'DE' },
];
// a language is offered once its text exists: written by hand (en, zh, vi, id) or as a dictionary in src/i18n
const loadersEarly = import.meta.glob('../i18n/*.json');
const READY = new Set<string>(['en', 'zh', 'vi', 'id', ...Object.keys(loadersEarly).map((p) => p.replace(/^.*\/(\w+)\.json$/, '$1'))]);
export const LANGS = ALL_LANGS.filter((l) => READY.has(l.k));
const ALL = LANGS.map((l) => l.k);
const LANG_KEY = 'suite-lang';   // shared with the older apps on the same site
const THEME_KEY = 'pl-theme';

const guessLang = (): Lang => {
  try { const s = localStorage.getItem(LANG_KEY) as Lang | null; if (s && ALL.includes(s)) return s; } catch { /* no storage */ }
  const n = (navigator.language || '').toLowerCase();
  if (n.startsWith('ms')) return 'id';
  return (ALL.find((k) => n.startsWith(k)) ?? 'en') as Lang;
};
const deviceTheme = (): Theme => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
const guessMode = (): ThemeMode => {
  try { const s = localStorage.getItem(THEME_KEY); if (s === 'light' || s === 'dark' || s === 'system') return s; } catch { /* no storage */ }
  return 'system';
};

// languages without hand-written text use a dictionary from the English text (src/i18n/<lang>.json), loaded only when chosen
const DICTS: Partial<Record<Lang, Record<string, string>>> = {};
const loaders = import.meta.glob<{ default: Record<string, string> }>('../i18n/*.json');
async function loadDict(lang: Lang) {
  if (DICTS[lang] || !loaders[`../i18n/${lang}.json`]) return;
  try { DICTS[lang] = (await loaders[`../i18n/${lang}.json`]()).default; } catch { /* stay in English */ }
}
function viaDict<T>(lang: Lang, v: T): T {
  const d = DICTS[lang];
  if (!d) return v;
  if (typeof v === 'string') return (d[v] ?? v) as T;
  if (Array.isArray(v)) return v.map((x) => viaDict(lang, x)) as T;
  // objects (a help topic): every text field, never the id
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, k === 'id' ? x : viaDict(lang, x)])) as T;
  return v;
}

/** Pick the text of the current language: written text first, then the dictionary, then English. */
export const pick = <T,>(lang: Lang, v: Tr<T>): T => (v[lang] ?? viaDict(lang, v.en)) as T;
/** Replace {name} placeholders. */
export const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
/** BCP 47 tag for dates and numbers. */
export const locale = (lang: Lang) => (lang === 'zh' ? 'zh-CN' : lang === 'vi' ? 'vi-VN' : lang === 'id' ? 'id-ID' : lang === 'ja' ? 'ja-JP' : lang === 'ko' ? 'ko-KR' : lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : lang === 'de' ? 'de-DE' : 'en-GB');

type Ctx = { lang: Lang; setLang: (l: Lang) => void; theme: Theme; setTheme: (t: Theme) => void; themeMode: ThemeMode; setThemeMode: (m: ThemeMode) => void; t: <T>(v: Tr<T>) => T };
const PrefsCtx = createContext<Ctx | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangS] = useState<Lang>(guessLang);
  const [themeMode, setModeS] = useState<ThemeMode>(guessMode);
  const [device, setDevice] = useState<Theme>(deviceTheme);
  const theme: Theme = themeMode === 'system' ? device : themeMode;
  useEffect(() => {   // follow the device while the person has not chosen
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const on = () => setDevice(mq.matches ? 'dark' : 'light');
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  const [, setLoaded] = useState(0);
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* private mode */ }
    if (!DICTS[lang] && loaders[`../i18n/${lang}.json`]) loadDict(lang).then(() => setLoaded((n) => n + 1));
  }, [lang]);
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);
  useEffect(() => { try { if (themeMode === 'system') localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, themeMode); } catch { /* private mode */ } }, [themeMode]);
  const setLang = useCallback((l: Lang) => setLangS(l), []);
  const setTheme = useCallback((t: Theme) => setModeS(t), []);
  const setThemeMode = useCallback((m: ThemeMode) => setModeS(m), []);
  const dictReady = !!DICTS[lang];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo<Ctx>(() => ({ lang, setLang, theme, setTheme, themeMode, setThemeMode, t: (v) => pick(lang, v) }), [lang, theme, themeMode, setLang, setTheme, setThemeMode, dictReady]);
  return <PrefsCtx.Provider value={value}>{children}</PrefsCtx.Provider>;
}

export function usePrefs(): Ctx {
  const c = useContext(PrefsCtx);
  if (!c) throw new Error('PrefsProvider missing');
  return c;
}
