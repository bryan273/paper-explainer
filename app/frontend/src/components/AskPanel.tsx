import { useEffect, useRef, useState, type FormEvent } from 'react';
import { usePrefs, type Lang } from '@/lib/prefs';
import { ApiError, askPaper, getChat, type AskBlock, type ChatMsg, type Job } from '@/lib/explainer';
import { useAccount } from '@/lib/account';

const MODE_KEY = 'pe-ask-mode';

/** The tutor sometimes writes *emphasis* or **bold** even though it is asked not to: show it as emphasis instead of stray asterisks. */
function inline(text: string) {
  return text.split(/([*][*][^*]+[*][*]|[*][^*]+[*])/).map((part, i) => {
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

/** Pieces an answer appears in: a word at a time for spaced scripts, a character at a time for Chinese. */
const units = (text: string) => text.split(/(?<=\s)|(?<=[㐀-鿿＀-￯　-〿])/u).filter(Boolean);

/** One part of an answer. The badge says in words where it comes from; a quote is shown with whether it was found in the paper text. */
function Block({ b, onCite }: { b: AskBlock; onCite?: (c: { page?: number; t?: number }) => void }) {
  const { t, lang } = usePrefs();
  const zh = lang === 'zh';
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const label = b.kind === 'paper' ? `✓ ${t('askBadgePaper')}` : b.kind === 'unverified' ? t('askBadgeUnverified') : t('askBadgeGeneral');
  return (
    <div className={`ablock ${b.kind}`}>
      <span className="abadge">{label}</span>
      <p>{inline(b.text)}</p>
      {b.quote && (
        <blockquote>
          “{b.quote}”
          <span>{b.kind === 'paper' ? t('askQuoteFound') : t('askQuoteMissing')}</span>
        </blockquote>
      )}
      {b.kind === 'paper' && onCite && (b.page || b.t !== undefined) && (
        <div className="acite">
          {b.page ? <button type="button" onClick={() => onCite({ page: b.page })}>{zh ? `原文第 ${b.page} 页` : `Paper p. ${b.page}`}</button> : null}
          {b.t !== undefined ? <button type="button" onClick={() => onCite({ t: b.t })}>{zh ? `视频 ${mmss(b.t)}` : `Video ${mmss(b.t)}`}</button> : null}
        </div>
      )}
    </div>
  );
}

/** A tutor chat about the paper behind a finished video. Answers are labelled: from the paper (with a checked quote) or background knowledge. */
export default function AskPanel({ job, lang, seed, onCite }: { job: Job; lang: Lang; seed: { i: number; n: number } | null; onCite?: (c: { page?: number; t?: number }) => void }) {
  const { t } = usePrefs();
  const { openAuth } = useAccount();
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'plus' | 'paper'>(() => {
    try {
      return localStorage.getItem(MODE_KEY) === 'paper' ? 'paper' : 'plus';
    } catch {
      return 'plus';
    }
  });
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<{ text: string; code?: string } | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [phase, setPhase] = useState(0);   // which thinking step is shown while the answer is being prepared
  const [reveal, setReveal] = useState<{ msg: number; words: number } | null>(null);   // the newest answer appears word by word, like speech
  const box = useRef<HTMLDivElement>(null);
  const seen = useRef<number | null>(null);

  // this visitor's saved conversation about this video
  useEffect(() => {
    let alive = true;
    setMsgs([]);
    setError(null);
    getChat(job.id)
      .then((m) => alive && setMsgs(m))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [job.id]);

  useEffect(() => {
    // a new answer is read from its first line; while waiting, the list stays at the bottom
    const el = box.current;
    if (!el) return;
    const lastEl = el.lastElementChild as HTMLElement | null;
    const newAnswer = !busy && msgs.length > 0 && msgs[msgs.length - 1].role === 'ai';
    el.scrollTop = newAnswer && lastEl ? Math.max(0, lastEl.offsetTop - 4) : el.scrollHeight;
  }, [msgs, busy]);

  const pickMode = (m: 'plus' | 'paper') => {
    setMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* private mode: the choice lasts for this page only */
    }
  };

  const ask = async (q: string, opt: { intent?: 'ask' | 'simpler'; section?: number } = {}) => {
    if (busy) return;
    const intent = opt.intent ?? 'ask';
    const text = q.trim();
    if (intent === 'ask' && text.length < 2) return;
    const sec = opt.section !== undefined ? job.sections?.[opt.section] : undefined;
    const secTitle = sec ? (lang === 'zh' ? sec.title_zh || sec.title : sec.title) ?? '' : '';
    const shown = intent === 'simpler' ? t('askSimplerSent').replace('{title}', secTitle) : text;
    const history = msgs.slice(-6).map((m) => (m.role === 'user' ? { role: 'user' as const, text: m.text } : { role: 'ai' as const, text: m.blocks.map((b) => b.text).join(' ') }));
    setMsgs((m) => [...m, { role: 'user', text: shown, section: opt.section ?? null }]);
    setInput('');
    setBusy(true);
    setError(null);
    const timer = window.setTimeout(() => setSlow(true), 9000);
    setPhase(0);
    const stepper = window.setInterval(() => setPhase((p) => Math.min(p + 1, 3)), 2200);
    try {
      const out = await askPaper({ job: job.id, q: text, mode, intent, section: opt.section, history, lang });
      setMsgs((m) => { setReveal({ msg: m.length, words: 0 }); return [...m, { role: 'ai', blocks: out.blocks, followups: out.followups }]; });
      setLeft(out.left);
    } catch (e) {
      setError({ text: e instanceof ApiError ? e.message : t('networkError'), code: e instanceof ApiError ? e.code : undefined });
    } finally {
      window.clearTimeout(timer);
      window.clearInterval(stepper);
      setSlow(false);
      setBusy(false);
    }
  };

  // "I do not get this part" on a section of the video opens this tab with that part already asked
  useEffect(() => {
    if (!seed || seen.current === seed.n) return;
    seen.current = seed.n;
    ask('', { intent: 'simpler', section: seed.i });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  useEffect(() => {
    if (!reveal) return;
    const m = msgs[reveal.msg];
    if (!m || m.role !== 'ai') { setReveal(null); return; }
    const total = m.blocks.reduce((n, b) => n + units(b.text).length, 0);
    if (reveal.words >= total) { const done = window.setTimeout(() => setReveal(null), 150); return () => window.clearTimeout(done); }
    const tick = window.setTimeout(() => setReveal((r) => (r ? { ...r, words: r.words + 2 } : r)), 40);
    return () => window.clearTimeout(tick);
  }, [reveal, msgs]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };
  const zh = lang === 'zh';
  const steps = zh ? ['正在理解你的问题…', '正在原文中查找…', '正在核对引文…', '正在组织回答…'] : ['Reading your question…', 'Searching the paper…', 'Checking the quotes…', 'Writing the answer…'];
  const last = msgs[msgs.length - 1];
  const followups = last && last.role === 'ai' ? last.followups ?? [] : [];

  return (
    <div className="ask">
      <div className="askhead">
        <div>
          <h3 className="sec" style={{ fontSize: 22, margin: 0 }}>{t('askTitle')}</h3>
          <p className="small muted" style={{ margin: '4px 0 0', maxWidth: 560 }}>{t('askSub')}</p>
        </div>
        <div className="askseg" role="radiogroup" aria-label={t('askModeLabel')}>
          <button type="button" role="radio" aria-checked={mode === 'plus'} onClick={() => pickMode('plus')}>{t('askModePlus')}</button>
          <button type="button" role="radio" aria-checked={mode === 'paper'} onClick={() => pickMode('paper')}>{t('askModePaper')}</button>
        </div>
      </div>

      {msgs.length === 0 && !busy && (
        <div className="chips" role="group" aria-label={t('askNext')}>
          {(['askS1', 'askS2', 'askS3'] as const).map((k) => (
            <button key={k} type="button" onClick={() => ask(t(k))}>{t(k)}</button>
          ))}
        </div>
      )}

      {(msgs.length > 0 || busy) && (
        <div className="askmsgs" ref={box} role="log" tabIndex={0} aria-label={t('askTitle')}>
          {msgs.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="amsg user">{m.text}</div>
            ) : (
              <div key={i} className="amsg ai">
                {(() => {
                  const live = reveal && reveal.msg === i;
                  let budget = live ? reveal.words : Infinity;
                  return m.blocks.map((b, k) => {
                    if (budget <= 0) return null;
                    const words = units(b.text);
                    const cut = words.length > budget;
                    const shown = cut ? { ...b, text: words.slice(0, budget).join('') + ' …', quote: undefined, page: undefined, t: undefined } : b;
                    budget -= words.length;
                    return <Block key={k} b={shown} onCite={onCite} />;
                  });
                })()}
              </div>
            ),
          )}
          {busy && (
            <p className="small muted" role="status" style={{ margin: 0 }}>
              <span className="spin" aria-hidden /> {slow ? t('askStill') : steps[phase]}
            </p>
          )}
        </div>
      )}

      {followups.length > 0 && !busy && !reveal && (
        <div>
          <p className="small muted" style={{ margin: '0 0 6px' }}>{t('askNext')}</p>
          <div className="chips">
            {followups.map((f) => (
              <button key={f} type="button" onClick={() => ask(f)}>{f}</button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="note" role="alert">
          <p style={{ margin: 0 }}>{error.text}</p>
          {error.code === 'ask_guest' && (
            <div className="row" style={{ gap: 8, marginTop: 10 }}>
              <button type="button" className="btn primary small" onClick={() => openAuth('register')}>{t('askSignUp')}</button>
            </div>
          )}
        </div>
      )}

      <form className="askform" onSubmit={submit}>
        <input type="text" value={input} maxLength={600} onChange={(e) => setInput(e.target.value)} placeholder={t('askPlaceholder')} aria-label={t('askTitle')} disabled={busy} autoComplete="off" />
        <button type="submit" className="btn primary" disabled={busy || input.trim().length < 2}>{t('askSend')}</button>
      </form>
      {left !== null && <p className="small muted" style={{ margin: 0 }}>{t('askLeft').replace('{n}', String(left))}</p>}
    </div>
  );
}
