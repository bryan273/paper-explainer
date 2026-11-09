import { useMemo, useState } from 'react';
import { Kpi } from './AdminCharts';

/** Pricing and margin model for the admin: real cost per video from the jobs, the rest as assumptions you can change. */
type Job = { status: string; seconds: number | null; cost_usd: number | null; created_at: string };
type Order = { status: string; cny: number; created_at: string; what: string };
type Props = { jobs: Job[]; orders: Order[]; usdCny: number; activePlans: number };

// what each plan gives (keep in step with the pricing page and the backend TIERS / PLANS)
const PLANS = [
  { k: 'free', name: 'Free', month: 0, year: 0, videos: 5 * 4.33, maxMin: 3, inter: 3 * 4.33, deep: 3, keep: 7 },
  { k: 'plus', name: 'Plus', month: 33, year: 330, videos: 80, maxMin: 5, inter: 40, deep: 30, keep: 30 },
  { k: 'pro', name: 'Pro', month: 59, year: 590, videos: 150, maxMin: 10, inter: 75, deep: 80, keep: 90 },
  { k: 'premium', name: 'Premium', month: 109, year: 1090, videos: 280, maxMin: 10, inter: 140, deep: 160, keep: 270 },
];
const PACKS = [{ n: 5, cny: 19 }, { n: 20, cny: 59 }, { n: 50, cny: 129 }];
const y = (n: number) => `¥${(Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n: number) => `${Math.round(n * 100)}%`;

function Num({ label, value, onChange, step = 0.01, suffix }: { label: string; value: number; onChange: (n: number) => void; step?: number; suffix?: string }) {
  return (
    <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
      <span className="cs-dim">{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} style={{ width: 110, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', color: 'inherit' }} />
        {suffix && <span className="cs-dim">{suffix}</span>}
      </span>
    </label>
  );
}

export function AdminPricing({ jobs, orders, usdCny, activePlans }: Props) {
  // measured: the AI and render cost of finished videos, by length
  const measured = useMemo(() => {
    const done = jobs.filter((j) => j.status === 'done' && j.cost_usd !== null && j.seconds);
    const by = (lo: number, hi: number) => { const l = done.filter((j) => (j.seconds ?? 0) > lo && (j.seconds ?? 0) <= hi); return l.length ? { n: l.length, cny: (l.reduce((a, j) => a + Number(j.cost_usd), 0) / l.length) * usdCny } : null; };
    return { short: by(0, 180), mid: by(180, 300), long: by(300, 600), n: done.length };
  }, [jobs, usdCny]);
  const [vShort, setVShort] = useState(() => Number((measured.short?.cny ?? 0.15).toFixed(3)));
  const [vMid, setVMid] = useState(() => Number((measured.mid?.cny ?? 0.25).toFixed(3)));
  const [vLong, setVLong] = useState(() => Number((measured.long?.cny ?? 0.5).toFixed(3)));
  const [cInter, setCInter] = useState(0.03);   // writing the questions and explanations of one video
  const [cDeep, setCDeep] = useState(0.3);   // one in-depth answer (stronger model)
  const [cQuick, setCQuick] = useState(0.01);   // one quick answer
  const [quickPerVideo, setQuickPerVideo] = useState(3);
  const [useVideos, setUseVideos] = useState(0.4);   // share of the video allowance people really use
  const [useInter, setUseInter] = useState(0.35);
  const [useDeep, setUseDeep] = useState(0.4);   // share of the monthly in-depth pool people really use
  const [fee, setFee] = useState(0);   // payment fee share (bank QR, WeChat, Alipay personal codes: 0)
  const [fixed, setFixed] = useState(15);   // fixed costs a month: domain, e-mail sending, etc.
  const [mix, setMix] = useState<Record<string, number>>({ free: 1000, plus: 40, pro: 10, premium: 3 });

  const rows = PLANS.map((p) => {
    // cost of one video credit: most videos are short, the longest ones cost more but count as two credits
    const perVideo = p.maxMin <= 3 ? vShort : Math.max(vMid, vLong / 2);   // worst case per credit
    const typical = p.maxMin <= 3 ? vShort : 0.65 * vShort + 0.35 * vMid;   // what a normal member makes
    const worst = p.videos * (perVideo + quickPerVideo * cQuick) + p.inter * cInter + p.deep * cDeep;
    const expect = p.videos * useVideos * (typical + quickPerVideo * cQuick) + p.inter * useInter * cInter + p.deep * useDeep * cDeep;
    const income = p.month * (1 - fee);
    return { ...p, perVideo, worst, expect, income, margin: income ? (income - expect) / income : -1, worstMargin: income ? (income - worst) / income : -1, pricePerVideo: p.month ? p.month / p.videos : 0 };
  });
  const scen = rows.reduce((a, r) => { const n = mix[r.k] ?? 0; a.rev += n * r.income; a.cost += n * r.expect; return a; }, { rev: 0, cost: 0 });
  scen.cost += fixed;
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
  const paid30 = orders.filter((o) => o.status === 'paid' && o.created_at >= since30).reduce((a, o) => a + (o.cny || 0), 0);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section className="cs-card">
        <h3>What one video costs us</h3>
        <p className="cs-dim" style={{ fontSize: 13 }}>Measured from {measured.n} finished videos (AI and rendering; storage stays inside the free R2 tier). The boxes start at the measured value and can be changed.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 10 }}>
          <Num label={`Video up to 3 min${measured.short ? ` (measured, ${measured.short.n})` : ' (estimate)'}`} value={vShort} onChange={setVShort} suffix="¥" />
          <Num label={`Video 4 to 5 min${measured.mid ? ` (measured, ${measured.mid.n})` : ' (estimate)'}`} value={vMid} onChange={setVMid} suffix="¥" />
          <Num label={`Video 7 to 10 min${measured.long ? ` (measured, ${measured.long.n})` : ' (estimate)'}`} value={vLong} onChange={setVLong} suffix="¥" />
          <Num label="Interactive mode, per video" value={cInter} onChange={setCInter} suffix="¥" />
          <Num label="In-depth answer, each" value={cDeep} onChange={setCDeep} suffix="¥" />
          <Num label="Quick answer, each" value={cQuick} onChange={setCQuick} suffix="¥" />
        </div>
      </section>

      <section className="cs-card">
        <h3>How much people use</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 6 }}>
          <Num label="Share of videos used" value={useVideos} onChange={setUseVideos} step={0.05} />
          <Num label="Share of interactive used" value={useInter} onChange={setUseInter} step={0.05} />
          <Num label="Share of in-depth answers used" value={useDeep} onChange={setUseDeep} step={0.05} />
          <Num label="Quick answers per video" value={quickPerVideo} onChange={setQuickPerVideo} step={1} />
          <Num label="Payment fee share" value={fee} onChange={setFee} step={0.01} />
          <Num label="Fixed costs a month" value={fixed} onChange={setFixed} step={1} suffix="¥" />
        </div>
      </section>

      <section className="cs-card">
        <h3>Each plan, per member per month</h3>
        <div className="cs-wrap"><table><thead><tr><th>Plan</th><th>Price</th><th>Price per video</th><th>Expected cost</th><th>Expected margin</th><th>Cost if fully used</th><th>Margin if fully used</th></tr></thead><tbody>
          {rows.map((r) => <tr key={r.k}><td>{r.name}</td><td>{y(r.month)}</td><td>{r.month ? y(r.pricePerVideo) : '-'}</td><td>{y(r.expect)}</td>
            <td style={{ color: r.margin < 0.5 ? '#d6453d' : '#1a9a55' }}>{r.month ? pct(r.margin) : 'cost of acquisition'}</td><td>{y(r.worst)}</td>
            <td style={{ color: r.worstMargin < 0 ? '#d6453d' : r.worstMargin < 0.3 ? '#c98a12' : '#1a9a55' }}>{r.month ? pct(r.worstMargin) : '-'}</td></tr>)}
        </tbody></table></div>
        <p className="cs-dim" style={{ fontSize: 13, marginTop: 8 }}>"Cost if fully used" assumes every video credit is spent on a 4 to 5 minute video and every interactive turn and every in-depth answer of the month is used. It is the worst case, not the normal one.</p>
      </section>

      <section className="cs-card">
        <h3>Video packs</h3>
        <div className="cs-wrap"><table><thead><tr><th>Pack</th><th>Price</th><th>Per video</th><th>Cost per video (10 min, 2 in-depth)</th><th>Margin</th></tr></thead><tbody>
          {PACKS.map((p) => { const c = vLong + 2 * cDeep + cInter + quickPerVideo * cQuick; const per = p.cny / p.n; return <tr key={p.n}><td>{p.n} Pro videos</td><td>{y(p.cny)}</td><td>{y(per)}</td><td>{y(c)}</td><td>{pct((per - c) / per)}</td></tr>; })}
        </tbody></table></div>
      </section>

      <section className="cs-card">
        <h3>Revenue scenario</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {PLANS.map((p) => <Num key={p.k} label={`${p.name} members`} value={mix[p.k] ?? 0} step={1} onChange={(n) => setMix((m) => ({ ...m, [p.k]: n }))} />)}
        </div>
        <div className="cs-kpis" style={{ marginTop: 14 }}>
          <Kpi label="Revenue a month" value={y(scen.rev)} />
          <Kpi label="Cost a month" value={y(scen.cost)} />
          <Kpi label="Profit a month" value={y(scen.rev - scen.cost)} tone={scen.rev - scen.cost >= 0 ? 'good' : 'bad'} />
          <Kpi label="Paid in the last 30 days (real)" value={y(paid30)} sub={`${activePlans} plans running now`} />
        </div>
      </section>

      <section className="cs-card">
        <h3>What the numbers say</h3>
        <ul style={{ display: 'grid', gap: 8, fontSize: 14, lineHeight: 1.55, paddingLeft: 18 }}>
          <li>Videos are cheap for us; in-depth answers are not. One in-depth answer costs about as much as a whole 5 minute video, so they are a monthly pool (3, 30, 80, 160) instead of a number per video. That caps what one heavy member can cost, and normal use never reaches it.</li>
          <li>Free costs about {y(rows[0].expect)} per active member a month. That is the price of acquiring a user; keep it, but watch it as members grow.</li>
          <li>Packs earn far more per video than plans, which is right: they are for people who only need a few, and they push regular users to a plan.</li>
          <li>Sources are capped at 60,000 characters (about 25 pages), so a long book never costs more than a short paper.</li>
        </ul>
      </section>
    </div>
  );
}
