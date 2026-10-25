import { useEffect, useState, type RefObject } from 'react';

export type PlayerWindow = Window & {
  __done?: boolean;
  PlayerOnEnd?: (cb: () => void) => void;
};

/** Polls the same-origin player iframe for its end-of-playback flag. `runKey` resets detection for a new run. */
export function usePlayerEnded(frameRef: RefObject<HTMLIFrameElement>, runKey: string): boolean {
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    setEnded(false);
    const timer = window.setInterval(() => {
      try {
        const w = frameRef.current?.contentWindow as PlayerWindow | null;
        if (w?.__done) setEnded(true);
      } catch {
        /* the player is same-origin; ignore transient access errors */
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [frameRef, runKey]);

  return ended;
}
