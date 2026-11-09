import { useMemo, useState } from 'react';
import { Kpi } from './AdminCharts';

/** The pricing model for the admin: what one member can cost us under each plan, built from the measured cost of each feature. */
type Job = { status: string; seconds: number | null; cost_usd: number | null; created_at: string };
type Order = { status: string; cny: number; created_at: string; what: string };
type FeatureCost = { n: number; each: number | null };
type Costs = { video_per_minute: number | null; quick: FeatureCost; deep: FeatureCost; quiz: FeatureCost; research: { n: number; each: number | null } };
type Props = { jobs: Job[]; orders: Order[]; usdCny: number; activePlans: number; costs?: Costs };

// what each plan gives a month (keep in step with the pricing page and the backend TIERS / PLANS)
const PLANS = [
  { k: 'free', name: 'Free', month: 0, credits: 3 * 4.33, maxMin: 3, edits: 1, inter: 2 * 4.33, quick: 20 * 4.33, deep: 2, research: 2 * 4.33, keep: 7 },
  { k: 'plus', name: 'Plus', month: 29, credits: 20, maxMin: 5, edits: 2, inter: 20, quick: 100, deep: 10, research: 8, keep: 30 },
  { k: 'pro', name: 'Pro', month: 55, credits: 40, maxMin: 10, edits: 3, inter: 40, quick: 200, deep: 20, research: 15, keep: 90 },
  { k: 'premium', name: 'Premium', month: 99, credits: 80, maxMin: 20, edits: 3, inter: 80, quick: 300, deep: 30, research: 25, keep: 270 },
];
const PACKS = [{ n: 5, cny: 19 }, { n: 20, cny: 59 }, { n: 50, cny: 129 }];
const y = (n: number) => `¥${(Math.round(n * 100) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n: number) => `${Math.round(n * 100)}%`;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

function Num({ label, value, onChange, step = 0.01, suffix, note }: { label: string; value: number; onChange: (n: number) => void; step?: number; suffix?: string; note?: string }) {
  return (
    <label style={{ display: 'grid', gap: 4, fontSize: 13, minWidth: 150 }}>
      <span className="cs-dim">{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} style={{ width: 110, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--line)', background: 'hsl(var(--card))', color: 'inherit' }} />
        {suffix && <span className="cs-dim">{suffix}</span>}
      </span>
      {note && <span className="cs-dim" style={{ fontSize: 11.5 }}>{note}</span>}
    </label>
  );
}

export function AdminPricing({ jobs, orders, usdCny, activePlans, costs }: Props) {
  const measuredMin = useMemo(() => {
    const done = jobs.filter((j) => j.status === 'done' && j.cost_usd !== null && j.seconds);
    const mins = done.reduce((a, j) => a + (j.seconds ?? 0) / 60, 0);
    return mins ? (done.reduce((a, j) => a + Number(j.cost_usd), 0) * usdCny) / mins : null;
  }, [jobs, usdCny]);
  const m = (v: number | null | undefined, fallback: number) => (v != null && v > 0 ? r3(v) : fallback);
  const [perMin, setPerMin] = useState(() => m(costs?.video_per_minute ?? measuredMin, 0.07));
  const [cQuick, setCQuick] = useState(() => m(costs?.quick.each, 0.08));
  const [cDeep, setCDeep] = useState(() => m(costs?.deep.each, 0.5));
  const [cInter, setCInter] = useState(() => m(costs?.quiz.each, 0.1));
  const [cResearch, setCResearch] = useState(() => m(costs?.research.each, 0.5));
  const [editShare, setEditShare] = useState(1);   // an edit re-makes the video: about one video of work
  const [use, setUse] = useState(0.4);   // share of each allowance a normal member really uses
  const [fee, setFee] = useState(0);
  const [fixed, setFixed] = useState(15);
  const [mix, setMix] = useState<Record<string, number>>({ free: 300, plus: 30, pro: 8, premium: 3 });

  const rows = PLANS.map((p) => {
    // the worst case: every credit spent on the longest length per credit (5 minutes), every edit, answer and question used
    const perCredit = 5 * perMin;
    const parts = {
      videos: p.credits * perCredit,
      edits: p.credits * p.edits * perCredit * editShare,
      interactive: p.inter * cInter,
      quick: p.quick * cQuick,
      deep: p.deep * cDeep,
      research: p.research * cResearch,
    };
    const worst = Object.values(parts).reduce((a, b) => a + b, 0);
    // a normal member: 3 minute videos, and the share of each allowance set below
    const expect = use * (p.credits * 3 * perMin + p.credits * p.edits * 0.3 * 3 * perMin * editShare + parts.interactive + parts.quick + parts.deep + parts.research);
    const income = p.month * (1 - fee);
    return { ...p, parts, worst, expect, income, margin: income ? (income - expect) / income : -1, worstMargin: income ? (income - worst) / income : -1 };
  });
  const scen = rows.reduce((a, r) => { const n = mix[r.k] ?? 0; a.rev += n * r.income; a.cost += n * r.expect; return a; }, { rev: 0, cost: 0 });
  scen.cost += fixed;
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
  const paid30 = orders.filter((o) => o.status === 'paid' && o.created_at >= since30).reduce((a, o) => a + (o.cny || 0), 0);
  const src = (v: number | null | undefined, n?: number) => (v != null && v > 0 ? `measured${n ? `, ${n}` : ''}` : 'estimate');

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section className="cs-card">
        <h3>What each feature costs us</h3>
        <p className="cs-dim" style={{ fontSize: 13 }}>The boxes start at what the last 30 days measured (Videos and usage tab) and can be changed to try other numbers.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 10 }}>
          <Num label="Video, per minute" value={perMin} onChange={setPerMin} suffix="¥" note={src(costs?.video_per_minute ?? measuredMin)} />
          <Num label="Quick answer, each" value={cQuick} onChange={setCQuick} suffix="¥" note={src(costs?.quick.each, costs?.quick.n)} />
          <Num label="In-depth answer, each" value={cDeep} onChange={setCDeep} suffix="¥" note={src(costs?.deep.each, costs?.deep.n)} />
          <Num label="Interactive mode, per video" value={cInter} onChange={setCInter} suffix="¥" note={src(costs?.quiz.each, costs?.quiz.n)} />
          <Num label="Research question, each" value={cResearch} onChange={setCResearch} suffix="¥" note={src(costs?.research.each, costs?.research.n)} />
          <Num label="An edit, in videos" value={editShare} onChange={setEditShare} step={0.1} note="1 = it costs a whole video" />
        </div>
      </section>

      <section className="cs-card">
        <h3>If a member uses everything (the worst case)</h3>
        <p className="cs-dim" style={{ fontSize: 13 }}>Every video credit spent on a 5 minute video, every edit used, every interactive video, quick answer, in-depth answer and research question used. A plan is safe when this stays at or under its price.</p>
        <div className="cs-wrap" style={{ marginTop: 10 }}><table><thead><tr><th>Plan</th><th>Price</th><th>Videos</th><th>Edits</th><th>Interactive</th><th>Quick</th><th>In-depth</th><th>Research</th><th>Total</th><th>Margin</th></tr></thead><tbody>
          {rows.map((r) => <tr key={r.k}><td>{r.name}</td><td>{y(r.month)}</td>
            <td title={`${r.credits.toFixed(0)} credits x 5 min x ${y(perMin)}`}>{y(r.parts.videos)}</td>
            <td title={`${r.credits.toFixed(0)} x ${r.edits} edits x one video`}>{y(r.parts.edits)}</td>
            <td title={`${r.inter.toFixed(0)} x ${y(cInter)}`}>{y(r.parts.interactive)}</td>
            <td title={`${r.quick.toFixed(0)} x ${y(cQuick)}`}>{y(r.parts.quick)}</td>
            <td title={`${r.deep} x ${y(cDeep)}`}>{y(r.parts.deep)}</td>
            <td title={`${r.research.toFixed(0)} x ${y(cResearch)}`}>{y(r.parts.research)}</td>
            <td><b>{y(r.worst)}</b></td>
            <td style={{ color: !r.month ? undefined : r.worstMargin < -0.1 ? '#d6453d' : r.worstMargin < 0.1 ? '#c98a12' : '#1a9a55' }}>{r.month ? pct(r.worstMargin) : 'cost of a free member'}</td></tr>)}
        </tbody></table></div>
        <p className="cs-dim" style={{ fontSize: 12.5, marginTop: 8 }}>Point at a cell to see how it is made: amount times cost each.</p>
      </section>

      <section className="cs-card">
        <h3>A normal member</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 6 }}>
          <Num label="Share of each allowance used" value={use} onChange={setUse} step={0.05} note="0.4 = 40%" />
          <Num label="Payment fee share" value={fee} onChange={setFee} step={0.01} note="personal QR codes: 0" />
          <Num label="Fixed costs a month" value={fixed} onChange={setFixed} step={1} suffix="¥" note="domain, e-mail" />
        </div>
        <div className="cs-wrap" style={{ marginTop: 12 }}><table><thead><tr><th>Plan</th><th>Price</th><th>Expected cost</th><th>Expected margin</th><th>How it is made</th></tr></thead><tbody>
          {rows.map((r) => <tr key={r.k}><td>{r.name}</td><td>{y(r.month)}</td><td>{y(r.expect)}</td>
            <td style={{ color: !r.month ? undefined : r.margin < 0.5 ? '#c98a12' : '#1a9a55' }}>{r.month ? pct(r.margin) : '-'}</td>
            <td className="cs-dim" style={{ fontSize: 12.5 }}>{pct(use)} of: {r.credits.toFixed(0)} three-minute videos, a third of the edits, {r.inter.toFixed(0)} interactive, {r.quick.toFixed(0)} quick, {r.deep} in-depth, {r.research.toFixed(0)} research</td></tr>)}
        </tbody></table></div>
      </section>

      <section className="cs-card">
        <h3>Video credit packs</h3>
        <div className="cs-wrap"><table><thead><tr><th>Pack</th><th>Price</th><th>Per credit</th><th>Worst cost per credit (5 min)</th><th>Margin</th></tr></thead><tbody>
          {PACKS.map((p) => { const c = 5 * perMin + cInter + 3 * cQuick; const per = p.cny / p.n; return <tr key={p.n}><td>{p.n} credits</td><td>{y(p.cny)}</td><td>{y(per)}</td><td>{y(c)}</td><td>{pct((per - c) / per)}</td></tr>; })}
        </tbody></table></div>
      </section>

      <section className="cs-card">
        <h3>Revenue scenario</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {PLANS.map((p) => <Num key={p.k} label={`${p.name} members (active)`} value={mix[p.k] ?? 0} step={1} onChange={(n) => setMix((x) => ({ ...x, [p.k]: n }))} />)}
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
          <li>Videos are cheap: about {y(3 * perMin)} for a 3 minute video. Answers are what costs money, because each one reads the source again. That is why quick answers, in-depth answers and research questions each have a monthly allowance.</li>
          <li>Quick answers now read only the part of the source closest to the question, which cuts their cost by about two thirds.</li>
          <li>Free costs about {y(rows[0].expect)} per active member a month. It is the price of a new user; watch the ratio of paying to free members (aim for 1 in 10).</li>
          <li>Sources are capped at 60,000 characters (about 25 pages), so a long book never costs more than a short paper.</li>
        </ul>
      </section>
    </div>
  );
}
