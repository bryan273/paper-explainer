import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, CreditCard, GraduationCap, Gift, KeyRound, Loader2, Palette, User, Users, LogOut, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { StudentVerify } from '@/components/billing/StudentVerify';
import { InviteCard } from '@/components/app/InviteCard';
import { Avatar, PlanBadge } from '@/components/site/menus';
import { accountApi, accountSwr, displayName, useAccount } from '@/lib/account';
import { LANGS, fill, usePrefs } from '@/lib/prefs';
import { PURPOSE, useSettings, type Level, type Purpose } from '@/lib/settings';
import { COMMON, dateFmt } from '@/lib/strings';
import { cn } from '@/lib/utils';

const A = {
  h: { en: 'Account and settings', zh: '账户与设置', vi: 'Tài khoản và cài đặt', id: 'Akun dan pengaturan' },
  login: { en: 'Log in to see your account.', zh: '请先登录查看账户。', vi: 'Hãy đăng nhập để xem tài khoản.', id: 'Masuk untuk melihat akun Anda.' },
  tabs: {
    profile: { en: 'Profile', zh: '个人资料', vi: 'Hồ sơ', id: 'Profil' },
    billing: { en: 'Plan and billing', zh: '套餐与账单', vi: 'Gói và thanh toán', id: 'Paket dan tagihan' },
    students: { en: 'Students and teachers', zh: '学生与教师', vi: 'Sinh viên và giảng viên', id: 'Mahasiswa dan pengajar' },
    invite: { en: 'Invite friends', zh: '邀请好友', vi: 'Mời bạn bè', id: 'Undang teman' },
    prefs: { en: 'Preferences', zh: '偏好设置', vi: 'Tùy chọn', id: 'Preferensi' },
    security: { en: 'Password', zh: '密码', vi: 'Mật khẩu', id: 'Kata sandi' },
    accounts: { en: 'Accounts on this device', zh: '本设备的账户', vi: 'Tài khoản trên thiết bị', id: 'Akun di perangkat ini' },
  },
  email: { en: 'Email', zh: '邮箱', vi: 'Email', id: 'Email' },
  handle: { en: 'Username', zh: '用户名', vi: 'Tên người dùng', id: 'Nama pengguna' },
  handleHint: { en: 'You can log in with it. Letters, numbers, dots and _.', zh: '可用于登录。字母、数字、点和下划线。', vi: 'Dùng được để đăng nhập. Chữ, số, dấu chấm và _.', id: 'Bisa dipakai untuk masuk. Huruf, angka, titik, dan _.' },
  joined: { en: 'Member since {d}', zh: '注册于 {d}', vi: 'Thành viên từ {d}', id: 'Anggota sejak {d}' },
  plan: { en: 'Current plan', zh: '当前套餐', vi: 'Gói hiện tại', id: 'Paket saat ini' },
  until: { en: 'Until {d} ({n} days left)', zh: '至 {d}（剩 {n} 天）', vi: 'Đến {d} (còn {n} ngày)', id: 'Sampai {d} (sisa {n} hari)' },
  freePlan: { en: 'You are on the free plan.', zh: '你正在使用免费版。', vi: 'Bạn đang dùng gói miễn phí.', id: 'Anda memakai paket gratis.' },
  change: { en: 'Change plan', zh: '更换套餐', vi: 'Đổi gói', id: 'Ganti paket' },
  balance: { en: 'Videos you can make', zh: '可制作视频', vi: 'Video có thể tạo', id: 'Video yang bisa dibuat' },
  free: { en: 'Free today', zh: '今日免费', vi: 'Miễn phí hôm nay', id: 'Gratis hari ini' },
  credits: { en: 'Credits', zh: '额度', vi: 'Tín dụng', id: 'Kredit' },
  creditsNote: { en: 'Credits never expire. They are used after the free video of the day.', zh: '额度永不过期，在当日免费视频用完后使用。', vi: 'Tín dụng không hết hạn. Được dùng sau video miễn phí trong ngày.', id: 'Kredit tidak kedaluwarsa. Dipakai setelah video gratis hari itu.' },
  interactive: { en: 'Interactive videos this month', zh: '本月互动视频', vi: 'Video tương tác tháng này', id: 'Video interaktif bulan ini' },
  buy: { en: 'Buy more videos', zh: '购买更多视频', vi: 'Mua thêm video', id: 'Beli video lagi' },
  history: { en: 'Credit history', zh: '额度记录', vi: 'Lịch sử tín dụng', id: 'Riwayat kredit' },
  noHistory: { en: 'Nothing yet.', zh: '暂无记录。', vi: 'Chưa có gì.', id: 'Belum ada.' },
  orders: { en: 'Orders', zh: '订单', vi: 'Đơn hàng', id: 'Pesanan' },
  noOrders: { en: 'No orders yet.', zh: '暂无订单。', vi: 'Chưa có đơn hàng.', id: 'Belum ada pesanan.' },
  st: { new: { en: 'Waiting for payment', zh: '待付款', vi: 'Chờ thanh toán', id: 'Menunggu pembayaran' }, paid_claimed: { en: 'Checking payment', zh: '核对付款中', vi: 'Đang kiểm tra', id: 'Sedang dicek' }, paid: { en: 'Paid', zh: '已付款', vi: 'Đã thanh toán', id: 'Lunas' }, delivered: { en: 'Done', zh: '已完成', vi: 'Hoàn tất', id: 'Selesai' }, cancelled: { en: 'Cancelled', zh: '已取消', vi: 'Đã hủy', id: 'Dibatalkan' } } as Record<string, Record<'en' | 'zh' | 'vi' | 'id', string>>,
  lang: { en: 'Language', zh: '语言', vi: 'Ngôn ngữ', id: 'Bahasa' },
  theme: { en: 'Dark mode', zh: '深色模式', vi: 'Chế độ tối', id: 'Mode gelap' },
  size: { en: 'Text size', zh: '字号', vi: 'Cỡ chữ', id: 'Ukuran teks' },
  sizes: { en: ['Small', 'Normal', 'Large'], zh: ['小', '标准', '大'], vi: ['Nhỏ', 'Vừa', 'Lớn'], id: ['Kecil', 'Normal', 'Besar'] },
  font: { en: 'Font', zh: '字体', vi: 'Phông chữ', id: 'Huruf' },
  fonts: { en: ['Modern', 'Serif', 'System'], zh: ['现代', '衬线', '系统'], vi: ['Hiện đại', 'Có chân', 'Hệ thống'], id: ['Modern', 'Serif', 'Sistem'] },
  motion: { en: 'Animations', zh: '动画', vi: 'Hiệu ứng chuyển động', id: 'Animasi' },
  personal: { en: 'Personalize answers', zh: '个性化回答', vi: 'Cá nhân hóa câu trả lời', id: 'Personalisasi jawaban' },
  personalP: { en: 'Answers, videos and the make form adapt to what you tell us.', zh: '回答、视频和制作表单会按你的情况调整。', vi: 'Câu trả lời, video và biểu mẫu tạo video sẽ điều chỉnh theo thông tin của bạn.', id: 'Jawaban, video, dan formulir pembuatan menyesuaikan dengan informasi Anda.' },
  purpose: { en: 'I mostly use Paperlit for', zh: '我主要用 Paperlit 来', vi: 'Tôi chủ yếu dùng Paperlit để', id: 'Saya kebanyakan memakai Paperlit untuk' },
  purposes: { study: { en: 'Studying', zh: '学习', vi: 'Học tập', id: 'Belajar' }, research: { en: 'Research', zh: '研究', vi: 'Nghiên cứu', id: 'Riset' }, teach: { en: 'Teaching', zh: '教学', vi: 'Giảng dạy', id: 'Mengajar' }, share: { en: 'Sharing', zh: '分享', vi: 'Chia sẻ', id: 'Berbagi' }, curious: { en: 'Curiosity', zh: '兴趣', vi: 'Tò mò', id: 'Rasa ingin tahu' } } as Record<Purpose, Record<'en' | 'zh' | 'vi' | 'id', string>>,
  level: { en: 'My level', zh: '我的水平', vi: 'Trình độ của tôi', id: 'Tingkat saya' },
  levels: { beginner: { en: 'Beginner', zh: '入门', vi: 'Mới bắt đầu', id: 'Pemula' }, intermediate: { en: 'Intermediate', zh: '中级', vi: 'Trung bình', id: 'Menengah' }, expert: { en: 'Expert', zh: '专家', vi: 'Chuyên gia', id: 'Ahli' } } as Record<Level, Record<'en' | 'zh' | 'vi' | 'id', string>>,
  field: { en: 'My field', zh: '我的领域', vi: 'Lĩnh vực', id: 'Bidang saya' },
  fieldPh: { en: 'e.g. computer science, medicine, economics', zh: '例如：计算机、医学、经济', vi: 'vd: khoa học máy tính, y khoa, kinh tế', id: 'mis. ilmu komputer, kedokteran, ekonomi' },
  goal: { en: 'My goal', zh: '我的目标', vi: 'Mục tiêu', id: 'Tujuan saya' },
  goalPh: { en: 'e.g. pass my machine learning exam', zh: '例如：通过机器学习考试', vi: 'vd: qua môn học máy', id: 'mis. lulus ujian machine learning' },
  oldPw: { en: 'Current password', zh: '当前密码', vi: 'Mật khẩu hiện tại', id: 'Kata sandi saat ini' },
  newPw: { en: 'New password (8 or more characters)', zh: '新密码（至少 8 位）', vi: 'Mật khẩu mới (tối thiểu 8 ký tự)', id: 'Kata sandi baru (minimal 8 karakter)' },
  pwSave: { en: 'Change password', zh: '修改密码', vi: 'Đổi mật khẩu', id: 'Ganti kata sandi' },
  pwDone: { en: 'Password changed.', zh: '密码已修改。', vi: 'Đã đổi mật khẩu.', id: 'Kata sandi diganti.' },
  forgot: { en: 'Forgot it? Log out and use "Forgot password" on the log in screen.', zh: '忘记了？退出后在登录页点“忘记密码”。', vi: 'Quên mật khẩu? Đăng xuất rồi chọn "Quên mật khẩu" ở màn hình đăng nhập.', id: 'Lupa? Keluar lalu pilih "Lupa kata sandi" di layar masuk.' },
  current: { en: 'Signed in', zh: '当前账户', vi: 'Đang đăng nhập', id: 'Sedang masuk' },
  switchB: { en: 'Switch', zh: '切换', vi: 'Chuyển', id: 'Ganti' },
  add: { en: 'Add another account', zh: '添加其他账户', vi: 'Thêm tài khoản khác', id: 'Tambah akun lain' },
  out: { en: 'Sign out', zh: '退出登录', vi: 'Đăng xuất', id: 'Keluar' },
};
type Tab = keyof typeof A.tabs;
type Ledger = { created_at: string; delta: number; reason: string };
type Order = { id: string; what: string; status: string; method: string | null; created_at: string; cur: string; amount: number; shot: boolean };
const money = (n: number, cur: string) => (cur === 'vnd' ? `${new Intl.NumberFormat('vi-VN').format(n)}₫` : cur === 'idr' ? `Rp${new Intl.NumberFormat('id-ID').format(n)}` : `¥${n}`);

export default function AccountPage() {
  const { lang, t, theme, setTheme, setLang } = usePrefs();
  const { user, me, refresh, openAuth, accounts, switchTo, signOut } = useAccount();
  const [qs, setQs] = useSearchParams();
  const tab = (qs.get('tab') as Tab) in A.tabs ? (qs.get('tab') as Tab) : 'profile';
  const setTab = (k: Tab) => setQs({ tab: k }, { replace: true });
  const [s, set] = useSettings();
  const [ledger, setLedger] = useState<Ledger[] | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [handle, setHandle] = useState(user?.handle ?? '');
  const [hMsg, setHMsg] = useState('');
  const [pw, setPw] = useState({ old: '', next: '' });
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState('');
  useEffect(() => { setHandle(user?.handle ?? ''); }, [user?.handle]);
  useEffect(() => {
    if (!user || tab !== 'billing') return;
    accountSwr<Ledger[]>('ledger=1', setLedger).catch(() => setLedger([]));
    accountSwr<Order[]>('orders=1', setOrders).catch(() => setOrders([]));
  }, [user, tab]);

  if (!user) return <div className="grid min-h-[50vh] place-items-center text-center"><div><p className="text-muted-foreground">{t(A.login)}</p><Button className="mt-4" onClick={() => openAuth('login')}>{t({ en: 'Log in', zh: '登录', vi: 'Đăng nhập', id: 'Masuk' })}</Button></div></div>;

  const saveHandle = async (e: FormEvent) => {
    e.preventDefault(); setBusy('h'); setHMsg('');
    try { await accountApi('set_handle', { handle: handle.trim().toLowerCase() }); await refresh(); setHMsg(t(COMMON.saved)); } catch (x) { setHMsg((x as Error).message); } finally { setBusy(''); }
  };
  const savePw = async (e: FormEvent) => {
    e.preventDefault(); setBusy('p'); setPwMsg(null);
    try { await accountApi('password', { old: pw.old, password: pw.next }); setPw({ old: '', next: '' }); setPwMsg({ ok: true, text: t(A.pwDone) }); } catch (x) { setPwMsg({ ok: false, text: (x as Error).message }); } finally { setBusy(''); }
  };
  const days = me?.plan_until ? Math.max(0, Math.ceil((Date.parse(me.plan_until) - Date.now()) / 86400000)) : 0;
  const card = 'pl-card p-5 sm:p-6';
  const seg = (on: boolean) => cn('rounded-lg border px-3 py-2 text-sm font-medium transition', on ? 'border-primary bg-accent text-primary' : 'text-muted-foreground hover:text-foreground');
  const icons: Record<Tab, typeof User> = { profile: User, billing: CreditCard, students: GraduationCap, invite: Gift, prefs: Palette, security: KeyRound, accounts: Users };

  return (
    <div className="mx-auto max-w-6xl py-8">
      <h1 className="font-display text-3xl font-bold">{t(A.h)}</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:grid lg:content-start lg:px-0" aria-label={t(A.h)}>
          {(Object.keys(A.tabs) as Tab[]).map((k) => { const I = icons[k]; return (
            <button key={k} type="button" onClick={() => setTab(k)} aria-current={tab === k ? 'page' : undefined}
              className={cn('flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition', tab === k ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}><I className="h-4 w-4" />{t(A.tabs[k])}</button>
          ); })}
        </nav>

        <div className="grid min-w-0 content-start gap-5">
          {tab === 'profile' && (
            <section className={card}>
              <div className="flex items-center gap-4">
                <Avatar name={displayName(user)} className="h-14 w-14 text-xl" />
                <div><p className="font-display text-xl font-semibold">{displayName(user)}</p><p className="text-sm text-muted-foreground">{fill(t(A.joined), { d: dateFmt(user.created_at, lang) })}</p></div>
                <PlanBadge plan={me?.plan} className="ml-auto" />
              </div>
              <div className="mt-6 grid gap-4 sm:max-w-md">
                <div className="grid gap-1.5"><Label>{t(A.email)}</Label><Input value={user.username} disabled /></div>
                <form onSubmit={saveHandle} className="grid gap-1.5">
                  <Label htmlFor="pl-handle">{t(A.handle)}</Label>
                  <div className="flex gap-2"><Input id="pl-handle" value={handle} onChange={(e) => setHandle(e.target.value)} pattern="[A-Za-z0-9_.]{3,24}" maxLength={24} required /><Button type="submit" variant="outline" disabled={busy === 'h' || handle.trim().toLowerCase() === (user.handle ?? '')}>{busy === 'h' ? <Loader2 className="h-4 w-4 animate-spin" /> : t(COMMON.save)}</Button></div>
                  <p className="text-xs text-muted-foreground">{hMsg || t(A.handleHint)}</p>
                </form>
              </div>
            </section>
          )}

          {tab === 'billing' && (
            <>
              <section className={card}>
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex-1"><p className="text-sm text-muted-foreground">{t(A.plan)}</p><div className="mt-1 flex items-center gap-2"><PlanBadge plan={me?.plan} className="px-3 py-1 text-sm" /></div>
                    <p className="mt-2 text-sm text-muted-foreground">{me?.plan ? fill(t(A.until), { d: dateFmt(me.plan_until, lang), n: days }) : t(A.freePlan)}</p></div>
                  <Button asChild variant="outline"><Link to="/pricing">{t(A.change)}</Link></Button>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-muted/60 p-4"><p className="text-xs text-muted-foreground">{t(A.balance)}</p><p className="font-display text-2xl font-bold">{me?.admin ? '∞' : (me?.quota?.day_left ?? 0) + (user.credits ?? 0)}</p></div>
                  <div className="rounded-xl bg-muted/60 p-4"><p className="text-xs text-muted-foreground">{t(A.free)} · {t(A.credits)}</p><p className="font-display text-2xl font-bold">{me?.quota?.day_left ?? 0} · {user.credits}</p></div>
                  <div className="rounded-xl bg-muted/60 p-4"><p className="text-xs text-muted-foreground">{t(A.interactive)}</p><p className="font-display text-2xl font-bold">{me?.interactive ? `${me.interactive.left} / ${me.interactive.cap}` : '-'}</p></div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{t(A.creditsNote)} <Link to="/pricing" className="font-semibold text-primary">{t(A.buy)}</Link></p>
              </section>
              <section className={card}>
                <p className="font-semibold">{t(A.orders)}</p>
                {orders === null ? <Loader2 className="mt-3 h-4 w-4 animate-spin" /> : orders.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">{t(A.noOrders)}</p> : (
                  <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[480px] text-sm"><tbody>
                    {orders.map((o) => <tr key={o.id} className="border-b last:border-0"><td className="py-2.5 pr-3 text-muted-foreground">{dateFmt(o.created_at, lang)}</td><td className="py-2.5 pr-3">{o.what}</td><td className="py-2.5 pr-3 font-medium">{money(o.amount, o.cur)}</td><td className="py-2.5"><span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', o.status === 'paid' || o.status === 'delivered' ? 'bg-success/15 text-success' : o.status === 'cancelled' ? 'bg-muted text-muted-foreground' : 'bg-warning/15 text-warning')}>{(A.st[o.status] ?? A.st.new)[lang]}</span></td></tr>)}
                  </tbody></table></div>
                )}
              </section>
              <section className={card}>
                <p className="font-semibold">{t(A.history)}</p>
                {ledger === null ? <Loader2 className="mt-3 h-4 w-4 animate-spin" /> : ledger.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">{t(A.noHistory)}</p> : (
                  <ul className="mt-3 divide-y text-sm">{ledger.map((l, i) => <li key={i} className="flex items-center gap-3 py-2.5"><span className="w-24 shrink-0 text-muted-foreground">{dateFmt(l.created_at, lang, { day: 'numeric', month: 'short' })}</span><span className="flex-1 truncate">{l.reason}</span><span className={cn('font-semibold', l.delta > 0 ? 'text-success' : 'text-muted-foreground')}>{l.delta > 0 ? `+${l.delta}` : l.delta}</span></li>)}</ul>
                )}
              </section>
            </>
          )}

          {tab === 'students' && <StudentVerify />}
          {tab === 'invite' && <InviteCard />}

          {tab === 'prefs' && (
            <>
              <section className={card}>
                <div className="grid gap-6">
                  <div><p className="mb-2 text-sm font-medium">{t(A.lang)}</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{LANGS.map((l) => <button key={l.k} type="button" onClick={() => setLang(l.k)} className={seg(lang === l.k)}>{l.label}</button>)}</div></div>
                  <div className="flex items-center justify-between"><p className="text-sm font-medium">{t(A.theme)}</p><Switch checked={theme === 'dark'} onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')} aria-label={t(A.theme)} /></div>
                  <div><p className="mb-2 text-sm font-medium">{t(A.size)}</p><div className="inline-grid grid-cols-3 gap-2">{(['sm', 'md', 'lg'] as const).map((k, i) => <button key={k} type="button" onClick={() => set({ size: k }, true)} className={seg(s.size === k)}>{(A.sizes[lang] ?? A.sizes.en)[i]}</button>)}</div></div>
                  <div><p className="mb-2 text-sm font-medium">{t(A.font)}</p><div className="inline-grid grid-cols-3 gap-2">{(['sans', 'serif', 'plain'] as const).map((k, i) => <button key={k} type="button" onClick={() => set({ font: k }, true)} className={seg(s.font === k)}>{(A.fonts[lang] ?? A.fonts.en)[i]}</button>)}</div></div>
                  <div className="flex items-center justify-between"><p className="text-sm font-medium">{t(A.motion)}</p><Switch checked={s.motion} onCheckedChange={(v) => set({ motion: v })} aria-label={t(A.motion)} /></div>
                </div>
              </section>
              <section className={card}>
                <p className="font-semibold">{t(A.personal)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t(A.personalP)}</p>
                <div className="mt-5 grid gap-5">
                  <div><p className="mb-2 text-sm font-medium">{t(A.purpose)}</p><div className="flex flex-wrap gap-2">{(Object.keys(A.purposes) as Purpose[]).map((p) => <button key={p} type="button" onClick={() => set(s.purpose === p ? { purpose: '' } : { purpose: p, askModel: PURPOSE[p].askModel }, true)} className={seg(s.purpose === p)}>{A.purposes[p][lang]}</button>)}</div></div>
                  <div><p className="mb-2 text-sm font-medium">{t(A.level)}</p><div className="flex flex-wrap gap-2">{(Object.keys(A.levels) as Level[]).map((p) => <button key={p} type="button" onClick={() => set({ level: s.level === p ? '' : p }, true)} className={seg(s.level === p)}>{A.levels[p][lang]}</button>)}</div></div>
                  <div className="grid gap-1.5 sm:max-w-md"><Label htmlFor="pl-field">{t(A.field)}</Label><Input id="pl-field" value={s.field} maxLength={60} placeholder={t(A.fieldPh)} onChange={(e) => set({ field: e.target.value }, true)} /></div>
                  <div className="grid gap-1.5 sm:max-w-md"><Label htmlFor="pl-goal">{t(A.goal)}</Label><Input id="pl-goal" value={s.goal} maxLength={140} placeholder={t(A.goalPh)} onChange={(e) => set({ goal: e.target.value }, true)} /></div>
                </div>
              </section>
            </>
          )}

          {tab === 'security' && (
            <section className={card}>
              <form onSubmit={savePw} className="grid gap-4 sm:max-w-md">
                <div className="grid gap-1.5"><Label htmlFor="pl-old">{t(A.oldPw)}</Label><Input id="pl-old" type="password" autoComplete="current-password" required value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label htmlFor="pl-new">{t(A.newPw)}</Label><Input id="pl-new" type="password" autoComplete="new-password" minLength={8} required value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
                {pwMsg && <p className={cn('text-sm', pwMsg.ok ? 'text-success' : 'text-destructive')} role="status">{pwMsg.text}</p>}
                <Button type="submit" className="w-fit" disabled={busy === 'p'}>{busy === 'p' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t(A.pwSave)}</Button>
                <p className="text-xs text-muted-foreground">{t(A.forgot)}</p>
              </form>
            </section>
          )}

          {tab === 'accounts' && (
            <section className={card}>
              <ul className="divide-y">
                {[{ id: user.id, user: { id: user.id, username: user.username, handle: user.handle }, token: '' }, ...accounts.filter((a) => a.id !== user.id)].map((a, i) => (
                  <li key={a.id} className="flex items-center gap-3 py-3">
                    <Avatar name={displayName(a.user)} />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{displayName(a.user)}</p><p className="truncate text-xs text-muted-foreground">{a.user.username}</p></div>
                    {i === 0 ? <span className="flex items-center gap-1 text-xs font-semibold text-success"><Check className="h-3.5 w-3.5" />{t(A.current)}</span> : <Button size="sm" variant="outline" onClick={() => switchTo(a)}>{t(A.switchB)}</Button>}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => openAuth('login')}><UserPlus className="mr-1.5 h-4 w-4" />{t(A.add)}</Button>
                <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => signOut()}><LogOut className="mr-1.5 h-4 w-4" />{t(A.out)}</Button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
