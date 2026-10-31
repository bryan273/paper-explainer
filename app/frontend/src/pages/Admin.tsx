import { useCallback, useEffect, useState } from 'react';
import Shell from '@/components/Shell';

const SB = 'https://vzvyghmtsakixlhzzuol.supabase.co';
const TOKEN_KEY = 'pe-admin-token';
const STATUSES = ['new', 'paid_claimed', 'paid', 'delivered', 'cancelled'] as const;

type Job = { id: string; created_at: string; arxiv: string | null; source_url: string | null; title: string | null; status: string; model: string | null; voice: string | null; visitor: string; error: string | null; seconds?: number | null; cost_usd?: number | null; usage?: { calls?: number; estimated_calls?: number; by_model?: Record<string, { calls: number; usd: number }> } | null };
type Order = { id: string; created_at: string; email: string; arxiv: string; language: string; notes: string; status: string; pay_method: string | null; paid_at: string | null };
type Feedback = { id: string; created_at: string; rating: number | null; use_case: string; comment: string; email: string; arxiv: string; kind: string };
type UserRow = { id: string; username: string; credits: number; banned: boolean; created_at: string; last_login: string | null; jobs: number; last_job: string | null };
type EventRow = { id: number; created_at: string; actor: string; user_id: string | null; type: string; meta: Record<string, unknown> };
type CreditRow = { id: number; created_at: string; user_id: string; delta: number; reason: string };
type Costs = { total_usd: number; usd_24h: number; usd_7d: number; priced_jobs: number; avg_usd: number; note: string };
type Dash = {
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
const usd = (n: number | null | undefined) => (n === null || n === undefined ? '' : `$${Number(n).toFixed(Number(n) < 1 ? 3 : 2)}`);
const fmt = (s: string | null) => (s ? new Date(s).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '');

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${SB}${path}`, init);
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(String(out?.error ?? out?.msg ?? out?.error_description ?? `HTTP ${res.status}`)), { status: res.status });
  return out;
}

export default function Admin() {
  const [token, setToken] = useState(getToken());
  const [code, setCode] = useState('');
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
        {!token && (
          <details className="card" style={{ maxWidth: 440, marginBottom: 16 }}>
            <summary className="small" style={{ cursor: 'pointer' }}>Read-only preview. Enter the passcode to change things.</summary>
            <form className="stack" style={{ marginTop: 12 }} onSubmit={(e) => { e.preventDefault(); const v = code.trim(); if (!v) return; try { sessionStorage.setItem(TOKEN_KEY, v); } catch { /* ignore */ } setToken(v); }}>
              <label className="field">Passcode<input type="password" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="current-password" required /></label>
              <button className="btn primary" type="submit">Unlock changes</button>
            </form>
          </details>
        )}
        {!token && err && <p className="err">{err}</p>}

        {(token || dash) && (
          <>
            <div className="row between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <span className="small muted">{dash ? (dash.viewer ? 'Read-only preview (emails masked)' : `Signed in as ${dash.me}`) : 'Loading...'}</span>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn ghost small" onClick={load}>Refresh</button>
                {token && <button className="btn ghost small" onClick={signOut}>Sign out</button>}
              </div>
            </div>
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
                    <h3 style={{ font: '700 16px var(--display)', margin: '24px 0 10px' }}>Videos per day</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
                      {dash.perDay.map((d) => {
                        const max = Math.max(...dash.perDay.map((x) => x.n), 1);
                        return (
                          <div key={d.date} title={`${d.date}: ${d.n}`} style={{ flex: 1, display: 'grid', gap: 4, justifyItems: 'center' }}>
                            <div style={{ width: '100%', maxWidth: 28, height: Math.max(4, (d.n / max) * 90), background: 'var(--acc)', borderRadius: 6 }} />
                            <span className="small muted" style={{ fontSize: 10 }}>{d.date.slice(5)}</span>
                          </div>
                        );
                      })}
                    </div>
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
