import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/** Searchable language list. One pick (`value`) or several (`values`, at most `max`). Scales to dozens of languages. */
type Base = { options: readonly string[]; names: Record<string, string>; placeholder: string; searchLabel: string; emptyLabel: string; className?: string };
type One = Base & { value: string; onChange: (v: string) => void };
type Many = Base & { values: string[]; onChangeMany: (v: string[]) => void; max: number; maxLabel: string; exclude?: string };

export function LangPicker(p: One | Many) {
  const multi = 'values' in p;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const picked: string[] = multi ? p.values : [p.value];
  const list = useMemo(() => p.options.filter((o) => (!multi || o !== p.exclude) && (p.names[o] + ' ' + o).toLowerCase().includes(q.trim().toLowerCase())), [p.options, p.names, q, multi, multi ? p.exclude : '']);
  const toggle = (o: string) => {
    if (!multi) { p.onChange(o); setOpen(false); return; }
    p.onChangeMany(p.values.includes(o) ? p.values.filter((x) => x !== o) : p.values.length >= p.max ? p.values : [...p.values, o]);
  };
  const full = multi && p.values.length >= p.max;
  return (
    <div className={p.className}>
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQ(''); }}>
        <PopoverTrigger asChild>
          <button type="button" aria-expanded={open} className="flex w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-left text-sm font-medium transition hover:border-foreground/30 sm:max-w-xs">
            <span className={cn('truncate', !picked.length && 'font-normal text-muted-foreground')}>{multi ? p.placeholder : p.names[p.value]}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-2">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={p.searchLabel} className="w-full rounded-md border bg-background py-2 pl-8 pr-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <ul role="listbox" aria-multiselectable={multi} className="max-h-64 overflow-y-auto">
            {list.map((o) => {
              const on = picked.includes(o);
              const blocked = multi && full && !on;
              return (
                <li key={o}>
                  <button type="button" role="option" aria-selected={on} disabled={blocked} onClick={() => toggle(o)} className={cn('flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted disabled:opacity-40', on && 'font-semibold text-primary')}>
                    {p.names[o]}{on && <Check className="h-4 w-4" />}
                  </button>
                </li>
              );
            })}
            {!list.length && <li className="px-2.5 py-3 text-sm text-muted-foreground">{p.emptyLabel}</li>}
          </ul>
          {multi && <p className="mt-2 border-t px-1 pt-2 text-xs text-muted-foreground">{p.values.length}/{p.max} {p.maxLabel}</p>}
        </PopoverContent>
      </Popover>
      {multi && p.values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {p.values.map((o) => (
            <span key={o} className="inline-flex items-center gap-1 rounded-full border border-primary bg-accent py-1 pl-3 pr-1.5 text-xs font-medium text-primary">
              {p.names[o]}
              <button type="button" onClick={() => toggle(o)} aria-label={`Remove ${p.names[o]}`} className="rounded-full p-0.5 hover:bg-primary/10"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
