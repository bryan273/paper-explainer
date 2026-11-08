import { useEffect, useState } from 'react';
import type { TONES } from '@/lib/explainer';

export type Purpose = 'study' | 'research' | 'teach' | 'share';
export type Settings = { size: 'sm' | 'md' | 'lg'; font: 'sans' | 'serif' | 'plain'; purpose: Purpose | ''; motion: boolean };
const KEY = 'pe-settings';
const DEFAULTS: Settings = { size: 'md', font: 'sans', purpose: '', motion: true };

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

/** What each purpose changes in the make form: the tone and the length the form starts on. */
export const PURPOSE: Record<Purpose, { tone: (typeof TONES)[number]; seconds: number }> = {
  study: { tone: 'teacher', seconds: 180 },
  research: { tone: 'academic', seconds: 300 },
  teach: { tone: 'teacher', seconds: 300 },
  share: { tone: 'story', seconds: 60 },
};

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const [s, setS] = useState<Settings>(read);
  useEffect(() => {
    const on = () => setS(read());
    window.addEventListener('pe-settings', on);
    return () => window.removeEventListener('pe-settings', on);
  }, []);
  const set = (patch: Partial<Settings>) => {
    const next = { ...read(), ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode: lasts for this page */ }
    apply(next);
    setS(next);
    window.dispatchEvent(new Event('pe-settings'));
  };
  return [s, set];
}
