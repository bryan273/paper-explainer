import { useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PURPOSE, useSettings } from '@/lib/settings';
import { LangSeg, ShareRow } from '@/components/media';
import VideoFeedback from '@/components/VideoFeedback';
import SectionsReader from '@/components/SectionsReader';
import Studio from '@/components/Studio';
import { ApiError, availableLangs, localPdfs, createJob, getJob, lookupPaper, uploadPaper, videoUrl, LENGTHS, MAX_PDF_BYTES, MAX_PDF_FILES, STYLES, TONES, type Job, type MakeOpts } from '@/lib/explainer';
import { usePrefs, type Lang, type StringKey } from '@/lib/prefs';
import { scrollToSection } from '@/components/Shell';
import { AccountStrip, LimitPanel } from '@/components/AccountUI';
import { track, useAccount } from '@/lib/account';
import { pick } from '@/lib/i18n_extra';

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
  // the sections stage texts ("getting the drawing tools ready", "sections ready: 2 of 4", "drawing 4 sections", "putting the sections together") all belong to the recording step
  if (/(sections|drawing)/.test(s)) return 3;
  if (/(check|verif|quote|number)/.test(s)) return 2;
  if (/(script|writ|llm|deepseek|scene)/.test(s)) return 1;
  if (/(english|record|voice|narrat|tts|audio|render|video|ffmpeg|upload)/.test(s)) return 3;
  if (/(read|fetch|paper|arxiv|abstract)/.test(s)) return 0;
  return job.status === 'queued' ? -1 : 0;
}

/** arXiv id, or the site a non-arXiv paper came from. */
export function srcLabel(job: Job): string {
  if (job.source_url?.startsWith('upload:')) return 'PDF';
  if (job.source_url) {
    try {
      return new URL(job.source_url).hostname.replace(/^www\./, '');
    } catch {
      return job.source_url;
    }
  }
  return `arXiv:${job.arxiv}`;
}

const ACTIVE_JOB = 'pe-active-job';

const SRC = {
  label: { en: 'What to explain', zh: '要讲解什么', vi: 'Nội dung cần giải thích', id: 'Apa yang dijelaskan' },
  link: { en: 'Link', zh: '链接', vi: 'Liên kết', id: 'Tautan' },
  text: { en: 'Paste text', zh: '粘贴文字', vi: 'Dán văn bản', id: 'Tempel teks' },
  file: { en: 'Upload file', zh: '上传文件', vi: 'Tải tệp lên', id: 'Unggah berkas' },
  linkHelp: { en: 'An arXiv link, a PDF link, a DOI, or any web page with the text in it: an article, a lesson, a report.', zh: 'arXiv 链接、PDF 链接、DOI，或任何有正文的网页：文章、课程、报告。', vi: 'Liên kết arXiv, liên kết PDF, DOI hoặc bất kỳ trang web nào có nội dung: bài viết, bài học, báo cáo.', id: 'Tautan arXiv, tautan PDF, DOI, atau halaman web apa pun yang berisi teks: artikel, pelajaran, laporan.' },
  textHelp: { en: 'Paste an article, lecture notes, a chapter, a report. At least 300 characters.', zh: '粘贴文章、讲义、章节或报告。至少 300 个字符。', vi: 'Dán bài viết, ghi chú bài giảng, một chương hay báo cáo. Ít nhất 300 ký tự.', id: 'Tempel artikel, catatan kuliah, bab, atau laporan. Minimal 300 karakter.' },
  textPh: { en: 'Paste your text here…', zh: '在这里粘贴文字…', vi: 'Dán văn bản vào đây…', id: 'Tempel teks Anda di sini…' },
  tooShort: { en: 'a bit more text please', zh: '请再多一点文字', vi: 'cần thêm chút văn bản', id: 'tambah sedikit teks' },
  choose: { en: 'Choose files', zh: '选择文件', vi: 'Chọn tệp', id: 'Pilih berkas' },
  fileHelp: { en: 'or drop them here. PDF, TXT or Markdown, up to {n} files, {mb} MB each. One video per file.', zh: '或拖到这里。PDF、TXT 或 Markdown，最多 {n} 个文件，每个 {mb} MB。每个文件生成一个视频。', vi: 'hoặc kéo thả vào đây. PDF, TXT hoặc Markdown, tối đa {n} tệp, mỗi tệp {mb} MB. Mỗi tệp một video.', id: 'atau seret ke sini. PDF, TXT, atau Markdown, hingga {n} berkas, masing-masing {mb} MB. Satu video per berkas.' },
} as const;

export default function MakeSection({ prefill, autoOpen }: { prefill?: string | null; autoOpen?: boolean }) {
  const { t, lang: uiLang } = usePrefs();
  const { refresh: refreshAccount, user: acctUser } = useAccount();
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
  const [pset] = useSettings();
  const [tone, setTone] = useState<MakeOpts['tone']>(() => (pset.purpose ? PURPOSE[pset.purpose].tone : 'teacher'));
  const [tab, setTab] = useState<'link' | 'text' | 'file'>('link');
  const [pasted, setPasted] = useState('');
  const [seconds, setSeconds] = useState<number>(() => (pset.purpose ? PURPOSE[pset.purpose].seconds : 180));
  const [custom, setCustom] = useState('');
  const [existing, setExisting] = useState<Job[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [sending, setSending] = useState<{ i: number; n: number } | null>(null);
  const [batch, setBatch] = useState<Job[]>([]);
  const [dragging, setDragging] = useState(false);
  type VLang = 'en' | 'zh' | 'vi' | 'id' | 'both';
  // interactive video is the viewer's choice, asked here and again under the finished video
  const [inter, setInter] = useState(() => { try { return localStorage.getItem('pe-interactive') === '1'; } catch { return false; } });
  const setInterOn = (v: boolean) => { setInter(v); try { localStorage.setItem('pe-interactive', v ? '1' : '0'); localStorage.setItem('pe-inter-intro', '1'); } catch { /* private mode */ } };
  const [vlang, setVlang] = useState<VLang>(uiLang);   // the language the video is made in: one is faster than both
  const fileRef = useRef<HTMLInputElement>(null);
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

  const MB = MAX_PDF_BYTES / 1024 / 1024;
  const addFiles = (list: FileList | File[]) => {
    const next = [...files];
    let err: string | null = null;
    for (const f of Array.from(list)) {
      if (f.type !== 'application/pdf' && !/\.(pdf|txt|md)$/i.test(f.name)) { err = t('uploadNotPdf'); continue; }
      if (f.size > MAX_PDF_BYTES) { err = t('uploadTooBig').replace('{name}', f.name).replace('{mb}', String(MB)); continue; }
      if (next.some((x) => x.name === f.name && x.size === f.size)) continue;
      if (next.length >= MAX_PDF_FILES) { err = t('uploadTooMany').replace('{n}', String(MAX_PDF_FILES)); break; }
      next.push(f);
    }
    setFiles(next);
    setFileError(err);
    if (next.length) { setInput(''); setError(null); }
  };

  // the other videos of a batch: refresh their status every few seconds until they are all over
  useEffect(() => {
    if (batch.length < 2 || !batch.some((j) => j.status !== 'done' && j.status !== 'failed')) return;
    const id = window.setInterval(() => {
      Promise.all(batch.map((j) => (j.status === 'done' || j.status === 'failed' ? j : getJob(j.id).catch(() => j)))).then(setBatch);
    }, 8000);
    return () => window.clearInterval(id);
  }, [batch]);

  useEffect(() => {
  }, [job?.id]);

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  useEffect(() => clearTimer, []);

  // /?job=<id>: open that exact video (finished, still rendering or failed) with its Ask history, instead of looking a paper up by its link
  const [qs] = useSearchParams();
  const wantJob = qs.get('job');
  useEffect(() => {
    if (!wantJob || !/^[0-9a-f-]{36}$/.test(wantJob)) return;
    let alive = true;
    getJob(wantJob)
      .then((j) => {
        if (!alive) return;
        setJob(j);
        setCached(j.status === 'done');
        if (j.status !== 'done' && j.status !== 'failed') poll(j.id);
        window.setTimeout(() => document.getElementById('make')?.scrollIntoView({ behavior: 'smooth' }), 200);
      })
      .catch(() => alive && setError(t('networkError')));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantJob]);

  // The video is made on the server, so closing the tab never stops it. Coming back, pick the running video up again where it is.
  useEffect(() => {
    if (wantJob) return;
    let id: string | null = null;
    try { id = localStorage.getItem(ACTIVE_JOB); } catch { /* private mode */ }
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) return;
    let alive = true;
    getJob(id).then((j) => {
      if (!alive) return;
      if (j.status === 'done' || j.status === 'failed') { try { localStorage.removeItem(ACTIVE_JOB); } catch { /* private mode */ } return; }
      startedAt.current = j.created_at ? Date.parse(j.created_at) || Date.now() : Date.now();
      setJob(j);
      poll(j.id);
    }).catch(() => { /* leave it for next time */ });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const poll = (id: string, fails = 0) => {
    getJob(id)
      .then((next) => {
        setSlow(false);
        setJob(next);
        if (next.status === 'done' || next.status === 'failed') { try { localStorage.removeItem(ACTIVE_JOB); } catch { /* private mode */ } return; }
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
    const useFiles = tab === 'file' && files.length > 0;
    if ((tab === 'link' && !input.trim()) || (tab === 'file' && files.length === 0) || (tab === 'text' && pasted.trim().length < 300)) {
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
    setBatch([]);
    const made: Job[] = [];
    try {
      const opts = { voice, style, tone, seconds, custom: custom.trim(), langs: vlang };
      if (tab === 'text') {
        setSending({ i: 1, n: 1 });
        const path = await uploadPaper(new Blob([pasted.trim()], { type: 'text/plain' }), pasted.trim().split('\n')[0].slice(0, 80));
        made.push(await createJob('', { ...opts, force_new: true, upload: path, name: pasted.trim().split('\n')[0].slice(0, 80) }));
      } else if (useFiles) {
        for (let i = 0; i < files.length; i++) {
          setSending({ i: i + 1, n: files.length });
          const path = await uploadPaper(files[i]);
          const j = await createJob('', { ...opts, force_new: true, upload: path, name: files[i].name });
          localPdfs.set(j.id, URL.createObjectURL(files[i]));   // kept in this browser only, so the paper can be read beside the video
          made.push(j);
        }
      } else {
        made.push(await createJob(input.trim(), { ...opts, force_new: existing.length > 0 }));
      }
    } catch (err) {
      const stopped = made.length ? ' ' + t('batchStopped').replace('{done}', String(made.length)).replace('{total}', String(files.length)) : '';
      if (err instanceof ApiError && (err.code === 'quota_guest' || err.code === 'quota_member')) { setLimit(err.code); refreshAccount(); if (made.length) setError(t('batchPartial').replace('{done}', String(made.length)).replace('{total}', String(files.length))); }
      else if (err instanceof ApiError && err.code === 'upload_failed') setError(t('uploadFailed') + stopped);
      else setError((err instanceof ApiError ? err.message : t('networkError')) + stopped);
    } finally {
      setSending(null);
      setSubmitting(false);
    }
    if (made.length) {
      const created = made[0];
      startedAt.current = created.created_at ? Date.parse(created.created_at) || Date.now() : Date.now();
      stageAt.current = { step: -2, at: Date.now() };
      setJob(created);
      setBatch(made.length > 1 ? made : []);
      if (useFiles) { setFiles((f) => f.slice(made.length)); setFileError(null); }
      if (tab === 'text') setPasted('');
      refreshAccount();
      setCached(!!created.cached || created.status === 'done');
      if (created.status !== 'done' && created.status !== 'failed') {
        try { localStorage.setItem(ACTIVE_JOB, created.id); } catch { /* private mode */ }
        timer.current = window.setTimeout(() => poll(created.id), POLL_MS);
      }
    }
  };

  const running = !!job && job.status !== 'done' && job.status !== 'failed';
  const stepKeys: StringKey[] = job?.langs === 'vi' ? ['stepRead', 'stepScript', 'stepCheck', 'stepVi'] : job?.langs === 'id' ? ['stepRead', 'stepScript', 'stepCheck', 'stepId'] : job?.langs === 'zh' ? ['stepRead', 'stepScript', 'stepCheck', 'stepZh'] : job?.langs === 'en' ? ['stepRead', 'stepScript', 'stepCheck', 'stepEn'] : STEP_KEYS;   // one language has one recording step
  const step = job ? Math.min(stepFromStage(job), stepKeys.length - 1) : -1;
  if (stageAt.current.step !== step) stageAt.current = { step, at: Date.now() };
  // progress: finished steps in full, plus the part of the current step that has probably passed (never past 90% of it)
  const STEP_SECS = stepSecs(job?.seconds ?? 36);
  const TOTAL_SECS = STEP_SECS.reduce((a, b) => a + b, 0);
  const doneSecs = STEP_SECS.slice(0, Math.max(step, 0)).reduce((a, b) => a + b, 0);
  // while sections are being recorded the stage text says how many are done, which is a better clock than elapsed time
  const secsDone = /sections ready:\s*(\d+) of (\d+)/i.exec(job?.stage ?? '');
  const byTime = step >= 0 ? Math.min((now - stageAt.current.at) / 1000, STEP_SECS[step] * 0.9) : 0;
  const inStep = secsDone && step === 3 ? Math.max(byTime, Math.min(STEP_SECS[3] * 0.9, (Number(secsDone[1]) / Number(secsDone[2])) * STEP_SECS[3])) : byTime;
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
      {!acctUser && <p className="sec-sub">{t('makeSub')}</p>}

      <div style={{ marginTop: 22 }}><AccountStrip /></div>
      <div className="card">
        <form onSubmit={submit} noValidate>
          <div className="src-tabs" role="tablist" aria-label={pick(uiLang, SRC.label)}>
            {(['link', 'text', 'file'] as const).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} disabled={submitting || running} onClick={() => setTab(k)}>{pick(uiLang, SRC[k])}</button>
            ))}
          </div>

          {tab === 'link' && (
            <label className="field" htmlFor="arxiv" style={{ marginTop: 14 }}>
              <span className="small muted">{pick(uiLang, SRC.linkHelp)}</span>
              <input id="arxiv" type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="https://arxiv.org/abs/1706.03762" autoComplete="off" spellCheck={false} />
            </label>
          )}
          {tab === 'text' && (
            <label className="field" style={{ marginTop: 14 }}>
              <span className="small muted">{pick(uiLang, SRC.textHelp)}</span>
              <textarea rows={7} value={pasted} maxLength={60000} onChange={(e) => setPasted(e.target.value)} placeholder={pick(uiLang, SRC.textPh)} disabled={submitting || running} />
              <span className="small muted" style={{ justifySelf: 'end' }}>{pasted.trim().length} / 60000{pasted.trim().length > 0 && pasted.trim().length < 300 ? ` · ${pick(uiLang, SRC.tooShort)}` : ''}</span>
            </label>
          )}
          {tab === 'file' && (
            <>
              <div
                className={`upload${dragging ? ' over' : ''}`}
                style={{ marginTop: 14 }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); if (!submitting && !running) addFiles(e.dataTransfer.files); }}
              >
                <input ref={fileRef} type="file" accept="application/pdf,.pdf,.txt,.md,text/plain" multiple hidden onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
                <button type="button" className="btn ghost small" disabled={submitting || running} onClick={() => fileRef.current?.click()}>{pick(uiLang, SRC.choose)}</button>
                <span className="small muted">{pick(uiLang, SRC.fileHelp).replace('{n}', String(MAX_PDF_FILES)).replace('{mb}', String(MB))}</span>
              </div>
              {fileError && <p className="small" role="alert" style={{ margin: '8px 0 0', color: 'var(--bad)' }}>{fileError}</p>}
              {files.length > 0 && (
                <ul className="filelist">
                  {files.map((f) => (
                    <li key={f.name + f.size}>
                      <span className="nm" title={f.name}>{f.name}</span>
                      <span className="sz">{f.size < 1024 * 1024 ? `${Math.max(1, Math.round(f.size / 1024))} KB` : `${(f.size / 1024 / 1024).toFixed(1)} MB`}</span>
                      <button type="button" aria-label={t('uploadRemove').replace('{name}', f.name)} disabled={submitting} onClick={() => setFiles(files.filter((x) => x !== f))}>×</button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <div className="make-opts">
            <label className="field">
              {t('optLangs')}
              <select value={vlang === 'both' ? 'en' : vlang} onChange={(e) => setVlang(e.target.value as VLang)} disabled={submitting || running}>
                <option value="en">English</option><option value="zh">中文</option><option value="vi">Tiếng Việt</option><option value="id">Bahasa Indonesia</option>
              </select>
            </label>
            <label className="field">
              {t('optLength')}
              <select value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} disabled={submitting || running}>
                {LENGTHS.map((n) => (<option key={n} value={n}>{t('min').replace('{n}', String(n / 60))}</option>))}
              </select>
            </label>
            <label className="field">
              {t('optTone')}
              <select value={tone} onChange={(e) => setTone(e.target.value as MakeOpts['tone'])} disabled={submitting || running}>
                {TONES.map((k) => (<option key={k} value={k}>{t(TONE_KEYS[k])}</option>))}
              </select>
            </label>
            <label className="field">
              {t('optVoice')}
              <select value={voice} onChange={(e) => setVoice(e.target.value as MakeOpts['voice'])} disabled={submitting || running}>
                <option value="female">{t('voiceFemale')}</option>
                <option value="male">{t('voiceMale')}</option>
              </select>
            </label>
          </div>
          <label className="field" style={{ marginTop: 12 }}>
            {t('optCustom')}
            <input type="text" value={custom} maxLength={300} onChange={(e) => setCustom(e.target.value)} placeholder={t('optCustomPh')} disabled={submitting || running} />
          </label>

          <div className="inter-pick">
            <button type="button" className="inter-switch" role="switch" aria-checked={inter} onClick={() => setInterOn(!inter)}>
              <span className="inter-knob" aria-hidden />
              <b>{pick(uiLang, { en: 'Interactive video', zh: '互动视频', vi: 'Video tương tác', id: 'Video interaktif' })}</b>
            </button>
            <span className="inter-free">{pick(uiLang, { en: 'Free to try', zh: '免费试用', vi: 'Dùng thử miễn phí', id: 'Gratis dicoba' })}</span>
            <span className="small muted">{pick(uiLang, { en: 'Answer a question inside the video after each part. Optional, you can also switch it on later.', zh: '每段结束后在视频里答题。可选，之后也可以再打开。', vi: 'Trả lời một câu hỏi ngay trong video sau mỗi phần. Tùy chọn, bật sau cũng được.', id: 'Jawab satu pertanyaan di dalam video setelah tiap bagian. Opsional, bisa dinyalakan nanti.' })}</span>
          </div>

          {seconds > 180 && (
            <p className="small muted" style={{ margin: '10px 0 0' }}>
              {t('longNote').replace('{m}', String(Math.round(stepSecs(seconds).reduce((x, y) => x + y, 0) / 60)))}
            </p>
          )}
          <button type="submit" className="btn primary make-go" disabled={submitting || running}>
            {submitting ? <span className="spin" aria-hidden /> : null}
            {sending ? t('uploadingN').replace('{i}', String(sending.i)).replace('{n}', String(sending.n)) : submitting ? t('makeSending') : tab === 'file' && files.length > 1 ? t('makeNBtn').replace('{n}', String(files.length)) : existing.length > 0 && tab === 'link' ? t('makeNewBtn') : t('makeBtn')}
          </button>
        </form>

        {batch.length > 1 && (
          <div className="note" style={{ marginTop: 16 }}>
            <strong>{t('batchTitle')}</strong>
            <div className="stack" style={{ gap: 8, marginTop: 10 }}>
              {batch.map((j) => (
                <div key={j.id} className="row between" style={{ gap: 10, alignItems: 'center' }}>
                  <span className="small" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title || 'PDF'}</span>
                  <span className="small muted">{j.status === 'done' ? t('batchDone') : j.status === 'failed' ? t('batchFailed') : t('batchMaking')}</span>
                  <button type="button" className="btn ghost small" disabled={job?.id === j.id} onClick={() => { clearTimer(); setError(null); setJob(j); setCached(j.status === 'done'); if (j.status !== 'done' && j.status !== 'failed') poll(j.id); }}>{t('batchShow')}</button>
                </div>
              ))}
            </div>
          </div>
        )}

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
              {stepKeys.map((key, i) => (
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
            <Studio job={job} lang={activeLang} localPdf={localPdfs.get(job.id) ?? null} />
            <ShareRow job={job} lang={activeLang} />
            {!job.videos?.en?.includes('/examples/') && <p className="small muted" style={{ margin: '8px 0 0' }}>{t('keepNote')}</p>}
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
