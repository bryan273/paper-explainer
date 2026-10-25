import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'zh';
export type Theme = 'light' | 'dark';

const STRINGS = {
  en: {
    navHome: 'Home',
    navDemos: 'Demos',
    themeToLight: 'Switch to light mode',
    themeToDark: 'Switch to dark mode',
    heroKicker: 'Research papers, explained on screen',
    heroTitle: 'Explain a paper in 20 seconds',
    heroLine:
      'Paper Explainer turns a research paper into a short, cinematic video with narration and English and Chinese subtitles, so authors can share a new result in the time it takes to scroll.',
    heroCta: 'Watch a demo',
    heroNote: 'First 20 seconds free. The full video is available on request.',
    demosTitle: 'Demo explainers',
    demosLine: 'Three finished videos made from well-known papers.',
    play: 'Play preview',
    loadError: 'Could not load the demo list. Please refresh the page.',
    loading: 'Loading demos',
    back: 'All demos',
    videoLang: 'Narration',
    previewBadge: '20-second preview',
    replay: 'Replay preview',
    lockedTitle: 'Want the full video?',
    lockedLine: 'The preview stops at 20 seconds. Leave your details and we will prepare the full explainer for your paper.',
    lockedWaiting: 'The request form unlocks when the preview ends.',
    unlockNow: 'Request now',
    email: 'Email',
    arxiv: 'arXiv id',
    note: 'Note (optional)',
    notePlaceholder: 'Audience, tone, length, or anything we should know',
    submit: 'Send request',
    submitting: 'Sending',
    errEmail: 'Enter a valid email address.',
    errArxiv: 'Enter an arXiv id such as 1706.03762.',
    errSubmit: 'The request could not be saved. Please try again.',
    successTitle: 'Request received',
    successLine: 'Keep this number for reference. We will email you when the full video is ready.',
    requestNo: 'Request number',
    another: 'Send another request',
    howTitle: 'How it is made',
    howLine:
      'Every scene is tied to a quote from the paper. The script is written from the paper text only, each scene keeps a verbatim supporting quote, and scenes whose quote cannot be found in the paper are corrected before narration is recorded.',
    readPaper: 'Read the paper on arXiv',
    notFound: 'This demo was not found.',
    footer: 'Paper Explainer. Demo videos are made from public arXiv papers.',
  },
  zh: {
    navHome: '首页',
    navDemos: '示例',
    themeToLight: '切换到浅色模式',
    themeToDark: '切换到深色模式',
    heroKicker: '把论文讲成一段影像',
    heroTitle: '20 秒讲清一篇论文',
    heroLine: 'Paper Explainer 把研究论文变成一段带旁白、中英双语字幕的简短电影感视频，让作者在读者滑动屏幕的几秒内讲清新成果。',
    heroCta: '观看示例',
    heroNote: '前 20 秒免费观看，完整视频可提交申请。',
    demosTitle: '示例视频',
    demosLine: '基于三篇知名论文制作的完整示例。',
    play: '播放预览',
    loadError: '示例列表加载失败，请刷新页面。',
    loading: '正在加载示例',
    back: '全部示例',
    videoLang: '旁白语言',
    previewBadge: '20 秒预览',
    replay: '重新播放预览',
    lockedTitle: '想看完整视频？',
    lockedLine: '预览在 20 秒处结束。留下您的信息，我们会为您的论文制作完整讲解视频。',
    lockedWaiting: '预览结束后即可提交申请。',
    unlockNow: '立即申请',
    email: '邮箱',
    arxiv: 'arXiv 编号',
    note: '备注（可选）',
    notePlaceholder: '目标观众、语气、时长或其他需求',
    submit: '提交申请',
    submitting: '正在提交',
    errEmail: '请输入有效的邮箱地址。',
    errArxiv: '请输入 arXiv 编号，例如 1706.03762。',
    errSubmit: '申请保存失败，请重试。',
    successTitle: '申请已收到',
    successLine: '请保留此编号以便查询。完整视频制作完成后我们会通过邮件通知您。',
    requestNo: '申请编号',
    another: '再提交一个申请',
    howTitle: '制作方式',
    howLine: '每个场景都对应论文中的一句原文。脚本只依据论文文本撰写，每个场景都保留一句逐字引用作为依据；若引用在论文中找不到，该场景会在录制旁白前被修正。',
    readPaper: '在 arXiv 阅读论文',
    notFound: '未找到该示例。',
    footer: 'Paper Explainer。示例视频基于公开的 arXiv 论文制作。',
  },
} as const;

export type StringKey = keyof (typeof STRINGS)['en'];

interface PrefsValue {
  lang: Lang;
  theme: Theme;
  setLang: (lang: Lang) => void;
  toggleTheme: () => void;
  t: (key: StringKey) => string;
}

const PrefsContext = createContext<PrefsValue | null>(null);

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    readStored<Lang>('pe-lang', ['en', 'zh'], navigator.language?.startsWith('zh') ? 'zh' : 'en'),
  );
  const [theme, setTheme] = useState<Theme>(() =>
    readStored<Theme>(
      'pe-theme',
      ['light', 'dark'],
      window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    ),
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('pe-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    localStorage.setItem('pe-lang', lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const toggleTheme = useCallback(() => setTheme((cur) => (cur === 'dark' ? 'light' : 'dark')), []);
  const t = useCallback((key: StringKey) => STRINGS[lang][key], [lang]);

  const value = useMemo(() => ({ lang, theme, setLang, toggleTheme, t }), [lang, theme, setLang, toggleTheme, t]);
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used inside PrefsProvider');
  return ctx;
}
