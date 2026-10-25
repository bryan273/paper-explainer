import { useEffect, useState } from 'react';

export interface Demo {
  arxiv: string;
  title: string;
}

export interface FullVideoRequest {
  id: number;
  email: string;
  arxiv_id: string;
  note?: string | null;
  ui_lang?: string | null;
  source_arxiv?: string | null;
}

let cache: Promise<Demo[]> | null = null;

function loadDemos(): Promise<Demo[]> {
  if (!cache) {
    cache = fetch('/explainer/index.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Demo[]>;
      })
      .catch((err) => {
        cache = null;
        throw err;
      });
  }
  return cache;
}

export function useDemos() {
  const [demos, setDemos] = useState<Demo[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    loadDemos()
      .then((list) => alive && setDemos(list))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  return { demos, error };
}

export function playerSrc(arxiv: string, lang: 'en' | 'zh'): string {
  return `/explainer/player.html?script=/explainer/${arxiv}/script_${lang}.json&auto&limit=20`;
}

export function formatRequestNo(id: number): string {
  return `PE-${String(id).padStart(5, '0')}`;
}
