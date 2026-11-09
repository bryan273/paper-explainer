import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, FileText, Link2, Loader2, Lock, Sparkles, Type, Upload, X, Clock, Lightbulb, CheckCircle2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ApiError, createJob, lookupPaper, uploadPaper, localPdfs, MAX_PDF_BYTES, MAX_PDF_FILES, TONES, type Job, type MakeOpts } from '@/lib/explainer';
import { PURPOSE, useSettings } from '@/lib/settings';
import { track, useAccount } from '@/lib/account';
import { fill, usePrefs, type Lang, pick, type Tr } from '@/lib/prefs';
import { cn } from '@/lib/utils';

const T = {
  h: { en: 'Make a video', zh: '制作视频', vi: 'Tạo video', id: 'Buat video' },
  s: { en: 'Give Paperlit one source. You get a narrated video with chapters, questions and answers you can trace to the page.', zh: '给 Paperlit 一份资料，得到带章节、可提问、能追溯页码的讲解视频。', vi: 'Đưa cho Paperlit một nguồn. Bạn nhận được video có lời dẫn, chia chương, câu hỏi và câu trả lời có thể truy dấu đến trang.', id: 'Beri Paperlit satu sumber. Anda dapat video bernarasi dengan bab, pertanyaan, dan jawaban yang bisa dilacak ke halamannya.' },
  step1: { en: '1. Your source', zh: '1. 资料来源', vi: '1. Nguồn của bạn', id: '1. Sumber Anda' },
  step2: { en: '2. Video settings', zh: '2. 视频设置', vi: '2. Cài đặt video', id: '2. Pengaturan video' },
  step3: { en: '3. Interactive mode', zh: '3. 互动模式', vi: '3. Chế độ tương tác', id: '3. Mode interaktif' },
  link: { en: 'Link', zh: '链接', vi: 'Liên kết', id: 'Tautan' },
  text: { en: 'Paste text', zh: '粘贴文字', vi: 'Dán văn bản', id: 'Tempel teks' },
  file: { en: 'Upload file', zh: '上传文件', vi: 'Tải tệp', id: 'Unggah berkas' },
  linkPh: { en: 'https://arxiv.org/abs/1706.03762 or any article link', zh: 'https://arxiv.org/abs/1706.03762 或任意文章链接', vi: 'https://arxiv.org/abs/1706.03762 hoặc liên kết bài viết bất kỳ', id: 'https://arxiv.org/abs/1706.03762 atau tautan artikel apa pun' },
  linkHelp: { en: 'arXiv, a PDF link, a DOI, a journal, a blog, a news page: any page whose text opens without a login.', zh: 'arXiv、PDF 链接、DOI、期刊、博客、新闻：任何无需登录就能看到正文的页面。', vi: 'arXiv, liên kết PDF, DOI, tạp chí, blog, trang báo: bất kỳ trang nào xem được nội dung mà không cần đăng nhập.', id: 'arXiv, tautan PDF, DOI, jurnal, blog, berita: halaman apa pun yang teksnya terbuka tanpa login.' },
  tryThese: { en: 'Try one:', zh: '试试：', vi: 'Thử:', id: 'Coba:' },
  textPh: { en: 'Paste an article, lecture notes, a chapter or a report…', zh: '粘贴文章、讲义、章节或报告…', vi: 'Dán bài viết, ghi chú bài giảng, một chương hoặc báo cáo…', id: 'Tempel artikel, catatan kuliah, bab, atau laporan…' },
  textCount: { en: '{n} characters · at least 300', zh: '{n} 个字符 · 至少 300', vi: '{n} ký tự · ít nhất 300', id: '{n} karakter · minimal 300' },
  drop: { en: 'Drop files here or choose', zh: '拖入文件或点击选择', vi: 'Kéo thả tệp vào đây hoặc chọn', id: 'Seret berkas ke sini atau pilih' },
  dropHelp: { en: 'PDF, TXT or Markdown · up to {n} files · {mb} MB each · one video per file', zh: 'PDF、TXT 或 Markdown · 最多 {n} 个 · 每个 {mb} MB · 每个文件一个视频', vi: 'PDF, TXT hoặc Markdown · tối đa {n} tệp · {mb} MB mỗi tệp · mỗi tệp một video', id: 'PDF, TXT, atau Markdown · hingga {n} berkas · {mb} MB per berkas · satu video per berkas' },
  badFile: { en: '{name}: use a PDF, TXT or Markdown file under {mb} MB.', zh: '{name}：请使用小于 {mb} MB 的 PDF、TXT 或 Markdown。', vi: '{name}: dùng tệp PDF, TXT hoặc Markdown dưới {mb} MB.', id: '{name}: gunakan PDF, TXT, atau Markdown di bawah {mb} MB.' },
  vlang: { en: 'Video language', zh: '视频语言', vi: 'Ngôn ngữ video', id: 'Bahasa video' },
  length: { en: 'Length', zh: '时长', vi: 'Độ dài', id: 'Durasi' },
  tone: { en: 'Style of explaining', zh: '讲解风格', vi: 'Cách giải thích', id: 'Gaya penjelasan' },
  voice: { en: 'Voice', zh: '声音', vi: 'Giọng đọc', id: 'Suara' },
  female: { en: 'Female', zh: '女声', vi: 'Nữ', id: 'Perempuan' },
  male: { en: 'Male', zh: '男声', vi: 'Nam', id: 'Laki-laki' },
  min: { en: '{n} min', zh: '{n} 分钟', vi: '{n} phút', id: '{n} menit' },
  proOnly: { en: 'Longer than 5 minutes is part of Pro and Premium.', zh: '超过 5 分钟需要 Pro 或 Premium。', vi: 'Video dài hơn 5 phút dành cho Pro và Premium.', id: 'Lebih dari 5 menit untuk Pro dan Premium.' },
  plusOnly: { en: 'Longer than 3 minutes is part of Plus and above.', zh: '超过 3 分钟需要 Plus 及以上套餐。', vi: 'Video dài hơn 3 phút dành cho gói Plus trở lên.', id: 'Lebih dari 3 menit untuk Plus ke atas.' },
  costTwo: { en: 'A video longer than 5 minutes counts as 2 videos.', zh: '超过 5 分钟的视频按 2 个计算。', vi: 'Video dài hơn 5 phút được tính là 2 video.', id: 'Video lebih dari 5 menit dihitung 2 video.' },
  custom: { en: 'Anything to focus on? (optional)', zh: '有想重点讲的吗？（可选）', vi: 'Muốn tập trung vào điều gì? (không bắt buộc)', id: 'Ada yang ingin difokuskan? (opsional)' },
  customPh: { en: 'e.g. focus on the experiments, skip the maths, explain for a first-year student', zh: '例如：重点讲实验，跳过数学，按大一学生的水平讲', vi: 'vd: tập trung vào thí nghiệm, bỏ qua phần toán, giải thích cho sinh viên năm nhất', id: 'mis. fokus pada eksperimen, lewati matematika, jelaskan untuk mahasiswa tahun pertama' },
  interOn: { en: 'Stop after each part and ask me a question', zh: '每段结束后暂停并提问', vi: 'Dừng sau mỗi phần và hỏi tôi một câu', id: 'Berhenti setiap bagian dan beri saya pertanyaan' },
  interHelp: { en: 'About 4 questions per video, with the explanation ready at once. You can also turn it on later while watching.', zh: '每个视频约 4 题，作答后立即看到讲解。观看时也可以再打开。', vi: 'Khoảng 4 câu mỗi video, có lời giải thích ngay. Bạn cũng có thể bật sau khi xem.', id: 'Sekitar 4 pertanyaan per video, penjelasannya langsung siap. Bisa juga dinyalakan nanti saat menonton.' },
  interLeft: { en: 'Interactive mode left: {n} of {c}', zh: '剩余互动模式次数：{n} / {c}', vi: 'Lượt tương tác còn lại: {n}/{c}', id: 'Sisa mode interaktif: {n} dari {c}' },
  make: { en: 'Make video', zh: '开始制作', vi: 'Tạo video', id: 'Buat video' },
  makeN: { en: 'Make {n} videos', zh: '制作 {n} 个视频', vi: 'Tạo {n} video', id: 'Buat {n} video' },
  uploading: { en: 'Uploading {i} of {n}…', zh: '正在上传 {i} / {n}…', vi: 'Đang tải lên {i}/{n}…', id: 'Mengunggah {i} dari {n}…' },
  cost: { en: 'Uses {u} of your {left} videos. Failed videos are refunded.', zh: '将使用 {u} 个（剩余 {left} 个）。失败自动退还。', vi: 'Dùng {u} trong {left} video còn lại. Video lỗi được hoàn lại.', id: 'Memakai {u} dari {left} video Anda. Video gagal dikembalikan.' },
  costGuest: { en: 'Guests can make 1 video a day. Sign up free for 3 more.', zh: '访客每天可做 1 个视频，免费注册再送 3 个。', vi: 'Khách được tạo 1 video mỗi ngày. Đăng ký miễn phí để có thêm 3.', id: 'Tamu bisa membuat 1 video per hari. Daftar gratis untuk 3 lagi.' },
  empty: { en: 'Add a link, paste at least 300 characters, or choose a file.', zh: '请填写链接、粘贴至少 300 个字符或选择文件。', vi: 'Hãy thêm liên kết, dán ít nhất 300 ký tự hoặc chọn tệp.', id: 'Tambahkan tautan, tempel minimal 300 karakter, atau pilih berkas.' },
  exists: { en: 'This source already has a video.', zh: '这份资料已经有视频了。', vi: 'Nguồn này đã có video.', id: 'Sumber ini sudah punya video.' },
  open: { en: 'Open it', zh: '打开', vi: 'Mở', id: 'Buka' },
  newAnyway: { en: 'Making a new one with your settings.', zh: '将按你的设置新做一个。', vi: 'Sẽ tạo video mới theo cài đặt của bạn.', id: 'Akan membuat yang baru dengan pengaturan Anda.' },
  limitGuest: { en: 'You used the free guest video for today.', zh: '今天的访客免费视频已用完。', vi: 'Bạn đã dùng hết video miễn phí của khách hôm nay.', id: 'Video gratis tamu hari ini sudah terpakai.' },
  limitMember: { en: 'Your free videos for this week are used. Choose a plan or buy a few videos to keep going.', zh: '本周的免费视频已用完。选择套餐或购买视频即可继续。', vi: 'Bạn đã dùng hết video miễn phí của tuần này. Hãy chọn một gói hoặc mua thêm video để tiếp tục.', id: 'Video gratis minggu ini sudah terpakai. Pilih paket atau beli beberapa video untuk lanjut.' },
  signup: { en: 'Sign up free', zh: '免费注册', vi: 'Đăng ký miễn phí', id: 'Daftar gratis' },
  plans: { en: 'See plans', zh: '查看套餐', vi: 'Xem các gói', id: 'Lihat paket' },
  network: { en: 'Could not reach the server. Check your connection and try again.', zh: '连不上服务器，请检查网络后重试。', vi: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.', id: 'Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.' },
  uploadFail: { en: 'The file could not be uploaded. Try again or use a smaller file.', zh: '文件上传失败，请重试或换小一点的文件。', vi: 'Không tải được tệp. Thử lại hoặc dùng tệp nhỏ hơn.', id: 'Berkas gagal diunggah. Coba lagi atau pakai berkas lebih kecil.' },
  // guide
  gH: { en: 'How to get a great video', zh: '如何做出好视频', vi: 'Cách có một video thật tốt', id: 'Cara mendapat video yang bagus' },
  g: {
    en: [['Pick one clear source', 'One paper, one article or one chapter. The video follows its structure, so a focused source gives a focused video.'], ['Choose the language you learn in', 'The source can be in any language. The narration, captions and questions come out in the language you pick.'], ['Match the length to the goal', '1 to 2 minutes for the gist, 3 to 5 minutes to really learn it, up to 10 minutes (Pro) for long papers.'], ['Say what you care about', 'One line such as "focus on the method" or "explain for a beginner" changes the whole script.'], ['Turn on interactive video to remember it', 'The video stops after each part with one question. Answering makes the idea stick.']],
    zh: [['选一份清晰的资料', '一篇论文、一篇文章或一个章节。视频会沿用它的结构，资料越聚焦，视频越清楚。'], ['选你学习用的语言', '资料可以是任何语言，旁白、字幕和题目都会用你选的语言。'], ['按目标选时长', '1 到 2 分钟看要点，3 到 5 分钟真正学会，长论文最多 10 分钟（Pro）。'], ['说出你关心什么', '一句“重点讲方法”或“按初学者讲”就会改变整个讲稿。'], ['打开互动视频帮助记忆', '每段结束暂停问一题，作答能让知识点记得更牢。']],
    vi: [['Chọn một nguồn rõ ràng', 'Một bài báo, một bài viết hoặc một chương. Video đi theo cấu trúc của nguồn, nên nguồn càng tập trung thì video càng rõ.'], ['Chọn ngôn ngữ bạn học', 'Nguồn có thể ở bất kỳ ngôn ngữ nào. Lời dẫn, phụ đề và câu hỏi sẽ theo ngôn ngữ bạn chọn.'], ['Chọn độ dài theo mục tiêu', '1 đến 2 phút để nắm ý chính, 3 đến 5 phút để học thật, tới 10 phút (Pro) cho bài dài.'], ['Nói điều bạn quan tâm', 'Một câu như "tập trung vào phương pháp" hay "giải thích cho người mới" sẽ thay đổi cả kịch bản.'], ['Bật video tương tác để nhớ lâu', 'Video dừng sau mỗi phần với một câu hỏi. Trả lời giúp kiến thức đọng lại.']],
    id: [['Pilih satu sumber yang jelas', 'Satu makalah, satu artikel, atau satu bab. Video mengikuti strukturnya, jadi sumber yang fokus memberi video yang fokus.'], ['Pilih bahasa belajar Anda', 'Sumber boleh berbahasa apa saja. Narasi, teks, dan pertanyaan keluar dalam bahasa yang Anda pilih.'], ['Sesuaikan durasi dengan tujuan', '1 sampai 2 menit untuk inti, 3 sampai 5 menit untuk benar-benar belajar, hingga 10 menit (Pro) untuk makalah panjang.'], ['Sebutkan yang Anda pedulikan', 'Satu kalimat seperti "fokus pada metode" atau "jelaskan untuk pemula" mengubah seluruh naskah.'], ['Nyalakan video interaktif agar ingat', 'Video berhenti setiap bagian dengan satu pertanyaan. Menjawab membuat konsep melekat.']],
  },
  nextH: { en: 'What happens next', zh: '接下来会怎样', vi: 'Tiếp theo sẽ thế nào', id: 'Apa yang terjadi selanjutnya' },
  next: {
    en: ['Making takes about 4 to 8 minutes. You can watch the parts appear.', 'You can close the tab: it keeps going and waits in your Library.', 'If a link cannot be read, you are told in the first minute and nothing is used.'],
    zh: ['制作约需 4 到 8 分钟，可以看到章节逐个完成。', '可以关掉页面，它会继续生成并保存在视频库里。', '如果链接无法读取，第一分钟内就会提示，不扣次数。'],
    vi: ['Quá trình tạo mất khoảng 4 đến 8 phút. Bạn có thể xem từng phần hiện ra.', 'Bạn có thể đóng tab: video vẫn được làm tiếp và chờ trong Thư viện.', 'Nếu không đọc được liên kết, bạn sẽ được báo trong phút đầu và không mất lượt.'],
    id: ['Pembuatan sekitar 4 sampai 8 menit. Anda bisa melihat bagian-bagiannya muncul.', 'Anda boleh menutup tab: proses berlanjut dan menunggu di Pustaka.', 'Jika tautan tidak bisa dibaca, Anda diberi tahu di menit pertama dan tidak ada yang terpakai.'],
  },
  guide: { en: 'Read the full guide', zh: '查看完整指南', vi: 'Xem hướng dẫn đầy đủ', id: 'Baca panduan lengkap' },
};
type VLang = 'en' | 'zh' | 'vi' | 'id';
const TONE_L: Record<(typeof TONES)[number], Tr<[string, string]>> = {
  teacher: { en: ['Clear teacher', 'Step by step, like a good lecture'], zh: ['清晰讲师', '像一堂好课，循序渐进'], vi: ['Giảng viên rõ ràng', 'Từng bước, như một bài giảng hay'], id: ['Pengajar jelas', 'Langkah demi langkah, seperti kuliah yang baik'] },
  casual: { en: 'Friendly chat|Relaxed, everyday words'.split('|') as [string, string], zh: ['轻松聊天', '轻松、日常的语言'], vi: ['Trò chuyện thân thiện', 'Thoải mái, lời lẽ đời thường'], id: ['Obrolan santai', 'Santai, kata sehari-hari'] },
  academic: { en: ['Academic', 'Precise terms, for researchers'], zh: ['学术', '术语准确，适合研究者'], vi: ['Học thuật', 'Thuật ngữ chính xác, cho nhà nghiên cứu'], id: ['Akademis', 'Istilah tepat, untuk peneliti'] },
  eli5: { en: ['For beginners', 'No jargon, everyday examples'], zh: ['给初学者', '不用术语，举生活例子'], vi: ['Cho người mới', 'Không thuật ngữ, ví dụ đời thường'], id: ['Untuk pemula', 'Tanpa jargon, contoh sehari-hari'] },
  story: { en: ['Story', 'Told as the story of the idea'], zh: ['故事', '把想法当故事讲'], vi: ['Kể chuyện', 'Kể như câu chuyện của ý tưởng'], id: ['Cerita', 'Diceritakan sebagai kisah idenya'] },
};
const EXAMPLES = [
  { label: 'arXiv 1706.03762', v: 'https://arxiv.org/abs/1706.03762' },
  { label: 'Wikipedia: Photosynthesis', v: 'https://en.wikipedia.org/wiki/Photosynthesis' },
  { label: 'arXiv 2005.14165', v: 'https://arxiv.org/abs/2005.14165' },
];
const LENS = [60, 120, 180, 300, 420, 600];
const looksLikeLink = (v: string) => /\d{4}\.\d{4,5}|^https?:\/\/\S+\.\S+|^10\.\d{4,9}\//.test(v.trim());

export default function NewVideo() {
  const { lang, t } = usePrefs();
  const { user, me, quota, refresh, openAuth } = useAccount();
  const nav = useNavigate();
  const [qs] = useSearchParams();
  const [pset] = useSettings();
  const [tab, setTab] = useState<'link' | 'text' | 'file'>(qs.get('tab') === 'text' ? 'text' : qs.get('tab') === 'file' ? 'file' : 'link');
  const [link, setLink] = useState(qs.get('url') ?? '');
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileErr, setFileErr] = useState('');
  const vOf = (l: Lang): VLang => (l === 'zh' || l === 'vi' || l === 'id' ? l : 'en');
  const [vlang, setVlang] = useState<VLang>(vOf(lang));
  const [seconds, setSeconds] = useState<number>(pset.purpose ? PURPOSE[pset.purpose].seconds : 180);
  const [tone, setTone] = useState<MakeOpts['tone']>(pset.purpose ? PURPOSE[pset.purpose].tone : 'teacher');
  const [voice, setVoice] = useState<MakeOpts['voice']>('female');
  const [custom, setCustom] = useState('');
  const [inter, setInter] = useState(() => { try { return localStorage.getItem('pe-interactive') === '1'; } catch { return false; } });
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [limit, setLimit] = useState<null | 'guest' | 'member' | 'length' | 'lengthPlus'>(null);
  const [existing, setExisting] = useState<Job[]>([]);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pro = me?.admin || me?.plan === 'pro' || me?.plan === 'premium';
  const plus = pro || me?.plan === 'plus';
  // free: up to 3 minutes; Plus: 5; Pro and Premium: 10
  const maxSec = pro ? 600 : plus ? 300 : 180;
  const left = (quota?.day_left ?? 0) + (user?.credits ?? 0);
  const units = (seconds <= 300 ? 1 : 2) * (tab === 'file' ? Math.max(1, files.length) : 1);
  const MB = MAX_PDF_BYTES / 1024 / 1024;

  useEffect(() => { setVlang(vOf(lang)); }, [lang]);
  useEffect(() => {
    const v = link.trim();
    if (tab !== 'link' || !looksLikeLink(v)) { setExisting([]); return; }
    let alive = true;
    const id = window.setTimeout(() => { lookupPaper(v).then((l) => alive && setExisting(l.filter((j) => j.status === 'done'))).catch(() => alive && setExisting([])); }, 600);
    return () => { alive = false; window.clearTimeout(id); };
  }, [link, tab]);

  const addFiles = (list: FileList | File[]) => {
    const next = [...files]; let e = '';
    for (const f of Array.from(list)) {
      if (!(f.type === 'application/pdf' || /\.(pdf|txt|md)$/i.test(f.name)) || f.size > MAX_PDF_BYTES) { e = fill(t(T.badFile), { name: f.name, mb: MB }); continue; }
      if (next.some((x) => x.name === f.name && x.size === f.size)) continue;
      if (next.length >= MAX_PDF_FILES) break;
      next.push(f);
    }
    setFiles(next); setFileErr(e);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setLimit(null);
    if ((tab === 'link' && !link.trim()) || (tab === 'text' && text.trim().length < 300) || (tab === 'file' && !files.length)) { setErr(t(T.empty)); return; }
    if (seconds > maxSec) { setLimit(seconds > 300 ? 'length' : 'lengthPlus'); return; }
    track('click_make', { tab, seconds, vlang });
    const opts: MakeOpts = { voice, style: 'animated', tone, seconds, custom: custom.trim(), langs: vlang };
    const made: Job[] = [];
    try {
      if (tab === 'link') {
        setBusy('make');
        made.push(await createJob(link.trim(), { ...opts, force_new: existing.length > 0 }));
      } else if (tab === 'text') {
        setBusy('make');
        const title = text.trim().split('\n')[0].slice(0, 80);
        const path = await uploadPaper(new Blob([text.trim()], { type: 'text/plain' }), title);
        made.push(await createJob('', { ...opts, force_new: true, upload: path, name: title }));
      } else {
        for (let i = 0; i < files.length; i++) {
          setBusy(fill(t(T.uploading), { i: i + 1, n: files.length }));
          const path = await uploadPaper(files[i]);
          const j = await createJob('', { ...opts, force_new: true, upload: path, name: files[i].name });
          localPdfs.set(j.id, URL.createObjectURL(files[i]));
          made.push(j);
        }
      }
    } catch (x) {
      if (x instanceof ApiError && x.code === 'quota_guest') setLimit('guest');
      else if (x instanceof ApiError && x.code === 'quota_member') setLimit('member');
      else if (x instanceof ApiError && x.code === 'length_pro') setLimit('length');
      else if (x instanceof ApiError && x.code === 'length_plus') setLimit('lengthPlus');
      else if (x instanceof ApiError && x.code === 'upload_failed') setErr(t(T.uploadFail));
      else setErr(x instanceof ApiError ? x.message : t(T.network));
    } finally { setBusy(null); }
    if (!made.length) return;
    try {
      localStorage.setItem('pe-interactive', inter ? '1' : '0');
      for (const j of made) { localStorage.setItem(`pe-inter:${j.id}`, inter ? '1' : '0'); if (j.status !== 'done' && j.status !== 'failed') localStorage.setItem('pe-active-job', j.id); }
    } catch { /* private mode */ }
    refresh();
    nav(made.length > 1 ? '/app/library' : `/app/v/${made[0].id}`);
  };

  const seg = (on: boolean) => cn('rounded-lg border px-3 py-2 text-sm font-medium transition', on ? 'border-primary bg-accent text-primary' : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground');
  const card = 'pl-card p-5 sm:p-6';
  const tabs = useMemo(() => [{ k: 'link' as const, icon: Link2, label: t(T.link) }, { k: 'text' as const, icon: Type, label: t(T.text) }, { k: 'file' as const, icon: Upload, label: t(T.file) }], [t]);
  const it = me?.interactive;

  return (
    <div className="mx-auto max-w-6xl py-8">
      <h1 className="font-display text-3xl font-bold">{t(T.h)}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{t(T.s)}</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={submit} className="grid content-start gap-5">
          <section className={card} aria-labelledby="s1">
            <h2 id="s1" className="font-display text-lg font-semibold">{t(T.step1)}</h2>
            <div className="mt-4 inline-flex rounded-xl bg-muted p-1" role="tablist" data-g="src-tabs">
              {tabs.map((x) => (
                <button key={x.k} data-g={`tab-${x.k}`} type="button" role="tab" aria-selected={tab === x.k} onClick={() => { setTab(x.k); setErr(''); }}
                  className={cn('flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition', tab === x.k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                  <x.icon className="h-4 w-4" />{x.label}
                </button>
              ))}
            </div>
            <div className="mt-4">
              {tab === 'link' && (
                <div className="grid gap-2">
                  <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder={t(T.linkPh)} inputMode="url" aria-label={t(T.link)} className="h-12 text-[15px]" />
                  <p className="text-sm text-muted-foreground">{t(T.linkHelp)}</p>
                  <div data-g="examples" className="flex flex-wrap items-center gap-2 text-sm"><span className="text-muted-foreground">{t(T.tryThese)}</span>
                    {EXAMPLES.map((x) => <button key={x.v} type="button" onClick={() => setLink(x.v)} className="rounded-full border px-2.5 py-1 text-xs hover:border-primary hover:text-primary">{x.label}</button>)}
                  </div>
                  {existing.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-accent px-4 py-3 text-sm">
                      <PlayCircle className="h-5 w-5 text-primary" />
                      <span className="flex-1">{t(T.exists)} <span className="text-muted-foreground">{t(T.newAnyway)}</span></span>
                      <Button asChild size="sm" variant="outline"><Link to={`/app/v/${existing[0].id}`}>{t(T.open)}</Link></Button>
                    </div>
                  )}
                </div>
              )}
              {tab === 'text' && (
                <div className="grid gap-2">
                  <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t(T.textPh)} rows={9} maxLength={60000} aria-label={t(T.text)} className="text-[15px]" />
                  <p className={cn('text-sm', text.trim().length >= 300 ? 'text-success' : 'text-muted-foreground')}>{fill(t(T.textCount), { n: text.trim().length })}</p>
                </div>
              )}
              {tab === 'file' && (
                <div className="grid gap-3">
                  <input ref={fileRef} type="file" multiple accept=".pdf,.txt,.md,application/pdf,text/plain" hidden onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
                  <button type="button" onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
                    className={cn('grid place-items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition', drag ? 'border-primary bg-accent' : 'hover:border-primary/60')}>
                    <Upload className="h-7 w-7 text-primary" />
                    <span className="font-medium">{t(T.drop)}</span>
                    <span className="text-xs text-muted-foreground">{fill(t(T.dropHelp), { n: MAX_PDF_FILES, mb: MB })}</span>
                  </button>
                  {files.map((f, i) => (
                    <div key={f.name + i} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
                      <FileText className="h-4 w-4 text-primary" /><span className="flex-1 truncate">{f.name}</span><span className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                      <button type="button" onClick={() => setFiles(files.filter((_, k) => k !== i))} aria-label="Remove" className="rounded p-1 text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                  {fileErr && <p className="text-sm text-destructive">{fileErr}</p>}
                </div>
              )}
            </div>
          </section>

          <section className={card} aria-labelledby="s2">
            <h2 id="s2" className="font-display text-lg font-semibold">{t(T.step2)}</h2>
            <div className="mt-5 grid gap-6">
              <div>
                <p className="mb-2 text-sm font-medium">{t(T.vlang)}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(['en', 'zh', 'vi', 'id'] as VLang[]).map((l) => <button key={l} type="button" aria-pressed={vlang === l} onClick={() => setVlang(l)} className={seg(vlang === l)}>{{ en: 'English', zh: '中文', vi: 'Tiếng Việt', id: 'Bahasa Indonesia' }[l]}</button>)}
                </div>
              </div>
              <div data-g="length">
                <p className="mb-2 text-sm font-medium">{t(T.length)}</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {LENS.map((n) => {
                    const locked = n > maxSec;
                    return <button key={n} type="button" aria-pressed={seconds === n} onClick={() => setSeconds(n)} className={cn(seg(seconds === n), 'flex items-center justify-center gap-1')}>{fill(t(T.min), { n: n / 60 })}{locked && <Lock className="h-3 w-3" />}</button>;
                  })}
                </div>
                {seconds > 300 && !pro && <p className="mt-2 text-xs text-warning">{t(T.proOnly)} <Link to="/pricing" className="font-semibold underline">{t(T.plans)}</Link></p>}
              </div>
              <div data-g="tone">
                <p className="mb-2 text-sm font-medium">{t(T.tone)}</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {TONES.map((k) => (
                    <button key={k} type="button" aria-pressed={tone === k} onClick={() => setTone(k)} className={cn('rounded-xl border p-3 text-left transition', tone === k ? 'border-primary bg-accent' : 'hover:border-foreground/30')}>
                      <span className={cn('block text-sm font-semibold', tone === k && 'text-primary')}>{pick(lang, TONE_L[k])[0]}</span>
                      <span className="block text-xs text-muted-foreground">{pick(lang, TONE_L[k])[1]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">{t(T.voice)}</p>
                <div className="inline-grid grid-cols-2 gap-2">{(['female', 'male'] as const).map((v) => <button key={v} type="button" aria-pressed={voice === v} onClick={() => setVoice(v)} className={cn(seg(voice === v), 'min-w-[110px]')}>{t(T[v])}</button>)}</div>
              </div>
              <div>
                <label htmlFor="pl-custom" className="mb-2 block text-sm font-medium">{t(T.custom)}</label>
                <Input id="pl-custom" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={t(T.customPh)} maxLength={300} />
              </div>
            </div>
          </section>

          <section className={card} aria-labelledby="s3" data-g="interactive">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h2 id="s3" className="font-display text-lg font-semibold">{t(T.step3)}</h2>
                <p className="mt-1 text-sm font-medium">{t(T.interOn)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t(T.interHelp)}</p>
                {it && !me?.admin && <p className={cn('mt-2 text-xs font-semibold', it.left ? 'text-primary' : 'text-destructive')}>{fill(t(T.interLeft), { n: it.left, c: it.cap })}</p>}
              </div>
              <Switch checked={inter} onCheckedChange={setInter} aria-label={t(T.step3)} />
            </div>
          </section>

          {limit && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm" role="alert">
              <AlertCircle className="h-5 w-5 text-warning" />
              <span className="flex-1 font-medium">{limit === 'guest' ? t(T.limitGuest) : limit === 'member' ? t(T.limitMember) : limit === 'lengthPlus' ? t(T.plusOnly) : t(T.proOnly)}</span>
              {limit === 'guest' ? <Button size="sm" onClick={() => openAuth('register')}>{t(T.signup)}</Button> : <Button asChild size="sm"><Link to="/pricing">{t(T.plans)}</Link></Button>}
            </div>
          )}
          {err && <p className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{err}</p>}

          <div data-g="make" className="sticky bottom-[68px] z-10 flex flex-col gap-3 rounded-2xl border bg-background/95 p-4 backdrop-blur sm:flex-row sm:items-center lg:bottom-4">
            <p className="flex-1 text-sm text-muted-foreground">{!user ? t(T.costGuest) : me?.admin ? '' : fill(t(T.cost), { u: units, left })}</p>
            <Button type="submit" size="lg" disabled={!!busy} className="sm:min-w-[200px]">
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{busy !== 'make' ? busy : ''}</> : <><Sparkles className="mr-2 h-4 w-4" />{tab === 'file' && files.length > 1 ? fill(t(T.makeN), { n: files.length }) : t(T.make)}</>}
            </Button>
          </div>
        </form>

        <aside className="grid content-start gap-5 lg:sticky lg:top-20">
          <section className="pl-card p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold"><Lightbulb className="h-4 w-4 text-lit" />{t(T.gH)}</h2>
            <ol className="mt-4 grid gap-4">
              {pick(lang, T.g).map(([h, p], i) => (
                <li key={h} className="grid grid-cols-[24px_1fr] gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-xs font-bold text-primary">{i + 1}</span>
                  <span><span className="block text-sm font-semibold">{h}</span><span className="block text-[13px] leading-relaxed text-muted-foreground">{p}</span></span>
                </li>
              ))}
            </ol>
          </section>
          <section className="pl-card p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold"><Clock className="h-4 w-4 text-primary" />{t(T.nextH)}</h2>
            <ul className="mt-3 grid gap-2.5">
              {pick(lang, T.next).map((x) => <li key={x} className="flex gap-2 text-[13px] text-muted-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{x}</li>)}
            </ul>
            <Link to="/help" className="mt-4 inline-block text-sm font-medium text-primary no-underline hover:underline">{t(T.guide)}</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
