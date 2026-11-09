// The server answers in English. These are its fixed messages, shown in the language the person picked; anything not listed (or any other language) stays as the server wrote it.
type T = { zh: string; vi: string; id: string };
const M: Record<string, T> = {
  'Choose your country.': { zh: '请选择你所在的国家。', vi: 'Hãy chọn quốc gia của bạn.', id: 'Pilih negara Anda.' },
  'Choose your preferred language.': { zh: '请选择常用语言。', vi: 'Hãy chọn ngôn ngữ ưu tiên.', id: 'Pilih bahasa pilihan Anda.' },
  'Could not write a question for this part. Try again.': { zh: '这一段没能生成题目，请重试。', vi: 'Không tạo được câu hỏi cho phần này. Hãy thử lại.', id: 'Tidak bisa membuat pertanyaan untuk bagian ini. Coba lagi.' },
  'Could not write the questions. Try again.': { zh: '没能生成题目，请重试。', vi: 'Không tạo được câu hỏi. Hãy thử lại.', id: 'Tidak bisa membuat pertanyaan. Coba lagi.' },
  'Current password is wrong.': { zh: '当前密码不正确。', vi: 'Mật khẩu hiện tại không đúng.', id: 'Kata sandi saat ini salah.' },
  'E-mail is not set up yet. Please contact us.': { zh: '邮件功能尚未开通，请联系我们。', vi: 'Chức năng email chưa được thiết lập. Hãy liên hệ chúng tôi.', id: 'Email belum disiapkan. Silakan hubungi kami.' },
  'Enter a valid email address.': { zh: '请输入有效的邮箱地址。', vi: 'Hãy nhập địa chỉ email hợp lệ.', id: 'Masukkan alamat email yang valid.' },
  'Open a finished video first.': { zh: '请先打开一个已完成的视频。', vi: 'Hãy mở một video đã hoàn tất trước.', id: 'Buka video yang sudah selesai terlebih dahulu.' },
  'Order not found.': { zh: '找不到该订单。', vi: 'Không tìm thấy đơn hàng.', id: 'Pesanan tidak ditemukan.' },
  'Password: 8 to 72 characters.': { zh: '密码长度须为 8 到 72 个字符。', vi: 'Mật khẩu gồm 8 đến 72 ký tự.', id: 'Kata sandi 8 sampai 72 karakter.' },
  'Please confirm your e-mail first. We sent you a link.': { zh: '请先确认邮箱，我们已发送链接。', vi: 'Hãy xác nhận email trước. Chúng tôi đã gửi liên kết cho bạn.', id: 'Konfirmasi email Anda dulu. Kami sudah mengirim tautan.' },
  'Please write a message.': { zh: '请写下你的留言。', vi: 'Hãy viết tin nhắn.', id: 'Tulis pesan dulu.' },
  'Resetting by e-mail is not set up yet. Please contact us and we will reset it for you.': { zh: '邮件重置尚未开通，请联系我们，我们帮你重置。', vi: 'Đặt lại qua email chưa được thiết lập. Hãy liên hệ chúng tôi để được đặt lại giúp.', id: 'Reset lewat email belum disiapkan. Hubungi kami dan kami akan meresetnya untuk Anda.' },
  'Send a photo (JPG, PNG, WebP) or a PDF.': { zh: '请上传照片（JPG、PNG、WebP）或 PDF。', vi: 'Hãy gửi ảnh (JPG, PNG, WebP) hoặc PDF.', id: 'Kirim foto (JPG, PNG, WebP) atau PDF.' },
  'Sign in first.': { zh: '请先登录。', vi: 'Hãy đăng nhập trước.', id: 'Masuk dulu.' },
  'Sign in to buy credits.': { zh: '登录后才能购买额度。', vi: 'Hãy đăng nhập để mua lượt.', id: 'Masuk untuk membeli kredit.' },
  'Sign up free to ask questions about this video. The link lets you watch it.': { zh: '免费注册后才能就这个视频提问。链接只能用来观看。', vi: 'Đăng ký miễn phí để đặt câu hỏi về video này. Liên kết chỉ cho phép xem.', id: 'Daftar gratis untuk bertanya tentang video ini. Tautan hanya untuk menonton.' },
  'That email already has an account. Log in instead.': { zh: '该邮箱已注册，请直接登录。', vi: 'Email này đã có tài khoản. Hãy đăng nhập.', id: 'Email itu sudah punya akun. Silakan masuk.' },
  'That email does not look right.': { zh: '这个邮箱格式不对。', vi: 'Email này có vẻ không đúng.', id: 'Email itu tampaknya tidak benar.' },
  'That file was not found. Please choose it again.': { zh: '找不到该文件，请重新选择。', vi: 'Không tìm thấy tệp. Hãy chọn lại.', id: 'File tidak ditemukan. Pilih lagi.' },
  'That upload was not found. Please choose the file again.': { zh: '找不到该上传，请重新选择文件。', vi: 'Không tìm thấy bản tải lên. Hãy chọn lại tệp.', id: 'Unggahan tidak ditemukan. Pilih file lagi.' },
  'That file was already used. Please choose it again.': { zh: '该文件已被使用，请重新选择。', vi: 'Tệp này đã được dùng. Hãy chọn lại.', id: 'File itu sudah dipakai. Pilih lagi.' },
  'That file is not a readable PDF.': { zh: '这个文件不是可读取的 PDF。', vi: 'Tệp này không phải PDF đọc được.', id: 'File itu bukan PDF yang bisa dibaca.' },
  'That username is taken. Choose another one.': { zh: '该用户名已被占用，请换一个。', vi: 'Tên người dùng đã có người dùng. Hãy chọn tên khác.', id: 'Username itu sudah dipakai. Pilih yang lain.' },
  'The stronger model is free to try once you sign up.': { zh: '注册后可免费试用更强的模型。', vi: 'Đăng ký xong bạn được dùng thử miễn phí mô hình mạnh hơn.', id: 'Model yang lebih kuat bisa dicoba gratis setelah Anda mendaftar.' },
  'This account is disabled. Please contact us.': { zh: '该账号已被停用，请联系我们。', vi: 'Tài khoản này đã bị vô hiệu hóa. Hãy liên hệ chúng tôi.', id: 'Akun ini dinonaktifkan. Silakan hubungi kami.' },
  'This confirmation link is not valid any more. Log in and ask for a new one.': { zh: '这个确认链接已失效。请登录后重新获取。', vi: 'Liên kết xác nhận này không còn hiệu lực. Hãy đăng nhập và yêu cầu liên kết mới.', id: 'Tautan konfirmasi ini sudah tidak berlaku. Masuk dan minta yang baru.' },
  'This reset link is not valid any more. Ask for a new one.': { zh: '这个重置链接已失效，请重新获取。', vi: 'Liên kết đặt lại này không còn hiệu lực. Hãy yêu cầu liên kết mới.', id: 'Tautan reset ini sudah tidak berlaku. Minta yang baru.' },
  'This video has expired, so its paper text is gone. Make it again to ask questions.': { zh: '这个视频已过期，原文已被删除。请重新生成后再提问。', vi: 'Video này đã hết hạn nên văn bản nguồn không còn. Hãy tạo lại để đặt câu hỏi.', id: 'Video ini sudah kedaluwarsa sehingga teks sumbernya hilang. Buat ulang untuk bertanya.' },
  'This video has no parts to ask about.': { zh: '这个视频没有可提问的部分。', vi: 'Video này không có phần nào để hỏi.', id: 'Video ini tidak punya bagian untuk ditanyakan.' },
  'Too many e-mails. Try again in an hour.': { zh: '邮件发送过多，请一小时后再试。', vi: 'Gửi quá nhiều email. Hãy thử lại sau một giờ.', id: 'Terlalu banyak email. Coba lagi dalam satu jam.' },
  'Too many messages. Try again later.': { zh: '消息过多，请稍后再试。', vi: 'Quá nhiều tin nhắn. Hãy thử lại sau.', id: 'Terlalu banyak pesan. Coba lagi nanti.' },
  'Too many sign-ups from here. Try again later.': { zh: '这里的注册过多，请稍后再试。', vi: 'Quá nhiều lượt đăng ký từ đây. Hãy thử lại sau.', id: 'Terlalu banyak pendaftaran dari sini. Coba lagi nanti.' },
  'Too many sign-ups from this network today. Try again tomorrow.': { zh: '今天这个网络的注册过多，请明天再试。', vi: 'Hôm nay có quá nhiều lượt đăng ký từ mạng này. Hãy thử lại vào ngày mai.', id: 'Hari ini terlalu banyak pendaftaran dari jaringan ini. Coba lagi besok.' },
  'Too many wrong attempts. Wait 15 minutes.': { zh: '错误次数过多，请等待 15 分钟。', vi: 'Sai quá nhiều lần. Hãy đợi 15 phút.', id: 'Terlalu banyak percobaan salah. Tunggu 15 menit.' },
  'Type a question first.': { zh: '请先输入问题。', vi: 'Hãy nhập câu hỏi trước.', id: 'Ketik pertanyaan dulu.' },
  'Unknown pack.': { zh: '未知的额度包。', vi: 'Gói không xác định.', id: 'Paket tidak dikenal.' },
  'Username: 3 to 24 letters, numbers, dots or underscores.': { zh: '用户名为 3 到 24 个字母、数字、点或下划线。', vi: 'Tên người dùng gồm 3 đến 24 chữ cái, số, dấu chấm hoặc gạch dưới.', id: 'Username 3 sampai 24 huruf, angka, titik, atau garis bawah.' },
  'Wrong email or password.': { zh: '邮箱或密码不正确。', vi: 'Email hoặc mật khẩu không đúng.', id: 'Email atau kata sandi salah.' },
  'You already sent a proof.': { zh: '你已经提交过证明。', vi: 'Bạn đã gửi giấy tờ rồi.', id: 'Anda sudah mengirim bukti.' },
  'You changed it a lot today. Try again tomorrow.': { zh: '你今天改动太多次，请明天再试。', vi: 'Hôm nay bạn đã đổi quá nhiều lần. Hãy thử lại vào ngày mai.', id: 'Anda sudah terlalu sering mengubahnya hari ini. Coba lagi besok.' },
  "Today's video budget is used up. Try again tomorrow.": { zh: '今天的视频额度已用完，请明天再试。', vi: 'Hạn mức video hôm nay đã hết. Hãy thử lại vào ngày mai.', id: 'Kuota video hari ini habis. Coba lagi besok.' },
  'That arXiv id was not found.': { zh: '找不到这个 arXiv 编号。', vi: 'Không tìm thấy mã arXiv này.', id: 'ID arXiv itu tidak ditemukan.' },
  'Paste a paper link (an arXiv link or id, a link to a PDF, or a DOI) or upload a PDF.': { zh: '请粘贴论文链接（arXiv 链接或编号、PDF 链接或 DOI），或上传 PDF。', vi: 'Hãy dán liên kết bài báo (liên kết hoặc mã arXiv, liên kết PDF hoặc DOI) hoặc tải lên PDF.', id: 'Tempel tautan makalah (tautan atau ID arXiv, tautan PDF, atau DOI) atau unggah PDF.' },
  'Videos longer than 5 minutes are part of Pro. Choose 5 minutes or less.': { zh: '超过 5 分钟的视频属于 Pro。请选择 5 分钟或更短。', vi: 'Video dài hơn 5 phút thuộc gói Pro. Hãy chọn 5 phút hoặc ngắn hơn.', id: 'Video lebih dari 5 menit termasuk paket Pro. Pilih 5 menit atau kurang.' },
};

export function localizeError(msg: string): string {
  let lang = 'en';
  try { lang = localStorage.getItem('suite-lang') || 'en'; } catch { /* storage blocked: stay in English */ }
  if (lang === 'en') return msg;
  return M[msg]?.[lang as keyof T] ?? msg;
}
