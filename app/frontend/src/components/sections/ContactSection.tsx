import { useEffect, useState, type FormEvent } from 'react';
import { accountApi, useAcctText } from '@/lib/account';
import { usePrefs } from '@/lib/prefs';

const FAQ: Record<'en' | 'zh' | 'vi' | 'id', [string, string][]> = {
  en: [
    ['How long does a video take?', 'About 5 to 10 minutes for a 3 minute video. You see each section as soon as it is ready, so you can start watching before the whole video is done. You can close the page: it keeps going and is waiting for you when you come back.'],
    ['What can I turn into a video?', 'An arXiv link, a PDF, a DOI, any web page with text in it, text you paste, or a PDF, TXT or Markdown file. It works for papers, but also for articles, lessons and reports.'],
    ['Can I change the style or length?', 'Pick the length (1 to 5 minutes, up to 10 with Pro), the language, the voice and the teaching tone. In "Context and instructions" you can ask for anything: focus on the experiments, skip the maths, explain it to a high-school student.'],
    ['Is it accurate?', 'Quotes and numbers are checked against the source and removed if they do not match. AI can still slip, so check important claims in the original.'],
    ['What is interactive mode?', 'The video stops after each part and asks one question, and you answer inside the video. Your answers, a score and a final quiz are kept in the Quiz tab. It is off until you switch it on. Each video you turn it on for counts once a month: 2 free, 10 with Plus, 30 with Pro, 80 with Premium.'],
    ['How do free videos and credits work?', 'Every free account gets 1 video a day plus 3 welcome videos. After that, credits are spent (a video up to 3 minutes costs 1 credit). Credits never expire. Plus gives 50 videos a month, Pro 120 and Premium 250.'],
    ['How do I pay?', 'Choose a plan or a credit pack. In China pay with WeChat Pay or Alipay, in Vietnam by bank transfer with VietQR. In Indonesia contact us for the payment details. We confirm by hand, usually within a day.'],
    ['Can I share or post the videos?', 'Yes. Use "Share this video" for a link, or download the 16:9 and 9:16 files for Douyin, Xiaohongshu, TikTok or YouTube. Credit the original source.'],
  ],
  zh: [
    ['一个视频要多久？', '3 分钟的视频大约 5 到 10 分钟。每个章节做好就能先看，不用等整支视频完成。你可以关掉页面，它会继续生成，回来就能看到。'],
    ['什么内容可以做成视频？', 'arXiv 链接、PDF、DOI、任何有正文的网页、粘贴的文字，或 PDF、TXT、Markdown 文件。适用于论文，也适用于文章、课程和报告。'],
    ['能改风格和时长吗？', '可选时长（1 到 5 分钟，Pro 最长 10 分钟）、语言、声音和讲解语气。在"背景与要求"里可以随意提要求：重点讲实验、少讲公式、讲给高中生听。'],
    ['准确吗？', '引文和数字会对照原文核对，不一致就删除。AI 仍可能出错，重要结论请回到原文核实。'],
    ['什么是互动模式？', '视频每段结束后暂停并问一个问题，你直接在视频里作答。答案、得分和期末测验都保存在"测验"标签里。默认关闭，由你打开。每个打开互动模式的视频每月计一次：免费 2 个，Plus 10 个，Pro 30 个，Premium 80 个。'],
    ['免费视频和额度怎么算？', '每个免费账户每天 1 个视频，另送 3 个欢迎视频。用完后才扣额度（3 分钟以内的视频扣 1 点）。额度永不过期。Plus 每月 50 个视频，Pro 120 个，Premium 250 个。'],
    ['怎么付款？', '选择套餐或额度包。中国用微信或支付宝，越南用 VietQR 银行转账，印尼请联系我们获取付款方式。我们人工确认，通常一天内。'],
    ['能分享或发布视频吗？', '可以。用"分享这个视频"生成链接，或下载 16:9 和 9:16 文件发到抖音、小红书、TikTok 或 YouTube。请注明原始来源。'],
  ],
  vi: [
    ['Một video mất bao lâu?', 'Khoảng 5 đến 10 phút cho video 3 phút. Bạn xem được từng phần ngay khi nó xong, không cần đợi cả video. Bạn có thể đóng trang: video vẫn được làm tiếp và đợi bạn khi quay lại.'],
    ['Tôi có thể biến gì thành video?', 'Liên kết arXiv, PDF, DOI, bất kỳ trang web nào có nội dung, văn bản bạn dán vào, hoặc tệp PDF, TXT, Markdown. Dùng được cho bài báo, và cả bài viết, bài giảng, báo cáo.'],
    ['Tôi có đổi được phong cách hay độ dài không?', 'Chọn độ dài (1 đến 5 phút, tối đa 10 phút với Pro), ngôn ngữ, giọng đọc và giọng điệu giảng. Ở "Bối cảnh và yêu cầu" bạn có thể nhờ bất cứ điều gì: tập trung vào thí nghiệm, bỏ qua toán, giải thích cho học sinh cấp 3.'],
    ['Có chính xác không?', 'Các trích dẫn và số liệu được đối chiếu với nguồn và bị loại nếu không khớp. AI vẫn có thể sai, nên hãy kiểm tra các nhận định quan trọng trong bản gốc.'],
    ['Chế độ tương tác là gì?', 'Video dừng sau mỗi phần và hỏi một câu, bạn trả lời ngay trong video. Câu trả lời, điểm số và bài kiểm tra cuối được lưu trong tab Kiểm tra. Mặc định tắt cho đến khi bạn bật. Mỗi video bạn bật chế độ này được tính một lần mỗi tháng: miễn phí 2, Plus 10, Pro 30, Premium 80.'],
    ['Video miễn phí và tín dụng hoạt động thế nào?', 'Mỗi tài khoản miễn phí có 1 video mỗi ngày cộng 3 video chào mừng. Sau đó sẽ dùng tín dụng (video tới 3 phút tốn 1 tín dụng). Tín dụng không hết hạn. Plus có 50 video mỗi tháng, Pro 120 và Premium 250.'],
    ['Tôi thanh toán thế nào?', 'Chọn một gói hoặc gói tín dụng. Ở Việt Nam chuyển khoản ngân hàng bằng VietQR (Techcombank hoặc BIDV). Chúng tôi xác nhận thủ công, thường trong vòng một ngày.'],
    ['Tôi có thể chia sẻ hoặc đăng video không?', 'Có. Dùng "Chia sẻ video này" để lấy liên kết, hoặc tải tệp 16:9 và 9:16 để đăng lên TikTok hoặc YouTube. Hãy ghi nguồn gốc.'],
  ],
  id: [
    ['Berapa lama satu video dibuat?', 'Sekitar 5 sampai 10 menit untuk video 3 menit. Anda bisa menonton tiap bagian begitu siap, tanpa menunggu seluruh video. Anda boleh menutup halaman: video tetap dibuat dan menunggu saat Anda kembali.'],
    ['Apa yang bisa dijadikan video?', 'Tautan arXiv, PDF, DOI, halaman web apa pun yang berisi teks, teks yang Anda tempel, atau berkas PDF, TXT, Markdown. Cocok untuk makalah, juga artikel, pelajaran, dan laporan.'],
    ['Bisakah saya mengubah gaya atau durasi?', 'Pilih durasi (1 sampai 5 menit, hingga 10 menit dengan Pro), bahasa, suara, dan nada pengajaran. Di "Konteks dan instruksi" Anda bisa meminta apa saja: fokus pada eksperimen, lewati matematika, jelaskan untuk siswa SMA.'],
    ['Apakah akurat?', 'Kutipan dan angka dicocokkan dengan sumber dan dihapus jika tidak sama. AI tetap bisa keliru, jadi periksa klaim penting di sumber aslinya.'],
    ['Apa itu mode interaktif?', 'Video berhenti setiap bagian dan menanyakan satu pertanyaan, dan Anda menjawab di dalam video. Jawaban, skor, dan kuis akhir tersimpan di tab Kuis. Mati sampai Anda menyalakannya. Setiap video yang Anda nyalakan dihitung sekali per bulan: gratis 2, Plus 10, Pro 30, Premium 80.'],
    ['Bagaimana video gratis dan kredit bekerja?', 'Setiap akun gratis mendapat 1 video per hari ditambah 3 video selamat datang. Setelah itu kredit dipakai (video sampai 3 menit memakai 1 kredit). Kredit tidak kedaluwarsa. Plus memberi 50 video per bulan, Pro 120, dan Premium 250.'],
    ['Bagaimana cara membayar?', 'Pilih paket atau paket kredit, lalu hubungi kami lewat tombol Kontak untuk detail pembayaran (transfer bank atau QRIS). Kami mengonfirmasi manual, biasanya dalam sehari.'],
    ['Bolehkah saya membagikan atau mengunggah videonya?', 'Boleh. Pakai "Bagikan video ini" untuk tautan, atau unduh berkas 16:9 dan 9:16 untuk TikTok atau YouTube. Cantumkan sumber aslinya.'],
  ],
};

export function FaqSection() {
  const a = useAcctText();
  const { lang } = usePrefs();
  return (
    <section className="section" id="faq" aria-labelledby="faq-title">
      <h2 className="sec" id="faq-title">{a('faqTitle')}</h2>
      <div className="stack" style={{ gap: 10, marginTop: 14 }}>
        {FAQ[lang].map(([q, ans]) => (
          <details key={q} className="card" style={{ margin: 0, padding: '12px 16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{q}</summary>
            <p style={{ margin: '10px 0 0', lineHeight: 1.65 }}>{ans}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function ContactForm({ onDone }: { onDone?: () => void }) {
  const a = useAcctText();
  const [f, setF] = useState({ topic: 'question', name: '', email: '', message: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [err, setErr] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState('sending'); setErr('');
    try {
      await accountApi('contact', f);
      setState('sent');
      setF({ topic: 'question', name: '', email: '', message: '' });
    } catch (x) { setErr((x as Error).message); setState('idle'); }
  };
  return (
    <>
        {state === 'sent' ? (
  <div className="done-box" role="status">{a('sent')}</div>
) : (
  <form className="stack" onSubmit={submit}>
    <div className="row" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <label className="field" style={{ flex: '1 1 160px' }}>{a('topic')}
        <select value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}>
          <option value="question">{a('topicQ')}</option>
          <option value="bug">{a('topicBug')}</option>
          <option value="idea">{a('topicIdea')}</option>
          <option value="billing">{a('topicBilling')}</option>
          <option value="business">{a('topicBiz')}</option>
        </select>
      </label>
      <label className="field" style={{ flex: '1 1 160px' }}>{a('yourName')}
        <input value={f.name} maxLength={80} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" />
      </label>
    </div>
    <label className="field">{a('yourEmail')}
      <input type="email" value={f.email} maxLength={200} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
    </label>
    <label className="field">{a('message')}
      <textarea rows={5} value={f.message} maxLength={3000} onChange={(e) => setF({ ...f, message: e.target.value })} required />
    </label>
    {err && <p className="err" role="alert">{err}</p>}
    <div><button className="btn primary" type="submit" disabled={state === 'sending'}>{state === 'sending' ? <span className="spin" aria-hidden /> : null}{a('send')}</button></div>
  </form>
)}
    </>
  );
}

/** The contact form in a dialog: opened from the footer or the navbar, so the page itself stays short. */
export default function ContactModal() {
  const a = useAcctText();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener('pe-open-contact', on);
    return () => window.removeEventListener('pe-open-contact', on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={a('contactTitle')} className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="card stack modal-card">
        <div className="row between">
          <h3 style={{ font: '700 20px var(--display)', margin: 0 }}>{a('contactTitle')}</h3>
          <button type="button" className="btn ghost small" onClick={() => setOpen(false)} aria-label={a('close')}>×</button>
        </div>
        <p className="small muted" style={{ margin: 0 }}>{a('contactSub')}</p>
        <ContactForm onDone={() => setOpen(false)} />
      </div>
    </div>
  );
}

export const openContact = () => window.dispatchEvent(new Event('pe-open-contact'));
