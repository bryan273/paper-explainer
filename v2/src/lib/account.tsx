import { localizeError } from '@/lib/errors';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { visitorId } from '@/lib/explainer';

export const ACCOUNT_URL = 'https://wzdkroxbfrlqijbeiwpk.supabase.co/functions/v1/explainer-account';
const TOKEN_KEY = 'pe-session';   // the same session as the older apps on this site
const ACCTS_KEY = 'pe-accounts';

export type Quota = { tier: 'guest' | 'member'; period?: 'day' | 'week'; day_limit: number; day_used: number; day_left: number; credits: number; resets_in_min: number | null };
export type Member = { id: string; username: string; handle?: string | null; credits: number; created_at: string };
export type Pack = { credits: number; price: number };
export type Interactive = { used: number; cap: number; left: number; resets: string; jobs?: string[]; period?: 'week' | 'month' };
export type Tiers = Record<string, { interactive: number; deep: number }>;
export type Verify = { status: 'pending' | 'approved' | 'rejected'; role: string; school?: string } | null;
export type Referral = { code: string; invited: number; reward: number; max: number } | null;
export type Me = {
  admin?: boolean; user: Member | null; quota: Quota; limits: { guest: number; member: number; welcome: number }; packs: Record<string, Pack>;
  country?: string | null; plan?: string | null; plan_until?: string | null; plan_source?: string | null; interactive?: Interactive; tiers?: Tiers; verify?: Verify; referral?: Referral;
};
export type SavedAccount = { id: string; token: string; user: { id: string; username: string; handle?: string | null } };

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
const setToken = (t: string) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else { localStorage.removeItem(TOKEN_KEY); Object.keys(localStorage).filter((k) => k.startsWith('pe-swr:') || k === 'pe-me').forEach((k) => localStorage.removeItem(k)); }
  } catch { /* private mode */ }
};
export const savedAccounts = (): SavedAccount[] => { try { return JSON.parse(localStorage.getItem(ACCTS_KEY) || '[]') as SavedAccount[]; } catch { return []; } };
const saveAccounts = (l: SavedAccount[]) => { try { localStorage.setItem(ACCTS_KEY, JSON.stringify(l.slice(0, 6))); } catch { /* private mode */ } };
export const displayName = (u: { username?: string; handle?: string | null } | null | undefined) => (u?.handle || (u?.username ?? '').split('@')[0] || '?');

/** Headers that tell the server who is asking: the browser id for guests, plus the session for a member. */
export const authHeaders = (): Record<string, string> => ({ 'x-visitor-id': visitorId(), ...(getToken() ? { 'x-session': getToken() } : {}) });

// a friend's invite link (?ref=code) is kept until the visitor signs up
try { const r = new URLSearchParams(window.location.search).get('ref'); if (r && /^[0-9a-f]{8}$/i.test(r)) localStorage.setItem('pe-ref', r.toLowerCase()); } catch { /* no storage */ }
export const savedRef = () => { try { return localStorage.getItem('pe-ref') || undefined; } catch { return undefined; } };

export class AccountError extends Error { code?: string; email?: string; constructor(m: string, code?: string, email?: string) { super(localizeError(m)); this.code = code; this.email = email; } }
export async function accountApi(op: string, body: Record<string, unknown> = {}) {
  let res: Response;
  try { res = await fetch(ACCOUNT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ op, visitor: visitorId(), ...body }) }); }
  catch { throw new AccountError('network'); }
  const out = await res.json().catch(() => ({}));
  if (!res.ok || out.error) throw new AccountError(out.error || `HTTP ${res.status}`, out.code, out.email);
  return out;
}
export async function accountGet(qs: string) {
  const res = await fetch(`${ACCOUNT_URL}?${qs}`, { headers: authHeaders() });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || out.error) throw new Error(out.error || `HTTP ${res.status}`);
  return out;
}
/** Show what was seen last time at once, then swap in the fresh answer (the network to China can be slow). */
export function accountSwr<T>(qs: string, onData: (d: T) => void): Promise<void> {
  const key = `pe-swr:${qs}`;
  try { const c = localStorage.getItem(key); if (c) onData(JSON.parse(c) as T); } catch { /* no cache */ }
  return accountGet(qs).then((d) => { try { localStorage.setItem(key, JSON.stringify(d)); } catch { /* full */ } onData(d as T); });
}
/** Usage events for the admin funnel. Never blocks the page. */
export function track(type: string, extra: Record<string, unknown> = {}) {
  accountApi('event', { type, path: location.pathname + location.hash, ...extra }).catch(() => undefined);
}

export type AuthMode = 'login' | 'register' | 'forgot' | { kind: 'reset'; token: string } | { kind: 'check-email'; email: string } | { kind: 'message'; title: string; body: string };
type Ctx = {
  me: Me | null; user: Member | null; quota: Quota | null; ready: boolean;
  refresh: () => Promise<void>;
  /** Log in or sign up; the answer's session becomes the current one. */
  signIn: (op: 'login' | 'register', body: Record<string, unknown>) => Promise<{ pending?: boolean; email?: string }>;
  adopt: (token: string, user: Member) => void;
  signOut: () => Promise<void>;
  accounts: SavedAccount[];
  switchTo: (a: SavedAccount) => void;
  auth: AuthMode | null;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
};
const AccountCtx = createContext<Ctx | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(() => { try { const c = getToken() ? localStorage.getItem('pe-me') : null; return c ? (JSON.parse(c) as Me) : null; } catch { return null; } });
  const [ready, setReady] = useState(false);
  const [auth, setAuth] = useState<AuthMode | null>(null);
  const [accounts, setAccounts] = useState<SavedAccount[]>(savedAccounts);

  const remember = (token: string, u: { id: string; username: string; handle?: string | null }) => {
    const l = [{ id: u.id, token, user: { id: u.id, username: u.username, handle: u.handle ?? null } }, ...savedAccounts().filter((a) => a.id !== u.id)];
    saveAccounts(l); setAccounts(l);
  };

  const refresh = useCallback(async () => {
    try {
      const sent = getToken();
      const m = (await accountGet('me=1')) as Me;
      if (getToken() !== sent) return;   // signed in or out meanwhile: a newer answer is on its way
      if (!m.user && sent) { setToken(''); const l = savedAccounts().filter((a) => a.token !== sent); saveAccounts(l); setAccounts(l); }
      if (m.user && sent) {   // the signed-in account is always remembered, so it can be switched back to after adding another
        const u = { id: m.user.id, username: m.user.username, handle: m.user.handle ?? null };
        const cur = savedAccounts();
        const l = cur.some((a) => a.token === sent) ? cur.map((a) => (a.token === sent ? { ...a, id: u.id, user: u } : a)) : [{ id: u.id, token: sent, user: u }, ...cur.filter((a) => a.id !== u.id)];
        saveAccounts(l); setAccounts(l);
      }
      setMe(m);
      try { if (m.user) localStorage.setItem('pe-me', JSON.stringify(m)); else localStorage.removeItem('pe-me'); } catch { /* private mode */ }
    } catch { /* offline: keep what we have */ } finally { setReady(true); }
  }, []);

  useEffect(() => {
    refresh();
    const onVisible = () => { if (document.visibilityState === 'visible' && getToken()) refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    try { if (!sessionStorage.getItem('pe-visit')) { sessionStorage.setItem('pe-visit', '1'); track('visit', { ref: document.referrer.slice(0, 80) }); } } catch { /* ignore */ }
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const adopt = useCallback((token: string, u: Member) => {
    setToken(token); remember(token, u);
    setMe((m) => (m ? { ...m, user: u } : m));
    refresh();
  }, [refresh]);

  // links from e-mails: ?verify=<token> confirms the address, ?reset=<token> opens the new-password form
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get('verify'), r = q.get('reset');
    const clean = () => { try { q.delete('verify'); q.delete('reset'); const s = q.toString(); history.replaceState(null, '', location.pathname + (s ? `?${s}` : '') + location.hash); } catch { /* ignore */ } };
    if (v) {
      accountApi('verify_email', { token: v })
        .then((out) => { adopt(out.token, out.user); setAuth({ kind: 'message', title: 'verified', body: '' }); })
        .catch((e: Error) => setAuth({ kind: 'message', title: 'badlink', body: e.message }))
        .finally(clean);
    } else if (r) { setAuth({ kind: 'reset', token: r }); clean(); }
  }, [adopt]);

  const value = useMemo<Ctx>(() => ({
    me, user: me?.user ?? null, quota: me?.quota ?? null, ready, refresh, adopt,
    signIn: async (op, body) => {
      const out = await accountApi(op, { ...body, ...(op === 'register' ? { ref: savedRef() } : {}) });
      if (out.pending) return { pending: true, email: out.email };
      setToken(out.token); remember(out.token, out.user);
      setMe((m) => (m ? { ...m, user: out.user, quota: out.quota } : m));
      await refresh();
      return {};
    },
    signOut: async () => {
      const t = getToken();
      try { await accountApi('logout'); } catch { /* dropped locally either way */ }
      setToken('');
      const l = savedAccounts().filter((a) => a.token !== t); saveAccounts(l); setAccounts(l);
      await refresh();
    },
    accounts,
    switchTo: (a) => { setToken(a.token); setMe(null); refresh(); },
    auth,
    openAuth: (mode = 'register') => { track('open_signup'); setAuth(mode); },
    closeAuth: () => setAuth(null),
  }), [me, ready, refresh, adopt, auth, accounts]);

  return <AccountCtx.Provider value={value}>{children}</AccountCtx.Provider>;
}

export function useAccount(): Ctx {
  const c = useContext(AccountCtx);
  if (!c) throw new Error('AccountProvider missing');
  return c;
}

/** Plan name as shown to people. */
export const planLabel = (p?: string | null) => (p === 'premium' ? 'Premium' : p === 'pro' ? 'Pro' : p === 'plus' ? 'Plus' : 'Free');
