import { useEffect, useMemo, useRef, useState } from 'react';
import type { Lang } from '@/lib/prefs';
import { ApiError, quizPart, secText, storageKind, videoUrl, type Job, type Quiz } from '@/lib/explainer';
import { useAccount } from '@/lib/account';
import { pick } from '@/lib/i18n_extra';
import { scrollToSection } from '@/components/Shell';
import { track } from '@/lib/account';
import Player, { type Chapter, type PlayerHandle } from '@/components/Player';
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

const IA = {"introH": {"en": "New: Interactive mode", "zh": "新功能：互动模式", "vi": "Mới: Chế độ tương tác", "id": "Baru: Mode interaktif"}, "introP": {"en": "Want to be sure you got it? Turn it on and the video pauses after each part with one question. It is off unless you choose it. Free to try; students get 3 months free.", "zh": "想确认自己真的懂了吗？打开后，每段结束视频会暂停并问你一个问题。默认关闭，由你决定。可免费试用；学生可免费使用 3 个月。", "vi": "Muốn chắc là mình hiểu? Bật lên và video sẽ dừng sau mỗi phần với một câu hỏi. Mặc định tắt, do bạn chọn. Dùng thử miễn phí; sinh viên được dùng miễn phí 3 tháng.", "id": "Ingin memastikan Anda paham? Nyalakan dan video berhenti setiap bagian dengan satu pertanyaan. Mati kecuali Anda memilihnya. Gratis dicoba; mahasiswa gratis 3 bulan."}, "introOn": {"en": "Turn it on", "zh": "打开", "vi": "Bật lên", "id": "Nyalakan"}, "introNo": {"en": "Not now", "zh": "暂不需要", "vi": "Để sau", "id": "Nanti saja"}, "mode": {"en": "Interactive mode", "zh": "互动模式", "vi": "Chế độ tương tác", "id": "Mode interaktif"}, "free": {"en": "Free to try", "zh": "免费试用", "vi": "Dùng thử miễn phí", "id": "Gratis dicoba"}, "hint": {"en": "The video stops after each part and asks you one question.", "zh": "每段结束后视频会暂停，并问你一个问题。", "vi": "Video dừng sau mỗi phần và hỏi bạn một câu.", "id": "Video berhenti setiap bagian dan menanyakan satu pertanyaan."}, "q": {"en": "Check yourself", "zh": "自测一下", "vi": "Tự kiểm tra", "id": "Uji diri Anda"}, "right": {"en": "Correct", "zh": "答对了", "vi": "Chính xác", "id": "Benar"}, "wrong": {"en": "Not quite", "zh": "不太对", "vi": "Chưa đúng", "id": "Belum tepat"}, "cont": {"en": "Continue the video", "zh": "继续播放", "vi": "Xem tiếp", "id": "Lanjutkan video"}, "more": {"en": "Explain this more", "zh": "再讲深一点", "vi": "Giải thích sâu hơn", "id": "Jelaskan lebih dalam"}, "replay": {"en": "Replay this part", "zh": "重看这一段", "vi": "Xem lại phần này", "id": "Putar ulang bagian ini"}, "loading": {"en": "Writing a question about this part…", "zh": "正在为这一段出题…", "vi": "Đang viết câu hỏi cho phần này…", "id": "Menulis pertanyaan untuk bagian ini…"}, "skip": {"en": "Skip", "zh": "跳过", "vi": "Bỏ qua", "id": "Lewati"}, "signup": {"en": "Sign up free", "zh": "免费注册", "vi": "Đăng ký miễn phí", "id": "Daftar gratis"}, "plus": {"en": "See Plus", "zh": "查看 Plus", "vi": "Xem gói Plus", "id": "Lihat Plus"}, "next": {"en": "Go further with this paper", "zh": "继续深入这篇论文", "vi": "Đi sâu hơn với bài báo này", "id": "Telusuri makalah ini lebih jauh"}, "nextRead": {"en": "Read it with cited answers", "zh": "带引用地阅读原文", "vi": "Đọc kèm câu trả lời có trích dẫn", "id": "Baca dengan jawaban bersitasi"}, "nextCheck": {"en": "Re-run it: does the number hold?", "zh": "重新运行：结果成立吗？", "vi": "Chạy lại: con số có đúng không?", "id": "Jalankan ulang: apakah angkanya benar?"}} as const;

/** The finished video as one workspace: the player with a chaptered timeline, the chapters with their explanations, and beside them the questions and the paper. */
export default function Studio({ job, lang, localPdf }: { job: Job; lang: Lang; localPdf?: string | null }) {
  const t = T[lang === 'zh' ? 'zh' : 'en'];
  const { user, openAuth } = useAccount();
  const src = videoUrl(job, lang);
  const player = useRef<PlayerHandle>(null);
  const [tab, setTab] = useState<'ask' | 'paper'>('ask');
  const [page, setPage] = useState<number | null>(null);
  const [pageKey, setPageKey] = useState(0);
  const [seed, setSeed] = useState<{ i: number; n: number } | null>(null);
  const [now, setNow] = useState(0);
  const [interactive, setInteractive] = useState(() => { try { return localStorage.getItem('pe-interactive') === '1'; } catch { return false; } });
  const [check, setCheck] = useState<{ i: number; status: 'loading' | 'ready' | 'error'; quiz?: Quiz; picked?: number; err?: string; code?: string } | null>(null);
  const checked = useRef<Set<number>>(new Set());
  const [intro, setIntro] = useState(() => { try { return localStorage.getItem('pe-inter-intro') !== '1'; } catch { return false; } });
  const closeIntro = () => { setIntro(false); try { localStorage.setItem('pe-inter-intro', '1'); } catch { /* private mode */ } };
  const top = useRef<HTMLDivElement>(null);

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


  const openCheck = (i: number) => {
    setCheck({ i, status: 'loading' });
    quizPart({ job: job.id, section: i, lang })
      .then((quiz) => setCheck((c) => (c && c.i === i ? { ...c, status: 'ready', quiz } : c)))
      .catch((e) => setCheck((c) => (c && c.i === i ? { ...c, status: 'error', err: e instanceof ApiError ? e.message : 'Could not load the question.', code: e instanceof ApiError ? e.code : undefined } : c)));
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
  useEffect(() => { checked.current = new Set(); setCheck(null); }, [job.id, lang]);

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
        <div className="inter-bar">
          <button type="button" className="inter-switch" role="switch" aria-checked={interactive} onClick={toggleInteractive}>
            <span className="inter-knob" aria-hidden />
            <b>{pick(lang, IA.mode)}</b>
          </button>
          <span className="inter-free">{pick(lang, IA.free)}</span>
          <span className="small muted">{pick(lang, IA.hint)}</span>
        </div>
        {check && (
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
                    return <button key={k} type="button" className={cls} disabled={done} onClick={() => setCheck({ ...check, picked: k })}><span>{String.fromCharCode(65 + k)}</span>{o}</button>;
                  })}
                </div>
                {check.picked !== undefined && (
                  <div className="inter-why">
                    <p><b>{check.picked === check.quiz.answer ? pick(lang, IA.right) : pick(lang, IA.wrong)}.</b> {check.quiz.why}</p>
                    <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="btn primary small" onClick={() => { setCheck(null); player.current?.play(); }}>{pick(lang, IA.cont)} →</button>
                      <button type="button" className="btn ghost small" onClick={() => { const i = check.i; setCheck(null); setSeed({ i, n: Date.now() }); setTab('ask'); }}>{pick(lang, IA.more)}</button>
                      <button type="button" className="btn ghost small" onClick={() => { const c = chapters[check.i]; setCheck(null); if (c) goVideo(c.start); }}>{pick(lang, IA.replay)}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
        </div>
        <div hidden={tab !== 'ask'}>
          <AskPanel job={job} lang={lang} seed={seed} onCite={cite} />
        </div>
        <div hidden={tab !== 'paper'}>
          <PaperPane job={job} lang={lang} page={page} pageKey={pageKey} localPdf={localPdf} />
        </div>
      </aside>
    </div>
  );
}
