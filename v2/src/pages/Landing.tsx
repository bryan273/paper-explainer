import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, GraduationCap, Minus, Play, PlayCircle, Quote, CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAccount } from '@/lib/account';
import { usePrefs, type Lang } from '@/lib/prefs';
import { amount, fmtMoney, money, perMonthOfYear, type PriceKey } from '@/lib/currency';
import { HowItWorks, Prism } from '@/components/site/LandingViz';
import { HL, P, ROWS } from '@/pages/Pricing';
import { PRODUCT, COMMON, NAV } from '@/lib/strings';
import { cn } from '@/lib/utils';

const L = {
  chip: { en: 'Interactive video is here: questions inside the video', zh: '互动视频上线：视频里直接答题', vi: 'Đã có video tương tác: câu hỏi ngay trong video', id: 'Video interaktif hadir: pertanyaan di dalam video' },
  h1: { en: 'From information to understanding.', zh: '从信息，到理解。', vi: 'Từ thông tin đến hiểu biết.', id: 'Dari informasi menjadi pemahaman.' },
  lede: {
    en: 'Paperlit turns a paper, an article or your own notes into the way you learn best: a short video, a guided read, deep questions and answers, or a check of the results.',
    zh: 'Paperlit 把论文、文章或你自己的笔记，变成最适合你的学习方式：一段短视频、一次带引用的精读、深入问答，或对结果的复现检查。',
    vi: 'Paperlit biến một bài báo, một bài viết hay ghi chú của bạn thành cách học hợp với bạn nhất: một video ngắn, một lần đọc có trích dẫn, hỏi đáp chuyên sâu, hoặc kiểm tra lại kết quả.',
    id: 'Paperlit mengubah makalah, artikel, atau catatan Anda menjadi cara belajar yang paling cocok: video singkat, membaca dengan rujukan, tanya jawab mendalam, atau pengecekan hasil.',
  },
  cta1: { en: 'Make a free video', zh: '免费做一个视频', vi: 'Tạo video miễn phí', id: 'Buat video gratis' },
  cta2: { en: 'Watch an example', zh: '看示例', vi: 'Xem ví dụ', id: 'Lihat contoh' },
  trust: { en: 'Free to start. No card needed. English, 中文, Tiếng Việt, Bahasa Indonesia.', zh: '免费开始，无需绑卡。支持英文、中文、越南语、印尼语。', vi: 'Bắt đầu miễn phí, không cần thẻ. English, 中文, Tiếng Việt, Bahasa Indonesia.', id: 'Mulai gratis, tanpa kartu. English, 中文, Tiếng Việt, Bahasa Indonesia.' },
  srcPaper: { en: 'Paper', zh: '论文', vi: 'Bài báo', id: 'Makalah' },
  srcArticle: { en: 'Article', zh: '文章', vi: 'Bài viết', id: 'Artikel' },
  srcNotes: { en: 'Your notes', zh: '你的笔记', vi: 'Ghi chú', id: 'Catatan' },
  srcLecture: { en: 'Lecture video', zh: '课程视频', vi: 'Video bài giảng', id: 'Video kuliah' },
  srcPodcast: { en: 'Podcast', zh: '播客', vi: 'Podcast', id: 'Podcast' },
  start: { en: 'Start here', zh: '从这里开始', vi: 'Bắt đầu ở đây', id: 'Mulai di sini' },
  exH: { en: 'See what a video looks like', zh: '看看视频长什么样', vi: 'Xem một video trông thế nào', id: 'Lihat seperti apa videonya' },
  exS: { en: 'Real videos made by Paperlit from famous papers. Open one and try the questions inside it.', zh: '由 Paperlit 根据经典论文生成的真实视频。打开一个，试试视频里的题目。', vi: 'Video thật do Paperlit làm từ các bài báo nổi tiếng. Mở một video và thử các câu hỏi bên trong.', id: 'Video asli buatan Paperlit dari makalah terkenal. Buka satu dan coba pertanyaan di dalamnya.' },
  min: { en: '{n} min', zh: '{n} 分钟', vi: '{n} phút', id: '{n} menit' },
  vH: { en: 'One source, many ways to learn', zh: '一份资料，多种学法', vi: 'Một nguồn, nhiều cách học', id: 'Satu sumber, banyak cara belajar' },
  vS: { en: 'Between what you bring and what you get back, the AI does six things to your source.', zh: '从你带来的资料到你拿到的结果之间，AI 对资料做了六件事。', vi: 'Giữa thứ bạn mang đến và thứ bạn nhận lại, AI làm sáu việc với nguồn của bạn.', id: 'Di antara yang Anda bawa dan yang Anda terima, AI melakukan enam hal pada sumber Anda.' },
  uH: { en: 'Who it is for', zh: '适合谁', vi: 'Dành cho ai', id: 'Untuk siapa' },
  uS: { en: 'The same source becomes something different for each person.', zh: '同一份资料，对每个人变成不同的东西。', vi: 'Cùng một nguồn, mỗi người nhận được một thứ khác nhau.', id: 'Sumber yang sama menjadi sesuatu yang berbeda bagi setiap orang.' },
  uses: {
    en: [['Students', 'Lecture notes, or a paper set for class', 'A short video per topic and a quiz before the exam'], ['Researchers', 'A new paper in their field', 'The gist in three minutes, a read with cited answers, then a check of the result'], ['Teachers', 'A reading for the class', 'A video to share by link, with questions inside it'], ['Curious readers', 'An article they saved', 'A clear explanation in their own language']],
    zh: [['学生', '课堂笔记，或老师布置的论文', '每个主题一段短视频，考前一套测验'], ['研究者', '本领域的一篇新论文', '三分钟抓住要点，带引用地精读，再检查结果'], ['教师', '给学生的一篇阅读材料', '一段可用链接分享的视频，视频里带题目'], ['好奇的读者', '收藏的一篇文章', '用自己语言讲清楚的解释']],
    vi: [['Sinh viên', 'Ghi chú bài giảng, hoặc bài báo được giao', 'Mỗi chủ đề một video ngắn và một bài kiểm tra trước kỳ thi'], ['Nhà nghiên cứu', 'Một bài báo mới trong lĩnh vực', 'Nắm ý chính trong ba phút, đọc kèm trích dẫn, rồi kiểm tra kết quả'], ['Giảng viên', 'Một bài đọc cho lớp', 'Một video chia sẻ bằng liên kết, có câu hỏi bên trong'], ['Người tò mò', 'Một bài viết đã lưu', 'Một lời giải thích rõ ràng bằng ngôn ngữ của mình']],
    id: [['Mahasiswa', 'Catatan kuliah, atau makalah tugas', 'Video singkat per topik dan kuis sebelum ujian'], ['Peneliti', 'Makalah baru di bidangnya', 'Inti dalam tiga menit, membaca dengan jawaban bersitasi, lalu cek hasilnya'], ['Pengajar', 'Bacaan untuk kelas', 'Video yang dibagikan lewat tautan, dengan pertanyaan di dalamnya'], ['Pembaca penasaran', 'Artikel yang disimpan', 'Penjelasan jelas dalam bahasanya sendiri']],
  },
  uHead: { en: ['Who', 'Brings', 'Gets'], zh: ['谁', '带来', '得到'], vi: ['Ai', 'Mang đến', 'Nhận được'], id: ['Siapa', 'Membawa', 'Mendapat'] },
  pH: { en: 'Simple plans, local prices', zh: '简单的套餐，本地价格', vi: 'Gói đơn giản, giá theo từng nước', id: 'Paket sederhana, harga lokal' },
  pS: { en: 'Start free. Upgrade when Paperlit becomes part of how you study.', zh: '先免费用，成为学习习惯后再升级。', vi: 'Bắt đầu miễn phí. Nâng cấp khi Paperlit thành thói quen học của bạn.', id: 'Mulai gratis. Tingkatkan saat Paperlit jadi bagian cara belajar Anda.' },
  perMonth: { en: '/ month', zh: '/ 月', vi: '/ tháng', id: '/ bulan' },
  vids: { en: '{n} videos a month', zh: '每月 {n} 个视频', vi: '{n} video mỗi tháng', id: '{n} video per bulan' },
  freeLine: { en: '1 video a day + 3 welcome videos', zh: '每天 1 个 + 3 个欢迎视频', vi: '1 video mỗi ngày + 3 video chào mừng', id: '1 video per hari + 3 video sambutan' },
  hideCmp: { en: 'Hide the comparison', zh: '收起对比', vi: 'Thu gọn so sánh', id: 'Sembunyikan perbandingan' },
  buy: { en: 'Choose a plan', zh: '选择套餐', vi: 'Chọn gói', id: 'Pilih paket' },
  allPlans: { en: 'Compare all plans', zh: '比较所有套餐', vi: 'So sánh các gói', id: 'Bandingkan semua paket' },
  faqH: { en: 'Questions people ask', zh: '常见问题', vi: 'Câu hỏi thường gặp', id: 'Pertanyaan umum' },
  faq: {
    en: [['What can I put in?', 'A link to any web page or paper (arXiv, a journal, a blog, a news site), pasted text, or a PDF or .txt file. Lecture videos and podcasts are coming.'], ['How long does a video take?', 'About 4 to 8 minutes. You can close the tab; it keeps going and waits in your library.'], ['How do you stop the AI from making things up?', 'Every quote and number in a video is matched against the source, and anything that does not match is removed. Answers show the page they come from.'], ['Is it free?', 'Yes, to start: 3 welcome videos, then 1 free video every day. Plans add more videos, interactive videos and in-depth answers.'], ['Can my class use it?', 'Yes. Students and teachers get a free month of Plus after sending a proof, and we make custom plans for classes and teams.']],
    zh: [['可以放什么进来？', '任何网页或论文的链接（arXiv、期刊、博客、新闻），粘贴的文字，或 PDF、.txt 文件。课程视频和播客即将支持。'], ['做一个视频要多久？', '大约 4 到 8 分钟。可以关掉页面，它会继续生成并保存在你的视频库里。'], ['怎么防止 AI 编造？', '视频里的每句引文和数字都与原文比对，对不上的会被删掉。回答会标出出处页码。'], ['免费吗？', '可以免费开始：赠送 3 个视频，之后每天 1 个免费视频。套餐提供更多视频、互动视频和深入回答。'], ['班级可以用吗？', '可以。学生和教师提交证明后可免费用 1 个月 Plus，我们也为班级和团队定制方案。']],
    vi: [['Tôi có thể đưa gì vào?', 'Liên kết tới bất kỳ trang web hay bài báo nào (arXiv, tạp chí, blog, báo), văn bản dán vào, hoặc tệp PDF, .txt. Video bài giảng và podcast sắp có.'], ['Làm một video mất bao lâu?', 'Khoảng 4 đến 8 phút. Bạn có thể đóng tab; video vẫn được làm tiếp và chờ trong thư viện.'], ['Làm sao để AI không bịa?', 'Mọi trích dẫn và con số trong video đều được đối chiếu với nguồn, phần nào không khớp sẽ bị loại. Câu trả lời ghi rõ trang nguồn.'], ['Có miễn phí không?', 'Có, để bắt đầu: tặng 3 video, sau đó mỗi ngày 1 video miễn phí. Các gói có thêm video, video tương tác và câu trả lời chuyên sâu.'], ['Lớp học có dùng được không?', 'Được. Sinh viên và giảng viên được tặng 1 tháng Plus sau khi gửi giấy tờ, và chúng tôi có gói riêng cho lớp học, nhóm.']],
    id: [['Apa yang bisa saya masukkan?', 'Tautan ke halaman web atau makalah apa pun (arXiv, jurnal, blog, berita), teks yang ditempel, atau file PDF atau .txt. Video kuliah dan podcast segera hadir.'], ['Berapa lama membuat satu video?', 'Sekitar 4 sampai 8 menit. Anda boleh menutup tab; prosesnya berlanjut dan menunggu di pustaka Anda.'], ['Bagaimana AI dicegah mengarang?', 'Setiap kutipan dan angka di video dicocokkan dengan sumber, dan yang tidak cocok dibuang. Jawaban menunjukkan halaman asalnya.'], ['Apakah gratis?', 'Ya, untuk mulai: 3 video sambutan, lalu 1 video gratis setiap hari. Paket menambah video, video interaktif, dan jawaban mendalam.'], ['Apakah kelas bisa memakainya?', 'Bisa. Mahasiswa dan pengajar dapat 1 bulan Plus gratis setelah mengirim bukti, dan kami membuat paket khusus untuk kelas dan tim.']],
  },
  stH: { en: 'Students and teachers: a free month of Plus', zh: '学生和教师：免费用 1 个月 Plus', vi: 'Sinh viên và giảng viên: tặng 1 tháng Plus', id: 'Mahasiswa dan pengajar: 1 bulan Plus gratis' },
  stP: { en: 'Send a photo of your student or staff card. After we check it, Plus switches on with its 50 videos.', zh: '上传学生证或工作证照片，审核通过后开通 Plus 和 50 个视频。', vi: 'Gửi ảnh thẻ sinh viên hoặc thẻ giảng viên. Sau khi duyệt, Plus và 50 video được kích hoạt.', id: 'Kirim foto kartu mahasiswa atau pengajar. Setelah dicek, Plus aktif beserta 50 videonya.' },
  stList: { en: ['50 videos', '10 interactive videos', 'Notes and flashcards'], zh: ['50 个视频', '10 个互动视频', '笔记和闪卡'], vi: ['50 video', '10 video tương tác', 'Ghi chú và thẻ ghi nhớ'], id: ['50 video', '10 video interaktif', 'Catatan dan kartu hafalan'] },
  stCta: { en: 'Get student Plus', zh: '申请学生 Plus', vi: 'Nhận Plus cho sinh viên', id: 'Ambil Plus pelajar' },
  endH: { en: 'Learn anything, in the way that works for you.', zh: '学任何东西，用最适合你的方式。', vi: 'Học bất cứ điều gì, theo cách hợp với bạn.', id: 'Pelajari apa saja, dengan cara yang cocok untuk Anda.' },
  endP: { en: 'Your first video is free. It takes a link and about five minutes.', zh: '第一个视频免费，只需一个链接和大约五分钟。', vi: 'Video đầu tiên miễn phí. Chỉ cần một liên kết và khoảng năm phút.', id: 'Video pertama gratis. Cukup satu tautan dan sekitar lima menit.' },
};

const EXAMPLES: { id: string; title: string; min: number; poster?: string }[] = [
  { id: '6a21030a-b5f8-4c0e-977e-39090d7ebc70', title: 'Deep Residual Learning for Image Recognition', min: 3 },
  { id: 'c91b06ea-3226-4fdf-90ae-1a7a21b9f283', title: 'Language Models are Few-Shot Learners', min: 3 },
  { id: 'ea94b4d8-195f-43b5-a267-72d7ac02bbad', title: 'An Image is Worth 16x16 Words', min: 3 },
  { id: '4c6f43f4-0849-4f95-815e-8c7d5c3b151d', title: 'BERT: Pre-training of Deep Bidirectional Transformers', min: 1 },
  { id: '5420c9c1-a5f6-48b0-a506-10ab1f13d691', title: 'Adam: A Method for Stochastic Optimization', min: 1 },
  { id: '7b19a9ff-6cbb-4049-931e-9308f5d8c819', title: 'Attention Is All You Need', min: 3, poster: `${import.meta.env.BASE_URL}landing/attention.jpg` },
];
export const posterOf = (id: string) => EXAMPLES.find((e) => e.id === id)?.poster ?? `https://bryan273.github.io/repro-suite/explainer/examples/${id}/poster0.jpg`;

function Section({ id, title, sub, children, className }: { id?: string; title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={cn('pl-container scroll-mt-20 pt-24', className)}>
      <h2 className="pl-h2 max-w-[22ch]">{title}</h2>
      {sub && <p className="pl-lede mt-3 max-w-[62ch]">{sub}</p>}
      <div className="mt-10">{children}</div>
    </section>
  );
}

export default function Landing() {
  const { lang, t } = usePrefs();
  const { user, openAuth } = useAccount();
  const primary = user ? <Button asChild size="lg"><Link to="/app/new">{t(L.cta1)}<ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
    : <Button size="lg" onClick={() => openAuth('register')}>{t(L.cta1)}<ArrowRight className="ml-1.5 h-4 w-4" /></Button>;
  const plans = [
    { k: 'free', name: t(COMMON.free), price: fmtMoney(0, lang), line: t(L.freeLine) },
    { k: 'plus', name: 'Plus', price: fmtMoney(amount('plus_month', lang), lang), line: t(L.vids).replace('{n}', '50') },
    { k: 'pro', name: 'Pro', price: fmtMoney(amount('pro_month', lang), lang), line: t(L.vids).replace('{n}', '120') },
    { k: 'premium', name: 'Premium', price: fmtMoney(amount('premium_month', lang), lang), line: t(L.vids).replace('{n}', '250') },
  ];
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_20%_0%,hsl(var(--primary)/0.12),transparent),radial-gradient(40%_50%_at_90%_10%,hsl(var(--lit)/0.14),transparent)]" aria-hidden />
        <div className="pl-container relative pb-6 pt-16 sm:pt-24">
          <Link to="/app/new" className="pl-chip no-underline hover:text-foreground"><span className="h-1.5 w-1.5 rounded-full bg-lit" />{t(L.chip)}</Link>
          <h1 className="pl-h1 mt-6 max-w-[14ch]">{t(L.h1)}</h1>
          <p className="pl-lede mt-6 max-w-[60ch]">{t(L.lede)}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {primary}
            <Button asChild size="lg" variant="outline"><a href="#examples"><Play className="mr-1.5 h-4 w-4" />{t(L.cta2)}</a></Button>
          </div>
          <p className="mt-4 text-[13px] text-muted-foreground">{t(L.trust)}</p>
          <Prism />
        </div>
      </section>

      <Section id="examples" title={t(L.exH)} sub={t(L.exS)}>
        <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLES.map((e) => (
            <Link key={e.id} to={`/app/v/${e.id}`} className="group block no-underline">
              <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted">
                <img src={posterOf(e.id)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                <span className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/25"><PlayCircle className="h-10 w-10 text-white opacity-0 drop-shadow transition group-hover:opacity-100" /></span>
                <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">{t(L.min).replace('{n}', String(e.min))}</span>
              </div>
              <p className="mt-2.5 line-clamp-2 text-[15px] font-medium leading-snug text-foreground">{e.title}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section title={t(L.vH)} sub={t(L.vS)}>
        <HowItWorks />
      </Section>


      <Section title={t(L.uH)} sub={t(L.uS)}>
        <div className="overflow-hidden rounded-2xl border">
          <div className="hidden grid-cols-[1fr_1.4fr_1.8fr] gap-4 border-b bg-muted/50 px-6 py-3 text-[13px] font-semibold text-muted-foreground sm:grid">
            {pickArr(lang, L.uHead).map((h) => <span key={h}>{h}</span>)}
          </div>
          {pickArr(lang, L.uses).map(([who, from, to], i) => (
            <div key={who} className={cn('grid gap-1 px-6 py-5 sm:grid-cols-[1fr_1.4fr_1.8fr] sm:gap-4', i && 'border-t')}>
              <b className="font-display text-[16px]">{who}</b>
              <span className="text-[14.5px] text-muted-foreground">{from}</span>
              <span className="text-[14.5px]">{to}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t(L.pH)} sub={t(L.pS)}>
        <PlansBlock />
      </Section>

      <section className="pl-container pt-16">
        <div className="pl-card flex flex-col gap-5 p-6 sm:p-8 md:flex-row md:items-center">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"><GraduationCap className="h-7 w-7" /></span>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold">{t(L.stH)}</h2>
            <p className="mt-1.5 max-w-[62ch] text-[15px] text-muted-foreground">{t(L.stP)}</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">{pickArr(lang, L.stList).map((x) => <li key={x} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" />{x}</li>)}</ul>
          </div>
          <Button asChild size="lg"><Link to="/pricing#students">{t(L.stCta)}<ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
        </div>
      </section>

      <Section title={t(L.faqH)}>
        <Accordion type="single" collapsible className="max-w-3xl">
          {pickArr(lang, L.faq).map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="text-left text-[15.5px] font-semibold">{q}</AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-6 text-sm text-muted-foreground"><CircleHelp className="mr-1 inline h-4 w-4" /><Link to="/help" className="font-medium text-primary">{t(NAV.help)}</Link></p>
      </Section>

      <section className="pl-container pt-24">
        <div className="relative overflow-hidden rounded-3xl bg-[#12122a] px-6 py-14 text-white sm:px-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#ffb020]/20 blur-3xl" aria-hidden />
          <h2 className="font-display text-[clamp(1.8rem,4vw,2.9rem)] font-bold leading-tight">{t(L.endH)}</h2>
          <p className="mt-3 max-w-[50ch] text-white/75">{t(L.endP)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? <Button asChild size="lg" className="bg-[#ffb020] text-[#12122a] hover:bg-[#ffc24d]"><Link to="/app/new">{t(L.cta1)}</Link></Button>
              : <Button size="lg" className="bg-[#ffb020] text-[#12122a] hover:bg-[#ffc24d]" onClick={() => openAuth('register')}>{t(L.cta1)}</Button>}
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/pricing">{t(NAV.pricing)}</Link></Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function pickArr<T>(lang: Lang, v: Record<Lang, T>): T { return v[lang] ?? v.en; }

function PlansBlock() {
  const { lang, t } = usePrefs();
  const [year, setYear] = useState(true);
  const [more, setMore] = useState(false);
  const rows = ROWS(t);
  const ids = ['free', 'plus', 'pro', 'premium'] as const;
  return (
    <div>
      <div className="mb-8 inline-flex rounded-full border bg-muted p-1" role="radiogroup" aria-label="Billing">
        {([false, true] as const).map((y) => (
          <button key={String(y)} type="button" role="radio" aria-checked={year === y} onClick={() => setYear(y)} className={cn('rounded-full px-5 py-2 text-sm font-medium transition', year === y ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}>
            {t(y ? P.year : P.month)}{y && <span className="ml-1.5 text-xs font-semibold text-success">{t(P.save)}</span>}
          </button>
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {ids.map((id) => {
          const name = id === 'free' ? t(COMMON.free) : id[0].toUpperCase() + id.slice(1);
          const dark = id === 'pro' || id === 'premium';
          const monthly = id === 'free' ? 0 : year ? perMonthOfYear(`${id}_year`, lang) : amount(`${id}_month`, lang);
          const tick = id === 'premium' ? 'text-[#e6c46a]' : id === 'pro' ? 'text-[#f0c15a]' : 'text-primary';
          return (
            <Link key={id} to="/pricing" className={cn('relative flex flex-col rounded-2xl border p-6 no-underline transition hover:-translate-y-0.5', id === 'plus' && 'border-2 border-primary shadow-[0_12px_40px_-12px_hsl(var(--primary)/0.45)]',
              id === 'pro' && 'border-[#2b2275] bg-[#17123f] text-white', id === 'premium' && 'border-[#d9b45a] bg-[#14110a] text-[#f6efe0]', !dark && 'bg-card text-foreground')}>
              {id === 'plus' && <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">{t(P.popular)}</span>}
              <p className="font-display text-lg font-semibold">{name}</p>
              <p className={cn('text-sm', dark ? 'text-white/65' : 'text-muted-foreground')}>{t(P[`${id}Sub` as const])}</p>
              <p className="mt-5 flex flex-wrap items-baseline gap-x-1.5"><span className="font-display text-[32px] font-bold leading-none">{fmtMoney(monthly, lang)}</span>{id !== 'free' && <span className={cn('text-sm', dark ? 'text-white/65' : 'text-muted-foreground')}>{t(P.per)}</span>}</p>
              <p className={cn('mt-1.5 min-h-[18px] text-xs', dark ? 'text-white/60' : 'text-muted-foreground')}>{id !== 'free' && year ? t(P.billedYear).replace('{p}', money(`${id}_year` as PriceKey, lang)) : ''}</p>
              <ul className="mt-4 grid gap-2 text-[14px]">
                {(HL[id][lang] ?? HL[id].en).map((x) => <li key={x} className="flex gap-2"><Check className={cn('mt-0.5 h-4 w-4 shrink-0', tick)} /><span>{x}</span></li>)}
              </ul>
            </Link>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button variant="outline" aria-expanded={more} onClick={() => setMore((m) => !m)}>{t(more ? L.hideCmp : L.allPlans)}</Button>
        <Button asChild><Link to="/pricing">{t(L.buy)}<ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
      </div>
      {more && (
        <div className="mt-6 overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b bg-muted/50"><th className="px-5 py-3.5" />{[t(COMMON.free), 'Plus', 'Pro', 'Premium'].map((h, i) => <th key={h} className={cn('px-4 py-3.5 text-center font-display text-base font-semibold', i === 1 && 'text-primary')}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r[0]} className="border-b last:border-0">
                  <td className="px-5 py-3 font-medium">{r[0]}</td>
                  {r.slice(1).map((v, i) => <td key={i} className="px-4 py-3 text-center">{v === true ? <Check className="mx-auto h-4 w-4 text-primary" /> : v === false ? <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" /> : v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
