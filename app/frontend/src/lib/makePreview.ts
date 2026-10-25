const FN_BASE = 'https://vzvyghmtsakixlhzzuol.supabase.co/functions/v1';
const KNOWN_TYPES = ['title', 'cards', 'tokens', 'flow', 'number', 'quote', 'end'] as const;

export class RateLimitError extends Error {}
export class PaperNotFoundError extends Error {}
export class ScriptParseError extends Error {}

export interface Scene {
  type: string;
  en: string;
  zh?: string;
  evidence?: string | null;
  [key: string]: unknown;
}

export interface Script {
  title: string;
  arxiv?: string;
  lang?: string;
  scenes: Scene[];
}

export type QuoteStatus = 'kept' | 'removed' | 'none';

export interface SceneCheck {
  index: number;
  type: string;
  quote: string | null;
  removedQuote: string | null;
  status: QuoteStatus;
  numberReplaced: boolean;
}

export interface Paper {
  id: string;
  title: string;
  abstract: string;
  text: string;
  abstractOnly: boolean;
}

export interface PreviewResult {
  paper: Paper;
  script: Script;
  checks: SceneCheck[];
}

/** Extracts a bare arXiv id from an id, abs/pdf/html link, or "arXiv:" string. */
export function parseArxivId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  const modern = s.match(/(\d{4}\.\d{4,5})(v\d+)?/);
  if (modern) return modern[1];
  const legacy = s.match(/([a-z-]+(?:\.[A-Z]{2})?\/\d{7})(v\d+)?/i);
  return legacy ? legacy[1] : null;
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

async function postJson(fn: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`${FN_BASE}/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new RateLimitError('rate limited');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

export async function fetchPaper(id: string): Promise<Paper> {
  const abs = await postJson('paper-tools', { action: 'abstract', id });
  const meta = abs.paper as { title?: string; summary?: string } | undefined;
  if (!meta?.title) throw new PaperNotFoundError(id);
  const abstract = (meta.summary ?? '').trim();

  let text = '';
  try {
    const body = await postJson('paper-tools', { action: 'text', id, offset: 0 });
    if (typeof body.text === 'string') text = body.text.replace(/\s+/g, ' ').trim();
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    text = '';
  }

  return { id, title: meta.title.replace(/\s+/g, ' ').trim(), abstract, text, abstractOnly: text.length === 0 };
}

export function paperText(paper: Paper): string {
  return paper.abstractOnly ? paper.abstract : `${paper.abstract}\n\n${paper.text}`;
}

let promptCache: Promise<string> | null = null;
function loadScenePrompt(): Promise<string> {
  if (!promptCache) {
    promptCache = fetch('/explainer/scene_prompt.md.html')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .catch((err) => {
        promptCache = null;
        throw err;
      });
  }
  return promptCache;
}

function parseJsonLoose(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const a = content.indexOf('{');
    const b = content.lastIndexOf('}');
    if (a >= 0 && b > a) return JSON.parse(content.slice(a, b + 1));
    throw new ScriptParseError('no JSON');
  }
}

export async function writeScript(paper: Paper): Promise<Script> {
  const prompt = (await loadScenePrompt()).split('{SECONDS}').join('20').split('{WORDS}').join('48');
  const reply = await postJson('agent-llm', {
    app: 'companion',
    visitor: visitorId(),
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: `TITLE: ${paper.title}\n\nPAPER TEXT:\n${paperText(paper)}` },
    ],
    json_mode: true,
    max_tokens: 2600,
  });
  const content = (reply.message as { content?: unknown } | undefined)?.content;
  if (typeof content !== 'string' || !content.trim()) throw new ScriptParseError('empty reply');

  let raw: unknown;
  try {
    raw = parseJsonLoose(content);
  } catch {
    throw new ScriptParseError('invalid JSON');
  }
  const obj = raw as { title?: unknown; scenes?: unknown };
  if (!obj || !Array.isArray(obj.scenes)) throw new ScriptParseError('no scenes');

  const scenes = (obj.scenes as unknown[]).filter(isUsableScene).map((sc) => {
    const copy: Scene = { ...sc, zh: typeof sc.zh === 'string' && sc.zh.trim() ? sc.zh : sc.en };
    delete copy.audio;
    delete copy.audio_ms;
    delete copy.dur;
    return copy;
  });
  if (scenes.length === 0) throw new ScriptParseError('no usable scenes');

  return {
    title: typeof obj.title === 'string' && obj.title.trim() ? obj.title : paper.title,
    arxiv: paper.id,
    lang: 'en',
    scenes,
  };
}

function isUsableScene(value: unknown): value is Scene {
  if (!value || typeof value !== 'object') return false;
  const sc = value as Record<string, unknown>;
  if (typeof sc.type !== 'string' || !(KNOWN_TYPES as readonly string[]).includes(sc.type)) return false;
  if (typeof sc.en !== 'string' || !sc.en.trim()) return false;
  switch (sc.type) {
    case 'title':
    case 'end':
      return typeof sc.big === 'string';
    case 'cards':
      return Array.isArray(sc.cards) && sc.cards.length > 0;
    case 'tokens':
      return Array.isArray(sc.words) && sc.words.length > 0 && Array.isArray(sc.links);
    case 'flow':
      return Array.isArray(sc.nodes) && sc.nodes.length > 0;
    case 'number':
      return sc.value !== undefined && sc.value !== null;
    case 'quote':
      return typeof sc.text === 'string';
    default:
      return false;
  }
}

/** Lowercases and turns every run of punctuation/whitespace into one space. */
export function normalize(s: string): string {
  return ` ${s.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
}

function quoteInText(quote: string, normText: string): boolean {
  const q = normalize(quote).trim();
  return q.length > 0 && normText.includes(` ${q} `);
}

function numberInText(value: unknown, normText: string): boolean {
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  if (!Number.isFinite(n)) return false;
  const variants = new Set([String(value), String(n), n.toLocaleString('en-US')]);
  return [...variants].some((v) => {
    const nv = normalize(v).trim();
    return nv.length > 0 && normText.includes(` ${nv} `);
  });
}

function numberFreeCards(sc: Scene, evidence: string | null): Scene {
  const label = typeof sc.label === 'string' ? sc.label.replace(/[\d.,%]+/g, '').replace(/\s+/g, ' ').trim() : '';
  return {
    type: 'cards',
    cards: [
      { h: 'Main result', t: label || 'Reported in the paper' },
      { h: 'See the paper', t: 'Exact figures are in the results section' },
    ],
    en: 'The paper reports its main result; see the results section for the exact figures.',
    zh: '论文报告了主要结果，具体数字请查阅论文的结果部分。',
    evidence: evidence && !/\d/.test(evidence) ? evidence : null,
  };
}

/** Keeps only evidence quotes found in the paper and swaps unsupported numbers for a number-free cards scene. */
export function checkScript(script: Script, text: string): { script: Script; checks: SceneCheck[] } {
  const normText = normalize(text);
  const checks: SceneCheck[] = [];
  const scenes = script.scenes.map((sc, index) => {
    const raw = typeof sc.evidence === 'string' && sc.evidence.trim() ? sc.evidence.trim() : null;
    const kept = raw && quoteInText(raw, normText) ? raw : null;
    let next: Scene = { ...sc, evidence: kept };
    let numberReplaced = false;
    if (sc.type === 'number' && !numberInText(sc.value, normText)) {
      next = numberFreeCards(sc, kept);
      numberReplaced = true;
    }
    const finalQuote = (next.evidence as string | null) ?? null;
    checks.push({
      index,
      type: sc.type,
      quote: finalQuote,
      removedQuote: raw && !finalQuote ? raw : null,
      status: finalQuote ? 'kept' : raw ? 'removed' : 'none',
      numberReplaced,
    });
    return next;
  });
  return { script: { ...script, scenes }, checks };
}
