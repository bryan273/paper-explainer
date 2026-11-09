import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Minus, Building2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PayPanel, type OrderReq } from '@/components/billing/PayPanel';
import { StudentVerify } from '@/components/billing/StudentVerify';
import { useAccount } from '@/lib/account';
import { CURS, amount, fmtMoney, money, perMonthOfYear, preloadPayImages, useCurrency, type Cur, type PriceKey } from '@/lib/currency';
import { pick, usePrefs, type Tr } from '@/lib/prefs';
import { COMMON } from '@/lib/strings';
import { cn } from '@/lib/utils';

type Plan = 'plus' | 'pro' | 'premium';
type Billing = 'month' | 'year';
export const P = {
  h: { en: 'Plans that grow with how you learn', zh: '随你的学习方式成长的套餐', vi: 'Các gói phù hợp với cách bạn học', id: 'Paket yang tumbuh bersama cara Anda belajar' },
  s: { en: 'Start free. Pay in your local currency and stop whenever you like: plans never renew on their own.', zh: '先免费使用。用本地货币付款，随时可以停止：套餐不会自动续费。', vi: 'Bắt đầu miễn phí. Thanh toán bằng tiền tệ địa phương và dừng bất cứ lúc nào: gói không tự gia hạn.', id: 'Mulai gratis. Bayar dengan mata uang lokal dan berhenti kapan saja: paket tidak diperpanjang otomatis.' },
  month: { en: 'Monthly', zh: '按月', vi: 'Theo tháng', id: 'Bulanan' },
  year: { en: 'Yearly', zh: '按年', vi: 'Theo năm', id: 'Tahunan' },
  save: { en: '2 months free', zh: '送 2 个月', vi: 'Tặng 2 tháng', id: 'Gratis 2 bulan' },
  per: { en: '/ month', zh: '/ 月', vi: '/ tháng', id: '/ bulan' },
  billedYear: { en: '{p} billed once a year', zh: '一次付一年 {p}', vi: 'Thanh toán {p} một năm một lần', id: 'Ditagih {p} per tahun' },
  billedMonth: { en: 'Billed monthly', zh: '按月付费', vi: 'Thanh toán theo tháng', id: 'Ditagih bulanan' },
  popular: { en: 'Most popular', zh: '最受欢迎', vi: 'Phổ biến nhất', id: 'Paling populer' },
  best: { en: 'Best value', zh: '最划算', vi: 'Đáng giá nhất', id: 'Paling hemat' },
  freeSub: { en: 'To get started', zh: '入门体验', vi: 'Để bắt đầu', id: 'Untuk memulai' },
  plusSub: { en: 'For regular study', zh: '适合日常学习', vi: 'Cho việc học thường xuyên', id: 'Untuk belajar rutin' },
  proSub: { en: 'For long papers and deep work', zh: '适合长论文和深入学习', vi: 'Cho bài dài và học chuyên sâu', id: 'Untuk makalah panjang dan belajar mendalam' },
  premiumSub: { en: 'For heavy use and teaching', zh: '适合大量使用和教学', vi: 'Cho người dùng nhiều và giảng dạy', id: 'Untuk pemakaian berat dan mengajar' },
  startFree: { en: 'Start free', zh: '免费开始', vi: 'Bắt đầu miễn phí', id: 'Mulai gratis' },
  current: { en: 'Your plan', zh: '当前套餐', vi: 'Gói hiện tại', id: 'Paket Anda' },
  get: { en: 'Get {p}', zh: '选择 {p}', vi: 'Chọn {p}', id: 'Pilih {p}' },
  openApp: { en: 'Open dashboard', zh: '打开控制台', vi: 'Mở bảng điều khiển', id: 'Buka dasbor' },
  payIn: { en: 'Prices in', zh: '显示货币', vi: 'Hiển thị giá bằng', id: 'Harga dalam' },
  customH: { en: 'Custom plans for classes, labs and teams', zh: '为班级、实验室和团队定制', vi: 'Gói riêng cho lớp học, phòng thí nghiệm và nhóm', id: 'Paket khusus untuk kelas, lab, dan tim' },
  customP: { en: 'More videos, seats for a whole class, your own sources and languages, invoices and one person to talk to.', zh: '更多视频、整班席位、自定义资料和语言、发票，以及专人对接。', vi: 'Nhiều video hơn, tài khoản cho cả lớp, nguồn và ngôn ngữ riêng, hóa đơn và một người hỗ trợ riêng.', id: 'Video lebih banyak, akun untuk satu kelas, sumber dan bahasa sendiri, faktur, dan satu orang yang bisa dihubungi.' },
  talk: { en: 'Contact us', zh: '联系我们', vi: 'Liên hệ', id: 'Hubungi kami' },
  cmpH: { en: 'Compare plans', zh: '套餐对比', vi: 'So sánh các gói', id: 'Bandingkan paket' },
  packsH: { en: 'Only need a few videos?', zh: '只需要几个视频？', vi: 'Chỉ cần vài video?', id: 'Hanya butuh beberapa video?' },
  packsP: { en: 'Buy Pro videos without a plan: up to 10 minutes each, interactive mode included. They never expire, and a video that fails gives its credit back.', zh: '无需套餐即可购买 Pro 视频：每个最长 10 分钟，含互动模式。永不过期，视频失败自动退还。', vi: 'Mua video Pro mà không cần gói: mỗi video tối đa 10 phút, có chế độ tương tác. Không hết hạn, video lỗi được hoàn lại.', id: 'Beli video Pro tanpa paket: masing-masing hingga 10 menit, termasuk mode interaktif. Tidak kedaluwarsa, dan video yang gagal dikembalikan.' },
  videos: { en: '{n} Pro videos', zh: '{n} 个 Pro 视频', vi: '{n} video Pro', id: '{n} video Pro' },
  each: { en: '{p} per video', zh: '每个 {p}', vi: '{p} mỗi video', id: '{p} per video' },
  payH: { en: 'Pay', zh: '付款', vi: 'Thanh toán', id: 'Bayar' },
  faqH: { en: 'Plans and payment, explained', zh: '关于套餐和付款', vi: 'Giải đáp về gói và thanh toán', id: 'Penjelasan paket dan pembayaran' },
  faqS: { en: 'Everything you may want to know before you choose. Anything else, ask us in the chat at the bottom right.', zh: '选择之前你可能想知道的一切。其他问题，请在右下角的对话框问我们。', vi: 'Mọi điều bạn có thể muốn biết trước khi chọn. Câu hỏi khác, hãy hỏi chúng tôi trong khung chat ở góc dưới bên phải.', id: 'Semua yang mungkin ingin Anda ketahui sebelum memilih. Pertanyaan lain, tanyakan lewat chat di kanan bawah.' },
  faq: {
    en: [
      ['How do I pay?', 'Choose the currency you want to pay in: Chinese yuan (WeChat Pay or Alipay), Vietnamese dong (bank transfer by VietQR) or Indonesian rupiah (QRIS, which works with GoPay, OVO, DANA and every Indonesian bank app). Scan the code, pay the exact amount, write the order number in the payment note and press "I have paid". We switch your plan on as soon as the payment is confirmed, usually within a few hours and always within a day.'],
      ['What counts as one video?', 'A video of up to 5 minutes uses one video from your allowance. A 7 or 10 minute video uses two. If a video fails, it is given back to you automatically.'],
      ['What is interactive mode?', 'Interactive mode is something you turn on for a video. The video then pauses at the end of each part with one question, explains the answer right away, and adds a quiz tab and a final quiz. Turning it on for a video uses one from your interactive allowance; turning it on again for the same video is free. Your allowance does not give you extra videos.'],
      ['What is an in-depth answer?', 'When you ask about a video, a quick answer comes in seconds. An in-depth answer uses a stronger AI that takes longer, reasons step by step and quotes the source with page numbers. Your plan sets how many in-depth answers you get each month, across all your videos.'],
      ['What happens to videos I do not use?', 'The videos of a plan are added to your balance when the plan starts and they do not expire. You can still use them after the plan ends; only the longest video length follows the plan you have at that moment.'],
      ['How long are my videos kept?', 'Free: 7 days. Plus: 30 days. Pro: 90 days. Premium: 270 days. You can download any video while it is kept, and you can always make it again.'],
      ['Which currency will I see?', 'The currency of the country in your profile. You can switch at the top of this page or in the payment window; prices are set for each country, not converted.'],
      ['Can I cancel?', 'There is nothing to cancel: plans never renew on their own. When a period ends, you simply do not pay for the next one. If a payment went wrong, contact us and we will sort it out.'],
      ['Can my class or team pay together?', 'Yes. We make custom plans with seats for a whole class or team, invoices and one person to talk to. Use "Contact us" above.'],
    ],
    zh: [
      ['怎么付款？', '先选择付款货币：人民币（微信支付或支付宝）、越南盾（VietQR 银行转账）或印尼盾（QRIS，支持 GoPay、OVO、DANA 和所有印尼银行 App）。扫码支付准确金额，在付款备注中填写订单号，然后点击“我已付款”。付款确认后立即开通，通常几小时内，最迟一天。'],
      ['怎样算一个视频？', '5 分钟以内的视频算一个。7 分钟或 10 分钟的视频算两个。视频生成失败会自动退还。'],
      ['什么是互动模式？', '互动模式是你为某个视频开启的功能：视频在每段结束时暂停并提一个问题，立即讲解答案，还会增加测验标签和期末测验。为一个视频开启会用掉一次互动额度；同一个视频再次开启不再计数。互动额度不会额外增加视频数量。'],
      ['什么是深入回答？', '对视频提问时，快速回答几秒就到。深入回答使用更强的 AI，用时更长，逐步推理，并标注原文页码。每个视频可用的深入回答次数由套餐决定。'],
      ['没用完的视频怎么办？', '套餐开通时，视频数会加入你的余额，并且不会过期。套餐结束后仍可使用；只是视频最长时长按你当时的套餐计算。'],
      ['视频保存多久？', '免费版 7 天，Plus 30 天，Pro 90 天，Premium 270 天。保存期内可随时下载，也可以随时重新生成。'],
      ['会显示哪种货币？', '默认显示你资料中所在国家的货币。可在本页顶部或付款窗口切换；各国价格单独设定，不做汇率换算。'],
      ['可以取消吗？', '无需取消：套餐不会自动续费。到期后不付下一期即可。如果付款出现问题，请联系我们处理。'],
      ['班级或团队可以一起付款吗？', '可以。我们提供定制方案：整班或整个团队的席位、发票，以及专人对接。请点击上方“联系我们”。'],
    ],
    vi: [
      ['Thanh toán thế nào?', 'Chọn loại tiền bạn muốn trả: nhân dân tệ (WeChat Pay hoặc Alipay), đồng Việt Nam (chuyển khoản ngân hàng qua VietQR) hoặc rupiah Indonesia (QRIS, dùng được với GoPay, OVO, DANA và mọi ứng dụng ngân hàng Indonesia). Quét mã, chuyển đúng số tiền, ghi mã đơn vào nội dung chuyển khoản rồi nhấn "Tôi đã chuyển khoản". Gói được kích hoạt ngay khi thanh toán được xác nhận, thường trong vài giờ và chậm nhất trong một ngày.'],
      ['Thế nào được tính là một video?', 'Video dài tối đa 5 phút được tính là một video. Video 7 hoặc 10 phút được tính là hai. Nếu video bị lỗi, lượt đó được hoàn lại tự động.'],
      ['Chế độ tương tác là gì?', 'Chế độ tương tác là tính năng bạn bật cho từng video. Khi bật, video dừng ở cuối mỗi phần với một câu hỏi, giải thích đáp án ngay, đồng thời có thêm mục bài kiểm tra và bài kiểm tra cuối. Mỗi lần bật cho một video sẽ dùng một lượt tương tác; bật lại cho cùng video đó thì miễn phí. Lượt tương tác không phải là video tặng thêm.'],
      ['Câu trả lời chuyên sâu là gì?', 'Khi bạn hỏi về một video, câu trả lời nhanh có trong vài giây. Câu trả lời chuyên sâu dùng AI mạnh hơn, mất thời gian hơn, lập luận từng bước và trích dẫn nguồn kèm số trang. Số câu trả lời chuyên sâu cho mỗi video tùy theo gói của bạn.'],
      ['Video chưa dùng hết thì sao?', 'Số video của gói được cộng vào số dư khi gói bắt đầu và không hết hạn. Bạn vẫn dùng được sau khi gói kết thúc; chỉ có độ dài tối đa của video là theo gói bạn đang có lúc đó.'],
      ['Video được lưu bao lâu?', 'Miễn phí: 7 ngày. Plus: 30 ngày. Pro: 90 ngày. Premium: 270 ngày. Bạn có thể tải video về bất cứ lúc nào trong thời gian lưu, và luôn có thể tạo lại.'],
      ['Giá sẽ hiển thị bằng tiền gì?', 'Bằng tiền của quốc gia trong hồ sơ của bạn. Bạn có thể đổi ở đầu trang này hoặc trong cửa sổ thanh toán; giá được đặt riêng cho từng nước, không quy đổi theo tỷ giá.'],
      ['Tôi có thể hủy không?', 'Không cần hủy: gói không bao giờ tự gia hạn. Khi hết kỳ, bạn chỉ cần không thanh toán kỳ tiếp theo. Nếu thanh toán gặp sự cố, hãy liên hệ để chúng tôi xử lý.'],
      ['Lớp học hoặc nhóm có thể thanh toán chung không?', 'Có. Chúng tôi có gói riêng với tài khoản cho cả lớp hoặc cả nhóm, hóa đơn và một người hỗ trợ riêng. Hãy bấm "Liên hệ" ở phía trên.'],
    ],
    id: [
      ['Bagaimana cara bayar?', 'Pilih mata uang yang ingin Anda pakai: yuan Tiongkok (WeChat Pay atau Alipay), dong Vietnam (transfer bank lewat VietQR), atau rupiah (QRIS, bisa dengan GoPay, OVO, DANA, dan semua aplikasi bank di Indonesia). Pindai kode, bayar sesuai nominal, tulis kode pesanan di catatan pembayaran, lalu tekan "Saya sudah bayar". Paket langsung aktif begitu pembayaran dikonfirmasi, biasanya dalam beberapa jam dan paling lambat sehari.'],
      ['Apa yang dihitung sebagai satu video?', 'Video hingga 5 menit dihitung satu video. Video 7 atau 10 menit dihitung dua. Kalau video gagal dibuat, jatahnya dikembalikan otomatis.'],
      ['Apa itu mode interaktif?', 'Mode interaktif adalah fitur yang Anda nyalakan per video. Video akan berhenti di akhir tiap bagian dengan satu pertanyaan, langsung menjelaskan jawabannya, dan menambah tab kuis serta kuis akhir. Menyalakannya untuk satu video memakai satu jatah interaktif; menyalakan lagi di video yang sama tidak dihitung. Jatah interaktif bukan tambahan video.'],
      ['Apa itu jawaban mendalam?', 'Saat Anda bertanya tentang video, jawaban cepat datang dalam hitungan detik. Jawaban mendalam memakai AI yang lebih kuat, butuh waktu lebih lama, bernalar langkah demi langkah, dan mengutip sumber lengkap dengan nomor halaman. Jumlahnya per video ditentukan oleh paket Anda.'],
      ['Bagaimana dengan video yang tidak terpakai?', 'Jatah video paket masuk ke saldo Anda saat paket mulai dan tidak kedaluwarsa. Anda tetap bisa memakainya setelah paket berakhir; hanya durasi video terpanjang yang mengikuti paket Anda saat itu.'],
      ['Berapa lama video disimpan?', 'Gratis: 7 hari. Plus: 30 hari. Pro: 90 hari. Premium: 270 hari. Anda bisa mengunduh video kapan saja selama masih disimpan, dan selalu bisa membuatnya lagi.'],
      ['Mata uang apa yang akan saya lihat?', 'Mata uang negara di profil Anda. Anda bisa menggantinya di bagian atas halaman ini atau di jendela pembayaran; harga ditetapkan per negara, bukan hasil konversi kurs.'],
      ['Bisakah saya berhenti berlangganan?', 'Tidak ada yang perlu dibatalkan: paket tidak pernah diperpanjang otomatis. Saat periode berakhir, cukup tidak membayar periode berikutnya. Kalau ada masalah pembayaran, hubungi kami dan kami bereskan.'],
      ['Bisakah kelas atau tim membayar bersama?', 'Bisa. Kami membuat paket khusus dengan akun untuk satu kelas atau tim, faktur, dan satu orang yang bisa dihubungi. Gunakan tombol "Hubungi kami" di atas.'],
    ],
  } as Tr<[string, string][]>,
};

// one row per feature: label, then the value for Free, Plus, Pro, Premium (true = included, false = not, string = value)
type Cell = boolean | string;
export const ROWS = (t: <X>(v: Tr<X>) => X): [string, Cell, Cell, Cell, Cell][] => [
  [t({ en: 'Videos', zh: '视频', vi: 'Video', id: 'Video' }), t({ en: '5 a week', zh: '每周 5 个', vi: '5 mỗi tuần', id: '5 per minggu' }), t({ en: '80 a month', zh: '每月 80 个', vi: '80 mỗi tháng', id: '80 per bulan' }), t({ en: '150 a month', zh: '每月 150 个', vi: '150 mỗi tháng', id: '150 per bulan' }), t({ en: '280 a month', zh: '每月 280 个', vi: '280 mỗi tháng', id: '280 per bulan' })],
  [t({ en: 'Longest video', zh: '最长视频', vi: 'Video dài nhất', id: 'Video terpanjang' }), t({ en: '3 min', zh: '3 分钟', vi: '3 phút', id: '3 menit' }), t({ en: '5 min', zh: '5 分钟', vi: '5 phút', id: '5 menit' }), t({ en: '10 min', zh: '10 分钟', vi: '10 phút', id: '10 menit' }), t({ en: '10 min', zh: '10 分钟', vi: '10 phút', id: '10 menit' })],
  [t({ en: 'Interactive mode', zh: '互动模式', vi: 'Chế độ tương tác', id: 'Mode interaktif' }), t({ en: '3 videos a week', zh: '每周 3 个视频', vi: '3 video mỗi tuần', id: '3 video per minggu' }), t({ en: '40 videos a month', zh: '每月 40 个视频', vi: '40 video mỗi tháng', id: '40 video per bulan' }), t({ en: '75 videos a month', zh: '每月 75 个视频', vi: '75 video mỗi tháng', id: '75 video per bulan' }), t({ en: '140 videos a month', zh: '每月 140 个视频', vi: '140 video mỗi tháng', id: '140 video per bulan' })],
  [t({ en: 'In-depth answers a month', zh: '每月深入回答', vi: 'Trả lời chuyên sâu mỗi tháng', id: 'Jawaban mendalam per bulan' }), '3', '30', '80', '160'],
  [t({ en: 'Quick answers', zh: '快速回答', vi: 'Trả lời nhanh', id: 'Jawaban cepat' }), true, true, true, true],
  [t({ en: 'Quiz and final quiz', zh: '测验和期末测验', vi: 'Bài kiểm tra và bài kiểm tra cuối', id: 'Kuis dan kuis akhir' }), true, true, true, true],
  [t({ en: 'Notes and flashcards', zh: '笔记和闪卡', vi: 'Ghi chú và thẻ ghi nhớ', id: 'Catatan dan kartu hafalan' }), false, true, true, true],
  [t({ en: 'Answers pitched to your level', zh: '按你的水平回答', vi: 'Trả lời theo trình độ của bạn', id: 'Jawaban sesuai tingkat Anda' }), false, true, true, true],
  [t({ en: 'Videos kept', zh: '视频保存', vi: 'Thời gian lưu video', id: 'Video disimpan' }), t({ en: '7 days', zh: '7 天', vi: '7 ngày', id: '7 hari' }), t({ en: '30 days', zh: '30 天', vi: '30 ngày', id: '30 hari' }), t({ en: '90 days', zh: '90 天', vi: '90 ngày', id: '90 hari' }), t({ en: '270 days', zh: '270 天', vi: '270 ngày', id: '270 hari' })],
  [t({ en: 'Failed video given back', zh: '失败视频自动退还', vi: 'Hoàn lại video lỗi', id: 'Video gagal dikembalikan' }), true, true, true, true],
  [t({ en: 'New features first', zh: '新功能优先体验', vi: 'Dùng tính năng mới trước', id: 'Fitur baru lebih dulu' }), false, false, false, true],
];
export const HL: Record<'free' | Plan, Tr<string[]>> = {
  free: { en: ['5 videos a week, up to 3 minutes', 'Interactive mode on 3 videos a week', '3 in-depth answers a month', 'Quick answers, quiz and final quiz', 'Videos kept for 7 days'], zh: ['每周 5 个视频，最长 3 分钟', '每周 3 个视频可开互动模式', '每月 3 次深入回答', '快速回答、测验和期末测验', '视频保存 7 天'], vi: ['5 video mỗi tuần, tối đa 3 phút', 'Chế độ tương tác cho 3 video mỗi tuần', '3 câu trả lời chuyên sâu mỗi tháng', 'Trả lời nhanh, bài kiểm tra và bài kiểm tra cuối', 'Video được lưu trong 7 ngày'], id: ['5 video per minggu, hingga 3 menit', 'Mode interaktif untuk 3 video per minggu', '3 jawaban mendalam per bulan', 'Jawaban cepat, kuis, dan kuis akhir', 'Video disimpan 7 hari'] },
  plus: { en: ['80 videos a month, up to 5 minutes', 'Interactive mode on 40 videos', '30 in-depth answers a month', 'Notes and flashcards', 'Answers pitched to your level', 'Videos kept for 30 days'], zh: ['每月 80 个视频，最长 5 分钟', '40 个视频可开互动模式', '每月 30 次深入回答', '笔记和闪卡', '按你的水平回答', '视频保存 30 天'], vi: ['80 video mỗi tháng, tối đa 5 phút', 'Chế độ tương tác cho 40 video', '30 câu trả lời chuyên sâu mỗi tháng', 'Ghi chú và thẻ ghi nhớ', 'Trả lời theo trình độ của bạn', 'Video được lưu trong 30 ngày'], id: ['80 video per bulan, hingga 5 menit', 'Mode interaktif untuk 40 video', '30 jawaban mendalam per bulan', 'Catatan dan kartu hafalan', 'Jawaban sesuai tingkat Anda', 'Video disimpan 30 hari'] },
  pro: { en: ['150 videos a month, up to 10 minutes', 'Interactive mode on 75 videos', '80 in-depth answers a month', 'Videos kept for 90 days', 'Everything in Plus'], zh: ['每月 150 个视频，最长 10 分钟', '75 个视频可开互动模式', '每月 80 次深入回答', '视频保存 90 天', '包含 Plus 全部功能'], vi: ['150 video mỗi tháng, tối đa 10 phút', 'Chế độ tương tác cho 75 video', '80 câu trả lời chuyên sâu mỗi tháng', 'Video được lưu trong 90 ngày', 'Mọi tính năng của Plus'], id: ['150 video per bulan, hingga 10 menit', 'Mode interaktif untuk 75 video', '80 jawaban mendalam per bulan', 'Video disimpan 90 hari', 'Semua yang ada di Plus'] },
  premium: { en: ['280 videos a month, up to 10 minutes', 'Interactive mode on 140 videos', '160 in-depth answers a month', 'Videos kept for 270 days', 'New features first', 'Everything in Pro'], zh: ['每月 280 个视频，最长 10 分钟', '140 个视频可开互动模式', '每月 160 次深入回答', '视频保存 270 天', '新功能优先体验', '包含 Pro 全部功能'], vi: ['280 video mỗi tháng, tối đa 10 phút', 'Chế độ tương tác cho 140 video', '160 câu trả lời chuyên sâu mỗi tháng', 'Video được lưu trong 270 ngày', 'Dùng tính năng mới trước', 'Mọi tính năng của Pro'], id: ['280 video per bulan, hingga 10 menit', 'Mode interaktif untuk 140 video', '160 jawaban mendalam per bulan', 'Video disimpan 270 hari', 'Fitur baru lebih dulu', 'Semua yang ada di Pro'] },
};
const PACKS = [{ k: '5', n: 5 }, { k: '20', n: 20 }, { k: '50', n: 50 }];
/** A pack's price for one video, rounded: to 0.1 yuan, or to 100 dong or rupiah. */
const perVideo = (key: PriceKey, n: number, cur: Cur) => { const x = amount(key, cur) / n; return cur === 'cny' ? `¥${(Math.round(x * 10) / 10).toFixed(1)}` : fmtMoney(Math.round(x / 100) * 100, cur); };

/** The money switch shown above prices. */
export function CurrencySwitch({ cur, setCur, className }: { cur: Cur; setCur: (c: Cur) => void; className?: string }) {
  const { t } = usePrefs();
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground">{t(P.payIn)}</span>
      <div className="inline-flex rounded-full border bg-muted p-1" role="radiogroup" aria-label={t(P.payIn)}>
        {CURS.map((c) => <button key={c.k} type="button" role="radio" aria-checked={cur === c.k} onClick={() => setCur(c.k)} className={cn('rounded-full px-3 py-1 text-sm font-medium transition', cur === c.k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{c.sym} {c.label}</button>)}
      </div>
    </div>
  );
}

export default function Pricing() {
  const { lang, t } = usePrefs();
  const { user, me, openAuth } = useAccount();
  const [cur, setCur] = useCurrency(lang, me?.country);
  const [billing, setBilling] = useState<Billing>('year');
  const [order, setOrder] = useState<OrderReq | null>(null);
  const rows = ROWS(t);
  const myPlan = me?.plan ?? null;
  useEffect(() => { preloadPayImages(); }, []);

  const buy = (key: string, body: Record<string, unknown>, label: string, priceKey: PriceKey) => {
    if (!user) { openAuth('register'); return; }
    setOrder({ key, body, label, priceKey });
  };

  const card = (id: 'free' | Plan) => {
    const name = id === 'free' ? t(COMMON.free) : id[0].toUpperCase() + id.slice(1);
    const sub = t(P[`${id}Sub` as const]);
    const monthly = id === 'free' ? 0 : billing === 'year' ? perMonthOfYear(`${id}_year`, cur) : amount(`${id}_month`, cur);
    const featured = id === 'plus';
    const dark = id === 'pro' || id === 'premium';
    return (
      <div key={id} className={cn('relative flex flex-col rounded-2xl border p-6 transition hover:-translate-y-0.5', featured && 'border-2 border-primary shadow-[0_12px_40px_-12px_hsl(var(--primary)/0.45)]',
        id === 'pro' && 'border-[#2b2275] bg-[#17123f] text-white', id === 'premium' && 'border-[#d9b45a] bg-[#14110a] text-[#f6efe0]', !dark && 'bg-card')}>
        {featured && <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">{t(P.popular)}</span>}
        {id === 'premium' && <span className="absolute -top-3 left-6 rounded-full bg-[#e6c46a] px-3 py-1 text-xs font-semibold text-[#1b1606]">{t(P.best)}</span>}
        <p className="font-display text-lg font-semibold">{name}</p>
        <p className={cn('text-sm', dark ? 'text-white/65' : 'text-muted-foreground')}>{sub}</p>
        <div className="mt-5 flex flex-wrap items-baseline gap-x-1.5">
          <span className="font-display text-[34px] font-bold leading-none">{fmtMoney(monthly, cur)}</span>
          {id !== 'free' && <span className={cn('text-sm', dark ? 'text-white/65' : 'text-muted-foreground')}>{t(P.per)}</span>}
        </div>
        <p className={cn('mt-1.5 min-h-[20px] text-xs', dark ? 'text-white/60' : 'text-muted-foreground')}>
          {id === 'free' ? '' : billing === 'year' ? <>{t(P.billedYear).replace('{p}', money(`${id}_year` as PriceKey, cur))} <span className={cn('ml-1 rounded-full px-1.5 py-0.5 font-semibold', id === 'premium' ? 'bg-[#e6c46a] text-[#1b1606]' : id === 'pro' ? 'bg-[#f0c15a] text-[#17123f]' : 'bg-success/15 text-success')}>{t(P.save)}</span></> : t(P.billedMonth)}
        </p>
        <ul className="mt-5 grid flex-1 content-start gap-2.5 text-[14px]">
          {pick(lang, HL[id]).map((x) => <li key={x} className="flex gap-2"><Check className={cn('mt-0.5 h-4 w-4 shrink-0', id === 'premium' ? 'text-[#e6c46a]' : id === 'pro' ? 'text-[#f0c15a]' : 'text-primary')} /><span>{x}</span></li>)}
        </ul>
        <div className="mt-6">
          {id === 'free' ? (
            user ? <Button asChild variant="outline" className="w-full"><Link to="/app">{t(P.openApp)}</Link></Button> : <Button variant="outline" className="w-full" onClick={() => openAuth('register')}>{t(P.startFree)}</Button>
          ) : myPlan === id ? (
            <p className="flex h-10 items-center justify-center gap-1.5 rounded-md bg-white/10 text-sm font-semibold"><Check className="h-4 w-4" />{t(P.current)}</p>
          ) : (
            <Button className={cn('w-full', id === 'pro' && 'bg-[#f0c15a] text-[#17123f] hover:bg-[#f5cf78]', id === 'premium' && 'bg-[#e6c46a] text-[#1b1606] hover:bg-[#efd38b]')}
              onClick={() => buy(id, { plan: `${id}_${billing}` }, `${name} · ${billing === 'year' ? t(P.year) : t(P.month)}`, `${id}_${billing}` as PriceKey)}>
              {t(P.get).replace('{p}', name)}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="pl-container pt-14 sm:pt-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="pl-h2 sm:text-[2.8rem]">{t(P.h)}</h1>
        <p className="pl-lede mt-4">{t(P.s)}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex rounded-full border bg-muted p-1" role="radiogroup" aria-label="Billing">
            {(['month', 'year'] as const).map((b) => (
              <button key={b} type="button" role="radio" aria-checked={billing === b} onClick={() => setBilling(b)} className={cn('rounded-full px-5 py-2 text-sm font-medium transition', billing === b ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}>
                {t(P[b])}{b === 'year' && <span className="ml-1.5 text-xs font-semibold text-success">{t(P.save)}</span>}
              </button>
            ))}
          </div>
          <CurrencySwitch cur={cur} setCur={setCur} />
        </div>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{(['free', 'plus', 'pro', 'premium'] as const).map(card)}</div>

      <div className="pl-card mt-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-muted"><Building2 className="h-6 w-6" /></span>
        <div className="flex-1"><p className="font-display text-lg font-semibold">{t(P.customH)}</p><p className="mt-1 text-sm text-muted-foreground">{t(P.customP)}</p></div>
        <Button variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('pl-support', { detail: 'contact' }))}>{t(P.talk)}</Button>
      </div>
      <StudentVerify className="mt-4" />

      <section className="mt-20">
        <h2 className="pl-h2">{t(P.cmpH)}</h2>
        <div className="mt-8 overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[680px] text-sm">
            <thead><tr className="border-b bg-muted/50"><th className="px-5 py-4 text-left font-medium text-muted-foreground" />{[t(COMMON.free), 'Plus', 'Pro', 'Premium'].map((h, i) => <th key={h} className={cn('px-4 py-4 text-center font-display text-base font-semibold', i === 1 && 'text-primary')}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r[0]} className="border-b last:border-0">
                  <td className="px-5 py-3.5 font-medium">{r[0]}</td>
                  {r.slice(1).map((v, i) => <td key={i} className="px-4 py-3.5 text-center">{v === true ? <Check className="mx-auto h-4 w-4 text-primary" /> : v === false ? <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" /> : v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16 grid gap-6 rounded-2xl border bg-muted/40 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div><p className="flex items-center gap-2 font-display text-xl font-semibold"><Sparkles className="h-5 w-5 text-lit" />{t(P.packsH)}</p><p className="mt-1 max-w-[60ch] text-sm text-muted-foreground">{t(P.packsP)}</p></div>
        <div className="grid gap-2 sm:grid-cols-3">
          {PACKS.map((k) => (
            <button key={k.k} type="button" onClick={() => buy(`pack_${k.k}`, { pack: k.k }, t(P.videos).replace('{n}', String(k.n)), `pack_${k.k}` as PriceKey)}
              className="rounded-xl border bg-background px-5 py-3 text-left transition hover:border-primary">
              <p className="font-semibold">{t(P.videos).replace('{n}', String(k.n))}</p>
              <p className="text-sm">{money(`pack_${k.k}` as PriceKey, cur)}</p>
              <p className="text-xs text-muted-foreground">{t(P.each).replace('{p}', perVideo(`pack_${k.k}` as PriceKey, k.n, cur))}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-20 grid gap-8 border-t pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div>
          <h2 className="pl-h2">{t(P.faqH)}</h2>
          <p className="mt-3 max-w-[40ch] text-muted-foreground">{t(P.faqS)}</p>
        </div>
        <Accordion type="single" collapsible defaultValue={pick(lang, P.faq)[0][0]}>
          {pick(lang, P.faq).map(([q, a]) => (
            <AccordionItem key={q} value={q}><AccordionTrigger className="text-left text-[16px] font-semibold">{q}</AccordionTrigger><AccordionContent className="max-w-[70ch] text-[15px] leading-relaxed text-muted-foreground">{a}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
      </section>

      <Dialog open={!!order} onOpenChange={(o) => { if (!o) setOrder(null); }}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-[640px]">
          <DialogTitle className="sr-only">{t(P.payH)}</DialogTitle>
          {order && <PayPanel req={order} onClose={() => setOrder(null)} />}
        </DialogContent>
      </Dialog>
    </main>
  );
}

