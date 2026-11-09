import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Minus, Building2, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PayPanel } from '@/components/billing/PayPanel';
import { StudentVerify } from '@/components/billing/StudentVerify';
import { accountApi, track, useAccount } from '@/lib/account';
import { amount, curOf, fmtMoney, money, perMonthOfYear, type PriceKey } from '@/lib/currency';
import { usePrefs, type Lang } from '@/lib/prefs';
import { COMMON } from '@/lib/strings';
import { cn } from '@/lib/utils';

type Plan = 'plus' | 'pro' | 'premium';
type Billing = 'month' | 'year';
export const P = {
  h: { en: 'Plans that grow with how you learn', zh: '随你的学习方式成长的套餐', vi: 'Các gói phát triển cùng cách bạn học', id: 'Paket yang tumbuh bersama cara Anda belajar' },
  s: { en: 'Start free. Prices are in your local money. Cancel any time by not renewing.', zh: '先免费用。价格按本地货币显示，不续费即取消。', vi: 'Bắt đầu miễn phí. Giá theo tiền nước bạn. Muốn hủy chỉ cần không gia hạn.', id: 'Mulai gratis. Harga dalam mata uang lokal. Berhenti kapan saja dengan tidak memperpanjang.' },
  month: { en: 'Monthly', zh: '按月', vi: 'Theo tháng', id: 'Bulanan' },
  year: { en: 'Yearly', zh: '按年', vi: 'Theo năm', id: 'Tahunan' },
  save: { en: '2 months free', zh: '送 2 个月', vi: 'Tặng 2 tháng', id: 'Gratis 2 bulan' },
  per: { en: '/ month', zh: '/ 月', vi: '/ tháng', id: '/ bulan' },
  billedYear: { en: '{p} billed once a year', zh: '一次付一年 {p}', vi: 'Thanh toán {p} mỗi năm', id: 'Ditagih {p} per tahun' },
  billedMonth: { en: 'Billed monthly', zh: '按月付费', vi: 'Thanh toán theo tháng', id: 'Ditagih bulanan' },
  popular: { en: 'Most popular', zh: '最受欢迎', vi: 'Phổ biến nhất', id: 'Paling populer' },
  best: { en: 'Best value', zh: '最划算', vi: 'Đáng giá nhất', id: 'Paling hemat' },
  freeSub: { en: 'Try everything', zh: '体验全部功能', vi: 'Dùng thử mọi tính năng', id: 'Coba semua fitur' },
  plusSub: { en: 'For regular study', zh: '适合日常学习', vi: 'Cho việc học thường xuyên', id: 'Untuk belajar rutin' },
  proSub: { en: 'For long papers and deep work', zh: '适合长论文和深入学习', vi: 'Cho bài dài và học sâu', id: 'Untuk makalah panjang dan belajar mendalam' },
  premiumSub: { en: 'For heavy use and teaching', zh: '适合大量使用和教学', vi: 'Cho người dùng nhiều và giảng dạy', id: 'Untuk pemakaian berat dan mengajar' },
  startFree: { en: 'Start free', zh: '免费开始', vi: 'Bắt đầu miễn phí', id: 'Mulai gratis' },
  current: { en: 'Your plan', zh: '当前套餐', vi: 'Gói hiện tại', id: 'Paket Anda' },
  get: { en: 'Get {p}', zh: '购买 {p}', vi: 'Mua {p}', id: 'Ambil {p}' },
  openApp: { en: 'Open dashboard', zh: '打开控制台', vi: 'Mở bảng điều khiển', id: 'Buka dasbor' },
  customH: { en: 'Custom plans for classes, labs and teams', zh: '为班级、实验室和团队定制', vi: 'Gói riêng cho lớp học, nhóm nghiên cứu và đội', id: 'Paket khusus untuk kelas, lab, dan tim' },
  customP: { en: 'More videos, seats for a whole class, your own sources and languages, invoices and a person to talk to.', zh: '更多视频、整班席位、自定义资料和语言、发票和专人对接。', vi: 'Nhiều video hơn, tài khoản cho cả lớp, nguồn và ngôn ngữ riêng, hóa đơn và người hỗ trợ riêng.', id: 'Video lebih banyak, kursi untuk satu kelas, sumber dan bahasa sendiri, faktur, dan satu orang untuk diajak bicara.' },
  talk: { en: 'Talk to us', zh: '联系我们', vi: 'Liên hệ', id: 'Hubungi kami' },
  cmpH: { en: 'Compare plans', zh: '套餐对比', vi: 'So sánh các gói', id: 'Bandingkan paket' },
  packsH: { en: 'Only need a few videos?', zh: '只需要几个视频？', vi: 'Chỉ cần vài video?', id: 'Hanya butuh beberapa video?' },
  packsP: { en: 'Buy them one by one. Credits never expire and a failed video gives its credit back.', zh: '单独购买。额度永不过期，视频失败自动退还。', vi: 'Mua lẻ. Tín dụng không hết hạn, video lỗi được hoàn lại.', id: 'Beli satuan. Kredit tidak kedaluwarsa dan video gagal dikembalikan.' },
  videos: { en: '{n} videos', zh: '{n} 个视频', vi: '{n} video', id: '{n} video' },
  each: { en: '{p} each', zh: '每个 {p}', vi: '{p} mỗi video', id: '{p} per video' },
  payH: { en: 'Pay', zh: '付款', vi: 'Thanh toán', id: 'Bayar' },
  faqH: { en: 'Billing questions', zh: '付款常见问题', vi: 'Câu hỏi về thanh toán', id: 'Pertanyaan tagihan' },
  faq: {
    en: [['How do I pay?', 'In Vietnam by bank transfer (VietQR). In China and elsewhere with WeChat Pay or Alipay. In Indonesia, message us and we send the payment details. Plans switch on after we confirm, usually within a day.'], ['What is an interactive video?', 'A video you turn interactive mode on for: it stops at the end of each part with a question, about 4 per video. Each video counts once a month, so 10 interactive videos are about 40 questions.'], ['What is an in-depth answer?', 'An answer from a stronger AI that thinks longer and quotes the source with page numbers. Quick answers are always there too.'], ['Do unused videos roll over?', 'Plan videos are added as credits when your plan starts and credits never expire.'], ['Can I cancel?', 'Yes. Plans do not renew by themselves; you simply do not pay for the next period.']],
    zh: [['怎么付款？', '越南用银行转账（VietQR），中国及其他地区用微信支付或支付宝，印尼请联系我们获取付款方式。确认后开通，通常一天内。'], ['什么是互动视频？', '打开互动模式的视频：每段结束暂停问一题，每个视频约 4 题。每个视频每月计一次，10 个互动视频约 40 道题。'], ['什么是深入回答？', '由更强、思考更久的 AI 给出的回答，引用原文并标注页码。快速回答一直可用。'], ['没用完的视频会保留吗？', '套餐视频在开通时以额度形式加入，额度永不过期。'], ['可以取消吗？', '可以。套餐不会自动续费，下一期不付款即可。']],
    vi: [['Thanh toán thế nào?', 'Ở Việt Nam chuyển khoản ngân hàng (VietQR). Ở Trung Quốc và nơi khác dùng WeChat Pay hoặc Alipay. Ở Indonesia, nhắn cho chúng tôi để nhận thông tin thanh toán. Gói được kích hoạt sau khi xác nhận, thường trong một ngày.'], ['Video tương tác là gì?', 'Video bạn bật chế độ tương tác: dừng cuối mỗi phần với một câu hỏi, khoảng 4 câu mỗi video. Mỗi video tính một lần mỗi tháng, nên 10 video tương tác là khoảng 40 câu hỏi.'], ['Câu trả lời chuyên sâu là gì?', 'Câu trả lời từ AI mạnh hơn, suy nghĩ lâu hơn và trích nguồn kèm số trang. Trả lời nhanh luôn có sẵn.'], ['Video chưa dùng có được giữ lại không?', 'Video của gói được cộng thành tín dụng khi gói bắt đầu và tín dụng không hết hạn.'], ['Tôi có thể hủy không?', 'Có. Gói không tự gia hạn; bạn chỉ cần không thanh toán kỳ tiếp theo.']],
    id: [['Bagaimana cara bayar?', 'Di Vietnam lewat transfer bank (VietQR). Di Tiongkok dan negara lain dengan WeChat Pay atau Alipay. Di Indonesia, kirim pesan dan kami kirim detail pembayaran. Paket aktif setelah kami konfirmasi, biasanya dalam sehari.'], ['Apa itu video interaktif?', 'Video yang mode interaktifnya Anda nyalakan: berhenti di akhir tiap bagian dengan satu pertanyaan, sekitar 4 per video. Tiap video dihitung sekali per bulan, jadi 10 video interaktif sekitar 40 pertanyaan.'], ['Apa itu jawaban mendalam?', 'Jawaban dari AI yang lebih kuat, berpikir lebih lama, dan mengutip sumber dengan nomor halaman. Jawaban cepat selalu tersedia.'], ['Apakah video yang tidak terpakai hangus?', 'Video paket ditambahkan sebagai kredit saat paket mulai, dan kredit tidak pernah kedaluwarsa.'], ['Bisakah berhenti?', 'Bisa. Paket tidak diperpanjang otomatis; cukup tidak membayar periode berikutnya.']],
  },
};

// one row per feature: label, then the value for Free, Plus, Pro, Premium (true = included, false = not, string = value)
type Cell = boolean | string;
export const ROWS = (t: <X>(v: { en: X; zh?: X; vi?: X; id?: X }) => X): [string, Cell, Cell, Cell, Cell][] => [
  [t({ en: 'Videos', zh: '视频', vi: 'Video', id: 'Video' }), t({ en: '1 a day + 3', zh: '每天 1 个 + 3', vi: '1/ngày + 3', id: '1/hari + 3' }), t({ en: '50 a month', zh: '每月 50', vi: '50/tháng', id: '50/bulan' }), t({ en: '120 a month', zh: '每月 120', vi: '120/tháng', id: '120/bulan' }), t({ en: '250 a month', zh: '每月 250', vi: '250/tháng', id: '250/bulan' })],
  [t({ en: 'Longest video', zh: '最长视频', vi: 'Video dài nhất', id: 'Video terpanjang' }), '5 min', '5 min', '10 min', '10 min'],
  [t({ en: 'Interactive videos a month', zh: '每月互动视频', vi: 'Video tương tác/tháng', id: 'Video interaktif/bulan' }), '2', t({ en: '10 (~40 questions)', zh: '10（约 40 题）', vi: '10 (~40 câu)', id: '10 (~40 soal)' }), t({ en: '30 (~120)', zh: '30（约 120）', vi: '30 (~120)', id: '30 (~120)' }), t({ en: '80 (~320)', zh: '80（约 320）', vi: '80 (~320)', id: '80 (~320)' })],
  [t({ en: 'In-depth answers per video', zh: '每个视频深入回答', vi: 'Trả lời chuyên sâu/video', id: 'Jawaban mendalam/video' }), '3', '10', '20', '30'],
  [t({ en: 'Quick answers', zh: '快速回答', vi: 'Trả lời nhanh', id: 'Jawaban cepat' }), true, true, true, true],
  [t({ en: 'Quiz and final quiz', zh: '测验和期末测验', vi: 'Bài kiểm tra và bài cuối', id: 'Kuis dan kuis akhir' }), true, true, true, true],
  [t({ en: 'Notes and flashcards', zh: '笔记和闪卡', vi: 'Ghi chú và thẻ ghi nhớ', id: 'Catatan dan kartu hafalan' }), false, true, true, true],
  [t({ en: 'Answers pitched to your level', zh: '按你的水平回答', vi: 'Trả lời theo trình độ của bạn', id: 'Jawaban sesuai tingkat Anda' }), false, true, true, true],
  [t({ en: 'Videos kept', zh: '视频保留', vi: 'Lưu video', id: 'Video disimpan' }), t({ en: '14 days', zh: '14 天', vi: '14 ngày', id: '14 hari' }), t({ en: '90 days', zh: '90 天', vi: '90 ngày', id: '90 hari' }), t({ en: '1 year', zh: '1 年', vi: '1 năm', id: '1 tahun' }), t({ en: '1 year', zh: '1 年', vi: '1 năm', id: '1 tahun' })],
  [t({ en: 'Failed video refunded', zh: '失败自动退还', vi: 'Video lỗi được hoàn', id: 'Video gagal dikembalikan' }), true, true, true, true],
  [t({ en: 'New features first', zh: '新功能优先', vi: 'Dùng tính năng mới trước', id: 'Fitur baru lebih dulu' }), false, false, false, true],
];
export const HL: Record<'free' | Plan, Record<Lang, string[]>> = {
  free: { en: ['1 video a day + 3 welcome videos', '2 interactive videos a month', '3 in-depth answers per video', 'Quiz and final quiz'], zh: ['每天 1 个视频 + 3 个欢迎视频', '每月 2 个互动视频', '每个视频 3 次深入回答', '测验和期末测验'], vi: ['1 video mỗi ngày + 3 video chào mừng', '2 video tương tác mỗi tháng', '3 câu trả lời chuyên sâu mỗi video', 'Bài kiểm tra và bài cuối'], id: ['1 video per hari + 3 video sambutan', '2 video interaktif per bulan', '3 jawaban mendalam per video', 'Kuis dan kuis akhir'] },
  plus: { en: ['50 videos a month, up to 5 minutes', '10 interactive videos (about 40 questions)', '10 in-depth answers per video', 'Notes and flashcards', 'Answers pitched to your level'], zh: ['每月 50 个视频，最长 5 分钟', '10 个互动视频（约 40 题）', '每个视频 10 次深入回答', '笔记和闪卡', '按你的水平回答'], vi: ['50 video mỗi tháng, tối đa 5 phút', '10 video tương tác (khoảng 40 câu hỏi)', '10 câu trả lời chuyên sâu mỗi video', 'Ghi chú và thẻ ghi nhớ', 'Trả lời theo trình độ của bạn'], id: ['50 video per bulan, hingga 5 menit', '10 video interaktif (sekitar 40 soal)', '10 jawaban mendalam per video', 'Catatan dan kartu hafalan', 'Jawaban sesuai tingkat Anda'] },
  pro: { en: ['120 videos a month, up to 10 minutes', '30 interactive videos (about 120 questions)', '20 in-depth answers per video', 'Videos kept for a year', 'Everything in Plus'], zh: ['每月 120 个视频，最长 10 分钟', '30 个互动视频（约 120 题）', '每个视频 20 次深入回答', '视频保留一年', '包含 Plus 全部功能'], vi: ['120 video mỗi tháng, tối đa 10 phút', '30 video tương tác (khoảng 120 câu hỏi)', '20 câu trả lời chuyên sâu mỗi video', 'Lưu video một năm', 'Gồm mọi thứ của Plus'], id: ['120 video per bulan, hingga 10 menit', '30 video interaktif (sekitar 120 soal)', '20 jawaban mendalam per video', 'Video disimpan setahun', 'Semua yang ada di Plus'] },
  premium: { en: ['250 videos a month, up to 10 minutes', '80 interactive videos (about 320 questions)', '30 in-depth answers per video', 'New features first', 'Everything in Pro'], zh: ['每月 250 个视频，最长 10 分钟', '80 个互动视频（约 320 题）', '每个视频 30 次深入回答', '新功能优先体验', '包含 Pro 全部功能'], vi: ['250 video mỗi tháng, tối đa 10 phút', '80 video tương tác (khoảng 320 câu hỏi)', '30 câu trả lời chuyên sâu mỗi video', 'Dùng tính năng mới trước', 'Gồm mọi thứ của Pro'], id: ['250 video per bulan, hingga 10 menit', '80 video interaktif (sekitar 320 soal)', '30 jawaban mendalam per video', 'Fitur baru lebih dulu', 'Semua yang ada di Pro'] },
};
const PACKS = [{ k: '5', n: 5 }, { k: '20', n: 20 }, { k: '50', n: 50 }];

export default function Pricing() {
  const { lang, t } = usePrefs();
  const { user, me, openAuth } = useAccount();
  const [billing, setBilling] = useState<Billing>('year');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [order, setOrder] = useState<{ id: string; price: string; label: string } | null>(null);
  const rows = ROWS(t);
  const myPlan = me?.plan ?? null;

  const buy = async (key: string, body: Record<string, unknown>, label: string, priceKey: PriceKey) => {
    if (!user) { openAuth('register'); return; }
    setBusy(key); setErr('');
    try {
      track('click_plan', { key });
      const out = (await accountApi('buy', { ...body, currency: curOf(lang) })) as { id: string };
      setOrder({ id: out.id, price: money(priceKey, lang), label });
    } catch (e) { setErr((e as Error).message === 'network' ? t(COMMON.network) : (e as Error).message); } finally { setBusy(null); }
  };

  const card = (id: 'free' | Plan) => {
    const name = id === 'free' ? t(COMMON.free) : id[0].toUpperCase() + id.slice(1);
    const sub = t(P[`${id}Sub` as const]);
    const monthly = id === 'free' ? 0 : billing === 'year' ? perMonthOfYear(`${id}_year`, lang) : amount(`${id}_month`, lang);
    const featured = id === 'plus';
    const dark = id === 'pro' || id === 'premium';
    return (
      <div key={id} className={cn('relative flex flex-col rounded-2xl border p-6', featured && 'border-2 border-primary shadow-[0_12px_40px_-12px_hsl(var(--primary)/0.45)]',
        id === 'pro' && 'border-[#2b2275] bg-[#17123f] text-white', id === 'premium' && 'border-[#d9b45a] bg-[#14110a] text-[#f6efe0]', !dark && 'bg-card')}>
        {featured && <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">{t(P.popular)}</span>}
        {id === 'premium' && <span className="absolute -top-3 left-6 rounded-full bg-[#e6c46a] px-3 py-1 text-xs font-semibold text-[#1b1606]">{t(P.best)}</span>}
        <p className="font-display text-lg font-semibold">{name}</p>
        <p className={cn('text-sm', dark ? 'text-white/65' : 'text-muted-foreground')}>{sub}</p>
        <div className="mt-5 flex flex-wrap items-baseline gap-x-1.5">
          <span className="font-display text-[34px] font-bold leading-none">{fmtMoney(monthly, lang)}</span>
          {id !== 'free' && <span className={cn('text-sm', dark ? 'text-white/65' : 'text-muted-foreground')}>{t(P.per)}</span>}
        </div>
        <p className={cn('mt-1.5 min-h-[20px] text-xs', dark ? 'text-white/60' : 'text-muted-foreground')}>
          {id === 'free' ? '' : billing === 'year' ? <>{t(P.billedYear).replace('{p}', money(`${id}_year` as PriceKey, lang))} <span className={cn('ml-1 rounded-full px-1.5 py-0.5 font-semibold', id === 'premium' ? 'bg-[#e6c46a] text-[#1b1606]' : id === 'pro' ? 'bg-[#f0c15a] text-[#17123f]' : 'bg-success/15 text-success')}>{t(P.save)}</span></> : t(P.billedMonth)}
        </p>
        <ul className="mt-5 grid flex-1 content-start gap-2.5 text-[14px]">
          {pickArr(lang, HL[id]).map((x) => <li key={x} className="flex gap-2"><Check className={cn('mt-0.5 h-4 w-4 shrink-0', id === 'premium' ? 'text-[#e6c46a]' : id === 'pro' ? 'text-[#f0c15a]' : 'text-primary')} /><span>{x}</span></li>)}
        </ul>
        <div className="mt-6">
          {id === 'free' ? (
            user ? <Button asChild variant="outline" className="w-full"><Link to="/app">{t(P.openApp)}</Link></Button> : <Button variant="outline" className="w-full" onClick={() => openAuth('register')}>{t(P.startFree)}</Button>
          ) : myPlan === id ? (
            <p className="flex h-10 items-center justify-center gap-1.5 rounded-md bg-white/10 text-sm font-semibold"><Check className="h-4 w-4" />{t(P.current)}</p>
          ) : (
            <Button className={cn('w-full', id === 'pro' && 'bg-[#f0c15a] text-[#17123f] hover:bg-[#f5cf78]', id === 'premium' && 'bg-[#e6c46a] text-[#1b1606] hover:bg-[#efd38b]')} disabled={busy !== null}
              onClick={() => buy(id, { plan: `${id}_${billing}` }, `${name} · ${billing === 'year' ? t(P.year) : t(P.month)}`, `${id}_${billing}` as PriceKey)}>
              {busy === id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t(P.get).replace('{p}', name)}
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
        <div className="mt-8 inline-flex rounded-full border bg-muted p-1" role="radiogroup" aria-label="Billing">
          {(['month', 'year'] as const).map((b) => (
            <button key={b} type="button" role="radio" aria-checked={billing === b} onClick={() => setBilling(b)} className={cn('rounded-full px-5 py-2 text-sm font-medium transition', billing === b ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}>
              {t(P[b])}{b === 'year' && <span className="ml-1.5 text-xs font-semibold text-success">{t(P.save)}</span>}
            </button>
          ))}
        </div>
      </div>
      {err && <p className="mx-auto mt-6 max-w-xl rounded-lg bg-destructive/10 px-4 py-2 text-center text-sm text-destructive" role="alert">{err}</p>}
      <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{(['free', 'plus', 'pro', 'premium'] as const).map(card)}</div>

      <div className="pl-card mt-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-muted"><Building2 className="h-6 w-6" /></span>
        <div className="flex-1"><p className="font-display text-lg font-semibold">{t(P.customH)}</p><p className="mt-1 text-sm text-muted-foreground">{t(P.customP)}</p></div>
        <Button variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('pl-support', { detail: 'contact' }))}>{t(P.talk)}</Button>
      </div>
      <StudentVerify className="mt-4" />

      <section className="mt-20">
        <h2 className="pl-h2 text-center">{t(P.cmpH)}</h2>
        <div className="mt-8 overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[640px] text-sm">
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
        <div><p className="flex items-center gap-2 font-display text-xl font-semibold"><Sparkles className="h-5 w-5 text-lit" />{t(P.packsH)}</p><p className="mt-1 text-sm text-muted-foreground">{t(P.packsP)}</p></div>
        <div className="grid gap-2 sm:grid-cols-3">
          {PACKS.map((k) => (
            <button key={k.k} type="button" disabled={busy !== null} onClick={() => buy(`pack_${k.k}`, { pack: k.k }, t(P.videos).replace('{n}', String(k.n)), `pack_${k.k}` as PriceKey)}
              className="rounded-xl border bg-background px-5 py-3 text-left transition hover:border-primary disabled:opacity-60">
              <p className="font-semibold">{t(P.videos).replace('{n}', String(k.n))}</p>
              <p className="text-sm text-muted-foreground">{money(`pack_${k.k}` as PriceKey, lang)}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-3xl">
        <h2 className="pl-h2">{t(P.faqH)}</h2>
        <Accordion type="single" collapsible className="mt-6">
          {pickArr(lang, P.faq).map(([q, a]) => (
            <AccordionItem key={q} value={q}><AccordionTrigger className="text-left text-[15.5px] font-semibold">{q}</AccordionTrigger><AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">{a}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
      </section>

      <Dialog open={!!order} onOpenChange={(o) => { if (!o) setOrder(null); }}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-[620px]">
          <DialogTitle className="sr-only">{t(P.payH)}</DialogTitle>
          {order && <PayPanel orderId={order.id} price={order.price} label={order.label} onClose={() => setOrder(null)} />}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function pickArr<T>(lang: Lang, v: Record<Lang, T>): T { return v[lang] ?? v.en; }
