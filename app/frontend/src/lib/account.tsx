import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePrefs } from '@/lib/prefs';
import { visitorId } from '@/lib/explainer';

export const ACCOUNT_URL = 'https://wzdkroxbfrlqijbeiwpk.supabase.co/functions/v1/explainer-account';
const TOKEN_KEY = 'pe-session';

export type Quota = { tier: 'guest' | 'member'; day_limit: number; day_used: number; day_left: number; credits: number; resets_in_min: number | null };
export type Member = { id: string; username: string; credits: number; created_at: string };
export type Pack = { credits: number; price: number };
type Me = { admin?: boolean; user: Member | null; quota: Quota; limits: { guest: number; member: number; welcome: number }; packs: Record<string, Pack> };

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
};
const setToken = (t: string) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode */
  }
};
/** Headers that tell the server who is asking: the browser id for guests, plus the session for a signed-in member. */
export const authHeaders = (): Record<string, string> => ({ 'x-visitor-id': visitorId(), ...(getToken() ? { 'x-session': getToken() } : {}) });

export async function accountApi(op: string, body: Record<string, unknown> = {}) {
  const res = await fetch(ACCOUNT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ op, visitor: visitorId(), ...body }) });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || out.error) throw new Error(out.error || `HTTP ${res.status}`);
  return out;
}
export async function accountGet(qs: string) {
  const res = await fetch(`${ACCOUNT_URL}?${qs}`, { headers: authHeaders() });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || out.error) throw new Error(out.error || `HTTP ${res.status}`);
  return out;
}
/** Usage events behind the admin funnel. Never blocks or breaks the page. */
export function track(type: string, extra: Record<string, unknown> = {}) {
  accountApi('event', { type, path: location.pathname + location.hash, ...extra }).catch(() => undefined);
}

type Ctx = {
  me: Me | null;
  user: Member | null;
  quota: Quota | null;
  refresh: () => Promise<void>;
  signIn: (op: 'login' | 'register', username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  authOpen: null | 'login' | 'register';
  openAuth: (mode?: 'login' | 'register') => void;
  closeAuth: () => void;
};
const AccountCtx = createContext<Ctx | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [authOpen, setAuthOpen] = useState<null | 'login' | 'register'>(null);

  const refresh = useCallback(async () => {
    try {
      const m = (await accountGet('me=1')) as Me;
      if (!m.user && getToken()) setToken('');   // the session ended on the server
      setMe(m);
    } catch { /* offline: keep what we have */ }
  }, []);

  // the navbar account (suite-account.js) signs in and out for every app: follow it
  useEffect(() => {
    const on = () => { refresh(); };
    window.addEventListener('suite-auth', on);
    return () => window.removeEventListener('suite-auth', on);
  }, [refresh]);

  useEffect(() => {
    refresh();
    try {
      if (!sessionStorage.getItem('pe-visit')) { sessionStorage.setItem('pe-visit', '1'); track('visit', { ref: document.referrer.slice(0, 80) }); }
    } catch { /* ignore */ }
  }, [refresh]);

  const value = useMemo<Ctx>(() => ({
    me,
    user: me?.user ?? null,
    quota: me?.quota ?? null,
    refresh,
    signIn: async (op, username, password) => {
      const out = await accountApi(op, { username, password });
      setToken(out.token);
      setMe((m) => (m ? { ...m, user: out.user, quota: out.quota } : m));   // the answer already carries the balance, no second round trip
      if (!me) await refresh();
      window.dispatchEvent(new Event('suite-auth'));
    },
    signOut: async () => {
      try { await accountApi('logout'); } catch { /* the token is dropped locally either way */ }
      setToken('');
      await refresh();
      window.dispatchEvent(new Event('suite-auth'));
    },
    authOpen,
    openAuth: (mode = 'register') => {
      track('open_signup');
      // one sign-in dialog for every app (the navbar account); the local one is only a fallback
      if ((window as unknown as { __suiteAccount?: boolean }).__suiteAccount) window.dispatchEvent(new CustomEvent('suite-open-auth', { detail: mode }));
      else setAuthOpen(mode);
    },
    closeAuth: () => setAuthOpen(null),
  }), [me, refresh, authOpen]);

  return <AccountCtx.Provider value={value}>{children}</AccountCtx.Provider>;
}

export function useAccount(): Ctx {
  const c = useContext(AccountCtx);
  if (!c) throw new Error('AccountProvider missing');
  return c;
}

// ---- text for the account, credits, contact and legal screens (English and Chinese)
const EN = {
  guest: 'Guest', freeLeft: '{n} of {m} free videos left today', creditsN: '{n} credits', signUp: 'Sign up free', logIn: 'Log in', logOut: 'Log out', myVideos: 'My account',
  guestHint: 'Sign up free for {m} videos a day and {w} welcome credits.', resetsIn: 'more in about {h} h',
  authTitleRegister: 'Create your free account', authTitleLogin: 'Welcome back', username: 'Email', password: 'Password', passwordHint: '8 characters or more',
  haveAccount: 'Already have an account? Log in', noAccount: 'No account yet? Sign up free', submitRegister: 'Create account', submitLogin: 'Log in',
  perks: 'Free account: {m} videos every day, {w} welcome credits, your videos saved in one place.', agree: 'By signing up you agree to the Terms and the Privacy policy.',
  close: 'Close', working: 'One moment...',
  acctTitle: 'My account', balance: 'Balance', freeToday: 'Free videos left today', credits: 'Credits', creditsNote: 'Credits never expire. They are used only after the free videos of the day.',
  buyCredits: 'Buy credits', pack: '{c} credits', packPrice: '¥{p}', packEach: '≈ ¥{e} per video', pay: 'Pay',
  history: 'Credit history', noHistory: 'Nothing yet.', videos: 'My videos', noVideos: 'No videos yet. Make your first one above.', open: 'Open', expired: 'Expired after 14 days', makeAgain: 'Make it again', making: 'In progress', failed: 'Failed (credits refunded)',
  changePw: 'Change password', oldPw: 'Current password', newPw: 'New password', save: 'Save', pwDone: 'Password changed.', loginFirst: 'Please log in to see your account.',
  contactTitle: 'Contact us', contactSub: 'A question, a bug, a paper that did not work, or a partnership: write to us. We read everything.',
  topic: 'Topic', topicQ: 'Question', topicBug: 'Something broke', topicIdea: 'Idea', topicBiz: 'Business', topicBilling: 'Billing',
  yourName: 'Your name (optional)', yourEmail: 'Email (so we can reply)', message: 'Message', send: 'Send message', sent: 'Thank you! Your message is in. We usually answer within a day.',
  faqTitle: 'Questions people ask',
  terms: 'Terms', privacy: 'Privacy', contact: 'Contact', account: 'Account',
  plansTitle: 'Free first. Pay only when you need more.', freeBadge: 'Free', perDay: 'for {n} videos a day', forVideos: 'for {n} videos',
  guestPlan: 'Guest', guestL1: '{g} free videos a day', guestL2: 'No sign-up needed', guestL3: 'English and 中文, 16:9 and 9:16',
  memberPlan: 'Free account', memberL1: '{m} free videos every day', memberL2: '{w} welcome credits to start', memberL3: 'Your videos saved in one place', memberL4: 'Priority when the queue is busy',
  packsPlan: 'Credit packs', packsL1: 'For heavy use, long videos and series', packsL2: 'Credits never expire', packsL3: 'Failed video: credits refunded automatically', packsL4: 'Pay with WeChat Pay or Alipay',
  needLogin: 'Log in to buy credits', orderMade: 'Order {id} created. Scan the code, pay, then tap "I have paid". Credits are added as soon as we confirm the payment.',
  limitGuest: 'You used your free guest videos.', limitMember: 'Your free videos for today are used.',
  limitGuestBody: 'Sign up free: {m} videos a day and {w} welcome credits, and your videos stay in your account.', limitMemberBody: 'Buy credits to keep going now, or come back tomorrow.',
  termsTitle: 'Terms of use', privacyTitle: 'Privacy policy', updated: 'Last updated 29 October 2026',
};
const ZH: typeof EN = {
  guest: '访客', freeLeft: '今日剩余免费视频 {n} / {m}', creditsN: '{n} 点额度', signUp: '免费注册', logIn: '登录', logOut: '退出登录', myVideos: '我的账户',
  guestHint: '免费注册后每天 {m} 个视频，另送 {w} 点额度。', resetsIn: '约 {h} 小时后恢复',
  authTitleRegister: '创建免费账户', authTitleLogin: '欢迎回来', username: '邮箱', password: '密码', passwordHint: '至少 8 位',
  haveAccount: '已有账户？去登录', noAccount: '还没有账户？免费注册', submitRegister: '创建账户', submitLogin: '登录',
  perks: '免费账户：每天 {m} 个视频，赠送 {w} 点额度，视频集中保存。', agree: '注册即表示同意服务条款和隐私政策。',
  close: '关闭', working: '请稍候...',
  acctTitle: '我的账户', balance: '余额', freeToday: '今日剩余免费视频', credits: '额度', creditsNote: '额度永不过期，仅在当天免费视频用完后才会扣除。',
  buyCredits: '购买额度', pack: '{c} 点额度', packPrice: '¥{p}', packEach: '约 ¥{e} / 个视频', pay: '付款',
  history: '额度记录', noHistory: '暂无记录。', videos: '我的视频', noVideos: '还没有视频，先在上方生成第一个吧。', open: '打开', expired: '已超过 14 天，视频已清理', makeAgain: '重新生成', making: '生成中', failed: '失败（额度已退还）',
  changePw: '修改密码', oldPw: '当前密码', newPw: '新密码', save: '保存', pwDone: '密码已修改。', loginFirst: '请先登录查看账户。',
  contactTitle: '联系我们', contactSub: '问题、故障、没跑通的论文或合作：都可以写给我们，每条我们都会看。',
  topic: '主题', topicQ: '提问', topicBug: '出了问题', topicIdea: '建议', topicBiz: '商务合作', topicBilling: '付款',
  yourName: '你的名字（可选）', yourEmail: '邮箱（方便我们回复）', message: '留言', send: '发送', sent: '谢谢！已收到你的留言，通常一天内回复。',
  faqTitle: '常见问题',
  terms: '条款', privacy: '隐私', contact: '联系', account: '账户',
  plansTitle: '先免费用，不够再付费。', freeBadge: '免费', perDay: '每天 {n} 个视频', forVideos: '可做 {n} 个视频',
  guestPlan: '访客', guestL1: '每天 {g} 个免费视频', guestL2: '无需注册', guestL3: '英文和中文，16:9 和 9:16',
  memberPlan: '免费账户', memberL1: '每天 {m} 个免费视频', memberL2: '赠送 {w} 点额度', memberL3: '视频集中保存', memberL4: '高峰期优先',
  packsPlan: '额度包', packsL1: '适合大量使用、长视频和系列视频', packsL2: '额度永不过期', packsL3: '视频失败自动退还额度', packsL4: '微信支付或支付宝付款',
  needLogin: '登录后购买额度', orderMade: '订单 {id} 已创建。扫码付款后点击"我已付款"，我们确认付款后立即加额度。',
  limitGuest: '访客免费视频已用完。', limitMember: '今日免费视频已用完。',
  limitGuestBody: '免费注册：每天 {m} 个视频，另送 {w} 点额度，视频保存在你的账户里。', limitMemberBody: '购买额度即可继续，或明天再来。',
  termsTitle: '使用条款', privacyTitle: '隐私政策', updated: '最后更新：2026 年 10 月 29 日',
};
export type AcctKey = keyof typeof EN;
export function useAcctText() {
  const { lang } = usePrefs();
  const dict = lang === 'zh' ? ZH : EN;
  return (k: AcctKey, vars: Record<string, string | number> = {}) => Object.entries(vars).reduce((s, [a, b]) => s.split(`{${a}}`).join(String(b)), dict[k]);
}
