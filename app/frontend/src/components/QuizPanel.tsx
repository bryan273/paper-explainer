import { useState } from 'react';
import { useAccount } from '@/lib/account';
import { scrollToSection } from '@/components/Shell';
import { ApiError, quizAll, type Job, type Quiz } from '@/lib/explainer';
import { secText } from '@/lib/explainer';
import { pick } from '@/lib/i18n_extra';
import type { Lang } from '@/lib/prefs';

export type QItem = { q: Quiz; picked: number };
export type QLog = { parts: Record<number, QItem>; finals: { at: string; score: number; total: number; items: QItem[] }[] };

type L4 = { en: string; zh: string; vi: string; id: string };
const SP = {
  h: { en: 'Study pack', zh: '学习包', vi: 'Gói ôn tập', id: 'Paket belajar' } as L4,
  p: { en: 'Notes for every part and flashcards (Anki CSV) made from this video. Plus and Pro.', zh: '每个部分的笔记和闪卡（Anki CSV）。Plus 和 Pro 可用。', vi: 'Ghi chú cho từng phần và thẻ ghi nhớ (Anki CSV) từ video này. Dành cho Plus và Pro.', id: 'Catatan tiap bagian dan kartu belajar (Anki CSV) dari video ini. Untuk Plus dan Pro.' } as L4,
  notes: { en: 'Download notes (.md)', zh: '下载笔记 (.md)', vi: 'Tải ghi chú (.md)', id: 'Unduh catatan (.md)' } as L4,
  cards: { en: 'Download flashcards (.csv)', zh: '下载闪卡 (.csv)', vi: 'Tải thẻ ghi nhớ (.csv)', id: 'Unduh kartu belajar (.csv)' } as L4,
  lock: { en: 'See plans', zh: '查看套餐', vi: 'Xem các gói', id: 'Lihat paket' } as L4,
  busy: { en: 'Preparing…', zh: '准备中…', vi: 'Đang chuẩn bị…', id: 'Menyiapkan…' } as L4,
};
const save = (name: string, text: string, type: string) => {
  const url = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: type + ';charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
};
const csvCell = (x: string) => '"' + x.replace(/"/g, '""').replace(/\n/g, ' ') + '"';
const S = {
  title: { en: 'Your quiz', zh: '你的测验', vi: 'Bài kiểm tra của bạn', id: 'Kuis Anda' } as L4,
  parts: { en: 'Questions inside the video', zh: '视频内的题目', vi: 'Câu hỏi trong video', id: 'Pertanyaan di dalam video' } as L4,
  none: { en: 'Turn on interactive mode and answer the questions as you watch. They will be listed here.', zh: '打开互动模式，边看边答题，答过的题会列在这里。', vi: 'Bật chế độ tương tác và trả lời câu hỏi khi xem. Chúng sẽ được liệt kê ở đây.', id: 'Nyalakan mode interaktif dan jawab pertanyaan saat menonton. Semuanya akan tercatat di sini.' } as L4,
  score: { en: 'correct', zh: '答对', vi: 'đúng', id: 'benar' } as L4,
  review: { en: 'Review', zh: '回看', vi: 'Xem lại', id: 'Tinjau' } as L4,
  hide: { en: 'Hide', zh: '收起', vi: 'Ẩn', id: 'Tutup' } as L4,
  yours: { en: 'Your answer', zh: '你的答案', vi: 'Câu trả lời của bạn', id: 'Jawaban Anda' } as L4,
  right: { en: 'Correct answer', zh: '正确答案', vi: 'Đáp án đúng', id: 'Jawaban benar' } as L4,
  reset: { en: 'Reset my answers', zh: '重置我的答案', vi: 'Đặt lại câu trả lời', id: 'Reset jawaban saya' } as L4,
  resetHint: { en: 'The questions will appear again as you watch.', zh: '再次观看时会重新出题。', vi: 'Các câu hỏi sẽ hiện lại khi bạn xem.', id: 'Pertanyaan akan muncul lagi saat Anda menonton.' } as L4,
  finalH: { en: 'Final quiz', zh: '期末测验', vi: 'Bài kiểm tra cuối', id: 'Kuis akhir' } as L4,
  finalP: { en: 'Done watching? Take a short test on the whole video and get a score.', zh: '看完了？做一份覆盖整个视频的小测验，并得到分数。', vi: 'Xem xong rồi? Làm một bài kiểm tra ngắn về cả video và nhận điểm.', id: 'Sudah selesai menonton? Kerjakan tes singkat tentang seluruh video dan dapatkan skor.' } as L4,
  start: { en: 'Start the final quiz', zh: '开始测验', vi: 'Bắt đầu bài kiểm tra', id: 'Mulai kuis akhir' } as L4,
  loading: { en: 'Writing your test…', zh: '正在出题…', vi: 'Đang soạn bài kiểm tra…', id: 'Menyusun tes Anda…' } as L4,
  next: { en: 'Next question', zh: '下一题', vi: 'Câu tiếp', id: 'Pertanyaan berikutnya' } as L4,
  finish: { en: 'See my score', zh: '查看得分', vi: 'Xem điểm', id: 'Lihat skor' } as L4,
  again: { en: 'Take a new final quiz', zh: '再做一份新测验', vi: 'Làm bài kiểm tra mới', id: 'Kerjakan kuis baru' } as L4,
  history: { en: 'Past final quizzes', zh: '历史测验', vi: 'Các bài kiểm tra trước', id: 'Kuis akhir sebelumnya' } as L4,
  q: { en: 'Question', zh: '第', vi: 'Câu', id: 'Pertanyaan' } as L4,
  correct: { en: 'Correct', zh: '答对了', vi: 'Chính xác', id: 'Benar' } as L4,
  wrong: { en: 'Not quite', zh: '不太对', vi: 'Chưa đúng', id: 'Belum tepat' } as L4,
  signup: { en: 'Sign up free to take the final quiz.', zh: '免费注册后即可做期末测验。', vi: 'Đăng ký miễn phí để làm bài kiểm tra cuối.', id: 'Daftar gratis untuk mengerjakan kuis akhir.' } as L4,
};

function ItemReview({ it, lang }: { it: QItem; lang: Lang }) {
  const ok = it.picked === it.q.answer;
  return (
    <div className="qp-rev">
      <p className="qp-q">{it.q.question}</p>
      <p className={`qp-a ${ok ? 'ok' : 'bad'}`}>{pick(lang, S.yours)}: {it.q.options[it.picked]}</p>
      {!ok && <p className="qp-a ok">{pick(lang, S.right)}: {it.q.options[it.q.answer]}</p>}
      <p className="small muted" style={{ margin: 0 }}>{it.q.why}</p>
    </div>
  );
}

/** The quiz history of one video: every answer, a score, a reset, and a final test over the whole video that is scored at the end. */
export default function QuizPanel({ job, lang, log, onLog, onReset }: { job: Job; lang: Lang; log: QLog; onLog: (l: QLog) => void; onReset: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [run, setRun] = useState<null | { status: 'loading' | 'play' | 'done' | 'error'; items: Quiz[]; picks: number[]; idx: number; err?: string; signup?: boolean }>(null);
  const { me } = useAccount();
  const hasPlan = !!(me as unknown as { plan?: string | null } | null)?.plan;
  const [packBusy, setPackBusy] = useState<'' | 'notes' | 'cards'>('');
  const secs = job.sections ?? [];
  const answered = Object.entries(log.parts).map(([i, it]) => ({ i: Number(i), it })).sort((a, b) => a.i - b.i);
  const good = answered.filter((x) => x.it.picked === x.it.q.answer).length;

  const start = () => {
    setRun({ status: 'loading', items: [], picks: [], idx: 0 });
    quizAll({ job: job.id, lang, final: true })
      .then((items) => setRun({ status: 'play', items, picks: [], idx: 0 }))
      .catch((e) => setRun({ status: 'error', items: [], picks: [], idx: 0, err: e instanceof ApiError ? e.message : 'Could not write the test.', signup: e instanceof ApiError && e.code === 'quiz_signup' }));
  };
  const pickAnswer = (k: number) => setRun((r) => (r && r.status === 'play' && r.picks[r.idx] === undefined ? { ...r, picks: Object.assign([...r.picks], { [r.idx]: k }) } : r));
  const next = () => setRun((r) => {
    if (!r) return r;
    if (r.idx + 1 < r.items.length) return { ...r, idx: r.idx + 1 };
    const items: QItem[] = r.items.map((q, i) => ({ q, picked: r.picks[i] ?? -1 }));
    const score = items.filter((x) => x.picked === x.q.answer).length;
    onLog({ ...log, finals: [{ at: new Date().toISOString(), score, total: items.length, items }, ...log.finals].slice(0, 20) });
    return { ...r, status: 'done' };
  });

  const pack = async (kind: 'notes' | 'cards') => {
    setPackBusy(kind);
    try {
      const qs = await quizAll({ job: job.id, lang }).catch(() => [] as Quiz[]);
      const slug = (job.title || 'video').replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 50);
      if (kind === 'notes') {
        const md = [`# ${job.title ?? ''}`, '', ...secs.flatMap((x, i) => {
          const take = secText(x, 'takeaway', lang);
          const q = qs.find((z) => z.section === i);
          const quiz = q ? ['*Check yourself:* ' + q.question, ...q.options.map((o, k) => (k === q.answer ? '- [x] ' : '- [ ] ') + o), '', q.why] : [];
          return ['## ' + (i + 1) + '. ' + secText(x, 'title', lang), '', secText(x, 'text', lang), '', take ? '**Key takeaway:** ' + take : '', '', ...quiz, ''];
        })].join('\n');
        save(`${slug}-notes.md`, md, 'text/markdown');
      } else {
        const rows = [...qs.map((q) => [`${q.question}`, `${q.options[q.answer]}. ${q.why}`]), ...secs.map((x) => [secText(x, 'title', lang), secText(x, 'takeaway', lang)]).filter((r) => r[1])];
        save(`${slug}-flashcards.csv`, rows.map((r) => r.map(csvCell).join(',')).join('\n'), 'text/csv');
      }
    } finally { setPackBusy(''); }
  };

  const cur = run && run.status === 'play' ? run.items[run.idx] : null;
  const picked = run && run.status === 'play' ? run.picks[run.idx] : undefined;

  return (
    <div className="qp">
      <h3 className="qp-h">{pick(lang, S.title)}</h3>

      <section className="qp-sec">
        <div className="row between" style={{ alignItems: 'baseline' }}>
          <b>{pick(lang, S.parts)}</b>
          {answered.length > 0 && <span className="qp-score">{good}/{answered.length} {pick(lang, S.score)}</span>}
        </div>
        {answered.length === 0 ? <p className="small muted" style={{ margin: '6px 0 0' }}>{pick(lang, S.none)}</p> : (
          <>
            <ul className="qp-list">
              {answered.map(({ i, it }) => {
                const ok = it.picked === it.q.answer;
                const key = `p${i}`;
                return (
                  <li key={i}>
                    <button type="button" className="qp-row" onClick={() => setOpen(open === key ? null : key)} aria-expanded={open === key}>
                      <span className={`qp-mark ${ok ? 'ok' : 'bad'}`} aria-hidden>{ok ? '✓' : '✗'}</span>
                      <span className="qp-t">{secs[i] ? secText(secs[i], 'title', lang) : `${i + 1}`}</span>
                      <em>{open === key ? pick(lang, S.hide) : pick(lang, S.review)}</em>
                    </button>
                    {open === key && <ItemReview it={it} lang={lang} />}
                  </li>
                );
              })}
            </ul>
            <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="btn ghost small" onClick={() => { onReset(); setOpen(null); }}>{pick(lang, S.reset)}</button>
              <span className="small muted">{pick(lang, S.resetHint)}</span>
            </div>
          </>
        )}
      </section>

      <section className="qp-sec">
        <b>{pick(lang, S.finalH)}</b>
        {!run && <><p className="small muted" style={{ margin: '4px 0 10px' }}>{pick(lang, S.finalP)}</p><button type="button" className="btn primary small" onClick={start}>{pick(lang, S.start)}</button></>}
        {run?.status === 'loading' && <p className="small muted" role="status"><span className="spin" aria-hidden /> {pick(lang, S.loading)}</p>}
        {run?.status === 'error' && (
          <div>
            <p className="small" style={{ margin: '6px 0 10px' }}>{run.signup ? pick(lang, S.signup) : run.err}</p>
            <button type="button" className="btn ghost small" onClick={() => setRun(null)}>OK</button>
          </div>
        )}
        {cur && run && (
          <div className="qp-play">
            <p className="small muted" style={{ margin: '6px 0 0' }}>{pick(lang, S.q)} {run.idx + 1} / {run.items.length}</p>
            <p className="qp-q">{cur.question}</p>
            <div className="inter-opts">
              {cur.options.map((o, k) => {
                const done = picked !== undefined;
                const cls = done ? (k === cur.answer ? 'ok' : k === picked ? 'bad' : '') : '';
                return <button key={k} type="button" className={cls} disabled={done} onClick={() => pickAnswer(k)}><span>{String.fromCharCode(65 + k)}</span>{o}</button>;
              })}
            </div>
            {picked !== undefined && (
              <div className="inter-why">
                <p><b>{picked === cur.answer ? pick(lang, S.correct) : pick(lang, S.wrong)}.</b> {cur.why}</p>
                <button type="button" className="btn primary small" onClick={next}>{run.idx + 1 < run.items.length ? pick(lang, S.next) : pick(lang, S.finish)}</button>
              </div>
            )}
          </div>
        )}
        {run?.status === 'done' && (() => {
          const f = log.finals[0];
          return (
            <div className="qp-done" role="status">
              <div className="qp-big">{f ? `${f.score} / ${f.total}` : ''}</div>
              <div className="qp-pct">{f ? Math.round((f.score / f.total) * 100) : 0}%</div>
              <button type="button" className="btn primary small" onClick={start}>{pick(lang, S.again)}</button>{' '}
              <button type="button" className="btn ghost small" onClick={() => setRun(null)}>{pick(lang, S.hide)}</button>
            </div>
          );
        })()}
      </section>

      <section className="qp-sec">
        <b>{pick(lang, SP.h)}</b>
        <p className="small muted" style={{ margin: '2px 0 8px' }}>{pick(lang, SP.p)}</p>
        {hasPlan ? (
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn ghost small" disabled={!!packBusy} onClick={() => pack('notes')}>{packBusy === 'notes' ? pick(lang, SP.busy) : pick(lang, SP.notes)}</button>
            <button type="button" className="btn ghost small" disabled={!!packBusy} onClick={() => pack('cards')}>{packBusy === 'cards' ? pick(lang, SP.busy) : pick(lang, SP.cards)}</button>
          </div>
        ) : <button type="button" className="btn primary small" onClick={() => scrollToSection('pricing')}>{pick(lang, SP.lock)}</button>}
      </section>

      {log.finals.length > 0 && (
        <section className="qp-sec">
          <b>{pick(lang, S.history)}</b>
          <ul className="qp-list">
            {log.finals.map((f, n) => {
              const key = `f${n}`;
              return (
                <li key={f.at}>
                  <button type="button" className="qp-row" onClick={() => setOpen(open === key ? null : key)} aria-expanded={open === key}>
                    <span className="qp-pill">{f.score}/{f.total}</span>
                    <span className="qp-t">{new Date(f.at).toLocaleString()}</span>
                    <em>{open === key ? pick(lang, S.hide) : pick(lang, S.review)}</em>
                  </button>
                  {open === key && f.items.map((it, k) => <ItemReview key={k} it={it} lang={lang} />)}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
