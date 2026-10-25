import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Lock, RotateCcw } from 'lucide-react';
import SiteLayout, { Segmented } from '@/components/SiteLayout';
import { client } from '@/lib/api';
import { usePrefs, type Lang } from '@/lib/prefs';
import { formatRequestNo, playerSrc, useDemos, type FullVideoRequest } from '@/lib/demos';

const VIDEO_LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'zh', label: '中文' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ARXIV_RE = /^(\d{4}\.\d{4,5}(v\d+)?|[a-z-]+(\.[A-Z]{2})?\/\d{7}(v\d+)?)$/i;

type PlayerWindow = Window & { __done?: boolean; PlayerOnEnd?: (cb: () => void) => void };

function RequestForm({ defaultArxiv }: { defaultArxiv: string }) {
  const { t, lang } = usePrefs();
  const [email, setEmail] = useState('');
  const [arxiv, setArxiv] = useState(defaultArxiv);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ email?: boolean; arxiv?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [requestId, setRequestId] = useState<number | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = { email: !EMAIL_RE.test(email.trim()), arxiv: !ARXIV_RE.test(arxiv.trim()) };
    setErrors(next);
    if (next.email || next.arxiv) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      const res = await client.entities.full_video_requests.create({
        data: {
          email: email.trim(),
          arxiv_id: arxiv.trim(),
          note: note.trim(),
          ui_lang: lang,
          source_arxiv: defaultArxiv,
        },
      });
      setRequestId((res.data as FullVideoRequest).id);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (requestId !== null) {
    return (
      <div role="status" className="animate-in fade-in duration-300">
        <h3 className="font-display text-xl font-semibold">{t('successTitle')}</h3>
        <p className="mt-3 text-[13px] text-muted-foreground">{t('requestNo')}</p>
        <p className="font-display text-3xl font-semibold tracking-wide text-primary">{formatRequestNo(requestId)}</p>
        <p className="mt-3 text-sm text-muted-foreground">{t('successLine')}</p>
        <button
          type="button"
          onClick={() => {
            setRequestId(null);
            setNote('');
          }}
          className="mt-5 min-h-[40px] text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t('another')}
        </button>
      </div>
    );
  }

  const inputCls =
    'w-full min-h-[44px] rounded-lg border bg-background px-3 text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label htmlFor="req-email" className="mb-1.5 block text-sm font-semibold">
          {t('email')}
        </label>
        <input
          id="req-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={errors.email}
          aria-describedby={errors.email ? 'req-email-err' : undefined}
          className={`${inputCls} ${errors.email ? 'border-destructive' : 'border-border'}`}
        />
        {errors.email && (
          <p id="req-email-err" className="mt-1 text-[13px] text-destructive">
            {t('errEmail')}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="req-arxiv" className="mb-1.5 block text-sm font-semibold">
          {t('arxiv')}
        </label>
        <input
          id="req-arxiv"
          value={arxiv}
          onChange={(e) => setArxiv(e.target.value)}
          aria-invalid={errors.arxiv}
          aria-describedby={errors.arxiv ? 'req-arxiv-err' : undefined}
          className={`${inputCls} ${errors.arxiv ? 'border-destructive' : 'border-border'}`}
        />
        {errors.arxiv && (
          <p id="req-arxiv-err" className="mt-1 text-[13px] text-destructive">
            {t('errArxiv')}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="req-note" className="mb-1.5 block text-sm font-semibold">
          {t('note')}
        </label>
        <textarea
          id="req-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('notePlaceholder')}
          className={`${inputCls} border-border py-2`}
        />
      </div>
      {submitError && <p className="text-[13px] text-destructive">{t('errSubmit')}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {submitting ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}

export default function Watch() {
  const { arxiv = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { t, lang: uiLang } = usePrefs();
  const { demos, error } = useDemos();
  const videoLang: Lang = params.get('lang') === 'zh' ? 'zh' : params.get('lang') === 'en' ? 'en' : uiLang;
  const [ended, setEnded] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const demo = demos?.find((d) => d.arxiv === arxiv);

  useEffect(() => {
    setEnded(false);
  }, [arxiv, videoLang, reloadKey]);

  useEffect(() => {
    if (ended) return;
    const timer = window.setInterval(() => {
      try {
        const w = frameRef.current?.contentWindow as PlayerWindow | null;
        if (w?.__done) setEnded(true);
      } catch {
        /* cross-origin access is not expected; ignore */
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [ended, arxiv, videoLang, reloadKey]);

  const onFrameLoad = useCallback(() => {
    try {
      const w = frameRef.current?.contentWindow as PlayerWindow | null;
      w?.PlayerOnEnd?.(() => setEnded(true));
    } catch {
      /* polling fallback covers this */
    }
  }, []);

  const setVideoLang = (next: Lang) => {
    const p = new URLSearchParams(params);
    p.set('lang', next);
    setParams(p, { replace: true });
  };

  const showForm = ended || unlocked;

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
              <div className="lg:col-span-8">
                <div className="relative ratio-16x9 w-full overflow-hidden rounded-[14px] bg-black shadow-[0_20px_50px_-20px_rgba(15,27,45,.45)]">
                  <iframe
                    key={`${demo.arxiv}-${videoLang}-${reloadKey}`}
                    ref={frameRef}
                    src={playerSrc(demo.arxiv, videoLang)}
                    title={`${demo.title} explainer`}
                    allow="autoplay; fullscreen"
                    onLoad={onFrameLoad}
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

              <aside className="lg:col-span-4">
                <div className="rounded-xl border border-border bg-card p-5 md:p-6">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                      <Lock className="h-4 w-4" />
                    </span>
                    <h2 className="font-display text-xl font-semibold">{t('lockedTitle')}</h2>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t('lockedLine')}</p>
                  <div className="mt-5">
                    {showForm ? (
                      <div className="animate-in fade-in duration-300">
                        <RequestForm key={demo.arxiv} defaultArxiv={demo.arxiv} />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border p-4">
                        <p className="text-sm text-muted-foreground">{t('lockedWaiting')}</p>
                        <button
                          type="button"
                          onClick={() => setUnlocked(true)}
                          className="mt-3 min-h-[40px] text-sm font-semibold text-primary hover:underline underline-offset-4"
                        >
                          {t('unlockNow')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
