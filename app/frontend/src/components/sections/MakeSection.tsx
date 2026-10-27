import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LangSeg, ShareRow } from '@/components/media';
import VideoFeedback from '@/components/VideoFeedback';
import { ApiError, availableLangs, createJob, getJob, videoUrl, type Job } from '@/lib/explainer';
import { usePrefs, type Lang, type StringKey } from '@/lib/prefs';

const STEP_KEYS: StringKey[] = ['stepRead', 'stepScript', 'stepCheck', 'stepEn', 'stepZh'];
const POLL_MS = 5000;

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

export default function MakeSection({ prefill }: { prefill?: string | null }) {
  const { t } = usePrefs();
  const [input, setInput] = useState(prefill ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [cached, setCached] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const timer = useRef<number | null>(null);

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  useEffect(() => clearTimer, []);

  const poll = (id: string) => {
    getJob(id)
      .then((next) => {
        setJob(next);
        if (next.status === 'done' || next.status === 'failed') return;
        timer.current = window.setTimeout(() => poll(id), POLL_MS);
      })
      .catch(() => setError(t('pollError')));
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
      const created = await createJob(input.trim());
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
                placeholder="1706.03762 / https://arxiv.org/abs/1706.03762"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <button type="submit" className="btn primary" disabled={submitting || running}>
              {submitting ? <span className="spin" aria-hidden /> : null}
              {submitting ? t('makeSending') : t('makeBtn')}
            </button>
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
                <span className="mono small">arXiv:{job.arxiv}</span>
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
