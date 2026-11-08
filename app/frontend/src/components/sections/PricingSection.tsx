import { useState } from 'react';
import { Link } from 'react-router-dom';
import { accountApi, track, useAccount, useAcctText } from '@/lib/account';
import { usePrefs } from '@/lib/prefs';

type Billing = 'month' | 'year';
type PlanId = 'plus' | 'pro';

/** Founding prices: the list price stays crossed out next to the price a first member locks in, so a later rise never touches them. */
const PLANS: Record<PlanId, { list: Record<Billing, number>; now: Record<Billing, number> }> = {
  plus: { list: { month: 39, year: 468 }, now: { month: 19, year: 159 } },
  pro: { list: { month: 99, year: 1188 }, now: { month: 59, year: 479 } },
};

const L = {
  en: {
    title: 'Pricing', sub: 'Start free. Upgrade when videos become a habit.',
    month: 'Monthly', year: 'Yearly', save: 'save up to 60%',
    free: 'Free', plus: 'Plus', pro: 'Pro', popular: 'Most chosen', founding: 'Founding price, locked for you for as long as you stay',
    perMonth: '/ month', perYear: '/ year', billedYear: 'billed once a year, about ¥{m} a month',
    freeL: ['{n} free videos a day', 'Ask questions about every video', 'English and 中文, 16:9 and 9:16', 'Videos kept for 14 days'],
    plusL: ['40 videos a month, up to 5 minutes', 'Unlimited questions in Ask', 'Videos kept for 90 days', 'Priority when the queue is busy', 'Failed video: refunded automatically'],
    proL: ['120 videos a month, up to 10 minutes', 'Deep study: the AI also reads trusted textbooks and papers, every source cited', 'Unlimited questions, with sources in Ask', 'Videos kept for a year', 'Highest priority'],
    soon: 'in development, Pro members get it first',
    cta: 'Join the founding list', ctaSent: 'You are on the list. We will write to you.', ctaFree: 'Sign up free', ctaMine: 'My papers',
    packs: 'No subscription? Credit packs',
    packsLine: '10 videos for ¥{p}. Credits never expire.', buy: 'Buy credits', note: 'Payment by WeChat Pay or Alipay. Plans are confirmed by hand for now, usually within a day.',
  },
  zh: {
    title: '价格', sub: '先免费用，成为习惯后再升级。',
    month: '按月', year: '按年', save: '最高省 60%',
    free: '免费', plus: 'Plus', pro: 'Pro', popular: '最多人选', founding: '首批会员价，只要续订就一直锁定',
    perMonth: '/ 月', perYear: '/ 年', billedYear: '一次付一年，约 ¥{m} / 月',
    freeL: ['每天 {n} 个免费视频', '每个视频都能提问', '中英文，16:9 和 9:16', '视频保留 14 天'],
    plusL: ['每月 40 个视频，最长 5 分钟', '提问不限次数', '视频保留 90 天', '高峰期优先', '失败自动退还'],
    proL: ['每月 120 个视频，最长 10 分钟', '深度学习：AI 还会查阅可信教材和论文，每个来源都注明', '提问不限次数，并附来源', '视频保留一年', '最高优先级'],
    soon: '开发中，Pro 会员优先使用',
    cta: '加入首批名单', ctaSent: '已加入名单，我们会联系你。', ctaFree: '免费注册', ctaMine: '我的论文',
    packs: '不想订阅？额度包',
    packsLine: '10 个视频 ¥{p}，额度永不过期。', buy: '购买额度', note: '微信或支付宝付款。套餐目前人工确认，通常一天内。',
  },
} as const;

export default function PricingSection() {
  const { lang } = usePrefs();
  const ac = useAcctText();
  const { me, user, openAuth } = useAccount();
  const l = L[lang === 'zh' ? 'zh' : 'en'];
  const [billing, setBilling] = useState<Billing>('year');
  const [sent, setSent] = useState<PlanId | null>(null);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [err, setErr] = useState('');
  const packs = Object.values(me?.packs ?? { 10: { credits: 10, price: 30 } });
  const from = packs.length ? packs.reduce((a, b) => (a.credits <= b.credits ? a : b)) : null;

  const join = async (plan: PlanId) => {
    if (!user) { openAuth('register'); return; }
    setBusy(plan); setErr('');
    try {
      track('click_plan', { plan, billing });
      await accountApi('contact', { topic: 'billing', name: '', email: user.username, message: `Plan interest: ${plan}, ${billing}ly, founding price ¥${PLANS[plan].now[billing]}` });
      setSent(plan);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
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
              <s className="price-old">¥{billing === 'year' ? Math.round(p.list.year / 12) : p.list.month}</s> ¥{monthly} <small>{l.perMonth}</small>
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
        ) : (
          <button type="button" className={`btn ${featured ? 'primary' : 'ghost'}`} disabled={busy === id} onClick={() => join(id)}>{l.cta}</button>
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

      <div className="packs-line">
        <span><b>{l.packs}</b> · {l.packsLine.replace('{p}', String(from?.price ?? 30))}</span>
        {user ? <Link className="btn ghost small" to="/account#buy">{ac('buyCredits')}</Link> : <button type="button" className="btn ghost small" onClick={() => openAuth('register')}>{ac('needLogin')}</button>}
      </div>
      <p className="small muted" style={{ marginTop: 10 }}>{l.note}</p>
    </section>
  );
}
