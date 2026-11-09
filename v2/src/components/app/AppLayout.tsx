import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, FlaskConical, GraduationCap, Home, Library, Plus, Shield, Sparkles, Settings } from 'lucide-react';
import { Logo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { LangMenu, PlanBadge, ProfileMenu } from '@/components/site/menus';
import { useAccount } from '@/lib/account';
import { fill, usePrefs } from '@/lib/prefs';
import { NAV } from '@/lib/strings';
import { Guide, guideKey } from '@/components/app/Guide';
import { cn } from '@/lib/utils';

const U = {
  videosLeft: { en: 'Videos you can make', zh: '可制作视频', vi: 'Video có thể tạo', id: 'Video yang bisa dibuat' },
  interLeft: { en: 'Interactive mode left', zh: '剩余互动模式次数', vi: 'Lượt tương tác còn lại', id: 'Sisa mode interaktif' },
  freeWeek: { en: '{f} free this week + {c} credits', zh: '本周免费 {f} + 额度 {c}', vi: '{f} miễn phí trong tuần + {c} tín dụng', id: '{f} gratis minggu ini + {c} kredit' },
  freeToday: { en: '{f} free today + {c} credits', zh: '今日免费 {f} + 额度 {c}', vi: '{f} miễn phí hôm nay + {c} tín dụng', id: '{f} gratis hari ini + {c} kredit' },
  guestT: { en: 'You are browsing as a guest', zh: '你正在以访客身份使用', vi: 'Bạn đang dùng với tư cách khách', id: 'Anda menjelajah sebagai tamu' },
  guestP: { en: 'Sign up free to keep your videos, get 3 videos a week and 3 welcome videos with interactive mode.' },
};

/** Usage at a glance, always in the same place. */
function UsageCard() {
  const { me, user, openAuth } = useAccount();
  const { t } = usePrefs();
  if (!user) {
    return (
      <div className="rounded-xl border bg-background p-3.5">
        <p className="text-[13px] font-semibold">{t(U.guestT)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t(U.guestP)}</p>
        <Button size="sm" className="mt-3 w-full" onClick={() => openAuth('register')}>{t(NAV.start)}</Button>
      </div>
    );
  }
  const free = me?.quota?.day_left ?? 0, credits = user.credits ?? 0;
  const it = me?.interactive;
  return (
    <div className="rounded-xl border bg-background p-3.5 text-[13px]">
      <div className="flex items-center justify-between"><PlanBadge plan={me?.plan} />{!me?.plan && <Link to="/pricing" className="text-xs font-semibold text-primary no-underline hover:underline">{t(NAV.upgrade)}</Link>}</div>
      <p className="mt-3 text-muted-foreground">{t(U.videosLeft)}</p>
      <p className="font-display text-xl font-bold">{me?.admin ? '∞' : free + credits}</p>
      {!me?.admin && <p className="text-xs text-muted-foreground">{fill(t(me?.quota?.period === 'day' ? U.freeToday : U.freeWeek), { f: free, c: credits })}</p>}
      {it && !me?.admin && (
        <>
          <p className="mt-3 text-muted-foreground">{t(U.interLeft)}</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${it.cap ? (it.left / it.cap) * 100 : 0}%` }} /></div>
            <span className="text-xs font-semibold">{it.left}/{it.cap}</span>
          </div>
        </>
      )}
    </div>
  );
}

export function AppLayout() {
  const { me, user } = useAccount();
  const { t } = usePrefs();
  const loc = useLocation();
  const studio = loc.pathname.startsWith('/app/v/');
  const items = [
    { to: '/app', end: true, icon: Home, label: t(NAV.home) },
    { to: '/app/new', icon: Plus, label: t(NAV.newVideo) },
    { to: '/app/library', icon: Library, label: t(NAV.library) },
    { to: '/app/read', icon: BookOpen, label: t(NAV.read) },
    { to: '/app/check', icon: FlaskConical, label: t(NAV.check) },
  ];
  const lower = [
    ...(user ? [{ to: '/app/account', icon: Settings, label: t(NAV.account) }] : []),
    ...(me?.admin ? [{ to: '/app/admin', icon: Shield, label: t(NAV.admin) }] : []),
  ];
  const item = 'flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium no-underline transition';
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-sidebar px-3 py-4 lg:flex">
        <Logo className="px-2" />
        <Button asChild className="mt-6 justify-start gap-2"><Link to="/app/new"><Sparkles className="h-4 w-4" />{t(NAV.newVideo)}</Link></Button>
        <nav className="mt-4 grid gap-0.5" aria-label="App">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} data-tour={i.to} className={({ isActive }) => cn(item, isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
              <i.icon className="h-4 w-4" />{i.label}
            </NavLink>
          ))}
          {lower.length > 0 && <div className="my-2 border-t" />}
          {lower.map((i) => (
            <NavLink key={i.to} to={i.to} className={({ isActive }) => cn(item, isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
              <i.icon className="h-4 w-4" />{i.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto grid gap-3">
          <UsageCard />
          <div className="flex gap-3 px-2 text-xs text-muted-foreground">
            <Link to="/pricing" className="no-underline hover:text-foreground">{t(NAV.pricing)}</Link>
            <Link to="/help" className="no-underline hover:text-foreground">{t(NAV.help)}</Link>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <Logo className="lg:hidden" to="/app" />
          <div className="ml-auto flex items-center gap-1.5">
            {guideKey(loc.pathname) && <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => window.dispatchEvent(new Event('pl-guide'))} data-tutorial-button><GraduationCap className="h-4 w-4" /><span className="hidden sm:inline">{t(NAV.tutorial)}</span></Button>}
            <Button asChild variant="ghost" size="sm" className="hidden text-muted-foreground sm:inline-flex"><Link to="/help">{t(NAV.help)}</Link></Button>
            {!user && <LangMenu compact />}
            {user ? <ProfileMenu /> : <GuestButtons />}
          </div>
        </header>
        <main className={cn('pb-24 lg:pb-10', studio ? 'px-0 sm:px-4 lg:px-6' : 'px-4 sm:px-6 lg:px-10')}>
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/95 backdrop-blur-md lg:hidden" aria-label="App">
        {items.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => cn('flex flex-col items-center gap-0.5 py-2 text-[11px] no-underline', isActive ? 'text-primary' : 'text-muted-foreground')}>
            <i.icon className="h-5 w-5" />{i.label}
          </NavLink>
        ))}
      </nav>
      <Guide />
    </div>
  );
}

function GuestButtons() {
  const { openAuth } = useAccount();
  const { t } = usePrefs();
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => openAuth('login')}>{t(NAV.login)}</Button>
      <Button size="sm" onClick={() => openAuth('register')}>{t(NAV.start)}</Button>
    </>
  );
}
