import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Check, FileText, Link2, Loader2, MessageSquare, PencilLine, PlayCircle, Quote, Search, Trophy, Type, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrefs, type Tr } from '@/lib/prefs';
import { cn } from '@/lib/utils';

/**
 * The tutorial of each app page. It shows, it does not test: every step points at a part of the page, says what it does and
 * shows an example of what you get. Next and Back move through it. It opens by itself the first time a page is visited;
 * closing it turns the automatic tutorials off for good, and the Tutorial button in the top bar opens it again.
 */
type GStep = { target?: string; h: Tr<string>; p: Tr<string>; ex?: () => ReactNode };

const S = {
  of: { en: 'Step {i} of {n}' },
  next: { en: 'Next' },
  back: { en: 'Back' },
  finish: { en: 'Done' },
  close: { en: 'Close the tutorial' },
  example: { en: 'Example' },
};

const POSTER = `${import.meta.env.BASE_URL}landing/ex-6a21030a-b5f8-4c0e-977e-39090d7ebc70.jpg`;

// ---- small pictures of what each step gives you
const Chip = ({ children, on }: { children: ReactNode; on?: boolean }) => <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-medium', on ? 'border-primary bg-accent text-primary' : 'text-muted-foreground')}>{children}</span>;
function ExSources() {
  const rows: [typeof Link2, string, string][] = [[Link2, 'Link', 'arxiv.org/abs/1706.03762'], [Type, 'Paste text', 'Lecture notes, week 3'], [Upload, 'File', 'chapter-4.pdf']];
  return (
    <div className="grid grid-cols-3 gap-2 text-[11.5px]">
      {rows.map(([Icon, h, v]) => (
        <div key={h} className="min-w-0 rounded-lg border bg-background p-2"><Icon className="h-4 w-4 text-primary" /><p className="mt-1 font-semibold">{h}</p><p className="truncate text-muted-foreground">{v}</p></div>
      ))}
    </div>
  );
}
function ExSettings() {
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-1.5"><Chip on>English</Chip><Chip>+ 日本語</Chip><Chip>+ Tiếng Việt</Chip></div>
      <div className="flex flex-wrap gap-1.5"><Chip>1 min</Chip><Chip on>3 min</Chip><Chip>5 min</Chip><Chip>10 min</Chip></div>
      <p className="text-[11.5px] text-muted-foreground">3 min: 1 video credit. Each extra language is its own video.</p>
    </div>
  );
}
function ExStyle() {
  return (
    <div className="grid gap-2 text-[12px]">
      <div className="rounded-lg border bg-background p-2.5"><p className="text-[10.5px] font-semibold text-primary">Clear teacher</p><p className="mt-0.5">“Attention lets every word look at every other word, then decide which ones matter.”</p></div>
      <div className="rounded-lg border bg-background p-2.5"><p className="text-[10.5px] font-semibold text-primary">For beginners</p><p className="mt-0.5">“Imagine each word in a sentence raising its hand to ask: who here helps me make sense?”</p></div>
    </div>
  );
}
function ExQuestion() {
  return (
    <div className="relative overflow-hidden rounded-lg bg-black">
      <img src={POSTER} alt="" className="aspect-video w-full object-cover opacity-40" />
      <div className="absolute inset-3 grid content-center rounded-lg bg-[#0d0d1a]/90 p-3 text-white">
        <p className="text-[10px] text-white/60">Part 2 of 4</p>
        <p className="mt-0.5 text-[12.5px] font-semibold leading-snug">Why do deeper plain networks train worse?</p>
        <span className="mt-2 flex items-center justify-between rounded-md border border-[#3ddc97] bg-[#3ddc97]/15 px-2 py-1 text-[11.5px]">The training error itself goes up<Check className="h-3.5 w-3.5 text-[#3ddc97]" /></span>
        <span className="mt-1 rounded-md border border-white/20 px-2 py-1 text-[11.5px] text-white/70">They overfit the data</span>
      </div>
    </div>
  );
}
function ExMaking() {
  const rows: [string, boolean][] = [['Reading the source', true], ['Writing the script', true], ['Checking quotes and numbers', true], ['Drawing part 3 of 4', false]];
  return (
    <div className="grid gap-1.5 rounded-lg border bg-background p-3 text-[12px]">
      {rows.map(([h, d]) => <p key={h} className="flex items-center gap-2">{d ? <Check className="h-3.5 w-3.5 text-success" /> : <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}<span className={d ? '' : 'font-medium'}>{h}</span></p>)}
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-[72%] rounded-full bg-primary" /></div>
      <p className="text-[11px] text-muted-foreground">About 2 minutes left. You can close the tab.</p>
    </div>
  );
}
function ExResult() {
  return (
    <div className="grid gap-2">
      <div className="relative overflow-hidden rounded-lg bg-black">
        <img src={POSTER} alt="" className="aspect-video w-full object-cover" />
        <PlayCircle className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow" />
      </div>
      <div className="flex flex-wrap gap-1.5"><Chip on>1 The problem</Chip><Chip>2 Residual blocks</Chip><Chip>3 Results</Chip></div>
      <div className="flex flex-wrap gap-1.5"><Chip><MessageSquare className="h-3 w-3" />Ask</Chip><Chip><Trophy className="h-3 w-3" />Quiz</Chip><Chip><FileText className="h-3 w-3" />Source</Chip><Chip><PencilLine className="h-3 w-3" />Edit</Chip></div>
    </div>
  );
}
function ExAnswer() {
  return (
    <div className="rounded-lg border bg-background p-3 text-[12px]">
      <p className="font-medium">Why add the input back?</p>
      <p className="mt-1.5 text-muted-foreground">Each block only has to learn what to change, which is easier than learning the whole mapping.</p>
      <p className="mt-1.5 flex gap-1.5 border-l-2 border-primary pl-2 italic text-muted-foreground"><Quote className="mt-0.5 h-3 w-3 shrink-0 text-primary" />“we explicitly let these layers fit a residual mapping”</p>
      <span className="mt-2 inline-flex rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-semibold text-primary">Page 1</span>
    </div>
  );
}
function ExQuiz() {
  return (
    <div className="grid gap-1.5 rounded-lg border bg-background p-3 text-[12px]">
      <p className="flex items-center justify-between font-semibold">Final quiz<span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success">4 / 5</span></p>
      {['Residual learning eases training', 'Shortcut connections add no parameters', 'Deeper is always better'].map((q, k) => <p key={q} className="flex items-center gap-2">{k < 2 ? <Check className="h-3.5 w-3.5 text-success" /> : <X className="h-3.5 w-3.5 text-destructive" />}{q}</p>)}
    </div>
  );
}
function ExEdit() {
  return (
    <div className="grid gap-2 rounded-lg border bg-background p-3 text-[12px]">
      <div className="flex flex-wrap gap-1.5"><Chip>1 The problem</Chip><Chip on>2 Residual blocks</Chip><Chip>3 Results</Chip></div>
      <div className="flex flex-wrap gap-1.5"><Chip on>Fix a mistake</Chip><Chip>Make it simpler</Chip><Chip>Go deeper</Chip></div>
      <p className="rounded-md bg-muted px-2 py-1.5 text-muted-foreground">“The formula should read F(x) + x. Say why the shortcut helps.”</p>
      <p className="text-[11px] text-muted-foreground">Only part 2 is made again. No video credit is used.</p>
    </div>
  );
}
function ExResearch() {
  const rows: [string, boolean][] = [['Planning the search', true], ['Searching arXiv: 12 papers', true], ['Reading 3 full papers', true], ['Writing the answer', false]];
  return (
    <div className="grid gap-1.5 rounded-lg border bg-background p-3 text-[12px]">
      {rows.map(([h, d]) => <p key={h} className="flex items-center gap-2">{d ? <Check className="h-3.5 w-3.5 text-success" /> : <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}{h}</p>)}
      <p className="mt-1 text-muted-foreground">Linear attention cuts the cost on long inputs <span className="rounded bg-accent px-1 text-[10.5px] font-bold text-primary">1</span> while sparse patterns keep accuracy <span className="rounded bg-accent px-1 text-[10.5px] font-bold text-primary">2</span>.</p>
    </div>
  );
}
function ExVerdicts() {
  const rows: [string, string][] = [['Reproduced', 'bg-success/15 text-success'], ['Partly reproduced', 'bg-warning/15 text-warning'], ['Not reproduced', 'bg-destructive/12 text-destructive']];
  return (
    <div className="grid gap-1.5 text-[12px]">
      {rows.map(([l, c]) => <div key={l} className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2"><span className="truncate">A paper on image classification</span><span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', c)}>{l}</span></div>)}
    </div>
  );
}
function ExSearch() {
  return <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-[12px] text-muted-foreground"><Search className="h-3.5 w-3.5" />transformer<span className="ml-auto flex gap-1"><Chip on>Ready</Chip><Chip>Making</Chip></span></div>;
}

const GUIDES: Record<string, GStep[]> = {
  new: [
    { target: '[data-g=src-tabs]', h: { en: 'Start with your material' }, p: { en: 'A video can come from a link (a paper, an article, any web page), from text you paste, or from a file you upload.' }, ex: ExSources },
    { target: '[data-g=vlang]', h: { en: 'Language and length' }, p: { en: 'Pick the language of the narration and how long the video should be. Each started 5 minutes uses one video credit, and every extra language is its own video.' }, ex: ExSettings },
    { target: '[data-g=tone]', h: { en: 'How it is explained' }, p: { en: 'The style changes how the narrator talks, from a clear lecture to a story. "Your own style" lets you describe it in your own words.' }, ex: ExStyle },
    { target: '[data-g=interactive]', h: { en: 'Interactive mode' }, p: { en: 'Turn it on and the video stops after each part with one question, then explains the answer. A quiz at the end checks the whole video.' }, ex: ExQuestion },
    { target: '[data-g=make]', h: { en: 'Make the video' }, p: { en: 'Press Make video. You see each step as it happens, and you can close the tab: the video waits in your Library.' }, ex: ExMaking },
    { h: { en: 'What you get' }, p: { en: 'A narrated video with chapters. Next to it you can ask questions, take the quiz, read the source at the right page and edit any part.' }, ex: ExResult },
  ],
  watch: [
    { target: '[data-g=player]', h: { en: 'Your video' }, p: { en: 'A narrated explanation in chapters. Play it, or jump to any chapter with the chips under it.' }, ex: ExResult },
    { target: '[data-g=inter]', h: { en: 'Interactive mode' }, p: { en: 'Switch it on to be asked one question after each part. It uses one of your interactive videos, so you may want to watch once first.' }, ex: ExQuestion },
    { target: '[data-g=side-tabs]', h: { en: 'Ask about the source' }, p: { en: 'The Ask tab answers questions about this video. Quick answers take seconds; in-depth answers reason step by step and quote the page they come from.' }, ex: ExAnswer },
    { target: '[data-g=side-tabs]', h: { en: 'Quiz and source' }, p: { en: 'The Quiz tab keeps your answers and the final quiz. The Source tab opens the original, at the page an answer quotes.' }, ex: ExQuiz },
    { target: '[data-g=edit]', h: { en: 'Edit a part' }, p: { en: 'Something you would explain differently? Press Edit, choose the part and say what to change. Only that part is made again.' }, ex: ExEdit },
  ],
  home: [
    { target: '[data-g=quick]', h: { en: 'Start from a link' }, p: { en: 'Paste the link of a paper or an article here and press the button. The options page opens with the link filled in.' }, ex: ExSources },
    { target: '[data-g=kpis]', h: { en: 'What you can still make' }, p: { en: 'Your videos left, interactive mode left and your plan. The answers and research questions you have left are shown under them.' } },
    { target: '[data-g=recent]', h: { en: 'Your latest videos' }, p: { en: 'Open one to watch it, ask about it, take its quiz or edit a part.' }, ex: ExResult },
    { target: '[data-g=tools]', h: { en: 'Research and Check' }, p: { en: 'Research answers one question from many papers. Check shows whether a paper\'s results came out again when its code was re-run.' }, ex: ExResearch },
  ],
  library: [
    { target: '[data-g=search]', h: { en: 'All your videos' }, p: { en: 'Search by title, paper number or web address, and filter by ready, making or failed. A failed video says why, and its credit came back.' }, ex: ExSearch },
  ],
  read: [
    { target: '[data-g=goal]', h: { en: 'Ask a research question' }, p: { en: 'Write what you want to find out, in your own words. The more specific, the better the answer.' } },
    { target: '[data-g=paper]', h: { en: 'Optional: one paper' }, p: { en: 'If your question is about one paper, paste its arXiv link here. Leave it empty to search across papers.' } },
    { target: '[data-g=start]', h: { en: 'What happens next' }, p: { en: 'The search takes a minute or two. You see each step, then an answer where every number opens the quote it came from.' }, ex: ExResearch },
  ],
  check: [
    { target: '[data-g=list]', h: { en: 'Papers we re-ran' }, p: { en: 'Each row says whether the reported numbers came out again when the paper\'s own code was run. Open the log to see the full run.' }, ex: ExVerdicts },
    { target: '[data-g=request]', h: { en: 'Ask for a paper' }, p: { en: 'Send an arXiv link and, if you have it, the code link. We run it and tell you what we find.' } },
  ],
  account: [
    { target: '[data-g=acct-tabs]', h: { en: 'Your account' }, p: { en: 'Profile and password, plan and billing, student verification and invites each have their own section here.' } },
  ],
};

/** Which tutorial belongs to this address, if any. */
export function guideKey(path: string): string | null {
  const p = path.replace(/\/+$/, '') || '/';
  if (p === '/app') return 'home';
  if (p === '/app/new') return 'new';
  if (p === '/app/library') return 'library';
  if (/^\/app\/v\/[^/]+$/.test(p)) return 'watch';
  if (p === '/app/read') return 'read';
  if (p === '/app/check') return 'check';
  if (p === '/app/account') return 'account';
  return null;
}

const SEEN = 'pl-guides', OFF = 'pl-guides-off';
const seenOf = (): Record<string, number> => { try { return JSON.parse(localStorage.getItem(SEEN) || '{}'); } catch { return {}; } };
const markSeen = (k: string) => { try { localStorage.setItem(SEEN, JSON.stringify({ ...seenOf(), [k]: 1 })); } catch { /* private mode */ } };
const isOff = () => { try { return localStorage.getItem(OFF) === '1'; } catch { return true; } };
const turnOff = () => { try { localStorage.setItem(OFF, '1'); } catch { /* private mode */ } };

const shown = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
const find = (sel?: string): HTMLElement | null => (sel ? Array.from(document.querySelectorAll<HTMLElement>(sel)).find(shown) ?? null : null);

export function Guide() {
  const { t } = usePrefs();
  const loc = useLocation();
  const key = guideKey(loc.pathname);
  const [run, setRun] = useState<{ key: string; steps: GStep[] } | null>(null);
  const [i, setI] = useState(0);
  const [box, setBox] = useState<DOMRect | null>(null);

  const start = useCallback((k: string) => {
    const steps = GUIDES[k].filter((s) => !s.target || find(s.target));
    if (!steps.length) return;
    setRun({ key: k, steps }); setI(0);
  }, []);
  const finish = useCallback(() => { setRun((r) => { if (r) markSeen(r.key); return null; }); }, []);
  const close = useCallback(() => { setRun((r) => { if (r) markSeen(r.key); return null; }); turnOff(); }, []);

  // the first visit to a page opens its tutorial once the page has drawn; ?guide=1 opens it on request
  useEffect(() => {
    setRun(null);
    if (!key) return;
    const force = new URLSearchParams(loc.search).get('guide') === '1';
    if (!force && (isOff() || seenOf()[key])) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      tries++;
      if (document.querySelector('[role=dialog]')) return;   // never on top of another window
      const first = GUIDES[key][0].target;
      if (!first || find(first) || tries > 12) { window.clearInterval(timer); if (!first || find(first)) start(key); }
    }, 500);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, loc.search]);

  useEffect(() => {
    const on = () => { if (key) start(key); };
    window.addEventListener('pl-guide', on);
    return () => window.removeEventListener('pl-guide', on);
  }, [key, start]);

  const step = run ? run.steps[i] : null;
  const last = run ? i === run.steps.length - 1 : false;

  // keep the highlight on its part of the page, even when the page moves
  useLayoutEffect(() => {
    if (!step) { setBox(null); return; }
    find(step.target)?.scrollIntoView({ block: 'center' });
    const place = () => { const el = find(step.target); setBox(el ? el.getBoundingClientRect() : null); };
    place();
    const iv = window.setInterval(place, 150);
    window.addEventListener('resize', place);
    return () => { window.clearInterval(iv); window.removeEventListener('resize', place); };
  }, [step]);

  useEffect(() => {
    if (!step) return;
    const keyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') { if (last) finish(); else setI((x) => x + 1); }
      if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener('keydown', keyDown);
    return () => window.removeEventListener('keydown', keyDown);
  }, [step, last, close, finish]);

  if (!run || !step) return null;

  const W = Math.min(400, window.innerWidth - 24);
  const H = step.ex ? 400 : 220;
  const pad = 6;
  let pos: React.CSSProperties = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  if (box) {
    const left = Math.max(12, Math.min(window.innerWidth - W - 12, box.left + box.width / 2 - W / 2));
    const rightSide = box.right + 16 + W < window.innerWidth;
    const leftSide = box.left - 16 - W > 0;
    const top = Math.max(12, Math.min(window.innerHeight - H - 12, box.top));
    if (rightSide) pos = { left: box.right + 16, top };
    else if (leftSide) pos = { left: box.left - 16 - W, top };
    else if (box.bottom + 14 + H < window.innerHeight) pos = { left, top: box.bottom + 14 };
    else if (box.top - 14 - H > 0) pos = { left, top: box.top - 14 - H };
    else pos = { left: '50%', bottom: 12, transform: 'translateX(-50%)' };
  }
  // the card never runs past the bottom of the screen: it scrolls inside, and Back / Next stay in view
  const mh = typeof pos.top === 'number' ? Math.max(200, window.innerHeight - pos.top - 12) : window.innerHeight - 24;
  const hole = box ? { l: box.left - pad, t: box.top - pad, w: box.width + pad * 2, h: box.height + pad * 2 } : null;
  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="pl-guide-h">
      {hole
        ? <div className="pointer-events-none absolute rounded-xl ring-2 ring-primary transition-all duration-200" style={{ left: hole.l, top: hole.t, width: hole.w, height: hole.h, boxShadow: '0 0 0 9999px rgba(10,10,30,0.55)' }} />
        : <div className="absolute inset-0 bg-[rgba(10,10,30,0.55)]" />}
      <div className="absolute overflow-y-auto rounded-2xl border bg-card p-5 text-card-foreground shadow-2xl" style={{ width: W, maxHeight: mh, ...pos }}>
        <button type="button" onClick={close} aria-label={t(S.close)} className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        <p className="text-xs font-medium text-muted-foreground">{t(S.of).replace('{i}', String(i + 1)).replace('{n}', String(run.steps.length))}</p>
        <h2 id="pl-guide-h" className="mt-1 pr-6 font-display text-lg font-semibold">{t(step.h)}</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{t(step.p)}</p>
        {step.ex && (
          <div className="mt-3 rounded-xl bg-muted/60 p-3">
            <p className="mb-2 text-[10.5px] font-semibold text-muted-foreground">{t(S.example)}</p>
            <step.ex />
          </div>
        )}
        <div className="sticky -bottom-5 -mx-5 -mb-5 mt-4 flex items-center justify-between gap-2 rounded-b-2xl border-t bg-card px-5 py-3">
          <div className="flex gap-1.5" aria-hidden="true">{run.steps.map((_, k) => <span key={k} className={k === i ? 'h-1.5 w-5 rounded-full bg-primary' : 'h-1.5 w-1.5 rounded-full bg-muted-foreground/30'} />)}</div>
          <div className="flex gap-2">
            {i > 0 && <Button variant="outline" size="sm" onClick={() => setI(i - 1)}>{t(S.back)}</Button>}
            <Button size="sm" onClick={() => (last ? finish() : setI(i + 1))}>{last ? t(S.finish) : t(S.next)}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
