import { useEffect, useState, type ReactNode } from 'react';
import SettingsDialog from '@/components/SettingsDialog';
import SuiteTopBar, { type NavLink as NavLinkT } from '@/components/SuiteTopBar';
import { usePrefs, type StringKey } from '@/lib/prefs';

const SECTIONS: { id: string; key: StringKey }[] = [
  { id: 'make', key: 'navMake' },
  { id: 'examples', key: 'navExamples' },
  { id: 'how', key: 'navHow' },
  { id: 'pricing', key: 'navPricing' },
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

  const nav: NavLinkT[] = SECTIONS.map((s) => ({ label: t(s.key), href: `#${s.id}`, onClick: () => scrollTo(s.id), active: active === s.id }));
  nav.push({ label: t('navContact'), href: '#contact', onClick: () => window.dispatchEvent(new Event('pe-open-contact')) });

  return (
    <div className="shell">
      <SuiteTopBar appId="explainer" brand="Paper Explainer" letter="E" homeTo="/" nav={nav} dark={theme === 'dark'} onToggleDark={toggleTheme} lang={lang} onLang={setLang} onSettings={() => window.dispatchEvent(new Event('pe-open-settings'))} />
      <SettingsDialog />
      <div className="mainwrap">
        <main className="main" id="top">
          {children}
        </main>
      </div>
    </div>
  );
}
