import { useRef } from 'react';
import { usePrefs, type Lang } from '@/lib/prefs';
import { storageKind, type Job, type Section } from '@/lib/explainer';
import { track } from '@/lib/account';

/** Once the main video exists, a section plays from it over [start, end] instead of its own clip (see render_job.py: the per-section
 * clips are deleted once the full video is assembled, to avoid storing the same picture twice). Clamps playback to that range itself,
 * rather than relying on the `#t=start,end` media fragment, which not every browser honours for the end of the range. */
function RangeVideo({ src, range, poster, onPlay }: { src: string; range: [number, number]; poster?: string | null; onPlay: () => void }) {
  const [start, end] = range;
  const ref = useRef<HTMLVideoElement>(null);
  return (
    <video
      ref={ref}
      key={`${src}#${start}`}
      src={`${src}#t=${start}`}
      poster={poster ?? undefined}
      controls
      playsInline
      preload="metadata"
      onLoadedMetadata={(e) => { e.currentTarget.currentTime = start; }}
      onTimeUpdate={(e) => {
        if (e.currentTarget.currentTime >= end) { e.currentTarget.pause(); e.currentTarget.currentTime = end; }
      }}
      onPlay={() => { if (ref.current && ref.current.currentTime >= end) ref.current.currentTime = start; onPlay(); }}
    />
  );
}

function sectionSrc(s: Section, job: Job, lang: Lang): { src: string; range: [number, number] | null } | null {
  const range = s.clip?.[lang] ?? s.clip?.en;
  const main = job.videos?.[lang] ?? job.videos?.en;
  if (range && main) return { src: main, range };
  const clip = s.videos?.[lang] ?? s.videos?.en;
  return clip ? { src: clip, range: null } : null;
}

/** The paper read section by section: the text, the key takeaway and a short narrated video for each part, shown as soon as that part is rendered. */
export default function SectionsReader({ job, lang, onAsk }: { job: Job; lang: Lang; onAsk?: (i: number) => void }) {
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
          const v = sectionSrc(s, job, lang);
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
              {onAsk && job.status === 'done' && (
                <button type="button" className="btn ghost small" style={{ margin: '0 0 14px' }} onClick={() => onAsk(i)}>
                  {t('askSimpler')}
                </button>
              )}
              {v ? (
                <div className="screen">
                  {v.range ? (
                    <RangeVideo src={v.src} range={v.range} poster={s.poster} onPlay={() => { const k = storageKind(v.src); if (k) track('video_play', { k }); }} />
                  ) : (
                    <video key={v.src} src={s.poster ? v.src : `${v.src}#t=1.5`} poster={s.poster ?? undefined} controls playsInline preload="metadata" onPlay={() => { const k = storageKind(v.src); if (k) track('video_play', { k }); }} />
                  )}
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
