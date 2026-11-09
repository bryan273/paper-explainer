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
  packsP: { en: 'Buy video credits without a plan. They never expire, you can make videos of up to 10 minutes with them, interactive mode is included, and a video that fails gives its credit back.' },
  videos: { en: '{n} video credits' },
  each: { en: '{p} per credit' },
  payH: { en: 'Pay', zh: '付款', vi: 'Thanh toán', id: 'Bayar' },
  faqH: { en: 'Plans and payment, explained', zh: '关于套餐和付款', vi: 'Giải đáp về gói và thanh toán', id: 'Penjelasan paket dan pembayaran' },
  faqS: { en: 'Everything you may want to know before you choose. Anything else, ask us in the chat at the bottom right.', zh: '选择之前你可能想知道的一切。其他问题，请在右下角的对话框问我们。', vi: 'Mọi điều bạn có thể muốn biết trước khi chọn. Câu hỏi khác, hãy hỏi chúng tôi trong khung chat ở góc dưới bên phải.', id: 'Semua yang mungkin ingin Anda ketahui sebelum memilih. Pertanyaan lain, tanyakan lewat chat di kanan bawah.' },
  faq: {
    en: [
      ['How do I pay?', 'Choose the currency you want to pay in: Chinese yuan (WeChat Pay or Alipay), Vietnamese dong (bank transfer by VietQR) or Indonesian rupiah (QRIS, which works with GoPay, OVO, DANA and every Indonesian bank app). Scan the code, pay the exact amount, write the order number in the payment note and press "I have paid". We switch your plan on as soon as the payment is confirmed, usually within a few hours and always within a day.'],
      ['What counts as one video?', 'Every started 5 minutes uses one video credit: a video of 1 to 5 minutes is one, 7 or 10 minutes is two, 15 minutes is three and 20 minutes is four. Each language is its own video. If a video fails, its credit comes back automatically.'],
      ['Can I change a video after it is made?', 'Yes. Open the video, press Edit, choose the part and say what to change: fix a mistake, add detail, make it simpler or go deeper. Only that part is rewritten, the rest stays as it was, and the edit does not use a video credit. Free gives 1 edit per video, Plus 2, Pro and Premium 3.'],
      ['What is interactive mode?', 'Interactive mode is something you turn on for a video. The video then pauses at the end of each part with one question, explains the answer right away, and adds a quiz tab and a final quiz. Turning it on for a video uses one from your interactive allowance; turning it on again for the same video is free.'],
      ['Quick, in-depth and research answers: what is the difference?', 'A quick answer explains a video in seconds. An in-depth answer uses a stronger AI that reasons step by step and quotes the source with page numbers. A research question (the Research page) reads several papers to answer one question, with every quote matched to its page. Each has its own monthly allowance, shown on your home page.'],
      ['What happens to videos I do not use?', 'The video credits of a plan are added to your balance when the plan starts and they do not expire. You can still use them after the plan ends; only the longest video length follows the plan you have at that moment.'],
      ['How long are my videos kept?', 'Free: 7 days. Plus: 30 days. Pro: 90 days. Premium: 270 days. You can download any video while it is kept, and you can always make it again.'],
      ['Which currency will I see?', 'The currency of the country in your profile. You can switch at the top of this page or in the payment window; prices are set for each country, not converted.'],
      ['Can I cancel?', 'There is nothing to cancel: plans never renew on their own. When a period ends, you simply do not pay for the next one. If a payment went wrong, contact us and we will sort it out.'],
      ['Can my class or team pay together?', 'Yes. We make custom plans with seats for a whole class or team, longer videos for lessons, invoices and one person to talk to. Use "Contact us" above.'],
    ],
  } as Tr<[string, string][]>,
};

// one row per feature: label, then the value for Free, Plus, Pro, Premium (true = included, false = not, string = value)
type Cell = boolean | string;
export const ROWS = (t: <X>(v: Tr<X>) => X): [string, Cell, Cell, Cell, Cell][] => [
  [t({ en: 'Videos' }), t({ en: '3 a week' }), t({ en: '20 a month' }), t({ en: '40 a month' }), t({ en: '80 a month' })],
  [t({ en: 'Longest video' }), t({ en: '3 min' }), t({ en: '5 min' }), t({ en: '10 min' }), t({ en: '20 min' })],
  [t({ en: 'Edits per video' }), '1', '2', '3', '3'],
  [t({ en: 'Video languages' }), '9', '9', '9', '9'],
  [t({ en: 'Interactive mode' }), t({ en: '2 videos a week' }), t({ en: 'Every video' }), t({ en: 'Every video' }), t({ en: 'Every video' })],
  [t({ en: 'Quick answers' }), t({ en: '20 a week' }), t({ en: '100 a month' }), t({ en: '200 a month' }), t({ en: '300 a month' })],
  [t({ en: 'In-depth answers' }), t({ en: '2 a month' }), t({ en: '10 a month' }), t({ en: '20 a month' }), t({ en: '30 a month' })],
  [t({ en: 'Research questions' }), t({ en: '2 a week' }), t({ en: '8 a month' }), t({ en: '15 a month' }), t({ en: '25 a month' })],
  [t({ en: 'Quiz and final quiz' }), true, true, true, true],
  [t({ en: 'Notes and flashcards' }), false, true, true, true],
  [t({ en: 'Answers pitched to your level' }), false, true, true, true],
  [t({ en: 'Videos kept' }), t({ en: '7 days' }), t({ en: '30 days' }), t({ en: '90 days' }), t({ en: '270 days' })],
  [t({ en: 'Failed video given back' }), true, true, true, true],
  [t({ en: 'New features first' }), false, false, false, true],
];
export const HL: Record<'free' | Plan, Tr<string[]>> = {
  free: { en: ['3 videos a week, up to 3 minutes', '1 edit per video', 'Interactive mode on 2 videos a week', '20 quick answers and 2 research questions a week', 'Videos kept for 7 days'] },
  plus: { en: ['20 videos a month, up to 5 minutes', '2 edits per video', 'Interactive mode on every video', '100 quick and 10 in-depth answers a month', '8 research questions a month', 'Notes, flashcards and answers at your level', 'Videos kept for 30 days'] },
  pro: { en: ['40 videos a month, up to 10 minutes', '3 edits per video', '200 quick and 20 in-depth answers a month', '15 research questions a month', 'Videos kept for 90 days', 'Everything in Plus'] },
  premium: { en: ['80 videos a month, up to 20 minutes', '3 edits per video', '300 quick and 30 in-depth answers a month', '25 research questions a month', 'Videos kept for 270 days', 'New features first', 'Everything in Pro'] },
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

