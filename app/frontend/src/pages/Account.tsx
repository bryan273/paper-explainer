import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Shell from '@/components/Shell';
import PayPanel from '@/components/PayPanel';
import { accountApi, accountGet, track, useAccount, useAcctText, type Pack } from '@/lib/account';

type MyJob = { id: string; arxiv: string; title: string | null; status: string; stage: string | null; seconds: number | null; created_at: string };
type Ledger = { created_at: string; delta: number; reason: string };
const fmt = (s: string) => new Date(s).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });

export default function Account() {
  const { user, quota, me, openAuth, refresh } = useAccount();
  const a = useAcctText();
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [order, setOrder] = useState<{ id: string; price: number; credits: number } | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ old: '', next: '' });
  const [pwMsg, setPwMsg] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setJobs(await accountGet('jobs=1'));
      setLedger(await accountGet('ledger=1'));
    } catch (e) { setErr((e as Error).message); }
  }, [user]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (location.hash === '#buy') document.getElementById('buy')?.scrollIntoView(); }, [user]);

  const buy = async (pack: string) => {
    setBusy(true); setErr('');
    try { track('click_buy'); setOrder(await accountApi('buy', { pack })); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  const changePw = async (e: FormEvent) => {
    e.preventDefault(); setPwMsg(''); setErr('');
    try {
      const out = await accountApi('password', { old: pw.old, password: pw.next });
      try { localStorage.setItem('pe-session', out.token); } catch { /* ignore */ }
      setPw({ old: '', next: '' }); setPwMsg(a('pwDone')); refresh();
    } catch (x) { setErr((x as Error).message); }
  };

  return (
    <Shell>
      <section className="section" style={{ paddingTop: 36 }}>
        <h2 className="sec">{a('acctTitle')}</h2>
        {!user ? (
          <div className="card stack" style={{ maxWidth: 440 }}>
            <p style={{ margin: 0 }}>{a('loginFirst')}</p>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn primary" onClick={() => openAuth('login')}>{a('logIn')}</button>
              <button className="btn ghost" onClick={() => openAuth('register')}>{a('signUp')}</button>
            </div>
          </div>
        ) : (
          <div className="stack" style={{ gap: 22 }}>
            {err && <p className="err" role="alert">{err}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
              <div className="card" style={{ margin: 0 }}><div className="small muted">{a('freeToday')}</div><div style={{ font: '700 30px var(--display)' }}>{quota?.day_left ?? 0} / {quota?.day_limit ?? 0}</div></div>
              <div className="card" style={{ margin: 0 }}><div className="small muted">{a('credits')}</div><div style={{ font: '700 30px var(--display)' }}>{user.credits}</div><div className="small muted">{a('creditsNote')}</div></div>
              <div className="card" style={{ margin: 0 }}><div className="small muted">{a('username')}</div><div style={{ font: '700 22px var(--display)' }}>{user.username}</div></div>
            </div>

            <div id="buy">
              <h3 style={{ font: '700 18px var(--display)', margin: '0 0 10px' }}>{a('buyCredits')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                {Object.entries(me?.packs ?? {}).map(([k, p]: [string, Pack]) => (
                  <div key={k} className="card stack" style={{ margin: 0, gap: 6 }}>
                    <b style={{ font: '700 17px var(--display)' }}>{a('pack', { c: p.credits })}</b>
                    <div style={{ font: '700 26px var(--display)' }}>{a('packPrice', { p: p.price })}</div>
                    <div className="small muted">{a('packEach', { e: (p.price / p.credits).toFixed(2) })}</div>
                    <button className="btn primary small" disabled={busy} onClick={() => buy(k)}>{a('pay')}</button>
                  </div>
                ))}
              </div>
              {order && (
                <div className="card" style={{ marginTop: 14 }}>
                  <PayPanel orderId={order.id} price={`¥${order.price}`} intro={a('orderMade', { id: order.id.slice(0, 8) })} onClose={() => { setOrder(null); load(); }} />
                </div>
              )}
            </div>

            <div>
              <h3 style={{ font: '700 18px var(--display)', margin: '0 0 10px' }}>{a('videos')}</h3>
              {jobs.length === 0 ? <p className="small muted">{a('noVideos')}</p> : (
                <div className="stack" style={{ gap: 8 }}>
                  {jobs.map((j) => (
                    <div key={j.id} className="card row between" style={{ margin: 0, padding: '10px 14px', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ flex: 1, minWidth: 180 }}><b className="small">{j.title || j.arxiv}</b><br /><span className="small muted">{fmt(j.created_at)} · {Math.max(1, Math.round((j.seconds ?? 60) / 60))} min</span></span>
                      {j.status === 'done' ? <Link className="btn ghost small" to={`/?paper=${encodeURIComponent(j.arxiv)}#make`}>{a('open')}</Link> : <span className="small muted">{j.status === 'failed' ? a('failed') : a('making')}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 style={{ font: '700 18px var(--display)', margin: '0 0 10px' }}>{a('history')}</h3>
              {ledger.length === 0 ? <p className="small muted">{a('noHistory')}</p> : (
                <div className="card" style={{ margin: 0, padding: 0, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {ledger.map((l, i) => (
                        <tr key={i}>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>{fmt(l.created_at)}</td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--line)', fontSize: 13, color: l.delta > 0 ? 'var(--ok, #1a8f4c)' : undefined }}><b>{l.delta > 0 ? `+${l.delta}` : l.delta}</b></td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>{l.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <form className="card stack" onSubmit={changePw} style={{ maxWidth: 400, margin: 0 }}>
              <h3 style={{ font: '700 16px var(--display)', margin: 0 }}>{a('changePw')}</h3>
              <label className="field">{a('oldPw')}<input type="password" autoComplete="current-password" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} required /></label>
              <label className="field">{a('newPw')}<input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></label>
              {pwMsg && <p className="small" style={{ margin: 0, color: 'var(--ok, #1a8f4c)' }}>{pwMsg}</p>}
              <button className="btn ghost small" type="submit">{a('save')}</button>
            </form>
          </div>
        )}
      </section>
    </Shell>
  );
}
