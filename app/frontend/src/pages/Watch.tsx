import { useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, RotateCcw } from 'lucide-react';
import SiteLayout, { Segmented } from '@/components/SiteLayout';
import RequestPanel from '@/components/RequestPanel';
import { usePrefs, type Lang } from '@/lib/prefs';
import { playerSrc, useDemos } from '@/lib/demos';
import { usePlayerEnded } from '@/lib/usePlayerEnded';

export const VIDEO_LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'zh', label: '中文' },
];

export default function Watch() {
  const { arxiv = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { t, lang: uiLang } = usePrefs();
  const { demos, error } = useDemos();
  const videoLang: Lang = params.get('lang') === 'zh' ? 'zh' : params.get('lang') === 'en' ? 'en' : uiLang;
  const [reloadKey, setReloadKey] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const ended = usePlayerEnded(frameRef, `${arxiv}-${videoLang}-${reloadKey}`);

  const demo = demos?.find((d) => d.arxiv === arxiv);

  const setVideoLang = (next: Lang) => {
    const p = new URLSearchParams(params);
    p.set('lang', next);
    setParams(p, { replace: true });
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-[1120px] px-5 py-8 md:px-8 md:py-12">
        <Link to="/#demos" className="inline-flex min-h-[40px] items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t('back')}
        </Link>

        {error && <p className="mt-6 text-sm text-destructive">{t('loadError')}</p>}
        {demos && !demo && <p className="mt-6 text-muted-foreground">{t('notFound')}</p>}

        {demo && (
          <>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[13px] text-muted-foreground">arXiv:{demo.arxiv}</p>
                <h1 className="font-display text-[28px] font-semibold leading-tight md:text-[36px]">{demo.title}</h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{t('videoLang')}</span>
                <Segmented value={videoLang} options={VIDEO_LANGS} onChange={setVideoLang} label={t('videoLang')} />
              </div>
            </div>

            <div className="mt-6 grid gap-8 lg:grid-cols-12">
              <div className="min-w-0 lg:col-span-8">
                <div className="ratio-16x9 relative w-full overflow-hidden rounded-[14px] bg-black shadow-[0_20px_50px_-20px_rgba(15,27,45,.45)]">
                  <iframe
                    key={`${demo.arxiv}-${videoLang}-${reloadKey}`}
                    ref={frameRef}
                    src={playerSrc(demo.arxiv, videoLang)}
                    title={`${demo.title} explainer`}
                    allow="autoplay; fullscreen"
                    className="absolute inset-0 h-full w-full border-0"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-md bg-secondary px-2.5 py-1 text-[13px] font-semibold text-secondary-foreground">
                    {t('previewBadge')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="inline-flex min-h-[40px] items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t('replay')}
                  </button>
                </div>

                <section className="mt-8 rounded-xl border border-border bg-card p-5 md:p-6">
                  <h2 className="font-display text-xl font-semibold">{t('howTitle')}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('howLine')}</p>
                  <a
                    href={`https://arxiv.org/abs/${demo.arxiv}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex min-h-[40px] items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4"
                  >
                    {t('readPaper')}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </section>
              </div>

              <aside className="min-w-0 lg:col-span-4">
                <RequestPanel arxiv={demo.arxiv} ended={ended} />
              </aside>
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
