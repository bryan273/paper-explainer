import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { usePrefs, type Lang } from '@/lib/prefs';

const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'zh', label: '中文' },
];

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-border bg-card p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`min-h-[36px] min-w-[44px] rounded-md px-3 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  const { lang, setLang, theme, toggleTheme, t } = usePrefs();

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-3 px-5 md:px-8">
          <Link to="/" className="font-display text-xl font-semibold tracking-tight whitespace-nowrap">
            Paper Explainer
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="hidden items-center gap-5 text-sm text-muted-foreground sm:flex">
              <Link to="/" className="hover:text-foreground">
                {t('navHome')}
              </Link>
              <Link to="/#demos" className="hover:text-foreground">
                {t('navDemos')}
              </Link>
            </nav>
            <Segmented value={lang} options={LANGS} onChange={setLang} label="Language" />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t('themeToLight') : t('themeToDark')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1120px] px-5 py-8 text-[13px] text-muted-foreground md:px-8">{t('footer')}</div>
      </footer>
    </div>
  );
}
