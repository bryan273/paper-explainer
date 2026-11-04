import { useCallback, useEffect, useState } from 'react';
import Shell from '@/components/Shell';

const SB = 'https://wzdkroxbfrlqijbeiwpk.supabase.co';
const TOKEN_KEY = 'pe-admin-token';
const STATUSES = ['new', 'paid_claimed', 'paid', 'delivered', 'cancelled'] as const;

type Job = { id: string; created_at: string; arxiv: string | null; source_url: string | null; title: string | null; status: string; model: string | null; voice: string | null; visitor: string; error: string | null; seconds?: number | null; cost_usd?: number | null; usage?: { calls?: number; estimated_calls?: number; by_model?: Record<string, { calls: number; usd: number }> } | null };
type Order = { id: string; created_at: string; email: string; arxiv: string; language: string; notes: string; status: string; pay_method: string | null; paid_at: string | null };
type Feedback = { id: string; created_at: string; rating: number | null; use_case: string; comment: string; email: string; arxiv: string; kind: string };
type UserRow = { id: string; username: string; credits: number; banned: boolean; created_at: string; last_login: string | null; jobs: number; last_job: string | null };
type EventRow = { id: number; created_at: string; actor: string; user_id: string | null; type: string; meta: Record<string, unknown> };
type CreditRow = { id: number; created_at: string; user_id: string; delta: number; reason: string };
type Costs = { total_usd: number; usd_24h: number; usd_7d: number; priced_jobs: number; avg_usd: number; note: string };
type Ops = {
  db_bytes: number;
  storage: { bucket: string; objects: number; bytes: number }[];
  llm: { app: string; calls_24h: number; calls_7d: number; tokens_24h: number; tokens_7d: number }[];
  jobs: Record<string, number>;
  last_backup: { taken_at: string; tables: number; rows: number; source: string } | null;
  llm_daily: { d: string; calls: number; tokens: number }[];
  jobs_daily: { d: string; n: number }[];
  egress: { plays_30d: number; downloads_30d: number; est_bytes: number };
};
type Dash = {
  ops?: Ops | null;
  viewer?: boolean;
  costs?: Costs;
  funnel: { step: string; n: number }[];
  byType: Record<string, number>;
  contacts: number;
  users: UserRow[];
  events: EventRow[];
  credits: CreditRow[];
  me: string;
  counts: Record<string, number>;
  perDay: { date: string; n: number }[];
  jobs: Job[];
  orders: Order[];
  feedback: Feedback[];
};

const getToken = () => {
  try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
};
const usd = (n: number | null | undefined) => (n === null || n === undefined ? '' : `$${Number(n).toFixed(Number(n) < 0.1 ? 4 : Number(n) < 1 ? 3 : 2)}`);
const fmt = (s: string | null) => (s ? new Date(s).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '');

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${SB}${path}`, init);
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(String(out?.error ?? out?.msg ?? out?.error_description ?? `HTTP ${res.status}`)), { status: res.status });
  return out;
}

// Supabase free-plan limits this project lives under. Egress (5 GB a month) is not readable through any API, so it is read in the Supabase dashboard (Usage).
const MB = 1024 * 1024;
const LIMITS = { db: 500 * MB, storage: 1024 * MB, egress: 5 * 1024 * MB };
const mb = (n: number) => (n >= 1024 * MB ? `${(n / 1024 / MB).toFixed(2)} GB` : `${(n / MB).toFixed(n < 10 * MB ? 1 : 0)} MB`);

function Bar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, (used / limit) * 100);
  const tone = pct >= 90 ? '#d64545' : pct >= 70 ? '#d68a1f' : '#2f9e6b';
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="row between small"><span>{label}</span><span className="muted">{mb(used)} of {mb(limit)} ({pct.toFixed(0)}%)</span></div>
      <div style={{ height: 8, borderRadius: 4, background: 'rgba(120,120,120,.18)', marginTop: 4 }}>
        <div style={{ width: `${Math.max(pct, 1)}%`, height: '100%', borderRadius: 4, background: tone }} />
      </div>
    </div>
  );
}

function BarChart({ title, data, unit }: { title: string; data: { d: string; v: number }[]; unit: string }) {
  const W = 560, H = 190, L = 30, B = 24, T = 18;
  const max = Math.max(...data.map((x) => x.v), 1);
  const nice = max <= 4 ? max : Math.ceil(max / 5) * 5;
  const bw = (W - L) / Math.max(data.length, 1);
  const total = data.reduce((a, x) => a + x.v, 0);
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row between"><b>{title}</b><span className="small muted">{total.toLocaleString()} {unit}, last {data.length} days</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}: ${total} ${unit}`} style={{ width: '100%', height: 'auto', marginTop: 8, display: 'block' }}>
        {[0, 0.5, 1].map((f) => {
          const y = T + (H - T - B) * (1 - f);
          return <g key={f}><line x1={L} x2={W} y1={y} y2={y} stroke="currentColor" opacity={f === 0 ? 0.35 : 0.12} /><text x={L - 6} y={y + 3} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.55">{Math.round(nice * f)}</text></g>;
        })}
        {data.map((x, i) => {
          const h = (H - T - B) * (x.v / nice);
          const cx = L + bw * i + bw / 2;
          return (
            <g key={x.d}>
              <title>{`${x.d}: ${x.v} ${unit}`}</title>
              <rect x={cx - Math.min(bw * 0.32, 13)} y={H - B - Math.max(h, x.v ? 2 : 0)} width={Math.min(bw * 0.64, 26)} height={Math.max(h, x.v ? 2 : 0)} rx="4" fill="var(--acc)" opacity={x.v ? 1 : 0} />
              {x.v > 0 && <text x={cx} y={H - B - h - 5} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="currentColor">{x.v}</text>}
              {(i % 2 === data.length % 2 || data.length < 8) && <text x={cx} y={H - 8} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.55">{x.d}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function OpsPanel({ ops }: { ops: Ops | null | undefined }) {
  if (!ops) return <div className="card" style={{ padding: 16, marginBottom: 16 }}><b>System</b><p className="small muted" style={{ margin: '6px 0 0' }}>Could not read the system stats. Check that supabase/ops.sql is applied.</p></div>;
  const storage = ops.storage.reduce((a, s) => a + s.bytes, 0);
  const age = ops.last_backup ? (Date.now() - new Date(ops.last_backup.taken_at).getTime()) / 3600_000 : null;
  const warns: string[] = [];
  if (storage >= LIMITS.storage * 0.7) warns.push('Storage is above 70% of the free limit.');
  if (ops.egress.est_bytes >= LIMITS.egress * 0.6) warns.push('Estimated egress is above 60% of the 5 GB monthly cap. Check Usage in the Supabase dashboard now.');
  if (ops.db_bytes >= LIMITS.db * 0.7) warns.push('Database is above 70% of the free limit.');
  if (age === null) warns.push('No backup has been recorded yet.');
  else if (age > 36) warns.push(`The last backup is ${Math.round(age)} hours old. The daily run may be failing (GitHub Actions: backup-supabase).`);
  const failed = ops.jobs.failed ?? 0;
  if (failed > 0) warns.push(`${failed} video job${failed > 1 ? 's' : ''} failed.`);
  return (
    <div className="card" style={{ padding: 16, marginBottom: 16 }}>
      <div className="row between"><b>System</b><span className="small muted">Supabase free plan</span></div>
      {warns.length > 0 && <ul style={{ margin: '10px 0', paddingLeft: 18, color: '#d68a1f' }} className="small">{warns.map((w) => <li key={w}>{w}</li>)}</ul>}
      <div style={{ marginTop: 12 }}>
        <Bar label="Database" used={ops.db_bytes} limit={LIMITS.db} />
        <Bar label={`Storage (${ops.storage.map((s) => `${s.bucket}: ${s.objects} files`).join(', ') || 'empty'})`} used={storage} limit={LIMITS.storage} />
        <Bar label="Egress, last 30 days (estimate)" used={ops.egress.est_bytes} limit={LIMITS.egress} />
      </div>
      <p className="small muted" style={{ margin: '4px 0 12px' }}>Egress estimate: {ops.egress.plays_30d} plays and {ops.egress.downloads_30d} downloads of stored videos times the average file size. It is an upper bound (a partly watched or cached play costs less) and does not count the gallery, which ships with the site. The exact figure is only in the Supabase dashboard, Usage; a cap hit there stops every function and download.</p>
      <div className="small"><b>Last backup:</b> {ops.last_backup ? `${fmt(ops.last_backup.taken_at)} (${ops.last_backup.tables} tables, ${ops.last_backup.rows} rows)` : 'none recorded'}</div>
      {ops.llm.length > 0 && (
        <table className="small" style={{ marginTop: 12, width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ textAlign: 'left' }}><th>LLM calls by app</th><th>24 h</th><th>7 days</th><th>Tokens 24 h</th><th>Tokens 7 d</th></tr></thead>
          <tbody>{ops.llm.map((l) => <tr key={l.app}><td>{l.app}</td><td>{l.calls_24h}</td><td>{l.calls_7d}</td><td>{l.tokens_24h.toLocaleString()}</td><td>{l.tokens_7d.toLocaleString()}</td></tr>)}</tbody>
        </table>
      )}
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState(getToken());
  const [code, setCode] = useState('');
  const [showSign, setShowSign] = useState(false);
    const [err, setErr] = useState('');
  const [dash, setDash] = useState<Dash | null>(null);
  const [tab, setTab] = useState<'overview' | 'users' | 'orders' | 'jobs' | 'feedback' | 'events'>('overview');

  const signOut = () => {
    try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    setToken('');
    setDash(null);
    setCode('');
  };

  const load = useCallback(async () => {
    setErr('');
    try {
      // without a passcode the server answers a read-only preview (e-mail addresses masked); with one, the full dashboard
      setDash(await api('/functions/v1/explainer-admin', token ? { headers: { 'x-admin-token': token } } : undefined));
    } catch (e) {
      const x = e as Error & { status?: number };
      if (token && (x.status === 401 || x.status === 403)) signOut();
      setErr(x.message);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string) => {
    try {
      await api('/functions/v1/explainer-admin', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ op: 'order_status', id, status }) });
      setDash((d) => (d ? { ...d, orders: d.orders.map((o) => (o.id === id ? { ...o, status } : o)) } : d));
    } catch (x) { setErr((x as Error).message); }
  };

  const post = async (body: Record<string, unknown>) => {
    try {
      await api('/functions/v1/explainer-admin', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify(body) });
      await load();
    } catch (x) { setErr((x as Error).message); }
  };
  const grantCredits = (u: UserRow) => {
    const v = window.prompt(`Add credits to @${u.username} (negative to remove)`, '5');
    const n = Number(v);
    if (v && Number.isFinite(n) && n !== 0) post({ op: 'grant', username: u.username, amount: n, reason: 'admin grant' });
  };

  const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--line)', font: '600 12px var(--mono)', color: 'var(--muted)', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid var(--line)', fontSize: 13, verticalAlign: 'top' };
  const wrap: React.CSSProperties = { overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)' };

  return (
    <Shell>
      <section className="section" style={{ paddingTop: 36 }}>
        <h2 className="sec">Admin</h2>
        {!token && err && <p className="err">{err}</p>}

        {(token || dash) && (
          <>
            <div className="row between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <span className="small muted">{dash ? (dash.viewer ? 'View only, emails masked' : `Signed in as ${dash.me}`) : 'Loading...'}</span>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn ghost small" onClick={load}>Refresh</button>
                {token ? <button className="btn ghost small" onClick={signOut}>Sign out</button> : <button className="btn ghost small" onClick={() => setShowSign((v) => !v)}>{showSign ? 'Cancel' : 'Sign in to edit'}</button>}
              </div>
            </div>
            {!token && showSign && (
              <form className="card row" style={{ gap: 10, marginBottom: 16, alignItems: 'flex-end', flexWrap: 'wrap', maxWidth: 520 }} onSubmit={(e) => { e.preventDefault(); const v = code.trim(); if (!v) return; try { sessionStorage.setItem(TOKEN_KEY, v); } catch { /* ignore */ } setToken(v); }}>
                <label className="field" style={{ flex: 1, minWidth: 200 }}>Passcode<input type="password" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="current-password" autoFocus required /></label>
                <button className="btn primary small" type="submit">Unlock</button>
              </form>
            )}
            {err && <p className="err">{err}</p>}
            {dash && (
              <>
                <div className="row" style={{ gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {(['overview', 'users', 'orders', 'jobs', 'feedback', 'events'] as const).map((k) => (
                    <button key={k} className={`btn small ${tab === k ? 'primary' : 'ghost'}`} onClick={() => setTab(k)}>
                      {k === 'overview' ? 'Overview' : k === 'users' ? `Users (${dash.counts.users_total})` : k === 'orders' ? `Orders (${dash.counts.orders_waiting} waiting)` : k === 'jobs' ? 'Videos' : k === 'feedback' ? 'Feedback & contact' : 'Event log'}
                    </button>
                  ))}
                </div>

                {tab === 'overview' && (
                  <>
                    <OpsPanel ops={dash.ops} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                      {[
                        ['Videos made', dash.counts.jobs_total], ['Last 24 hours', dash.counts.jobs_24h], ['Last 7 days', dash.counts.jobs_7d], ['Failed', dash.counts.jobs_failed],
                        ...(dash.costs ? (dash.costs.priced_jobs ? [['Cost, all videos (est.)', usd(dash.costs.total_usd)], ['Cost, last 24 hours', usd(dash.costs.usd_24h)], ['Cost, last 7 days', usd(dash.costs.usd_7d)], ['Average per video', usd(dash.costs.avg_usd)]] : [['Cost, all videos (est.)', 'n/a yet'], ['Cost, last 24 hours', 'n/a yet'], ['Cost, last 7 days', 'n/a yet'], ['Average per video', 'n/a yet']]) : []),
                        ['Visitors (recent)', dash.counts.visitors], ['Members', dash.counts.users_total], ['Member videos', dash.counts.member_jobs], ['Orders', dash.counts.orders_total], ['Paid, to confirm', dash.counts.orders_waiting], ['Feedback + contact', dash.counts.feedback_total],
                      ].map(([k, v]) => (
                        <div key={String(k)} className="card" style={{ padding: 16 }}>
                          <div className="small muted">{k}</div>
                          <div style={{ font: '700 28px var(--display)' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {dash.costs && <p className="small muted" style={{ margin: '10px 0 0' }}>{dash.costs.note} Priced videos so far: {dash.costs.priced_jobs}.</p>}
                    {dash.ops && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginTop: 24 }}>
                        <BarChart title="Videos per day" unit="videos" data={dash.ops.jobs_daily.map((x) => ({ d: x.d, v: x.n }))} />
                        <BarChart title="LLM calls per day" unit="calls" data={dash.ops.llm_daily.map((x) => ({ d: x.d, v: x.calls }))} />
                      </div>
                    )}
                    <h3 style={{ font: '700 16px var(--display)', margin: '24px 0 10px' }}>Conversion funnel (last 30 days, unique visitors)</h3>
                    <div className="stack" style={{ gap: 8 }}>
                      {dash.funnel.map((f, i) => {
                        const top = Math.max(dash.funnel[0].n, 1);
                        const prev = i > 0 ? dash.funnel[i - 1].n : 0;
                        return (
                          <div key={f.step} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 150px', gap: 10, alignItems: 'center' }}>
                            <span className="small">{f.step}</span>
                            <div style={{ background: 'var(--soft, #eee)', borderRadius: 8, height: 18 }}><div style={{ width: `${Math.max(2, (f.n / top) * 100)}%`, height: '100%', background: 'var(--acc)', borderRadius: 8 }} /></div>
                            <span className="small mono">{f.n}{i > 0 && prev > 0 ? ` (${Math.round((f.n / prev) * 100)}%)` : ''}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="small muted" style={{ margin: '8px 0 0' }}>Visit to sign-up: {dash.funnel[0].n ? Math.round((dash.funnel[4].n / dash.funnel[0].n) * 100) : 0}% · sign-up to order: {dash.funnel[4].n ? Math.round((dash.funnel[5].n / dash.funnel[4].n) * 100) : 0}%</p>
                  </>
                )}

                {tab === 'users' && (
                  <div style={wrap}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr>{['Joined', 'Username', 'Credits', 'Videos', 'Last login', 'Last video', ''].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {dash.users.length === 0 && <tr><td style={td} colSpan={7}>No members yet.</td></tr>}
                        {dash.users.map((u) => (
                          <tr key={u.id}>
                            <td style={td}>{fmt(u.created_at)}</td>
                            <td style={td}><b>@{u.username}</b>{u.banned ? ' (disabled)' : ''}</td>
                            <td style={td}>{u.credits}</td>
                            <td style={td}>{u.jobs}</td>
                            <td style={td}>{fmt(u.last_login)}</td>
                            <td style={td}>{fmt(u.last_job)}</td>
                            <td style={td}>
                              {!dash.viewer && (<><button className="btn ghost small" onClick={() => grantCredits(u)}>Credits</button>{' '}
                              <button className="btn ghost small" onClick={() => post({ op: 'ban', username: u.username, banned: !u.banned })}>{u.banned ? 'Enable' : 'Disable'}</button></>)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {tab === 'events' && (
                  <>
                    <p className="small muted">30-day totals: {Object.entries(dash.byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}</p>
                    <div style={wrap}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr>{['Time', 'Who', 'Event', 'Details'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                        <tbody>
                          {dash.events.map((e) => (
                            <tr key={e.id}>
                              <td style={td}>{fmt(e.created_at)}</td>
                              <td style={td} className="mono">{e.user_id ? 'member' : 'guest'} {e.actor}</td>
                              <td style={td}>{e.type}</td>
                              <td style={{ ...td, wordBreak: 'break-all' }}>{Object.entries(e.meta ?? {}).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${k}=${String(v)}`).join(' ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <h3 style={{ font: '700 16px var(--display)', margin: '24px 0 10px' }}>Credit log</h3>
                    <div style={wrap}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr>{['Time', 'Member', 'Change', 'Reason'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                        <tbody>
                          {dash.credits.map((c) => (
                            <tr key={c.id}><td style={td}>{fmt(c.created_at)}</td><td style={td}>@{dash.users.find((u) => u.id === c.user_id)?.username ?? c.user_id.slice(0, 8)}</td><td style={td}><b>{c.delta > 0 ? `+${c.delta}` : c.delta}</b></td><td style={td}>{c.reason}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {tab === 'orders' && (
                  <div style={wrap}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr>{['Created', 'Order', 'Email', 'Paper', 'Lang', 'Paid via', 'Status'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {dash.orders.length === 0 && <tr><td style={td} colSpan={7}>No orders yet.</td></tr>}
                        {dash.orders.map((o) => (
                          <tr key={o.id}>
                            <td style={td}>{fmt(o.created_at)}</td>
                            <td style={td} className="mono">{o.id.slice(0, 8)}</td>
                            <td style={td}>{o.email}</td>
                            <td style={{ ...td, maxWidth: 240, wordBreak: 'break-all' }}>{o.arxiv}{o.notes ? <div className="small muted">{o.notes}</div> : null}</td>
                            <td style={td}>{o.language}</td>
                            <td style={td}>{o.pay_method || '-'}{o.paid_at ? <div className="small muted">{fmt(o.paid_at)}</div> : null}</td>
                            <td style={td}>
                              <select value={o.status} disabled={!!dash.viewer} onChange={(e) => setStatus(o.id, e.target.value)}>
                                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {tab === 'jobs' && (
                  <div style={wrap}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr>{['Time', 'Visitor', 'Paper', 'Status', 'Length', 'Cost (est.)', 'Model', 'Voice', 'Error'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {dash.jobs.map((j) => (
                          <tr key={j.id}>
                            <td style={td}>{fmt(j.created_at)}</td>
                            <td style={td} className="mono">{j.visitor}</td>
                            <td style={{ ...td, maxWidth: 260, wordBreak: 'break-all' }}>{j.title || j.source_url || j.arxiv}</td>
                            <td style={td}>{j.status}</td>
                            <td style={td}>{j.seconds ? `${Math.round(j.seconds / 60)} min` : ''}</td>
                            <td style={td} title={j.usage?.by_model ? Object.entries(j.usage.by_model).map(([m, v]) => `${m}: ${v.calls} calls, ${usd(v.usd)}`).join(' | ') : ''}>{usd(j.cost_usd)}</td>
                            <td style={td}>{j.model || ''}</td>
                            <td style={td}>{j.voice || ''}</td>
                            <td style={{ ...td, maxWidth: 220 }}>{j.error || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {tab === 'feedback' && (
                  <div style={wrap}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr>{['Time', 'Rating', 'Kind', 'Comment', 'Email', 'Paper'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {dash.feedback.length === 0 && <tr><td style={td} colSpan={6}>No feedback yet.</td></tr>}
                        {dash.feedback.map((f) => (
                          <tr key={f.id}>
                            <td style={td}>{fmt(f.created_at)}</td>
                            <td style={td}>{f.rating ?? ''}</td>
                            <td style={td}>{f.kind}{f.use_case ? ` / ${f.use_case}` : ''}</td>
                            <td style={{ ...td, maxWidth: 320 }}>{f.comment}</td>
                            <td style={td}>{f.email}</td>
                            <td style={{ ...td, wordBreak: 'break-all' }}>{f.arxiv}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>
    </Shell>
  );
}
