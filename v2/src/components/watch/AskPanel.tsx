import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, BookOpen, Clock, Loader2, Quote, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiError, askPaper, getChat, secText, type AskBlock, type ChatMsg, type Job } from '@/lib/explainer';
import { read as readSettings } from '@/lib/settings';
import { useAccount } from '@/lib/account';
import { fill, usePrefs, type Lang, pick } from '@/lib/prefs';
import { cn } from '@/lib/utils';

const A = {
  title: { en: 'Ask about this video', zh: '就这个视频提问', vi: 'Hỏi về video này', id: 'Tanya tentang video ini' },
  sub: { en: 'Answers say where they come from: the source itself (with the page) or general background.', zh: '回答会注明来源：原文（附页码）或背景知识。', vi: 'Câu trả lời ghi rõ nguồn: từ chính tài liệu (kèm số trang) hoặc kiến thức nền.', id: 'Jawaban menyebut asalnya: dari sumber itu sendiri (dengan halaman) atau pengetahuan umum.' },
  fast: { en: 'Quick', zh: '快速', vi: 'Nhanh', id: 'Cepat' },
  deep: { en: 'In-depth', zh: '深入', vi: 'Chuyên sâu', id: 'Mendalam' },
  deepHint: { en: 'A stronger AI that thinks longer. Each month: 3 free, 30 with Plus, 80 with Pro, 160 with Premium.', zh: '更强、思考更久的 AI。每月：免费 3 次，Plus 30 次，Pro 80 次，Premium 160 次。', vi: 'AI mạnh hơn, suy nghĩ lâu hơn. Mỗi tháng: miễn phí 3, Plus 30, Pro 80, Premium 160.', id: 'AI yang lebih kuat dan berpikir lebih lama. Per bulan: gratis 3, Plus 30, Pro 80, Premium 160.' },
  deepLeft: { en: '{n} in-depth answers left this month', zh: '本月还剩 {n} 次深入回答', vi: 'Tháng này còn {n} câu trả lời chuyên sâu', id: 'Sisa {n} jawaban mendalam bulan ini' },
  both: { en: 'Source + background', zh: '原文 + 背景', vi: 'Nguồn + kiến thức nền', id: 'Sumber + latar' },
  only: { en: 'Source only', zh: '只看原文', vi: 'Chỉ từ nguồn', id: 'Hanya sumber' },
  ph: { en: 'Ask anything about it…', zh: '问任何问题…', vi: 'Hỏi bất cứ điều gì…', id: 'Tanyakan apa saja…' },
  starters: {
    en: ['What is the main idea, in one minute?', 'What problem does it solve and why does it matter?', 'What should I know before reading it?'],
    zh: ['一分钟讲清核心思想？', '它解决了什么问题，为什么重要？', '读之前我需要知道什么？'],
    vi: ['Ý chính là gì, trong một phút?', 'Nó giải quyết vấn đề gì và vì sao quan trọng?', 'Tôi nên biết gì trước khi đọc?'],
    id: ['Apa ide utamanya, dalam satu menit?', 'Masalah apa yang diselesaikan dan mengapa penting?', 'Apa yang perlu saya tahu sebelum membacanya?'],
  },
  fromSource: { en: 'From the source', zh: '来自原文', vi: 'Từ nguồn', id: 'Dari sumber' },
  general: { en: 'Background', zh: '背景知识', vi: 'Kiến thức nền', id: 'Latar' },
  unverified: { en: 'Quote not found in the source', zh: '原文中未找到这句引文', vi: 'Không tìm thấy trích dẫn trong nguồn', id: 'Kutipan tidak ditemukan di sumber' },
  page: { en: 'Page {n}', zh: '第 {n} 页', vi: 'Trang {n}', id: 'Halaman {n}' },
  at: { en: 'Video {t}', zh: '视频 {t}', vi: 'Video {t}', id: 'Video {t}' },
  steps: { en: ['Reading your question…', 'Searching the source…', 'Checking the quotes…', 'Writing the answer…'], zh: ['正在理解问题…', '正在原文中查找…', '正在核对引文…', '正在组织回答…'], vi: ['Đang đọc câu hỏi…', 'Đang tìm trong nguồn…', 'Đang kiểm tra trích dẫn…', 'Đang viết câu trả lời…'], id: ['Membaca pertanyaan…', 'Mencari di sumber…', 'Memeriksa kutipan…', 'Menulis jawaban…'] },
  still: { en: 'Still working, in-depth answers take a little longer…', zh: '仍在处理，深入回答需要多一点时间…', vi: 'Vẫn đang xử lý, câu trả lời chuyên sâu mất thêm chút thời gian…', id: 'Masih bekerja, jawaban mendalam butuh sedikit lebih lama…' },
  next: { en: 'Ask next', zh: '接着问', vi: 'Hỏi tiếp', id: 'Tanya berikutnya' },
  simpler: { en: 'I do not get the part "{t}". Explain it simply.', zh: '我没看懂“{t}”这部分，请讲简单点。', vi: 'Tôi chưa hiểu phần "{t}". Giải thích đơn giản giúp tôi.', id: 'Saya belum paham bagian "{t}". Jelaskan dengan sederhana.' },
  signup: { en: 'Sign up free', zh: '免费注册', vi: 'Đăng ký miễn phí', id: 'Daftar gratis' },
  plans: { en: 'See plans', zh: '查看套餐', vi: 'Xem các gói', id: 'Lihat paket' },
  useFast: { en: 'Answer quickly instead', zh: '改用快速回答', vi: 'Trả lời nhanh thay thế', id: 'Jawab cepat saja' },
  network: { en: 'Could not reach the server. Try again.', zh: '连不上服务器，请重试。', vi: 'Không kết nối được máy chủ. Thử lại nhé.', id: 'Tidak bisa terhubung ke server. Coba lagi.' },
  leftToday: { en: '{n} questions left today', zh: '今日还可提问 {n} 次', vi: 'Hôm nay còn {n} câu hỏi', id: 'Sisa {n} pertanyaan hari ini' },
};

function inline(text: string) {
  return text.split(/([*][*][^*]+[*][*]|[*][^*]+[*])/).map((p, i) => (p.length > 4 && p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p.length > 2 && p.startsWith('*') && p.endsWith('*') ? <em key={i}>{p.slice(1, -1)}</em> : p));
}
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function Block({ b, onCite }: { b: AskBlock; onCite?: (c: { page?: number; t?: number }) => void }) {
  const { t } = usePrefs();
  return (
    <div className="grid gap-2">
      <span className={cn('inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', b.kind === 'paper' ? 'bg-success/12 text-success' : b.kind === 'unverified' ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground')} style={b.kind === 'paper' ? { background: 'hsl(var(--success) / 0.12)' } : undefined}>
        {b.kind === 'paper' ? <BookOpen className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}{b.kind === 'paper' ? t(A.fromSource) : b.kind === 'unverified' ? t(A.unverified) : t(A.general)}
      </span>
      <p className="text-[14.5px] leading-relaxed">{inline(b.text)}</p>
      {b.quote && <blockquote className="flex gap-2 rounded-lg border-l-2 border-primary bg-muted/60 px-3 py-2 text-[13px] italic text-muted-foreground"><Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{b.quote}</blockquote>}
      {b.kind === 'paper' && onCite && (b.page || b.t !== undefined) && (
        <div className="flex flex-wrap gap-1.5">
          {b.page ? <button type="button" onClick={() => onCite({ page: b.page })} className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground">{fill(t(A.page), { n: b.page })}</button> : null}
          {b.t !== undefined ? <button type="button" onClick={() => onCite({ t: b.t })} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold hover:bg-foreground hover:text-background"><Clock className="h-3 w-3" />{fill(t(A.at), { t: mmss(b.t) })}</button> : null}
        </div>
      )}
    </div>
  );
}

export function AskPanel({ job, lang, seed, onCite }: { job: Job; lang: Lang; seed: { i: number; n: number } | null; onCite?: (c: { page?: number; t?: number }) => void }) {
  const { lang: ui, t } = usePrefs();
  const { openAuth, user } = useAccount();
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'plus' | 'paper'>(() => { try { return localStorage.getItem('pe-ask-mode') === 'paper' ? 'paper' : 'plus'; } catch { return 'plus'; } });
  const [model, setModel] = useState<'fast' | 'deep'>(() => { try { const v = localStorage.getItem('pe-ask-model'); return v === 'deep' || v === 'fast' ? v : readSettings().askModel; } catch { return 'fast'; } });
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const [phase, setPhase] = useState(0);
  const [err, setErr] = useState<{ text: string; code?: string } | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [deepLeft, setDeepLeft] = useState<number | null>(null);
  const last = useRef<{ q: string; opt: { intent?: 'ask' | 'simpler'; section?: number } } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const seen = useRef<number | null>(null);

  useEffect(() => { let alive = true; setMsgs([]); setErr(null); getChat(job.id).then((m) => alive && setMsgs(m)).catch(() => undefined); return () => { alive = false; }; }, [job.id]);
  useEffect(() => { const el = box.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs, busy]);

  const ask = async (q: string, opt: { intent?: 'ask' | 'simpler'; section?: number } = {}, force?: 'fast' | 'deep') => {
    if (busy) return;
    last.current = { q, opt };
    const useModel = force ?? model;
    const intent = opt.intent ?? 'ask';
    const text = q.trim();
    if (intent === 'ask' && text.length < 2) return;
    const sec = opt.section !== undefined ? job.sections?.[opt.section] : undefined;
    const shown = intent === 'simpler' ? fill(t(A.simpler), { t: sec ? secText(sec, 'title', lang) : '' }) : text;
    const history = msgs.slice(-6).map((m) => (m.role === 'user' ? { role: 'user' as const, text: m.text } : { role: 'ai' as const, text: m.blocks.map((b) => b.text).join(' ') }));
    setMsgs((m) => [...m, { role: 'user', text: shown, section: opt.section ?? null }]);
    setInput(''); setBusy(true); setErr(null); setPhase(0);
    const slowT = window.setTimeout(() => setSlow(true), 9000);
    const stepper = window.setInterval(() => setPhase((p) => Math.min(p + 1, 3)), 2200);
    try {
      const out = await askPaper({ job: job.id, q: text, mode, intent, model: useModel, section: opt.section, history, lang }) as { blocks: AskBlock[]; followups?: string[]; left?: number; deep_left?: number };
      setMsgs((m) => [...m, { role: 'ai', blocks: out.blocks, followups: out.followups }]);
      if (typeof out.left === 'number') setLeft(out.left);
      if (typeof out.deep_left === 'number') setDeepLeft(out.deep_left);
    } catch (e) {
      setErr({ text: e instanceof ApiError ? e.message : t(A.network), code: e instanceof ApiError ? e.code : undefined });
    } finally { window.clearTimeout(slowT); window.clearInterval(stepper); setSlow(false); setBusy(false); }
  };
  useEffect(() => { if (!seed || seen.current === seed.n) return; seen.current = seed.n; ask('', { intent: 'simpler', section: seed.i }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [seed]);

  const lastMsg = msgs[msgs.length - 1];
  const follow = lastMsg && lastMsg.role === 'ai' ? lastMsg.followups ?? [] : [];
  const pickModel = (m: 'fast' | 'deep') => { setModel(m); try { localStorage.setItem('pe-ask-model', m); } catch { /* private */ } };
  const pickMode = (m: 'plus' | 'paper') => { setMode(m); try { localStorage.setItem('pe-ask-mode', m); } catch { /* private */ } };
  const seg = (on: boolean) => cn('flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition', on ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground');

  return (
    <div className="flex h-full min-h-[460px] flex-col">
      <div className="border-b p-4">
        <p className="font-display text-base font-semibold">{t(A.title)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t(A.sub)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="inline-flex rounded-lg bg-muted p-0.5" role="radiogroup" aria-label="AI">
            <button type="button" role="radio" aria-checked={model === 'fast'} onClick={() => pickModel('fast')} className={seg(model === 'fast')}><Zap className="h-3.5 w-3.5" />{t(A.fast)}</button>
            <button type="button" role="radio" aria-checked={model === 'deep'} onClick={() => pickModel('deep')} className={seg(model === 'deep')}><Sparkles className="h-3.5 w-3.5 text-lit" />{t(A.deep)}</button>
          </div>
          <div className="inline-flex rounded-lg bg-muted p-0.5" role="radiogroup" aria-label="Sources">
            <button type="button" role="radio" aria-checked={mode === 'plus'} onClick={() => pickMode('plus')} className={seg(mode === 'plus')}>{t(A.both)}</button>
            <button type="button" role="radio" aria-checked={mode === 'paper'} onClick={() => pickMode('paper')} className={seg(mode === 'paper')}>{t(A.only)}</button>
          </div>
        </div>
        {model === 'deep' && <p className="mt-2 text-xs text-muted-foreground">{deepLeft !== null ? fill(t(A.deepLeft), { n: deepLeft }) : t(A.deepHint)}</p>}
      </div>
      <div ref={box} className="flex-1 space-y-4 overflow-y-auto p-4" role="log" aria-live="polite">
        {msgs.length === 0 && !busy && (
          <div className="grid gap-2">
            {pick(ui, A.starters).map((s) => <button key={s} type="button" onClick={() => ask(s)} className="rounded-xl border px-3 py-2.5 text-left text-sm hover:border-primary hover:bg-accent">{s}</button>)}
          </div>
        )}
        {msgs.map((m, i) => m.role === 'user'
          ? <div key={i} className="ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground">{m.text}</div>
          : <div key={i} className="grid gap-4 rounded-2xl border bg-card p-4">{m.blocks.map((b, k) => <Block key={k} b={b} onCite={onCite} />)}</div>)}
        {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><Loader2 className="h-4 w-4 animate-spin" />{slow ? t(A.still) : pick(ui, A.steps)[phase]}</p>}
        {follow.length > 0 && !busy && (
          <div><p className="mb-1.5 text-xs font-medium text-muted-foreground">{t(A.next)}</p>
            <div className="flex flex-wrap gap-1.5">{follow.map((f) => <button key={f} type="button" onClick={() => ask(f)} className="rounded-full border px-3 py-1.5 text-left text-[13px] hover:border-primary hover:text-primary">{f}</button>)}</div></div>
        )}
        {err && (
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm" role="alert">
            <p>{err.text}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(err.code === 'login_to_ask' || err.code === 'deep_signup' || err.code === 'ask_guest') && <Button size="sm" onClick={() => openAuth('register')}>{t(A.signup)}</Button>}
              {err.code === 'deep_premium' && <Button asChild size="sm"><Link to="/pricing">{t(A.plans)}</Link></Button>}
              {(err.code === 'deep_premium' || err.code === 'deep_signup') && <Button size="sm" variant="outline" onClick={() => { setErr(null); if (last.current) ask(last.current.q, last.current.opt, 'fast'); }}>{t(A.useFast)}</Button>}
            </div>
          </div>
        )}
      </div>
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); ask(input); }} className="border-t p-3">
        <div className="flex items-end gap-2 rounded-xl border bg-background p-1.5 focus-within:ring-2 focus-within:ring-ring">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }} rows={1} maxLength={600} placeholder={t(A.ph)} aria-label={t(A.ph)} disabled={busy}
            className="max-h-32 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" />
          <Button type="submit" size="icon" disabled={busy || input.trim().length < 2} aria-label="Send"><ArrowUp className="h-4 w-4" /></Button>
        </div>
        {left !== null && user && <p className="mt-1.5 text-[11px] text-muted-foreground">{fill(t(A.leftToday), { n: left })}</p>}
      </form>
    </div>
  );
}
