import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** The Paperlit mark: a letter P that holds a play button. Temporary until the final name and logo are chosen. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('h-8 w-8 shrink-0', className)} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="hsl(var(--primary))" />
      <path d="M21 52V22a10 10 0 0 1 10-10h4a13 13 0 0 1 0 26H21" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 19v12l9-6z" fill="#ffb020" />
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
