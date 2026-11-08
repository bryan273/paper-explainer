import { GradLast } from '@/components/SuiteUI';
import { srcLabel } from '@/components/sections/MakeSection';
import { HERO_EXAMPLE, videoUrl, type Job } from '@/lib/explainer';
import { usePrefs } from '@/lib/prefs';
import { scrollToSection } from '@/components/Shell';

export function StatsStrip({ items }: { items: Job[] }) {
  const { t } = usePrefs();

  return (
    <div className="facts" role="group" aria-label={t('statVideos')}>
      <span>
        <b>{items.length}</b>
        {t('statVideos')}
      </span>
      <span>
        <b>2</b>
        {t('statLangs')}
      </span>
      <span>
        <b className="mono" style={{ fontSize: 20 }}>
          {t('statTimeValue')}
        </b>
        {t('statTime')}
      </span>
    </div>
  );
}

export default function Hero({ items, error }: { items: Job[] | null; error: boolean }) {
  const { t } = usePrefs();
  const latest = items?.find((j) => j.id === HERO_EXAMPLE) ?? items?.[0] ?? null;
  const base = latest ? (videoUrl(latest, 'en') ?? '') : '';
  const poster = latest?.sections?.find((x) => x.poster)?.poster ?? undefined;
  const src = poster ? base : `${base}#t=1.5`;

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-grid">
        <div>
          <span className="su-pill"><i />Paperlit</span>
          <h1 className="hero-title" id="hero-title" style={{ marginTop: 10 }}>
            <GradLast text={t('heroTitle')} words={4} />
          </h1>
          <p className="lede">{t('heroSub')}</p>
          <div className="actions">
            <button type="button" className="btn primary" onClick={() => scrollToSection('make')}>
              {t('heroMake')}
            </button>
            <button type="button" className="btn ghost" onClick={() => scrollToSection('examples')}>
              {t('heroWatch')}
            </button>
          </div>
        </div>

        <div>
          {latest && src ? (
            <>
              <div className="screen">
                <video src={src} poster={poster} controls playsInline preload={poster ? "none" : "metadata"} title={latest.title ?? ''} />
              </div>
              <div className="media-cap">
                <span className="t">{latest.title}</span>
                <span className="mono small">{srcLabel(latest)}</span>
              </div>
            </>
          ) : (
            <div className="screen" aria-busy={!error}>
              <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--muted)', fontSize: 13 }}>
                {error ? t('loadVideosError') : `${t('loadingVideos')}…`}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
