import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LangSeg, ShareRow } from '@/components/media';
import VideoFeedback from '@/components/VideoFeedback';
import SectionsReader from '@/components/SectionsReader';
import { ApiError, availableLangs, createJob, getJob, lookupPaper, videoUrl, LENGTHS, STYLES, TONES, type Job, type MakeOpts } from '@/lib/explainer';
import { usePrefs, type Lang, type StringKey } from '@/lib/prefs';
import { scrollToSection } from '@/components/Shell';
import { AccountStrip, LimitPanel } from '@/components/AccountUI';
import { track, useAccount } from '@/lib/account';

const STEP_KEYS: StringKey[] = ['stepRead', 'stepScript', 'stepCheck', 'stepEn', 'stepZh'];
const POLL_MS = 5000;
const MAX_POLL_FAILS = 24; // about two minutes of failed polls before giving up
/** Typical seconds per step, from real renders; recording runs in real time, so it grows with the video length. Used only for the progress bar and the time left. */
const stepSecs = (len: number) => [30, 40 + Math.round(len / 6), 20, Math.round(len * 1.1) + 40, Math.round(len * 1.1) + 40];
const STYLE_KEYS: Record<(typeof STYLES)[number], StringKey> = { animated: 'styleAnimated', cinema: 'styleCinema', classic: 'styleClassic', light: 'styleLight', sunset: 'styleSunset', mono: 'styleMono' };
const TONE_KEYS: Record<(typeof TONES)[number], StringKey> = { teacher: 'toneTeacher', casual: 'toneCasual', academic: 'toneAcademic', eli5: 'toneEli5', story: 'toneStory' };
const SWATCH: Record<(typeof STYLES)[number], string> = {
  animated: 'conic-gradient(from 200deg,#3dff8f,#4aa3ff,#c86bff,#ff7a59,#3dff8f)',
  cinema: 'linear-gradient(135deg,#050510,#c9a96a)',
  classic: 'linear-gradient(135deg,#0a1422,#3dff8f)',
  light: 'linear-gradient(135deg,#fbfaf6,#4a3cf0)',
  sunset: 'linear-gradient(135deg,#2a1038,#ff7a59)',
  mono: 'linear-gradient(135deg,#161616,#ffffff)',
};
const looksLikePaper = (v: string) => /\d{4}\.\d{4,5}|^https?:\/\/\S+\.\S+|^10\.\d{4,9}\//.test(v.trim());

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

export default function MakeSection({ prefill, autoOpen }: { prefill?: string | null; autoOpen?: boolean }) {
  const { t } = usePrefs();
  const { refresh: refreshAccount } = useAccount();
  const [limit, setLimit] = useState<null | 'quota_guest' | 'quota_member'>(null);
  const [input, setInput] = useState(prefill ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [cached, setCached] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [slow, setSlow] = useState(false);
  const [voice, setVoice] = useState<MakeOpts['voice']>('female');
  const [style] = useState<MakeOpts['style']>('animated');
  const [tone, setTone] = useState<MakeOpts['tone']>('teacher');
  const [seconds, setSeconds] = useState<number>(180);
  const [custom, setCustom] = useState('');
  const [existing, setExisting] = useState<Job[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const startedAt = useRef<number>(Date.now());
  const stageAt = useRef<{ step: number; at: number }>({ step: -1, at: Date.now() });
  const timer = useRef<number | null>(null);
  const opened = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // when the pasted link is a paper that already has videos, say so before anything is made
  useEffect(() => {
    const v = input.trim();
    if (!looksLikePaper(v)) {
      setExisting([]);
      return;
    }
    let alive = true;
    const id = window.setTimeout(() => {
      lookupPaper(v)
        .then((l) => {
          if (!alive) return;
          setExisting(l);
          // arriving from /abs/<id>: open the newest finished video for this paper straight away
          const ready = l.find((j) => j.status === 'done');
          if (autoOpen && ready && !opened.current) {
            opened.current = true;
            setJob(ready);
            setCached(true);
          }
        })
        .catch(() => alive && setExisting([]));
    }, 600);
    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, [input]);

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
    setLimit(null);
    track('click_make');
    setJob(null);
    setCached(false);
    clearTimer();
    try {
      const created = await createJob(input.trim(), { voice, style, tone, seconds, custom: custom.trim(), force_new: existing.length > 0 });
      startedAt.current = created.created_at ? Date.parse(created.created_at) || Date.now() : Date.now();
      stageAt.current = { step: -2, at: Date.now() };
      setJob(created);
      refreshAccount();
      setCached(!!created.cached || created.status === 'done');
      if (created.status !== 'done' && created.status !== 'failed') {
        timer.current = window.setTimeout(() => poll(created.id), POLL_MS);
      }
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'quota_guest' || err.code === 'quota_member')) { setLimit(err.code); refreshAccount(); }
      else setError(err instanceof ApiError ? err.message : t('networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  const running = !!job && job.status !== 'done' && job.status !== 'failed';
  const step = job ? stepFromStage(job) : -1;
  if (stageAt.current.step !== step) stageAt.current = { step, at: Date.now() };
  // progress: finished steps in full, plus the part of the current step that has probably passed (never past 90% of it)
  const STEP_SECS = stepSecs(job?.seconds ?? 36);
  const TOTAL_SECS = STEP_SECS.reduce((a, b) => a + b, 0);
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

      <div style={{ marginTop: 22 }}><AccountStrip /></div>
      <div className="card">
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
              {submitting ? t('makeSending') : existing.length > 0 ? t('makeNewBtn') : t('makeBtn')}
            </button>
          </div>
          <div className="row" style={{ gap: 14, marginTop: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label className="field" style={{ minWidth: 130 }}>
              {t('optLength')}
              <select value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} disabled={submitting || running}>
                {LENGTHS.map((n) => (
                  <option key={n} value={n}>
                    {t('min').replace('{n}', String(n / 60))}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" style={{ minWidth: 170 }}>
              {t('optTone')}
              <select value={tone} onChange={(e) => setTone(e.target.value as MakeOpts['tone'])} disabled={submitting || running}>
                {TONES.map((k) => (
                  <option key={k} value={k}>
                    {t(TONE_KEYS[k])}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" style={{ minWidth: 150 }}>
              {t('optVoice')}
              <select value={voice} onChange={(e) => setVoice(e.target.value as MakeOpts['voice'])} disabled={submitting || running}>
                <option value="female">{t('voiceFemale')}</option>
                <option value="male">{t('voiceMale')}</option>
              </select>
            </label>
          </div>
          <label className="field" style={{ marginTop: 14 }}>
            {t('optCustom')}
            <input type="text" value={custom} maxLength={300} onChange={(e) => setCustom(e.target.value)} placeholder={t('optCustomPh')} disabled={submitting || running} />
          </label>
          {seconds > 180 && (
            <p className="small muted" style={{ margin: '10px 0 0' }}>
              {t('longNote').replace('{m}', String(Math.round(stepSecs(seconds).reduce((x, y) => x + y, 0) / 60)))}
            </p>
          )}
        </form>

        {existing.length > 0 && !running && (
          <div className="note" style={{ marginTop: 16 }}>
            <strong>{t('existingTitle').replace('{n}', String(existing.length))}</strong>
            <p className="small muted" style={{ margin: '4px 0 10px' }}>
              {t('existingHint')}
            </p>
            <div className="stack" style={{ gap: 8 }}>
              {existing.map((j) => (
                <div key={j.id} className="row between" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  {(() => {
                    const v = j.videos?.en ?? j.videos?.zh;
                    const poster = j.sections?.find((x) => x.poster)?.poster;
                    return v ? (
                      <div style={{ width: 96, height: 54, borderRadius: 8, overflow: 'hidden', background: '#0b0f1a', flex: 'none' }}>
                        {poster ? <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <video src={`${v}#t=1.5`} preload="metadata" muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                    ) : null;
                  })()}
                  <span className="small" style={{ flex: 1, minWidth: 140 }}>
                    {t('min').replace('{n}', String(Math.max(1, Math.round((j.seconds ?? 36) / 60))))} · {t(STYLE_KEYS[(j.style as (typeof STYLES)[number]) ?? 'classic'] ?? 'styleClassic')} ·{' '}
                    {t(TONE_KEYS[(j.tone as (typeof TONES)[number]) ?? 'teacher'] ?? 'toneTeacher')}
                    {j.custom ? ` · "${j.custom.slice(0, 40)}"` : ''}
                  </span>
                  {j.status === 'done' ? (
                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={() => {
                        clearTimer();
                        setError(null);
                        setJob(j);
                        setCached(true);
                      }}
                    >
                      {t('existingWatch')}
                    </button>
                  ) : (
                    <span className="small muted">{t('existingMaking')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {limit && <LimitPanel code={limit} />}
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
                <p className="small" style={{ margin: 0 }}>
                  <a href="#feedback" onClick={(e) => { e.preventDefault(); scrollToSection('feedback'); }}>{t('failedHelp')} →</a>
                </p>
              </div>
            )}
          </div>
        )}

        {job && running && (job.sections?.length ?? 0) > 0 && <SectionsReader job={job} lang={lang} />}

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
              {(() => {
                const poster = job.sections?.find((s) => s.poster)?.poster ?? undefined;
                return <video key={src} src={poster ? src : `${src}#t=1.5`} poster={poster} controls playsInline preload="metadata" title={job.title ?? ''} />;
              })()}
            </div>
            <ShareRow job={job} lang={activeLang} />
            <SectionsReader job={job} lang={activeLang} />
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
