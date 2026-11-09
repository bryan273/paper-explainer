import { forwardRef, type ReactNode, useCallback, useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react';
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { usePrefs } from '@/lib/prefs';
import { cn } from '@/lib/utils';

export type Chapter = { start: number; end: number; title: string };
export type PlayerHandle = { seek: (t: number, play?: boolean) => void; pause: () => void; play: () => void };

const fmt = (s: number) => { if (!Number.isFinite(s) || s < 0) s = 0; return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; };
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const L = {
  play: { en: 'Play', zh: '播放', vi: 'Phát', id: 'Putar' }, pause: { en: 'Pause', zh: '暂停', vi: 'Tạm dừng', id: 'Jeda' },
  mute: { en: 'Mute', zh: '静音', vi: 'Tắt tiếng', id: 'Bisukan' }, unmute: { en: 'Unmute', zh: '取消静音', vi: 'Bật tiếng', id: 'Nyalakan suara' },
  speed: { en: 'Speed', zh: '倍速', vi: 'Tốc độ', id: 'Kecepatan' }, full: { en: 'Full screen', zh: '全屏', vi: 'Toàn màn hình', id: 'Layar penuh' },
  seek: { en: 'Seek', zh: '进度', vi: 'Tiến độ', id: 'Kemajuan' },
};

/** A video player whose timeline is split into the chapters of the script. The overlay (interactive questions) sits inside, so it stays visible in full screen. */
export const Player = forwardRef<PlayerHandle, { src: string; poster?: string; chapters: Chapter[]; title?: string; onTime?: (t: number) => void; onPlay?: () => void; overlay?: ReactNode }>(function Player(
  { src, poster, chapters, title, onTime, onPlay, overlay }, ref,
) {
  const { t } = usePrefs();
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
    const v = vid.current; if (!v) return;
    v.currentTime = Math.max(0, Math.min(time, (v.duration || time) - 0.05));
    setCur(v.currentTime);
    if (play) void v.play().catch(() => undefined);
  }, []);
  useImperativeHandle(ref, () => ({ seek, pause: () => vid.current?.pause(), play: () => { void vid.current?.play().catch(() => undefined); } }), [seek]);
  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === box.current);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const wake = () => { setIdle(false); window.clearTimeout(idleTimer.current); idleTimer.current = window.setTimeout(() => setIdle(true), 2600); };
  useEffect(() => () => window.clearTimeout(idleTimer.current), []);
  const toggle = () => { const v = vid.current; if (!v) return; if (v.paused) void v.play().catch(() => undefined); else v.pause(); };
  const at = (e: { clientX: number }) => { const r = bar.current?.getBoundingClientRect(); if (!r || !total) return 0; return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * total; };
  const key = (e: KeyboardEvent) => {
    if (e.key === ' ' && e.target === box.current) { e.preventDefault(); toggle(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); seek(cur + 5); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); seek(cur - 5); }
    else if (e.key === 'f') { e.preventDefault(); fullscreen(); }
  };
  const fullscreen = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void box.current?.requestFullscreen?.(); };
  const chapterAt = (time: number) => chapters.find((c) => time >= c.start && time < c.end) ?? chapters[chapters.length - 1];
  const now = chapterAt(cur);
  const hov = hover !== null ? chapterAt(hover) : null;
  const span = chapters.length ? chapters : [{ start: 0, end: total || 1, title: '' }];
  const hideCtl = idle && playing;

  return (
    <div ref={box} tabIndex={0} onKeyDown={key} onMouseMove={wake} onTouchStart={wake} role="group" aria-label={title || 'Video'}
      className={cn('group relative overflow-hidden bg-black text-white outline-none sm:rounded-2xl', full ? 'flex h-full w-full items-center' : 'aspect-video w-full')}>
      <video ref={vid} src={src} poster={poster} playsInline preload="metadata" onClick={toggle} className="h-full w-full object-contain"
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onTimeUpdate={(e) => { setCur(e.currentTarget.currentTime); onTime?.(e.currentTarget.currentTime); }}
        onPlay={() => { setPlaying(true); wake(); onPlay?.(); }} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
      {!playing && !overlay && (
        <button type="button" onClick={toggle} aria-label={t(L.play)} className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition hover:scale-105">
          <Play className="ml-1 h-7 w-7 fill-current" />
        </button>
      )}
      {overlay && <div className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-[2px] sm:p-6">{overlay}</div>}
      <div className={cn('absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-2 pt-10 transition-opacity sm:px-4', hideCtl && 'opacity-0', overlay && 'hidden')}>
        {now?.title && <p className="mb-1.5 truncate text-[13px] font-medium text-white/90">{now.title}</p>}
        <div ref={bar} role="slider" tabIndex={0} aria-label={t(L.seek)} aria-valuemin={0} aria-valuemax={Math.round(total)} aria-valuenow={Math.round(cur)} aria-valuetext={`${fmt(cur)} / ${fmt(total)}`}
          className="relative flex h-5 cursor-pointer touch-none items-center gap-[3px]"
          onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setDrag(true); seek(at(e)); }}
          onPointerMove={(e: RPointerEvent) => { setHover(at(e)); if (drag) seek(at(e)); }}
          onPointerUp={() => setDrag(false)} onPointerLeave={() => { if (!drag) setHover(null); }}>
          {span.map((c, i) => {
            const w = ((c.end - c.start) / (total || 1)) * 100;
            const fill = cur <= c.start ? 0 : cur >= c.end ? 100 : ((cur - c.start) / (c.end - c.start)) * 100;
            return <span key={i} className="h-1 overflow-hidden rounded-full bg-white/30 transition-[height] group-hover:h-1.5" style={{ width: `${w}%` }}><i className="block h-full bg-primary" style={{ width: `${fill}%` }} /></span>;
          })}
          <span className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" style={{ left: `${total ? (cur / total) * 100 : 0}%` }} aria-hidden />
          {hover !== null && (
            <span className="pointer-events-none absolute bottom-6 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[11px]" style={{ left: `${total ? Math.min(90, Math.max(10, (hover / total) * 100)) : 0}%` }} aria-hidden>
              {hov?.title && <b className="mr-1.5 font-semibold">{hov.title}</b>}{fmt(hover)}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1">
          <button type="button" onClick={toggle} aria-label={playing ? t(L.pause) : t(L.play)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/15">{playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}</button>
          <span className="ml-1 font-mono text-xs tabular-nums text-white/85">{fmt(cur)} / {fmt(total)}</span>
          <span className="flex-1" />
          <button type="button" onClick={() => { const n = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]; setSpeed(n); if (vid.current) vid.current.playbackRate = n; }} aria-label={`${t(L.speed)} ${speed}x`} className="h-9 rounded-full px-2.5 text-xs font-semibold hover:bg-white/15">{speed}x</button>
          <button type="button" onClick={() => { const v = vid.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); }} aria-label={muted ? t(L.unmute) : t(L.mute)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/15">{muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button>
          <button type="button" onClick={fullscreen} aria-label={t(L.full)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/15">{full ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}</button>
        </div>
      </div>
    </div>
  );
});
