import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Check, ExternalLink, Loader2, RotateCcw, X } from 'lucide-react';
import SiteLayout, { Segmented } from '@/components/SiteLayout';
import RequestPanel from '@/components/RequestPanel';
import { VIDEO_LANGS } from '@/pages/Watch';
import { client } from '@/lib/api';
import { usePrefs, type Lang, type StringKey } from '@/lib/prefs';
import { usePlayerEnded, type PlayerWindow } from '@/lib/usePlayerEnded';
import {
  PaperNotFoundError,
  RateLimitError,
  ScriptParseError,
  checkScript,
  fetchPaper,
  paperText,
  parseArxivId,
  writeScript,
  type PreviewResult,
} from '@/lib/makePreview';

type Phase = 'paper' | 'script' | 'check' | 'ready' | 'error';
type ErrorKind = 'invalid' | 'rate' | 'notfound' | 'parse' | 'generic';

const STEPS: { phase: Exclude<Phase, 'ready' | 'error'>; key: StringKey }[] = [
  { phase: 'paper', key: 'stepPaper' },
  { phase: 'script', key: 'stepScript' },
  { phase: 'check', key: 'stepCheck' },
];

const ERROR_KEYS: Record<ErrorKind, StringKey> = {
  invalid: 'ownInvalid',
  rate: 'errRate',
  notfound: 'errNotFound',
  parse: 'errParse',
  generic: 'errGeneric',
};

export default function Make() {
  const [params] = useSearchParams();
  const { t, lang: uiLang } = usePrefs();
  const id = parseArxivId(params.get('id') ?? '');
  const [phase, setPhase] = useState<Phase>('paper');
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(id ? null : 'invalid');
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [speak, setSpeak] = useState<Lang>(uiLang);
  const [runNo, setRunNo] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const ended = usePlayerEnded(frameRef, `${id}-${attempt}-${runNo}`);

  useEffect(() => {
    if (!id) {
      setPhase('error');
      setErrorKind('invalid');
      return;
    }
    let cancelled = false;
    setResult(null);
    setErrorKind(null);
    setPhase('paper');

    (async () => {
      try {
        const paper = await fetchPaper(id);
        if (cancelled) return;
        setPhase('script');
        const draft = await writeScript(paper);
        if (cancelled) return;
        setPhase('check');
        const checked = checkScript(draft, paperText(paper));
        if (cancelled) return;
        setResult({ paper, ...checked });
        setPhase('ready');
        client.entities.made_previews
          .create({ data: { arxiv_id: paper.id, title: paper.title, scene_count: checked.script.scenes.length } })
          .catch(() => undefined);
      } catch (err) {
        if (cancelled) return;
        setPhase('error');
        setErrorKind(
          err instanceof RateLimitError
            ? 'rate'
            : err instanceof PaperNotFoundError
              ? 'notfound'
              : err instanceof ScriptParseError
                ? 'parse'
                : 'generic',
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const play = useCallback(
    (lang: Lang) => {
      const w = frameRef.current?.contentWindow as PlayerWindow | null;
      if (!w || !result) return;
      try {
        w.__done = false;
      } catch {
        /* same-origin player; ignore */
      }
      w.postMessage({ type: 'script', script: result.script, limit: 20, speak: lang }, '*');
      setRunNo((n) => n + 1);
    },
    [result],
  );

  const changeSpeak = (next: Lang) => {
    setSpeak(next);
    play(next);
  };

  const activeStep = STEPS.findIndex((s) => s.phase === phase);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-[1120px] px-5 py-8 md:px-8 md:py-12">
        <Link to="/#own" className="inline-flex min-h-[40px] items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t('backHome')}
        </Link>

        <div className="mt-4 min-w-0">
          {id && <p className="text-[13px] text-muted-foreground">arXiv:{id}</p>}
          <h1 className="break-words font-display text-[28px] font-semibold leading-tight md:text-[36px]">
            {result?.paper.title ?? t('makeTitle')}
          </h1>
        </div>

        {phase !== 'ready' && phase !== 'error' && (
          <div className="mt-6 grid gap-8 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-8">
              <div className="ratio-16x9 flex w-full flex-col items-center justify-center rounded-[14px] bg-[#05080F] px-6 text-center text-white shadow-[0_20px_50px_-20px_rgba(15,27,45,.45)]">
                <Loader2 className="h-8 w-8 animate-spin text-white/80" aria-hidden />
                <p className="mt-4 text-sm text-white/80" role="status">
                  {t(STEPS[Math.max(activeStep, 0)].key)}
                </p>
              </div>
            </div>
            <ol className="space-y-3 lg:col-span-4">
              {STEPS.map((s, i) => (
                <li key={s.phase} className="flex items-center gap-3 text-sm">
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                      i < activeStep
                        ? 'border-primary bg-primary text-primary-foreground'
                        : i === activeStep
                          ? 'border-primary text-primary'
                          : 'border-border text-muted-foreground'
                    }`}
                  >
                    {i < activeStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className={i === activeStep ? 'font-semibold' : 'text-muted-foreground'}>{t(s.key)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {phase === 'error' && errorKind && (
          <div className="mt-6 rounded-xl border border-border bg-card p-6" role="alert">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="min-w-0">
                <p className="font-semibold">{t(ERROR_KEYS[errorKind])}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {errorKind !== 'invalid' && (
                    <button
                      type="button"
                      onClick={() => setAttempt((a) => a + 1)}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t('tryAgain')}
                    </button>
                  )}
                  <Link
                    to="/#own"
                    className="inline-flex min-h-[40px] items-center rounded-lg border border-border px-4 text-sm font-semibold text-primary hover:bg-secondary"
                  >
                    {t('tryOther')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === 'ready' && result && (
          <div className="mt-6 grid gap-8 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-8">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-md bg-secondary px-2.5 py-1 text-[13px] font-semibold text-secondary-foreground">
                  {t('previewBadge')}
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-muted-foreground">{t('videoLang')}</span>
                  <Segmented value={speak} options={VIDEO_LANGS} onChange={changeSpeak} label={t('videoLang')} />
                </div>
              </div>
              <div className="ratio-16x9 relative w-full overflow-hidden rounded-[14px] bg-black shadow-[0_20px_50px_-20px_rgba(15,27,45,.45)]">
                <iframe
                  key={`${id}-${attempt}`}
                  ref={frameRef}
                  src="/explainer/player.html?wait"
                  title={`${result.paper.title} explainer`}
                  allow="autoplay; fullscreen"
                  onLoad={() => play(speak)}
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13px] text-muted-foreground">
                  {result.script.scenes.length} {t('scenesUnit')}
                </p>
                <button
                  type="button"
                  onClick={() => play(speak)}
                  className="inline-flex min-h-[40px] items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t('replayShort')}
                </button>
              </div>

              {result.paper.abstractOnly && (
                <p className="mt-4 rounded-lg border border-border bg-secondary/60 px-4 py-3 text-sm text-secondary-foreground">
                  {t('abstractOnly')}
                </p>
              )}

              <section className="mt-6 rounded-xl border border-border bg-card p-5 md:p-6">
                <h2 className="font-display text-xl font-semibold">{t('checkedTitle')}</h2>
                <ol className="mt-4 space-y-4">
                  {result.checks.map((c) => (
                    <li key={c.index} className="flex gap-3">
                      <span
                        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          c.status === 'kept'
                            ? 'bg-primary text-primary-foreground'
                            : c.status === 'removed'
                              ? 'bg-destructive/15 text-destructive'
                              : 'bg-secondary text-muted-foreground'
                        }`}
                        aria-hidden
                      >
                        {c.status === 'kept' ? <Check className="h-3.5 w-3.5" /> : c.status === 'removed' ? <X className="h-3.5 w-3.5" /> : '–'}
                      </span>
                      <div className="min-w-0 text-sm">
                        <p className="text-[13px] font-semibold text-muted-foreground">
                          {t('sceneLabel')} {c.index + 1}
                        </p>
                        {c.quote && <blockquote className="mt-0.5 break-words font-display italic">“{c.quote}”</blockquote>}
                        {c.status === 'removed' && (
                          <p className="mt-0.5 break-words text-muted-foreground">
                            {t('quoteRemoved')} <span className="line-through">“{c.removedQuote}”</span>
                          </p>
                        )}
                        {c.status === 'none' && <p className="mt-0.5 text-muted-foreground">{t('quoteNone')}</p>}
                        {c.numberReplaced && <p className="mt-1 text-[13px] text-destructive">{t('numberReplaced')}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-[13px] text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {t('aiDraftNote')}
                </p>
                <a
                  href={`https://arxiv.org/abs/${result.paper.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex min-h-[40px] items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4"
                >
                  {t('readPaper')}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </section>
            </div>

            <aside className="min-w-0 lg:col-span-4">
              <RequestPanel arxiv={result.paper.id} ended={ended} />
            </aside>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
