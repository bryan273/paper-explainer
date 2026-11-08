import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Shell from '@/components/Shell';
import StudentTrial from '@/components/StudentTrial';
import PayPanel from '@/components/PayPanel';
import { accountApi, accountGet, track, useAccount, useAcctText, type Pack } from '@/lib/account';
import { usePrefs } from '@/lib/prefs';

type MySection = { poster?: string | null };
type MyJob = { id: string; arxiv: string; title: string | null; status: string; stage: string | null; seconds: number | null; created_at: string; expired_at?: string | null; sections?: MySection[] | null; style?: string | null };
type Ledger = { created_at: string; delta: number; reason: string };

const L = {
  en: {
    title: 'Dashboard', videos: 'Your videos', hello: 'Signed in as', free: 'Free videos today', credits: 'Credits', made: 'Papers explained', left: '{n} left of {m}', empty: 'No papers yet.', first: 'Explain your first paper',
    open: 'Open', ask: 'Ask', ready: 'Ready', making: 'Making', failed: 'Failed', expired: 'Expired', min: '{n} min', more: 'Need more videos?', moreSub: 'From ¥2.6 a video. Credits never expire, and a failed video is refunded. A plan is cheaper: 100 videos for ¥33 a month.',
    history: 'Credit history', show: 'Show', hide: 'Hide', security: 'Password', admin: 'Admin console', make: 'Explain a paper', soon: 'Videos are kept for 14 days (90 days on Plus, a year on Pro). Until then you can reopen them and keep asking.', makeAgain: 'Make it again',
  },
  zh: {
    title: '我的看板', videos: '你的视频', hello: '当前账户', free: '今日免费视频', credits: '额度', made: '已解读论文', left: '剩余 {n} / {m}', empty: '还没有论文。', first: '解读你的第一篇论文',
    open: '打开', ask: '提问', ready: '已完成', making: '生成中', failed: '失败', expired: '已过期', min: '{n} 分钟', more: '需要更多视频？', moreSub: '每个视频低至 ¥2.6。额度永不过期，失败的视频会自动退还。套餐更划算：每月 ¥33 含 100 个视频。',
    history: '额度记录', show: '展开', hide: '收起', security: '密码', admin: '管理后台', make: '解读一篇论文', soon: '视频保留 14 天，之后删除。', makeAgain: '重新生成',
  },
} as const;

const fmtDate = (s: string, lang: string) => new Date(s).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** A signed-in member's home: how many videos are left, every paper they explained, and the credit pack. */
export default function Account() {
  const { user, quota, me, openAuth, refresh } = useAccount();
  const { lang } = usePrefs();
  const l = L[lang === 'zh' ? 'zh' : 'en'];
  const a = useAcctText();
  const [jobs, setJobs] = useState<MyJob[] | null>(null);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [order, setOrder] = useState<{ id: string; price: number; credits: number } | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ old: '', next: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [showLedger, setShowLedger] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setJobs(await accountGet('jobs=1'));
      setLedger(await accountGet('ledger=1'));
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [user]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (location.hash === '#buy') document.getElementById('buy')?.scrollIntoView();
  }, [user]);

  const buy = async (pack: string) => {
    setBusy(true);
    setErr('');
    try {
      track('click_buy');
      setOrder(await accountApi('buy', { pack }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const changePw = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg('');
    setErr('');
    try {
      const out = await accountApi('password', { old: pw.old, password: pw.next });
      try {
        localStorage.setItem('pe-session', out.token);
      } catch {
        /* ignore */
      }
      setPw({ old: '', next: '' });
      setPwMsg(a('pwDone'));
      refresh();
    } catch (x) {
      setErr((x as Error).message);
    }
  };

  const packs = Object.entries(me?.packs ?? {}) as [string, Pack][];
  const done = (jobs ?? []).filter((j) => j.status === 'done').length;
  const pct = quota && quota.day_limit ? Math.round((quota.day_left / quota.day_limit) * 100) : 0;

  return (
    <Shell>
      <section className="section acct" style={{ paddingTop: 4 }}>
        {!user ? (
          <div className="card stack" style={{ maxWidth: 460 }}>
            <h2 className="sec" style={{ margin: 0 }}>{l.title}</h2>
            <p style={{ margin: 0 }}>{a('loginFirst')}</p>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn primary" onClick={() => openAuth('login')}>{a('logIn')}</button>
              <button className="btn ghost" onClick={() => openAuth('register')}>{a('signUp')}</button>
            </div>
          </div>
        ) : (
          <div className="stack" style={{ gap: 26 }}>
            <div className="row between" style={{ flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
              <div>
                <h2 className="sec" style={{ margin: 0 }}>{l.title}</h2>
                <p className="small muted" style={{ margin: '4px 0 0' }}>{l.hello} {user.username}</p>
              </div>
              <div className="row" style={{ gap: 8 }}>
                {me?.admin && <a className="btn ghost small" href="/repro-suite/hub/console">{l.admin}</a>}
                <Link className="btn primary small" to="/#make">{l.make}</Link>
              </div>
            </div>

            {err && <p className="err" role="alert">{err}</p>}

            <div className="acct-plan">
              {(() => {
                const m = me as unknown as { plan?: string | null; plan_until?: string | null } | null;
                const days = m?.plan_until ? Math.ceil((new Date(m.plan_until).getTime() - Date.now()) / 86400000) : 0;
                return m?.plan && days > 0 ? (
                  <>
                    <div><span className="small muted">{lang === 'zh' ? '当前套餐' : 'Your plan'}</span><b>{m.plan === 'pro' ? 'Pro' : 'Plus'}</b></div>
                    <div><span className="small muted">{lang === 'zh' ? '剩余' : 'Time left'}</span><b className={days <= 7 ? 'warn' : ''}>{days} {lang === 'zh' ? '天' : days === 1 ? 'day' : 'days'}</b><span className="small muted">{lang === 'zh' ? '到期日' : 'due'} {new Date(m.plan_until!).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                    <Link className="btn ghost small" to="/#pricing">{lang === 'zh' ? '续订' : 'Renew'}</Link>
                  </>
                ) : (
                  <>
                    <div><span className="small muted">{lang === 'zh' ? '当前套餐' : 'Your plan'}</span><b>{lang === 'zh' ? '免费' : 'Free'}</b></div>
                    <div><span className="small muted">{lang === 'zh' ? 'Plus 每月 ¥33，含 100 个视频' : 'Plus: 100 videos for ¥33 a month'}</span></div>
                    <Link className="btn primary small" to="/#pricing">{lang === 'zh' ? '升级' : 'Upgrade'}</Link>
                  </>
                );
              })()}
            </div>

            <StudentTrial />

            <div className="acct-tools">
              <a href="https://bryan273.github.io/repro-suite/repro/index.html"><b>{lang === 'zh' ? '复现' : 'Reproductions'}</b><span>{lang === 'zh' ? '查看你运行过的复现' : 'See the runs you started'}</span></a>
              <a href="https://bryan273.github.io/repro-suite/reading/"><b>{lang === 'zh' ? '阅读' : 'Reading'}</b><span>{lang === 'zh' ? '继续阅读你的论文' : 'Continue your papers'}</span></a>
              <button type="button" onClick={() => window.dispatchEvent(new Event('pe-open-settings'))}><b>{lang === 'zh' ? '设置与个性化' : 'Settings and mode'}</b><span>{lang === 'zh' ? '模式、水平、领域' : 'Mode, level, field'}</span></button>
            </div>

            <div className="acct-stats">
              <div className="acct-stat">
                <span className="small muted">{l.free}</span>
                <b>{quota?.day_left ?? 0}<small> / {quota?.day_limit ?? 0}</small></b>
                <span className="acct-meter" aria-hidden><i style={{ width: `${pct}%` }} /></span>
                <span className="small muted">{l.left.replace('{n}', String(quota?.day_left ?? 0)).replace('{m}', String(quota?.day_limit ?? 0))}</span>
              </div>
              <div className="acct-stat">
                <span className="small muted">{l.credits}</span>
                <b>{me?.admin ? (lang === 'zh' ? '无限' : 'Unlimited') : user.credits}</b>
                <a className="small" href="#buy">{l.more}</a>
              </div>
              <div className="acct-stat">
                <span className="small muted">{l.made}</span>
                <b>{jobs === null ? '…' : done}</b>
                <span className="small muted">{l.soon}</span>
              </div>
            </div>

            <div>
              <h3 className="acct-h">{l.videos}</h3>
              {jobs === null ? (
                <p className="small muted"><span className="spin" aria-hidden /> …</p>
              ) : jobs.length === 0 ? (
                <div className="card" style={{ margin: 0, textAlign: 'center', padding: 32 }}>
                  <p style={{ margin: '0 0 14px' }}>{l.empty}</p>
                  <Link className="btn primary" to="/#make">{l.first}</Link>
                </div>
              ) : (
                <div className="acct-grid">
                  {jobs.map((j) => {
                    const poster = j.sections?.find((s) => s.poster)?.poster ?? null;
                    const expired = j.status === 'done' && !!j.expired_at;
                    const state = expired ? 'expired' : j.status === 'done' ? 'ready' : j.status === 'failed' ? 'failed' : 'making';
                    const href = `/?job=${j.id}#make`;
                    return (
                      <article key={j.id} className={`acct-card ${state}`}>
                        <div className="acct-thumb">
                          {poster ? <img src={poster} alt="" loading="lazy" /> : <span aria-hidden>{(j.title || j.arxiv).slice(0, 1).toUpperCase()}</span>}
                          <span className={`acct-chip ${state}`}>{l[state as 'ready' | 'making' | 'failed' | 'expired']}</span>
                        </div>
                        <div className="acct-body">
                          <b className="acct-t">{j.title || j.arxiv}</b>
                          <span className="small muted">{fmtDate(j.created_at, lang)} · {l.min.replace('{n}', String(Math.max(1, Math.round((j.seconds ?? 60) / 60))))}</span>
                          <div className="row" style={{ gap: 8, marginTop: 10 }}>
                            {state === 'ready' || state === 'making' ? <Link className="btn primary small" to={href}>{l.open}</Link> : null}
                            {state === 'expired' || state === 'failed' ? <Link className="btn ghost small" to={href}>{l.makeAgain}</Link> : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <div id="buy" className="acct-buy">
              <div>
                <h3 className="acct-h" style={{ margin: 0 }}>{l.more}</h3>
                <p className="small muted" style={{ margin: '4px 0 0' }}>{l.moreSub}</p>
              </div>
              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                {packs.map(([k, p]) => (
                  <button key={k} type="button" className="btn primary" disabled={busy} onClick={() => buy(k)}>
                    {a('pack', { c: p.credits })} · {a('packPrice', { p: p.price })}
                  </button>
                ))}
              </div>
              {order && (
                <div className="card" style={{ marginTop: 14, flexBasis: '100%' }}>
                  <PayPanel orderId={order.id} price={`¥${order.price}`} intro={a('orderMade', { id: order.id.slice(0, 8) })} onClose={() => { setOrder(null); load(); }} />
                </div>
              )}
            </div>

            <div>
              <div className="row between">
                <h3 className="acct-h" style={{ margin: 0 }}>{l.history}</h3>
                <button type="button" className="linkbtn small" onClick={() => setShowLedger((v) => !v)}>{showLedger ? l.hide : l.show}</button>
              </div>
              {showLedger &&
                (ledger.length === 0 ? (
                  <p className="small muted">{a('noHistory')}</p>
                ) : (
                  <div className="card" style={{ margin: '10px 0 0', padding: 0, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {ledger.map((x, i) => (
                          <tr key={i}>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>{fmtDate(x.created_at, lang)}</td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--line)', fontSize: 13, color: x.delta > 0 ? 'var(--ok)' : undefined }}><b>{x.delta > 0 ? `+${x.delta}` : x.delta}</b></td>
                            <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>{x.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
            </div>

            <div>
              <div className="row between">
                <h3 className="acct-h" style={{ margin: 0 }}>{l.security}</h3>
                <button type="button" className="linkbtn small" onClick={() => setShowPw((v) => !v)}>{showPw ? l.hide : l.show}</button>
              </div>
              {showPw && (
                <form className="card stack" onSubmit={changePw} style={{ maxWidth: 400, margin: '10px 0 0' }}>
                  <label className="field">{a('oldPw')}<input type="password" autoComplete="current-password" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} required /></label>
                  <label className="field">{a('newPw')}<input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></label>
                  {pwMsg && <p className="small" style={{ margin: 0, color: 'var(--ok)' }}>{pwMsg}</p>}
                  <button className="btn ghost small" type="submit">{a('save')}</button>
                </form>
              )}
            </div>
          </div>
        )}
      </section>
    </Shell>
  );
}
