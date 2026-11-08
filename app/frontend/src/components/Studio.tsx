import { useMemo, useRef, useState } from 'react';
import type { Lang } from '@/lib/prefs';
import { storageKind, videoUrl, type Job } from '@/lib/explainer';
import { track } from '@/lib/account';
import Player, { type Chapter, type PlayerHandle } from '@/components/Player';
import AskPanel from '@/components/AskPanel';
import PaperPane from '@/components/PaperPane';

const T = {
  en: {
    chapters: 'Chapters', ask: 'Ask', paper: 'Paper', play: 'Play from here', open: 'Read', close: 'Hide', takeaway: 'Takeaway', stuck: 'I do not get this part', jump: 'Jump to this part',
    count: '{n} parts', part: 'Part', prev: 'Previous', next: 'Next',
  },
  zh: {
    chapters: '章节', ask: '提问', paper: '原文', play: '从这里播放', open: '展开', close: '收起', takeaway: '要点', stuck: '这一段我没看懂', jump: '跳到这一段',
    count: '共 {n} 段', part: '第', prev: '上一段', next: '下一段',
  },
} as const;

/** The finished video as one workspace: the player with a chaptered timeline, the chapters with their explanations, and beside them the questions and the paper. */
export default function Studio({ job, lang, localPdf }: { job: Job; lang: Lang; localPdf?: string | null }) {
  const t = T[lang];
  const src = videoUrl(job, lang);
  const player = useRef<PlayerHandle>(null);
  const [tab, setTab] = useState<'ask' | 'paper'>('ask');
  const [page, setPage] = useState<number | null>(null);
  const [pageKey, setPageKey] = useState(0);
  const [seed, setSeed] = useState<{ i: number; n: number } | null>(null);
  const [now, setNow] = useState(0);
  const top = useRef<HTMLDivElement>(null);

  const chapters: Chapter[] = useMemo(
    () =>
      (job.sections ?? [])
        .map((s) => ({ start: s.clip?.[lang]?.[0] ?? s.clip?.en?.[0] ?? -1, end: s.clip?.[lang]?.[1] ?? s.clip?.en?.[1] ?? -1, title: (lang === 'zh' ? s.title_zh || s.title : s.title) || '' }))
        .filter((c) => c.start >= 0 && c.end > c.start),
    [job.sections, lang],
  );
  const current = chapters.findIndex((c) => now >= c.start && now < c.end);
  const secs = job.sections ?? [];
  const poster = secs.find((s) => s.poster)?.poster ?? undefined;

  const goVideo = (time: number) => {
    player.current?.seek(time, true);
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const cite = (c: { page?: number; t?: number }) => {
    if (c.page) {
      setPage(c.page);
      setPageKey((k) => k + 1);
      setTab('paper');
    }
    if (c.t !== undefined) goVideo(c.t);
  };

  if (!src) return null;
  return (
    <div className="studio">
      <div className="studio-main" ref={top}>
        <Player
          ref={player}
          src={src}
          poster={poster}
          chapters={chapters}
          lang={lang}
          title={job.title ?? ''}
          onTime={setNow}
          onPlay={() => {
            const k = storageKind(src);
            if (k) track('video_play', { k });
          }}
        />

        {secs.length > 0 && (() => {
          const idx = Math.max(0, current);
          const s = secs[idx];
          const c = chapters[idx];
          const title = (lang === 'zh' ? s.title_zh || s.title : s.title) || `${t.part} ${idx + 1}`;
          const text = lang === 'zh' ? s.text_zh || s.text : s.text;
          const take = lang === 'zh' ? s.takeaway_zh || s.takeaway : s.takeaway;
          const go = (i: number) => { const ch = chapters[i]; if (ch) goVideo(ch.start); };
          const frac = chapters.length > 1 ? (idx + (c && c.end > c.start ? Math.min(1, Math.max(0, (now - c.start) / (c.end - c.start))) : 0)) / chapters.length : 0;
          return (
            <div className="route">
              <ol className="route-line" aria-label={t.chapters} style={{ ['--p' as string]: `${Math.round(frac * 100)}%` }}>
                {secs.map((x, i) => {
                  const tt = (lang === 'zh' ? x.title_zh || x.title : x.title) || `${t.part} ${i + 1}`;
                  return (
                    <li key={x.i} className={i < idx ? 'past' : i === idx ? 'on' : ''}>
                      <button type="button" onClick={() => go(i)} disabled={!chapters[i]} aria-label={`${t.jump}: ${tt}`} aria-current={i === idx ? 'step' : undefined}>
                        <span className="route-dot">{i + 1}</span>
                        <span className="route-t">{tt}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="route-now" aria-live="polite">
                <div className="row between" style={{ gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <h3 className="sec" style={{ fontSize: 19, margin: 0 }}>{title}</h3>
                  <span className="small muted">{t.count.replace('{n}', String(secs.length))} · {idx + 1}/{secs.length}</span>
                </div>
                {text && <p>{text}</p>}
                {take && <p className="route-take"><b>{t.takeaway}: </b>{take}</p>}
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn ghost small" disabled={idx === 0} onClick={() => go(idx - 1)}>← {t.prev}</button>
                  <button type="button" className="btn ghost small" disabled={idx >= secs.length - 1} onClick={() => go(idx + 1)}>{t.next} →</button>
                  <button type="button" className="btn ghost small" onClick={() => { setSeed({ i: idx, n: Date.now() }); setTab('ask'); }}>{t.stuck}</button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <aside className="studio-side">
        <div className="tabs2" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'ask'} onClick={() => setTab('ask')}>{t.ask}</button>
          <button type="button" role="tab" aria-selected={tab === 'paper'} onClick={() => setTab('paper')}>{t.paper}</button>
        </div>
        <div hidden={tab !== 'ask'}>
          <AskPanel job={job} lang={lang} seed={seed} onCite={cite} />
        </div>
        <div hidden={tab !== 'paper'}>
          <PaperPane job={job} lang={lang} page={page} pageKey={pageKey} localPdf={localPdf} />
        </div>
      </aside>
    </div>
  );
}
