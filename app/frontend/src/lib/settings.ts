import { useEffect, useState } from 'react';
import type { TONES } from '@/lib/explainer';
import { accountApi, accountGet } from '@/lib/account';

export type Purpose = 'study' | 'research' | 'teach' | 'share' | 'curious';
export type Level = 'beginner' | 'intermediate' | 'expert';
export type Settings = {
  size: 'sm' | 'md' | 'lg'; font: 'sans' | 'serif' | 'plain'; motion: boolean;
  purpose: Purpose | ''; level: Level | ''; field: string; goal: string;
  interactive: boolean; askModel: 'fast' | 'deep';
};
const KEY = 'pe-settings';
const DEFAULTS: Settings = { size: 'md', font: 'sans', motion: true, purpose: '', level: '', field: '', goal: '', interactive: false, askModel: 'fast' };

export const read = (): Settings => {
  try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<Settings>) }; } catch { return DEFAULTS; }
};
export function apply(s: Settings) {
  const r = document.documentElement;
  r.setAttribute('data-size', s.size);
  r.setAttribute('data-font', s.font);
  r.setAttribute('data-motion', s.motion ? 'on' : 'off');
}
apply(read());

/** What each mode changes: the tone and length the make form starts on, whether the video asks questions as it plays, and which Ask model is selected. */
export const PURPOSE: Record<Purpose, { tone: (typeof TONES)[number]; seconds: number; interactive: boolean; askModel: 'fast' | 'deep' }> = {
  study: { tone: 'teacher', seconds: 180, interactive: false, askModel: 'fast' },
  research: { tone: 'academic', seconds: 300, interactive: false, askModel: 'deep' },
  teach: { tone: 'teacher', seconds: 300, interactive: false, askModel: 'fast' },
  share: { tone: 'story', seconds: 60, interactive: false, askModel: 'fast' },
  curious: { tone: 'eli5', seconds: 120, interactive: false, askModel: 'fast' },
};

const PROFILE_KEYS: (keyof Settings)[] = ['purpose', 'level', 'field', 'goal', 'size', 'font', 'interactive', 'askModel'];

/** Members keep their profile on the account, so it follows them to every device. */
export async function pullProfile(): Promise<void> {
  try {
    const out = (await accountGet('profile=1')) as { profile: Partial<Settings> | null };
    if (!out.profile) return;
    const next = { ...read() };
    for (const k of PROFILE_KEYS) { const v = out.profile[k]; if (v !== undefined && v !== '') (next as Record<string, unknown>)[k] = v; }
    localStorage.setItem(KEY, JSON.stringify(next));
    apply(next);
    window.dispatchEvent(new Event('pe-settings'));
  } catch { /* offline or signed out: the device copy stays */ }
}
let pushTimer = 0;
export function pushProfile(s: Settings) {
  window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    const body: Record<string, unknown> = {};
    for (const k of PROFILE_KEYS) body[k] = s[k];
    accountApi('profile_save', body).catch(() => undefined);
  }, 900);
}

export function useSettings(): [Settings, (patch: Partial<Settings>, sync?: boolean) => void] {
  const [s, setS] = useState<Settings>(read);
  useEffect(() => {
    const on = () => setS(read());
    window.addEventListener('pe-settings', on);
    return () => window.removeEventListener('pe-settings', on);
  }, []);
  const set = (patch: Partial<Settings>, sync = false) => {
    const next = { ...read(), ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode: lasts for this page */ }
    apply(next);
    setS(next);
    window.dispatchEvent(new Event('pe-settings'));
    if (sync) pushProfile(next);
  };
  return [s, set];
}
