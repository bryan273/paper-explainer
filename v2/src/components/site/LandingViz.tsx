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
  srcNotes: { en: 'Notes', zh: '笔记', vi: 'Ghi chú', id: 'Catatan' },
  srcLecture: { en: 'Lecture', zh: '课程', vi: 'Bài giảng', id: 'Kuliah' },
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

const SRC_ICON: Record<Src, typeof FileText> = { paper: FileText, article: Newspaper, notes: StickyNote, lecture: Video, podcast: Mic };
const READS: Record<Src, T4> = {
  paper: { en: 'Text, figures, tables and equations are all read.', zh: '正文、图、表和公式都会读。', vi: 'Đọc cả văn bản, hình, bảng và công thức.', id: 'Teks, gambar, tabel, dan rumus semuanya dibaca.' },
  article: { en: 'Any public web page: a blog, a news story, documentation.', zh: '任何公开网页：博客、新闻、文档。', vi: 'Mọi trang web công khai: blog, tin tức, tài liệu.', id: 'Halaman web publik apa pun: blog, berita, dokumentasi.' },
  notes: { en: 'Paste text or upload a .txt or PDF of your notes.', zh: '粘贴文字，或上传笔记的 .txt / PDF。', vi: 'Dán văn bản hoặc tải lên .txt, PDF ghi chú.', id: 'Tempel teks atau unggah catatan .txt atau PDF.' },
  lecture: { en: 'Recorded lectures, read from their transcript. Coming soon.', zh: '录制的课程，按字幕读取。即将推出。', vi: 'Bài giảng ghi hình, đọc từ bản chép lời. Sắp có.', id: 'Rekaman kuliah, dibaca dari transkripnya. Segera hadir.' },
  podcast: { en: 'Podcast episodes, read from their transcript. Coming soon.', zh: '播客节目，按文字稿读取。即将推出。', vi: 'Các tập podcast, đọc từ bản chép lời. Sắp có.', id: 'Episode podcast, dibaca dari transkripnya. Segera hadir.' },
};

function SourceMock({ k }: { k: Src }) {
  const { t, lang } = usePrefs();
  if (k === 'paper') {
    return (
      <div className="pl-pop flex h-full flex-col rounded-xl border bg-white p-5 text-[#1d1d2b] shadow-sm dark:bg-[#f4f3ee]">
        <p className="text-[10px] text-[#6b6b80]">arXiv:1512.03385v1 [cs.CV] 10 Dec 2015</p>
        <p className="mt-2 text-center font-serif text-[16px] font-bold leading-snug">Deep Residual Learning for Image Recognition</p>
        <p className="mt-1 text-center text-[11px] text-[#4b4b5c]">Kaiming He &nbsp; Xiangyu Zhang &nbsp; Shaoqing Ren &nbsp; Jian Sun</p>
        <p className="text-center text-[10.5px] italic text-[#6b6b80]">Microsoft Research</p>
        <p className="mt-3 text-center text-[11px] font-bold">Abstract</p>
        <p className="mt-1 font-serif text-[11px] leading-[1.55] text-[#2c2c3a]">
          Deeper neural networks are more difficult to train. <mark className="bg-[#ffe08a] px-0.5 text-inherit">We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.</mark> We explicitly reformulate the layers as learning residual functions with reference to the layer inputs…
        </p>
        <figure className="mt-3 rounded-md border border-[#e3e2dc] p-2">
          <svg viewBox="0 0 240 70" className="h-[70px] w-full" aria-hidden>
            {[0, 1].map((p) => (
              <g key={p} transform={`translate(${p * 124} 0)`}>
                <path d="M6 4 V62 H112" fill="none" stroke="#c9c8c0" strokeWidth="1" />
                <path d={p ? 'M8 14 C 30 40, 55 46, 110 50' : 'M8 12 C 30 38, 55 50, 110 56'} fill="none" stroke="#2f6fd6" strokeWidth="1.6" />
                <path d={p ? 'M8 12 C 30 30, 55 36, 110 40' : 'M8 10 C 30 30, 55 40, 110 46'} fill="none" stroke="#d6452f" strokeWidth="1.6" />
                <text x="88" y={p ? 36 : 42} fontSize="7" fill="#d6452f">56-layer</text>
                <text x="88" y={p ? 58 : 66} fontSize="7" fill="#2f6fd6">20-layer</text>
              </g>
            ))}
          </svg>
          <figcaption className="mt-1 text-[9.5px] leading-snug text-[#4b4b5c]">Figure 1. Training error (left) and test error (right) on CIFAR-10 with 20-layer and 56-layer “plain” networks.</figcaption>
        </figure>
        <p className="mt-3 text-[11px] font-bold">1. Introduction</p>
        <div className="mt-1.5 grid flex-1 content-start gap-1.5" aria-hidden>{[100, 96, 99, 88, 94, 70].map((w, i) => <span key={i} className="block h-1 rounded-full bg-[#dcdbd4]" style={{ width: `${w}%` }} />)}</div>
      </div>
    );
  }
  if (k === 'article') {
    return (
      <div className="pl-pop flex h-full flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="flex items-center gap-1.5 border-b bg-muted/60 px-3 py-2"><span className="h-2 w-2 rounded-full bg-[#ff5f57]" /><span className="h-2 w-2 rounded-full bg-[#febc2e]" /><span className="h-2 w-2 rounded-full bg-[#28c840]" /><span className="ml-2 flex-1 truncate rounded-md bg-background px-2 py-0.5 text-[10.5px] text-muted-foreground">blog.example.com/why-the-loss-goes-flat</span></div>
        <div className="flex flex-1 flex-col p-5">
          <p className="text-[11px] font-semibold text-primary">Machine learning</p>
          <p className="mt-1 font-display text-[19px] font-bold leading-tight">Why your loss curve suddenly goes flat</p>
          <p className="mt-1.5 text-[11px] text-muted-foreground">8 min read</p>
          <svg viewBox="0 0 300 90" className="mt-3 h-[90px] w-full rounded-lg bg-gradient-to-br from-primary/10 to-lit/20" aria-hidden>
            <path d="M14 14 C 60 70, 110 74, 160 76 S 260 77, 288 77" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" />
            <path d="M14 78 H288" stroke="hsl(var(--border))" />
            <circle cx="160" cy="76" r="4" fill="hsl(var(--lit))" />
          </svg>
          <p className="mt-3 text-[12px] leading-relaxed text-foreground/85">You start training, the loss drops fast, and then it stops moving. Before you blame the model, look at the learning rate: most plateaus come from a step size that is too small for the shape of the problem.</p>
          <blockquote className="mt-3 border-l-2 border-lit pl-3 text-[12px] italic text-muted-foreground">A flat loss is a signal, not a verdict.</blockquote>
          <p className="mt-4 font-display text-[14px] font-bold">Three things to check first</p>
          <ol className="mt-1.5 grid gap-1 text-[12px] text-foreground/85">{['The learning rate, and whether it decays too early', 'Whether the inputs are scaled', 'Whether a layer has stopped passing gradients'].map((x, i) => <li key={x}><span className="mr-1.5 font-semibold text-primary">{i + 1}.</span>{x}</li>)}</ol>
        </div>
      </div>
    );
  }
  if (k === 'notes') {
    return (
      <div className="pl-pop flex h-full flex-col rounded-xl border bg-[#fff8dc] p-5 text-[#3a3320] shadow-sm dark:bg-[#2a2614] dark:text-[#f1e8c4]" style={{ backgroundImage: 'repeating-linear-gradient(transparent 0 27px, rgba(120,100,40,.16) 27px 28px)' }}>
        <div className="flex items-center justify-between text-[11px]"><span className="font-semibold">ML 101</span><span className="opacity-70">Oct 14</span></div>
        <p className="mt-2 font-display text-[17px] font-bold">{t(L.notesTitle)}</p>
        <ul className="mt-2 grid gap-[9px] text-[13px]">{(L.notesLines[lang] ?? L.notesLines.en).map((x) => <li key={x}>• {x}</li>)}</ul>
        <p className="mt-3 w-fit rounded bg-white/60 px-2 py-1 font-mono text-[13px] dark:bg-black/20">w = w − η · ∇L(w)</p>
        <svg viewBox="0 0 200 80" className="mt-2 h-[86px] w-[75%]" aria-hidden>
          <path d="M10 10 C 50 80, 150 80, 190 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeDasharray="0" />
          <circle cx="44" cy="44" r="5" fill="#d6452f" />
          <path d="M50 48 Q 80 66 96 66" fill="none" stroke="#d6452f" strokeWidth="1.4" strokeDasharray="3 3" />
          <text x="104" y="78" fontSize="9" fill="currentColor">min</text>
        </svg>
        <p className="mt-2 text-[13px] font-semibold">{t({ en: 'Still not sure:', zh: '还没弄懂：', vi: 'Chưa rõ:', id: 'Masih bingung:' })}</p>
        <ul className="mt-1 grid gap-[9px] text-[13px]">{(lang === 'zh' ? ['动量为什么有用？', 'Adam 和 SGD 有什么区别？'] : lang === 'vi' ? ['Vì sao momentum có ích?', 'Adam khác SGD ở đâu?'] : lang === 'id' ? ['Mengapa momentum membantu?', 'Apa beda Adam dan SGD?'] : ['why does momentum help?', 'Adam vs SGD: what is the difference?']).map((x) => <li key={x}>? {x}</li>)}</ul>
        <p className="mt-auto pt-3 w-fit -rotate-2 rounded-full border-2 border-[#d6452f] px-3 py-0.5 text-[12px] font-semibold text-[#d6452f]">{t({ en: 'Quiz on Friday!', zh: '周五小测！', vi: 'Thứ Sáu kiểm tra!', id: 'Kuis hari Jumat!' })}</p>
      </div>
    );
  }
  if (k === 'lecture') {
    return (
      <div className="pl-pop flex h-full flex-col rounded-xl border bg-[#0d0d1a] p-3 text-white shadow-sm">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-[#f5f5f0] p-4 text-[#1d1d2b]">
          <p className="font-display text-[15px] font-bold">Backpropagation</p>
          <p className="mt-2 font-mono text-[12px]">∂L/∂w = ∂L/∂y · ∂y/∂w</p>
          <svg viewBox="0 0 200 50" className="mt-2 h-[44px] w-[75%]" aria-hidden>{[20, 80, 140].map((x, i) => <g key={x}><circle cx={x} cy="25" r="10" fill="none" stroke="#5b5bd6" strokeWidth="2" />{i < 2 && <path d={`M${x + 11} 25 H${x + 49}`} stroke="#5b5bd6" strokeWidth="2" />}</g>)}</svg>
          <span className="absolute right-2 top-2 rounded-full bg-lit px-2 py-0.5 text-[10px] font-semibold text-[#12122a]">{t(L.soonTag)}</span>
          <PlayCircle className="absolute bottom-2 right-2 h-8 w-8 text-[#12122a]/70" />
        </div>
        <div className="relative mt-3 h-1.5 rounded-full bg-white/15"><div className="h-full w-[38%] rounded-full bg-primary" />{[22, 48, 71].map((x) => <i key={x} className="absolute top-0 h-1.5 w-0.5 bg-[#0d0d1a]" style={{ left: `${x}%` }} />)}</div>
        <p className="mt-2 text-[12.5px] font-medium">{t(L.lecture)}<span className="ml-2 text-white/50">48:12</span></p>
        <div className="mt-2 grid flex-1 content-start gap-1.5 text-[11.5px] text-white/70">
          {[['12:04', 'So the loss depends on the weights through every layer.'], ['12:31', 'The chain rule lets us pass the gradient backwards.'], ['13:02', 'Each layer only needs its own local derivative.'], ['13:40', 'Let us work through a two-layer example on the board.'], ['14:15', 'Notice how the same numbers get reused on the way back.']].map(([ts, x]) => <p key={ts}><span className="mr-2 text-primary">{ts}</span>{x}</p>)}
          <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-white/10 pt-3 text-[11px]">{[['0:00', 'Recap'], ['12:04', 'Chain rule'], ['24:30', 'Worked example'], ['41:10', 'Summary']].map(([ts, x], i) => <span key={ts} className={cn('rounded-md px-2 py-1', i === 1 ? 'bg-white/15 text-white' : 'text-white/55')}><span className="mr-1.5 text-white/40">{ts}</span>{x}</span>)}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="pl-pop flex h-full flex-col rounded-xl border bg-background p-4 shadow-sm">
      <div className="flex gap-3">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-[#ff8a5b] text-white"><Mic className="h-7 w-7" /></span>
        <div className="min-w-0"><p className="font-display text-[15px] font-bold leading-snug">{t(L.podcast)}</p><p className="text-[11.5px] text-muted-foreground">32:40</p><span className="mt-1 inline-block rounded-full bg-lit px-2 py-0.5 text-[10px] font-semibold text-[#12122a]">{t(L.soonTag)}</span></div>
      </div>
      <div className="pl-wave mt-4 flex h-12 items-center gap-[3px]" aria-hidden>
        {Array.from({ length: 36 }).map((_, i) => <i key={i} className={cn('block flex-1 origin-center rounded-full', i < 14 ? 'bg-primary' : 'bg-primary/30')} style={{ height: `${28 + ((i * 37) % 62)}%`, animationDelay: `${(i % 7) * 0.12}s` }} />)}
      </div>
      <div className="mt-4 grid flex-1 content-start gap-2 text-[12px]">
        {[['Host', 'So what does a model actually learn when it trains?'], ['Guest', 'Think of it as turning a lot of small dials, a little at a time.'], ['Host', 'And the loss tells it which way to turn them?'], ['Guest', 'Exactly. The gradient says which way, the learning rate says how far.'], ['Host', 'What goes wrong when the step is too big?'], ['Guest', 'You jump over the valley and bounce around, sometimes forever.']].map(([who, x], i) => <p key={i}><b className={cn('mr-1.5', who === 'Host' ? 'text-primary' : 'text-[#d6452f]')}>{who}</b><span className="text-foreground/80">{x}</span></p>)}
      </div>
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
    <div className="pl-card relative mt-14 grid items-stretch gap-3 p-5 sm:p-7 lg:grid-cols-[1fr_110px_1.3fr]">
      <div className="flex min-w-0 flex-col">
        <div className="-mx-1 flex overflow-x-auto border-b [scrollbar-width:none]" role="tablist" aria-label="Source">
          {SRCS.map((k) => {
            const I = SRC_ICON[k]; const on = src === k; const soon = k === 'lecture' || k === 'podcast';
            return (
              <button key={k} type="button" role="tab" aria-selected={on} onClick={() => { picked.current = true; setSrc(k); }}
                className={cn('relative -mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 pb-2.5 pt-1 text-[13px] font-medium transition', on ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                <I className={cn('h-4 w-4', on && 'text-primary')} />{labels[k]}{soon && <sup className="text-[9.5px] font-semibold text-lit">{t(COMMON.soon)}</sup>}
              </button>
            );
          })}
        </div>
        <div className="mt-4 min-h-[440px] flex-1" role="tabpanel" aria-live="polite" key={src}><SourceMock k={src} /></div>
        <p className="mt-3 text-[12.5px] text-muted-foreground">{t(READS[src])}</p>
      </div>
      <svg className="mx-auto hidden w-[110px] self-center lg:block" height={geo.h || 300} viewBox={`0 0 110 ${geo.h || 300}`} aria-hidden>
        {geo.ys.map((y, i) => (
          <path key={i} d={`M8 ${mid} C 60 ${mid}, 54 ${y}, 108 ${y}`} fill="none" strokeLinecap="round"
            stroke={i === out ? 'hsl(var(--primary))' : 'hsl(var(--lit))'} strokeWidth={i === out ? 4 : 2.5} opacity={i === out ? 1 : 0.55} style={{ transition: 'all .35s ease' }} />
        ))}
        <circle cx="8" cy={mid} r="6" fill="hsl(var(--lit))" />
      </svg>
      <div className="mx-auto h-6 w-0.5 bg-gradient-to-b from-lit to-primary lg:hidden" aria-hidden />
      <div ref={col} className="grid min-w-0 content-center gap-2.5" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
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

// what the AI does to a source, in six steps, each with a picture made from a real paper (ResNet) or a real run
const STEPS: Record<Lang, [string, string][]> = {
  en: [
    ['Understand', 'Reads the whole source, figures and tables included, not just the abstract.'],
    ['Summarize', 'Keeps what matters: the question, the method and the result.'],
    ['Explain', 'At your level and in your language. Ask for it simpler or deeper at any time.'],
    ['Restructure', 'Chapters with a narrated script. Interactive videos stop at the end of each part with one question, and the explanation is ready the moment you answer.'],
    ['Check the quotes', 'Every answer shows the page it comes from, and each quote is matched word for word against the source.'],
    ['Check the results', 'For papers with public code, Paperlit re-runs the experiment and shows whether the reported number comes out again.'],
  ],
  zh: [
    ['理解', '读完整份资料，包括图和表，而不只是摘要。'],
    ['提炼', '留下关键：问题、方法和结果。'],
    ['讲解', '按你的水平，用你的语言。随时可以要求讲得更浅或更深。'],
    ['重组', '分章节并配解说。互动视频在每段结束时停下问一道题，你一作答，讲解立即出现。'],
    ['核对引文', '每个回答都标出出处页码，每句引文都与原文逐字比对。'],
    ['核对结果', '对公开代码的论文，Paperlit 会重新运行实验，看报告的数字能否再次得到。'],
  ],
  vi: [
    ['Hiểu', 'Đọc toàn bộ nguồn, kể cả hình và bảng, không chỉ phần tóm tắt.'],
    ['Tóm lược', 'Giữ điều quan trọng: câu hỏi, phương pháp và kết quả.'],
    ['Giải thích', 'Theo trình độ và ngôn ngữ của bạn. Có thể yêu cầu dễ hơn hoặc sâu hơn bất cứ lúc nào.'],
    ['Tái cấu trúc', 'Chia chương kèm lời thuyết minh. Video tương tác dừng cuối mỗi phần với một câu hỏi, lời giải thích có ngay khi bạn trả lời.'],
    ['Kiểm tra trích dẫn', 'Mọi câu trả lời ghi rõ trang nguồn, mọi trích dẫn được đối chiếu nguyên văn với nguồn.'],
    ['Kiểm tra kết quả', 'Với bài báo có mã công khai, Paperlit chạy lại thí nghiệm và cho thấy con số công bố có xuất hiện lại không.'],
  ],
  id: [
    ['Memahami', 'Membaca seluruh sumber, termasuk gambar dan tabel, bukan hanya abstraknya.'],
    ['Meringkas', 'Menyimpan yang penting: pertanyaan, metode, dan hasil.'],
    ['Menjelaskan', 'Sesuai tingkat dan bahasa Anda. Minta lebih sederhana atau lebih dalam kapan saja.'],
    ['Menyusun ulang', 'Bab dengan narasi. Video interaktif berhenti di akhir tiap bagian dengan satu pertanyaan, dan penjelasannya siap begitu Anda menjawab.'],
    ['Cek kutipan', 'Setiap jawaban menunjukkan halaman asalnya, dan setiap kutipan dicocokkan kata demi kata dengan sumber.'],
    ['Cek hasil', 'Untuk makalah dengan kode terbuka, Paperlit menjalankan ulang eksperimen dan menunjukkan apakah angka yang dilaporkan muncul lagi.'],
  ],
};

const S = {
  read: { en: 'Read', zh: '已读取', vi: 'Đã đọc', id: 'Dibaca' },
  q: { en: 'Question', zh: '问题', vi: 'Câu hỏi', id: 'Pertanyaan' },
  m: { en: 'Method', zh: '方法', vi: 'Phương pháp', id: 'Metode' },
  r: { en: 'Result', zh: '结果', vi: 'Kết quả', id: 'Hasil' },
  qT: { en: 'Why do deeper networks train worse, not better?', zh: '为什么更深的网络反而训练得更差？', vi: 'Vì sao mạng sâu hơn lại huấn luyện kém hơn?', id: 'Mengapa jaringan lebih dalam justru lebih sulit dilatih?' },
  mT: { en: 'Add shortcut connections so each block learns only a residual.', zh: '加入捷径连接，让每个块只学习残差。', vi: 'Thêm kết nối tắt để mỗi khối chỉ học phần dư.', id: 'Tambahkan jalan pintas agar tiap blok hanya mempelajari residual.' },
  rT: { en: '152 layers train well; 3.57% top-5 error on ImageNet.', zh: '152 层也能训练好；ImageNet top-5 错误率 3.57%。', vi: '152 lớp vẫn huấn luyện tốt; lỗi top-5 trên ImageNet 3,57%.', id: '152 lapis tetap terlatih baik; galat top-5 ImageNet 3,57%.' },
  simple: { en: 'Simpler', zh: '更浅', vi: 'Dễ hơn', id: 'Lebih sederhana' },
  deeper: { en: 'Deeper', zh: '更深', vi: 'Sâu hơn', id: 'Lebih dalam' },
  simpleT: { en: 'Each block only fixes what the previous one missed.', zh: '每个块只修正上一个块漏掉的部分。', vi: 'Mỗi khối chỉ sửa phần khối trước bỏ sót.', id: 'Tiap blok hanya membetulkan yang terlewat oleh blok sebelumnya.' },
  ch: { en: ['The problem', 'Shortcuts', 'Results', 'Why it works'], zh: ['问题', '捷径', '结果', '为什么有效'], vi: ['Vấn đề', 'Đường tắt', 'Kết quả', 'Vì sao hiệu quả'], id: ['Masalahnya', 'Jalan pintas', 'Hasil', 'Mengapa berhasil'] } as Record<Lang, string[]>,
  vq: { en: 'What does a shortcut connection pass on?', zh: '捷径连接把什么传下去？', vi: 'Kết nối tắt truyền đi cái gì?', id: 'Apa yang diteruskan jalan pintas?' },
  vo: { en: ['The loss', 'The input, unchanged', 'A random layer'], zh: ['损失', '原样的输入', '随机一层'], vi: ['Hàm mất mát', 'Đầu vào, giữ nguyên', 'Một lớp ngẫu nhiên'], id: ['Nilai loss', 'Input, tanpa diubah', 'Lapisan acak'] } as Record<Lang, string[]>,
  ask: { en: 'What problem does this paper solve?', zh: '这篇论文解决了什么问题？', vi: 'Bài báo này giải quyết vấn đề gì?', id: 'Masalah apa yang diselesaikan makalah ini?' },
  ans: { en: 'Very deep networks were hard to train. The paper makes each layer learn a residual instead:', zh: '很深的网络难以训练。论文让每层改为学习残差：', vi: 'Mạng rất sâu khó huấn luyện. Bài báo cho mỗi lớp học phần dư:', id: 'Jaringan sangat dalam sulit dilatih. Makalah ini membuat tiap lapisan mempelajari residual:' },
  match: { en: 'Matched word for word', zh: '逐字一致', vi: 'Khớp nguyên văn', id: 'Cocok kata demi kata' },
  page1: { en: 'Page 1', zh: '第 1 页', vi: 'Trang 1', id: 'Halaman 1' },
  repro: { en: 'Reproduced', zh: '已复现', vi: 'Đã tái lập', id: 'Tereproduksi' },
};

function StepPic({ i }: { i: number }) {
  const { t, lang } = usePrefs();
  const box = 'relative h-[210px] overflow-hidden rounded-xl border bg-muted/40 p-4';
  if (i === 0) {
    const items = ['Abstract', 'Figure 1 · training error', 'Table 3 · ImageNet error', 'Equation (1)'];
    return (
      <div className={cn(box, 'grid grid-cols-[46%_1fr] gap-4')} aria-hidden>
        <div className="relative rounded-md border bg-white p-2.5 shadow-sm dark:bg-[#f4f3ee]">
          <span className="block h-1.5 w-[80%] rounded-full bg-[#cfcec8]" /><span className="mt-1 block h-1 w-[60%] rounded-full bg-[#dcdbd4]" />
          <span className="mt-2 block h-9 rounded border-2 border-primary/70 bg-primary/10" />
          <div className="mt-2 grid gap-1">{[100, 92, 96].map((w) => <span key={w} className="block h-1 rounded-full bg-[#dcdbd4]" style={{ width: `${w}%` }} />)}</div>
          <span className="mt-2 block h-8 rounded border-2 border-lit bg-lit/15" />
          <span className="mt-2 block h-3 w-[70%] rounded border-2 border-success/70 bg-success/10" />
          <span className="pl-scan absolute inset-x-0 h-0.5 bg-primary/70 shadow-[0_0_10px_hsl(var(--primary))]" />
        </div>
        <ul className="grid content-center gap-2 text-[11.5px]">
          <li className="text-[10.5px] font-semibold text-muted-foreground">{t(S.read)}</li>
          {items.map((x, k) => <li key={x} className="pl-pop flex items-center gap-1.5" style={{ animationDelay: `${k * 0.15}s` }}><Check className="h-3.5 w-3.5 shrink-0 text-success" />{x}</li>)}
        </ul>
      </div>
    );
  }
  if (i === 1) {
    const rows: [T4, T4, string][] = [[S.q, S.qT, 'border-primary'], [S.m, S.mT, 'border-lit'], [S.r, S.rT, 'border-success']];
    return (
      <div className={cn(box, 'grid content-center gap-1.5 p-3')} aria-hidden>
        {rows.map(([h, x, c]) => <div key={h.en} className={cn('rounded-lg border border-l-4 bg-background px-2.5 py-1.5', c)}><p className="text-[10px] font-semibold text-muted-foreground">{t(h)}</p><p className="text-[11.5px] font-medium leading-snug">{t(x)}</p></div>)}
      </div>
    );
  }
  if (i === 2) {
    return (
      <div className={box} aria-hidden>
        <div className="flex flex-wrap gap-1">{['EN', '中文', 'Tiếng Việt', 'Bahasa'].map((x, k) => <span key={x} className={cn('rounded-full border bg-background px-2 py-0.5 text-[10.5px] font-semibold', k === 0 && 'border-primary bg-primary text-primary-foreground')}>{x}</span>)}</div>
        <div className="mt-3 rounded-lg rounded-tl-sm border bg-background p-2.5"><p className="text-[10.5px] font-semibold text-success">{t(S.simple)}</p><p className="text-[12px] leading-snug">{t(S.simpleT)}</p></div>
        <div className="mt-2 rounded-lg rounded-tl-sm border bg-background p-2.5"><p className="text-[10.5px] font-semibold text-primary">{t(S.deeper)}</p><p className="font-mono text-[11.5px] leading-snug">F(x) = H(x) − x, y = F(x) + x</p></div>
        <p className="mt-2 px-1 text-[11.5px] text-muted-foreground">{lang === 'en' ? '每个块只修正上一个块漏掉的部分。' : 'Each block only fixes what the previous one missed.'}</p>
      </div>
    );
  }
  if (i === 3) {
    return (
      <div className={cn(box, 'grid grid-cols-[38%_1fr] gap-3 bg-[#0d0d1a] text-white')} aria-hidden>
        <ol className="grid content-center gap-1.5 text-[11px]">
          {(S.ch[lang] ?? S.ch.en).map((x, k) => <li key={x} className={cn('rounded-md px-2 py-1.5', k === 1 ? 'bg-white/15 font-semibold' : 'text-white/60')}><span className="mr-1.5 text-white/40">{k + 1}</span>{x}{k === 1 && <span className="mt-1 block h-0.5 rounded-full bg-white/20"><span className="block h-full w-full rounded-full bg-lit" /></span>}</li>)}
        </ol>
        <div className="grid content-center">
          <p className="text-[10.5px] text-white/55">2 / 4</p>
          <p className="mt-0.5 text-[12.5px] font-semibold leading-snug">{t(S.vq)}</p>
          <div className="mt-2 grid gap-1.5">{(S.vo[lang] ?? S.vo.en).map((o, k) => <span key={o} className={cn('flex items-center justify-between rounded-md border px-2 py-1 text-[11.5px]', k === 1 ? 'border-[#3ddc97] bg-[#3ddc97]/15' : 'border-white/15')}>{o}{k === 1 && <Check className="h-3.5 w-3.5 text-[#3ddc97]" />}</span>)}</div>
        </div>
      </div>
    );
  }
  if (i === 4) {
    return (
      <div className={cn(box, 'grid content-center gap-2')} aria-hidden>
        <p className="ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-primary px-3 py-1.5 text-[12px] text-primary-foreground">{t(S.ask)}</p>
        <div className="max-w-[95%] rounded-xl rounded-bl-sm border bg-background p-2.5">
          <p className="text-[12px] leading-snug">{t(S.ans)}</p>
          <p className="mt-1.5 flex gap-1.5 border-l-2 border-primary pl-2 text-[11.5px] italic text-muted-foreground"><Quote className="mt-0.5 h-3 w-3 shrink-0 text-primary" />“We explicitly reformulate the layers as learning residual functions with reference to the layer inputs”</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10.5px] font-semibold"><span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-success"><Check className="h-3 w-3" />{t(S.match)}</span><span className="rounded-full bg-accent px-2 py-0.5 text-primary">{t(S.page1)}</span></div>
        </div>
      </div>
    );
  }
  const log = ['git clone + pip install', 'python run.py   # run 1, from scratch', 'python run.py   # run 2, from scratch', 'compare with the paper'];
  return (
    <div className={cn(box, 'bg-[#0d0d1a] font-mono text-white')} aria-hidden>
      <div className="grid gap-1.5 text-[11px]">{log.map((x, k) => <p key={x} className="pl-pop flex items-center gap-2" style={{ animationDelay: `${k * 0.2}s` }}><Check className="h-3 w-3 shrink-0 text-[#3ddc97]" /><span className="truncate text-white/80">{x}</span></p>)}</div>
      <div className="absolute inset-x-4 bottom-4 rounded-lg border border-[#3ddc97]/40 bg-[#3ddc97]/10 p-2.5 font-sans">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#3ddc97]"><Check className="h-3.5 w-3.5" />{t(S.repro)}</p>
        <p className="text-[11.5px] text-white/80">Stochastic Voronoi Ensembles for Anomaly Detection</p>
      </div>
    </div>
  );
}

export function HowItWorks() {
  const { lang } = usePrefs();
  return (
    <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {(STEPS[lang] ?? STEPS.en).map(([h, p], i) => (
        <li key={h} className="pl-card flex min-w-0 flex-col p-4">
          <StepPic i={i} />
          <div className="mt-4 flex items-baseline gap-2.5 px-1"><span className="text-sm font-semibold text-primary">{String(i + 1).padStart(2, '0')}</span><p className="font-display text-lg font-semibold">{h}</p></div>
          <p className="mt-1 px-1 pb-1 text-[14px] leading-relaxed text-muted-foreground">{p}</p>
        </li>
      ))}
    </ol>
  );
}
