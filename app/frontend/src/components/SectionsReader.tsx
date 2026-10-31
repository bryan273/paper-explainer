import { usePrefs, type Lang } from '@/lib/prefs';
import type { Job } from '@/lib/explainer';

/** The paper read section by section: the text, the key takeaway and a short narrated video for each part, shown as soon as that part is rendered. */
export default function SectionsReader({ job, lang }: { job: Job; lang: Lang }) {
  const { t } = usePrefs();
  const secs = job.sections ?? [];
  if (!secs.length) return null;
  const zh = lang === 'zh';
  const ready = secs.filter((s) => s.status === 'done').length;
  return (
    <div style={{ marginTop: 28 }}>
      <h3 className="sec" style={{ fontSize: 22, margin: '0 0 4px' }}>
        {t('secTitle')}
      </h3>
      {job.status !== 'done' && <p className="small muted">{t('secsReady').replace('{k}', String(ready)).replace('{n}', String(secs.length))}</p>}
      <div className="stack" style={{ gap: 22, marginTop: 14 }}>
        {secs.map((s, i) => {
          const src = s.videos?.[lang] ?? s.videos?.en ?? null;
          const takeaway = zh ? s.takeaway_zh || s.takeaway : s.takeaway;
          return (
            <article key={s.i} className="card" style={{ margin: 0 }}>
              <div className="mono small muted" style={{ letterSpacing: '.08em' }}>
                {String(i + 1).padStart(2, '0')} | {t('secLabel').replace('{i}', String(i + 1)).replace('{n}', String(secs.length))}
              </div>
              <h4 style={{ margin: '6px 0 8px', fontSize: 20 }}>{zh ? s.title_zh || s.title : s.title}</h4>
              <p style={{ margin: '0 0 10px', lineHeight: 1.6 }}>{zh ? s.text_zh || s.text : s.text}</p>
              {takeaway && (
                <p style={{ margin: '0 0 14px', lineHeight: 1.6 }}>
                  <b>{t('secTakeaway')}: </b>
                  {takeaway}
                </p>
              )}
              {src ? (
                <div className="screen">
                  <video key={src} src={s.poster ? src : `${src}#t=1.5`} poster={s.poster ?? undefined} controls playsInline preload="metadata" />
                </div>
              ) : (
                <div className="screen" style={{ display: 'grid', placeItems: 'center', minHeight: 160, color: 'var(--muted)' }}>
                  <span className="small">
                    <span className="spin" aria-hidden /> {t('secWaiting')}
                  </span>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
