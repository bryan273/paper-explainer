import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, FileText, FlaskConical, Lightbulb, Mic, Newspaper, Play, PlayCircle, Quote, StickyNote, Video } from 'lucide-react';
import { usePrefs, type Lang } from '@/lib/prefs';
import { COMMON, PRODUCT } from '@/lib/strings';
import { cn } from '@/lib/utils';

type T4 = Record<Lang, string>;
const ATT = 'https://bryan273.github.io/repro-suite/explainer/examples/6a21030a-b5f8-4c0e-977e-39090d7ebc70/poster0.jpg';

const L = {
  start: { en: 'Start here', zh: '从这里开始', vi: 'Bắt đầu ở đây', id: 'Mulai di sini' },
  example: { en: 'Example output', zh: '输出示例', vi: 'Ví dụ kết quả', id: 'Contoh hasil' },
  srcPaper: { en: 'Paper', zh: '论文', vi: 'Bài báo', id: 'Makalah' },
  srcArticle: { en: 'Article', zh: '文章', vi: 'Bài viết', id: 'Artikel' },
  srcNotes: { en: 'Your notes', zh: '你的笔记', vi: 'Ghi chú', id: 'Catatan' },
  srcLecture: { en: 'Lecture video', zh: '课程视频', vi: 'Video bài giảng', id: 'Video kuliah' },
  srcPodcast: { en: 'Podcast', zh: '播客', vi: 'Podcast', id: 'Podcast' },
  soonTag: { en: 'Coming soon', zh: '即将推出', vi: 'Sắp có', id: 'Segera hadir' },
  chapters: { en: 'Chapters', zh: '章节', vi: 'Chương', id: 'Bab' },
  q: { en: 'Why does a residual block help?', zh: '残差块为什么有用？', vi: 'Vì sao khối residual có ích?', id: 'Mengapa blok residual berguna?' },
  qa: { en: 'It lets the signal skip ahead', zh: '它让信号可以跳过', vi: 'Nó cho tín hiệu đi tắt', id: 'Sinyal bisa melompat' },
  source: { en: 'Source', zh: '原文', vi: 'Nguồn', id: 'Sumber' },
  answer: { en: 'Answer', zh: '回答', vi: 'Trả lời', id: 'Jawaban' },
  page: { en: 'Page 3', zh: '第 3 页', vi: 'Trang 3', id: 'Halaman 3' },
  deepQ: { en: 'Why not just make the network deeper?', zh: '为什么不直接把网络做得更深？', vi: 'Sao không cứ làm mạng sâu hơn?', id: 'Mengapa tidak langsung memperdalam jaringan?' },
  deepA: { en: 'Deeper plain networks got worse, not better: the training error itself went up. That is the problem residual learning fixes.', zh: '更深的普通网络反而更差：训练误差本身就上升了。残差学习解决的正是这个问题。', vi: 'Mạng thường sâu hơn lại tệ hơn: chính lỗi huấn luyện tăng lên. Đó là vấn đề học residual giải quyết.', id: 'Jaringan biasa yang lebih dalam justru lebih buruk: galat latihannya naik. Itu masalah yang diselesaikan residual learning.' },
  inDepth: { en: 'In-depth answer', zh: '深入回答', vi: 'Trả lời chuyên sâu', id: 'Jawaban mendalam' },
  quiz: { en: 'Final quiz 8 / 10', zh: '期末测验 8 / 10', vi: 'Bài cuối 8 / 10', id: 'Kuis akhir 8 / 10' },
  cards: { en: '12 flashcards', zh: '12 张闪卡', vi: '12 thẻ ghi nhớ', id: '12 kartu hafalan' },
  verdict: { en: 'Reproduced', zh: '已复现', vi: 'Đã tái lập', id: 'Tereproduksi' },
  steps: { en: ['Code downloaded and set up', 'Experiment run twice from scratch', 'Numbers compared with the paper'], zh: ['下载并配置代码', '从头运行实验两次', '与论文数字对比'], vi: ['Tải và cài đặt mã', 'Chạy thí nghiệm hai lần từ đầu', 'So sánh với số liệu trong bài'], id: ['Kode diunduh dan disiapkan', 'Eksperimen dijalankan dua kali dari awal', 'Angka dibandingkan dengan makalah'] } as Record<Lang, string[]>,
  notesTitle: { en: 'Week 4: gradient descent', zh: '第 4 周：梯度下降', vi: 'Tuần 4: gradient descent', id: 'Minggu 4: gradient descent' },
  notesLines: { en: ['learning rate too big: it overshoots', 'too small: it takes forever', 'try 0.1, then halve it'], zh: ['学习率太大：会冲过头', '太小：要等很久', '先试 0.1，再减半'], vi: ['learning rate quá lớn: vượt qua đích', 'quá nhỏ: rất lâu', 'thử 0.1 rồi giảm một nửa'], id: ['learning rate terlalu besar: melewati target', 'terlalu kecil: sangat lama', 'coba 0.1, lalu bagi dua'] } as Record<Lang, string[]>,
  articleHead: { en: 'Why the loss curve goes flat', zh: '为什么损失曲线会变平', vi: 'Vì sao đường loss đi ngang', id: 'Mengapa kurva loss mendatar' },
  articleBy: { en: 'Blog post, 8 min read', zh: '博客文章，阅读约 8 分钟', vi: 'Bài blog, đọc 8 phút', id: 'Artikel blog, baca 8 menit' },
  pasted: { en: 'Pasted text or .txt', zh: '粘贴文字或 .txt', vi: 'Văn bản dán hoặc .txt', id: 'Teks atau .txt' },
  webLink: { en: 'A web link', zh: '网页链接', vi: 'Liên kết web', id: 'Tautan web' },
  lecture: { en: 'Lecture 7: Backpropagation', zh: '第 7 讲：反向传播', vi: 'Bài 7: Lan truyền ngược', id: 'Kuliah 7: Backpropagation' },
  podcast: { en: 'Episode 42: How models learn', zh: '第 42 期：模型如何学习', vi: 'Tập 42: Mô hình học thế nào', id: 'Episode 42: Cara model belajar' },
};

type Src = 'paper' | 'article' | 'notes' | 'lecture' | 'podcast';
const SRCS: Src[] = ['paper', 'article', 'notes', 'lecture', 'podcast'];

function SourceMock({ k }: { k: Src }) {
  const { t, lang } = usePrefs();
  const lines = (n = 4) => (
    <div className="mt-3 grid gap-1.5" aria-hidden>
      {[100, 94, 82, 90, 60].slice(0, n).map((w, i) => <span key={i} className={cn('block h-1.5 rounded-full', i % 2 ? 'bg-lit/70' : 'bg-border')} style={{ width: `${w}%` }} />)}
    </div>
  );
  if (k === 'paper') {
    return (
      <div className="pl-pop h-full rounded-xl border bg-background p-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-primary"><FileText className="h-3.5 w-3.5" />arXiv:1512.03385 [cs.CV]</div>
        <p className="mt-2 font-display text-[15px] font-bold leading-snug">Deep Residual Learning for Image Recognition</p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun</p>
        {lines(3)}
        <div className="mt-3 flex h-14 items-end gap-1 rounded-lg bg-muted/70 p-2" aria-hidden>
          {[30, 44, 38, 62, 52, 78, 70].map((h, i) => <i key={i} className="block flex-1 rounded-sm bg-primary/60" style={{ height: `${h}%` }} />)}
        </div>
      </div>
    );
  }
  if (k === 'article') {
    return (
      <div className="pl-pop h-full overflow-hidden rounded-xl border bg-background">
        <div className="flex items-center gap-1.5 border-b bg-muted/60 px-3 py-2"><span className="h-2 w-2 rounded-full bg-border" /><span className="h-2 w-2 rounded-full bg-border" /><span className="ml-2 flex-1 truncate rounded-md bg-background px-2 py-0.5 text-[10.5px] text-muted-foreground"><Newspaper className="mr-1 inline h-3 w-3" />blog.example.com/loss-goes-flat</span></div>
        <div className="p-4">
          <p className="font-display text-[17px] font-bold leading-tight">{t(L.articleHead)}</p>
          <p className="mt-1 text-[11.5px] text-muted-foreground">{t(L.articleBy)}</p>
          <div className="mt-3 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-lit/30" aria-hidden />
          {lines(3)}
        </div>
      </div>
    );
  }
  if (k === 'notes') {
    return (
      <div className="pl-pop h-full rounded-xl border bg-[#fff8dc] p-4 text-[#3a3320] dark:bg-[#2a2614] dark:text-[#f1e8c4]" style={{ backgroundImage: 'repeating-linear-gradient(transparent 0 25px, rgba(120,100,40,.18) 25px 26px)' }}>
        <div className="flex items-center gap-2 text-[11px] font-semibold"><StickyNote className="h-3.5 w-3.5" />{t(L.pasted)}</div>
        <p className="mt-2 font-display text-[15px] font-bold">{t(L.notesTitle)}</p>
        <ul className="mt-2 grid gap-[7px] text-[13px]">{(L.notesLines[lang] ?? L.notesLines.en).map((x) => <li key={x}>• {x}</li>)}</ul>
      </div>
    );
  }
  if (k === 'lecture') {
    return (
      <div className="pl-pop h-full rounded-xl border bg-[#0d0d1a] p-3 text-white">
        <div className="relative grid aspect-video place-items-center rounded-lg bg-gradient-to-br from-[#26264a] to-[#12122a]">
          <Video className="absolute left-3 top-3 h-4 w-4 text-white/60" />
          <PlayCircle className="h-10 w-10 text-white/85" />
          <span className="absolute right-2 top-2 rounded-full bg-lit px-2 py-0.5 text-[10px] font-semibold text-[#12122a]">{t(L.soonTag)}</span>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-white/15"><div className="h-full w-[38%] rounded-full bg-primary" /></div>
        <p className="mt-2 text-[12.5px] font-medium">{t(L.lecture)}</p>
        <p className="text-[11px] text-white/55">48:12</p>
      </div>
    );
  }
  return (
    <div className="pl-pop h-full rounded-xl border bg-gradient-to-br from-primary/10 to-lit/10 p-4">
      <div className="flex items-center justify-between text-[11px] font-semibold text-primary"><span className="flex items-center gap-1.5"><Mic className="h-3.5 w-3.5" />Podcast</span><span className="rounded-full bg-lit px-2 py-0.5 text-[10px] text-[#12122a]">{t(L.soonTag)}</span></div>
      <p className="mt-3 font-display text-[15px] font-bold leading-snug">{t(L.podcast)}</p>
      <div className="pl-wave mt-4 flex h-14 items-center gap-[3px]" aria-hidden>
        {Array.from({ length: 28 }).map((_, i) => <i key={i} className="block flex-1 origin-center rounded-full bg-primary/70" style={{ height: `${28 + ((i * 37) % 62)}%`, animationDelay: `${(i % 7) * 0.12}s` }} />)}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">32:40</p>
    </div>
  );
}
function OutPreview({ i }: { i: number }) {
  const { t, lang } = usePrefs();
  if (i === 0) {
    return (
      <div className="pl-pop grid gap-3 sm:grid-cols-[1.1fr_1fr]">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
          <img src={ATT} alt="" className="h-full w-full object-cover opacity-90" loading="lazy" />
          <span className="absolute inset-0 grid place-items-center"><PlayCircle className="h-9 w-9 text-white drop-shadow" /></span>
          <div className="absolute inset-x-2 bottom-2 flex gap-1" aria-hidden>{[1, 1, 0, 0].map((d, k) => <span key={k} className={cn('h-1 flex-1 rounded-full', d ? 'bg-lit' : 'bg-white/40')} />)}</div>
        </div>
        <div className="rounded-lg bg-[#0d0d1a] p-3 text-white">
          <p className="text-[10.5px] text-white/55">2 / 4</p>
          <p className="mt-0.5 text-[12.5px] font-semibold leading-snug">{t(L.q)}</p>
          <span className="mt-2 flex items-center justify-between rounded-md border border-[#3ddc97] bg-[#3ddc97]/15 px-2 py-1 text-[11.5px]">{t(L.qa)}<Check className="h-3.5 w-3.5 text-[#3ddc97]" /></span>
        </div>
      </div>
    );
  }
  if (i === 1) {
    return (
      <div className="pl-pop grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border bg-background p-3">
          <p className="text-[10.5px] font-semibold text-muted-foreground">{t(L.source)}</p>
          <div className="mt-2 grid gap-1.5" aria-hidden><span className="h-1.5 w-full rounded-full bg-border" /><span className="h-1.5 w-[90%] rounded-full bg-lit/80" /><span className="h-1.5 w-[96%] rounded-full bg-lit/80" /><span className="h-1.5 w-[70%] rounded-full bg-border" /></div>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <p className="text-[10.5px] font-semibold text-muted-foreground">{t(L.answer)}</p>
          <p className="mt-1.5 flex gap-1.5 border-l-2 border-primary pl-2 text-[11.5px] italic text-muted-foreground"><Quote className="mt-0.5 h-3 w-3 shrink-0 text-primary" />“we explicitly let these layers fit a residual mapping”</p>
          <span className="mt-2 inline-flex rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-semibold text-primary">{t(L.page)}</span>
        </div>
      </div>
    );
  }
  if (i === 2) {
    return (
      <div className="pl-pop rounded-lg border bg-background p-3">
        <p className="text-[12.5px] font-semibold">{t(L.deepQ)}</p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground"><span className="mr-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">{t(L.inDepth)}</span>{t(L.deepA)}</p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium"><span className="rounded-full bg-accent px-2 py-0.5 text-primary">{t(L.quiz)}</span><span className="rounded-full bg-lit/25 px-2 py-0.5">{t(L.cards)}</span></div>
      </div>
    );
  }
  return (
    <div className="pl-pop rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2 text-[12.5px] font-semibold text-success"><span className="grid h-5 w-5 place-items-center rounded-full bg-success/15"><Check className="h-3 w-3" /></span>{t(L.verdict)}</div>
      <p className="mt-1 text-[12px] font-medium">Stochastic Voronoi Ensembles for Anomaly Detection</p>
      <ul className="mt-2 grid gap-1 text-[11.5px] text-muted-foreground">{(L.steps[lang] ?? L.steps.en).map((x) => <li key={x} className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success" />{x}</li>)}</ul>
    </div>
  );
}

export function Prism() {
  const { t } = usePrefs();
  const [src, setSrc] = useState<Src>('paper');
  const [out, setOut] = useState(0);
  const [hold, setHold] = useState(false);
  const picked = useRef(false);
  const col = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const [geo, setGeo] = useState<{ h: number; ys: number[] }>({ h: 0, ys: [] });

  const outs = [
    { icon: PlayCircle, h: t(PRODUCT.video), p: t(PRODUCT.videoP), to: '/app/new' },
    { icon: BookOpen, h: t(PRODUCT.text), p: t(PRODUCT.textP), to: '/app/read' },
    { icon: Lightbulb, h: t(PRODUCT.deep), p: t(PRODUCT.deepP), to: '/app/new' },
    { icon: FlaskConical, h: t(PRODUCT.repro), p: t(PRODUCT.reproP), to: '/app/check' },
  ];
  const labels: Record<Src, string> = { paper: t(L.srcPaper), article: t(L.srcArticle), notes: t(L.srcNotes), lecture: t(L.srcLecture), podcast: t(L.srcPodcast) };

  // while nobody is pointing at it, the output cards take turns, and the source changes after each full round
  useEffect(() => {
    if (hold) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off') return;
    const id = window.setTimeout(() => {
      const next = (out + 1) % outs.length;
      setOut(next);
      if (next === 0 && !picked.current) setSrc((s) => SRCS[(SRCS.indexOf(s) + 1) % SRCS.length]);
    }, 4200);
    return () => window.clearTimeout(id);
  }, [hold, out, outs.length]);

  const measure = useCallback(() => {
    const c = col.current; if (!c) return;
    const top = c.getBoundingClientRect().top;
    setGeo({ h: c.offsetHeight, ys: cards.current.map((el) => (el ? el.getBoundingClientRect().top - top + 30 : 0)) });
  }, []);
  useLayoutEffect(() => {
    measure();
    const id = window.setTimeout(measure, 380);
    window.addEventListener('resize', measure);
    return () => { window.clearTimeout(id); window.removeEventListener('resize', measure); };
  }, [out, measure, t]);

  const mid = geo.h / 2;
  return (
    <div className="pl-card relative mt-14 grid items-stretch gap-3 p-5 sm:p-7 lg:grid-cols-[0.9fr_130px_1.4fr]">
      <div className="flex flex-col">
        <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Source">
          {SRCS.map((k) => (
            <button key={k} type="button" aria-pressed={src === k} onClick={() => { picked.current = true; setSrc(k); }}
              className={cn('rounded-full border px-3 py-1.5 text-[13px] font-medium transition', src === k ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {labels[k]}{(k === 'lecture' || k === 'podcast') && <span className="ml-1 text-[10px] opacity-75">{t(COMMON.soon)}</span>}
            </button>
          ))}
        </div>
        <div className="min-h-[250px] flex-1" aria-live="polite" key={src}><SourceMock k={src} /></div>
      </div>
      <svg className="mx-auto hidden w-[130px] lg:block" height={geo.h || 300} viewBox={`0 0 130 ${geo.h || 300}`} aria-hidden>
        {geo.ys.map((y, i) => (
          <path key={i} d={`M8 ${mid} C 70 ${mid}, 64 ${y}, 128 ${y}`} fill="none" strokeLinecap="round"
            stroke={i === out ? 'hsl(var(--primary))' : 'hsl(var(--lit))'} strokeWidth={i === out ? 4 : 2.5} opacity={i === out ? 1 : 0.55} style={{ transition: 'all .35s ease' }} />
        ))}
        <circle cx="8" cy={mid} r="6" fill="hsl(var(--lit))" />
      </svg>
      <div className="mx-auto h-6 w-0.5 bg-gradient-to-b from-lit to-primary lg:hidden" aria-hidden />
      <div ref={col} className="grid content-center gap-2.5" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
        {outs.map((o, i) => {
          const on = out === i;
          return (
            <Link key={o.h} to={o.to} ref={(el) => { cards.current[i] = el; }} onMouseEnter={() => setOut(i)} onFocus={() => setOut(i)}
              className={cn('group block rounded-2xl border p-3.5 no-underline transition', on ? 'border-2 border-primary bg-accent' : 'hover:border-primary/60')}>
              <span className="grid grid-cols-[44px_1fr_auto] items-center gap-3">
                <span className={cn('grid h-11 w-11 place-items-center rounded-xl', on ? 'bg-primary text-primary-foreground' : 'bg-accent text-primary')}><o.icon className="h-5 w-5" /></span>
                <span className="min-w-0">
                  <span className="block font-display text-[15.5px] font-semibold text-foreground">{o.h}</span>
                  <span className="block text-[13px] leading-snug text-muted-foreground">{o.p}</span>
                </span>
                {i === 0 ? <span className="hidden rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground sm:inline">{t(L.start)}</span> : <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />}
              </span>
              <span className={cn('grid transition-[grid-template-rows] duration-300', on ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                <span className="overflow-hidden"><span className="block pt-3"><span className="mb-1.5 block text-[10.5px] font-semibold text-muted-foreground">{t(L.example)}</span>{on && <OutPreview i={i} />}</span></span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// one small picture for each of the five things the AI does
export function StepVisual({ i }: { i: number }) {
  const { t } = usePrefs();
  const box = 'relative mb-4 h-[104px] overflow-hidden rounded-xl border bg-muted/50 p-3';
  if (i === 0) {
    return (
      <div className={box} aria-hidden>
        <div className="grid gap-1.5"><span className="h-1.5 w-full rounded-full bg-border" /><span className="h-1.5 w-[85%] rounded-full bg-border" /><span className="h-1.5 w-[92%] rounded-full bg-border" /></div>
        <div className="mt-2 flex gap-2"><span className="h-9 flex-1 rounded-md border-2 border-primary/60 bg-primary/10" /><span className="h-9 flex-1 rounded-md border-2 border-lit bg-lit/15" /></div>
        <span className="pl-scan absolute inset-x-0 h-0.5 bg-primary/70 shadow-[0_0_10px_hsl(var(--primary))]" />
      </div>
    );
  }
  if (i === 1) {
    return (
      <div className={box} aria-hidden>
        <div className="grid gap-1"><span className="h-1 w-full rounded-full bg-border" /><span className="h-1 w-[90%] rounded-full bg-border" /><span className="h-1 w-[95%] rounded-full bg-border" /><span className="h-1 w-[70%] rounded-full bg-border" /></div>
        <div className="mt-2.5 grid gap-1 text-[9.5px] font-semibold">{[['Question', 'bg-primary/15 text-primary'], ['Method', 'bg-lit/25'], ['Result', 'bg-success/15 text-success']].map(([x, c]) => <span key={x} className={cn('w-fit rounded px-1.5 py-0.5', c)}>{x}</span>)}</div>
      </div>
    );
  }
  if (i === 2) {
    return (
      <div className={box} aria-hidden>
        <p className="text-[11.5px] leading-snug">{t({ en: 'Each block only learns a small change.', zh: '每个块只需学一个小变化。', vi: 'Mỗi khối chỉ học một thay đổi nhỏ.', id: 'Tiap blok hanya belajar perubahan kecil.' })}</p>
        <div className="mt-2.5 flex flex-wrap gap-1">{['EN', '中文', 'VI', 'ID'].map((x, k) => <span key={x} className={cn('rounded-full border px-1.5 py-0.5 text-[10px] font-semibold', k === 0 && 'border-primary bg-primary text-primary-foreground')}>{x}</span>)}</div>
        <div className="mt-1.5 flex gap-1 text-[10px] text-muted-foreground"><span>{t({ en: 'Beginner', zh: '入门', vi: 'Mới học', id: 'Pemula' })}</span><span>·</span><span className="font-semibold text-foreground">{t({ en: 'Advanced', zh: '进阶', vi: 'Nâng cao', id: 'Lanjut' })}</span></div>
      </div>
    );
  }
  if (i === 3) {
    return (
      <div className={cn(box, 'grid grid-cols-2 gap-1.5')} aria-hidden>
        {[[t({ en: 'Chapters', zh: '章节', vi: 'Chương', id: 'Bab' }), BookOpen], [t({ en: 'Script', zh: '讲稿', vi: 'Kịch bản', id: 'Naskah' }), FileText], [t({ en: 'Quiz', zh: '测验', vi: 'Kiểm tra', id: 'Kuis' }), CheckIcon], [t({ en: 'Cards', zh: '闪卡', vi: 'Thẻ', id: 'Kartu' }), Play]].map(([x, Ic]) => {
          const I = Ic as typeof Check;
          return <span key={x as string} className="flex items-center gap-1.5 rounded-md border bg-background px-2 text-[11px] font-medium"><I className="h-3.5 w-3.5 text-primary" />{x as string}</span>;
        })}
      </div>
    );
  }
  return (
    <div className={box} aria-hidden>
      <p className="flex gap-1.5 border-l-2 border-primary pl-2 text-[11px] italic text-muted-foreground"><Quote className="mt-0.5 h-3 w-3 shrink-0 text-primary" />“we explicitly let these layers fit a residual mapping”</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px] font-semibold"><span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-success"><Check className="h-3 w-3" />{t({ en: 'Word for word', zh: '逐字一致', vi: 'Đúng nguyên văn', id: 'Persis' })}</span><span className="rounded-full bg-accent px-2 py-0.5 text-primary">{t(L.page)}</span></div>
    </div>
  );
}
const CheckIcon = Check;
