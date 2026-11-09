import { usePrefs, type Lang, type Tr } from '@/lib/prefs';

type B = [string, string];
const TERMS: Tr<B[]> = {
  en: [
    ['What Paperlit is', 'Paperlit turns a source you give it (a paper, an article, a web page, your notes or a file) into learning material: narrated videos, questions, answers and checks of results. It is made by AI and is a study aid, not a replacement for the original.'],
    ['Your account', 'You can use Paperlit as a guest or with a free account. Keep your password private; you are responsible for what happens in your account. We may close accounts that abuse the service.'],
    ['Videos, credits and plans', 'Free videos, plan videos, interactive videos and in-depth answers are counted as shown in the app and on the pricing page. Credits do not expire and are used after the free video of the day. A failed video returns its credit. Plans run for the paid period and do not renew by themselves.'],
    ['Payment', 'Payments are made by bank transfer (VietQR), WeChat Pay, Alipay or as agreed with us, and are confirmed by hand. If something you paid for does not switch on, contact us and we will fix it or refund you.'],
    ['What you may submit', 'Material you have the right to use. Nothing unlawful, private or harmful, and no attempts to overload or attack the service.'],
    ['Accuracy', 'We match quotes and numbers against the source, but AI can still be wrong. Check important claims in the original.'],
    ['Sharing', 'You may share videos you make with credit to the original source. Shared links can be watched by anyone who has them.'],
    ['Changes', 'We may update these terms and the limits as Paperlit grows. Questions: use the support chat.'],
  ],
  zh: [
    ['Paperlit 是什么', 'Paperlit 把你提供的资料（论文、文章、网页、笔记或文件）变成学习材料：讲解视频、题目、问答和结果检验。内容由 AI 生成，是学习辅助，不能替代原文。'],
    ['你的账户', '你可以以访客身份或免费账户使用。请妥善保管密码，账户内的行为由你负责。我们可以关闭滥用服务的账户。'],
    ['视频、额度与套餐', '免费视频、套餐视频、互动视频和深入回答按应用和价格页所示计算。额度永不过期，在当日免费视频用完后使用。视频失败会退还额度。套餐在已付款期限内有效，不会自动续费。'],
    ['付款', '付款方式为银行转账（VietQR）、微信支付、支付宝或与我们约定的方式，由人工确认。如付款后未开通，请联系我们处理或退款。'],
    ['可以提交什么', '你有权使用的材料。不得提交违法、隐私或有害内容，也不得试图使服务过载或攻击服务。'],
    ['准确性', '我们会将引文和数字与原文比对，但 AI 仍可能出错。重要结论请回到原文核实。'],
    ['分享', '你可以在注明原始来源的前提下分享你制作的视频。拿到分享链接的人都可以观看。'],
    ['变更', '随着 Paperlit 的发展，我们可能更新条款和额度。如有问题，请使用客服聊天。'],
  ],
  vi: [
    ['Paperlit là gì', 'Paperlit biến nguồn bạn đưa vào (bài báo, bài viết, trang web, ghi chú hoặc tệp) thành tài liệu học: video có lời dẫn, câu hỏi, câu trả lời và kiểm chứng kết quả. Nội dung do AI tạo, là công cụ hỗ trợ học, không thay thế bản gốc.'],
    ['Tài khoản của bạn', 'Bạn có thể dùng Paperlit với tư cách khách hoặc tài khoản miễn phí. Giữ kín mật khẩu của bạn; bạn chịu trách nhiệm về hoạt động trong tài khoản. Chúng tôi có thể khóa tài khoản lạm dụng dịch vụ.'],
    ['Video, tín dụng và các gói', 'Video miễn phí, video của gói, video tương tác và câu trả lời chuyên sâu được tính như trong ứng dụng và trang bảng giá. Tín dụng không hết hạn và được dùng sau video miễn phí trong ngày. Video lỗi được hoàn tín dụng. Gói có hiệu lực trong thời gian đã thanh toán và không tự gia hạn.'],
    ['Thanh toán', 'Thanh toán bằng chuyển khoản (VietQR), WeChat Pay, Alipay hoặc theo thỏa thuận, và được xác nhận thủ công. Nếu đã thanh toán mà chưa được kích hoạt, hãy liên hệ để chúng tôi xử lý hoặc hoàn tiền.'],
    ['Bạn được gửi gì', 'Tài liệu bạn có quyền sử dụng. Không gửi nội dung trái pháp luật, riêng tư hoặc có hại, và không tìm cách làm quá tải hoặc tấn công dịch vụ.'],
    ['Độ chính xác', 'Chúng tôi đối chiếu trích dẫn và số liệu với nguồn, nhưng AI vẫn có thể sai. Hãy kiểm tra lại các nhận định quan trọng trong bản gốc.'],
    ['Chia sẻ', 'Bạn có thể chia sẻ video đã tạo kèm ghi nguồn gốc. Ai có liên kết chia sẻ đều xem được.'],
    ['Thay đổi', 'Chúng tôi có thể cập nhật điều khoản và các giới hạn khi Paperlit phát triển. Có câu hỏi, hãy dùng khung trò chuyện hỗ trợ.'],
  ],
  id: [
    ['Apa itu Paperlit', 'Paperlit mengubah sumber yang Anda berikan (makalah, artikel, halaman web, catatan, atau berkas) menjadi bahan belajar: video bernarasi, pertanyaan, jawaban, dan pengecekan hasil. Dibuat oleh AI, sebagai alat bantu belajar, bukan pengganti aslinya.'],
    ['Akun Anda', 'Anda bisa memakai Paperlit sebagai tamu atau dengan akun gratis. Jaga kerahasiaan kata sandi; Anda bertanggung jawab atas aktivitas di akun Anda. Kami dapat menutup akun yang menyalahgunakan layanan.'],
    ['Video, kredit, dan paket', 'Video gratis, video paket, video interaktif, dan jawaban mendalam dihitung seperti tertera di aplikasi dan halaman harga. Kredit tidak kedaluwarsa dan dipakai setelah video gratis hari itu. Video gagal mengembalikan kreditnya. Paket berlaku selama periode yang dibayar dan tidak diperpanjang otomatis.'],
    ['Pembayaran', 'Pembayaran lewat transfer bank, WeChat Pay, Alipay, atau sesuai kesepakatan, dan dikonfirmasi manual. Jika sudah membayar tetapi belum aktif, hubungi kami untuk diperbaiki atau dikembalikan.'],
    ['Yang boleh dikirim', 'Bahan yang berhak Anda gunakan. Tidak boleh konten ilegal, pribadi, atau berbahaya, dan tidak boleh mencoba membebani atau menyerang layanan.'],
    ['Akurasi', 'Kami mencocokkan kutipan dan angka dengan sumber, tetapi AI tetap bisa salah. Periksa klaim penting di sumber aslinya.'],
    ['Berbagi', 'Anda boleh membagikan video yang Anda buat dengan menyebut sumber aslinya. Siapa pun yang punya tautan bisa menonton.'],
    ['Perubahan', 'Kami dapat memperbarui ketentuan dan batasan seiring Paperlit berkembang. Pertanyaan: gunakan obrolan bantuan.'],
  ],
};
const PRIVACY: Tr<B[]> = {
  en: [
    ['What we keep', 'For an account: your email, username, country, learning language, and a salted hash of your password (we cannot read it). When you use Paperlit: the sources you submit, the videos made, your questions and answers, simple usage events and an anonymous browser id. Uploaded files are deleted after the video is made; their text is kept for 14 days so you can ask questions.'],
    ['What we do not keep', 'No phone number and no card details. Payments happen in your bank or wallet app; we see the order and, if you send one, the payment screenshot. Student and teacher proofs are seen only by our team.'],
    ['Why', 'To run the service, count limits, stop abuse, fix problems and improve Paperlit.'],
    ['Who processes it', 'Pages are hosted on GitHub Pages, data and videos on Supabase and Cloudflare. Source text is sent to AI model providers to write and draw the videos and answer questions. We do not sell data and show no ads.'],
    ['Your choices', 'You can use Paperlit as a guest. To delete your account and data, write to us in the support chat. Signing out removes the session from this device.'],
    ['Storage on your device', 'We use browser storage, not tracking cookies, for your session, language, theme, settings and an anonymous browser id.'],
  ],
  zh: [
    ['我们保存什么', '注册账户时：邮箱、用户名、国家/地区、学习语言和加盐的密码哈希（我们无法读取密码）。使用时：你提交的资料、生成的视频、你的问答、简单的使用事件和匿名浏览器编号。上传的文件在视频生成后删除，正文保留 14 天以便提问。'],
    ['我们不保存什么', '不保存手机号和银行卡信息。付款在你的银行或钱包应用中完成，我们只看到订单以及你提交的付款截图。学生和教师证明仅我们的团队可见。'],
    ['为什么', '用于运行服务、计算额度、防止滥用、修复问题和改进 Paperlit。'],
    ['谁会处理', '页面托管在 GitHub Pages，数据和视频存放在 Supabase 与 Cloudflare。资料正文会发送给 AI 模型服务商用于制作视频和回答问题。我们不出售数据，也没有广告。'],
    ['你的选择', '你可以以访客身份使用。如需删除账户和数据，请在客服聊天中告诉我们。退出登录会清除本设备上的会话。'],
    ['本地存储', '我们使用浏览器本地存储（不是跟踪 Cookie）保存会话、语言、主题、设置和匿名浏览器编号。'],
  ],
  vi: [
    ['Chúng tôi lưu gì', 'Với tài khoản: email, tên người dùng, quốc gia, ngôn ngữ học và mật khẩu đã băm kèm muối (chúng tôi không đọc được). Khi bạn dùng Paperlit: nguồn bạn gửi, video đã tạo, câu hỏi và câu trả lời, các sự kiện sử dụng đơn giản và một mã trình duyệt ẩn danh. Tệp tải lên bị xóa sau khi tạo video; nội dung văn bản được giữ 14 ngày để bạn đặt câu hỏi.'],
    ['Chúng tôi không lưu gì', 'Không lưu số điện thoại hay thông tin thẻ. Thanh toán diễn ra trong ứng dụng ngân hàng hoặc ví của bạn; chúng tôi chỉ thấy đơn hàng và ảnh chụp giao dịch nếu bạn gửi. Giấy tờ sinh viên, giảng viên chỉ đội ngũ chúng tôi xem.'],
    ['Vì sao', 'Để vận hành dịch vụ, tính hạn mức, ngăn lạm dụng, sửa lỗi và cải thiện Paperlit.'],
    ['Ai xử lý', 'Trang được lưu trữ trên GitHub Pages, dữ liệu và video trên Supabase và Cloudflare. Văn bản nguồn được gửi tới nhà cung cấp mô hình AI để tạo video và trả lời câu hỏi. Chúng tôi không bán dữ liệu và không có quảng cáo.'],
    ['Lựa chọn của bạn', 'Bạn có thể dùng Paperlit với tư cách khách. Muốn xóa tài khoản và dữ liệu, hãy nhắn cho chúng tôi trong khung hỗ trợ. Đăng xuất sẽ xóa phiên trên thiết bị này.'],
    ['Lưu trữ trên thiết bị', 'Chúng tôi dùng bộ nhớ trình duyệt, không dùng cookie theo dõi, để nhớ phiên, ngôn ngữ, giao diện, cài đặt và mã trình duyệt ẩn danh.'],
  ],
  id: [
    ['Yang kami simpan', 'Untuk akun: email, nama pengguna, negara, bahasa belajar, dan hash kata sandi bergaram (kami tidak bisa membacanya). Saat memakai Paperlit: sumber yang Anda kirim, video yang dibuat, pertanyaan dan jawaban, peristiwa penggunaan sederhana, dan id peramban anonim. Berkas unggahan dihapus setelah video dibuat; teksnya disimpan 14 hari agar Anda bisa bertanya.'],
    ['Yang tidak kami simpan', 'Tidak ada nomor telepon dan data kartu. Pembayaran terjadi di aplikasi bank atau dompet Anda; kami hanya melihat pesanan dan tangkapan layar pembayaran jika Anda kirim. Bukti mahasiswa dan pengajar hanya dilihat tim kami.'],
    ['Mengapa', 'Untuk menjalankan layanan, menghitung batas, mencegah penyalahgunaan, memperbaiki masalah, dan meningkatkan Paperlit.'],
    ['Siapa yang memproses', 'Halaman di-host di GitHub Pages, data dan video di Supabase dan Cloudflare. Teks sumber dikirim ke penyedia model AI untuk membuat video dan menjawab pertanyaan. Kami tidak menjual data dan tidak menampilkan iklan.'],
    ['Pilihan Anda', 'Anda bisa memakai Paperlit sebagai tamu. Untuk menghapus akun dan data, tulis kepada kami di obrolan bantuan. Keluar akan menghapus sesi di perangkat ini.'],
    ['Penyimpanan di perangkat', 'Kami memakai penyimpanan peramban, bukan cookie pelacak, untuk sesi, bahasa, tema, pengaturan, dan id peramban anonim.'],
  ],
};
const TITLE = { terms: { en: 'Terms of use', zh: '使用条款', vi: 'Điều khoản sử dụng', id: 'Ketentuan penggunaan' }, privacy: { en: 'Privacy policy', zh: '隐私政策', vi: 'Chính sách quyền riêng tư', id: 'Kebijakan privasi' } };
const UPD = { en: 'Last updated 9 November 2026', zh: '最后更新：2026 年 11 月 9 日', vi: 'Cập nhật lần cuối 9 tháng 11 năm 2026', id: 'Terakhir diperbarui 9 November 2026' };

export default function Legal({ kind }: { kind: 'terms' | 'privacy' }) {
  const { lang, t } = usePrefs();
  const blocks = (kind === 'terms' ? TERMS : PRIVACY)[lang];
  return (
    <main className="pl-container max-w-3xl pt-14">
      <h1 className="pl-h2">{t(TITLE[kind])}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t(UPD)}</p>
      {blocks.map(([h, b]) => (
        <section key={h} className="mt-8">
          <h2 className="font-display text-lg font-semibold">{h}</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">{b}</p>
        </section>
      ))}
    </main>
  );
}
