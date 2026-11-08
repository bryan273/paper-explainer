/** Vietnamese and Indonesian. Any key left out falls back to English, so a new string never shows as blank. */
type D = Record<string, string>;

export const VI: D = {
  navFeatures: 'Bạn nhận được gì',
  navMake: 'Tạo video', navExamples: 'Ví dụ', navHow: 'Cách hoạt động', navPricing: 'Bảng giá', navFeedback: 'Góp ý', navFaq: 'Câu hỏi thường gặp', navContact: 'Liên hệ',
  appAll: 'Tất cả ứng dụng',  menu: 'Menu', closeMenu: 'Đóng menu', language: 'Ngôn ngữ', toDark: 'Chuyển sang giao diện tối', toLight: 'Chuyển sang giao diện sáng',
  
  
  heroMake: 'Tạo video', heroWatch: 'Xem ví dụ', statVideos: 'video đã tạo', statLangs: 'ngôn ngữ', statChecked: 'trích dẫn và số liệu đã kiểm tra', statRemoved: 'bị loại sau kiểm tra', 
   
  uploadBtn: 'Tải PDF lên', uploadOr: 'hoặc thả tệp PDF vào đây. Tối đa {n} tệp, mỗi tệp {mb} MB. Mỗi tệp một video.', uploadNotPdf: 'Chỉ có thể tải lên tệp PDF.', makeNBtn: 'Tạo {n} video',
  uploadPrivate: 'PDF của bạn được giữ riêng tư. Tệp bị xóa ngay khi video xong; văn bản được lưu cùng video 14 ngày để bạn đặt câu hỏi.',
  tabVideo: 'Video', tabAsk: 'Hỏi', askTitle: 'Hỏi về bài báo này', askSub: 'Chưa hiểu chỗ nào? Cứ hỏi theo cách của bạn. Mỗi câu trả lời đều cho biết lấy từ đâu: từ bài báo hay từ kiến thức chung.',
  askModeLabel: 'Kiểu trả lời', askModePlus: 'Bài báo + kiến thức chung', askModePaper: 'Chỉ theo nội dung bài báo', askPlaceholder: 'ví dụ: Thuật ngữ này nghĩa là gì?', askSend: 'Hỏi', askThinking: 'Đang đọc bài báo...',
  askStill: 'Vẫn đang xử lý. Câu trả lời dài có thể mất đến một phút.', askS1: 'Giải thích bài báo này như thể tôi mới vào lĩnh vực', askS2: 'Tôi nên biết gì trước khi đọc?', askS3: 'Ý tưởng nào khó hiểu nhất?',
  askBadgePaper: 'Từ bài báo', askBadgeGeneral: 'Kiến thức chung, không có trong bài', askBadgeUnverified: 'Chưa xác minh', askQuoteFound: 'Đã tìm thấy trích dẫn trong văn bản bài báo',
  askQuoteMissing: 'Không tìm thấy trích dẫn này trong văn bản bài báo, hãy cẩn trọng.', askNext: 'Bạn có thể hỏi tiếp', askLeft: 'Hôm nay còn {n} câu hỏi', askSimpler: 'Tôi chưa hiểu phần này', askSignUp: 'Đăng ký miễn phí',
  makeLabel: 'Liên kết bài báo (arXiv, PDF hoặc DOI)', makeBtn: 'Tạo video của tôi', makeSending: 'Đang bắt đầu', makeEmpty: 'Hãy dán liên kết bài báo trước.', networkError: 'Không kết nối được máy chủ. Vui lòng thử lại.',
  stepQueued: 'Đang chờ đến lượt', stepRead: 'Đọc bài báo', stepScript: 'Viết kịch bản', stepCheck: 'Kiểm tra trích dẫn và số liệu', stepDone: 'Xong', waitNote: 'Thường mất 3 đến 5 phút. Bạn có thể để trang này mở.',
  optLength: 'Độ dài', optStyle: 'Giao diện', optTone: 'Giọng điệu', optCustom: 'Bối cảnh và yêu cầu (tùy chọn)', optCustomPh: 'ví dụ: tập trung vào thí nghiệm, bỏ qua toán, giải thích cho học sinh cấp 3', optMore: 'Phong cách và độ dài', min: '{n} phút',
  styleAnimated: 'Hoạt hình (AI vẽ)', styleCinema: 'Điện ảnh (vàng)', styleClassic: 'Tối cổ điển', styleLight: 'Giấy sáng', styleSunset: 'Hoàng hôn', styleMono: 'Đơn sắc',
  toneTeacher: 'Giáo viên rõ ràng', toneCasual: 'Bạn bè thân mật', toneAcademic: 'Bài nói học thuật', toneEli5: 'Giải thích như tôi là người mới', toneStory: 'Kể chuyện',
  existingTitle: 'Bài báo này đã có {n} video', existingHint: 'Xem một video, hoặc chọn độ dài, giao diện, giọng điệu khác để tạo video mới.', existingWatch: 'Xem', existingMaking: 'đang được tạo', makeNewBtn: 'Tạo video mới',
  fullVideo: 'Toàn bộ video', optLangs: 'Ngôn ngữ video', optVoice: 'Giọng đọc', voiceFemale: 'Nữ', voiceMale: 'Nam', etaLeft: 'Còn khoảng {m} phút', etaAlmost: 'Sắp xong',
  failedTitle: 'Không thể tạo video.', failedFallback: 'Đã xảy ra lỗi khi tạo video này. Vui lòng thử lại sau.', makeAnother: 'Tạo video khác',
  dlMp4: 'Tải MP4', copyLink: 'Sao chép liên kết', copied: 'Đã sao chép liên kết', share: 'Chia sẻ', download: 'Tải MP4', keepNote: 'Video được giữ 14 ngày rồi bị xóa. Hãy tải về những video bạn muốn giữ.',
  usefulQ: 'Video này có hữu ích không?', usefulYes: 'Hữu ích', usefulNo: 'Không hữu ích', send: 'Gửi', usefulThanks: 'Cảm ơn góp ý của bạn.',
  exTitle: 'Ví dụ', exSub: 'Video mẫu được tạo bằng Paperlit. Mọi trích dẫn và con số trong đó đã được đối chiếu với bài báo.', play: 'Phát', close: 'Đóng', videoLang: 'Ngôn ngữ video',
  howTitle: 'Cách hoạt động',     
     
  notCheckTitle: 'Những gì không được kiểm tra', notCheck: 'Nhãn ngắn trong sơ đồ chỉ là tóm tắt. Đây là công cụ học tập; hãy đọc bài báo để biết chi tiết.',
  footerNote: 'Video được tạo từ các bài báo arXiv công khai.', langVi: 'Tiếng Việt', langId: 'Bahasa Indonesia', stepVi: 'Thu âm Tiếng Việt', stepId: 'Thu âm Bahasa Indonesia',
  heroTitle: 'Thả bất kỳ bài báo nào vào. Học qua video.', heroSub: 'Bài báo nghiên cứu dài và khó đọc. Dán liên kết hoặc tải PDF lên để nhận video ngắn giảng giải bằng ngôn ngữ của bạn. Sau đó hãy đặt câu hỏi và tự kiểm tra.', groupPE: 'Học qua video', appRepro: 'Kiểm chứng kết quả', how1h: 'Thả bài báo vào', how1: 'Dán liên kết arXiv hoặc tải PDF lên.', how2h: 'Chúng tôi viết bài giảng', how2: 'AI viết kịch bản video và vẽ từng cảnh chỉ dựa trên văn bản bài báo.', how3h: 'Kiểm tra mọi dữ kiện', how3: 'Mỗi trích dẫn phải xuất hiện nguyên văn trong bài báo và mỗi con số cũng phải có trong đó. Phần nào không đạt sẽ bị loại trước khi thu âm.', how4h: 'Bạn xem và hỏi', how4: 'Video có lời dẫn bằng ngôn ngữ của bạn, có câu hỏi sau mỗi phần và một AI để bạn hỏi.', howSub: 'Từ bài báo đọc không nổi đến bài báo bạn hiểu, trong bốn bước.', makeTitle: 'Thả bài báo của bạn vào', makeSub: 'Dán liên kết bài báo hoặc tải PDF từ máy. Dùng thử không cần đăng ký; tài khoản miễn phí có một video mỗi ngày.', statTime: 'khoảng 4 phút mỗi video',
};

export const ID: D = {
  navFeatures: 'Yang Anda dapat',
  navMake: 'Buat video', navExamples: 'Contoh', navHow: 'Cara kerja', navPricing: 'Harga', navFeedback: 'Masukan', navFaq: 'Tanya jawab', navContact: 'Kontak',
  appAll: 'Semua aplikasi',  menu: 'Menu', closeMenu: 'Tutup menu', language: 'Bahasa', toDark: 'Beralih ke tema gelap', toLight: 'Beralih ke tema terang',
  
  
  heroMake: 'Buat video', heroWatch: 'Lihat contoh', statVideos: 'video dibuat', statLangs: 'bahasa', statChecked: 'kutipan dan angka diperiksa', statRemoved: 'dibuang oleh pemeriksaan', 
   
  uploadBtn: 'Unggah PDF', uploadOr: 'atau jatuhkan file PDF di sini. Maksimal {n} file, masing-masing {mb} MB. Satu video per file.', uploadNotPdf: 'Hanya file PDF yang dapat diunggah.', makeNBtn: 'Buat {n} video',
  uploadPrivate: 'PDF Anda tetap privat. File dihapus begitu video selesai; teksnya disimpan bersama video selama 14 hari agar Anda bisa bertanya.',
  tabVideo: 'Video', tabAsk: 'Tanya', askTitle: 'Tanya tentang makalah ini', askSub: 'Bingung di bagian tertentu? Tanyakan dengan kata-kata Anda sendiri. Setiap jawaban menyebut asalnya: dari makalah atau dari pengetahuan umum.',
  askModeLabel: 'Gaya jawaban', askModePlus: 'Makalah + pengetahuan umum', askModePaper: 'Hanya isi makalah', askPlaceholder: 'mis. Apa arti istilah ini?', askSend: 'Tanya', askThinking: 'Membaca makalah...',
  askStill: 'Masih diproses. Jawaban yang panjang bisa memakan waktu hingga satu menit.', askS1: 'Jelaskan makalah ini seolah saya baru di bidang ini', askS2: 'Apa yang perlu saya tahu sebelum membacanya?', askS3: 'Gagasan mana yang paling sulit dipahami?',
  askBadgePaper: 'Dari makalah', askBadgeGeneral: 'Pengetahuan umum, bukan dari makalah', askBadgeUnverified: 'Belum diverifikasi', askQuoteFound: 'Kutipan ditemukan di teks makalah',
  askQuoteMissing: 'Kutipan ini tidak ditemukan di teks makalah, jadi berhati-hatilah.', askNext: 'Anda bisa bertanya selanjutnya', askLeft: 'Sisa {n} pertanyaan hari ini', askSimpler: 'Saya belum paham bagian ini', askSignUp: 'Daftar gratis',
  makeLabel: 'Tautan makalah (arXiv, PDF atau DOI)', makeBtn: 'Buat video saya', makeSending: 'Memulai', makeEmpty: 'Tempel tautan makalah dulu.', networkError: 'Tidak dapat terhubung ke server. Silakan coba lagi.',
  stepQueued: 'Menunggu antrean', stepRead: 'Membaca makalah', stepScript: 'Menulis naskah', stepCheck: 'Memeriksa kutipan dan angka', stepDone: 'Selesai', waitNote: 'Biasanya 3 sampai 5 menit. Halaman ini boleh tetap terbuka.',
  optLength: 'Durasi', optStyle: 'Tampilan', optTone: 'Nada', optCustom: 'Konteks dan instruksi (opsional)', optCustomPh: 'mis. fokus pada eksperimen, lewati matematika, jelaskan untuk siswa SMA', optMore: 'Gaya dan durasi', min: '{n} menit',
  styleAnimated: 'Animasi (digambar AI)', styleCinema: 'Sinematik (emas)', styleClassic: 'Gelap klasik', styleLight: 'Kertas terang', styleSunset: 'Senja', styleMono: 'Monokrom',
  toneTeacher: 'Guru yang jelas', toneCasual: 'Teman santai', toneAcademic: 'Presentasi akademik', toneEli5: 'Jelaskan seolah saya pemula', toneStory: 'Cerita',
  existingTitle: 'Makalah ini sudah punya {n} video', existingHint: 'Tonton salah satunya, atau pilih durasi, tampilan, atau nada lain untuk membuat yang baru.', existingWatch: 'Tonton', existingMaking: 'sedang dibuat', makeNewBtn: 'Buat video baru',
  fullVideo: 'Seluruh video', optLangs: 'Bahasa video', optVoice: 'Suara', voiceFemale: 'Perempuan', voiceMale: 'Laki-laki', etaLeft: 'Sekitar {m} menit lagi', etaAlmost: 'Hampir selesai',
  failedTitle: 'Video tidak dapat dibuat.', failedFallback: 'Terjadi masalah saat membuat video ini. Silakan coba lagi nanti.', makeAnother: 'Buat video lain',
  dlMp4: 'Unduh MP4', copyLink: 'Salin tautan', copied: 'Tautan disalin', share: 'Bagikan', download: 'Unduh MP4', keepNote: 'Video disimpan selama 14 hari lalu dihapus. Unduh yang ingin Anda simpan.',
  usefulQ: 'Apakah ini berguna?', usefulYes: 'Berguna', usefulNo: 'Tidak berguna', send: 'Kirim', usefulThanks: 'Terima kasih atas masukannya.',
  exTitle: 'Contoh', exSub: 'Video contoh yang dibuat dengan Paperlit. Setiap kutipan dan angka di dalamnya sudah dicocokkan dengan makalahnya.', play: 'Putar', close: 'Tutup', videoLang: 'Bahasa video',
  howTitle: 'Cara kerja',     
     
  notCheckTitle: 'Yang tidak diperiksa', notCheck: 'Label pendek di diagram hanyalah ringkasan. Ini alat bantu belajar; baca makalahnya untuk detailnya.',
  footerNote: 'Video dibuat dari makalah arXiv yang terbuka untuk umum.', langVi: 'Tiếng Việt', langId: 'Bahasa Indonesia', stepVi: 'Merekam Tiếng Việt', stepId: 'Merekam Bahasa Indonesia',
  heroTitle: 'Masukkan makalah apa pun. Pelajari lewat video.', heroSub: 'Makalah riset itu panjang dan sulit dibaca. Tempel tautan atau unggah PDF untuk mendapat video singkat yang mengajarkannya dalam bahasa Anda. Lalu bertanya dan uji diri.', groupPE: 'Belajar lewat video', appRepro: 'Periksa hasilnya', how1h: 'Masukkan makalah', how1: 'Tempel tautan arXiv atau unggah PDF.', how2h: 'Kami menulis pelajarannya', how2: 'AI menulis naskah video dan menggambar tiap adegan hanya dari teks makalah.', how3h: 'Kami memeriksa setiap fakta', how3: 'Setiap kutipan harus muncul persis sama di makalah dan setiap angka juga harus ada di sana. Yang gagal dibuang sebelum perekaman.', how4h: 'Anda menonton dan bertanya', how4: 'Video bernarasi dalam bahasa Anda, dengan pertanyaan setelah tiap bagian dan AI yang bisa Anda tanya.', howSub: 'Dari makalah yang tak sanggup dibaca sampai yang dipahami, dalam empat langkah.', makeTitle: 'Masukkan makalah Anda', makeSub: 'Tempel tautan makalah atau unggah PDF dari komputer. Gratis dicoba tanpa daftar; akun gratis mendapat satu video per hari.', statTime: 'sekitar 4 menit per video',
};

/** A small helper for strings that live inside a component: pick the language, English when missing. */
export function pick<T>(lang: string, v: { en: T; zh?: T; vi?: T; id?: T }): T {
  return (v as Record<string, T | undefined>)[lang] ?? v.en;
}
