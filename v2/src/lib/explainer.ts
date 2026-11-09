import { localizeError } from '@/lib/errors';
import { useCallback, useEffect, useState } from 'react';
import type { Lang } from '@/lib/prefs';
import { authHeaders, track } from '@/lib/account';

export const RENDER_URL = 'https://wzdkroxbfrlqijbeiwpk.supabase.co/functions/v1/explainer-render';


export type JobStatus = 'queued' | 'running' | 'done' | 'failed';

export interface Videos {
  en?: string | null;
  zh?: string | null;
  en_vertical?: string | null;
  zh_vertical?: string | null;
}

/** A section's title, text or takeaway in the viewer's language (English when that language was not written). */
export const secText = (s: Section, key: 'title' | 'text' | 'takeaway', lang: string): string => ((s as unknown as Record<string, string | undefined>)[`${key}_${lang}`] || s[key] || '') as string;

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
  /** Set while this job is still rendering: this section's own clip, before the full video exists. */
  videos?: { en?: string | null; zh?: string | null };
  /** Set once the full video exists: this section plays from [start, end] of the main video instead (its own clip is deleted). */
  clip?: { en?: [number, number]; zh?: [number, number] };
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
  langs?: VideoLang | 'both' | null;
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
    super(localizeError(message));
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
  return !!job && job.status === 'done' && !!(job.videos?.en || job.videos?.zh);
}

export async function fetchRecent(): Promise<Job[]> {
  const body = await request(undefined, '?recent=1');
  const list = Array.isArray(body) ? body : ((body as { items?: unknown[] } | null)?.items ?? []);
  // the gallery is a fixed set of six examples (EXAMPLE_COPIES, in that order): new videos people make never appear here
  const byId = new Map((list as Job[]).filter(isPlayable).map((j) => [j.id, j]));
  return EXAMPLE_ORDER.map((id) => byId.get(id)).filter((j): j is Job => !!j).map(selfHosted);
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

const EXAMPLE_ORDER = [
  '6a21030a-b5f8-4c0e-977e-39090d7ebc70',
  'ea94b4d8-195f-43b5-a267-72d7ac02bbad',
  'c91b06ea-3226-4fdf-90ae-1a7a21b9f283',
  '7b19a9ff-6cbb-4049-931e-9308f5d8c819',
  '4c6f43f4-0849-4f95-815e-8c7d5c3b151d',
  '5420c9c1-a5f6-48b0-a506-10ab1f13d691',
];
const EXAMPLE_COPIES = new Set(EXAMPLE_ORDER);
/** The one video shown at the top of the page: fixed on purpose (ResNet), not whatever was made last. */
export const HERO_EXAMPLE = EXAMPLE_ORDER[0];

export const STYLES = ['animated', 'cinema', 'classic', 'light', 'sunset', 'mono'] as const;
export const TONES = ['teacher', 'casual', 'academic', 'eli5', 'story'] as const;
/** The 9 languages a video can be narrated in; one language per video. */
export const VIDEO_LANGS = ['en', 'zh', 'vi', 'id', 'ja', 'ko', 'es', 'fr', 'de'] as const;
export type VideoLang = (typeof VIDEO_LANGS)[number];
export const VIDEO_LANG_NAME: Record<VideoLang, string> = { en: 'English', zh: '中文', vi: 'Tiếng Việt', id: 'Bahasa Indonesia', ja: '日本語', ko: '한국어', es: 'Español', fr: 'Français', de: 'Deutsch' };
/** Video credits a video uses: one for every started 5 minutes. */
export const creditsOf = (sec: number) => Math.max(1, Math.ceil(sec / 300));
export const LENGTHS = [60, 120, 180, 300, 420, 600] as const;
export type MakeOpts = {
  model?: 'deepseek' | 'stepfun';
  voice: 'female' | 'male';
  style: (typeof STYLES)[number];
  tone: (typeof TONES)[number];
  seconds: number;
  custom: string;
  /** the language the video is made in */
  langs?: VideoLang;
  force_new?: boolean;
  /** a path from uploadPaper(): make the video from that PDF instead of a link */
  upload?: string;
  /** the original file name, used as the first title */
  name?: string;
};

/** PDFs the visitor uploaded in this browser tab, by job id: the file is never kept on the server, but it can still be shown beside the video. */
export const localPdfs = new Map<string, string>();

export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_PDF_FILES = 5;

/** Sends one PDF to the private upload bucket and returns its path, to be passed to createJob as `upload`. */
export async function uploadPaper(file: File | Blob, name?: string): Promise<string> {
  const text = !(file instanceof File && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) && !(file.type === 'application/pdf');
  const addr = (await request({
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ op: 'upload_url', name: name ?? (file instanceof File ? file.name : 'text'), size: file.size, visitor: visitorId(), kind: text ? 'text' : 'pdf' }),
  })) as { path: string; upload_url: string };
  let res: Response;
  try {
    res = await fetch(addr.upload_url, { method: 'PUT', headers: { 'Content-Type': text ? 'text/plain' : 'application/pdf' }, body: file });
  } catch {
    throw new ApiError('upload failed', 0, 'upload_failed');
  }
  if (!res.ok) throw new ApiError('upload failed', res.status, 'upload_failed');
  return addr.path;
}

/** Videos that already exist (or are being made) for this paper, newest first. */
export async function lookupPaper(input: string): Promise<Job[]> {
  const body = await request(undefined, `?paper=${encodeURIComponent(input)}`);
  return Array.isArray(body) ? (body as Job[]) : [];
}

const MINE_KEY = 'pe-my-jobs';
/** Videos this browser made itself: a guest may ask about those; a video opened from a shared link can only be watched. */
export const isMine = (id: string): boolean => { try { return (JSON.parse(localStorage.getItem(MINE_KEY) ?? '[]') as string[]).includes(id); } catch { return false; } };
const rememberMine = (id: string) => { try { const a = (JSON.parse(localStorage.getItem(MINE_KEY) ?? '[]') as string[]).filter((x) => x !== id); a.unshift(id); localStorage.setItem(MINE_KEY, JSON.stringify(a.slice(0, 60))); } catch { /* private mode */ } };

export async function createJob(arxiv: string, opts?: MakeOpts): Promise<Job> {
  const job = (await request({
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ arxiv, visitor: visitorId(), ...opts }),
  })) as Job;
  if (!job.cached) rememberMine(job.id);
  return job;
}

export type EditKind = 'fix' | 'add' | 'simpler' | 'deeper' | 'other';
/** Re-make one part of a finished video as a new version (does not use a video credit). */
export async function editJob(job: string, part: number, kind: EditKind, note: string): Promise<Job & { edit?: { used: number; cap: number } }> {
  const j = (await request({ method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ op: 'edit', job, part, kind, note, visitor: visitorId() }) })) as Job & { edit?: { used: number; cap: number } };
  rememberMine(j.id);
  return j;
}
/** How many edits this video (and its versions) has used, and the plan's cap. */
export async function editsOf(job: string): Promise<{ used: number; cap: number; root?: string; versions?: { job: string; part: number; note: string; at: string }[] }> {
  return (await request({ method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ op: 'edits', job }) })) as { used: number; cap: number };
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
  const v = (job.videos ?? {}) as Record<string, string | null | undefined>;
  const key = vertical ? `${lang}_vertical` : lang;
  return v[key] || (vertical ? null : v.en || Object.values(v).find(Boolean) || null);
}

export function availableLangs(job: Job): Lang[] {
  return (['en', 'zh', 'vi', 'id'] as Lang[]).filter((l) => !!(job.videos as Record<string, unknown> | undefined)?.[l]);
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

export const ASK_URL = 'https://wzdkroxbfrlqijbeiwpk.supabase.co/functions/v1/explainer-ask';

/** One part of a tutor answer: from the paper (quote checked), background knowledge, or a paper claim whose quote was not found. */
export type AskBlock = { kind: 'paper' | 'general' | 'unverified'; text: string; quote?: string; page?: number; t?: number; sec?: number };
export type ChatMsg = { role: 'user'; text: string; section?: number | null } | { role: 'ai'; blocks: AskBlock[]; followups?: string[] };

async function askRequest(init: RequestInit, query = ''): Promise<Record<string, unknown>> {
  const res = await fetch(`${ASK_URL}${query}`, init);
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof body.error === 'string') throw new ApiError(typeof body.error === 'string' && body.error ? body.error : `HTTP ${res.status}`, res.status, typeof body.code === 'string' ? body.code : undefined);
  return body;
}

export async function askPaper(p: { job: string; q: string; mode: 'plus' | 'paper'; intent: 'ask' | 'simpler'; model?: 'fast' | 'deep'; section?: number; history: { role: 'user' | 'ai'; text: string }[]; lang: Lang; image?: string }): Promise<{ blocks: AskBlock[]; followups: string[]; left: number; deep_left?: number }> {
  const out = await askRequest({ method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ ...p, visitor: visitorId() }) });
  return { blocks: (out.blocks as AskBlock[]) ?? [], followups: (out.followups as string[]) ?? [], left: Number(out.left ?? 0), deep_left: typeof out.deep_left === 'number' ? out.deep_left : undefined };
}

/** This visitor's saved conversation about one video. */
export async function getChat(job: string): Promise<ChatMsg[]> {
  const out = await askRequest({ headers: authHeaders() }, `?chat=${encodeURIComponent(job)}`);
  return Array.isArray(out.messages) ? (out.messages as ChatMsg[]) : [];
}


/** A picture for a question, made small enough to send: at most 1280 px on the long side, JPEG. */
export async function shrinkImage(file: Blob, max = 1280): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    const g = c.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.82);
  } finally { URL.revokeObjectURL(url); }
}

export type Quiz = { question: string; options: string[]; answer: number; why: string; more?: string; section?: number };

/** One check-yourself question about a section of the video (the interactive mode). */
export async function quizPart(p: { job: string; section: number; lang: Lang }): Promise<Quiz> {
  const out = await askRequest({ method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ ...p, q: '', intent: 'quiz', mode: 'paper', history: [], visitor: visitorId() }) });
  return out.quiz as Quiz;
}

/** Every question of a video at once: one per part (written once and then shared), or a final test over the whole video. */
export async function quizAll(p: { job: string; lang: Lang; final?: boolean }): Promise<Quiz[]> {
  const out = await askRequest({ method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ ...p, q: '', intent: 'quizall', mode: 'paper', history: [], visitor: visitorId() }) });
  if (out.interactive) window.dispatchEvent(new CustomEvent('pe-interactive-used', { detail: out.interactive }));
  return (out.quizzes as Quiz[]) ?? [];
}
