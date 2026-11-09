import { AdminPricing } from './AdminPricing';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount } from '@/lib/account';
import { BarChart, Gauge, HBars, Kpi, LineChart, compact } from './AdminCharts';

const SB = 'https://wzdkroxbfrlqijbeiwpk.supabase.co/functions/v1';
const THEME_KEY = 'repro.theme2';
const LANG_KEY = 'rs-lang';

type Day = { d: string; signups: number; visitors: number; videos: number; failed: number; checks: number; income: number; cost: number; tokens: number; calls: number; asks?: number };
type FeatureCost = { n: number; total: number; each: number | null; tokens: number | null };
type Costs = { video_per_minute: number | null; videos: number; video_total: number; quick: FeatureCost; deep: FeatureCost; quiz: FeatureCost; research: { n: number; tokens: number; each: number | null }; edits: number; prices: { fast: { in: number; out: number }; deep: { in: number; out: number } } };
type Member = { id: string; email: string; handle: string | null; country: string; credits: number; banned: boolean; created_at: string; last_login: string | null; jobs: number; plan: string | null; plan_until: string | null; plan_source: string | null };
type OrderRow = { id: string; email: string; what: string; status: string; method: string | null; created_at: string; cny: number; cur: string; amt: number; kind: string; shot: boolean };
type JobRow = { id: string; arxiv: string | null; title: string | null; status: string; stage: string | null; seconds: number | null; langs: string | null; cost_usd: number | null; error: string | null; created_at: string };
type ReproRow = { id: string; arxiv_id: string | null; title: string | null; status: string; verdict: string | null; agent: string | null; model: string | null; created_at: string };
type Data = {
  me: string; view?: 'qa' | 'real'; hidden_test_accounts?: number; hours?: Day[]; costs?: Costs; generated_at: string; usd_cny: number; days: Day[]; members: Member[]; active_plans: number; orders: OrderRow[]; jobs: JobRow[]; job_langs: { d: string; l: string | null; s: string }[]; repro: ReproRow[];
  signup_rows: { d: string; c: string; ip: string; l: string; s: string; r: string }[]; visit_country: { d: string; c: string; n: number }[]; llm: { d: string; app: string; calls: number; tokens: number }[];
  feedback: { id: string; rating: number | null; comment: string | null; kind: string | null; arxiv: string | null; created_at: string }[]; asks_7d: number; visits_7d: number; rkapi: Record<string, unknown>;
};
type Ops = {
  db_bytes?: number; storage?: { bucket: string; objects: number; bytes: number }[]; r2?: { taken_at: string; bytes: number; objects: number } | null; r2_daily?: { d: string; bytes: number }[];
  egress?: { plays_30d: number; downloads_30d: number; est_bytes: number }; stuck_jobs?: number; expired_jobs?: number; last_backup?: { taken_at: string; tables: number; rows: number; source: string } | null;
};
type Proof = { id: string | number; username: string; created_at: string; role: string; school: string; status: string };
type SuiteRel = { v: string; at: string; title: string; notes: string[] };
type Pr = { n: number; title: string; at: string; url: string; bullets: string[]; repo: string };

const token = () => { try { return localStorage.getItem('pe-session') || ''; } catch { return ''; } };
const fmt = (s: string | null) => (s ? new Date(s).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '');
const fmtD = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
const yuan = (n: number) => `¥${(Math.round(n * 100) / 100).toLocaleString('en-GB')}`;
const bytes = (n: number) => (n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(2)} GB` : n >= 1024 ** 2 ? `${(n / 1024 ** 2).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);
const ago = (iso: string) => { const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000)); return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
const country = (c: string) => { if (!c || c === '??') return 'Unknown'; try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(c) ?? c; } catch { return c; } };
const flag = (c: string) => (c && c.length === 2 && c !== '??' ? String.fromCodePoint(...[...c.toUpperCase()].map((x) => 127397 + x.charCodeAt(0))) + ' ' : '');
const iso10 = (d: Date) => d.toISOString().slice(0, 10);
const LANGN: Record<string, string> = { en: 'English', zh: 'Chinese', vi: 'Vietnamese', id: 'Indonesian', both: 'English + Chinese' };

async function call(fn: string, init?: RequestInit) {
  const res = await fetch(`${SB}/${fn}`, { ...init, headers: { 'x-session': token(), 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(String(out?.error ?? `HTTP ${res.status}`)), { status: res.status });
  return out;
}

const REPOS: [string, string][] = [['repro-suite-hub', 'Landing page and admin'], ['paper-explainer', 'Learn by video'], ['reading-companion', 'Read and ask'], ['paper-repro-agentv2', 'Backend, video pipeline, Check pages'], ['repro-lite', 'Quick check'], ['repro-desk', 'Human check'], ['indexboard', 'Boards']];

function useReleases() {
  const [suite, setSuite] = useState<SuiteRel[] | null>(null);
  const [prs, setPrs] = useState<Pr[] | null>(() => { try { const c = JSON.parse(localStorage.getItem('pe-prs') ?? 'null') as { at: number; v: Pr[] } | null; return c && Date.now() - c.at < 30 * 60000 ? c.v : null; } catch { return null; } });
  useEffect(() => {
    let alive = true;
    fetch(`${import.meta.env.BASE_URL}releases.json?t=${Date.now()}`).then((x) => x.json()).then((j) => alive && setSuite(j as SuiteRel[])).catch(() => alive && setSuite([]));
    if (prs) return () => { alive = false; };
    (async () => {
      const got = await Promise.all(REPOS.map(async ([repo]) => {
        try {
          const r = await fetch(`https://api.github.com/repos/bryan273/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=20`);
          if (!r.ok) return [] as Pr[];
          const arr = (await r.json()) as { number: number; title: string; merged_at: string | null; html_url: string; body: string | null }[];
          return arr.filter((p) => p.merged_at).map((p) => ({ n: p.number, title: p.title, at: p.merged_at as string, url: p.html_url, repo, bullets: (p.body ?? '').split('\n').map((l) => l.replace(/^\s*[-*]\s*/, '').trim()).filter((l) => l && !/^🤖|generated with/i.test(l) && /^\s*[-*]/.test(((p.body ?? '').split('\n').find((x) => x.includes(l)) ?? ''))).slice(0, 8) }));
        } catch { return [] as Pr[]; }
      }));
      const all = got.flat().sort((a, b) => b.at.localeCompare(a.at));
      if (alive && all.length) { setPrs(all); try { localStorage.setItem('pe-prs', JSON.stringify({ at: Date.now(), v: all })); } catch { /* ignore */ } }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { suite, prs };
}

function usePage<T>(items: T[], size = 12) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const at = Math.min(page, pages - 1);
  return { rows: items.slice(at * size, at * size + size), page: at, pages, total: items.length, set: setPage };
}
function Pager({ p }: { p: { page: number; pages: number; total: number; set: (n: number) => void } }) {
  if (p.pages <= 1) return <div className="cs-pager"><span>{p.total} rows</span></div>;
  return (
    <div className="cs-pager">
      <span>{p.total} rows</span>
      <button type="button" className="cs-btn sm" disabled={p.page === 0} onClick={() => p.set(0)}>«</button>
      <button type="button" className="cs-btn sm" disabled={p.page === 0} onClick={() => p.set(p.page - 1)}>‹</button>
      <b>{p.page + 1} / {p.pages}</b>
      <button type="button" className="cs-btn sm" disabled={p.page >= p.pages - 1} onClick={() => p.set(p.page + 1)}>›</button>
      <button type="button" className="cs-btn sm" disabled={p.page >= p.pages - 1} onClick={() => p.set(p.pages - 1)}>»</button>
    </div>
  );
}
const pill = (s: string) => <span className={`cs-pill ${['done', 'paid', 'delivered', 'ok', 'approved'].includes(s) ? 'ok' : ['failed', 'cancelled', 'rejected', 'expired'].includes(s) ? 'bad' : ['running', 'waiting', 'new', 'paid_claimed', 'making', 'pending', 'queued'].includes(s) ? 'wait' : ''}`}>{s}</span>;

/** Daily rows grouped by day, week or month for a chart. */
function bucket(days: Day[], group: 'hour' | 'day' | 'week' | 'month') {
  if (group === 'hour') return days.map((d) => ({ label: `${d.d.slice(8, 10)}/${d.d.slice(5, 7)} ${d.d.slice(11, 13)}:00`, r: d }));
  const out: { label: string; r: Day }[] = [];
  const key = (d: string) => (group === 'day' ? d : group === 'month' ? d.slice(0, 7) : iso10(new Date(Date.parse(d) - ((new Date(d).getUTCDay() + 6) % 7) * 86400000)));
  const m = new Map<string, Day>();
  for (const d of days) {
    const k = key(d.d);
    const r = m.get(k) ?? { d: k, signups: 0, visitors: 0, videos: 0, failed: 0, checks: 0, income: 0, cost: 0, tokens: 0, calls: 0 };
    for (const f of ['signups', 'visitors', 'videos', 'failed', 'checks', 'income', 'cost', 'tokens', 'calls'] as const) r[f] += d[f];
    m.set(k, r);
  }
  for (const [k, r] of m) out.push({ label: group === 'month' ? new Date(k + '-01').toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }) : fmtD(k), r });
  return out;
}

type TabId = 'overview' | 'revenue' | 'pricing' | 'members' | 'audience' | 'videos' | 'infra' | 'releases' | 'feedback';

/** The admin console of the whole suite: one tab for each question an owner asks, one range filter for all the numbers. */
export default function Admin() {
  const { openAuth } = useAccount();
  const [data, setData] = useState<Data | null>(() => { try { const c = token() ? localStorage.getItem('pe-admin-v2') : null; return c ? (JSON.parse(c) as Data) : null; } catch { return null; } });
  const [ops, setOps] = useState<Ops | null>(null);
  const [contacts, setContacts] = useState<{ id?: string | number; created_at?: string; topic?: string; name?: string; email?: string; message?: string }[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [err, setErr] = useState('');
  const [status, setStatus] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<TabId>(() => { try { return (localStorage.getItem('pe-admin-tab') as TabId) || 'overview'; } catch { return 'overview'; } });
  const setTabKeep = (t: TabId) => { setTab(t); try { localStorage.setItem('pe-admin-tab', t); } catch { /* ignore */ } };
  const [preset, setPreset] = useState<'1' | '2' | '7' | '30' | '90' | '180' | 'custom'>('30');
  const [from, setFrom] = useState(iso10(new Date(Date.now() - 29 * 86400000)));
  const [to, setTo] = useState(iso10(new Date()));
  const [group, setGroup] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const { suite, prs } = useReleases();

  useEffect(() => { document.title = 'Admin · Paperlit'; }, []);

  const pick = (p: typeof preset) => {
    setPreset(p);
    if (p !== 'custom') { const n = Number(p); setFrom(iso10(new Date(Date.now() - (n - 1) * 86400000))); setTo(iso10(new Date())); if (n >= 120) setGroup('week'); else if (n <= 2) setGroup('hour'); else if (n <= 30) setGroup('day'); }
  };

  const load = useCallback(async () => {
    setBusy(true); setErr('');
    try {
      const d = (await call('suite-admin')) as Data;
      setData(d); setStatus(200);
      try { localStorage.setItem('pe-admin-v2', JSON.stringify(d)); } catch { /* full */ }
    } catch (e) {
      const st = (e as { status?: number }).status ?? 0;
      if (st === 401 || st === 403) { setData(null); try { localStorage.removeItem('pe-admin-v2'); } catch { /* ignore */ } }
      setStatus(st); setErr((e as Error).message);
    } finally { setBusy(false); }
    call('explainer-admin').then((o) => { setOps((o as { ops?: Ops }).ops ?? null); setContacts(((o as { contacts?: typeof contacts }).contacts ?? []).slice(0, 200)); }).catch(() => undefined);
    call('explainer-admin', { method: 'POST', body: JSON.stringify({ op: 'verify_list' }) }).then((o) => setProofs((o as { items: Proof[] }).items ?? [])).catch(() => undefined);
  }, []);
  useEffect(() => {
    load();
    const on = () => load();
    window.addEventListener('suite-auth', on);
    return () => window.removeEventListener('suite-auth', on);
  }, [load]);

  const act = async (body: Record<string, unknown>) => {
    setErr('');
    try {
      await call('explainer-admin', { method: 'POST', body: JSON.stringify(body) });
      // show the result at once; the full reload below can take several seconds
      setData((d) => {
        if (!d) return d;
        if (body.op === 'ban') return { ...d, members: d.members.map((m) => (m.email === body.username ? { ...m, banned: body.banned === true } : m)) };
        if (body.op === 'grant') return { ...d, members: d.members.map((m) => (m.email === body.username ? { ...m, credits: m.credits + Number(body.amount || 0) } : m)) };
        if (body.op === 'order_status') return { ...d, orders: d.orders.map((o) => (o.id === body.id ? { ...o, status: String(body.status) } : o)) };
        return d;
      });
      await load();
    } catch (e) { setErr((e as Error).message); }
  };

  // ---- the file viewer for proofs and payment screenshots
  type Viewing = { kind: 'proof' | 'shot'; id: string | number; title: string; sub: string; proof?: Proof; order?: OrderRow };
  const [viewing, setViewing] = useState<Viewing | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileErr, setFileErr] = useState('');
  const [fileBusy, setFileBusy] = useState(false);
  const closeViewer = () => { setViewing(null); if (fileUrl) URL.revokeObjectURL(fileUrl); setFileUrl(''); setFileType(''); setFileErr(''); };
  const openFile = async (v: Viewing) => {
    setViewing(v); setFileUrl(''); setFileErr(''); setFileBusy(true);
    try {
      const res = await fetch(`${SB}/explainer-admin?${v.kind === 'proof' ? 'proof' : 'shot'}=${encodeURIComponent(String(v.id))}`, { headers: { 'x-session': token() } });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(String((j as { error?: string }).error ?? `HTTP ${res.status}`)); }
      const blob = await res.blob();
      setFileType(blob.type); setFileUrl(URL.createObjectURL(blob));
    } catch (e) { setFileErr((e as Error).message); } finally { setFileBusy(false); }
  };
  const decide = async (id: string | number, approve: boolean) => {
    setFileErr('');
    try { await call('explainer-admin', { method: 'POST', body: JSON.stringify({ op: 'verify_decide', id, approve }) }); closeViewer(); setProofs((l) => l.map((x) => (x.id === id ? { ...x, status: approve ? 'approved' : 'rejected' } : x))); await load(); } catch (e) { setFileErr((e as Error).message); }
  };
  const orderDecide = async (id: string, st: 'paid' | 'cancelled') => {
    setFileErr('');
    try { await call('explainer-admin', { method: 'POST', body: JSON.stringify({ op: 'order_status', id, status: st }) }); closeViewer(); setData((d) => (d ? { ...d, orders: d.orders.map((o) => (o.id === id ? { ...o, status: st } : o)) } : d)); await load(); } catch (e) { setFileErr((e as Error).message); }
  };

  // ---- numbers inside the range
  const hourly = group === 'hour' && !!data?.hours?.length;
  const days = useMemo(() => (hourly ? data!.hours! : data?.days ?? []).filter((d) => d.d.slice(0, 10) >= from && d.d.slice(0, 10) <= to), [data, from, to, hourly]);
  const sum = (f: keyof Day) => days.reduce((a, d) => a + (d[f] as number), 0);
  const buckets = useMemo(() => bucket(days, group), [days, group]);
  const labels = buckets.map((b) => b.label);
  const col = (f: keyof Day) => buckets.map((b) => b.r[f] as number);
  const inRangeIso = (s: string) => { const d = s.slice(0, 10); return d >= from && d <= to; };

  // ---- members tab
  const [mq, setMq] = useState(''); const [mplan, setMplan] = useState('all'); const [mcountry, setMcountry] = useState('all'); const [mstate, setMstate] = useState('all');
  const [amount, setAmount] = useState<Record<string, string>>({});
  const members = useMemo(() => (data?.members ?? []).filter((m) => {
    if (mq && !`${m.email} ${m.handle ?? ''}`.toLowerCase().includes(mq.toLowerCase())) return false;
    const active = !!m.plan_until && new Date(m.plan_until) > new Date();
    if (mplan === 'free' && active) return false;
    if (mplan === 'plus' && !(active && m.plan === 'plus')) return false;
    if (mplan === 'pro' && !(active && m.plan === 'pro')) return false;
    if (mplan === 'premium' && !(active && m.plan === 'premium')) return false;
    if (mplan === 'expiring' && !(active && Date.parse(m.plan_until!) - Date.now() < 7 * 86400000)) return false;
    if (mcountry !== 'all' && m.country !== mcountry) return false;
    if (mstate === 'banned' && !m.banned) return false;
    if (mstate === 'new' && !inRangeIso(m.created_at)) return false;
    if (mstate === 'active' && !(m.last_login && inRangeIso(m.last_login))) return false;
    return true;
  }), [data, mq, mplan, mcountry, mstate, from, to]);
  const mP = usePage(members, 12);

  // ---- orders
  const [oq, setOq] = useState(''); const [ost, setOst] = useState('all');
  const orders = useMemo(() => (data?.orders ?? []).filter((o) => (ost === 'all' || o.status === ost || (ost === 'open' && (o.status === 'new' || o.status === 'paid_claimed'))) && (!oq || `${o.email} ${o.what}`.toLowerCase().includes(oq.toLowerCase())) && inRangeIso(o.created_at)), [data, oq, ost, from, to]);
  const oP = usePage(orders, 12);

  // ---- videos
  const [jq, setJq] = useState(''); const [jst, setJst] = useState('all'); const [jl, setJl] = useState('all');
  const jobs = useMemo(() => (data?.jobs ?? []).filter((j) => (jst === 'all' || j.status === jst) && (jl === 'all' || j.langs === jl) && (!jq || `${j.title ?? ''} ${j.arxiv ?? ''}`.toLowerCase().includes(jq.toLowerCase())) && inRangeIso(j.created_at)), [data, jq, jst, jl, from, to]);
  const jP = usePage(jobs, 12);
  const [rst, setRst] = useState('all');
  const repro = useMemo(() => (data?.repro ?? []).filter((r) => (rst === 'all' || r.status === rst) && inRangeIso(r.created_at)), [data, rst, from, to]);
  const rP = usePage(repro, 10);

  // ---- audience
  const tally = (rows: { d: string }[], pickK: (r: any) => string) => {
    const m: Record<string, number> = {};
    for (const r of rows) { if (!inRangeIso(r.d)) continue; const k = pickK(r) || 'unknown'; m[k] = (m[k] || 0) + ((r as unknown as { n?: number }).n ?? 1); }
    return Object.entries(m).map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n);
  };
  const aud = useMemo(() => data ? {
    chosen: tally(data.signup_rows, (r) => r.c), ip: tally(data.signup_rows, (r) => r.ip), visits: tally(data.visit_country, (r) => r.c),
    langs: tally(data.signup_rows, (r) => r.l), sources: tally(data.signup_rows, (r) => r.s), roles: tally(data.signup_rows, (r) => r.r),
  } : null, [data, from, to]);
  const jobLangs = useMemo(() => tally((data?.job_langs ?? []).map((j) => ({ d: j.d, l: j.l ?? 'en' })), (r) => LANGN[r.l] ?? r.l), [data, from, to]);

  // ---- money in the range
  const incomeRows = (data?.orders ?? []).filter((o) => (o.status === 'paid' || o.status === 'delivered') && inRangeIso(o.created_at));
  const byKind = useMemo(() => { const m: Record<string, { n: number; cny: number }> = {}; for (const o of incomeRows) { const k = (m[o.kind] ??= { n: 0, cny: 0 }); k.n++; k.cny += o.cny; } return Object.entries(m).map(([k, v]) => ({ k, ...v })).sort((a, b) => b.cny - a.cny); }, [data, from, to]);
  const income = sum('income'), cost = sum('cost');
  const ordersOpen = (data?.orders ?? []).filter((o) => o.status === 'new' || o.status === 'paid_claimed').length;
  const proofsOpen = proofs.filter((x) => x.status === 'pending').length;
  const failed24 = (data?.jobs ?? []).filter((j) => j.status === 'failed' && Date.now() - Date.parse(j.created_at) < 86400000).length;

  // ---- infrastructure
  const rk = (() => {
    const r = data?.rkapi as { configured?: boolean; token?: { json?: { data?: { total_available?: number; total_granted?: number; total_used?: number; unlimited_quota?: boolean } } }; subscription?: { json?: { hard_limit_usd?: number } }; usage?: { json?: { total_usage?: number } } } | undefined;
    if (!r || !r.configured) return { state: 'off' as const };
    const t = r.token?.json?.data;
    if (t && typeof t.total_available === 'number') return { state: 'ok' as const, remaining: t.total_available / 500000, used: (t.total_used ?? 0) / 500000, granted: (t.total_granted ?? 0) / 500000, unlimited: !!t.unlimited_quota, src: 'token endpoint, 500,000 units per USD' };
    const lim = r.subscription?.json?.hard_limit_usd, usedC = r.usage?.json?.total_usage;
    if (typeof lim === 'number' && typeof usedC === 'number') return { state: 'ok' as const, remaining: lim - usedC / 100, used: usedC / 100, granted: lim, unlimited: false, src: 'billing endpoints' };
    return { state: 'unknown' as const };
  })();
  const GB = 1024 ** 3;
  const stor = (ops?.storage ?? []).reduce((a, b) => a + (b.bytes || 0), 0);
  const warn: string[] = [];
  if (ops?.r2 && ops.r2.bytes / (10 * GB) >= 0.85) warn.push(`Video storage (R2) is ${Math.round((ops.r2.bytes / (10 * GB)) * 100)}% full`);
  if (ops?.db_bytes && ops.db_bytes / (500 * 1024 ** 2) >= 0.85) warn.push('Database is almost full');
  if (stor / GB >= 0.85) warn.push('Supabase storage is almost full');
  if (rk.state === 'ok' && !rk.unlimited && rk.remaining < 3) warn.push(`Model gateway balance is low: $${rk.remaining.toFixed(2)}`);
  if ((ops?.stuck_jobs ?? 0) > 0) warn.push(`${ops?.stuck_jobs} video job(s) look stuck`);
  if (failed24 > 0) warn.push(`${failed24} video(s) failed in the last 24 hours`);

  const llmByApp = useMemo(() => { const m: Record<string, number> = {}; for (const r of data?.llm ?? []) if (inRangeIso(r.d)) m[r.app] = (m[r.app] || 0) + r.tokens; return Object.entries(m).map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n); }, [data, from, to]);

  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview', badge: warn.length || undefined }, { id: 'revenue', label: 'Revenue', badge: ordersOpen || undefined }, { id: 'members', label: 'Members', badge: proofsOpen || undefined },
    { id: 'pricing', label: 'Pricing model' }, { id: 'audience', label: 'Audience' }, { id: 'videos', label: 'Videos and usage', badge: failed24 || undefined }, { id: 'infra', label: 'Infrastructure' }, { id: 'releases', label: 'Releases' }, { id: 'feedback', label: 'Feedback' },
  ];
  const needsRange = !['infra', 'releases', 'pricing'].includes(tab);

  return (
    <div className="cs-root w-full">
      <style>{css}</style>
      <div className="cs">
        <div className="cs-head">
          <div>
            <h1>Admin</h1>
            <p className="sub">{data ? `Signed in as ${data.me}. Numbers read ${fmt(data.generated_at)} (${ago(data.generated_at)}).` : 'Everything about the suite, in one place.'}</p>
            {data?.view && <p className={`cs-view ${data.view}`}>{data.view === 'qa' ? 'Test view: test accounts and their orders, videos and questions are included.' : `Real members only${data.hidden_test_accounts ? `: ${data.hidden_test_accounts} test accounts are left out` : ''}.`}</p>}
          </div>
          <button type="button" className="cs-btn" onClick={load} disabled={busy}>{busy ? 'Loading…' : 'Refresh'}</button>
        </div>

        {err && !data && (
          <div className="cs-wrap cs-note" style={{ marginTop: 22 }}>
            <p style={{ margin: '0 0 12px' }}>{status === 401 ? 'Log in with an admin account to see this page.' : status === 403 ? 'This account is not an admin.' : err}</p>
            {status === 401 && <button type="button" className="cs-btn" onClick={() => openAuth('login')}>Log in</button>}
          </div>
        )}
        {err && data && <p className="cs-err" role="alert">{err}</p>}

        {data && (
          <>
            <nav className="cs-tabs" role="tablist" aria-label="Admin sections">
              {tabs.map((t) => (
                <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTabKeep(t.id)}>
                  {t.label}{t.badge ? <i className="cs-badge">{t.badge}</i> : null}
                </button>
              ))}
            </nav>

            {needsRange && (
              <div className="cs-filterbar">
                <div className="cs-seg" role="group" aria-label="Period">
                  {([['1', 'Today'], ['2', '48 hours'], ['7', '7 days'], ['30', '30 days'], ['90', '90 days'], ['180', '180 days']] as const).map(([k, n]) => <button key={k} type="button" className={preset === k ? 'on' : ''} onClick={() => pick(k)}>{n}</button>)}
                </div>
                <label>From <input type="date" value={from} max={to} onChange={(e) => { setFrom(e.target.value); setPreset('custom'); }} /></label>
                <label>To <input type="date" value={to} min={from} onChange={(e) => { setTo(e.target.value); setPreset('custom'); }} /></label>
                <div className="cs-seg" role="group" aria-label="Group by">
                  {(['hour', 'day', 'week', 'month'] as const).map((g) => <button key={g} type="button" className={group === g ? 'on' : ''} disabled={g === 'hour' && Date.parse(from) < Date.now() - 7 * 86400000} title={g === 'hour' ? 'Hourly numbers cover the last 7 days' : undefined} onClick={() => setGroup(g)}>{g === 'hour' ? 'Hourly' : g === 'day' ? 'Daily' : g === 'week' ? 'Weekly' : 'Monthly'}</button>)}
                </div>
                <span className="cs-dim">{hourly ? `${days.length} hours shown` : `${days.length} days shown`}</span>
              </div>
            )}

            {tab === 'overview' && (
              <>
                {warn.length > 0 && <div className="cs-alert" role="status"><b>Needs your attention</b><ul>{warn.map((w) => <li key={w}>{w}</li>)}</ul></div>}
                <div className="cs-kpis">
                  <Kpi label="Members" value={data.members.length} sub={`${sum('signups')} new in this period`} />
                  <Kpi label="Videos made" value={sum('videos')} sub={`${sum('failed')} failed`} tone={sum('failed') > 0 ? 'warn' : undefined} />
                  <Kpi label="Income" value={yuan(income)} sub={`${incomeRows.length} paid orders`} tone="good" />
                  <Kpi label="Cost (estimate)" value={yuan(cost)} sub={`model and renderer, USD x ${data.usd_cny}`} />
                  <Kpi label="Profit" value={yuan(income - cost)} tone={income - cost >= 0 ? 'good' : 'bad'} />
                  <Kpi label="Active plans" value={data.active_plans} />
                  <Kpi label="To do: orders" value={ordersOpen} tone={ordersOpen ? 'warn' : undefined} sub="waiting for you to confirm" />
                  <Kpi label="To do: proofs" value={proofsOpen} tone={proofsOpen ? 'warn' : undefined} sub="student and teacher" />
                </div>
                <section className="cs-card"><h3>Income and cost</h3><BarChart labels={labels} series={[{ name: 'Income', color: '#1a9a55', values: col('income') }, { name: 'Cost', color: '#d6453d', values: col('cost') }]} fmt={yuan} height={340} /></section>
                <section className="cs-card"><h3>New members and videos</h3><LineChart labels={labels} series={[{ name: 'Videos', color: 'var(--accent)', values: col('videos') }, { name: 'New members', color: '#e2a13a', values: col('signups') }]} height={320} /></section>
              </>
            )}

            {tab === 'revenue' && (
              <>
                <div className="cs-kpis">
                  <Kpi label="Income" value={yuan(income)} tone="good" sub={`${incomeRows.length} paid orders`} />
                  <Kpi label="Cost (estimate)" value={yuan(cost)} />
                  <Kpi label="Profit" value={yuan(income - cost)} tone={income - cost >= 0 ? 'good' : 'bad'} />
                  <Kpi label="Average order" value={incomeRows.length ? yuan(income / incomeRows.length) : '-'} />
                  <Kpi label="Waiting for you" value={ordersOpen} tone={ordersOpen ? 'warn' : undefined} />
                </div>
                <section className="cs-card"><h3>Income, cost and profit</h3><BarChart labels={labels} series={[{ name: 'Income', color: '#1a9a55', values: col('income') }, { name: 'Cost', color: '#d6453d', values: col('cost') }]} fmt={yuan} height={340} /></section>
                <div className="cs-grid2">
                  <section className="cs-card"><h3>What was bought</h3>{byKind.length === 0 ? <p className="cs-note sub">No paid orders in this period.</p> : <HBars rows={byKind.map((k) => ({ k: `${k.k.replace('_', ' ')} · ${yuan(k.cny)}`, n: k.n }))} color="#1a9a55" />}</section>
                  <section className="cs-card">
                    <h3>Plans that are running</h3>
                    <div className="cs-wrap"><table><thead><tr><th>Member</th><th>Plan</th><th>Due</th></tr></thead><tbody>
                      {data.members.filter((m) => m.plan_until && new Date(m.plan_until) > new Date()).sort((a, b) => a.plan_until!.localeCompare(b.plan_until!)).slice(0, 30).map((m) => {
                        const dl = Math.ceil((Date.parse(m.plan_until!) - Date.now()) / 86400000);
                        return <tr key={m.id}><td>{m.handle ?? m.email}</td><td>{m.plan}{m.plan_source ? ` (${m.plan_source})` : ''}</td><td style={{ color: dl <= 7 ? '#c0392b' : undefined }}>{fmt(m.plan_until)} · {dl} d</td></tr>;
                      })}
                    </tbody></table></div>
                  </section>
                </div>
                <h2>Orders</h2>
                <div className="cs-filters">
                  <input className="cs-search" placeholder="Search email or product" value={oq} onChange={(e) => setOq(e.target.value)} />
                  <select value={ost} onChange={(e) => setOst(e.target.value)}><option value="all">All statuses</option><option value="open">Waiting for me</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option><option value="delivered">Delivered</option></select>
                </div>
                <div className="cs-wrap"><table><thead><tr><th>Who</th><th>Order</th><th>Amount</th><th>Status</th><th>When</th><th>Decision</th></tr></thead><tbody>
                  {oP.rows.map((o) => {
                    const money = o.amt ? (o.cur === 'vnd' ? `${o.amt.toLocaleString('vi-VN')} VND` : o.cur === 'idr' ? `Rp ${o.amt.toLocaleString('id-ID')}` : `¥${o.amt}`) : o.cny ? `¥${o.cny}` : '';
                    const open = o.status === 'new' || o.status === 'paid_claimed';
                    return (
                      <tr key={o.id}><td>{o.email}</td><td>{o.what}<div className="cs-dim" style={{ fontSize: 12 }}>{o.id.slice(0, 8)}{o.method ? ` · ${o.method}` : ''}</div></td><td>{money}</td><td>{pill(o.status)}</td><td>{fmt(o.created_at)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{open ? <>
                          {o.shot && <><button type="button" className="cs-btn sm" onClick={() => openFile({ kind: 'shot', id: o.id, title: 'Payment screenshot', sub: `${o.email} · ${money} · ${o.id.slice(0, 8)}`, order: o })}>View payment</button>{' '}</>}
                          <button type="button" className="cs-btn sm" onClick={() => act({ op: 'order_status', id: o.id, status: 'paid' })}>Mark paid</button>{' '}
                          <button type="button" className="cs-btn sm" onClick={() => act({ op: 'order_status', id: o.id, status: 'cancelled' })}>Cancel</button></> : <span className="cs-dim">{o.status}</span>}</td></tr>
                    );
                  })}
                </tbody></table><Pager p={oP} /></div>
              </>
            )}

            {tab === 'members' && (
              <>
                <div className="cs-kpis">
                  <Kpi label="Members" value={data.members.length} />
                  <Kpi label="New in period" value={sum('signups')} />
                  <Kpi label="Active plans" value={data.active_plans} />
                  <Kpi label="Proofs waiting" value={proofsOpen} tone={proofsOpen ? 'warn' : undefined} />
                  <Kpi label="Banned" value={data.members.filter((m) => m.banned).length} />
                </div>
                <section className="cs-card"><h3>New members</h3><BarChart labels={labels} series={[{ name: 'New members', color: 'var(--accent)', values: col('signups') }]} height={240} /></section>
                <h2>Student and teacher proofs{proofsOpen ? ` (${proofsOpen} waiting)` : ''}</h2>
                <div className="cs-wrap">{proofs.length === 0 ? <p className="cs-note sub">No proofs sent yet.</p> : (
                  <table><thead><tr><th>Email</th><th>Who</th><th>School</th><th>Sent</th><th>Proof</th><th>Status</th><th>Decision</th></tr></thead><tbody>
                    {proofs.map((x) => (
                      <tr key={String(x.id)}><td>{x.username}</td><td>{x.role}</td><td>{x.school || <span className="cs-dim">none</span>}</td><td>{fmt(x.created_at)}</td>
                        <td><button type="button" className="cs-btn sm" onClick={() => openFile({ kind: 'proof', id: x.id, title: `${x.role === 'teacher' ? 'Teacher' : 'Student'} proof`, sub: `${x.username} · ${x.school || 'no school given'} · ${fmt(x.created_at)}`, proof: x })}>View proof</button></td>
                        <td>{pill(x.status)}</td>
                        <td>{x.status === 'pending' ? <button type="button" className="cs-btn sm" onClick={() => openFile({ kind: 'proof', id: x.id, title: `${x.role === 'teacher' ? 'Teacher' : 'Student'} proof`, sub: `${x.username} · ${x.school || 'no school given'} · ${fmt(x.created_at)}`, proof: x })}>Review</button> : <span className="cs-dim">done</span>}</td></tr>
                    ))}
                  </tbody></table>)}</div>
                <h2>All members</h2>
                <div className="cs-filters">
                  <input className="cs-search" placeholder="Search username or email" value={mq} onChange={(e) => setMq(e.target.value)} />
                  <select value={mplan} onChange={(e) => setMplan(e.target.value)}><option value="all">Any plan</option><option value="free">Free</option><option value="plus">Plus</option><option value="pro">Pro</option><option value="premium">Premium</option><option value="expiring">Plan ends within 7 days</option></select>
                  <select value={mcountry} onChange={(e) => setMcountry(e.target.value)}><option value="all">Any country</option>{[...new Set(data.members.map((m) => m.country).filter(Boolean))].sort().map((c) => <option key={c} value={c}>{country(c)}</option>)}</select>
                  <select value={mstate} onChange={(e) => setMstate(e.target.value)}><option value="all">Everyone</option><option value="new">Joined in period</option><option value="active">Signed in during period</option><option value="banned">Banned</option></select>
                </div>
                <div className="cs-wrap"><table><thead><tr><th>Member</th><th>Country</th><th>Plan</th><th>Credits</th><th>Videos</th><th>Joined</th><th>Last sign-in</th><th>Actions</th></tr></thead><tbody>
                  {mP.rows.map((m) => {
                    const dl = m.plan_until ? Math.ceil((Date.parse(m.plan_until) - Date.now()) / 86400000) : 0;
                    return (
                      <tr key={m.id}>
                        <td>{m.handle ? <b>{m.handle} </b> : null}<span className="cs-dim">{m.email}</span>{m.banned && <> {pill('banned')}</>}</td>
                        <td>{m.country ? `${flag(m.country)}${country(m.country)}` : <span className="cs-dim">-</span>}</td>
                        <td>{m.plan_until && dl > 0 ? <span style={{ color: dl <= 7 ? '#c0392b' : undefined }}>{m.plan}{m.plan_source ? ` (${m.plan_source})` : ''} · {dl} d left</span> : <span className="cs-dim">Free</span>}</td>
                        <td>{m.credits}</td><td>{m.jobs}</td><td>{fmt(m.created_at)}</td><td>{fmt(m.last_login)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <input className="cs-n" type="number" placeholder="+10" aria-label={`Credits for ${m.email}`} value={amount[m.id] ?? ''} onChange={(e) => setAmount({ ...amount, [m.id]: e.target.value })} />{' '}
                          <button type="button" className="cs-btn sm" onClick={() => { const n = Number(amount[m.id]); if (n) { act({ op: 'grant', username: m.email, amount: n, reason: 'admin grant (console)' }); setAmount({ ...amount, [m.id]: '' }); } }}>Grant</button>{' '}
                          <button type="button" className="cs-btn sm" onClick={() => act({ op: 'ban', username: m.email, banned: !m.banned })}>{m.banned ? 'Unban' : 'Ban'}</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody></table><Pager p={mP} /></div>
              </>
            )}

            {tab === 'audience' && aud && (
              <>
                <div className="cs-kpis">
                  <Kpi label="Visitors in period" value={sum('visitors')} sub="unique per day, added up" />
                  <Kpi label="New members" value={sum('signups')} />
                  <Kpi label="Visitors to members" value={sum('visitors') ? `${((sum('signups') / sum('visitors')) * 100).toFixed(1)}%` : '-'} />
                </div>
                <section className="cs-card"><h3>Visitors</h3><LineChart labels={labels} series={[{ name: 'Visitors', color: 'var(--accent)', values: col('visitors') }, { name: 'New members', color: '#e2a13a', values: col('signups') }]} /></section>
                <div className="cs-grid2">
                  <section className="cs-card"><h3>Visitors by country</h3><p className="sub" style={{ margin: '0 0 10px' }}>Where the network says they are. Recorded since this update.</p><HBars rows={aud.visits.slice(0, 15)} name={(k) => `${flag(k)}${country(k)}`} /></section>
                  <section className="cs-card"><h3>Members by country (chosen at sign-up)</h3><HBars rows={aud.chosen.slice(0, 15)} name={(k) => `${flag(k)}${country(k)}`} color="#1a9a55" /></section>
                  <section className="cs-card"><h3>Members by country (from their connection)</h3><HBars rows={aud.ip.slice(0, 15)} name={(k) => `${flag(k)}${country(k)}`} color="#e2a13a" /></section>
                  <section className="cs-card"><h3>Preferred language</h3><HBars rows={aud.langs} name={(k) => LANGN[k] ?? k} color="#8a5cff" /></section>
                  <section className="cs-card"><h3>Heard about us from</h3><HBars rows={aud.sources} color="#22c3ee" /></section>
                  <section className="cs-card"><h3>Who they are</h3><HBars rows={aud.roles} color="#ff7a59" /></section>
                </div>
              </>
            )}

            {tab === 'videos' && (
              <>
                <div className="cs-kpis">
                  <Kpi label="Videos made" value={sum('videos')} />
                  <Kpi label="Failed" value={sum('failed')} tone={sum('failed') ? 'warn' : undefined} />
                  <Kpi label="Failure rate" value={sum('videos') + sum('failed') ? `${((sum('failed') / (sum('videos') + sum('failed'))) * 100).toFixed(1)}%` : '-'} />
                  <Kpi label="Average cost per video (render only)" value={data.costs?.video_per_minute != null && data.costs.videos ? yuan(data.costs.video_total / data.costs.videos) : '-'} />
                  <Kpi label="Questions asked (7d)" value={data.asks_7d} />
                  <Kpi label="Reproductions started" value={sum('checks')} />
                </div>
                <section className="cs-card"><h3>Videos per period</h3><BarChart labels={labels} stacked series={[{ name: 'Ready', color: 'var(--accent)', values: col('videos') }, { name: 'Failed', color: '#d6453d', values: col('failed') }]} height={320} /></section>
                <div className="cs-grid2">
                  <section className="cs-card"><h3>Video language</h3><HBars rows={jobLangs} color="#8a5cff" /></section>
                  <section className="cs-card"><h3>Model tokens by app (30 days max)</h3><HBars rows={llmByApp.map((r) => ({ k: r.k, n: r.n }))} color="#22c3ee" /></section>
                </div>
                {data.costs && (
                  <section className="cs-card">
                    <h3>What each feature costs us (last 30 days)</h3>
                    <p className="cs-dim" style={{ fontSize: 13 }}>Videos: the cost the renderer measured for each video. Answers: tokens in the ledger times the model price (quick answers and research ${data.costs.prices.fast.in} / ${data.costs.prices.fast.out} per million tokens in / out, in-depth ${data.costs.prices.deep.in} / ${data.costs.prices.deep.out}).</p>
                    <div className="cs-wrap" style={{ marginTop: 10 }}><table><thead><tr><th>Feature</th><th>Used</th><th>Cost each</th><th>Tokens each</th><th>Total</th></tr></thead><tbody>
                      <tr><td>Video, per minute</td><td>{data.costs.videos} videos</td><td>{data.costs.video_per_minute !== null ? yuan(data.costs.video_per_minute) : '-'}</td><td>-</td><td>{yuan(data.costs.video_total)}</td></tr>
                      <tr><td>Video, average 3 minute video</td><td></td><td>{data.costs.video_per_minute !== null ? yuan(data.costs.video_per_minute * 3) : '-'}</td><td>-</td><td></td></tr>
                      <tr><td>Quick answer</td><td>{data.costs.quick.n}</td><td>{data.costs.quick.each !== null ? yuan(data.costs.quick.each) : '-'}</td><td>{data.costs.quick.tokens ?? '-'}</td><td>{yuan(data.costs.quick.total)}</td></tr>
                      <tr><td>In-depth answer</td><td>{data.costs.deep.n}</td><td>{data.costs.deep.each !== null ? yuan(data.costs.deep.each) : '-'}</td><td>{data.costs.deep.tokens ?? '-'}</td><td>{yuan(data.costs.deep.total)}</td></tr>
                      <tr><td>Interactive mode questions</td><td>{data.costs.quiz.n}</td><td>{data.costs.quiz.each !== null ? yuan(data.costs.quiz.each) : '-'}</td><td>{data.costs.quiz.tokens ?? '-'}</td><td>{yuan(data.costs.quiz.total)}</td></tr>
                      <tr><td>Research question</td><td>{data.costs.research.n}</td><td>{data.costs.research.each !== null ? yuan(data.costs.research.each) : '-'}</td><td>-</td><td></td></tr>
                      <tr><td>Video edits</td><td>{data.costs.edits}</td><td>about one video</td><td>-</td><td>in the video cost</td></tr>
                    </tbody></table></div>
                  </section>
                )}
                {(() => { const why: Record<string, number> = {}; for (const j of data.jobs) if (j.status === 'failed' && inRangeIso(j.created_at)) { const k = (j.error || 'No reason recorded').replace(/[0-9a-f]{8}-[0-9a-f-]{27}/g, '').slice(0, 140); why[k] = (why[k] || 0) + 1; } const rows = Object.entries(why).sort((a, b) => b[1] - a[1]); return rows.length ? (
                  <section className="cs-card"><h3>Why videos failed</h3><div className="cs-wrap"><table><thead><tr><th>Reason shown to the member</th><th>Videos</th></tr></thead><tbody>{rows.map(([k, n]) => <tr key={k}><td>{k}</td><td>{n}</td></tr>)}</tbody></table></div><p className="cs-dim" style={{ fontSize: 13, marginTop: 8 }}>Failed videos never use a credit. The member sees the same reason on the video page.</p></section>
                ) : null; })()}
                <section className="cs-card"><h3>Model calls and tokens per period</h3><LineChart labels={labels} series={[{ name: 'Tokens', color: '#22c3ee', values: col('tokens') }]} /></section>
                <h2>Videos</h2>
                <div className="cs-filters">
                  <input className="cs-search" placeholder="Search title or link" value={jq} onChange={(e) => setJq(e.target.value)} />
                  <select value={jst} onChange={(e) => setJst(e.target.value)}><option value="all">All statuses</option><option value="done">Ready</option><option value="failed">Failed</option><option value="running">Making</option><option value="queued">Queued</option></select>
                  <select value={jl} onChange={(e) => setJl(e.target.value)}><option value="all">All languages</option>{Object.entries(LANGN).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
                </div>
                <div className="cs-wrap"><table><thead><tr><th>Source</th><th>Status</th><th>Language</th><th>Minutes</th><th>Cost</th><th>When</th></tr></thead><tbody>
                  {jP.rows.map((j) => <tr key={j.id}><td>{j.title || j.arxiv}{j.error && <div className="cs-dim" style={{ fontSize: 12 }}>{j.error}</div>}</td><td>{pill(j.status)}</td><td>{LANGN[j.langs ?? ''] ?? j.langs}</td><td>{j.seconds ? Math.round(j.seconds / 60) : ''}</td><td>{j.cost_usd ? `$${Number(j.cost_usd).toFixed(3)}` : ''}</td><td>{fmt(j.created_at)}</td></tr>)}
                </tbody></table><Pager p={jP} /></div>
                <h2>Reproductions</h2>
                <div className="cs-filters"><select value={rst} onChange={(e) => setRst(e.target.value)}><option value="all">All statuses</option><option value="done">Done</option><option value="running">Running</option><option value="waiting">Waiting</option><option value="failed">Failed</option></select></div>
                <div className="cs-wrap"><table><thead><tr><th>Paper</th><th>Status</th><th>Verdict</th><th>When</th></tr></thead><tbody>
                  {rP.rows.map((r) => <tr key={r.id}><td>{r.title || r.arxiv_id}<div className="cs-dim" style={{ fontSize: 12 }}>{[r.agent, r.model].filter(Boolean).join(' · ')}</div></td><td>{pill(r.status)}</td><td>{r.verdict}</td><td>{fmt(r.created_at)}</td></tr>)}
                </tbody></table><Pager p={rP} /></div>
              </>
            )}

            {tab === 'infra' && (
              <>
                <div className="cs-grid2">
                  <section className="cs-card">
                    <h3>Space left</h3>
                    {ops ? (
                      <>
                        <Gauge label="Video storage (Cloudflare R2, free 10 GB, kept under 9 GB)" used={ops.r2?.bytes ?? 0} limit={10 * GB} fmt={bytes} note={ops.r2 ? `${ops.r2.objects} files · checked ${ago(ops.r2.taken_at)}` : 'not measured yet'} />
                        <Gauge label="Database (Supabase free 500 MB)" used={ops.db_bytes ?? 0} limit={500 * 1024 ** 2} fmt={bytes} />
                        <Gauge label="Supabase file storage (free 1 GB)" used={stor} limit={GB} fmt={bytes} note={(ops.storage ?? []).map((b) => `${b.bucket}: ${bytes(b.bytes)}`).join(' · ')} />
                        <Gauge label="Video traffic, 30 days (estimate, free 5 GB)" used={ops.egress?.est_bytes ?? 0} limit={5 * GB} fmt={bytes} note={`${ops.egress?.plays_30d ?? 0} plays · ${ops.egress?.downloads_30d ?? 0} downloads`} />
                      </>
                    ) : <p className="cs-note sub">Loading the storage numbers…</p>}
                  </section>
                  <section className="cs-card">
                    <h3>Model gateway balance (RKAPI)</h3>
                    {rk.state === 'off' && <p className="cs-note sub">The gateway key is not set on the server.</p>}
                    {rk.state === 'unknown' && <><p className="sub">The gateway answered in a shape this page does not know. What it said:</p><pre className="cs-pre">{JSON.stringify(data.rkapi, null, 1).slice(0, 900)}</pre></>}
                    {rk.state === 'ok' && (
                      <>
                        <div className="cs-big">{rk.unlimited ? 'Unlimited' : `$${rk.remaining.toFixed(2)}`}<small> left</small></div>
                        {!rk.unlimited && <Gauge label="Used" used={rk.used} limit={Math.max(rk.granted, rk.used)} fmt={(n) => `$${n.toFixed(2)}`} />}
                        <p className="sub">Read from the gateway ({rk.src}). Approximate: top up well before it reaches zero.</p>
                      </>
                    )}
                  </section>
                </div>
                <div className="cs-kpis">
                  <Kpi label="Stuck video jobs" value={ops?.stuck_jobs ?? '-'} tone={ops?.stuck_jobs ? 'bad' : undefined} />
                  <Kpi label="Expired videos" value={ops?.expired_jobs ?? '-'} sub="removed to save space" />
                  <Kpi label="Last backup" value={ops?.last_backup ? ago(ops.last_backup.taken_at) : 'none'} sub={ops?.last_backup ? `${ops.last_backup.rows} rows, ${ops.last_backup.tables} tables` : 'no backup recorded'} tone={ops?.last_backup ? undefined : 'warn'} />
                  <Kpi label="Visits (7d)" value={data.visits_7d} />
                </div>
                {ops?.r2_daily && ops.r2_daily.length > 1 && <section className="cs-card"><h3>Video storage over 14 days</h3><LineChart labels={ops.r2_daily.map((r) => r.d)} series={[{ name: 'R2 size', color: '#1a9a55', values: ops.r2_daily.map((r) => r.bytes) }]} fmt={bytes} height={240} /></section>}
              </>
            )}

            {tab === 'pricing' && <div style={{ marginTop: 22 }}><AdminPricing jobs={data.jobs} orders={data.orders} usdCny={data.usd_cny} activePlans={data.active_plans} costs={data.costs} /></div>}

            {tab === 'releases' && (
              <>
                <h2 style={{ marginTop: 22 }}>Suite version {suite?.[0] ? `v${suite[0].v}` : ''}{suite?.[0] ? <small className="cs-dim" style={{ fontWeight: 400, marginLeft: 10 }}>last release {fmt(suite[0].at)} ({ago(suite[0].at)})</small> : null}</h2>
                <div className="cs-card">
                  {!suite ? <p className="cs-note sub">Loading…</p> : (
                    <ol className="cs-rel">
                      {suite.map((r) => (
                        <li key={r.v}>
                          <div className="cs-rel-h"><span className="cs-vtag">v{r.v}</span><b>{r.title}</b><span className="cs-dim">{fmt(r.at)}</span></div>
                          <ul>{r.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
                <h2>Every change that went live, by app</h2>
                <p className="sub" style={{ margin: '0 0 12px' }}>One line per merged pull request, with its time. The list under each is what the pull request says it changed.</p>
                {!prs ? <p className="cs-note sub">Loading from GitHub…</p> : REPOS.map(([repo, label]) => {
                  const list = prs.filter((p) => p.repo === repo);
                  return (
                    <details key={repo} className="cs-ver" open={repo === 'paper-explainer'}>
                      <summary><b>{label}</b><span className="cs-vtag">{list.length} changes</span><span className="cs-dim">{list[0] ? `last ${fmt(list[0].at)} (${ago(list[0].at)})` : 'none yet'}</span></summary>
                      <ol className="cs-rel">
                        {list.map((p) => (
                          <li key={p.n}>
                            <div className="cs-rel-h"><span className="cs-dim">{fmt(p.at)}</span><a href={p.url} target="_blank" rel="noopener noreferrer" className="cs-dim">#{p.n}</a></div>
                            <div>{p.title}</div>
                            {p.bullets.length > 0 && <ul>{p.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
                          </li>
                        ))}
                      </ol>
                    </details>
                  );
                })}
              </>
            )}

            {tab === 'feedback' && (
              <>
                <h2 style={{ marginTop: 22 }}>Feedback</h2>
                <div className="cs-wrap">{data.feedback.length === 0 ? <p className="cs-note sub">No feedback yet.</p> : (
                  <table><thead><tr><th>Rating</th><th>Comment</th><th>About</th><th>When</th></tr></thead><tbody>
                    {data.feedback.filter((f) => inRangeIso(f.created_at)).map((f) => <tr key={f.id}><td>{f.rating ?? ''}</td><td>{f.comment}</td><td className="cs-dim">{f.kind} {f.arxiv}</td><td>{fmt(f.created_at)}</td></tr>)}
                  </tbody></table>)}</div>
                <h2>Messages from the contact form</h2>
                <div className="cs-wrap">{contacts.length === 0 ? <p className="cs-note sub">No messages.</p> : (
                  <table><thead><tr><th>From</th><th>Topic</th><th>Message</th><th>When</th></tr></thead><tbody>
                    {contacts.map((c, i) => <tr key={String(c.id ?? i)}><td>{c.name} <span className="cs-dim">{c.email}</span></td><td>{c.topic}</td><td>{c.message}</td><td>{fmt(c.created_at ?? null)}</td></tr>)}
                  </tbody></table>)}</div>
              </>
            )}
          </>
        )}

        {viewing && (
          <div className="cs-modal" role="dialog" aria-modal="true" aria-label={viewing.title} onClick={(e) => { if (e.target === e.currentTarget) closeViewer(); }}>
            <div className="cs-modal-box">
              <div className="cs-modal-h"><div><b>{viewing.title}</b><div className="cs-dim" style={{ fontSize: 13 }}>{viewing.sub}</div></div><button type="button" className="cs-btn sm" onClick={closeViewer}>Close</button></div>
              <div className="cs-modal-view">
                {fileBusy && <p className="cs-note">Opening the file…</p>}
                {fileErr && <p className="cs-err" role="alert">{fileErr}</p>}
                {fileUrl && fileType.startsWith('image/') && <img src={fileUrl} alt={viewing.title} />}
                {fileUrl && fileType === 'application/pdf' && <iframe src={fileUrl} title={viewing.title} />}
              </div>
              <div className="cs-modal-f">
                {fileUrl && <a className="cs-btn sm" href={fileUrl} download={`${viewing.kind}-${viewing.id}.${fileType === 'application/pdf' ? 'pdf' : fileType.replace('image/', '') || 'bin'}`}>Download</a>}
                {viewing.kind === 'proof' && viewing.proof?.status === 'pending' && <><button type="button" className="cs-btn" onClick={() => decide(viewing.id, true)}>Approve: 1 month of Plus</button><button type="button" className="cs-btn" onClick={() => decide(viewing.id, false)}>Reject</button></>}
                {viewing.kind === 'shot' && viewing.order && <><button type="button" className="cs-btn" onClick={() => orderDecide(viewing.order!.id, 'paid')}>Mark paid</button><button type="button" className="cs-btn" onClick={() => orderDecide(viewing.order!.id, 'cancelled')}>Cancel order</button></>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const css = `.cs-root{--accent:hsl(var(--primary));--bg:hsl(var(--background));--line:hsl(var(--border));--soft:hsl(var(--muted));--text:hsl(var(--foreground));--text2:hsl(var(--muted-foreground));--bad:hsl(var(--destructive))}

.cs{max-width:1240px;margin:0 auto;padding:26px 20px 90px}
.cs h1{font-size:30px;margin:0;letter-spacing:-.02em}
.cs h2{font-size:20px;margin:34px 0 12px;letter-spacing:-.01em}
.cs h3{font-size:16px;margin:0 0 12px}
.cs .sub{color:var(--text2);margin:4px 0 0;font-size:14px}
.cs-dim{color:var(--text2)}
.cs-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-end}
.cs-btn{border:1px solid var(--line);background:hsl(var(--card));color:var(--text);border-radius:10px;padding:8px 16px;font:600 13px inherit;cursor:pointer;text-decoration:none;display:inline-block}
.cs-btn:hover{border-color:var(--accent);color:var(--accent)}
.cs-btn:disabled{opacity:.5;cursor:default}
.cs-btn.sm{padding:4px 10px;font-size:12px}
.cs-tabs{display:flex;flex-wrap:wrap;gap:4px;overflow-x:visible;margin:22px 0 0;padding-bottom:2px;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:30;background:var(--bg)}
.cs-tabs button{border:0;background:none;color:var(--text2);padding:12px 16px;font:600 14px inherit;cursor:pointer;white-space:nowrap;border-bottom:3px solid transparent;margin-bottom:-1px}
.cs-tabs button:hover{color:var(--text)}
.cs-tabs button.on{color:var(--accent);border-bottom-color:var(--accent)}
.cs-badge{margin-left:7px;font-style:normal;font-size:11.5px;background:#d6453d;color:#fff;border-radius:999px;padding:1px 7px}
.cs-filterbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;margin:16px 0 4px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:hsl(var(--card))}
.cs-filterbar label{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text2)}
.cs-filterbar input[type=date],.cs-filters select,.cs-search{border:1px solid var(--line);background:var(--bg);color:var(--text);border-radius:9px;padding:6px 9px;font:500 13px inherit}
.cs-seg{display:inline-flex;border:1px solid var(--line);border-radius:10px;overflow:hidden}
.cs-seg button{border:0;background:var(--bg);color:var(--text);padding:7px 13px;font:600 13px inherit;cursor:pointer;border-right:1px solid var(--line)}
.cs-seg button:last-child{border-right:0}
.cs-seg button.on{background:var(--accent);color:#fff}
.cs-filters{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 10px}
.cs-search{min-width:240px}
.cs-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:18px 0}
.kpi{background:hsl(var(--card));border:1px solid var(--line);border-radius:16px;padding:16px 18px;display:grid;gap:2px}
.kpi span{font-size:13px;color:var(--text2)}
.kpi b{font-size:30px;letter-spacing:-.02em;line-height:1.15}
.kpi small{font-size:12px;color:var(--text2)}
.kpi.good b{color:#1a9a55}.kpi.bad b{color:#d6453d}.kpi.warn b{color:#c9801a}
.cs-card{background:hsl(var(--card));border:1px solid var(--line);border-radius:18px;padding:20px 22px;margin-bottom:14px;min-width:0}
.cs-grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(460px,1fr));gap:14px}
@media (max-width:560px){.cs-grid2{grid-template-columns:1fr}.cs-card{padding:16px}}
.cs-alert{margin:18px 0 0;padding:14px 18px;border-radius:14px;border:1px solid #e2a13a;background:color-mix(in srgb,#e2a13a 12%,hsl(var(--card)))}
.cs-alert ul{margin:6px 0 0 18px;padding:0}
.chart-tip{position:absolute;top:8px;z-index:5;pointer-events:none;background:hsl(var(--card));border:1px solid var(--line);border-radius:10px;padding:8px 12px;font-size:12.5px;box-shadow:0 10px 30px -10px rgba(0,0,0,.4);min-width:130px}
.chart-tip i,.chart-legend i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:6px}
.chart-legend{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--text2);margin-top:8px}
.hbars{display:grid;gap:9px}
.hbar{display:grid;grid-template-columns:minmax(110px,170px) 1fr 44px 40px;align-items:center;gap:10px;font-size:13.5px}
.hbar-track{height:12px;border-radius:6px;background:var(--soft);overflow:hidden}.hbar-track i{display:block;height:100%;border-radius:6px}
.hbar-p{color:var(--text2);text-align:right;font-size:12px}
.hbar-k{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gauge{margin:0 0 18px}.gauge-h{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:13.5px;margin-bottom:6px}.gauge-h span{color:var(--text2)}
.gauge-bar{height:14px;border-radius:7px;background:var(--soft);overflow:hidden}.gauge-bar i{display:block;height:100%;border-radius:7px}
.gauge-n{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:12.5px;color:var(--text2);margin-top:5px}
.cs-big{font-size:44px;font-weight:800;letter-spacing:-.03em;margin:4px 0 14px}.cs-big small{font-size:16px;font-weight:500;color:var(--text2)}
.cs-pre{background:var(--soft);padding:12px;border-radius:10px;font-size:12px;overflow:auto;max-height:260px}
.cs-wrap{background:hsl(var(--card));border:1px solid var(--line);border-radius:14px;overflow-x:auto}
.cs table{width:100%;border-collapse:collapse;font-size:13.5px}
.cs th{text-align:left;font-weight:600;color:var(--text2);padding:10px 14px;border-bottom:1px solid var(--line);white-space:nowrap}
.cs td{padding:9px 14px;border-bottom:1px solid var(--line);vertical-align:top}
.cs tr:last-child td{border-bottom:0}
.cs-pill{display:inline-block;padding:2px 9px;border-radius:99px;font-size:12px;font-weight:600;background:var(--soft)}
.cs-pill.ok{background:#dff6e6;color:#14693a}.cs-pill.bad{background:#fde4e4;color:#a12020}.cs-pill.wait{background:#fff1d6;color:#8a5a00}
:root.dark .cs-pill.ok{background:#12351f;color:#7ee2a3}:root.dark .cs-pill.bad{background:#3d1818;color:#ff9b9b}:root.dark .cs-pill.wait{background:#3b2d0a;color:#f5c564}
.cs-note{padding:28px;text-align:center}
.cs input.cs-n{width:70px;border:1px solid var(--line);background:var(--bg);color:var(--text);border-radius:8px;padding:4px 8px;font-size:13px}
.cs-err{color:#c0392b;margin:10px 0}
.cs-pager{display:flex;gap:6px;align-items:center;justify-content:flex-end;padding:8px 12px;font-size:12.5px}
.cs-ver{border:1px solid var(--line);border-radius:14px;background:hsl(var(--card));padding:12px 16px;margin-bottom:10px}
.cs-ver summary{display:flex;gap:12px;align-items:baseline;flex-wrap:wrap;cursor:pointer;font-size:14.5px}
.cs-vtag{background:var(--accent);color:#fff;border-radius:999px;padding:1px 9px;font:700 12px inherit}
.cs-rel{margin:10px 0 4px;padding:0;list-style:none;display:grid;gap:14px}
.cs-rel-h{display:flex;gap:12px;align-items:baseline;flex-wrap:wrap;font-size:13px}
.cs-rel ul{margin:4px 0 0 18px;padding:0;font-size:13px;color:var(--text2)}
.cs-modal{position:fixed;inset:0;z-index:100;background:rgba(8,10,24,.6);display:grid;place-items:center;padding:16px}
.cs-modal-box{width:min(920px,100%);max-height:92vh;display:grid;grid-template-rows:auto 1fr auto;background:hsl(var(--card));border-radius:16px;overflow:hidden;box-shadow:0 30px 70px -20px rgba(0,0,0,.55)}
.cs-modal-h{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:14px 18px;border-bottom:1px solid var(--line)}
.cs-modal-view{overflow:auto;background:rgba(0,0,0,.04);display:grid;place-items:center;min-height:240px}
.cs-modal-view img{max-width:100%;max-height:68vh;display:block}.cs-modal-view iframe{width:100%;height:68vh;border:0}
.cs-modal-f{display:flex;gap:10px;flex-wrap:wrap;padding:12px 18px;border-top:1px solid var(--line);align-items:center}
@media (pointer:coarse){.cs-btn.sm,.cs-seg button,.cs-tabs button{min-height:40px}}
.cs-view{display:inline-block;margin:8px 0 0;padding:4px 10px;border-radius:999px;font-size:12.5px;font-weight:600}.cs-view.real{background:rgba(26,154,85,.12);color:#1a9a55}.cs-view.qa{background:rgba(201,138,18,.14);color:#a8720c}
.cs-root{overflow-x:clip}
@media (max-width:900px){.cs-tabs{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.cs-tabs::-webkit-scrollbar{display:none}}
@media (max-width:640px){.cs{padding:18px 12px 80px}.hbar{grid-template-columns:100px 1fr 38px 34px}.cs-search{min-width:0;width:100%}.kpi b{font-size:24px}}
`;
