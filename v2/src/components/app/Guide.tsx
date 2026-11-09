import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Check, Compass, MousePointerClick, Type as TypeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrefs, type Tr } from '@/lib/prefs';
import { cn } from '@/lib/utils';

/**
 * A guide for each page of the app. It opens the first time someone visits the page, points at the real controls and, where it
 * makes sense, waits for the person to use them (click, type) before it moves on. The round button at the bottom left plays it again.
 */
type Act = 'click' | 'type';
type GStep = { target?: string; act?: Act; h: Tr<string>; p: Tr<string> };

const S = {
  guide: { en: 'Guide' },
  guideTip: { en: 'Show the guide for this page' },
  of: { en: 'Step {i} of {n}' },
  tryClick: { en: 'Try it: click the highlighted part.' },
  tryType: { en: 'Try it: type in the highlighted box.' },
  nice: { en: 'Good. On to the next one.' },
  next: { en: 'Next' },
  back: { en: 'Back' },
  finish: { en: 'Got it' },
  skipStep: { en: 'Skip this step' },
  leaveQ: { en: 'Leave the guide?' },
  leaveP: { en: 'You can bring it back any time with the Guide button at the bottom left.' },
  leave: { en: 'Leave' },
  stay: { en: 'Keep going' },
  close: { en: 'Close the guide' },
};

const GUIDES: Record<string, GStep[]> = {
  home: [
    { target: '[data-g=quick]', act: 'type', h: { en: 'Start from a link' }, p: { en: 'The fastest way in: paste the link of a paper or an article here, then press the button. You will land on the options page with the link already filled in.' } },
    { target: '[data-g=kpis]', h: { en: 'What you can still make' }, p: { en: 'These cards show how many videos you can make, how many videos can use interactive mode and which plan you are on.' } },
    { target: '[data-g=recent]', h: { en: 'Your videos live here' }, p: { en: 'Finished videos appear in this row. Open one to watch it, ask questions about it and take its quiz.' } },
    { target: '[data-g=tools]', h: { en: 'Two more tools' }, p: { en: 'Read answers a research question with quotes from real papers. Check re-runs a paper\'s own code to see whether its numbers hold.' } },
  ],
  new: [
    { target: '[data-g=tab-link]', act: 'click', h: { en: 'Start with your material' }, p: { en: 'Paperlit works from a link, pasted text or a PDF. We will use a link. Click Link.' } },
    { target: '[data-g=examples]', act: 'click', h: { en: 'Pick something to try' }, p: { en: 'No paper at hand? Click one of the examples. It fills the box, so you can see the whole flow in a minute.' } },
    { target: '[data-g=length]', act: 'click', h: { en: 'Choose the length' }, p: { en: 'Short videos give you the main idea quickly. Longer ones go into the method and the results. Click any length.' } },
    { target: '[data-g=tone]', act: 'click', h: { en: 'Choose how it sounds' }, p: { en: 'The tone sets how the narrator explains: relaxed, clear and neutral, or closer to a lecture. Click one.' } },
    { target: '[data-g=interactive]', h: { en: 'Interactive mode' }, p: { en: 'Switch it on and the video stops after each part with one question, then explains the answer. A quiz at the end checks the whole video. It uses one of your interactive videos.' } },
    { target: '[data-g=make]', h: { en: 'Make the video' }, p: { en: 'Press the button when you are ready. The video takes about five minutes and you can close the tab meanwhile. It will be waiting in your Library.' } },
  ],
  library: [
    { target: '[data-g=search]', act: 'type', h: { en: 'Find a video' }, p: { en: 'Type a few letters of a title, a paper number or a web address to narrow the list.' } },
    { target: '[data-g=filter]', act: 'click', h: { en: 'Filter by status' }, p: { en: 'Show only the videos that are ready, still being made or failed. Click one of the options.' } },
  ],
  watch: [
    { target: '[data-g=player]', h: { en: 'The video' }, p: { en: 'A narrated explanation of the source, split into chapters. Press play, or drag the bar to any point.' } },
    { target: '[data-g=chapters]', act: 'click', h: { en: 'Jump between chapters' }, p: { en: 'Each chip is a chapter. Click one and the video jumps there. The text below it is the written version of that part.' } },
    { target: '[data-g=inter]', h: { en: 'Interactive mode' }, p: { en: 'Turn this on when you want to be tested. The video pauses after each part with a question. Turning it on uses one of your interactive videos, so leave it off for a first watch.' } },
    { target: '[data-g=tab-ask]', act: 'click', h: { en: 'Ask about the source' }, p: { en: 'The Ask tab answers questions about this video and its source. Quick answers take seconds; in-depth answers use a stronger model. Click Ask.' } },
    { target: '[data-g=tab-quiz]', act: 'click', h: { en: 'Test yourself' }, p: { en: 'The Quiz tab collects the questions and your answers, with notes and flashcards on a paid plan. Click Quiz.' } },
    { target: '[data-g=tab-paper]', act: 'click', h: { en: 'See the original' }, p: { en: 'Every quote in an answer points to a page. Click Paper to read the source itself, opened at that page.' } },
  ],
  read: [
    { target: '[data-g=goal]', act: 'type', h: { en: 'Ask a research question' }, p: { en: 'Write what you want to find out, in your own words. For example: which methods make transformers cheaper on long inputs? Type a few words.' } },
    { target: '[data-g=paper]', h: { en: 'Optional: one paper' }, p: { en: 'If your question is about a single paper, paste its arXiv link or number here. Leave it empty to search across papers.' } },
    { target: '[data-g=start]', h: { en: 'Search' }, p: { en: 'The search takes a minute or two. You will see each step as it happens, then an answer where every [number] opens the quote it came from.' } },
    { target: '[data-g=examples]', h: { en: 'Not sure what to ask?' }, p: { en: 'Click an example question and the search starts right away.' } },
  ],
  check: [
    { target: '[data-g=search]', act: 'type', h: { en: 'Search the checked papers' }, p: { en: 'Type a title or an arXiv number to find a paper that has already been re-run.' } },
    { target: '[data-g=list]', h: { en: 'The verdicts' }, p: { en: 'Each row says whether the paper\'s reported numbers came out again: reproduced, partly reproduced, not reproduced, or could not run. Open the log to see the run.' } },
    { target: '[data-g=request]', h: { en: 'Ask for a paper to be checked' }, p: { en: 'Send an arXiv link and, if you have it, the code link. We run it and tell you what we find.' } },
  ],
  account: [
    { target: '[data-g=acct-tabs]', act: 'click', h: { en: 'Everything about your account' }, p: { en: 'Profile and password, plan and billing, student verification and invites each have a section here. Click one to open it.' } },
  ],
};

/** Which guide belongs to this address, if any. */
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

const SEEN = 'pl-guides';
const seenOf = (): Record<string, number> => { try { return JSON.parse(localStorage.getItem(SEEN) || '{}'); } catch { return {}; } };
const markSeen = (k: string) => { try { localStorage.setItem(SEEN, JSON.stringify({ ...seenOf(), [k]: 1 })); } catch { /* private mode */ } };

const shown = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
const find = (sel?: string): HTMLElement | null => (sel ? Array.from(document.querySelectorAll<HTMLElement>(sel)).find(shown) ?? null : null);

export function Guide() {
  const { t } = usePrefs();
  const loc = useLocation();
  const key = guideKey(loc.pathname);
  const [run, setRun] = useState<{ key: string; steps: GStep[] } | null>(null);
  const [i, setI] = useState(0);
  const [box, setBox] = useState<DOMRect | null>(null);
  const [ok, setOk] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [late, setLate] = useState(false);
  const timers = useRef<number[]>([]);
  const okRef = useRef(false);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const stop = useCallback(() => {
    setRun((r) => { if (r) markSeen(r.key); return null; });
    setLeaving(false); setOk(false); setI(0);
  }, []);

  // open the guide of this page: the steps whose control is on the screen right now
  const start = useCallback((k: string) => {
    const steps = GUIDES[k].filter((s) => !s.target || find(s.target));
    if (!steps.length) return false;
    setRun({ key: k, steps }); setI(0); setOk(false); setLeaving(false); setLate(false);
    return true;
  }, []);

  // the first visit to a page opens its guide once the page has drawn; ?guide=1 opens it on request
  useEffect(() => {
    setRun(null);
    if (!key) return;
    const force = new URLSearchParams(loc.search).get('guide') === '1';
    if (!force && seenOf()[key]) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      tries++;
      if (document.querySelector('[role=dialog]')) return;   // never on top of another window
      if (find(GUIDES[key][0].target) || tries > 12) {
        window.clearInterval(timer);
        if (find(GUIDES[key][0].target) || !GUIDES[key][0].target) start(key);
      }
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
  const go = useCallback((n: number) => { okRef.current = false; setOk(false); setLate(false); setI(n); }, []);
  const advance = useCallback(() => {
    if (!run) return;
    if (i >= run.steps.length - 1) stop(); else go(i + 1);
  }, [run, i, go, stop]);

  // keep the highlight on the control, even when the page moves or changes under it
  useLayoutEffect(() => {
    if (!step) { setBox(null); return; }
    find(step.target)?.scrollIntoView({ block: 'center' });
    const place = () => { const el = find(step.target); setBox(el ? el.getBoundingClientRect() : null); };
    place();
    const iv = window.setInterval(place, 100);
    window.addEventListener('resize', place);
    return () => { window.clearInterval(iv); window.removeEventListener('resize', place); };
  }, [step]);

  // steps that ask the person to do something wait for it
  useEffect(() => {
    if (!step || !step.act) return;
    okRef.current = false;
    const inside = (n: EventTarget | null) => !!n && Array.from(document.querySelectorAll(step.target as string)).some((el) => el.contains(n as Node));
    const done = () => { if (okRef.current) return; okRef.current = true; setOk(true); later(advance, 750); };
    const onClick = (e: MouseEvent) => { if (inside(e.target)) done(); };
    let typed = 0;
    const onInput = (e: Event) => {
      if (okRef.current || !inside(e.target)) return;
      const v = (e.target as HTMLInputElement).value ?? '';
      window.clearTimeout(typed);
      if (v.trim().length >= 3) typed = window.setTimeout(done, 900);
    };
    if (step.act === 'click') document.addEventListener('click', onClick, true); else document.addEventListener('input', onInput, true);
    later(() => setLate(true), 7000);   // somebody who cannot do the step can still go on
    return () => { document.removeEventListener('click', onClick, true); document.removeEventListener('input', onInput, true); window.clearTimeout(typed); timers.current.forEach(window.clearTimeout); timers.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (!step) return;
    const keyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setLeaving(true); };
    window.addEventListener('keydown', keyDown);
    return () => window.removeEventListener('keydown', keyDown);
  }, [step]);

  const button = key && !run && (
    <button type="button" data-guide-button onClick={() => window.dispatchEvent(new Event('pl-guide'))} title={t(S.guideTip)} aria-label={t(S.guideTip)}
      className="fixed bottom-[76px] left-3 z-40 flex items-center gap-1.5 rounded-full border bg-background/95 px-3 py-2 text-[13px] font-medium text-muted-foreground shadow-md backdrop-blur transition hover:border-primary hover:text-primary lg:bottom-4 lg:left-[264px]">
      <Compass className="h-4 w-4" />{t(S.guide)}
    </button>
  );
  if (!run || !step) return <>{button}</>;

  const W = Math.min(380, window.innerWidth - 24);
  const H = 250;
  const pad = 6;
  let pos: React.CSSProperties = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  if (box) {
    const left = Math.max(12, Math.min(window.innerWidth - W - 12, box.left + box.width / 2 - W / 2));
    if (box.bottom + 14 + H < window.innerHeight) pos = { left, top: box.bottom + 14 };
    else if (box.top - 14 - H > 0) pos = { left, top: box.top - 14 - H };
    else pos = { left: '50%', bottom: 16, transform: 'translateX(-50%)' };
  }
  const hole = box ? { l: box.left - pad, t: box.top - pad, r: box.right + pad, b: box.bottom + pad } : null;
  const dim = 'pointer-events-auto fixed bg-[rgba(10,10,30,0.58)]';
  return (
    <div className="pointer-events-none fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="pl-guide-h">
      {hole ? (
        <>
          <div className={dim} style={{ left: 0, top: 0, right: 0, height: Math.max(0, hole.t) }} />
          <div className={dim} style={{ left: 0, top: hole.t, width: Math.max(0, hole.l), height: hole.b - hole.t }} />
          <div className={dim} style={{ left: hole.r, top: hole.t, right: 0, height: hole.b - hole.t }} />
          <div className={dim} style={{ left: 0, top: hole.b, right: 0, bottom: 0 }} />
          <div className={cn('absolute rounded-xl ring-2 transition-all duration-200', ok ? 'ring-success' : 'ring-primary', step.act ? 'pointer-events-none animate-pulse' : '')} style={{ left: hole.l, top: hole.t, width: hole.r - hole.l, height: hole.b - hole.t }} />
          {!step.act && <div className="pointer-events-auto absolute" style={{ left: hole.l, top: hole.t, width: hole.r - hole.l, height: hole.b - hole.t }} />}
        </>
      ) : <div className="pointer-events-auto absolute inset-0 bg-[rgba(10,10,30,0.58)]" />}
      <div className="pointer-events-auto absolute rounded-2xl border bg-card p-5 text-card-foreground shadow-2xl" style={{ width: W, ...pos }}>
        {leaving ? (
          <div>
            <h2 id="pl-guide-h" className="font-display text-lg font-semibold">{t(S.leaveQ)}</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{t(S.leaveP)}</p>
            <div className="mt-4 flex justify-end gap-2"><Button variant="outline" size="sm" onClick={stop}>{t(S.leave)}</Button><Button size="sm" onClick={() => setLeaving(false)}>{t(S.stay)}</Button></div>
          </div>
        ) : (
          <>
            <button type="button" onClick={() => setLeaving(true)} aria-label={t(S.close)} className="absolute right-3 top-3 rounded-md p-1 text-xs text-muted-foreground hover:bg-muted">✕</button>
            <p className="text-xs font-medium text-muted-foreground">{t(S.of).replace('{i}', String(i + 1)).replace('{n}', String(run.steps.length))}</p>
            <h2 id="pl-guide-h" className="mt-1 pr-6 font-display text-lg font-semibold">{t(step.h)}</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{t(step.p)}</p>
            {step.act && (
              <p className={cn('mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium', ok ? 'bg-success/10 text-success' : 'bg-accent text-primary')} aria-live="polite">
                {ok ? <Check className="h-4 w-4" /> : step.act === 'click' ? <MousePointerClick className="h-4 w-4" /> : <TypeIcon className="h-4 w-4" />}
                {ok ? t(S.nice) : t(step.act === 'click' ? S.tryClick : S.tryType)}
              </p>
            )}
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex gap-1.5" aria-hidden="true">{run.steps.map((_, k) => <span key={k} className={k === i ? 'h-1.5 w-5 rounded-full bg-primary' : 'h-1.5 w-1.5 rounded-full bg-muted-foreground/30'} />)}</div>
              <div className="flex gap-2">
                {i > 0 && <Button variant="outline" size="sm" onClick={() => go(i - 1)}>{t(S.back)}</Button>}
                {step.act
                  ? (late && !ok && <Button variant="ghost" size="sm" onClick={advance}>{t(S.skipStep)}</Button>)
                  : <Button size="sm" onClick={advance}>{last ? t(S.finish) : t(S.next)}</Button>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
