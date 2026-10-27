import { useEffect, useState, type ReactNode } from 'react';
import { SUITE_URLS } from '@/lib/explainer';
import { usePrefs, type StringKey } from '@/lib/prefs';

const SECTIONS: { id: string; key: StringKey }[] = [
  { id: 'make', key: 'navMake' },
  { id: 'examples', key: 'navExamples' },
  { id: 'how', key: 'navHow' },
  { id: 'pricing', key: 'navPricing' },
  { id: 'feedback', key: 'navFeedback' },
];

const SUITE: { href: string; key: StringKey }[] = [
  { href: SUITE_URLS.repro, key: 'appRepro' },
  { href: SUITE_URLS.bench, key: 'appBench' },
  { href: SUITE_URLS.lite, key: 'appLite' },
  { href: SUITE_URLS.reading, key: 'appReading' },
  { href: SUITE_URLS.index, key: 'appIndex' },
  { href: SUITE_URLS.all, key: 'appAll' },
];

function scrollTo(id: string) {
  document.body.classList.remove('menu-open');
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.replaceState(null, '', `#${id}`);
}

export function scrollToSection(id: string) {
  scrollTo(id);
}

export default function Shell({ children }: { children: ReactNode }) {
  const { t, lang, setLang, theme, toggleTheme } = usePrefs();
  const [active, setActive] = useState('make');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    return () => document.body.classList.remove('menu-open');
  }, [menuOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: '-15% 0px -60% 0px', threshold: [0.15, 0.5, 0.9] },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="shell">
      <aside className="side" id="side" aria-label={t('partOf')}>
        <a
          className="brand"
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setMenuOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <span className="logo" aria-hidden="true">
            E
          </span>
          <span>
            <b>Paper Explainer</b>
            <span className="sub">{t('partOf')}</span>
          </span>
        </a>

        <nav className="sidenav">
          <div className="navh">{t('groupPE')}</div>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={active === s.id ? 'on' : undefined}
              aria-current={active === s.id ? 'true' : undefined}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(s.id);
                setMenuOpen(false);
              }}
            >
              {t(s.key)}
            </a>
          ))}

          <div className="navh">{t('groupSuite')}</div>
          {SUITE.map((item) => (
            <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
              {t(item.key)}
              <span className="ext" aria-label={t('newTab')}>
                ↗
              </span>
            </a>
          ))}
        </nav>

        <div className="sidefoot">
          <div className="sidebtns">
            <button
              type="button"
              className="btn ghost icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t('toLight') : t('toDark')}
              title={theme === 'dark' ? t('toLight') : t('toDark')}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
            <button
              type="button"
              className="btn ghost small"
              onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
              aria-label={t('language')}
            >
              {lang === 'en' ? 'EN / 中文' : '中文 / EN'}
            </button>
          </div>
        </div>
      </aside>

      <div className="sidescrim" onClick={() => setMenuOpen(false)} aria-hidden="true" />

      <div className="mainwrap">
        <header className="mtop">
          <button
            type="button"
            className="btn ghost icon"
            aria-label={menuOpen ? t('closeMenu') : t('menu')}
            aria-expanded={menuOpen}
            aria-controls="side"
            onClick={() => setMenuOpen((v) => !v)}
          >
            ☰
          </button>
          <b>Paper Explainer</b>
        </header>
        <main className="main" id="top">
          {children}
        </main>
      </div>
    </div>
  );
}
