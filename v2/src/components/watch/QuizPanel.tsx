import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, Download, Loader2, Lock, RotateCcw, Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiError, quizAll, secText, type Job, type Quiz } from '@/lib/explainer';
import { useAccount } from '@/lib/account';
import { usePrefs, type Lang } from '@/lib/prefs';
import { dateFmt } from '@/lib/strings';
import { cn } from '@/lib/utils';

export type QItem = { q: Quiz; picked: number };
export type QLog = { parts: Record<number, QItem>; finals: { at: string; score: number; total: number; items: QItem[] }[] };

const S = {
  parts: { en: 'Questions inside the video', zh: '视频内的题目', vi: 'Câu hỏi trong video', id: 'Pertanyaan di dalam video' },
  none: { en: 'Turn on interactive mode and answer as you watch. Your answers appear here.', zh: '打开互动模式，边看边答，答案会显示在这里。', vi: 'Bật chế độ tương tác và trả lời trong lúc xem. Câu trả lời của bạn sẽ hiện ở đây.', id: 'Nyalakan mode interaktif dan jawab sambil menonton. Jawaban Anda muncul di sini.' },
  correct: { en: 'correct', zh: '答对', vi: 'đúng', id: 'benar' },
  yours: { en: 'Your answer', zh: '你的答案', vi: 'Bạn chọn', id: 'Jawaban Anda' },
  right: { en: 'Correct answer', zh: '正确答案', vi: 'Đáp án đúng', id: 'Jawaban benar' },
  reset: { en: 'Reset my answers', zh: '重置答案', vi: 'Làm lại từ đầu', id: 'Reset jawaban' },
  finalH: { en: 'Final quiz', zh: '期末测验', vi: 'Bài kiểm tra cuối', id: 'Kuis akhir' },
  finalP: { en: 'A short test on the whole video, with a score at the end.', zh: '覆盖整个视频的小测验，最后给出分数。', vi: 'Bài kiểm tra ngắn về cả video, có điểm ở cuối.', id: 'Tes singkat tentang seluruh video, dengan skor di akhir.' },
  start: { en: 'Start the final quiz', zh: '开始测验', vi: 'Bắt đầu', id: 'Mulai kuis akhir' },
  loading: { en: 'Writing your test…', zh: '正在出题…', vi: 'Đang soạn bài…', id: 'Menyusun tes…' },
  q: { en: 'Question {i} of {n}', zh: '第 {i} / {n} 题', vi: 'Câu {i}/{n}', id: 'Soal {i} dari {n}' },
  next: { en: 'Next question', zh: '下一题', vi: 'Câu tiếp', id: 'Soal berikutnya' },
  finish: { en: 'See my score', zh: '查看得分', vi: 'Xem điểm', id: 'Lihat skor' },
  again: { en: 'New final quiz', zh: '再做一份', vi: 'Làm bài mới', id: 'Kuis baru' },
  good: { en: 'Correct', zh: '答对了', vi: 'Chính xác', id: 'Benar' },
  bad: { en: 'Not quite', zh: '不太对', vi: 'Chưa đúng', id: 'Belum tepat' },
  history: { en: 'Past final quizzes', zh: '历史测验', vi: 'Các lần trước', id: 'Kuis sebelumnya' },
  packH: { en: 'Notes and flashcards', zh: '笔记和闪卡', vi: 'Ghi chú và thẻ ghi nhớ', id: 'Catatan dan kartu hafalan' },
  packP: { en: 'Notes for every part (.md) and flashcards for Anki (.csv). Included in Plus, Pro and Premium.', zh: '每部分的笔记（.md）和 Anki 闪卡（.csv）。Plus、Pro、Premium 均包含。', vi: 'Ghi chú cho từng phần (.md) và thẻ ghi nhớ cho Anki (.csv). Có trong Plus, Pro và Premium.', id: 'Catatan per bagian (.md) dan kartu hafalan untuk Anki (.csv). Termasuk di Plus, Pro, dan Premium.' },
  notes: { en: 'Notes', zh: '笔记', vi: 'Ghi chú', id: 'Catatan' },
  cards: { en: 'Flashcards', zh: '闪卡', vi: 'Thẻ ghi nhớ', id: 'Kartu hafalan' },
  plans: { en: 'See plans', zh: '查看套餐', vi: 'Xem các gói', id: 'Lihat paket' },
  signup: { en: 'Sign up free to take the final quiz.', zh: '免费注册后即可做期末测验。', vi: 'Đăng ký miễn phí để làm bài kiểm tra cuối.', id: 'Daftar gratis untuk kuis akhir.' },
};
const save = (name: string, text: string, type: string) => { const url = URL.createObjectURL(new Blob(['﻿' + text], { type: type + ';charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 2000); };
const csv = (x: string) => '"' + x.replace(/"/g, '""').replace(/\n/g, ' ') + '"';

export function Options({ quiz, picked, onPick }: { quiz: Quiz; picked?: number; onPick: (k: number) => void }) {
  const done = picked !== undefined;
  return (
    <div className="grid gap-2">
      {quiz.options.map((o, k) => {
        const right = done && k === quiz.answer, wrong = done && k === picked && k !== quiz.answer;
        return (
          <button key={k} type="button" disabled={done} onClick={() => onPick(k)}
            className={cn('flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition', !done && 'hover:border-primary hover:bg-accent', right && 'border-success bg-success/10', wrong && 'border-destructive bg-destructive/10', done && !right && !wrong && 'opacity-60')}>
            <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-bold', right && 'border-success bg-success text-white', wrong && 'border-destructive bg-destructive text-white')}>{right ? <Check className="h-3.5 w-3.5" /> : wrong ? <X className="h-3.5 w-3.5" /> : String.fromCharCode(65 + k)}</span>
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Review({ it }: { it: QItem }) {
  const { t } = usePrefs();
  const ok = it.picked === it.q.answer;
  return (
    <div className="grid gap-1 rounded-lg bg-muted/60 p-3 text-sm">
      <p className="font-medium">{it.q.question}</p>
      <p className={ok ? 'text-success' : 'text-destructive'}>{t(S.yours)}: {it.q.options[it.picked] ?? '-'}</p>
      {!ok && <p className="text-success">{t(S.right)}: {it.q.options[it.q.answer]}</p>}
      <p className="text-xs text-muted-foreground">{it.q.why}</p>
    </div>
  );
}

export function QuizPanel({ job, lang, log, onLog, onReset }: { job: Job; lang: Lang; log: QLog; onLog: (l: QLog) => void; onReset: () => void }) {
  const { lang: ui, t } = usePrefs();
  const { me, openAuth } = useAccount();
  const [open, setOpen] = useState<string | null>(null);
  const [run, setRun] = useState<null | { status: 'loading' | 'play' | 'done' | 'error'; items: Quiz[]; picks: number[]; idx: number; err?: string; signup?: boolean }>(null);
  const [packBusy, setPackBusy] = useState<'' | 'notes' | 'cards'>('');
  const hasPlan = !!me?.plan || !!me?.admin;
  const secs = job.sections ?? [];
  const answered = Object.entries(log.parts).map(([i, it]) => ({ i: Number(i), it })).sort((a, b) => a.i - b.i);
  const good = answered.filter((x) => x.it.picked === x.it.q.answer).length;

  const start = () => {
    setRun({ status: 'loading', items: [], picks: [], idx: 0 });
    quizAll({ job: job.id, lang, final: true }).then((items) => setRun({ status: 'play', items, picks: [], idx: 0 }))
      .catch((e) => setRun({ status: 'error', items: [], picks: [], idx: 0, err: e instanceof ApiError ? e.message : 'Error', signup: e instanceof ApiError && (e.code === 'quiz_signup' || e.code === 'login_to_ask') }));
  };
  const next = () => setRun((r) => {
    if (!r) return r;
    if (r.idx + 1 < r.items.length) return { ...r, idx: r.idx + 1 };
    const items = r.items.map((q, i) => ({ q, picked: r.picks[i] ?? -1 }));
    onLog({ ...log, finals: [{ at: new Date().toISOString(), score: items.filter((x) => x.picked === x.q.answer).length, total: items.length, items }, ...log.finals].slice(0, 20) });
    return { ...r, status: 'done' };
  });
  const pack = async (kind: 'notes' | 'cards') => {
    setPackBusy(kind);
    try {
      const qs = await quizAll({ job: job.id, lang }).catch(() => [] as Quiz[]);
      const slug = (job.title || 'video').replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 50);
      if (kind === 'notes') {
        save(`${slug}-notes.md`, [`# ${job.title ?? ''}`, '', ...secs.flatMap((x, i) => { const q = qs.find((z) => z.section === i); const take = secText(x, 'takeaway', lang); return [`## ${i + 1}. ${secText(x, 'title', lang)}`, '', secText(x, 'text', lang), '', take ? `**Key takeaway:** ${take}` : '', '', ...(q ? [`*Check yourself:* ${q.question}`, ...q.options.map((o, k) => (k === q.answer ? '- [x] ' : '- [ ] ') + o), '', q.why] : []), '']; })].join('\n'), 'text/markdown');
      } else {
        const rows = [...qs.map((q) => [q.question, `${q.options[q.answer]}. ${q.why}`]), ...secs.map((x) => [secText(x, 'title', lang), secText(x, 'takeaway', lang)]).filter((r) => r[1])];
        save(`${slug}-flashcards.csv`, rows.map((r) => r.map(csv).join(',')).join('\n'), 'text/csv');
      }
    } finally { setPackBusy(''); }
  };
  const cur = run?.status === 'play' ? run.items[run.idx] : null;
  const picked = run?.status === 'play' ? run.picks[run.idx] : undefined;
  const block = 'rounded-2xl border bg-card p-4';

  return (
    <div className="grid gap-4 p-4">
      <section className={block}>
        <div className="flex items-baseline justify-between"><p className="font-semibold">{t(S.parts)}</p>{answered.length > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-primary">{good}/{answered.length} {t(S.correct)}</span>}</div>
        {answered.length === 0 ? <p className="mt-1 text-sm text-muted-foreground">{t(S.none)}</p> : (
          <>
            <ul className="mt-3 grid gap-1.5">
              {answered.map(({ i, it }) => {
                const ok = it.picked === it.q.answer, key = `p${i}`;
                return (
                  <li key={i}>
                    <button type="button" onClick={() => setOpen(open === key ? null : key)} aria-expanded={open === key} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted">
                      <span className={cn('grid h-5 w-5 place-items-center rounded-full text-white', ok ? 'bg-success' : 'bg-destructive')}>{ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}</span>
                      <span className="flex-1 truncate">{secs[i] ? secText(secs[i], 'title', lang) : i + 1}</span>
                      <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition', open === key && 'rotate-180')} />
                    </button>
                    {open === key && <Review it={it} />}
                  </li>
                );
              })}
            </ul>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => { onReset(); setOpen(null); }}><RotateCcw className="mr-1.5 h-3.5 w-3.5" />{t(S.reset)}</Button>
          </>
        )}
      </section>

      <section className={block}>
        <p className="flex items-center gap-2 font-semibold"><Trophy className="h-4 w-4 text-lit" />{t(S.finalH)}</p>
        {!run && <><p className="mt-1 text-sm text-muted-foreground">{t(S.finalP)}</p><Button size="sm" className="mt-3" onClick={start}>{t(S.start)}</Button></>}
        {run?.status === 'loading' && <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t(S.loading)}</p>}
        {run?.status === 'error' && <div className="mt-2 text-sm"><p>{run.signup ? t(S.signup) : run.err}</p><div className="mt-2 flex gap-2">{run.signup && <Button size="sm" onClick={() => openAuth('register')}>OK</Button>}<Button size="sm" variant="ghost" onClick={() => setRun(null)}>×</Button></div></div>}
        {cur && run && (
          <div className="mt-3 grid gap-3">
            <p className="text-xs text-muted-foreground">{t(S.q).replace('{i}', String(run.idx + 1)).replace('{n}', String(run.items.length))}</p>
            <div className="h-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${((run.idx + (picked !== undefined ? 1 : 0)) / run.items.length) * 100}%` }} /></div>
            <p className="font-medium">{cur.question}</p>
            <Options quiz={cur} picked={picked} onPick={(k) => setRun((r) => (r && r.picks[r.idx] === undefined ? { ...r, picks: Object.assign([...r.picks], { [r.idx]: k }) } : r))} />
            {picked !== undefined && <><p className="text-sm"><b className={picked === cur.answer ? 'text-success' : 'text-destructive'}>{picked === cur.answer ? t(S.good) : t(S.bad)}.</b> {cur.why}</p><Button size="sm" onClick={next} className="w-fit">{run.idx + 1 < run.items.length ? t(S.next) : t(S.finish)}</Button></>}
          </div>
        )}
        {run?.status === 'done' && log.finals[0] && (
          <div className="mt-4 text-center" role="status">
            <p className="font-display text-4xl font-bold">{log.finals[0].score}<span className="text-xl text-muted-foreground"> / {log.finals[0].total}</span></p>
            <p className="text-sm font-semibold text-primary">{Math.round((log.finals[0].score / log.finals[0].total) * 100)}%</p>
            <div className="mt-3 flex justify-center gap-2"><Button size="sm" onClick={start}>{t(S.again)}</Button><Button size="sm" variant="ghost" onClick={() => setRun(null)}>×</Button></div>
          </div>
        )}
      </section>

      <section className={block}>
        <p className="font-semibold">{t(S.packH)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t(S.packP)}</p>
        {hasPlan ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={!!packBusy} onClick={() => pack('notes')}>{packBusy === 'notes' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}{t(S.notes)}</Button>
            <Button size="sm" variant="outline" disabled={!!packBusy} onClick={() => pack('cards')}>{packBusy === 'cards' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}{t(S.cards)}</Button>
          </div>
        ) : <Button asChild size="sm" className="mt-3"><Link to="/pricing"><Lock className="mr-1.5 h-3.5 w-3.5" />{t(S.plans)}</Link></Button>}
      </section>

      {log.finals.length > 0 && (
        <section className={block}>
          <p className="font-semibold">{t(S.history)}</p>
          <ul className="mt-2 grid gap-1">
            {log.finals.map((f, n) => {
              const key = `f${n}`;
              return (
                <li key={f.at}>
                  <button type="button" onClick={() => setOpen(open === key ? null : key)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted">
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-primary">{f.score}/{f.total}</span>
                    <span className="flex-1 text-muted-foreground">{dateFmt(f.at, ui, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition', open === key && 'rotate-180')} />
                  </button>
                  {open === key && <div className="grid gap-2 pb-2">{f.items.map((it, k) => <Review key={k} it={it} />)}</div>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
