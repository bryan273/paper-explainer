import { forwardRef, type ReactNode, useCallback, useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react';

export type Chapter = { start: number; end: number; title: string };
export type PlayerHandle = { seek: (t: number, play?: boolean) => void; pause: () => void; play: () => void };

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};
const SPEEDS = [0.75, 1, 1.25, 1.5];

const T = {
  en: { play: 'Play', pause: 'Pause', mute: 'Mute', unmute: 'Unmute', speed: 'Speed', full: 'Full screen', seek: 'Seek', chapter: 'Chapter' },
  zh: { play: '播放', pause: '暂停', mute: '静音', unmute: '取消静音', speed: '倍速', full: '全屏', seek: '进度', chapter: '章节' },
  vi: { play: 'Phát', pause: 'Tạm dừng', mute: 'Tắt tiếng', unmute: 'Bật tiếng', speed: 'Tốc độ', full: 'Toàn màn hình', seek: 'Tiến độ', chapter: 'Phần' },
  id: { play: 'Putar', pause: 'Jeda', mute: 'Bisukan', unmute: 'Nyalakan suara', speed: 'Kecepatan', full: 'Layar penuh', seek: 'Kemajuan', chapter: 'Bagian' },
} as const;

/** A video player whose timeline is cut into the chapters of the script, like a YouTube chapter bar: click a piece to jump to that section. */
const Player = forwardRef<PlayerHandle, { src: string; poster?: string; chapters: Chapter[]; lang: 'en' | 'zh' | 'vi' | 'id'; title?: string; onTime?: (t: number) => void; onPlay?: () => void; overlay?: ReactNode }>(function Player(
  { src, poster, chapters, lang, title, onTime, onPlay, overlay },
  ref,
) {
  const t = T[lang];
  const box = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [hover, setHover] = useState<number | null>(null);
  const [idle, setIdle] = useState(false);
  const [full, setFull] = useState(false);
  const [drag, setDrag] = useState(false);
  const idleTimer = useRef<number>();

  const total = dur || chapters[chapters.length - 1]?.end || 0;
  const seek = useCallback((time: number, play = false) => {
    const v = vid.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(time, (v.duration || time) - 0.05));
    setCur(v.currentTime);
    if (play) void v.play().catch(() => undefined);
  }, []);
  useImperativeHandle(ref, () => ({ seek, pause: () => vid.current?.pause(), play: () => { void vid.current?.play(); } }), [seek]);

  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === box.current);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  const wake = () => {
    setIdle(false);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIdle(true), 2600);
  };
  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  const toggle = () => {
    const v = vid.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => undefined);
    else v.pause();
  };
  const at = (e: { clientX: number }) => {
    const r = bar.current?.getBoundingClientRect();
    if (!r || !total) return 0;
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * total;
  };
  const down = (e: RPointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag(true);
    seek(at(e));
  };
  const move = (e: RPointerEvent) => {
    setHover(at(e));
    if (drag) seek(at(e));
  };
  const key = (e: KeyboardEvent) => {
    if (e.key === ' ' && e.target === box.current) { e.preventDefault(); toggle(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); seek(cur + 5); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); seek(cur - 5); }
  };

  const chapterAt = (time: number) => chapters.find((c) => time >= c.start && time < c.end) ?? chapters[chapters.length - 1];
  const now = chapterAt(cur);
  const hov = hover !== null ? chapterAt(hover) : null;
  const span = chapters.length ? chapters : [{ start: 0, end: total || 1, title: '' }];

  return (
    <div
      ref={box}
      className={`pl${idle && playing ? ' idle' : ''}${full ? ' full' : ''}`}
      tabIndex={0}
      onKeyDown={key}
      onMouseMove={wake}
      onTouchStart={wake}
      role="group"
      aria-label={title || 'Video'}
    >
      <div className="pl-stage">
      <video
        ref={vid}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        onClick={toggle}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onTimeUpdate={(e) => { setCur(e.currentTarget.currentTime); onTime?.(e.currentTarget.currentTime); }}
        onPlay={() => { setPlaying(true); wake(); onPlay?.(); }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      {!playing && !overlay && (
        <button type="button" className="pl-big" onClick={toggle} aria-label={t.play}>
          <svg viewBox="0 0 24 24" aria-hidden><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
        </button>
      )}
      </div>
      {overlay && <div className="pl-overlay">{overlay}</div>}
      <div className="pl-ctl">
        {now?.title && <div className="pl-now">{now.title}</div>}
        <div
          ref={bar}
          className="pl-bar"
          role="slider"
          tabIndex={0}
          aria-label={t.seek}
          aria-valuemin={0}
          aria-valuemax={Math.round(total)}
          aria-valuenow={Math.round(cur)}
          aria-valuetext={`${fmt(cur)} / ${fmt(total)}${now?.title ? `, ${t.chapter}: ${now.title}` : ''}`}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={() => setDrag(false)}
          onPointerLeave={() => { if (!drag) setHover(null); }}
        >
          {span.map((c, i) => {
            const w = ((c.end - c.start) / (total || 1)) * 100;
            const fill = cur <= c.start ? 0 : cur >= c.end ? 100 : ((cur - c.start) / (c.end - c.start)) * 100;
            return (
              <span key={i} className="pl-seg" style={{ width: `${w}%` }}>
                <span className="pl-track"><i style={{ width: `${fill}%` }} /></span>
              </span>
            );
          })}
          <span className="pl-thumb" style={{ left: `${total ? (cur / total) * 100 : 0}%` }} aria-hidden />
          {hover !== null && (
            <span className="pl-tip" style={{ left: `${total ? Math.min(92, Math.max(8, (hover / total) * 100)) : 0}%` }} aria-hidden>
              {hov?.title && <b>{hov.title}</b>}
              {fmt(hover)}
            </span>
          )}
        </div>
        <div className="pl-row">
          <button type="button" className="pl-b" onClick={toggle} aria-label={playing ? t.pause : t.play}>
            {playing ? (
              <svg viewBox="0 0 24 24" aria-hidden><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
            )}
          </button>
          <span className="pl-time">{fmt(cur)} / {fmt(total)}</span>
          <span className="pl-sp" />
          <button
            type="button"
            className="pl-b pl-txt"
            onClick={() => {
              const n = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
              setSpeed(n);
              if (vid.current) vid.current.playbackRate = n;
            }}
            aria-label={`${t.speed} ${speed}x`}
          >
            {speed}x
          </button>
          <button type="button" className="pl-b" onClick={() => { const v = vid.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); }} aria-label={muted ? t.unmute : t.mute}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" />
              {muted ? <path d="M15 9.5l5 5M20 9.5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /> : <path d="M15.5 9a4 4 0 010 6M18 6.5a8 8 0 010 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />}
            </svg>
          </button>
          <button
            type="button"
            className="pl-b"
            onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void box.current?.requestFullscreen?.(); }}
            aria-label={t.full}
          >
            <svg viewBox="0 0 24 24" aria-hidden><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
});

export default Player;
