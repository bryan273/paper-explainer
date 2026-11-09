import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** The Paperlit mark: a page, with light coming out of it. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('h-8 w-8 shrink-0', className)} aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="hsl(var(--primary))" />
      <rect x="13" y="12" width="24" height="36" rx="4" fill="#fff" />
      <path d="M19 22h12M19 29h12M19 36h7" stroke="hsl(var(--primary))" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M40 27l11-6M40 32h12M40 37l11 6" stroke="#ffb020" strokeWidth="3.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ to = '/', className }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={cn('flex items-center gap-2.5 rounded-lg font-display text-[19px] font-bold tracking-tight text-foreground no-underline', className)} aria-label="Paperlit">
      <Mark />
      <span>Paperlit</span>
    </Link>
  );
}
