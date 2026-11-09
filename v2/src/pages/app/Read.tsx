import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, Check, CheckCircle2, Copy, ExternalLink, Loader2, Search, Square, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AgentError, emptyRun, parseArxivId, runAgent, type AgentRun } from '@/lib/read/agent';
import { getSessionByShareId, listRecentSessions, noteCount, saveSession, type SessionRecord } from '@/lib/read/sessions';
import { copyText } from '@/lib/explainer';
import { usePrefs } from '@/lib/prefs';
import { dateFmt } from '@/lib/strings';
import { cn } from '@/lib/utils';

const R = {
  h: { en: 'Read with cited answers', zh: '带引用地阅读', vi: 'Đọc kèm câu trả lời có trích dẫn', id: 'Membaca dengan jawaban bersitasi' },
  s: { en: 'Ask a research question. The AI plans, searches arXiv, reads the full papers and answers with numbered quotes you can check, then reviews its own answer.', zh: '提出一个研究问题。AI 会制定计划、搜索 arXiv、阅读全文，并用可核对的编号引文作答，最后自查答案。', vi: 'Đặt một câu hỏi nghiên cứu. AI lập kế hoạch, tìm trên arXiv, đọc toàn văn và trả lời kèm trích dẫn đánh số để bạn kiểm tra, rồi tự rà soát câu trả lời.', id: 'Ajukan pertanyaan riset. AI membuat rencana, mencari di arXiv, membaca makalah lengkap, dan menjawab dengan kutipan bernomor yang bisa Anda cek, lalu memeriksa jawabannya sendiri.' },
  goal: { en: 'Your question', zh: '你的问题', vi: 'Câu hỏi của bạn', id: 'Pertanyaan Anda' },
  goalPh: { en: 'e.g. How do vision transformers compare with CNNs on small datasets?', zh: '例如：在小数据集上，视觉 Transformer 和 CNN 相比如何？', vi: 'vd: Vision transformer so với CNN thế nào trên tập dữ liệu nhỏ?', id: 'mis. Bagaimana vision transformer dibanding CNN pada dataset kecil?' },
  paper: { en: 'Focus on one paper (optional)', zh: '指定一篇论文（可选）', vi: 'Tập trung vào một bài (không bắt buộc)', id: 'Fokus pada satu makalah (opsional)' },
  paperPh: { en: 'arXiv link or id, e.g. 2010.11929', zh: 'arXiv 链接或编号，如 2010.11929', vi: 'Liên kết hoặc mã arXiv, vd 2010.11929', id: 'Tautan atau id arXiv, mis. 2010.11929' },
  start: { en: 'Start reading', zh: '开始阅读', vi: 'Bắt đầu đọc', id: 'Mulai membaca' },
  stop: { en: 'Stop', zh: '停止', vi: 'Dừng', id: 'Berhenti' },
  needGoal: { en: 'Write a question first.', zh: '请先写下问题。', vi: 'Hãy viết câu hỏi trước.', id: 'Tulis pertanyaan dulu.' },
  badPaper: { en: 'That does not look like an arXiv link or id.', zh: '这看起来不像 arXiv 链接或编号。', vi: 'Đó không giống liên kết hoặc mã arXiv.', id: 'Itu tidak seperti tautan atau id arXiv.' },
  examples: { en: 'Try one', zh: '试试这些', vi: 'Thử một câu', id: 'Coba salah satu' },
  ex: {
    en: ['What makes a residual connection help very deep networks train?', 'How does retrieval-augmented generation reduce hallucination?', 'Which methods make transformers cheaper on long inputs?'],
    zh: ['残差连接为什么能帮助很深的网络训练？', '检索增强生成如何减少幻觉？', '有哪些方法能降低 Transformer 处理长输入的成本？'],
    vi: ['Vì sao kết nối residual giúp mạng rất sâu huấn luyện được?', 'Retrieval-augmented generation giảm ảo giác như thế nào?', 'Những phương pháp nào giúp transformer rẻ hơn với đầu vào dài?'],
    id: ['Mengapa koneksi residual membantu jaringan sangat dalam dilatih?', 'Bagaimana retrieval-augmented generation mengurangi halusinasi?', 'Metode apa yang membuat transformer lebih murah untuk input panjang?'],
  },
  plan: { en: 'Plan', zh: '计划', vi: 'Kế hoạch', id: 'Rencana' },
  steps: { en: 'What the AI is doing', zh: 'AI 正在做什么', vi: 'AI đang làm gì', id: 'Yang dilakukan AI' },
  answer: { en: 'Answer', zh: '回答', vi: 'Câu trả lời', id: 'Jawaban' },
  notes: { en: 'Quotes it used', zh: '使用的引文', vi: 'Các trích dẫn đã dùng', id: 'Kutipan yang dipakai' },
  check: { en: 'Self-check', zh: '自查', vi: 'Tự kiểm tra', id: 'Pemeriksaan mandiri' },
  full: { en: 'Matched in full text', zh: '全文中已匹配', vi: 'Khớp trong toàn văn', id: 'Cocok di teks lengkap' },
  abs: { en: 'Matched in abstract', zh: '摘要中已匹配', vi: 'Khớp trong tóm tắt', id: 'Cocok di abstrak' },
  unmatched: { en: 'Not matched', zh: '未匹配', vi: 'Không khớp', id: 'Tidak cocok' },
  share: { en: 'Copy share link', zh: '复制分享链接', vi: 'Sao chép liên kết chia sẻ', id: 'Salin tautan berbagi' },
  copied: { en: 'Copied', zh: '已复制', vi: 'Đã sao chép', id: 'Tersalin' },
  recent: { en: 'Recent questions from readers', zh: '最近的阅读问题', vi: 'Câu hỏi gần đây', id: 'Pertanyaan terbaru' },
  rate: { en: 'Too many questions right now. Wait a minute and try again.', zh: '当前提问太多，请稍等一分钟再试。', vi: 'Hiện có quá nhiều câu hỏi. Đợi một phút rồi thử lại.', id: 'Terlalu banyak pertanyaan saat ini. Tunggu sebentar lalu coba lagi.' },
  aborted: { en: 'Stopped.', zh: '已停止。', vi: 'Đã dừng.', id: 'Dihentikan.' },
  sharedGone: { en: 'This shared read was not found. It may have been removed.', zh: '找不到这个分享的精读，可能已被删除。', vi: 'Không tìm thấy lượt đọc được chia sẻ này. Có thể đã bị xóa.', id: 'Bacaan yang dibagikan ini tidak ditemukan. Mungkin sudah dihapus.' },
  sharedBy: { en: 'You are viewing a shared read. Ask your own question below.', zh: '你正在查看别人分享的精读。可以在下面提出你自己的问题。', vi: 'Bạn đang xem một lượt đọc được chia sẻ. Hãy đặt câu hỏi của riêng bạn bên dưới.', id: 'Anda sedang melihat bacaan yang dibagikan. Ajukan pertanyaan Anda sendiri di bawah.' },
  fail: { en: 'Something went wrong: {m}', zh: '出了点问题：{m}', vi: 'Có lỗi xảy ra: {m}', id: 'Terjadi kesalahan: {m}' },
  notes_n: { en: '{n} quotes', zh: '{n} 条引文', vi: '{n} trích dẫn', id: '{n} kutipan' },
};

export default function Read() {
  const { lang, t } = usePrefs();
  const { shareId: sharedId } = useParams<{ shareId: string }>();
  const [sharedState, setSharedState] = useState<'' | 'gone'>('');
  const [goal, setGoal] = useState('');
  const [paper, setPaper] = useState('');
  const [run, setRun] = useState<AgentRun | null>(null);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState('');
  const [shareId, setShareId] = useState('');
  const [copied, setCopied] = useState(false);
  const [recent, setRecent] = useState<SessionRecord[]>([]);
  const abort = useRef<AbortController | null>(null);
  const work = useRef<HTMLDivElement>(null);
  const loadRecent = useCallback(async () => { try { setRecent(await listRecentSessions(8)); } catch { /* optional */ } }, []);
  useEffect(() => { loadRecent(); return () => abort.current?.abort(); }, [loadRecent]);
  useEffect(() => {
    if (!sharedId) { setSharedState(''); return; }
    let alive = true;
    getSessionByShareId(sharedId).then((s) => {
      if (!alive) return;
      if (!s) { setSharedState('gone'); return; }
      setSharedState(''); setGoal(s.record.goal); setPaper(s.record.paper_id ?? ''); setRun(s.run); setShareId(sharedId);
    }).catch(() => alive && setSharedState('gone'));
    return () => { alive = false; };
  }, [sharedId]);

  const start = async (g0: string, p0: string) => {
    const g = g0.trim(); if (!g) { setErr(t(R.needGoal)); return; }
    let paperId: string | null = null;
    if (p0.trim()) { paperId = parseArxivId(p0); if (!paperId) { setErr(t(R.badPaper)); return; } }
    setErr(''); setShareId(''); setRunning(true); setRun(emptyRun());
    const c = new AbortController(); abort.current = c;
    requestAnimationFrame(() => work.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    let fin: AgentRun | null = null;
    try { fin = await runAgent({ goal: g, paperId, lang, signal: c.signal, onUpdate: setRun }); }
    catch (e) { setErr(e instanceof AgentError && e.kind === 'rate' ? t(R.rate) : e instanceof AgentError && e.kind === 'aborted' ? t(R.aborted) : t(R.fail).replace('{m}', e instanceof Error ? e.message : String(e))); }
    finally { setRunning(false); abort.current = null; }
    if (fin && fin.notes.length) { try { setShareId(await saveSession(fin, g, paperId, lang)); loadRecent(); } catch { /* sharing is optional */ } }
  };
  const share = async () => { const url = `${window.location.origin}${import.meta.env.BASE_URL}app/read/s/${shareId}`; if (await copyText(url)) { setCopied(true); window.setTimeout(() => setCopied(false), 2000); } };
  const verifLabel = (v: string) => (v === 'fulltext' ? t(R.full) : v === 'abstract' ? t(R.abs) : t(R.unmatched));
  const answer = (text: string) => text.split(/(\[\d+\])/).map((p, i) => /^\[\d+\]$/.test(p)
    ? <a key={i} href={`#note-${p.slice(1, -1)}`} className="mx-0.5 rounded bg-accent px-1 text-xs font-bold text-primary no-underline">{p.slice(1, -1)}</a> : <span key={i}>{p}</span>);

  return (
    <div className="mx-auto max-w-6xl py-8">
      <h1 className="font-display text-3xl font-bold">{t(R.h)}</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">{t(R.s)}</p>
      {sharedId && <p className={cn('mt-4 rounded-lg px-3 py-2 text-sm', sharedState === 'gone' ? 'bg-destructive/10 text-destructive' : 'bg-accent text-primary')} role="status">{t(sharedState === 'gone' ? R.sharedGone : R.sharedBy)}</p>}
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); start(goal, paper); }} className="pl-card grid gap-4 p-5 sm:p-6">
          <div className="grid gap-1.5"><label htmlFor="rd-goal" className="text-sm font-medium">{t(R.goal)}</label>
            <Textarea id="rd-goal" rows={3} maxLength={1000} value={goal} disabled={running} onChange={(e) => setGoal(e.target.value)} placeholder={t(R.goalPh)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); start(goal, paper); } }} /></div>
          <div className="grid gap-1.5"><label htmlFor="rd-paper" className="text-sm font-medium">{t(R.paper)}</label><Input id="rd-paper" value={paper} disabled={running} onChange={(e) => setPaper(e.target.value)} placeholder={t(R.paperPh)} /></div>
          {err && <p className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{err}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={running}>{running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}{t(R.start)}</Button>
            {running && <Button type="button" variant="outline" onClick={() => abort.current?.abort()}><Square className="mr-1.5 h-3.5 w-3.5" />{t(R.stop)}</Button>}
          </div>
        </form>
        <aside className="pl-card p-5">
          <p className="text-sm font-semibold">{t(R.examples)}</p>
          <div className="mt-3 grid gap-2">{(R.ex[lang] ?? R.ex.en).map((x) => <button key={x} type="button" disabled={running} onClick={() => { setGoal(x); setPaper(''); start(x, ''); }} className="rounded-lg border px-3 py-2 text-left text-sm hover:border-primary hover:bg-accent disabled:opacity-60">{x}</button>)}</div>
        </aside>
      </div>

      {run && (
        <div ref={work} className="mt-8 grid scroll-mt-20 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid content-start gap-6">
            <section className="pl-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-display text-lg font-semibold"><Sparkles className="h-4 w-4 text-lit" />{t(R.answer)}</p>
                {shareId && <Button size="sm" variant="outline" onClick={share}>{copied ? <Check className="mr-1.5 h-4 w-4 text-success" /> : <Copy className="mr-1.5 h-4 w-4" />}{copied ? t(R.copied) : t(R.share)}</Button>}
              </div>
              {run.answer ? <div className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">{answer(run.answer)}</div>
                : <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{run.stage}</p>}
            </section>
            {run.selfCheck && (
              <section className="pl-card p-5 sm:p-6">
                <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-success" />{t(R.check)}</p>
                <p className="mt-2 text-sm text-muted-foreground">{run.selfCheck.summary}</p>
                <ul className="mt-3 grid gap-2 text-sm">{run.selfCheck.items.map((it, i) => <li key={i} className="rounded-lg bg-muted/60 p-3"><p className="font-medium">{it.claim}</p><p className="mt-1 text-xs text-muted-foreground">{it.reason} {it.notes.map((n) => `[${n}]`).join(' ')}</p></li>)}</ul>
              </section>
            )}
            {run.notes.length > 0 && (
              <section className="pl-card p-5 sm:p-6">
                <p className="font-semibold">{t(R.notes)}</p>
                <ol className="mt-3 grid gap-3">
                  {run.notes.map((n) => (
                    <li key={n.n} id={`note-${n.n}`} className="scroll-mt-24 rounded-xl border p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2"><span className="rounded bg-accent px-1.5 text-xs font-bold text-primary">{n.n}</span>
                        <a href={`https://arxiv.org/abs/${n.paper_id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium text-primary">{run.papers[n.paper_id]?.title ?? n.paper_id}<ExternalLink className="h-3 w-3" /></a>
                        <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold', n.verification === 'unmatched' ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success')}>{verifLabel(n.verification)}</span></div>
                      <p className="mt-2">{n.text}</p>
                      {n.quote && <blockquote className="mt-2 border-l-2 border-primary bg-muted/60 px-3 py-2 text-[13px] italic text-muted-foreground">“{n.quote}”</blockquote>}
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
          <aside className="grid content-start gap-4 lg:sticky lg:top-20">
            {run.plan.length > 0 && <section className="pl-card p-5"><p className="text-sm font-semibold">{t(R.plan)}</p><ol className="mt-2 grid gap-1.5 text-sm text-muted-foreground">{run.plan.map((p, i) => <li key={i}>{i + 1}. {p}</li>)}</ol></section>}
            <section className="pl-card p-5">
              <p className="text-sm font-semibold">{t(R.steps)}</p>
              <ul className="mt-2 grid max-h-80 gap-2 overflow-y-auto text-xs">
                {run.events.map((e) => (
                  <li key={e.id} className="flex gap-2">{e.status === 'running' ? <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-primary" /> : e.status === 'error' ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" /> : <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />}
                    <span><b className="font-semibold">{e.name.replace(/_/g, ' ')}</b> <span className="text-muted-foreground">{e.preview}</span></span></li>
                ))}
                {running && run.events.length === 0 && <li className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />…</li>}
              </ul>
            </section>
          </aside>
        </div>
      )}

      {recent.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">{t(R.recent)}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {recent.map((r) => (
              <Link key={r.id} to={`/app/read/s/${r.share_id}`} className="pl-card flex gap-3 p-4 no-underline transition hover:border-primary">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0"><span className="line-clamp-2 block text-sm font-medium text-foreground">{r.goal}</span><span className="text-xs text-muted-foreground">{t(R.notes_n).replace('{n}', String(noteCount(r)))} · {dateFmt(r.created_at, lang, { day: 'numeric', month: 'short' })}</span></span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
