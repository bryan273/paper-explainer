import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, FileText, FlaskConical, Lightbulb, Mic, Play, PlayCircle, Video, StickyNote, Newspaper, Quote, CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAccount } from '@/lib/account';
import { usePrefs, type Lang } from '@/lib/prefs';
import { amount, fmtMoney } from '@/lib/currency';
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
  vS: { en: 'Between what you bring and what you get back, the AI does five things to your source.', zh: '从你带来的资料到你拿到的结果之间，AI 对资料做了五件事。', vi: 'Giữa thứ bạn mang đến và thứ bạn nhận lại, AI làm năm việc với nguồn của bạn.', id: 'Di antara yang Anda bawa dan yang Anda terima, AI melakukan lima hal pada sumber Anda.' },
  verbs: {
    en: [['Understand', 'Reads the whole source, including figures and tables.'], ['Summarize', 'Keeps what matters: the question, the method, the result.'], ['Explain', 'At your level and in your language.'], ['Restructure', 'Chapters, a script, a quiz, flashcards.'], ['Verify', 'Quotes the source word for word and re-runs results.']],
    zh: [['理解', '读完整份资料，包括图和表。'], ['提炼', '留下关键：问题、方法、结果。'], ['讲解', '按你的水平，用你的语言。'], ['重组', '章节、讲稿、测验、闪卡。'], ['核实', '逐字引用原文，重新运行结果。']],
    vi: [['Hiểu', 'Đọc toàn bộ nguồn, kể cả hình và bảng.'], ['Tóm lược', 'Giữ điều quan trọng: câu hỏi, phương pháp, kết quả.'], ['Giải thích', 'Theo trình độ và ngôn ngữ của bạn.'], ['Tái cấu trúc', 'Chương, kịch bản, bài kiểm tra, thẻ ghi nhớ.'], ['Kiểm chứng', 'Trích nguyên văn và chạy lại kết quả.']],
    id: [['Memahami', 'Membaca seluruh sumber, termasuk gambar dan tabel.'], ['Meringkas', 'Menyimpan yang penting: pertanyaan, metode, hasil.'], ['Menjelaskan', 'Sesuai tingkat dan bahasa Anda.'], ['Menyusun ulang', 'Bab, naskah, kuis, kartu hafalan.'], ['Memverifikasi', 'Mengutip kata demi kata dan menjalankan ulang hasil.']],
  },
  f1H: { en: 'A video that checks you understood', zh: '会检查你是否看懂的视频', vi: 'Video kiểm tra xem bạn đã hiểu chưa', id: 'Video yang mengecek pemahaman Anda' },
  f1P: { en: 'Turn on interactive video and it stops at the end of each part with one question. The explanation is ready the moment you answer.', zh: '打开互动视频后，每段结束都会暂停问一道题。你一作答，讲解立即出现。', vi: 'Bật video tương tác, video sẽ dừng cuối mỗi phần với một câu hỏi. Lời giải thích có ngay khi bạn trả lời.', id: 'Nyalakan video interaktif dan video berhenti di akhir tiap bagian dengan satu pertanyaan. Penjelasannya siap begitu Anda menjawab.' },
  f2H: { en: 'Answers you can trace to the page', zh: '每个回答都能追溯到页码', vi: 'Câu trả lời truy được về từng trang', id: 'Jawaban yang bisa dilacak ke halamannya' },
  f2P: { en: 'Ask anything. Quick answers come in seconds; in-depth answers use a stronger AI. Every quote is matched word for word against the source.', zh: '随便问。快速回答几秒就到；深入回答使用更强的 AI。每句引文都与原文逐字比对。', vi: 'Hỏi bất cứ điều gì. Trả lời nhanh trong vài giây; chế độ chuyên sâu dùng AI mạnh hơn. Mọi trích dẫn đều được đối chiếu nguyên văn với nguồn.', id: 'Tanyakan apa saja. Jawaban cepat dalam hitungan detik; mode mendalam memakai AI yang lebih kuat. Setiap kutipan dicocokkan kata demi kata dengan sumbernya.' },
  f3H: { en: 'Know if the result really holds', zh: '知道结果是否真的成立', vi: 'Biết kết quả có thật sự đúng', id: 'Tahu apakah hasilnya benar-benar berlaku' },
  f3P: { en: 'For papers with public code, Paperlit re-runs the experiment and shows whether the reported number comes out again.', zh: '对公开代码的论文，Paperlit 会重新运行实验，看报告的数字能否再次得到。', vi: 'Với bài báo có mã công khai, Paperlit chạy lại thí nghiệm và cho thấy con số công bố có xuất hiện lại không.', id: 'Untuk makalah dengan kode terbuka, Paperlit menjalankan ulang eksperimen dan menunjukkan apakah angka yang dilaporkan muncul lagi.' },
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
  allPlans: { en: 'Compare all plans', zh: '比较所有套餐', vi: 'So sánh các gói', id: 'Bandingkan semua paket' },
  faqH: { en: 'Questions people ask', zh: '常见问题', vi: 'Câu hỏi thường gặp', id: 'Pertanyaan umum' },
  faq: {
    en: [['What can I put in?', 'A link to any web page or paper (arXiv, a journal, a blog, a news site), pasted text, or a PDF or .txt file. Lecture videos and podcasts are coming.'], ['How long does a video take?', 'About 4 to 8 minutes. You can close the tab; it keeps going and waits in your library.'], ['How do you stop the AI from making things up?', 'Every quote and number in a video is matched against the source, and anything that does not match is removed. Answers show the page they come from.'], ['Is it free?', 'Yes, to start: 3 welcome videos, then 1 free video every day. Plans add more videos, interactive videos and in-depth answers.'], ['Can my class use it?', 'Yes. Students and teachers get a free month of Plus after sending a proof, and we make custom plans for classes and teams.']],
    zh: [['可以放什么进来？', '任何网页或论文的链接（arXiv、期刊、博客、新闻），粘贴的文字，或 PDF、.txt 文件。课程视频和播客即将支持。'], ['做一个视频要多久？', '大约 4 到 8 分钟。可以关掉页面，它会继续生成并保存在你的视频库里。'], ['怎么防止 AI 编造？', '视频里的每句引文和数字都与原文比对，对不上的会被删掉。回答会标出出处页码。'], ['免费吗？', '可以免费开始：赠送 3 个视频，之后每天 1 个免费视频。套餐提供更多视频、互动视频和深入回答。'], ['班级可以用吗？', '可以。学生和教师提交证明后可免费用 1 个月 Plus，我们也为班级和团队定制方案。']],
    vi: [['Tôi có thể đưa gì vào?', 'Liên kết tới bất kỳ trang web hay bài báo nào (arXiv, tạp chí, blog, báo), văn bản dán vào, hoặc tệp PDF, .txt. Video bài giảng và podcast sắp có.'], ['Làm một video mất bao lâu?', 'Khoảng 4 đến 8 phút. Bạn có thể đóng tab; video vẫn được làm tiếp và chờ trong thư viện.'], ['Làm sao để AI không bịa?', 'Mọi trích dẫn và con số trong video đều được đối chiếu với nguồn, phần nào không khớp sẽ bị loại. Câu trả lời ghi rõ trang nguồn.'], ['Có miễn phí không?', 'Có, để bắt đầu: tặng 3 video, sau đó mỗi ngày 1 video miễn phí. Các gói có thêm video, video tương tác và câu trả lời chuyên sâu.'], ['Lớp học có dùng được không?', 'Được. Sinh viên và giảng viên được tặng 1 tháng Plus sau khi gửi giấy tờ, và chúng tôi có gói riêng cho lớp học, nhóm.']],
    id: [['Apa yang bisa saya masukkan?', 'Tautan ke halaman web atau makalah apa pun (arXiv, jurnal, blog, berita), teks yang ditempel, atau file PDF atau .txt. Video kuliah dan podcast segera hadir.'], ['Berapa lama membuat satu video?', 'Sekitar 4 sampai 8 menit. Anda boleh menutup tab; prosesnya berlanjut dan menunggu di pustaka Anda.'], ['Bagaimana AI dicegah mengarang?', 'Setiap kutipan dan angka di video dicocokkan dengan sumber, dan yang tidak cocok dibuang. Jawaban menunjukkan halaman asalnya.'], ['Apakah gratis?', 'Ya, untuk mulai: 3 video sambutan, lalu 1 video gratis setiap hari. Paket menambah video, video interaktif, dan jawaban mendalam.'], ['Apakah kelas bisa memakainya?', 'Bisa. Mahasiswa dan pengajar dapat 1 bulan Plus gratis setelah mengirim bukti, dan kami membuat paket khusus untuk kelas dan tim.']],
  },
  endH: { en: 'Learn anything, in the way that works for you.', zh: '学任何东西，用最适合你的方式。', vi: 'Học bất cứ điều gì, theo cách hợp với bạn.', id: 'Pelajari apa saja, dengan cara yang cocok untuk Anda.' },
  endP: { en: 'Your first video is free. It takes a link and about five minutes.', zh: '第一个视频免费，只需一个链接和大约五分钟。', vi: 'Video đầu tiên miễn phí. Chỉ cần một liên kết và khoảng năm phút.', id: 'Video pertama gratis. Cukup satu tautan dan sekitar lima menit.' },
  mockQ: { en: 'Why does a residual block make deep networks easier to train?', zh: '为什么残差块让深层网络更容易训练？', vi: 'Vì sao khối residual giúp mạng sâu dễ huấn luyện hơn?', id: 'Mengapa blok residual membuat jaringan dalam lebih mudah dilatih?' },
  mockOpts: { en: ['It adds more layers', 'It lets the signal skip ahead', 'It removes the loss'], zh: ['它增加了更多层', '它让信号可以跳过', '它去掉了损失函数'], vi: ['Nó thêm nhiều lớp hơn', 'Nó cho tín hiệu đi tắt', 'Nó bỏ hàm mất mát'], id: ['Menambah lapisan', 'Sinyal bisa melompat', 'Menghapus fungsi loss'] },
  mockA: { en: 'The shortcut passes the input straight on, so each block only has to learn a small change.', zh: '捷径把输入直接传下去，每个块只需学习一个小的变化。', vi: 'Đường tắt đưa thẳng đầu vào đi tiếp, nên mỗi khối chỉ cần học một thay đổi nhỏ.', id: 'Jalan pintas meneruskan input langsung, jadi tiap blok hanya perlu mempelajari perubahan kecil.' },
  mockPage: { en: 'Page 3', zh: '第 3 页', vi: 'Trang 3', id: 'Halaman 3' },
  mockVerdict: { en: 'Reproduced', zh: '已复现', vi: 'Đã tái lập', id: 'Tereproduksi' },
  mockSteps: { en: ['Code downloaded and set up', 'Experiment run twice from scratch', 'Numbers compared with the paper'], zh: ['下载并配置代码', '从头运行实验两次', '与论文数字对比'], vi: ['Tải và cài đặt mã', 'Chạy thí nghiệm hai lần từ đầu', 'So sánh với số liệu trong bài'], id: ['Kode diunduh dan disiapkan', 'Eksperimen dijalankan dua kali dari awal', 'Angka dibandingkan dengan makalah'] },
};

const EXAMPLES = [
  { id: '6a21030a-b5f8-4c0e-977e-39090d7ebc70', title: 'Deep Residual Learning for Image Recognition', min: 3 },
  { id: 'c91b06ea-3226-4fdf-90ae-1a7a21b9f283', title: 'Language Models are Few-Shot Learners', min: 3 },
  { id: 'ea94b4d8-195f-43b5-a267-72d7ac02bbad', title: 'An Image is Worth 16x16 Words', min: 3 },
  { id: '4c6f43f4-0849-4f95-815e-8c7d5c3b151d', title: 'BERT: Pre-training of Deep Bidirectional Transformers', min: 1 },
  { id: '5420c9c1-a5f6-48b0-a506-10ab1f13d691', title: 'Adam: A Method for Stochastic Optimization', min: 1 },
];
export const posterOf = (id: string) => `https://bryan273.github.io/repro-suite/explainer/examples/${id}/poster0.jpg`;

type Src = 'paper' | 'article' | 'notes' | 'lecture' | 'podcast';
const SRC: Record<Src, { icon: typeof FileText; kind: Record<Lang, string>; title: Record<Lang, string>; soon?: boolean }> = {
  paper: { icon: FileText, kind: { en: 'arXiv 1512.03385', zh: 'arXiv 1512.03385', vi: 'arXiv 1512.03385', id: 'arXiv 1512.03385' }, title: { en: 'Deep Residual Learning', zh: 'Deep Residual Learning', vi: 'Deep Residual Learning', id: 'Deep Residual Learning' } },
  article: { icon: Newspaper, kind: { en: 'A web link', zh: '网页链接', vi: 'Liên kết web', id: 'Tautan web' }, title: { en: 'A blog post or a news story', zh: '一篇博客或新闻', vi: 'Một bài blog hoặc bài báo', id: 'Sebuah blog atau berita' } },
  notes: { icon: StickyNote, kind: { en: 'Pasted text or .txt', zh: '粘贴文字或 .txt', vi: 'Văn bản dán hoặc .txt', id: 'Teks atau .txt' }, title: { en: 'Your lecture notes', zh: '你的课堂笔记', vi: 'Ghi chú bài giảng của bạn', id: 'Catatan kuliah Anda' } },
  lecture: { icon: Video, kind: { en: 'Coming soon', zh: '即将推出', vi: 'Sắp có', id: 'Segera hadir' }, title: { en: 'A recorded lecture', zh: '一段录制的课程', vi: 'Một bài giảng đã ghi hình', id: 'Rekaman kuliah' }, soon: true },
  podcast: { icon: Mic, kind: { en: 'Coming soon', zh: '即将推出', vi: 'Sắp có', id: 'Segera hadir' }, title: { en: 'A podcast episode', zh: '一期播客', vi: 'Một tập podcast', id: 'Satu episode podcast' }, soon: true },
};

function Prism() {
  const { lang, t } = usePrefs();
  const [src, setSrc] = useState<Src>('paper');
  const s = SRC[src];
  const outs = [
    { icon: PlayCircle, h: t(PRODUCT.video), p: t(PRODUCT.videoP), to: '/app/new', main: true },
    { icon: BookOpen, h: t(PRODUCT.text), p: t(PRODUCT.textP), to: '/app/read' },
    { icon: Lightbulb, h: t(PRODUCT.deep), p: t(PRODUCT.deepP), to: '/app/new' },
    { icon: FlaskConical, h: t(PRODUCT.repro), p: t(PRODUCT.reproP), to: '/app/check' },
  ];
  const labels: Record<Src, string> = { paper: t(L.srcPaper), article: t(L.srcArticle), notes: t(L.srcNotes), lecture: t(L.srcLecture), podcast: t(L.srcPodcast) };
  return (
    <div className="pl-card relative mt-14 grid items-center gap-2 p-5 sm:p-7 lg:grid-cols-[0.95fr_150px_1.35fr]">
      <div>
        <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Source">
          {(Object.keys(SRC) as Src[]).map((k) => (
            <button key={k} type="button" aria-pressed={src === k} onClick={() => setSrc(k)}
              className={cn('rounded-full border px-3 py-1.5 text-[13px] font-medium transition', src === k ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {labels[k]}{SRC[k].soon && <span className="ml-1 text-[10px] opacity-75">{t(COMMON.soon)}</span>}
            </button>
          ))}
        </div>
        <div className="relative overflow-hidden rounded-2xl border bg-muted/50 p-5" aria-live="polite">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary"><s.icon className="h-4 w-4" />{s.kind[lang]}</div>
          <p className="mt-2 font-display text-lg font-semibold">{s.title[lang]}</p>
          <div className="mt-4 grid gap-2" aria-hidden>
            {[100, 92, 78, 88, 56].map((w, i) => <span key={i} className={cn('block h-2 rounded-full', i % 2 ? 'bg-lit/80' : 'bg-border')} style={{ width: `${w}%` }} />)}
          </div>
        </div>
      </div>
      <svg viewBox="0 0 150 300" className="mx-auto hidden h-[300px] w-[150px] lg:block" aria-hidden preserveAspectRatio="none">
        <circle cx="6" cy="150" r="6" fill="hsl(var(--lit))" />
        <path className="pl-beam" d="M6 150 C 75 150, 80 38, 148 38" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
        <path className="pl-beam" d="M6 150 C 75 150, 80 112, 148 112" fill="none" stroke="hsl(var(--lit))" strokeWidth="3" strokeLinecap="round" />
        <path className="pl-beam" d="M6 150 C 75 150, 80 188, 148 188" fill="none" stroke="hsl(var(--lit))" strokeWidth="3" strokeLinecap="round" />
        <path className="pl-beam" d="M6 150 C 75 150, 80 262, 148 262" fill="none" stroke="hsl(var(--lit))" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="mx-auto h-8 w-0.5 bg-gradient-to-b from-lit to-primary lg:hidden" aria-hidden />
      <div className="grid gap-2.5">
        {outs.map((o) => (
          <Link key={o.h} to={o.to} className={cn('group grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-2xl border p-3.5 no-underline transition hover:border-primary', o.main && 'border-2 border-primary bg-accent')}>
            <span className={cn('grid h-11 w-11 place-items-center rounded-xl', o.main ? 'bg-primary text-primary-foreground' : 'bg-accent text-primary')}><o.icon className="h-5 w-5" /></span>
            <span className="min-w-0">
              <span className="block font-display text-[15.5px] font-semibold text-foreground">{o.h}</span>
              <span className="block text-[13px] leading-snug text-muted-foreground">{o.p}</span>
            </span>
            {o.main ? <span className="hidden rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground sm:inline">{t(L.start)}</span>
              : <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />}
          </Link>
        ))}
      </div>
    </div>
  );
}

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
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {EXAMPLES.map((e) => (
            <Link key={e.id} to={`/app/v/${e.id}`} className="group w-[240px] shrink-0 snap-start no-underline sm:w-auto">
              <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted">
                <img src={posterOf(e.id)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                <span className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/25"><PlayCircle className="h-10 w-10 text-white opacity-0 drop-shadow transition group-hover:opacity-100" /></span>
                <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">{t(L.min).replace('{n}', String(e.min))}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-[14px] font-medium leading-snug text-foreground">{e.title}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section title={t(L.vH)} sub={t(L.vS)}>
        <ol className="grid border-t-2 border-foreground sm:grid-cols-2 lg:grid-cols-5">
          {pickArr(lang, L.verbs).map(([h, p], i) => (
            <li key={h} className="border-b py-5 pr-5 lg:border-b-0 lg:border-r lg:last:border-r-0 lg:[&:not(:first-child)]:pl-5">
              <span className="text-xs font-semibold text-primary">{String(i + 1).padStart(2, '0')}</span>
              <p className="mt-1 font-display text-lg font-semibold">{h}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p}</p>
            </li>
          ))}
        </ol>
      </Section>

      <section className="pl-container grid gap-6 pt-24 lg:grid-cols-3">
        <Feature title={t(L.f1H)} text={t(L.f1P)}>
          <div className="relative overflow-hidden rounded-xl bg-[#0d0d1a] p-4 text-white">
            <p className="text-[11px] uppercase tracking-wide text-white/60">2 / 4</p>
            <p className="mt-1 text-[13.5px] font-semibold leading-snug">{t(L.mockQ)}</p>
            <div className="mt-3 grid gap-1.5">
              {pickArr(lang, L.mockOpts).map((o, i) => (
                <span key={o} className={cn('flex items-center justify-between rounded-lg border px-3 py-1.5 text-[12.5px]', i === 1 ? 'border-[#3ddc97] bg-[#3ddc97]/15' : 'border-white/15')}>{o}{i === 1 && <Check className="h-3.5 w-3.5 text-[#3ddc97]" />}</span>
              ))}
            </div>
          </div>
        </Feature>
        <Feature title={t(L.f2H)} text={t(L.f2P)}>
          <div className="rounded-xl border bg-muted/40 p-4 text-[13px]">
            <p className="leading-relaxed">{t(L.mockA)}</p>
            <div className="mt-3 flex items-start gap-2 rounded-lg border-l-2 border-primary bg-background p-2.5 text-[12.5px] italic text-muted-foreground"><Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />“we explicitly let these layers fit a residual mapping”</div>
            <span className="mt-2 inline-flex rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-primary">{t(L.mockPage)}</span>
          </div>
        </Feature>
        <Feature title={t(L.f3H)} text={t(L.f3P)}>
          <div className="rounded-xl border bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-success"><span className="grid h-6 w-6 place-items-center rounded-full bg-success/15"><Check className="h-3.5 w-3.5" /></span>{t(L.mockVerdict)}</div>
            <p className="mt-2 text-[13px] font-medium">Stochastic Voronoi Ensembles for Anomaly Detection</p>
            <ul className="mt-3 grid gap-1.5 text-[12.5px] text-muted-foreground">
              {pickArr(lang, L.mockSteps).map((x) => <li key={x} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" />{x}</li>)}
            </ul>
          </div>
        </Feature>
      </section>

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <Link key={p.k} to="/pricing" className={cn('pl-card block p-5 no-underline transition hover:-translate-y-0.5', p.k === 'plus' && 'border-primary ring-1 ring-primary')}>
              <p className="text-sm font-semibold text-muted-foreground">{p.name}</p>
              <p className="mt-2 font-display text-2xl font-bold text-foreground">{p.price}<span className="ml-1 text-sm font-normal text-muted-foreground">{p.k !== 'free' && t(L.perMonth)}</span></p>
              <p className="mt-1 text-sm text-muted-foreground">{p.line}</p>
            </Link>
          ))}
        </div>
        <Button asChild variant="outline" className="mt-6"><Link to="/pricing">{t(L.allPlans)}<ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
      </Section>

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

function Feature({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="pl-card flex flex-col p-6">
      {children}
      <h3 className="mt-6 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

function pickArr<T>(lang: Lang, v: Record<Lang, T>): T { return v[lang] ?? v.en; }
