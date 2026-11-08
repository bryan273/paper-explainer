import { useState } from 'react';
import { Link } from 'react-router-dom';
import { accountApi, track, useAccount } from '@/lib/account';
import { usePrefs } from '@/lib/prefs';
import PayPanel from '@/components/PayPanel';
import { amount, curOf, fmtMoney, money, perMonthOfYear, type PriceKey } from '@/lib/currency';
import StudentTrial from '@/components/StudentTrial';

type Billing = 'month' | 'year';
type PlanId = 'plus' | 'pro';

/** Per-month and per-year prices in yuan. A video costs about ¥0.7 to make, so 100 videos cost at most ¥70 and a typical member uses a quarter of that. */
const PLANS: Record<PlanId, { now: Record<Billing, number> }> = {
  plus: { now: { month: 33, year: 330 } },
  pro: { now: { month: 59, year: 590 } },
};
const PACKS = [{ k: '5', n: 5, p: 19 }, { k: '20', n: 20, p: 59 }, { k: '50', n: 50, p: 129 }];

const L = {
  en: {
    title: 'Pricing', sub: 'Try every feature free first. Pay only when it becomes part of how you study.',
    month: 'Monthly', year: 'Yearly', save: 'two months free',
    free: 'Free', plus: 'Plus', pro: 'Pro', popular: 'Most chosen', founding: 'billed monthly, cancel any time',
    perMonth: '/ month', perYear: '/ year', billedYear: 'billed once a year, about ¥{m} a month',
    freeL: ['1 free video a day, plus 3 welcome videos', 'Interactive video: 3 questions a day inside the video', 'Ask the AI about a video: 10 in-depth answers per video', 'English, 中文, Tiếng Việt, Bahasa Indonesia', 'Videos kept for 14 days, with a link to share'],
    plusL: ['100 videos a month, up to 5 minutes each', 'Interactive video: unlimited questions inside the video', 'In-depth mode when you ask the AI: 30 answers per video (a stronger AI)', 'Answers pitched to your level and field', 'Videos kept for 90 days', 'Failed video: refunded automatically'],
    proL: ['200 videos a month, up to 10 minutes each', 'Everything in Plus', 'In-depth mode when you ask the AI: unlimited, always the strongest AI', 'Videos kept for a full year', 'New features first'],
    soon: 'in development, Pro members get it first',
    custom: 'Custom', customSub: 'Need more, or something different?', customL: ['More videos than Pro', 'A plan for a class, a lab or a team', 'Your own subjects, sources and languages', 'Invoice and a person to talk to'], customCta: 'Contact us', customPrice: "Let's talk",
    cta: 'Buy {p}', ctaSent: 'Order created. Pay below.', yours: 'Your plan', ctaFree: 'Sign up free', ctaMine: 'My papers',
    packs: 'Only need a few videos? Buy them one by one', packsLine: 'Credits never expire.', each: 'videos', buy: 'Buy credits', note: 'Pay with WeChat Pay or Alipay, then tap "I have paid". We confirm by hand, usually within a day, and your videos and plan switch on then. Cancel any time by not renewing.',
  },
  zh: {
    title: '价格', sub: '先免费用，成为习惯后再升级。',
    month: '按月', year: '按年', save: '送两个月',
    free: '免费', plus: 'Plus', pro: 'Pro', popular: '最多人选', founding: '按月付费，随时取消',
    perMonth: '/ 月', perYear: '/ 年', billedYear: '一次付一年，约 ¥{m} / 月',
    freeL: ['每天 1 个免费视频，另送 3 个欢迎视频', '互动视频：每天 3 道视频内答题', '向 AI 提问：每个视频 10 次深入回答', '英文、中文、越南语、印尼语', '视频保留 14 天，可生成分享链接'],
    plusL: ['每月 100 个视频，每个最长 5 分钟', '互动视频：视频内答题不限次数', '向 AI 提问的深入模式：每个视频 30 次（更强的 AI）', '回答会按你的水平和领域调整', '视频保留 90 天', '失败自动退还'],
    proL: ['每月 200 个视频，每个最长 10 分钟', '包含 Plus 的全部功能', '向 AI 提问的深入模式：不限次数，始终使用最强的 AI', '视频保留整整一年', '新功能优先体验'],
    soon: '开发中，Pro 会员优先使用',
    custom: '定制', customSub: '需要更多，或者想要不一样的？', customL: ['比 Pro 更多的视频', '适合一个班级、实验室或团队的方案', '你自己的学科、资料和语言', '发票和专人对接'], customCta: '联系我们', customPrice: '来聊聊',
    cta: '购买 {p}', ctaSent: '订单已创建，请在下方付款。', yours: '你的套餐', ctaFree: '免费注册', ctaMine: '我的论文',
    packs: '只需要几个视频？单独购买', packsLine: '额度永不过期。', each: '个视频', buy: '购买额度', note: '用微信或支付宝付款，然后点“我已付款”。我们人工确认，通常一天内，确认后视频额度和套餐立即生效。不续费即取消。',
  },
  vi: {
    title: 'Bảng giá', sub: 'Dùng thử mọi tính năng miễn phí trước. Chỉ trả tiền khi nó thành thói quen học của bạn.',
    month: 'Theo tháng', year: 'Theo năm', save: 'tặng 2 tháng',
    free: 'Miễn phí', plus: 'Plus', pro: 'Pro', popular: 'Được chọn nhiều nhất', founding: 'thanh toán theo tháng, hủy bất cứ lúc nào',
    perMonth: '/ tháng', perYear: '/ năm', billedYear: 'thanh toán một lần mỗi năm, khoảng ¥{m} mỗi tháng',
    freeL: ['1 video miễn phí mỗi ngày, cộng 3 video chào mừng', 'Video tương tác: 3 câu hỏi ngay trong video mỗi ngày', 'Hỏi AI về video: 10 câu trả lời chuyên sâu cho mỗi video', 'English, 中文, Tiếng Việt, Bahasa Indonesia', 'Video lưu 14 ngày, kèm liên kết chia sẻ'],
    plusL: ['100 video mỗi tháng, mỗi video tối đa 5 phút', 'Video tương tác: câu hỏi trong video không giới hạn', 'Chế độ chuyên sâu khi hỏi AI: 30 câu trả lời cho mỗi video (AI mạnh hơn)', 'Câu trả lời phù hợp trình độ và lĩnh vực của bạn', 'Video lưu 90 ngày', 'Video lỗi: tự động hoàn lại'],
    proL: ['200 video mỗi tháng, mỗi video tối đa 10 phút', 'Gồm mọi thứ của Plus', 'Chế độ chuyên sâu khi hỏi AI: không giới hạn, luôn dùng AI mạnh nhất', 'Video lưu trọn một năm', 'Dùng tính năng mới trước'],
    soon: 'đang phát triển',
    custom: 'Tùy chỉnh', customSub: 'Cần nhiều hơn, hay cần điều gì khác?', customL: ['Nhiều video hơn Pro', 'Gói cho một lớp, một nhóm nghiên cứu hoặc một đội', 'Chủ đề, nguồn và ngôn ngữ riêng của bạn', 'Hóa đơn và người hỗ trợ riêng'], customCta: 'Liên hệ chúng tôi', customPrice: 'Trao đổi nhé',
    cta: 'Mua {p}', ctaSent: 'Đã tạo đơn hàng. Hãy thanh toán bên dưới.', yours: 'Gói của bạn', ctaFree: 'Đăng ký miễn phí', ctaMine: 'Bài báo của tôi',
    packs: 'Chỉ cần vài video? Mua lẻ', packsLine: 'Tín dụng không hết hạn.', each: 'video', buy: 'Mua tín dụng', note: 'Chuyển khoản qua Techcombank hoặc BIDV (VietQR), rồi bấm "Tôi đã chuyển khoản". Chúng tôi xác nhận thủ công, thường trong vòng một ngày, và video cùng gói của bạn sẽ được kích hoạt. Muốn hủy, chỉ cần không gia hạn.',
  },
  id: {
    title: 'Harga', sub: 'Coba semua fitur gratis dulu. Bayar hanya ketika sudah menjadi bagian dari cara belajar Anda.',
    month: 'Bulanan', year: 'Tahunan', save: 'gratis 2 bulan',
    free: 'Gratis', plus: 'Plus', pro: 'Pro', popular: 'Paling banyak dipilih', founding: 'ditagih bulanan, bisa berhenti kapan saja',
    perMonth: '/ bulan', perYear: '/ tahun', billedYear: 'ditagih sekali setahun, sekitar ¥{m} per bulan',
    freeL: ['1 video gratis per hari, ditambah 3 video selamat datang', 'Video interaktif: 3 pertanyaan per hari di dalam video', 'Tanya AI tentang video: 10 jawaban mendalam per video', 'English, 中文, Tiếng Việt, Bahasa Indonesia', 'Video disimpan 14 hari, dengan tautan untuk dibagikan'],
    plusL: ['100 video per bulan, masing-masing hingga 5 menit', 'Video interaktif: pertanyaan di dalam video tanpa batas', 'Mode mendalam saat bertanya ke AI: 30 jawaban per video (AI lebih kuat)', 'Jawaban disesuaikan dengan tingkat dan bidang Anda', 'Video disimpan 90 hari', 'Video gagal: otomatis dikembalikan'],
    proL: ['200 video per bulan, masing-masing hingga 10 menit', 'Semua yang ada di Plus', 'Mode mendalam saat bertanya ke AI: tanpa batas, selalu memakai AI terkuat', 'Video disimpan satu tahun penuh', 'Fitur baru lebih dulu'],
    soon: 'sedang dikembangkan',
    custom: 'Khusus', customSub: 'Butuh lebih banyak, atau sesuatu yang berbeda?', customL: ['Video lebih banyak dari Pro', 'Paket untuk kelas, lab, atau tim', 'Bidang, sumber, dan bahasa Anda sendiri', 'Faktur dan satu orang untuk diajak bicara'], customCta: 'Hubungi kami', customPrice: 'Mari bicara',
    cta: 'Beli {p}', ctaSent: 'Pesanan dibuat. Bayar di bawah.', yours: 'Paket Anda', ctaFree: 'Daftar gratis', ctaMine: 'Makalah saya',
    packs: 'Hanya butuh beberapa video? Beli satuan', packsLine: 'Kredit tidak pernah kedaluwarsa.', each: 'video', buy: 'Beli kredit', note: 'Setelah memesan, hubungi kami lewat tombol Kontak dengan kode pesanan Anda. Kami membalas dengan detail pembayaran dan mengaktifkan paket setelah pembayaran dikonfirmasi, biasanya dalam sehari.',
  },
} as const;

export default function PricingSection() {
  const { lang } = usePrefs();
  const { me, user, openAuth } = useAccount();
  const l = L[lang === 'zh' || lang === 'vi' || lang === 'id' ? lang : 'en'];
  const [billing, setBilling] = useState<Billing>('year');
  const [sent, setSent] = useState<PlanId | null>(null);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [err, setErr] = useState('');

  const [order, setOrder] = useState<{ id: string; price: number; label: string } | null>(null);
  const myPlan = (me as unknown as { plan?: string | null } | null)?.plan ?? null;
  const join = async (plan: PlanId) => {
    if (!user) { openAuth('register'); return; }
    setBusy(plan); setErr('');
    try {
      track('click_plan', { plan, billing });
      const out = (await accountApi('buy', { plan: `${plan}_${billing}`, currency: curOf(lang) })) as { id: string; price: number };
      setOrder({ ...out, label: money(`${plan}_${billing}` as PriceKey, lang) }); setSent(plan);
      window.setTimeout(() => document.getElementById('plan-pay')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
  };

  const buyPack = async (pack: string) => {
    if (!user) { openAuth('register'); return; }
    setErr('');
    try {
      track('click_pack', { pack });
      const out = (await accountApi('buy', { pack, currency: curOf(lang) })) as { id: string; price: number };
      setOrder({ ...out, label: money(`pack_${pack}` as PriceKey, lang) });
      window.setTimeout(() => document.getElementById('plan-pay')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
    } catch (e) { setErr((e as Error).message); }
  };

  const card = (id: 'free' | PlanId) => {
    const featured = id === 'plus';
    const items = id === 'free' ? l.freeL.map((x) => x.replace('{n}', String(me?.limits.member ?? 3))) : id === 'plus' ? l.plusL : l.proL;
    const p = id === 'free' ? null : PLANS[id];
    const monthly = p ? (billing === 'year' ? perMonthOfYear(`${id as PlanId}_year`, lang) : amount(`${id as PlanId}_month`, lang)) : 0;
    return (
      <div key={id} className={`card price-card${featured ? ' featured' : ''}${id === 'pro' ? ' pro' : ''}`}>
        <div className="row between">
          <b style={{ font: '700 17px var(--display)' }}>{l[id]}</b>
          {featured && <span className="badge-launch">{l.popular}</span>}
        </div>
        {p ? (
          <>
            <div className="price">
              {fmtMoney(monthly, lang)} <small>{l.perMonth}</small>{billing === 'year' && <span className="save-pill">{l.save}</span>}
            </div>
            <p className="small muted" style={{ margin: '-6px 0 0' }}>{billing === 'year' ? l.billedYear.replace('¥{m}', fmtMoney(monthly, lang)) : l.founding}</p>
          </>
        ) : (
          <div className="price">{fmtMoney(0, lang)}</div>
        )}
        <ul className="tick">
          {items.map((it) => (<li key={it}>{it}</li>))}
        </ul>
        {id === 'free' ? (
          user ? <Link className="btn ghost" to="/account">{l.ctaMine}</Link> : <button type="button" className="btn ghost" onClick={() => openAuth('register')}>{l.ctaFree}</button>
        ) : sent === id ? (
          <p className="small" role="status" style={{ margin: 0, color: 'var(--ok)' }}>{l.ctaSent}</p>
        ) : myPlan === id ? (
          <p className="small" style={{ margin: 0, color: 'var(--ok)' }}>✓ {l.yours}</p>
        ) : (
          <button type="button" className={`btn ${featured ? 'primary' : 'ghost'}`} disabled={busy === id} onClick={() => join(id)}>{l.cta.replace('{p}', l[id])} · {money(`${id as PlanId}_${billing}` as PriceKey, lang)}</button>
        )}
      </div>
    );
  };

  return (
    <section className="section" id="pricing" aria-labelledby="pricing-title">
      <h2 className="sec" id="pricing-title">{l.title}</h2>
      <p className="sec-sub">{l.sub}</p>

      <div className="askseg bill" role="radiogroup" aria-label={l.title}>
        <button type="button" role="radio" aria-checked={billing === 'month'} onClick={() => setBilling('month')}>{l.month}</button>
        <button type="button" role="radio" aria-checked={billing === 'year'} onClick={() => setBilling('year')}>{l.year}</button>
      </div>

      <div className="pricing three">
        {card('free')}
        {card('plus')}
        {card('pro')}
        <div className="card price-card custom">
          <b style={{ font: '700 17px var(--display)' }}>{l.custom}</b>
          <div className="price" style={{ fontSize: 28 }}>{l.customPrice}</div>
          <p className="small muted" style={{ margin: '-6px 0 0' }}>{l.customSub}</p>
          <ul className="tick">{l.customL.map((it) => (<li key={it}>{it}</li>))}</ul>
          <button type="button" className="btn ghost" onClick={() => window.dispatchEvent(new Event('pe-open-contact'))}>{l.customCta}</button>
        </div>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      <StudentTrial />
      {order && (
        <div id="plan-pay" className="card" style={{ marginTop: 16 }}>
          <PayPanel orderId={order.id} price={order.label} onClose={() => { setOrder(null); setSent(null); }} />
        </div>
      )}

      <div className="packs-line">
        <span><b>{l.packs}</b> · {l.packsLine}</span>
        <span className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {PACKS.map((k) => (
            <button key={k.k} type="button" className="btn ghost small" disabled={busy === 'plus' || busy === 'pro'} onClick={() => buyPack(k.k)}>{k.n} {l.each} · {money(`pack_${k.k}` as PriceKey, lang)}</button>
          ))}
        </span>
      </div>
      <p className="small muted" style={{ marginTop: 10 }}>{l.note}</p>
    </section>
  );
}
