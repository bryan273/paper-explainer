import { useCallback, useEffect, useState } from 'react';
import { accountSwr, useAccount } from '@/lib/account';
import { getJob, type Job } from '@/lib/explainer';
import type { Lang, Tr } from '@/lib/prefs';

export type MyJob = Pick<Job, 'id' | 'arxiv' | 'title' | 'status' | 'stage' | 'seconds' | 'sections' | 'created_at' | 'langs' | 'source_url'> & { expired_at?: string | null; credit_used?: number; refunded?: boolean };

const MINE_KEY = 'pe-my-jobs';
const localIds = (): string[] => { try { return JSON.parse(localStorage.getItem(MINE_KEY) ?? '[]') as string[]; } catch { return []; } };

/** The person's videos: from the account for members, from this browser for guests. Running ones refresh themselves. */
export function useMyJobs() {
  const { user } = useAccount();
  const [jobs, setJobs] = useState<MyJob[] | null>(null);
  const load = useCallback(async () => {
    if (user) { await accountSwr<MyJob[]>('jobs=1', setJobs).catch(() => setJobs((x) => x ?? [])); return; }
    const ids = localIds().slice(0, 20);
    const got = await Promise.all(ids.map((id) => getJob(id).catch(() => null)));
    setJobs(got.filter(Boolean) as MyJob[]);
  }, [user]);
  useEffect(() => { setJobs(null); load(); }, [load]);
  const running = !!jobs?.some((j) => j.status === 'queued' || j.status === 'running');
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(load, 8000);
    return () => window.clearInterval(id);
  }, [running, load]);
  return { jobs, reload: load };
}

export const posterOfJob = (j: Pick<Job, 'sections'>) => j.sections?.find((s) => s.poster)?.poster ?? null;

export function sourceLabel(j: Pick<Job, 'source_url' | 'arxiv'>): string {
  if (j.source_url?.startsWith('upload:')) return 'File';
  if (j.source_url) { try { return new URL(j.source_url).hostname.replace(/^www\./, ''); } catch { return j.source_url; } }
  return /^\d{4}\.\d{4,5}$/.test(j.arxiv) ? `arXiv ${j.arxiv}` : j.arxiv;
}

const STAGES: [RegExp, Tr<string>][] = [
  [/^waiting for a renderer/i, { en: 'Waiting for a free renderer', zh: '等待渲染器', vi: 'Đang chờ máy dựng', id: 'Menunggu perender' }],
  [/^reading the paper/i, { en: 'Reading the source and writing the script', zh: '正在阅读并撰写脚本', vi: 'Đang đọc nội dung và viết kịch bản', id: 'Membaca sumber dan menulis naskah' }],
  [/^getting the drawing tools/i, { en: 'Getting the drawing tools ready', zh: '正在准备绘图工具', vi: 'Đang chuẩn bị công cụ vẽ', id: 'Menyiapkan alat gambar' }],
  [/^drawing (\d+) sections?/i, { en: 'Drawing {a} sections', zh: '正在绘制 {a} 个章节', vi: 'Đang vẽ {a} phần', id: 'Menggambar {a} bagian' }],
  [/^sections ready: (\d+) of (\d+)/i, { en: 'Parts ready: {a} of {b}', zh: '已完成章节：{a} / {b}', vi: 'Phần đã xong: {a}/{b}', id: 'Bagian siap: {a} dari {b}' }],
  [/^putting the sections together/i, { en: 'Putting the parts together', zh: '正在合成视频', vi: 'Đang ghép các phần lại', id: 'Menggabungkan bagian' }],
];
/** The server reports its step in English: say it in the page language. */
export function stageText(stage: string | null | undefined, lang: Lang): string {
  const s = stage ?? '';
  for (const [re, tr] of STAGES) { const m = re.exec(s); if (m) return tr[lang].replace('{a}', m[1] ?? '').replace('{b}', m[2] ?? ''); }
  return s;
}

/** 0 read, 1 script, 2 check, 3 record; -1 waiting. */
export function stepOf(job: Pick<Job, 'stage' | 'status'>): number {
  const s = (job.stage ?? '').toLowerCase();
  if (/(queue|wait)/.test(s)) return -1;
  if (/(sections|drawing|together)/.test(s)) return 3;
  if (/(check|verif|quote|number)/.test(s)) return 2;
  if (/(script|writ|scene)/.test(s)) return 1;
  if (/(english|record|voice|narrat|audio|render|video|upload)/.test(s)) return 3;
  if (/(read|fetch|paper|arxiv)/.test(s)) return 0;
  return job.status === 'queued' ? -1 : 0;
}
/** Rough share done (0..97) from the step and the parts finished; the real end comes from the status. */
export function progressOf(job: Pick<Job, 'stage' | 'status' | 'seconds'>, startedMs: number, now: number): { pct: number; leftMin: number } {
  const len = job.seconds ?? 180;
  const steps = [30, 40 + Math.round(len / 6), 20, Math.round(len * 1.1) + 60];
  const total = steps.reduce((a, b) => a + b, 0);
  const st = stepOf(job);
  const done = steps.slice(0, Math.max(st, 0)).reduce((a, b) => a + b, 0);
  const parts = /sections ready:\s*(\d+) of (\d+)/i.exec(job.stage ?? '');
  const elapsed = (now - startedMs) / 1000;
  let inStep = st >= 0 ? Math.min(Math.max(0, elapsed - done), steps[st] * 0.9) : 0;
  if (parts && st === 3) inStep = Math.max(inStep, (Number(parts[1]) / Number(parts[2])) * steps[3] * 0.9);
  const pct = st < 0 ? 2 : Math.min(97, Math.round(((done + inStep) / total) * 100));
  return { pct, leftMin: Math.max(1, Math.round((total - done - inStep) / 60)) };
}
