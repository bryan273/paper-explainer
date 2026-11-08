import { useState } from 'react';
import { Link } from 'react-router-dom';
import { accountApi, track, useAccount } from '@/lib/account';
import { usePrefs } from '@/lib/prefs';
import PayPanel from '@/components/PayPanel';

type Billing = 'month' | 'year';
type PlanId = 'plus' | 'pro';

/** Per-month and per-year prices in yuan. A video costs about ¥0.7 to make, so 100 videos cost at most ¥70 and a typical member uses a quarter of that. */
const PLANS: Record<PlanId, { now: Record<Billing, number> }> = {
  plus: { now: { month: 33, year: 330 } },
  pro: { now: { month: 129, year: 1290 } },
};
const PACKS = [{ k: '5', n: 5, p: 19 }, { k: '20', n: 20, p: 59 }, { k: '50', n: 50, p: 129 }];

const L = {
  en: {
    title: 'Pricing', sub: 'Try every feature free first. Pay only when it becomes part of how you study.',
    month: 'Monthly', year: 'Yearly', save: 'two months free',
    free: 'Free', plus: 'Plus', pro: 'Pro', popular: 'Most chosen', founding: 'billed monthly, cancel any time',
    perMonth: '/ month', perYear: '/ year', billedYear: 'billed once a year, about ¥{m} a month',
    freeL: ['1 free video a day, plus 3 welcome videos', 'Try the smart features: 3 interactive checks a day, 10 Deep questions for each video', 'English, 中文, Tiếng Việt, Bahasa Indonesia', 'Videos kept for 14 days'],
    plusL: ['100 videos a month, up to 5 minutes', 'Interactive mode: questions as you watch, unlimited', 'Deep questions in Ask: unlimited (a stronger AI model)', 'Ask with your profile: pitched to your level and field', 'Videos kept for 90 days, priority when busy', 'Failed video: refunded automatically'],
    proL: ['Unlimited videos (fair use up to 300 a month), up to 10 minutes', 'Everything in Plus', 'Deep study: the AI also reads trusted textbooks and papers, every source cited', 'Videos kept for a year, highest priority'],
    soon: 'in development, Pro members get it first',
    cta: 'Buy {p}', ctaSent: 'Order created. Pay below.', yours: 'Your plan', ctaFree: 'Sign up free', ctaMine: 'My papers',
    packs: 'Only need a few videos? Buy them one by one', packsLine: 'Credits never expire.', each: 'videos', buy: 'Buy credits', note: 'Pay with WeChat Pay or Alipay, then tap "I have paid". We confirm by hand, usually within a day, and your videos and plan switch on then. Cancel any time by not renewing.',
  },
  zh: {
    title: '价格', sub: '先免费用，成为习惯后再升级。',
    month: '按月', year: '按年', save: '送两个月',
    free: '免费', plus: 'Plus', pro: 'Pro', popular: '最多人选', founding: '按月付费，随时取消',
    perMonth: '/ 月', perYear: '/ 年', billedYear: '一次付一年，约 ¥{m} / 月',
    freeL: ['每天 1 个免费视频，另送 3 个欢迎视频', '试用智能功能：每天 3 次互动自测，每个视频 10 次深入提问', '英文、中文、越南语、印尼语', '视频保留 14 天'],
    plusL: ['每月 100 个视频，最长 5 分钟', '互动模式：边看边答题，不限次数', '深入提问：不限次数（更强的 AI 模型）', '提问会按你的水平和领域调整', '视频保留 90 天，高峰期优先', '失败自动退还'],
    proL: ['视频不限量（合理使用，每月最多约 300 个），最长 10 分钟', '包含 Plus 的全部功能', '深度学习：AI 还会查阅可信教材和论文，每个来源都注明', '视频保留一年，最高优先级'],
    soon: '开发中，Pro 会员优先使用',
    cta: '购买 {p}', ctaSent: '订单已创建，请在下方付款。', yours: '你的套餐', ctaFree: '免费注册', ctaMine: '我的论文',
    packs: '只需要几个视频？单独购买', packsLine: '额度永不过期。', each: '个视频', buy: '购买额度', note: '用微信或支付宝付款，然后点“我已付款”。我们人工确认，通常一天内，确认后视频额度和套餐立即生效。不续费即取消。',
  },
} as const;

export default function PricingSection() {
  const { lang } = usePrefs();
  const { me, user, openAuth } = useAccount();
  const l = L[lang === 'zh' ? 'zh' : 'en'];
  const [billing, setBilling] = useState<Billing>('year');
  const [sent, setSent] = useState<PlanId | null>(null);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [err, setErr] = useState('');

  const [order, setOrder] = useState<{ id: string; price: number } | null>(null);
  const myPlan = (me as unknown as { plan?: string | null } | null)?.plan ?? null;
  const join = async (plan: PlanId) => {
    if (!user) { openAuth('register'); return; }
    setBusy(plan); setErr('');
    try {
      track('click_plan', { plan, billing });
      const out = (await accountApi('buy', { plan: `${plan}_${billing}` })) as { id: string; price: number };
      setOrder(out); setSent(plan);
      window.setTimeout(() => document.getElementById('plan-pay')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
  };

  const buyPack = async (pack: string) => {
    if (!user) { openAuth('register'); return; }
    setErr('');
    try {
      track('click_pack', { pack });
      const out = (await accountApi('buy', { pack })) as { id: string; price: number };
      setOrder(out);
      window.setTimeout(() => document.getElementById('plan-pay')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
    } catch (e) { setErr((e as Error).message); }
  };

  const card = (id: 'free' | PlanId) => {
    const featured = id === 'plus';
    const items = id === 'free' ? l.freeL.map((x) => x.replace('{n}', String(me?.limits.member ?? 3))) : id === 'plus' ? l.plusL : l.proL;
    const p = id === 'free' ? null : PLANS[id];
    const monthly = p ? (billing === 'year' ? Math.round(p.now.year / 12) : p.now.month) : 0;
    return (
      <div key={id} className={`card price-card${featured ? ' featured' : ''}`}>
        <div className="row between">
          <b style={{ font: '700 17px var(--display)' }}>{l[id]}</b>
          {featured && <span className="badge-launch">{l.popular}</span>}
        </div>
        {p ? (
          <>
            <div className="price">
              ¥{monthly} <small>{l.perMonth}</small>
            </div>
            <p className="small muted" style={{ margin: '-6px 0 0' }}>{billing === 'year' ? l.billedYear.replace('{m}', String(monthly)) : l.founding}</p>
          </>
        ) : (
          <div className="price">¥0</div>
        )}
        <ul className="tick">
          {items.map((it) => (<li key={it}>{it}{id === 'pro' && it.startsWith(lang === 'zh' ? '深度' : 'Deep') ? <em className="soon"> ({l.soon})</em> : null}</li>))}
        </ul>
        {id === 'free' ? (
          user ? <Link className="btn ghost" to="/account">{l.ctaMine}</Link> : <button type="button" className="btn ghost" onClick={() => openAuth('register')}>{l.ctaFree}</button>
        ) : sent === id ? (
          <p className="small" role="status" style={{ margin: 0, color: 'var(--ok)' }}>{l.ctaSent}</p>
        ) : myPlan === id ? (
          <p className="small" style={{ margin: 0, color: 'var(--ok)' }}>✓ {l.yours}</p>
        ) : (
          <button type="button" className={`btn ${featured ? 'primary' : 'ghost'}`} disabled={busy === id} onClick={() => join(id)}>{l.cta.replace('{p}', l[id])} · ¥{billing === 'year' ? p!.now.year : p!.now.month}</button>
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
        <button type="button" role="radio" aria-checked={billing === 'year'} onClick={() => setBilling('year')}>{l.year} <em>{l.save}</em></button>
      </div>

      <div className="pricing three">
        {card('free')}
        {card('plus')}
        {card('pro')}
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      {order && (
        <div id="plan-pay" className="card" style={{ marginTop: 16 }}>
          <PayPanel orderId={order.id} price={`¥${order.price}`} onClose={() => { setOrder(null); setSent(null); }} />
        </div>
      )}

      <div className="packs-line">
        <span><b>{l.packs}</b> · {l.packsLine}</span>
        <span className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {PACKS.map((k) => (
            <button key={k.k} type="button" className="btn ghost small" disabled={busy === 'plus' || busy === 'pro'} onClick={() => buyPack(k.k)}>{k.n} {l.each} · ¥{k.p}</button>
          ))}
        </span>
      </div>
      <p className="small muted" style={{ marginTop: 10 }}>{l.note}</p>
    </section>
  );
}
