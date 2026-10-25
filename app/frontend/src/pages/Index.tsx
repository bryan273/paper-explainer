import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play } from 'lucide-react';
import SiteLayout from '@/components/SiteLayout';
import OwnPaperSection from '@/components/OwnPaperSection';
import { usePrefs } from '@/lib/prefs';
import { useDemos } from '@/lib/demos';

function DotField({ seed }: { seed: number }) {
  const dots = Array.from({ length: 28 }, (_, i) => {
    const a = Math.sin((i + 1) * 12.9898 * (seed + 1)) * 43758.5453;
    const b = Math.sin((i + 1) * 78.233 * (seed + 2)) * 12345.678;
    return { x: (a - Math.floor(a)) * 100, y: (b - Math.floor(b)) * 100, o: 0.2 + ((i * 7) % 10) / 16 };
  });
  return (
    <div aria-hidden className="absolute inset-0">
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-[#3DFF8F]"
          style={{ left: `${d.x}%`, top: `${d.y}%`, opacity: d.o }}
        />
      ))}
    </div>
  );
}

export default function Index() {
  const { t } = usePrefs();
  const { demos, error } = useDemos();
  const location = useLocation();
  const first = demos?.[0];

  useEffect(() => {
    const target = location.hash.slice(1);
    if (target === 'demos' || target === 'own') document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
  }, [location.hash, demos]);

  return (
    <SiteLayout>
      <section className="mx-auto grid max-w-[1120px] items-center gap-10 px-5 pb-16 pt-12 md:px-8 lg:grid-cols-12 lg:pt-20">
        <div className="lg:col-span-7">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-primary">{t('heroKicker')}</p>
          <h1 className="font-display text-[34px] font-semibold leading-[1.1] tracking-tight md:text-[44px]">
            {t('heroTitle')}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">{t('heroLine')}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to={first ? `/watch/${first.arxiv}` : '/#demos'}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Play className="h-4 w-4" />
              {t('heroCta')}
            </Link>
            <span className="text-[13px] text-muted-foreground">{t('heroNote')}</span>
          </div>
        </div>
        <div className="lg:col-span-5">
          <Link
            to={first ? `/watch/${first.arxiv}` : '/#demos'}
            className="group relative block ratio-16x9 overflow-hidden rounded-[14px] bg-[#05080F] shadow-[0_20px_50px_-20px_rgba(15,27,45,.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={first ? `${t('play')}: ${first.title}` : t('heroCta')}
          >
            <DotField seed={7} />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <span className="font-display text-3xl font-semibold text-white md:text-4xl">Transformer</span>
              <span className="mt-2 text-sm text-white/70">{first?.title ?? 'Attention Is All You Need'}</span>
            </div>
            <span className="absolute bottom-4 left-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0F1B2D] transition-transform duration-150 group-hover:scale-105">
              <Play className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>

      <OwnPaperSection />

      <section id="demos" className="scroll-mt-20 border-t border-border bg-card/60">
        <div className="mx-auto max-w-[1120px] px-5 py-14 md:px-8">
          <h2 className="font-display text-[28px] font-semibold leading-tight">{t('demosTitle')}</h2>
          <p className="mt-2 text-muted-foreground">{t('demosLine')}</p>
          {error && <p className="mt-8 text-sm text-destructive">{t('loadError')}</p>}
          {!demos && !error && <p className="mt-8 text-sm text-muted-foreground">{t('loading')}</p>}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {demos?.map((demo, i) => (
              <article key={demo.arxiv} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                <Link
                  to={`/watch/${demo.arxiv}`}
                  className="group relative block ratio-16x9 bg-[#05080F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  aria-label={`${t('play')}: ${demo.title}`}
                >
                  <DotField seed={i} />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0F1B2D] transition-transform duration-150 group-hover:scale-105">
                      <Play className="h-5 w-5" />
                    </span>
                  </span>
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-xl font-semibold leading-snug">{demo.title}</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">arXiv:{demo.arxiv}</p>
                  <Link
                    to={`/watch/${demo.arxiv}`}
                    className="mt-4 inline-flex min-h-[40px] w-fit items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
                  >
                    <Play className="h-4 w-4" />
                    {t('play')}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
