import { Link, useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Globe, LayoutDashboard, LogOut, Moon, Settings, Shield, Sun, UserPlus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LANGS, usePrefs } from '@/lib/prefs';
import { displayName, planLabel, useAccount } from '@/lib/account';
import { NAV } from '@/lib/strings';
import { cn } from '@/lib/utils';

export function LangMenu({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = usePrefs();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" aria-label={t(NAV.language)}>
          <Globe className="h-4 w-4" />
          {!compact && <span className="hidden text-[13px] uppercase sm:inline">{lang}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {LANGS.map((l) => (
          <DropdownMenuItem key={l.k} onSelect={() => setLang(l.k)} className="justify-between">
            {l.label}{lang === l.k && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/12 font-display text-[13px] font-bold text-primary', className)} style={{ background: 'hsl(var(--primary) / 0.12)' }} aria-hidden>
      {(name || '?')[0]?.toUpperCase()}
    </span>
  );
}

export function PlanBadge({ plan, className }: { plan?: string | null; className?: string }) {
  const p = plan ?? null;
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
      p === 'premium' ? 'bg-[#1b1606] text-[#f3d98a]' : p === 'pro' ? 'bg-[#1d1650] text-white' : p === 'plus' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground', className)}>
      {planLabel(p)}
    </span>
  );
}

/** Everything personal in one place: account, settings, theme, language, other accounts, sign out. */
export function ProfileMenu() {
  const { me, user, accounts, switchTo, signOut, openAuth } = useAccount();
  const { theme, setTheme, lang, setLang, t } = usePrefs();
  const nav = useNavigate();
  if (!user) return null;
  const name = displayName(user);
  const others = accounts.filter((a) => a.id !== user.id);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition hover:bg-muted" aria-label={name}>
          <Avatar name={name} />
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-1.5">
        <DropdownMenuLabel className="flex items-center gap-3 py-2">
          <Avatar name={name} className="h-10 w-10 text-base" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{name}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">{user.username}</span>
          </span>
          <PlanBadge plan={me?.plan} />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => nav('/app')}><LayoutDashboard className="mr-2 h-4 w-4" />{t(NAV.dashboard)}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => nav('/app/account')}><Settings className="mr-2 h-4 w-4" />{t(NAV.account)}</DropdownMenuItem>
        {me?.admin && <DropdownMenuItem onSelect={() => nav('/app/admin')}><Shield className="mr-2 h-4 w-4" />{t(NAV.admin)}</DropdownMenuItem>}
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setTheme(theme === 'dark' ? 'light' : 'dark'); }}>
          {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}{t(NAV.theme)}
          <span className={cn('ml-auto h-4 w-7 rounded-full p-0.5 transition', theme === 'dark' ? 'bg-primary' : 'bg-muted-foreground/30')}><span className={cn('block h-3 w-3 rounded-full bg-white transition', theme === 'dark' && 'translate-x-3')} /></span>
        </DropdownMenuItem>
        <div className="flex flex-wrap gap-1 px-2 py-1.5" role="group" aria-label={t(NAV.language)}>
          {LANGS.map((l) => (
            <button key={l.k} type="button" onClick={() => setLang(l.k)} className={cn('rounded-md px-2 py-1 text-xs', lang === l.k ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>{l.k === 'zh' ? '中文' : l.k.toUpperCase()}</button>
          ))}
        </div>
        <DropdownMenuSeparator />
        {others.length > 0 && <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t(NAV.switchTo)}</DropdownMenuLabel>}
        {others.map((a) => (
          <DropdownMenuItem key={a.id} onSelect={() => { switchTo(a); nav('/app'); }}>
            <Avatar name={displayName(a.user)} className="mr-2 h-6 w-6 text-[11px]" />
            <span className="truncate">{displayName(a.user)}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onSelect={() => openAuth('login')}><UserPlus className="mr-2 h-4 w-4" />{t(NAV.addAccount)}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { signOut(); nav('/'); }} className="text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />{t(NAV.signOut)}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ThemeButton() {
  const { theme, setTheme, t } = usePrefs();
  return (
    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={t(NAV.theme)}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export const linkCls = 'rounded-lg px-3 py-2 text-[14px] font-medium text-muted-foreground no-underline transition hover:bg-muted hover:text-foreground';
export { Link };
