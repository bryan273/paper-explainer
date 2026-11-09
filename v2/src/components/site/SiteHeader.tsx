import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { LangMenu, ProfileMenu, ThemeButton, linkCls } from '@/components/site/menus';
import { useAccount } from '@/lib/account';
import { usePrefs } from '@/lib/prefs';
import { NAV } from '@/lib/strings';
import { cn } from '@/lib/utils';

/** The bar on public pages: three products, pricing, help. Personal things live in the profile menu. */
export function SiteHeader() {
  const { user, openAuth } = useAccount();
  const { t } = usePrefs();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const items = [
    { to: '/app/new', label: t(NAV.video) },
    { to: '/app/read', label: t(NAV.read) },
    { to: '/app/check', label: t(NAV.check) },
    { to: '/pricing', label: t(NAV.pricing) },
    { to: '/help', label: t(NAV.help) },
  ];
  return (
    <header className={cn('sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur-md transition', scrolled && 'border-border')}>
      <div className="pl-container flex h-16 items-center gap-3 md:gap-6">
        <Logo />
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} data-tour={i.to} className={({ isActive }) => cn(linkCls, isActive && 'text-foreground')}>{i.label}</NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          {!user && <LangMenu />}
          {!user && <span className="hidden sm:inline-flex"><ThemeButton /></span>}
          {user ? (
            <>
              <Button asChild size="sm" className="hidden sm:inline-flex"><Link to="/app">{t(NAV.dashboard)}</Link></Button>
              <ProfileMenu />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => openAuth('login')}>{t(NAV.login)}</Button>
              <Button size="sm" data-tour="profile" onClick={() => openAuth('register')}>{t(NAV.start)}</Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="border-t bg-background md:hidden" aria-label="Main">
          <div className="pl-container grid gap-1 py-3">
            {items.map((i) => <Link key={i.to} to={i.to} onClick={() => setOpen(false)} className={cn(linkCls, 'text-base')}>{i.label}</Link>)}
            {user ? <Link to="/app" onClick={() => setOpen(false)} className={cn(linkCls, 'text-base text-primary')}>{t(NAV.dashboard)}</Link>
              : <button type="button" onClick={() => { setOpen(false); openAuth('login'); }} className={cn(linkCls, 'text-left text-base')}>{t(NAV.login)}</button>}
          </div>
        </nav>
      )}
    </header>
  );
}
