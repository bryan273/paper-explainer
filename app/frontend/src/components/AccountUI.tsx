import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useAcctText } from '@/lib/account';

/** One quiet line under the form: how many free videos are left. Signing in and out lives in the navbar only. */
export function AccountStrip() {
  const { user, quota, me, openAuth } = useAccount();
  const a = useAcctText();
  if (!quota || !me) return null;
  const left = a('freeLeft', { n: quota.day_left, m: quota.day_limit });
  const reset = quota.day_left === 0 && quota.resets_in_min ? ` · ${a('resetsIn', { h: Math.max(1, Math.ceil(quota.resets_in_min / 60)) })}` : '';
  return (
    <p className="small muted" style={{ margin: '14px 2px 0', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      <span>{left}{reset}</span>
      {user && <span>· {a('creditsN', { n: user.credits })}</span>}
      {!user && (
        <>
          <span>·</span>
          <button type="button" className="linkbtn" onClick={() => openAuth('register')}>{a('guestHint', { m: me.limits.member, w: me.limits.welcome })}</button>
        </>
      )}
    </p>
  );
}

/** Sign-up / log-in dialog. */
export function AuthModal() {
  const { authOpen, closeAuth, signIn, me } = useAccount();
  const a = useAcctText();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (authOpen) { setMode(authOpen); setErr(''); } }, [authOpen]);
  useEffect(() => {
    if (!authOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAuth(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [authOpen, closeAuth]);
  if (!authOpen) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await signIn(mode, username.trim(), password);
      setPassword('');
      closeAuth();
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={mode === 'register' ? a('authTitleRegister') : a('authTitleLogin')}
      onMouseDown={(e) => { if (e.target === e.currentTarget) closeAuth(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,8,20,.62)', display: 'grid', placeItems: 'center', padding: 16 }}>
      <form className="card stack" onSubmit={submit} style={{ width: '100%', maxWidth: 400, margin: 0 }}>
        <div className="row between">
          <h3 style={{ font: '700 20px var(--display)', margin: 0 }}>{mode === 'register' ? a('authTitleRegister') : a('authTitleLogin')}</h3>
          <button type="button" className="btn ghost small" onClick={closeAuth} aria-label={a('close')}>×</button>
        </div>
        {mode === 'register' && me && <p className="small muted" style={{ margin: 0 }}>{a('perks', { m: me.limits.member, w: me.limits.welcome })}</p>}
        <label className="field">{a('username')}
          <input type="email" inputMode="email" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={80} required autoFocus />
        </label>
        <label className="field">{a('password')}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={8} maxLength={72} required placeholder={mode === 'register' ? a('passwordHint') : ''} />
        </label>
        {err && <p className="err" role="alert" style={{ margin: 0 }}>{err}</p>}
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? <span className="spin" aria-hidden /> : null}
          {mode === 'register' ? a('submitRegister') : a('submitLogin')}
        </button>
        <button type="button" className="btn ghost small" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setErr(''); }}>
          {mode === 'register' ? a('haveAccount') : a('noAccount')}
        </button>
        {mode === 'register' && <p className="small muted" style={{ margin: 0 }}>{a('agree')} <Link to="/terms" onClick={closeAuth}>{a('terms')}</Link> · <Link to="/privacy" onClick={closeAuth}>{a('privacy')}</Link></p>}
      </form>
    </div>
  );
}

/** Shown in place of a plain error when the free videos are used up: a member is pointed to credits, a guest to sign-up. */
export function LimitPanel({ code }: { code: 'quota_guest' | 'quota_member' }) {
  const { openAuth, me } = useAccount();
  const a = useAcctText();
  const guest = code === 'quota_guest';
  return (
    <div className="note fade" role="alert" style={{ marginTop: 16 }}>
      <strong>{guest ? a('limitGuest') : a('limitMember')}</strong>
      <p className="small" style={{ margin: '6px 0 12px' }}>
        {guest ? a('limitGuestBody', { m: me?.limits.member ?? 8, w: me?.limits.welcome ?? 3 }) : a('limitMemberBody')}
      </p>
      <div className="row" style={{ gap: 8 }}>
        {guest ? (
          <>
            <button type="button" className="btn primary small" onClick={() => openAuth('register')}>{a('signUp')}</button>
            <button type="button" className="btn ghost small" onClick={() => openAuth('login')}>{a('logIn')}</button>
          </>
        ) : (
          <Link className="btn primary small" to="/account#buy">{a('buyCredits')}</Link>
        )}
      </div>
    </div>
  );
}
