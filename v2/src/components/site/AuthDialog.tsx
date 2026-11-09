import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mark } from '@/components/brand';
import { AccountError, accountApi, accountGet, displayName, useAccount, type AuthMode } from '@/lib/account';
import { usePrefs, type Lang } from '@/lib/prefs';
import { COMMON } from '@/lib/strings';
import { Link } from 'react-router-dom';

const COUNTRIES = 'VN CN ID US SG MY TH PH JP KR IN HK TW MO GB AU CA DE FR ES IT NL SE CH BR MX AE SA TR RU PK BD LK NP EG NG ZA KE NZ IE PL UA IL AR CL CO'.split(' ');
const T = {
  loginT: { en: 'Welcome back', zh: '欢迎回来', vi: 'Chào mừng trở lại', id: 'Selamat datang kembali' },
  loginS: { en: 'Log in to continue learning.', zh: '登录后继续学习。', vi: 'Đăng nhập để học tiếp.', id: 'Masuk untuk melanjutkan belajar.' },
  regT: { en: 'Create your free account', zh: '创建免费账户', vi: 'Tạo tài khoản miễn phí', id: 'Buat akun gratis' },
  regS: { en: '3 welcome videos, then 1 free video every day.', zh: '赠送 3 个视频，之后每天 1 个免费视频。', vi: 'Tặng 3 video, sau đó mỗi ngày 1 video miễn phí.', id: '3 video sambutan, lalu 1 video gratis setiap hari.' },
  ident: { en: 'Email or username', zh: '邮箱或用户名', vi: 'Email hoặc tên người dùng', id: 'Email atau nama pengguna' },
  email: { en: 'Email', zh: '邮箱', vi: 'Email', id: 'Email' },
  handle: { en: 'Username', zh: '用户名', vi: 'Tên người dùng', id: 'Nama pengguna' },
  handleHint: { en: 'Letters, numbers and _ . You can log in with it.', zh: '字母、数字、_，可以用它登录。', vi: 'Chữ, số và _ . Có thể dùng để đăng nhập.', id: 'Huruf, angka, dan _ . Bisa dipakai untuk masuk.' },
  pw: { en: 'Password', zh: '密码', vi: 'Mật khẩu', id: 'Kata sandi' },
  pwHint: { en: '8 characters or more', zh: '至少 8 位', vi: 'Tối thiểu 8 ký tự', id: 'Minimal 8 karakter' },
  country: { en: 'Country', zh: '国家/地区', vi: 'Quốc gia', id: 'Negara' },
  plang: { en: 'Language you learn in', zh: '学习语言', vi: 'Ngôn ngữ học', id: 'Bahasa belajar' },
  pickOne: { en: 'Choose', zh: '请选择', vi: 'Chọn', id: 'Pilih' },
  source: { en: 'How did you hear about us? (optional)', zh: '从哪里知道我们？（可选）', vi: 'Bạn biết chúng tôi từ đâu? (không bắt buộc)', id: 'Dari mana Anda tahu kami? (opsional)' },
  role: { en: 'You are a (optional)', zh: '你的身份（可选）', vi: 'Bạn là (không bắt buộc)', id: 'Anda seorang (opsional)' },
  sources: { en: ['Friend', 'Social media', 'Search', 'Class or teacher', 'Other'], zh: ['朋友', '社交媒体', '搜索', '课堂或老师', '其他'], vi: ['Bạn bè', 'Mạng xã hội', 'Tìm kiếm', 'Lớp học hoặc giảng viên', 'Khác'], id: ['Teman', 'Media sosial', 'Pencarian', 'Kelas atau dosen', 'Lainnya'] },
  roles: { en: ['Student', 'Researcher', 'Teacher', 'Professional', 'Other'], zh: ['学生', '研究者', '教师', '职场人士', '其他'], vi: ['Sinh viên', 'Nhà nghiên cứu', 'Giảng viên', 'Người đi làm', 'Khác'], id: ['Mahasiswa', 'Peneliti', 'Pengajar', 'Profesional', 'Lainnya'] },
  login: { en: 'Log in', zh: '登录', vi: 'Đăng nhập', id: 'Masuk' },
  create: { en: 'Create account', zh: '创建账户', vi: 'Tạo tài khoản', id: 'Buat akun' },
  toReg: { en: 'No account yet?', zh: '还没有账户？', vi: 'Chưa có tài khoản?', id: 'Belum punya akun?' },
  toRegB: { en: 'Sign up free', zh: '免费注册', vi: 'Đăng ký miễn phí', id: 'Daftar gratis' },
  toLogin: { en: 'Already have an account?', zh: '已有账户？', vi: 'Đã có tài khoản?', id: 'Sudah punya akun?' },
  forgot: { en: 'Forgot password?', zh: '忘记密码？', vi: 'Quên mật khẩu?', id: 'Lupa kata sandi?' },
  forgotT: { en: 'Reset your password', zh: '重置密码', vi: 'Đặt lại mật khẩu', id: 'Atur ulang kata sandi' },
  forgotS: { en: 'We will email you a link to choose a new password.', zh: '我们会发邮件给你一个设置新密码的链接。', vi: 'Chúng tôi sẽ gửi email kèm liên kết để đặt mật khẩu mới.', id: 'Kami akan mengirim email berisi tautan untuk kata sandi baru.' },
  sendLink: { en: 'Send link', zh: '发送链接', vi: 'Gửi liên kết', id: 'Kirim tautan' },
  linkSent: { en: 'If that email has an account, the link is on its way. It works for one hour.', zh: '如果该邮箱已注册，链接已发出，一小时内有效。', vi: 'Nếu email này có tài khoản, liên kết đang được gửi. Có hiệu lực trong một giờ.', id: 'Jika email itu terdaftar, tautan sedang dikirim. Berlaku satu jam.' },
  newPwT: { en: 'Choose a new password', zh: '设置新密码', vi: 'Chọn mật khẩu mới', id: 'Pilih kata sandi baru' },
  newPw: { en: 'New password', zh: '新密码', vi: 'Mật khẩu mới', id: 'Kata sandi baru' },
  setPw: { en: 'Save and log in', zh: '保存并登录', vi: 'Lưu và đăng nhập', id: 'Simpan dan masuk' },
  checkT: { en: 'Confirm your email', zh: '请确认邮箱', vi: 'Xác nhận email', id: 'Konfirmasi email Anda' },
  checkS: { en: 'We sent a link to {e}. Open it to finish signing up.', zh: '我们已向 {e} 发送链接，打开即可完成注册。', vi: 'Chúng tôi đã gửi liên kết tới {e}. Mở liên kết để hoàn tất đăng ký.', id: 'Kami mengirim tautan ke {e}. Buka untuk menyelesaikan pendaftaran.' },
  resend: { en: 'Send again', zh: '重新发送', vi: 'Gửi lại', id: 'Kirim ulang' },
  resent: { en: 'Sent again.', zh: '已重新发送。', vi: 'Đã gửi lại.', id: 'Sudah dikirim ulang.' },
  verified: { en: 'Your email is confirmed. Welcome to Paperlit!', zh: '邮箱已确认，欢迎使用 Paperlit！', vi: 'Email đã được xác nhận. Chào mừng đến với Paperlit!', id: 'Email Anda terkonfirmasi. Selamat datang di Paperlit!' },
  badlink: { en: 'This link does not work any more', zh: '链接已失效', vi: 'Liên kết không còn dùng được', id: 'Tautan ini sudah tidak berlaku' },
  ok: { en: 'Continue', zh: '继续', vi: 'Tiếp tục', id: 'Lanjut' },
  agree: { en: 'By continuing you agree to the', zh: '继续即表示同意', vi: 'Tiếp tục nghĩa là bạn đồng ý với', id: 'Dengan melanjutkan Anda menyetujui' },
  and: { en: 'and', zh: '和', vi: 'và', id: 'dan' },
  saved: { en: 'Saved on this device', zh: '本设备上的账户', vi: 'Đã lưu trên thiết bị này', id: 'Tersimpan di perangkat ini' },
  needC: { en: 'Choose your country.', zh: '请选择国家/地区。', vi: 'Hãy chọn quốc gia.', id: 'Pilih negara Anda.' },
  needL: { en: 'Choose your language.', zh: '请选择语言。', vi: 'Hãy chọn ngôn ngữ.', id: 'Pilih bahasa Anda.' },
  showPw: { en: 'Show password', zh: '显示密码', vi: 'Hiện mật khẩu', id: 'Tampilkan kata sandi' },
};

export function AuthDialog() {
  const { auth, closeAuth, openAuth, signIn, adopt, accounts, user, switchTo } = useAccount();
  const { lang, t } = usePrefs();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ ident: '', email: '', handle: '', pw: '', country: '', plang: lang as string, source: '', role: '' });
  const mode: AuthMode | null = auth;
  const kind = typeof mode === 'string' ? mode : mode?.kind ?? null;

  useEffect(() => { setErr(''); setNote(''); setBusy(false); }, [kind]);
  useEffect(() => {
    if (kind !== 'register' || f.country) return;
    accountGet('whereami=1').then((o: { country?: string }) => { if (o.country && COUNTRIES.includes(o.country)) setF((x) => (x.country ? x : { ...x, country: o.country! })); }).catch(() => undefined);
  }, [kind, f.country]);

  const countries = useMemo(() => {
    let dn: Intl.DisplayNames | null = null;
    try { dn = new Intl.DisplayNames([lang === 'zh' ? 'zh-CN' : lang], { type: 'region' }); } catch { /* old browser */ }
    return COUNTRIES.map((c) => [c, dn?.of(c) ?? c] as const);
  }, [lang]);

  const fail = (e: unknown) => {
    const x = e as AccountError;
    if (x.code === 'need_verify') { openAuth({ kind: 'check-email', email: x.email || f.email || f.ident }); return; }
    setErr(x.message === 'network' ? t(COMMON.network) : x.message);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (kind === 'login') {
        await signIn('login', { username: f.ident.trim(), password: f.pw });
        closeAuth();
      } else if (kind === 'register') {
        if (!f.country) throw new AccountError(t(T.needC));
        if (!f.plang) throw new AccountError(t(T.needL));
        const em = f.email.trim();
        const out = await signIn('register', { username: em, email: em, handle: f.handle.trim().toLowerCase(), password: f.pw, country: f.country, lang: f.plang, source: f.source, role: f.role, app: 'paperlit' });
        if (out.pending) openAuth({ kind: 'check-email', email: out.email || em }); else closeAuth();
      } else if (kind === 'forgot') {
        await accountApi('reset_request', { username: f.ident.trim(), lang, app: 'paperlit' });
        setNote(t(T.linkSent));
      } else if (kind === 'reset' && typeof mode === 'object' && mode.kind === 'reset') {
        const out = await accountApi('reset_confirm', { token: mode.token, password: f.pw });
        if (out.token && out.user) adopt(out.token, out.user);
        closeAuth();
      }
    } catch (x) { fail(x); } finally { setBusy(false); }
  };
  const resend = async (email: string) => { try { await accountApi('resend_verify', { username: email, lang, app: 'paperlit' }); setNote(t(T.resent)); } catch (x) { fail(x); } };

  if (!mode) return null;
  const pwField = (label: string, auto: string) => (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="pl-pw">{label}</Label>
        {kind === 'login' && <button type="button" onClick={() => openAuth('forgot')} className="text-xs font-medium text-primary hover:underline">{t(T.forgot)}</button>}
      </div>
      <div className="relative">
        <Input id="pl-pw" type={show ? 'text' : 'password'} required minLength={kind === 'login' ? 1 : 8} autoComplete={auto} value={f.pw} onChange={(e) => setF({ ...f, pw: e.target.value })} className="pr-10" />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label={t(T.showPw)}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
      </div>
      {kind !== 'login' && <p className="text-xs text-muted-foreground">{t(T.pwHint)}</p>}
    </div>
  );
  const sel = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';
  const title = kind === 'login' ? t(T.loginT) : kind === 'register' ? t(T.regT) : kind === 'forgot' ? t(T.forgotT) : kind === 'reset' ? t(T.newPwT) : kind === 'check-email' ? t(T.checkT)
    : typeof mode === 'object' && mode.kind === 'message' ? (mode.title === 'verified' ? t(T.verified) : t(T.badlink)) : '';
  const others = accounts.filter((a) => a.id !== user?.id);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) closeAuth(); }}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-[440px]">
        <DialogHeader className="items-center text-center">
          <Mark className="mb-1 h-10 w-10" />
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
          <DialogDescription>
            {kind === 'login' ? t(T.loginS) : kind === 'register' ? t(T.regS) : kind === 'forgot' ? t(T.forgotS)
              : kind === 'check-email' && typeof mode === 'object' && mode.kind === 'check-email' ? t(T.checkS).replace('{e}', mode.email)
              : typeof mode === 'object' && mode.kind === 'message' ? mode.body : ''}
          </DialogDescription>
        </DialogHeader>

        {kind === 'check-email' && typeof mode === 'object' && mode.kind === 'check-email' && (
          <div className="grid gap-3 text-center">
            <MailCheck className="mx-auto h-10 w-10 text-primary" />
            {note && <p className="text-sm text-success">{note}</p>}
            {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
            <Button variant="outline" onClick={() => resend(mode.email)}>{t(T.resend)}</Button>
          </div>
        )}
        {kind === 'message' && <Button onClick={closeAuth}>{t(T.ok)}</Button>}

        {(kind === 'login' || kind === 'register' || kind === 'forgot' || kind === 'reset') && (
          <form onSubmit={submit} className="grid gap-4">
            {kind === 'login' && others.length > 0 && (
              <div className="grid gap-2 rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">{t(T.saved)}</p>
                {others.map((a) => (
                  <button key={a.id} type="button" onClick={() => { switchTo(a); closeAuth(); }} className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-left text-sm hover:ring-1 hover:ring-primary">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{displayName(a.user)[0]?.toUpperCase()}</span>
                    <span className="truncate">{displayName(a.user)}</span>
                    <span className="ml-auto truncate text-xs text-muted-foreground">{a.user.username}</span>
                  </button>
                ))}
              </div>
            )}
            {(kind === 'login' || kind === 'forgot') && (
              <div className="grid gap-1.5">
                <Label htmlFor="pl-id">{kind === 'forgot' ? t(T.email) : t(T.ident)}</Label>
                <Input id="pl-id" required autoComplete="username" value={f.ident} onChange={(e) => setF({ ...f, ident: e.target.value })} autoFocus />
              </div>
            )}
            {kind === 'register' && (
              <>
                <div className="grid gap-1.5"><Label htmlFor="pl-em">{t(T.email)}</Label><Input id="pl-em" type="email" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoFocus /></div>
                <div className="grid gap-1.5">
                  <Label htmlFor="pl-h">{t(T.handle)}</Label>
                  <Input id="pl-h" required pattern="[A-Za-z0-9_.]{3,24}" maxLength={24} autoComplete="username" value={f.handle} onChange={(e) => setF({ ...f, handle: e.target.value })} />
                  <p className="text-xs text-muted-foreground">{t(T.handleHint)}</p>
                </div>
              </>
            )}
            {kind !== 'forgot' && pwField(kind === 'reset' ? t(T.newPw) : t(T.pw), kind === 'login' ? 'current-password' : 'new-password')}
            {kind === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label htmlFor="pl-c">{t(T.country)}</Label>
                    <select id="pl-c" required className={sel} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}>
                      <option value="">{t(T.pickOne)}</option>{countries.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                    </select></div>
                  <div className="grid gap-1.5"><Label htmlFor="pl-l">{t(T.plang)}</Label>
                    <select id="pl-l" required className={sel} value={f.plang} onChange={(e) => setF({ ...f, plang: e.target.value })}>
                      <option value="en">English</option><option value="zh">中文</option><option value="vi">Tiếng Việt</option><option value="id">Bahasa Indonesia</option>
                    </select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label htmlFor="pl-s" className="text-xs font-normal text-muted-foreground">{t(T.source)}</Label>
                    <select id="pl-s" className={sel} value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}><option value="" />{opts(lang, T.sources).map((o, i) => <option key={o} value={['friend', 'social', 'search', 'class', 'other'][i]}>{o}</option>)}</select></div>
                  <div className="grid gap-1.5"><Label htmlFor="pl-r" className="text-xs font-normal text-muted-foreground">{t(T.role)}</Label>
                    <select id="pl-r" className={sel} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option value="" />{opts(lang, T.roles).map((o, i) => <option key={o} value={['student', 'researcher', 'teacher', 'professional', 'other'][i]}>{o}</option>)}</select></div>
                </div>
              </>
            )}
            {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{err}</p>}
            {note && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success" role="status">{note}</p>}
            <Button type="submit" size="lg" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {kind === 'login' ? t(T.login) : kind === 'register' ? t(T.create) : kind === 'forgot' ? t(T.sendLink) : t(T.setPw)}
            </Button>
            {kind === 'register' && <p className="text-center text-xs text-muted-foreground">{t(T.agree)} <Link to="/terms" onClick={closeAuth} className="underline">{t(COMMON.terms)}</Link> {t(T.and)} <Link to="/privacy" onClick={closeAuth} className="underline">{t(COMMON.privacy)}</Link>.</p>}
            <p className="text-center text-sm text-muted-foreground">
              {kind === 'register' ? <>{t(T.toLogin)} <button type="button" className="font-medium text-primary hover:underline" onClick={() => openAuth('login')}>{t(T.login)}</button></>
                : kind === 'login' ? <>{t(T.toReg)} <button type="button" className="font-medium text-primary hover:underline" onClick={() => openAuth('register')}>{t(T.toRegB)}</button></>
                : <button type="button" className="font-medium text-primary hover:underline" onClick={() => openAuth('login')}>{t(T.login)}</button>}
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

const opts = (lang: Lang, v: Record<Lang, string[]>) => v[lang] ?? v.en;
