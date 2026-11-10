import { Link, useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Globe, LayoutDashboard, LogOut, Moon, Settings, Shield, Sun, UserPlus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  const { theme, themeMode, setThemeMode, lang, setLang, t } = usePrefs();
  const nav = useNavigate();
  if (!user) return null;
  const name = displayName(user);
  const others = accounts.filter((a) => a.id !== user.id);
  const cur = LANGS.find((l) => l.k === lang);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="rounded-full p-0.5 ring-offset-background transition hover:ring-2 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${name}: ${t(NAV.account)}`} data-tour="profile">
          <Avatar name={name} className="h-9 w-9" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-1.5">
        {/* accounts first, like a chat app: the current one with a tick, one click on another switches */}
        <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-xs font-medium text-muted-foreground">{t(NAV.accounts)}</DropdownMenuLabel>
        <div className="flex items-center gap-3 rounded-md px-2 py-2" aria-current="true">
          <Avatar name={name} className="h-9 w-9" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{name}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.username}</span>
          </span>
          <PlanBadge plan={me?.plan} />
          <Check className="h-4 w-4 text-primary" aria-hidden />
        </div>
        {others.map((a) => (
          <DropdownMenuItem key={a.id} onSelect={() => { switchTo(a); nav('/app'); }} className="gap-3 py-2">
            <Avatar name={displayName(a.user)} className="h-9 w-9" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{displayName(a.user)}</span>
              <span className="block truncate text-xs text-muted-foreground">{a.user.username}</span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onSelect={() => openAuth('login')} className="gap-3 py-2 text-muted-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-dashed"><UserPlus className="h-4 w-4" /></span>{t(NAV.addAccount)}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => nav('/app')}><LayoutDashboard className="mr-2 h-4 w-4" />{t(NAV.dashboard)}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => nav('/app/account')}><Settings className="mr-2 h-4 w-4" />{t(NAV.account)}</DropdownMenuItem>
        {me?.admin && <DropdownMenuItem onSelect={() => nav('/app/admin')}><Shield className="mr-2 h-4 w-4" />{t(NAV.admin)}</DropdownMenuItem>}
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
          {theme === 'dark' ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
          <span>{t(NAV.themeH)}</span>
          <span className="ml-auto inline-flex rounded-md bg-muted p-0.5" role="radiogroup" aria-label={t(NAV.themeH)}>
            {(['system', 'light', 'dark'] as const).map((m) => <button key={m} type="button" role="radio" aria-checked={themeMode === m} onClick={() => setThemeMode(m)} className={cn('rounded px-2 py-0.5 text-xs font-medium', themeMode === m ? 'bg-background shadow-sm' : 'text-muted-foreground')}>{t(m === 'system' ? NAV.themeAuto : m === 'light' ? NAV.themeLight : NAV.themeDark)}</button>)}
          </span>
        </div>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="[&>svg:last-child]:!ml-1"><Globe className="mr-2 h-4 w-4" />{t(NAV.language)}<span className="ml-auto pl-3 text-xs text-muted-foreground">{cur?.label}</span></DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            {LANGS.map((l) => <DropdownMenuItem key={l.k} onSelect={() => setLang(l.k)}>{l.label}{lang === l.k && <Check className="ml-auto h-4 w-4 text-primary" />}</DropdownMenuItem>)}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
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
