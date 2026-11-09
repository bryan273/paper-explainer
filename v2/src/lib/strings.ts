// Words used in more than one place, in the four languages. Page-specific words live with their page.
export const NAV = {
  video: { en: 'Video', zh: '视频', vi: 'Video', id: 'Video' },
  read: { en: 'Read', zh: '阅读', vi: 'Đọc', id: 'Baca' },
  check: { en: 'Check', zh: '复现', vi: 'Kiểm chứng', id: 'Cek' },
  pricing: { en: 'Pricing', zh: '价格', vi: 'Bảng giá', id: 'Harga' },
  help: { en: 'Help', zh: '帮助', vi: 'Trợ giúp', id: 'Bantuan' },
  login: { en: 'Log in', zh: '登录', vi: 'Đăng nhập', id: 'Masuk' },
  start: { en: 'Start free', zh: '免费开始', vi: 'Bắt đầu miễn phí', id: 'Mulai gratis' },
  dashboard: { en: 'Dashboard', zh: '控制台', vi: 'Bảng điều khiển', id: 'Dasbor' },
  home: { en: 'Home', zh: '首页', vi: 'Trang chủ', id: 'Beranda' },
  newVideo: { en: 'New video', zh: '新建视频', vi: 'Tạo video', id: 'Video baru' },
  library: { en: 'Library', zh: '我的视频', vi: 'Thư viện', id: 'Pustaka' },
  account: { en: 'Account and settings', zh: '账户与设置', vi: 'Tài khoản và cài đặt', id: 'Akun dan pengaturan' },
  admin: { en: 'Admin', zh: '管理后台', vi: 'Quản trị', id: 'Admin' },
  signOut: { en: 'Sign out', zh: '退出登录', vi: 'Đăng xuất', id: 'Keluar' },
  addAccount: { en: 'Add another account', zh: '添加其他账户', vi: 'Thêm tài khoản khác', id: 'Tambah akun lain' },
  switchTo: { en: 'Switch account', zh: '切换账户', vi: 'Đổi tài khoản', id: 'Ganti akun' },
  theme: { en: 'Dark mode', zh: '深色模式', vi: 'Chế độ tối', id: 'Mode gelap' },
  language: { en: 'Language', zh: '语言', vi: 'Ngôn ngữ', id: 'Bahasa' },
  upgrade: { en: 'Upgrade', zh: '升级', vi: 'Nâng cấp', id: 'Tingkatkan' },
  back: { en: 'Back', zh: '返回', vi: 'Quay lại', id: 'Kembali' },
};

export const PRODUCT = {
  video: { en: 'Video learning', zh: '视频学习', vi: 'Học qua video', id: 'Belajar lewat video' },
  videoP: { en: 'A narrated video with chapters, and questions that stop the video to check you understood.', zh: '有旁白、分章节的视频，视频内会暂停提问，确认你真的看懂。', vi: 'Video có lời dẫn, chia chương, và câu hỏi dừng video lại để kiểm tra bạn đã hiểu.', id: 'Video bernarasi dengan bab, dan pertanyaan yang menghentikan video untuk mengecek pemahaman Anda.' },
  text: { en: 'Text learning', zh: '文本学习', vi: 'Học qua văn bản', id: 'Belajar lewat teks' },
  textP: { en: 'Read the source side by side with answers that point to the page they come from.', zh: '左边原文，右边回答，每个回答都标出出处页码。', vi: 'Đọc nguồn song song với câu trả lời chỉ rõ trang được trích.', id: 'Baca sumbernya berdampingan dengan jawaban yang menunjuk halaman asalnya.' },
  deep: { en: 'Deep learning', zh: '深度学习', vi: 'Học chuyên sâu', id: 'Belajar mendalam' },
  deepP: { en: 'Ask anything in depth, take a final quiz, and keep notes and flashcards.', zh: '深入追问任何问题，做期末测验，导出笔记和闪卡。', vi: 'Hỏi sâu bất cứ điều gì, làm bài kiểm tra cuối, lưu ghi chú và thẻ ghi nhớ.', id: 'Tanyakan apa saja secara mendalam, kerjakan kuis akhir, simpan catatan dan kartu hafalan.' },
  repro: { en: 'Research reproduction', zh: '研究复现', vi: 'Tái lập nghiên cứu', id: 'Reproduksi riset' },
  reproP: { en: 'For papers with public code: re-run it and see whether the reported number holds.', zh: '对公开代码的论文：重新运行，看报告的数字是否成立。', vi: 'Với bài báo có mã công khai: chạy lại và xem con số có đúng không.', id: 'Untuk makalah dengan kode terbuka: jalankan ulang dan lihat apakah angkanya benar.' },
};

export const COMMON = {
  close: { en: 'Close', zh: '关闭', vi: 'Đóng', id: 'Tutup' },
  cancel: { en: 'Cancel', zh: '取消', vi: 'Hủy', id: 'Batal' },
  save: { en: 'Save', zh: '保存', vi: 'Lưu', id: 'Simpan' },
  saved: { en: 'Saved', zh: '已保存', vi: 'Đã lưu', id: 'Tersimpan' },
  loading: { en: 'Loading…', zh: '加载中…', vi: 'Đang tải…', id: 'Memuat…' },
  retry: { en: 'Try again', zh: '重试', vi: 'Thử lại', id: 'Coba lagi' },
  network: { en: 'Could not reach the server. Check your connection and try again.', zh: '连不上服务器，请检查网络后重试。', vi: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.', id: 'Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.' },
  copy: { en: 'Copy', zh: '复制', vi: 'Sao chép', id: 'Salin' },
  copied: { en: 'Copied', zh: '已复制', vi: 'Đã sao chép', id: 'Tersalin' },
  rights: { en: 'All rights reserved.', zh: '保留所有权利。', vi: 'Bảo lưu mọi quyền.', id: 'Hak cipta dilindungi.' },
  terms: { en: 'Terms', zh: '服务条款', vi: 'Điều khoản', id: 'Ketentuan' },
  privacy: { en: 'Privacy', zh: '隐私政策', vi: 'Quyền riêng tư', id: 'Privasi' },
  contact: { en: 'Contact', zh: '联系我们', vi: 'Liên hệ', id: 'Kontak' },
  free: { en: 'Free', zh: '免费', vi: 'Miễn phí', id: 'Gratis' },
  soon: { en: 'Soon', zh: '即将推出', vi: 'Sắp có', id: 'Segera' },
  live: { en: 'Live', zh: '已上线', vi: 'Đã có', id: 'Tersedia' },
  until: { en: 'until {d}', zh: '至 {d}', vi: 'đến {d}', id: 'sampai {d}' },
};

export const dateFmt = (iso: string | null | undefined, lang: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString(lang === 'zh' ? 'zh-CN' : lang === 'vi' ? 'vi-VN' : lang === 'id' ? 'id-ID' : 'en-GB', opts); } catch { return iso.slice(0, 10); }
};
