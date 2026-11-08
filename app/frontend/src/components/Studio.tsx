import { useEffect, useMemo, useRef, useState } from 'react';
import type { Lang } from '@/lib/prefs';
import { ApiError, askPaper, copyText, quizAll, quizPart, secText, storageKind, videoUrl, type Job, type Quiz } from '@/lib/explainer';
import { useAccount } from '@/lib/account';
import { pick } from '@/lib/i18n_extra';
import { scrollToSection } from '@/components/Shell';
import { track } from '@/lib/account';
import Player, { type Chapter, type PlayerHandle } from '@/components/Player';
import QuizPanel, { type QLog } from '@/components/QuizPanel';
import AskPanel from '@/components/AskPanel';
import PaperPane from '@/components/PaperPane';

const T = {
  en: {
    chapters: 'Chapters', ask: 'Ask', paper: 'Paper', play: 'Play from here', open: 'Read', close: 'Hide', takeaway: 'Takeaway', stuck: 'I do not get this part', jump: 'Jump to this part',
    count: '{n} parts', part: 'Part', prev: 'Previous', next: 'Next',
  },
  zh: {
    chapters: '章节', ask: '提问', paper: '原文', play: '从这里播放', open: '展开', close: '收起', takeaway: '要点', stuck: '这一段我没看懂', jump: '跳到这一段',
    count: '共 {n} 段', part: '第', prev: '上一段', next: '下一段',
  },
} as const;

const SH = {"btn": {"en": "Share this video", "zh": "分享这个视频", "vi": "Chia sẻ video này", "id": "Bagikan video ini"}, "done": {"en": "Link copied", "zh": "链接已复制", "vi": "Đã sao chép liên kết", "id": "Tautan disalin"}, "hint": {"en": "Anyone with the link can watch it and ask questions, for as long as the video is kept.", "zh": "任何拿到链接的人都可以观看并提问，在视频保留期内有效。", "vi": "Ai có liên kết đều xem và đặt câu hỏi được, chừng nào video còn được lưu.", "id": "Siapa pun yang punya tautan bisa menonton dan bertanya, selama video masih disimpan."}} as const;
const IA = {"quizTab": {"en": "Quiz", "zh": "测验", "vi": "Kiểm tra", "id": "Kuis"}, "exLoading": {"en": "Writing a simpler explanation…", "zh": "正在写更通俗的讲解…", "vi": "Đang viết lời giải thích dễ hiểu hơn…", "id": "Menulis penjelasan yang lebih sederhana…"}, "exErr": {"en": "Could not explain this right now.", "zh": "暂时无法讲解。", "vi": "Hiện chưa giải thích được.", "id": "Belum bisa menjelaskan sekarang."}, "prep": {"en": "Questions ready", "zh": "题目已准备", "vi": "Câu hỏi đã sẵn sàng", "id": "Pertanyaan siap"}, "introH": {"en": "New: Interactive mode", "zh": "新功能：互动模式", "vi": "Mới: Chế độ tương tác", "id": "Baru: Mode interaktif"}, "introP": {"en": "Want to be sure you got it? Turn it on and the video pauses after each part with one question. It is off unless you choose it. Free to try. Students and teachers get a free month of Plus.", "zh": "想确认自己真的懂了吗？打开后，每段结束视频会暂停并问你一个问题。默认关闭，由你决定。可免费试用。学生和教师可免费用 1 个月 Plus。", "vi": "Muốn chắc là mình hiểu? Bật lên và video sẽ dừng sau mỗi phần với một câu hỏi. Mặc định tắt, do bạn chọn. Dùng thử miễn phí. Sinh viên và giảng viên được tặng 1 tháng Plus.", "id": "Ingin memastikan Anda paham? Nyalakan dan video berhenti setiap bagian dengan satu pertanyaan. Mati kecuali Anda memilihnya. Gratis dicoba. Mahasiswa dan pengajar dapat 1 bulan Plus gratis."}, "introOn": {"en": "Turn it on", "zh": "打开", "vi": "Bật lên", "id": "Nyalakan"}, "introNo": {"en": "Not now", "zh": "暂不需要", "vi": "Để sau", "id": "Nanti saja"}, "mode": {"en": "Interactive mode", "zh": "互动模式", "vi": "Chế độ tương tác", "id": "Mode interaktif"}, "free": {"en": "Free to try", "zh": "免费试用", "vi": "Dùng thử miễn phí", "id": "Gratis dicoba"}, "hint": {"en": "The video stops after each part and asks you one question.", "zh": "每段结束后视频会暂停，并问你一个问题。", "vi": "Video dừng sau mỗi phần và hỏi bạn một câu.", "id": "Video berhenti setiap bagian dan menanyakan satu pertanyaan."}, "q": {"en": "Check yourself", "zh": "自测一下", "vi": "Tự kiểm tra", "id": "Uji diri Anda"}, "right": {"en": "Correct", "zh": "答对了", "vi": "Chính xác", "id": "Benar"}, "wrong": {"en": "Not quite", "zh": "不太对", "vi": "Chưa đúng", "id": "Belum tepat"}, "cont": {"en": "Continue the video", "zh": "继续播放", "vi": "Xem tiếp", "id": "Lanjutkan video"}, "more": {"en": "Explain this more", "zh": "再讲深一点", "vi": "Giải thích sâu hơn", "id": "Jelaskan lebih dalam"}, "replay": {"en": "Replay this part", "zh": "重看这一段", "vi": "Xem lại phần này", "id": "Putar ulang bagian ini"}, "loading": {"en": "Writing a question about this part…", "zh": "正在为这一段出题…", "vi": "Đang viết câu hỏi cho phần này…", "id": "Menulis pertanyaan untuk bagian ini…"}, "skip": {"en": "Skip", "zh": "跳过", "vi": "Bỏ qua", "id": "Lewati"}, "signup": {"en": "Sign up free", "zh": "免费注册", "vi": "Đăng ký miễn phí", "id": "Daftar gratis"}, "plus": {"en": "See Plus", "zh": "查看 Plus", "vi": "Xem gói Plus", "id": "Lihat Plus"}, "next": {"en": "Go further with this paper", "zh": "继续深入这篇论文", "vi": "Đi sâu hơn với bài báo này", "id": "Telusuri makalah ini lebih jauh"}, "nextRead": {"en": "Read it with cited answers", "zh": "带引用地阅读原文", "vi": "Đọc kèm câu trả lời có trích dẫn", "id": "Baca dengan jawaban bersitasi"}, "nextCheck": {"en": "Re-run it: does the number hold?", "zh": "重新运行：结果成立吗？", "vi": "Chạy lại: con số có đúng không?", "id": "Jalankan ulang: apakah angkanya benar?"}} as const;

/** The finished video as one workspace: the player with a chaptered timeline, the chapters with their explanations, and beside them the questions and the paper. */
export default function Studio({ job, lang, localPdf }: { job: Job; lang: Lang; localPdf?: string | null }) {
  const t = T[lang === 'zh' ? 'zh' : 'en'];
  const { user, openAuth } = useAccount();
  const src = videoUrl(job, lang);
  const player = useRef<PlayerHandle>(null);
  const [tab, setTab] = useState<'ask' | 'paper' | 'quiz'>('ask');
  const [page, setPage] = useState<number | null>(null);
  const [pageKey, setPageKey] = useState(0);
  const [seed, setSeed] = useState<{ i: number; n: number } | null>(null);
  const [now, setNow] = useState(0);
  const [interactive, setInteractive] = useState(() => { try { return localStorage.getItem('pe-interactive') === '1'; } catch { return false; } });
  const [check, setCheck] = useState<{ i: number; status: 'loading' | 'ready' | 'error'; quiz?: Quiz; picked?: number; err?: string; code?: string; explain?: { status: 'loading' | 'ready' | 'error'; text?: string; err?: string } } | null>(null);
  const quizCache = useRef<Map<number, Promise<Quiz>>>(new Map());
  const allRef = useRef<Promise<Quiz[]> | null>(null);
  const logKey = `pe-qlog:${job.id}:${lang}`;
  const readLog = (): QLog => { try { const v = JSON.parse(localStorage.getItem(logKey) ?? 'null') as QLog | null; return v && v.parts && v.finals ? v : { parts: {}, finals: [] }; } catch { return { parts: {}, finals: [] }; } };
  const [qlog, setQlogState] = useState<QLog>(readLog);
  const setQlog = (l: QLog) => { setQlogState(l); try { localStorage.setItem(logKey, JSON.stringify(l)); } catch { /* full */ } };
  const [prepared, setPrepared] = useState(0);
  const checked = useRef<Set<number>>(new Set());
  const [intro, setIntro] = useState(() => { try { return localStorage.getItem('pe-inter-intro') !== '1'; } catch { return false; } });
  const closeIntro = () => { setIntro(false); try { localStorage.setItem('pe-inter-intro', '1'); } catch { /* private mode */ } };
  const top = useRef<HTMLDivElement>(null);
  const [shared, setShared] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?job=${job.id}#make`;
    track('share_link', {});
    const nav = navigator as Navigator & { share?: (d: { title?: string; url: string }) => Promise<void> };
    if (nav.share && /Mobi|Android/i.test(navigator.userAgent)) { try { await nav.share({ title: job.title ?? 'Paperlit', url }); return; } catch { /* cancelled: fall through to copy */ } }
    if (await copyText(url)) { setShared(true); window.setTimeout(() => setShared(false), 2500); }
  };

  const chapters: Chapter[] = useMemo(
    () =>
      (job.sections ?? [])
        .map((s) => ({ start: s.clip?.[lang]?.[0] ?? s.clip?.en?.[0] ?? -1, end: s.clip?.[lang]?.[1] ?? s.clip?.en?.[1] ?? -1, title: secText(s, 'title', lang) }))
        .filter((c) => c.start >= 0 && c.end > c.start),
    [job.sections, lang],
  );
  const current = chapters.findIndex((c) => now >= c.start && now < c.end);
  const secs = job.sections ?? [];
  const poster = secs.find((s) => s.poster)?.poster ?? undefined;


  // questions are written as soon as interactive mode is on, so they are ready when the video reaches the end of each part
  const getAll = (): Promise<Quiz[]> => {
    if (!allRef.current) {
      const p = quizAll({ job: job.id, lang }).then((list) => { const by: Quiz[] = []; list.forEach((q) => { if (q.section !== undefined && by[q.section] === undefined) by[q.section] = q; }); return by; });
      allRef.current = p;
      p.then((by) => setPrepared(by.filter(Boolean).length)).catch(() => { allRef.current = null; });
    }
    return allRef.current;
  };
  const getQuiz = (i: number): Promise<Quiz> => {
    let pr = quizCache.current.get(i);
    if (!pr) {
      const key = `pe-quiz:${job.id}:${lang}:${i}`;
      let saved: Quiz | null = null;
      try { saved = JSON.parse(localStorage.getItem(key) ?? 'null') as Quiz | null; } catch { /* no cache */ }
      // the whole set is written in one go; a single question is only asked for when that did not work
      pr = saved ? Promise.resolve(saved) : getAll().then((by) => by[i] ?? quizPart({ job: job.id, section: i, lang })).catch(() => quizPart({ job: job.id, section: i, lang }));
      quizCache.current.set(i, pr);
      pr.then((q) => { try { localStorage.setItem(key, JSON.stringify(q)); } catch { /* full */ } }).catch(() => { quizCache.current.delete(i); });
    }
    return pr;
  };
  const openCheck = (i: number) => {
    setCheck({ i, status: 'loading' });
    getQuiz(i)
      .then((quiz) => setCheck((c) => (c && c.i === i ? { ...c, status: 'ready', quiz } : c)))
      .catch((e) => setCheck((c) => (c && c.i === i ? { ...c, status: 'error', err: e instanceof ApiError ? e.message : 'Could not load the question.', code: e instanceof ApiError ? e.code : undefined } : c)));
  };
  useEffect(() => {
    if (!interactive || chapters.length === 0) return;
    chapters.forEach((_, i) => { void getQuiz(i).catch(() => undefined); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, job.id, lang, chapters.length]);
  const explainMore = (i: number) => {
    setCheck((c) => (c ? { ...c, explain: { status: 'loading' } } : c));
    askPaper({ job: job.id, q: '', mode: 'plus', intent: 'simpler', model: 'fast', section: i, history: [], lang })
      .then((r) => setCheck((c) => (c && c.i === i ? { ...c, explain: { status: 'ready', text: r.blocks.map((x) => x.text).join('\n\n') } } : c)))
      .catch((e) => setCheck((c) => (c && c.i === i ? { ...c, explain: { status: 'error', err: e instanceof ApiError ? e.message : pick(lang, IA.exErr) } } : c)));
  };
  const toggleInteractive = () => {
    const next = !interactive;
    setInteractive(next);
    checked.current = new Set();
    setCheck(null);
    try { localStorage.setItem('pe-interactive', next ? '1' : '0'); } catch { /* private mode */ }
    track('interactive_toggle', { on: next });
  };
  // in interactive mode the video stops at the end of each part and asks one question about it
  useEffect(() => {
    if (!interactive || check) return;
    const i = chapters.findIndex((c, k) => now >= c.end - 0.3 && now < c.end + 0.9 && !checked.current.has(k));
    if (i < 0) return;
    checked.current.add(i);
    player.current?.pause();
    openCheck(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, interactive, check]);
  useEffect(() => { checked.current = new Set(); quizCache.current = new Map(); allRef.current = null; setPrepared(0); setCheck(null); setQlogState(readLog()); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [job.id, lang]);

  const goVideo = (time: number) => {
    player.current?.seek(time, true);
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const cite = (c: { page?: number; t?: number }) => {
    if (c.page) {
      setPage(c.page);
      setPageKey((k) => k + 1);
      setTab('paper');
    }
    if (c.t !== undefined) goVideo(c.t);
  };

  const overlay = check ? (
<div className="inter-card" role="dialog" aria-label={pick(lang, IA.q)}>
            <div className="row between"><b className="inter-h">✦ {pick(lang, IA.q)} · {check.i + 1}/{secs.length}</b>
              <button type="button" className="btn ghost small" onClick={() => { setCheck(null); player.current?.play(); }}>{pick(lang, IA.skip)}</button></div>
            {check.status === 'loading' && <p className="small muted" role="status"><span className="spin" aria-hidden /> {pick(lang, IA.loading)}</p>}
            {check.status === 'error' && (
              <div>
                <p style={{ margin: '0 0 10px' }}>{check.err}</p>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {(check.code === 'quiz_signup') && <button type="button" className="btn primary small" onClick={() => openAuth('register')}>{pick(lang, IA.signup)}</button>}
                  {(check.code === 'quiz_premium') && <button type="button" className="btn primary small" onClick={() => { setCheck(null); scrollToSection('pricing'); }}>{pick(lang, IA.plus)}</button>}
                  <button type="button" className="btn ghost small" onClick={() => { setCheck(null); player.current?.play(); }}>{pick(lang, IA.cont)}</button>
                </div>
              </div>
            )}
            {check.status === 'ready' && check.quiz && (
              <div>
                <p className="inter-q">{check.quiz.question}</p>
                <div className="inter-opts">
                  {check.quiz.options.map((o, k) => {
                    const done = check.picked !== undefined;
                    const cls = done ? (k === check.quiz!.answer ? 'ok' : k === check.picked ? 'bad' : '') : '';
                    return <button key={k} type="button" className={cls} disabled={done} onClick={() => { setCheck({ ...check, picked: k }); setQlog({ ...qlog, parts: { ...qlog.parts, [check.i]: { q: check.quiz!, picked: k } } }); }}><span>{String.fromCharCode(65 + k)}</span>{o}</button>;
                  })}
                </div>
                {check.picked !== undefined && (
                  <div className="inter-why">
                    <p><b>{check.picked === check.quiz.answer ? pick(lang, IA.right) : pick(lang, IA.wrong)}.</b> {check.quiz.why}</p>
                    {check.explain && (
                      <div className="inter-explain" role="status">
                        {check.explain.status === 'loading' && <p className="small muted"><span className="spin" aria-hidden /> {pick(lang, IA.exLoading)}</p>}
                        {check.explain.status === 'error' && <p className="small">{check.explain.err}</p>}
                        {check.explain.status === 'ready' && check.explain.text?.split('\n\n').map((t, k) => <p key={k}>{t}</p>)}
                      </div>
                    )}
                    <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="btn primary small" onClick={() => { setCheck(null); player.current?.play(); }}>{pick(lang, IA.cont)} →</button>
                      <button type="button" className="btn ghost small" disabled={check.explain?.status === 'loading'} onClick={() => explainMore(check.i)}>{pick(lang, IA.more)}</button>
                      <button type="button" className="btn ghost small" onClick={() => { const c = chapters[check.i]; setCheck(null); if (c) goVideo(c.start); }}>{pick(lang, IA.replay)}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
  ) : null;

  if (!src) return null;
  return (
    <div className="studio">
      <div className="studio-main" ref={top}>
        <Player
          ref={player}
          src={src}
          poster={poster}
          chapters={chapters}
          lang={lang === 'zh' ? 'zh' : 'en'}
          title={job.title ?? ''}
          onTime={setNow}
          overlay={overlay}
          onPlay={() => {
            const k = storageKind(src);
            if (k) track('video_play', { k });
          }}
        />


        {intro && !interactive && (
          <div className="inter-intro" role="note">
            <div><b>✦ {pick(lang, IA.introH)}</b><p>{pick(lang, IA.introP)}</p></div>
            <div className="row" style={{ gap: 8 }}>
              <button type="button" className="btn primary small" onClick={() => { closeIntro(); toggleInteractive(); }}>{pick(lang, IA.introOn)}</button>
              <button type="button" className="btn ghost small" onClick={closeIntro}>{pick(lang, IA.introNo)}</button>
            </div>
          </div>
        )}
        <div className="share-bar">
          <button type="button" className="btn primary small" onClick={share}>{shared ? `✓ ${pick(lang, SH.done)}` : `🔗 ${pick(lang, SH.btn)}`}</button>
          <span className="small muted">{pick(lang, SH.hint)}</span>
        </div>
        <div className="inter-bar">
          <button type="button" className="inter-switch" role="switch" aria-checked={interactive} onClick={toggleInteractive}>
            <span className="inter-knob" aria-hidden />
            <b>{pick(lang, IA.mode)}</b>
          </button>
          <span className="inter-free">{pick(lang, IA.free)}</span>
          {interactive && chapters.length > 0 && <span className="small muted" role="status">{prepared >= chapters.length ? '✓ ' : <span className="spin" aria-hidden />} {pick(lang, IA.prep)} {Math.min(prepared, chapters.length)}/{chapters.length}</span>}
          <span className="small muted">{pick(lang, IA.hint)}</span>
        </div>
        {secs.length > 0 && (() => {
          const idx = Math.max(0, current);
          const s = secs[idx];
          const c = chapters[idx];
          const title = secText(s, 'title', lang) || `${t.part} ${idx + 1}`;
          const text = secText(s, 'text', lang);
          const take = secText(s, 'takeaway', lang);
          const go = (i: number) => { const ch = chapters[i]; if (ch) goVideo(ch.start); };
          const frac = chapters.length > 1 ? (idx + (c && c.end > c.start ? Math.min(1, Math.max(0, (now - c.start) / (c.end - c.start))) : 0)) / chapters.length : 0;
          return (
            <div className="route">
              <ol className="route-line" aria-label={t.chapters} style={{ ['--p' as string]: `${Math.round(frac * 100)}%` }}>
                {secs.map((x, i) => {
                  const tt = secText(x, 'title', lang) || `${t.part} ${i + 1}`;
                  return (
                    <li key={x.i} className={i < idx ? 'past' : i === idx ? 'on' : ''}>
                      <button type="button" onClick={() => go(i)} disabled={!chapters[i]} aria-label={`${t.jump}: ${tt}`} aria-current={i === idx ? 'step' : undefined}>
                        <span className="route-dot">{i + 1}</span>
                        <span className="route-t">{tt}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="route-now" aria-live="polite">
                <div className="row between" style={{ gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <h3 className="sec" style={{ fontSize: 19, margin: 0 }}>{title}</h3>
                  <span className="small muted">{t.count.replace('{n}', String(secs.length))} · {idx + 1}/{secs.length}</span>
                </div>
                {text && <p>{text}</p>}
                {take && <p className="route-take"><b>{t.takeaway}: </b>{take}</p>}
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn ghost small" disabled={idx === 0} onClick={() => go(idx - 1)}>← {t.prev}</button>
                  <button type="button" className="btn ghost small" disabled={idx >= secs.length - 1} onClick={() => go(idx + 1)}>{t.next} →</button>
                  <button type="button" className="btn ghost small" onClick={() => { setSeed({ i: idx, n: Date.now() }); setTab('ask'); }}>{t.stuck}</button>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="next-steps">
          <b>{pick(lang, IA.next)}</b>
          <a href="https://bryan273.github.io/repro-suite/reading/">{pick(lang, IA.nextRead)}</a>
          <a href="https://bryan273.github.io/repro-suite/repro/index.html">{pick(lang, IA.nextCheck)}</a>
        </div>
      </div>

      <aside className="studio-side">
        <div className="tabs2" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'ask'} onClick={() => setTab('ask')}>{t.ask}</button>
          <button type="button" role="tab" aria-selected={tab === 'paper'} onClick={() => setTab('paper')}>{t.paper}</button>
          {(interactive || Object.keys(qlog.parts).length > 0 || qlog.finals.length > 0) && <button type="button" role="tab" aria-selected={tab === 'quiz'} onClick={() => setTab('quiz')}>{pick(lang, IA.quizTab)}</button>}
        </div>
        <div hidden={tab !== 'ask'}>
          <AskPanel job={job} lang={lang} seed={seed} onCite={cite} />
        </div>
        <div hidden={tab !== 'quiz'}>
          <QuizPanel job={job} lang={lang} log={qlog} onLog={setQlog} onReset={() => { setQlog({ ...qlog, parts: {} }); checked.current = new Set(); setCheck(null); }} />
        </div>
        <div hidden={tab !== 'paper'}>
          <PaperPane job={job} lang={lang} page={page} pageKey={pageKey} localPdf={localPdf} />
        </div>
      </aside>
    </div>
  );
}
