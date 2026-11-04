import { useCallback, useEffect, useState } from 'react';
import type { Lang } from '@/lib/prefs';
import { authHeaders, track } from '@/lib/account';

export const RENDER_URL = 'https://wzdkroxbfrlqijbeiwpk.supabase.co/functions/v1/explainer-render';

export const SUITE_URLS = {
  repro: 'https://bryan273.github.io/repro-suite/repro/index.html',
  bench: 'https://bryan273.github.io/repro-suite/repro/bench.html',
  lite: 'https://bryan273.github.io/repro-suite/lite',
  reading: 'https://bryan273.github.io/repro-suite/reading',
  index: 'https://bryan273.github.io/repro-suite/indexboard/b/5dhum9j5h0',
  all: 'https://bryan273.github.io/repro-suite/hub',
} as const;

export type JobStatus = 'queued' | 'running' | 'done' | 'failed';

export interface Videos {
  en?: string | null;
  zh?: string | null;
  en_vertical?: string | null;
  zh_vertical?: string | null;
}

export interface Section {
  i: number;
  title: string;
  title_zh?: string;
  text: string;
  text_zh?: string;
  takeaway?: string;
  takeaway_zh?: string;
  status?: 'waiting' | 'done';
  poster?: string | null;
  videos?: { en?: string | null; zh?: string | null };
}

export interface Job {
  id: string;
  arxiv: string;
  source_url?: string | null;
  status: JobStatus;
  style?: string | null;
  tone?: string | null;
  seconds?: number | null;
  custom?: string | null;
  stage?: string | null;
  title?: string | null;
  videos?: Videos | null;
  sections?: Section[] | null;
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
    public code?: string,
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
    throw new ApiError(typeof errMsg === 'string' && errMsg ? errMsg : `HTTP ${res.status}`, res.status, (body as { code?: string } | null)?.code);
  }
  return body;
}

export function isPlayable(job: Job | null | undefined): job is Job {
  return !!job && job.status === 'done' && !!job.videos?.en;
}

export async function fetchRecent(): Promise<Job[]> {
  const body = await request(undefined, '?recent=1');
  const list = Array.isArray(body) ? body : ((body as { items?: unknown[] } | null)?.items ?? []);
  // the gallery shows the current look only (jobs with a poster), one video per paper, newest first
  const playable = (list as Job[]).filter(isPlayable);
  const current = playable.filter((j) => j.sections?.some((s) => s.poster));
  const seen = new Set<string>();
  return (current.length ? current : playable).filter((j) => !seen.has(j.arxiv) && !!seen.add(j.arxiv)).map(selfHosted);
}

/** The gallery's 16:9 videos and posters ship with the site (public/examples/<job id>/), so viewing them costs no storage egress. Jobs without a copy there keep their storage URLs. */
function selfHosted(job: Job): Job {
  const dir = `${import.meta.env.BASE_URL}examples/${job.id}/`;
  if (!job.id || !EXAMPLE_COPIES.has(job.id)) return job;
  const videos = { ...job.videos };
  for (const l of ['en', 'zh'] as const) if (videos[l]) videos[l] = `${dir}${l}.mp4`;
  const sections = job.sections?.map((s) => (s.poster ? { ...s, poster: `${dir}poster${s.i}.jpg` } : s));
  return { ...job, videos, sections };
}

const EXAMPLE_COPIES = new Set([
  '6a21030a-b5f8-4c0e-977e-39090d7ebc70',
  'ea94b4d8-195f-43b5-a267-72d7ac02bbad',
  'c91b06ea-3226-4fdf-90ae-1a7a21b9f283',
  '7b19a9ff-6cbb-4049-931e-9308f5d8c819',
  '4c6f43f4-0849-4f95-815e-8c7d5c3b151d',
  '5420c9c1-a5f6-48b0-a506-10ab1f13d691',
]);

export const STYLES = ['animated', 'cinema', 'classic', 'light', 'sunset', 'mono'] as const;
export const TONES = ['teacher', 'casual', 'academic', 'eli5', 'story'] as const;
export const LENGTHS = [60, 120, 180, 300, 420, 600] as const;
export type MakeOpts = {
  model?: 'deepseek' | 'stepfun';
  voice: 'female' | 'male';
  style: (typeof STYLES)[number];
  tone: (typeof TONES)[number];
  seconds: number;
  custom: string;
  force_new?: boolean;
};

/** Videos that already exist (or are being made) for this paper, newest first. */
export async function lookupPaper(input: string): Promise<Job[]> {
  const body = await request(undefined, `?paper=${encodeURIComponent(input)}`);
  return Array.isArray(body) ? (body as Job[]) : [];
}

export async function createJob(arxiv: string, opts?: MakeOpts): Promise<Job> {
  return (await request({
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ arxiv, visitor: visitorId(), ...opts }),
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
/** Plays and downloads of videos served from Storage are logged so the admin can estimate egress; the gallery examples ship with the site and are not. */
export const storageKind = (url: string) => (!url.includes('/storage/v1/') ? '' : url.includes('_vertical') ? 'vertical' : /_s\d+\.mp4/.test(url) ? 'section' : 'main');

export async function downloadFile(url: string, filename: string): Promise<void> {
  const k = storageKind(url);
  if (k) track('video_download', { k });
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
