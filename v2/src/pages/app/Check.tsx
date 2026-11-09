import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, CircleSlash, ExternalLink, FlaskConical, Loader2, MinusCircle, Search, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { accountApi, useAccount } from '@/lib/account';
import { parseArxivId } from '@/lib/explainer';
import { usePrefs, type Lang, pick, type Tr } from '@/lib/prefs';
import { COMMON, dateFmt } from '@/lib/strings';
import { cn } from '@/lib/utils';

const SB = 'https://wzdkroxbfrlqijbeiwpk.supabase.co/rest/v1';
const KEY = 'sb_publishable_kY0o-keKCbzmMkqOGU7ykw_t0ZXgAh_';
const OLD = 'https://bryan273.github.io/repro-suite/repro';

const C = {
  h: { en: 'Check a paper\'s results', zh: '检验论文结果', vi: 'Kiểm chứng kết quả bài báo', id: 'Cek hasil sebuah makalah' },
  s: { en: 'For papers with public code, an AI agent sets the code up, runs the experiment twice from scratch and compares the numbers with the paper. Every run is logged.', zh: '对公开代码的论文，AI 智能体会配置代码、从头运行实验两次，并与论文数字对比。每次运行都有完整记录。', vi: 'Với bài báo có mã công khai, một tác tử AI cài đặt mã, chạy thí nghiệm hai lần từ đầu và so sánh số liệu với bài báo. Mỗi lần chạy đều được ghi lại.', id: 'Untuk makalah dengan kode terbuka, agen AI menyiapkan kode, menjalankan eksperimen dua kali dari awal, dan membandingkan angkanya dengan makalah. Setiap proses dicatat.' },
  search: { en: 'Find a paper (title or arXiv id)', zh: '查找论文（标题或 arXiv 编号）', vi: 'Tìm bài báo (tiêu đề hoặc mã arXiv)', id: 'Cari makalah (judul atau id arXiv)' },
  checked: { en: 'Papers already checked', zh: '已检验的论文', vi: 'Các bài đã kiểm chứng', id: 'Makalah yang sudah dicek' },
  none: { en: 'No checked paper matches yet.', zh: '还没有匹配的已检验论文。', vi: 'Chưa có bài nào khớp.', id: 'Belum ada makalah yang cocok.' },
  log: { en: 'Full run log', zh: '完整运行记录', vi: 'Nhật ký chạy đầy đủ', id: 'Log lengkap' },
  reqH: { en: 'Ask for a check', zh: '申请检验', vi: 'Yêu cầu kiểm chứng', id: 'Minta pengecekan' },
  reqP: { en: 'Send the arXiv link of a paper with public code. We queue it, run it and email you the result. Most runs finish within a few days.', zh: '提交有公开代码论文的 arXiv 链接。我们会排队运行，并把结果发到你的邮箱，大多数在几天内完成。', vi: 'Gửi liên kết arXiv của bài báo có mã công khai. Chúng tôi xếp hàng, chạy và gửi kết quả qua email. Phần lớn xong trong vài ngày.', id: 'Kirim tautan arXiv makalah dengan kode terbuka. Kami antrekan, jalankan, dan kirim hasilnya lewat email. Sebagian besar selesai dalam beberapa hari.' },
  arxiv: { en: 'arXiv link or id', zh: 'arXiv 链接或编号', vi: 'Liên kết hoặc mã arXiv', id: 'Tautan atau id arXiv' },
  code: { en: 'Code link (GitHub), if you know it', zh: '代码链接（GitHub），如果知道', vi: 'Liên kết mã (GitHub), nếu biết', id: 'Tautan kode (GitHub), jika tahu' },
  email: { en: 'Email for the result', zh: '接收结果的邮箱', vi: 'Email nhận kết quả', id: 'Email untuk hasilnya' },
  send: { en: 'Send request', zh: '提交申请', vi: 'Gửi yêu cầu', id: 'Kirim permintaan' },
  sent: { en: 'Request received. We will email you when the run is done.', zh: '已收到申请，运行完成后会发邮件通知你。', vi: 'Đã nhận yêu cầu. Chúng tôi sẽ gửi email khi chạy xong.', id: 'Permintaan diterima. Kami kirim email saat selesai.' },
  bad: { en: 'That does not look like an arXiv link or id.', zh: '这看起来不像 arXiv 链接或编号。', vi: 'Đó không giống liên kết hoặc mã arXiv.', id: 'Itu tidak seperti tautan atau id arXiv.' },
  how: { en: 'How a check works', zh: '检验流程', vi: 'Cách kiểm chứng', id: 'Cara pengecekan' },
  howSteps: {
    en: ['The agent reads the paper and writes down which number to reproduce and how close counts as a match, before running anything.', 'It downloads the code and data and sets up the environment.', 'It runs the experiment twice from a clean start.', 'It compares the result with the paper and gives a verdict, with every command logged.'],
    zh: ['运行前，智能体先读论文，写下要复现的数字以及多接近算一致。', '下载代码和数据，配置环境。', '从干净状态运行实验两次。', '将结果与论文对比并给出结论，每条命令都有记录。'],
    vi: ['Trước khi chạy, tác tử đọc bài báo và ghi lại con số cần tái lập cùng mức sai lệch chấp nhận được.', 'Tải mã và dữ liệu, cài đặt môi trường.', 'Chạy thí nghiệm hai lần từ trạng thái sạch.', 'So sánh kết quả với bài báo và đưa ra kết luận, mọi lệnh đều được ghi lại.'],
    id: ['Sebelum menjalankan, agen membaca makalah dan mencatat angka yang akan direproduksi serta batas kecocokannya.', 'Mengunduh kode dan data, lalu menyiapkan lingkungan.', 'Menjalankan eksperimen dua kali dari awal yang bersih.', 'Membandingkan hasil dengan makalah dan memberi putusan, dengan setiap perintah tercatat.'],
  },
};
const VERDICT: Record<string, { l: Tr<string>; cls: string; icon: typeof CheckCircle2 }> = {
  reproduced: { l: { en: 'Reproduced', zh: '已复现', vi: 'Đã tái lập', id: 'Tereproduksi' }, cls: 'bg-success/15 text-success', icon: CheckCircle2 },
  partially_reproduced: { l: { en: 'Partly reproduced', zh: '部分复现', vi: 'Tái lập một phần', id: 'Sebagian tereproduksi' }, cls: 'bg-warning/15 text-warning', icon: MinusCircle },
  not_reproduced: { l: { en: 'Not reproduced', zh: '未能复现', vi: 'Không tái lập được', id: 'Tidak tereproduksi' }, cls: 'bg-destructive/12 text-destructive', icon: XCircle },
  could_not_run: { l: { en: 'Could not run', zh: '无法运行', vi: 'Không chạy được', id: 'Tidak bisa dijalankan' }, cls: 'bg-muted text-muted-foreground', icon: CircleSlash },
};
type Row = { key: string; title: string; paper: string; verdict: string | null; when?: string | null; href: string };

export default function Check() {
  const { lang, t } = usePrefs();
  const { user } = useAccount();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState('');
  const [f, setF] = useState({ arxiv: '', code: '', email: '' });
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle');
  const [err, setErr] = useState('');
  useEffect(() => {
    (async () => {
      const out: Row[] = [];
      try {
        const live = await (await fetch(`${SB}/repro_jobs?status=eq.done&select=id,arxiv_id,title,verdict,created_at&agent=not.in.(viewer-steps-1-3,recorded-run-seed)&order=updated_at.desc&limit=40`, { headers: { apikey: KEY } })).json() as { id: string; arxiv_id: string; title: string; verdict: string; created_at: string }[];
        for (const r of live) out.push({ key: r.id, title: r.title || r.arxiv_id, paper: r.arxiv_id, verdict: r.verdict, when: r.created_at, href: `${OLD}/index.html?job=${r.id}` });
      } catch { /* optional */ }
      try {
        const demos = await (await fetch(`${OLD}/demo-runs/index.json`)).json() as { id: string; title: string; paper: string; verdict: string }[];
        for (const d of demos) if (d.verdict) out.push({ key: d.id, title: d.title, paper: /^\d{4}\.\d{4,5}$/.test(d.paper) ? d.paper : '', verdict: d.verdict, when: `${d.id.slice(0, 4)}-${d.id.slice(4, 6)}-${d.id.slice(6, 8)}`, href: `${OLD}/index.html` });
      } catch { /* optional */ }
      setRows(out);
    })();
  }, []);
  const list = useMemo(() => (rows ?? []).filter((r) => !q.trim() || `${r.title} ${r.paper}`.toLowerCase().includes(q.trim().toLowerCase())), [rows, q]);
  const send = async (e: FormEvent) => {
    e.preventDefault(); setErr('');
    const id = parseArxivId(f.arxiv); if (!id) { setErr(t(C.bad)); return; }
    setState('busy');
    try { await accountApi('contact', { topic: 'repro', email: f.email || user?.username || '', message: `Reproduction request: arXiv ${id}${f.code ? `\nCode: ${f.code}` : ''}` }); setState('sent'); }
    catch (x) { setErr((x as Error).message === 'network' ? t(COMMON.network) : (x as Error).message); setState('idle'); }
  };

  return (
    <div className="mx-auto max-w-6xl py-8">
      <h1 className="font-display text-3xl font-bold">{t(C.h)}</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">{t(C.s)}</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">{t(C.checked)}</h2>
            <div data-g="search" className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(C.search)} className="pl-9" aria-label={t(C.search)} /></div>
          </div>
          <div data-g="list" className="mt-4 overflow-hidden rounded-2xl border">
            {rows === null ? <div className="p-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              : list.length === 0 ? <p className="p-6 text-sm text-muted-foreground">{t(C.none)}</p>
              : list.map((r, i) => {
                const v = VERDICT[r.verdict ?? ''] ?? VERDICT.could_not_run;
                return (
                  <div key={r.key} className={cn('flex flex-col gap-2 p-4 sm:flex-row sm:items-center', i && 'border-t')}>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.paper && <a href={`https://arxiv.org/abs/${r.paper}`} target="_blank" rel="noopener noreferrer" className="text-primary">arXiv {r.paper}</a>}{r.when && <> · {dateFmt(r.when, lang)}</>}</p>
                    </div>
                    <span className={cn('inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', v.cls)}><v.icon className="h-3.5 w-3.5" />{v.l[lang]}</span>
                    <a href={r.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium text-muted-foreground no-underline hover:text-primary">{t(C.log)}<ExternalLink className="h-3 w-3" /></a>
                  </div>
                );
              })}
          </div>
        </section>
        <aside className="grid content-start gap-5">
          <section data-g="request" className="pl-card p-5">
            <p className="flex items-center gap-2 font-display text-base font-semibold"><FlaskConical className="h-4 w-4 text-primary" />{t(C.reqH)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t(C.reqP)}</p>
            {state === 'sent' ? <p className="mt-4 rounded-lg bg-success/10 p-3 text-sm text-success">{t(C.sent)}</p> : (
              <form onSubmit={send} className="mt-4 grid gap-3">
                <Input required value={f.arxiv} onChange={(e) => setF({ ...f, arxiv: e.target.value })} placeholder={t(C.arxiv)} aria-label={t(C.arxiv)} />
                <Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder={t(C.code)} aria-label={t(C.code)} />
                {!user && <Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder={t(C.email)} aria-label={t(C.email)} />}
                {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
                <Button type="submit" disabled={state === 'busy'}>{state === 'busy' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{t(C.send)}</Button>
              </form>
            )}
          </section>
          <section className="pl-card p-5">
            <p className="font-semibold">{t(C.how)}</p>
            <ol className="mt-3 grid gap-3">{pick(lang, C.howSteps).map((x, i) => <li key={i} className="grid grid-cols-[24px_1fr] gap-2 text-sm"><span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-xs font-bold text-primary">{i + 1}</span><span className="text-muted-foreground">{x}</span></li>)}</ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
