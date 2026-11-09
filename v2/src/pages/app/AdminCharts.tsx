import { useEffect, useRef, useState, type ReactNode } from 'react';

/** The width a chart is really drawn at, so text keeps its size on a phone and the chart uses the whole card on a desktop. */
function useWidth(): [React.RefObject<HTMLDivElement>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(900);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const on = () => setW(Math.max(300, Math.round(el.getBoundingClientRect().width)));
    on();
    const ro = new ResizeObserver(on); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

export type Series = { name: string; color: string; values: number[] };

const nice = (max: number) => {
  if (max <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(max)));
  const f = max / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
};
export const compact = (n: number) => (Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : Math.abs(n) >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(Math.round(n * 100) / 100));

/** Bars, grouped or stacked, with a value axis, grid lines and a hover read-out. Big on purpose: this is the picture the decisions are made from. */
export function BarChart({ labels, series, stacked = false, height = 300, fmt = compact }: { labels: string[]; series: Series[]; stacked?: boolean; height?: number; fmt?: (n: number) => string }) {
  const [box, W] = useWidth();
  const H = height, L = 72, R = 12, T = 14, B = 34;
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const n = labels.length;
  const totals = labels.map((_, i) => (stacked ? series.reduce((a, s) => a + (s.values[i] || 0), 0) : Math.max(0, ...series.map((s) => s.values[i] || 0))));
  const top = nice(Math.max(...totals, 0));
  const y = (v: number) => T + (1 - v / top) * (H - T - B);
  const slot = (W - L - R) / Math.max(1, n);
  const bw = Math.max(2, Math.min(40, slot * 0.72 / (stacked ? 1 : series.length)));
  const every = Math.max(1, Math.ceil(n / 10));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * top);
  const move = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect(); if (!r) return;
    const x = ((e.clientX - r.left) / r.width) * W;
    const i = Math.floor((x - L) / slot);
    setHover(i >= 0 && i < n ? i : null);
  };
  return (
    <div className="chart" ref={box} style={{ position: 'relative' }}>
      <svg ref={ref} width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" onMouseMove={move} onMouseLeave={() => setHover(null)} style={{ display: 'block', maxWidth: '100%' }}>
        {ticks.map((t, k) => (
          <g key={k}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize={12} fill="var(--text2)">{fmt(t)}</text>
          </g>
        ))}
        {labels.map((lb, i) => {
          const x0 = L + i * slot + slot / 2;
          let acc = 0;
          return (
            <g key={i}>
              {hover === i && <rect x={L + i * slot} y={T} width={slot} height={H - T - B} fill="var(--accent)" opacity={0.07} />}
              {series.map((s, k) => {
                const v = s.values[i] || 0;
                const h = (v / top) * (H - T - B);
                const x = stacked ? x0 - bw / 2 : x0 - (bw * series.length) / 2 + k * bw;
                const yy = stacked ? y(acc + v) : y(v);
                const out = <rect key={k} x={x} y={yy} width={bw - (stacked ? 0 : 1)} height={Math.max(0, h)} rx={2} fill={s.color} opacity={hover === null || hover === i ? 1 : 0.55} />;
                acc += v;
                return out;
              })}
              {i % every === 0 && <text x={x0} y={H - 10} textAnchor="middle" fontSize={12} fill="var(--text2)">{lb}</text>}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="chart-tip" style={{ left: `${Math.min(82, Math.max(2, ((L + hover * slot) / W) * 100))}%` }}>
          <b>{labels[hover]}</b>
          {series.map((s) => <div key={s.name}><i style={{ background: s.color }} /> {s.name}: <b>{fmt(s.values[hover] || 0)}</b></div>)}
        </div>
      )}
      <Legend series={series} />
    </div>
  );
}

/** Lines with a soft fill under the first one, for things that move continuously (members, visitors, tokens). */
export function LineChart({ labels, series, height = 300, fmt = compact }: { labels: string[]; series: Series[]; height?: number; fmt?: (n: number) => string }) {
  const [box, W] = useWidth();
  const H = height, L = 72, R = 16, T = 14, B = 34;
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const n = labels.length;
  const top = nice(Math.max(0, ...series.flatMap((s) => s.values)));
  const x = (i: number) => L + (n <= 1 ? 0 : (i / (n - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - v / top) * (H - T - B);
  const every = Math.max(1, Math.ceil(n / 10));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * top);
  const move = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect(); if (!r || n === 0) return;
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((px - L) / (W - L - R)) * (n - 1)))));
  };
  return (
    <div className="chart" ref={box} style={{ position: 'relative' }}>
      <svg ref={ref} width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" onMouseMove={move} onMouseLeave={() => setHover(null)} style={{ display: 'block', maxWidth: '100%' }}>
        {ticks.map((t, k) => (
          <g key={k}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize={12} fill="var(--text2)">{fmt(t)}</text>
          </g>
        ))}
        {series.map((s, k) => {
          const pts = s.values.map((v, i) => `${x(i)},${y(v || 0)}`).join(' ');
          return (
            <g key={s.name}>
              {k === 0 && n > 1 && <polygon points={`${x(0)},${y(0)} ${pts} ${x(n - 1)},${y(0)}`} fill={s.color} opacity={0.1} />}
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
            </g>
          );
        })}
        {labels.map((lb, i) => i % every === 0 && <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize={12} fill="var(--text2)">{lb}</text>)}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="var(--text2)" strokeDasharray="3 3" />
            {series.map((s) => <circle key={s.name} cx={x(hover)} cy={y(s.values[hover] || 0)} r={4.5} fill={s.color} stroke="hsl(var(--card))" strokeWidth={2} />)}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="chart-tip" style={{ left: `${Math.min(82, Math.max(2, (x(hover) / W) * 100))}%` }}>
          <b>{labels[hover]}</b>
          {series.map((s) => <div key={s.name}><i style={{ background: s.color }} /> {s.name}: <b>{fmt(s.values[hover] || 0)}</b></div>)}
        </div>
      )}
      <Legend series={series} />
    </div>
  );
}

function Legend({ series }: { series: Series[] }) {
  if (series.length < 2) return null;
  return <div className="chart-legend">{series.map((s) => <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>)}</div>;
}

/** A ranked list drawn as horizontal bars: countries, languages, sources. */
export function HBars({ rows, color = 'var(--accent)', name, total }: { rows: { k: string; n: number }[]; color?: string; name?: (k: string) => string; total?: number }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  const sum = total ?? rows.reduce((a, r) => a + r.n, 0);
  if (!rows.length) return <p className="cs-note sub">No data in this range.</p>;
  return (
    <div className="hbars">
      {rows.map((r) => (
        <div key={r.k} className="hbar">
          <span className="hbar-k">{name ? name(r.k) : r.k}</span>
          <span className="hbar-track"><i style={{ width: `${(r.n / max) * 100}%`, background: color }} /></span>
          <b>{r.n}</b>
          <span className="hbar-p">{sum ? Math.round((r.n / sum) * 100) : 0}%</span>
        </div>
      ))}
    </div>
  );
}

/** How full something is against its limit, with the colour of a warning light. */
export function Gauge({ label, used, limit, fmt, note }: { label: string; used: number; limit: number; fmt: (n: number) => string; note?: ReactNode }) {
  const p = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const tone = p >= 90 ? 'var(--bad, #d6453d)' : p >= 70 ? '#e2a13a' : '#1a9a55';
  return (
    <div className="gauge">
      <div className="gauge-h"><b>{label}</b><span>{fmt(used)} of {fmt(limit)} · {Math.round(p)}%</span></div>
      <div className="gauge-bar"><i style={{ width: `${p}%`, background: tone }} /></div>
      <div className="gauge-n"><span>{fmt(Math.max(0, limit - used))} left</span>{note && <span>{note}</span>}</div>
    </div>
  );
}

export function Kpi({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'good' | 'bad' | 'warn' }) {
  return (
    <div className={`kpi${tone ? ` ${tone}` : ''}`}>
      <span>{label}</span>
      <b>{value}</b>
      {sub && <small>{sub}</small>}
    </div>
  );
}
