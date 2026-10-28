import { useCallback, useEffect, useState } from 'react';
import type { Lang } from '@/lib/prefs';

export const RENDER_URL = 'https://vzvyghmtsakixlhzzuol.supabase.co/functions/v1/explainer-render';

export const SUITE_URLS = {
  repro: 'https://paperrepro-aiid.atoms.world/repro/index.html',
  bench: 'https://paperrepro-aiid.atoms.world/repro/bench.html',
  lite: 'https://reprolite-aiid.pub.atoms.world',
  reading: 'https://readingcompanion-aiid.pub.atoms.world',
  index: 'https://indexboard-aiid.pub.atoms.world/b/5dhum9j5h0',
  all: 'https://reprosuite-aiid.atoms.world',
} as const;

export type JobStatus = 'queued' | 'running' | 'done' | 'failed';

export interface Videos {
  en?: string | null;
  zh?: string | null;
  en_vertical?: string | null;
  zh_vertical?: string | null;
}

export interface Job {
  id: string;
  arxiv: string;
  source_url?: string | null;
  status: JobStatus;
  stage?: string | null;
  title?: string | null;
  videos?: Videos | null;
  checks?: { checked?: number | null; removed?: string[] | null } | null;
  error?: string | null;
  cached?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Error carrying the server's own message (400/404/429 etc.). */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request(init?: RequestInit, query = ''): Promise<unknown> {
  const res = await fetch(`${RENDER_URL}${query}`, init);
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  const errMsg = (body as { error?: unknown } | null)?.error;
  if (!res.ok || typeof errMsg === 'string') {
    throw new ApiError(typeof errMsg === 'string' && errMsg ? errMsg : `HTTP ${res.status}`, res.status);
  }
  return body;
}

export function isPlayable(job: Job | null | undefined): job is Job {
  return !!job && job.status === 'done' && !!job.videos?.en;
}

export async function fetchRecent(): Promise<Job[]> {
  const body = await request(undefined, '?recent=1');
  const list = Array.isArray(body) ? body : ((body as { items?: unknown[] } | null)?.items ?? []);
  return (list as Job[]).filter(isPlayable);
}

export type MakeOpts = { model: 'deepseek' | 'stepfun'; voice: 'female' | 'male' };

export async function createJob(arxiv: string, opts?: MakeOpts): Promise<Job> {
  return (await request({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ arxiv, visitor: visitorId(), ...opts, style: 'classic' }),
  })) as Job;
}

export async function getJob(id: string): Promise<Job> {
  return (await request(undefined, `?id=${encodeURIComponent(id)}`)) as Job;
}

export function visitorId(): string {
  const KEY = 'pe-visitor';
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return `v-${Math.random().toString(36).slice(2, 12)}`;
  }
}

/** Extracts a bare arXiv id from an id or an arxiv.org link. */
export function parseArxivId(input: string): string | null {
  const s = input.trim();
  const modern = s.match(/(\d{4}\.\d{4,5})(v\d+)?/);
  if (modern) return modern[1];
  const legacy = s.match(/([a-z-]+(?:\.[A-Z]{2})?\/\d{7})(v\d+)?/i);
  return legacy ? legacy[1] : null;
}

export function videoUrl(job: Job, lang: Lang, vertical = false): string | null {
  const v = job.videos ?? {};
  const key = (vertical ? `${lang}_vertical` : lang) as keyof Videos;
  return v[key] || (vertical ? null : v.en || null);
}

export function availableLangs(job: Job): Lang[] {
  return (['en', 'zh'] as Lang[]).filter((l) => !!job.videos?.[l]);
}

export function shareUrl(arxiv: string): string {
  return `${window.location.origin}${window.location.pathname}?v=${encodeURIComponent(arxiv)}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

/** Downloads a cross-origin MP4 via blob so the browser saves it instead of opening it. */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 5000);
  } catch {
    window.open(url, '_blank', 'noopener');
  }
}

export function useRecent() {
  const [items, setItems] = useState<Job[] | null>(null);
  const [error, setError] = useState(false);

  const reload = useCallback(() => {
    fetchRecent()
      .then((list) => {
        setItems(list);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, error, reload };
}
