import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LangSeg, ShareRow } from '@/components/media';
import VideoFeedback from '@/components/VideoFeedback';
import { ApiError, availableLangs, createJob, getJob, videoUrl, type Job, type MakeOpts } from '@/lib/explainer';
import { usePrefs, type Lang, type StringKey } from '@/lib/prefs';

const STEP_KEYS: StringKey[] = ['stepRead', 'stepScript', 'stepCheck', 'stepEn', 'stepZh'];
const POLL_MS = 5000;
const MAX_POLL_FAILS = 24; // about two minutes of failed polls before giving up
/** Typical seconds per step, from real renders. Used only for the progress bar and the time left. */
const STEP_SECS = [30, 50, 20, 100, 100];
const TOTAL_SECS = STEP_SECS.reduce((a, b) => a + b, 0);

/** Step index 0..4 from the job's stage text; -1 while waiting in line. */
function stepFromStage(job: Job): number {
  const s = (job.stage ?? '').toLowerCase();
  if (/(queue|wait)/.test(s)) return -1;
  if (/(zh|chinese|中文|mandarin)/.test(s)) return 4;
  if (/(check|verif|quote|number)/.test(s)) return 2;
  if (/(script|writ|llm|deepseek|scene)/.test(s)) return 1;
  if (/(english|record|voice|narrat|tts|audio|render|video|ffmpeg|upload)/.test(s)) return 3;
  if (/(read|fetch|paper|arxiv|abstract)/.test(s)) return 0;
  return job.status === 'queued' ? -1 : 0;
}

/** arXiv id, or the site a non-arXiv paper came from. */
export function srcLabel(job: Job): string {
  if (job.source_url) {
    try {
      return new URL(job.source_url).hostname.replace(/^www\./, '');
    } catch {
      return job.source_url;
    }
  }
  return `arXiv:${job.arxiv}`;
}

export default function MakeSection({ prefill }: { prefill?: string | null }) {
  const { t } = usePrefs();
  const [input, setInput] = useState(prefill ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [cached, setCached] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [slow, setSlow] = useState(false);
  const [model, setModel] = useState<MakeOpts['model']>('deepseek');
  const [voice, setVoice] = useState<MakeOpts['voice']>('female');
  const [now, setNow] = useState(() => Date.now());
  const startedAt = useRef<number>(Date.now());
  const stageAt = useRef<{ step: number; at: number }>({ step: -1, at: Date.now() });
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  useEffect(() => clearTimer, []);

  const poll = (id: string, fails = 0) => {
    getJob(id)
      .then((next) => {
        setSlow(false);
        setJob(next);
        if (next.status === 'done' || next.status === 'failed') return;
        timer.current = window.setTimeout(() => poll(id), POLL_MS);
      })
      .catch(() => {
        if (fails + 1 >= MAX_POLL_FAILS) {
          setError(t('pollError'));
          return;
        }
        setSlow(true);
        timer.current = window.setTimeout(() => poll(id, fails + 1), POLL_MS);
      });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      setError(t('makeEmpty'));
      return;
    }
    setSubmitting(true);
    setError(null);
    setJob(null);
    setCached(false);
    clearTimer();
    try {
      const created = await createJob(input.trim(), { model, voice });
      startedAt.current = created.created_at ? Date.parse(created.created_at) || Date.now() : Date.now();
      stageAt.current = { step: -2, at: Date.now() };
      setJob(created);
      setCached(!!created.cached || created.status === 'done');
      if (created.status !== 'done' && created.status !== 'failed') {
        timer.current = window.setTimeout(() => poll(created.id), POLL_MS);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  const running = !!job && job.status !== 'done' && job.status !== 'failed';
  const step = job ? stepFromStage(job) : -1;
  if (stageAt.current.step !== step) stageAt.current = { step, at: Date.now() };
  // progress: finished steps in full, plus the part of the current step that has probably passed (never past 90% of it)
  const doneSecs = STEP_SECS.slice(0, Math.max(step, 0)).reduce((a, b) => a + b, 0);
  const inStep = step >= 0 ? Math.min((now - stageAt.current.at) / 1000, STEP_SECS[step] * 0.9) : 0;
  const pct = Math.min(97, Math.round(((doneSecs + inStep) / TOTAL_SECS) * 100));
  const secsLeft = Math.max(0, TOTAL_SECS - doneSecs - inStep);
  const elapsed = Math.max(0, Math.round((now - startedAt.current) / 1000));
  const fmt = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
  const etaText =
    step < 0 ? t('etaQueued') : secsLeft < 25 ? t('etaAlmost') : t('etaLeft').replace('{m}', String(Math.max(1, Math.round(secsLeft / 60))));
  const langs = job && job.status === 'done' ? availableLangs(job) : [];
  const activeLang = (langs.includes(lang) ? lang : langs[0]) ?? 'en';
  const src = job && job.status === 'done' ? videoUrl(job, activeLang) : null;

  return (
    <section className="section" id="make" aria-labelledby="make-title">
      <h2 className="sec" id="make-title">
        {t('makeTitle')}
      </h2>
      <p className="sec-sub">{t('makeSub')}</p>

      <div className="card" style={{ marginTop: 22 }}>
        <form onSubmit={submit} noValidate>
          <div className="inline-form">
            <label className="field" htmlFor="arxiv">
              {t('makeLabel')}
              <input
                id="arxiv"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="https://arxiv.org/abs/1706.03762  ·  https://…/paper.pdf  ·  10.1145/…"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <button type="submit" className="btn primary" disabled={submitting || running}>
              {submitting ? <span className="spin" aria-hidden /> : null}
              {submitting ? t('makeSending') : t('makeBtn')}
            </button>
          </div>
          <div className="row" style={{ gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
            <label className="field" style={{ minWidth: 170 }}>
              {t('optModel')}
              <select value={model} onChange={(e) => setModel(e.target.value as MakeOpts['model'])} disabled={submitting || running}>
                <option value="deepseek">DeepSeek</option>
                <option value="stepfun">StepFun</option>
              </select>
            </label>
            <label className="field" style={{ minWidth: 170 }}>
              {t('optVoice')}
              <select value={voice} onChange={(e) => setVoice(e.target.value as MakeOpts['voice'])} disabled={submitting || running}>
                <option value="female">{t('voiceFemale')}</option>
                <option value="male">{t('voiceMale')}</option>
              </select>
            </label>
          </div>
        </form>

        {error && (
          <p className="err" role="alert">
            {error}
          </p>
        )}

        {job && (running || job.status === 'failed') && (
          <div className="fade">
            <p className="small muted" style={{ margin: '16px 0 0' }}>
              {t('waitNote')}
            </p>
            {job.stage && (
              <p className="small mono" style={{ margin: '8px 0 0' }}>
                {t('currentStage')}: {job.stage}
              </p>
            )}
            {job.status !== 'failed' && (
              <div style={{ margin: '14px 0 4px' }}>
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  style={{ height: 8, borderRadius: 99, background: 'var(--soft, #eee)', overflow: 'hidden' }}
                >
                  <div style={{ width: `${step < 0 ? 4 : pct}%`, height: '100%', background: 'var(--accent, #5B4BFF)', transition: 'width .8s ease' }} />
                </div>
                <div className="row between small muted" style={{ marginTop: 6 }}>
                  <span>{etaText}</span>
                  <span className="mono">
                    {fmt(elapsed)} {t('etaElapsed')}
                  </span>
                </div>
                {slow && <p className="small muted" style={{ margin: '4px 0 0' }}>{t('pollRetry')}</p>}
              </div>
            )}
            <ol className="steps">
              {STEP_KEYS.map((key, i) => (
                <li key={key} className={i < step ? 'done' : i === step ? 'active' : undefined}>
                  <span className="dot" aria-hidden>
                    {i < step ? '✓' : i + 1}
                  </span>
                  {t(key)}
                </li>
              ))}
            </ol>
            {job.status === 'failed' && (
              <div className="stack" role="alert">
                <strong style={{ color: 'var(--bad)' }}>{t('failedTitle')}</strong>
                <p className="small muted" style={{ margin: 0 }}>
                  {job.error || t('failedFallback')}
                </p>
              </div>
            )}
          </div>
        )}

        {job && job.status === 'done' && src && (
          <div className="fade" style={{ marginTop: 20 }}>
            {cached && (
              <p className="note" style={{ marginBottom: 14 }}>
                {t('cachedNote')}
              </p>
            )}
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="media-cap" style={{ margin: 0 }}>
                <span className="t">{job.title}</span>
                <span className="mono small">{srcLabel(job)}</span>
              </div>
              <LangSeg value={activeLang} options={langs} onChange={setLang} />
            </div>
            <div className="screen">
              <video key={src} src={src} controls playsInline preload="metadata" title={job.title ?? ''} />
            </div>
            <ShareRow job={job} lang={activeLang} />
            <VideoFeedback arxiv={job.arxiv} />
            <div className="actions">
              <button
                type="button"
                className="btn ghost small"
                onClick={() => {
                  setJob(null);
                  setCached(false);
                  setInput('');
                  setError(null);
                }}
              >
                {t('makeAnother')}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
