import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Shell from '@/components/Shell';

const SB = 'https://vzvyghmtsakixlhzzuol.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dnlnaG10c2FraXhsaHp6dW9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNjAwOTUsImV4cCI6MjEwNzYzNjA5NX0.MLAObQILObssDhjGxVXnKG0naYUWTQD8qsetfGw7HbI'; // public client key: it only lets people ask for a sign-in code
const TOKEN_KEY = 'pe-admin-token';
const STATUSES = ['new', 'paid_claimed', 'paid', 'delivered', 'cancelled'] as const;

type Job = { id: string; created_at: string; arxiv: string | null; source_url: string | null; title: string | null; status: string; model: string | null; voice: string | null; visitor: string; error: string | null };
type Order = { id: string; created_at: string; email: string; arxiv: string; language: string; notes: string; status: string; pay_method: string | null; paid_at: string | null };
type Feedback = { id: string; created_at: string; rating: number | null; use_case: string; comment: string; email: string; arxiv: string; kind: string };
type Dash = {
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
const fmt = (s: string | null) => (s ? new Date(s).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '');

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${SB}${path}`, init);
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(String(out?.error ?? out?.msg ?? out?.error_description ?? `HTTP ${res.status}`)), { status: res.status });
  return out;
}

export default function Admin() {
  const [token, setToken] = useState(getToken());
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [dash, setDash] = useState<Dash | null>(null);
  const [tab, setTab] = useState<'overview' | 'orders' | 'jobs' | 'feedback'>('overview');

  const signOut = () => {
    try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    setToken('');
    setDash(null);
    setCodeSent(false);
    setCode('');
  };

  const load = useCallback(async () => {
    if (!token) return;
    setErr('');
    try {
      setDash(await api('/functions/v1/explainer-admin', { headers: { Authorization: `Bearer ${token}` } }));
    } catch (e) {
      const x = e as Error & { status?: number };
      if (x.status === 401) signOut();
      setErr(x.message);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const sendCode = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await api('/auth/v1/otp', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANON }, body: JSON.stringify({ email: email.trim(), create_user: true }) });
      setCodeSent(true);
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const out = await api('/auth/v1/verify', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANON }, body: JSON.stringify({ type: 'email', email: email.trim(), token: code.trim() }) });
      try { sessionStorage.setItem(TOKEN_KEY, out.access_token); } catch { /* ignore */ }
      setToken(out.access_token);
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };

  const setStatus = async (id: string, status: string) => {
    try {
      await api('/functions/v1/explainer-admin', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ op: 'order_status', id, status }) });
      setDash((d) => (d ? { ...d, orders: d.orders.map((o) => (o.id === id ? { ...o, status } : o)) } : d));
    } catch (x) { setErr((x as Error).message); }
  };

  const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--line)', font: '600 12px var(--mono)', color: 'var(--muted)', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '8px 10px', borderBottom: '1px solid var(--line)', fontSize: 13, verticalAlign: 'top' };
  const wrap: React.CSSProperties = { overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)' };

  return (
    <Shell>
      <section className="section" style={{ paddingTop: 36 }}>
        <h2 className="sec">Admin</h2>
        {!token && (
          <div className="card" style={{ maxWidth: 440 }}>
            {!codeSent ? (
              <form className="stack" onSubmit={sendCode}>
                <p className="small muted" style={{ margin: 0 }}>Sign in with the email code. Only the owner account can see the data.</p>
                <label className="field">Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
                <button className="btn primary" type="submit" disabled={busy}>{busy ? <span className="spin" aria-hidden /> : null}Send code</button>
              </form>
            ) : (
              <form className="stack" onSubmit={verify}>
                <p className="small muted" style={{ margin: 0 }}>We emailed a code to {email}. Paste it here.</p>
                <label className="field">Code<input type="text" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" required /></label>
                <div className="row">
                  <button className="btn primary" type="submit" disabled={busy}>{busy ? <span className="spin" aria-hidden /> : null}Sign in</button>
                  <button className="btn ghost" type="button" onClick={() => setCodeSent(false)}>Back</button>
                </div>
              </form>
            )}
            {err && <p className="err">{err}</p>}
          </div>
        )}

        {token && (
          <>
            <div className="row between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <span className="small muted">{dash ? `Signed in as ${dash.me}` : 'Loading...'}</span>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn ghost small" onClick={load}>Refresh</button>
                <button className="btn ghost small" onClick={signOut}>Sign out</button>
              </div>
            </div>
            {err && <p className="err">{err}</p>}
            {dash && (
              <>
                <div className="row" style={{ gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {(['overview', 'orders', 'jobs', 'feedback'] as const).map((k) => (
                    <button key={k} className={`btn small ${tab === k ? 'primary' : 'ghost'}`} onClick={() => setTab(k)}>
                      {k === 'overview' ? 'Overview' : k === 'orders' ? `Orders (${dash.counts.orders_waiting} waiting)` : k === 'jobs' ? 'Usage log' : 'Feedback'}
                    </button>
                  ))}
                </div>

                {tab === 'overview' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                      {[
                        ['Videos made', dash.counts.jobs_total], ['Last 24 hours', dash.counts.jobs_24h], ['Last 7 days', dash.counts.jobs_7d], ['Failed', dash.counts.jobs_failed],
                        ['Visitors (recent)', dash.counts.visitors], ['Orders', dash.counts.orders_total], ['Paid, to confirm', dash.counts.orders_waiting], ['Feedback', dash.counts.feedback_total],
                      ].map(([k, v]) => (
                        <div key={String(k)} className="card" style={{ padding: 16 }}>
                          <div className="small muted">{k}</div>
                          <div style={{ font: '700 28px var(--display)' }}>{v}</div>
                        </div>
                      ))}
                    </div>
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
                              <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
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
                      <thead><tr>{['Time', 'Visitor', 'Paper', 'Status', 'Model', 'Voice', 'Error'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {dash.jobs.map((j) => (
                          <tr key={j.id}>
                            <td style={td}>{fmt(j.created_at)}</td>
                            <td style={td} className="mono">{j.visitor}</td>
                            <td style={{ ...td, maxWidth: 260, wordBreak: 'break-all' }}>{j.title || j.source_url || j.arxiv}</td>
                            <td style={td}>{j.status}</td>
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
