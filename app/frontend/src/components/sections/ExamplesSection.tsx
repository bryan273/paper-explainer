import { srcLabel } from '@/components/sections/MakeSection';
import { useEffect, useState } from 'react';
import { Lightbox, LangSeg } from '@/components/media';
import { copyText, shareUrl, videoUrl, availableLangs, downloadFile, type Job } from '@/lib/explainer';
import { usePrefs, type Lang } from '@/lib/prefs';

function ExampleCard({ job, onPlay }: { job: Job; onPlay: (job: Job, lang: Lang) => void }) {
  const { t } = usePrefs();
  const langs = availableLangs(job);
  const [lang, setLang] = useState<Lang>(langs[0] ?? 'en');
  const active = lang === 'zh' && langs.includes('zh') ? 'zh' : (langs[0] ?? 'en');
  const thumb = videoUrl(job, active);
  const checked = job.checks?.checked ?? 0;
  const removed = job.checks?.removed?.length ?? 0;

  return (
    <article className="card ex">
      <div className="thumb">
        {thumb && <video src={`${thumb}#t=2`} preload="metadata" muted playsInline aria-hidden tabIndex={-1} />}
        <button
          type="button"
          className="play"
          onClick={() => onPlay(job, active)}
          aria-label={`${t('play')}: ${job.title ?? ''}`}
        >
          <span aria-hidden>▶</span>
        </button>
      </div>
      <div className="ex-body">
        <h3 className="ex-title">{job.title}</h3>
        <p className="mono small muted" style={{ margin: 0 }}>
          {srcLabel(job)}
        </p>
        <div className="pills">
          {checked > 0 && <span className="pill ok">{t('checksPassed', { n: checked })}</span>}
          {removed > 0 && <span className="pill">{t('removedN', { n: removed })}</span>}
        </div>
        <div className="row between" style={{ marginTop: 4 }}>
          <LangSeg value={active} options={langs} onChange={setLang} />
          <div className="row" style={{ gap: 6 }}>
            <button
              type="button"
              className="btn ghost icon"
              aria-label={t('copyLink')}
              title={t('copyLink')}
              onClick={() => copyText(shareUrl(job.arxiv))}
            >
              ⧉
            </button>
            <button
              type="button"
              className="btn ghost icon"
              aria-label={t('download')}
              title={t('download')}
              onClick={() => {
                const url = videoUrl(job, active);
                if (url) void downloadFile(url, `${job.arxiv}_${active}.mp4`);
              }}
            >
              ↓
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ExamplesSection({
  items,
  error,
  openArxiv,
}: {
  items: Job[] | null;
  error: boolean;
  openArxiv?: string | null;
}) {
  const { t } = usePrefs();
  const [open, setOpen] = useState<{ job: Job; lang: Lang } | null>(null);

  useEffect(() => {
    if (!items || !openArxiv) return;
    const job = items.find((j) => j.arxiv === openArxiv);
    if (job) setOpen({ job, lang: availableLangs(job)[0] ?? 'en' });
  }, [items, openArxiv]);

  return (
    <section className="section" id="examples" aria-labelledby="examples-title">
      <h2 className="sec" id="examples-title">
        {t('exTitle')}
      </h2>
      <p className="sec-sub">{t('exSub')}</p>

      {error && <p className="err">{t('loadVideosError')}</p>}
      {!items && !error && <p className="muted small">{t('loadingVideos')}…</p>}
      {items && items.length === 0 && <p className="empty">{t('exEmpty')}</p>}

      {items && items.length > 0 && (
        <div className="grid3">
          {items.map((job) => (
            <ExampleCard key={job.id} job={job} onPlay={(j, l) => setOpen({ job: j, lang: l })} />
          ))}
        </div>
      )}

      {open && <Lightbox job={open.job} lang={open.lang} onClose={() => setOpen(null)} />}
    </section>
  );
}
