import { srcLabel } from '@/components/sections/MakeSection';
import { useEffect, useState } from 'react';
import { copyText, downloadFile, shareUrl, storageKind, videoUrl, type Job } from '@/lib/explainer';
import { track } from '@/lib/account';
import { usePrefs, type Lang } from '@/lib/prefs';

export function VideoScreen({
  src,
  title,
  poster,
  muted = false,
  autoPlay = false,
  controls = true,
}: {
  src: string;
  title: string;
  poster?: string;
  muted?: boolean;
  autoPlay?: boolean;
  controls?: boolean;
}) {
  return (
    <div className="screen">
      <video
        src={src}
        title={title}
        poster={poster}
        controls={controls}
        muted={muted}
        autoPlay={autoPlay}
        playsInline
        preload="metadata"
      />
    </div>
  );
}

export function LangSeg({ value, options, onChange }: { value: Lang; options: Lang[]; onChange: (l: Lang) => void }) {
  if (options.length < 2) return null;
  return (
    <div className="seg" role="group" aria-label="EN / 中文">
      {options.map((l) => (
        <button key={l} type="button" className={value === l ? 'on' : undefined} aria-pressed={value === l} onClick={() => onChange(l)}>
          {l === 'en' ? 'EN' : '中文'}
        </button>
      ))}
    </div>
  );
}

export function useVideoTools(job: Job | null, lang: Lang) {
  const { t, lang: uiLang } = usePrefs();
  const [busy, setBusy] = useState<'mp4' | 'vertical' | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const en = job?.videos?.en ?? job?.videos?.zh ?? '';
  const suffix = lang === 'zh' ? 'zh' : 'en';
  const arxiv = job?.arxiv ?? '';

  const download = async (vertical: boolean) => {
    const url = job ? (videoUrl(job, lang, vertical) ?? en) : '';
    if (!url) return;
    setBusy(vertical ? 'vertical' : 'mp4');
    await downloadFile(url, `${arxiv}_${suffix}${vertical ? '_vertical' : ''}.mp4`);
    setBusy(null);
  };

  const shareLink = arxiv ? shareUrl(arxiv) : window.location.href;
  const text = t('shareText', { title: job?.title ?? '' });

  return {
    t,
    copied,
    busy,
    download,
    copy: async () => {
      if (await copyText(shareLink)) setCopied(true);
    },
    shareLink,
    shareX: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`,
    shareIn: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`,
    shareWeibo: `https://service.weibo.com/share/share.php?title=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`,
    uiLang,
  };
}

const ICON: Record<string, string> = {
  mp4: 'M12 3v12m0 0l-4-4m4 4l4-4M5 19h14',
  vertical: 'M8 2h8a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2zm4 16h.01',
  link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1',
  check: 'M5 13l4 4L19 7',
  x: 'M4 4l16 16M20 4L4 20',
  in: 'M6 9v10M6 5v.01M11 19v-6a3 3 0 016 0v6M11 9v10',
  weibo: 'M12 20c-4 0-7-2-7-4.5S8 11 12 11s7 2 7 4.5S16 20 12 20zM16 6a5 5 0 013 3M15 8.5a2.5 2.5 0 011.5 1.5',
};
function Icon({ n }: { n: keyof typeof ICON }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICON[n]} />
    </svg>
  );
}

export function ShareRow({ job, lang }: { job: Job; lang: Lang }) {
  const tool = useVideoTools(job, lang);
  const { t } = tool;
  const box = { width: 42, height: 42, padding: 0, display: 'inline-grid', placeItems: 'center' } as const;
  return (
    <div className="actions" style={{ gap: 10 }}>
      <button type="button" className="btn primary" style={box} title={t('dlMp4')} aria-label={t('dlMp4')} onClick={() => tool.download(false)} disabled={tool.busy === 'mp4'}>
        {tool.busy === 'mp4' ? <span className="spin" aria-hidden /> : <Icon n="mp4" />}
      </button>
      {job.videos?.[lang === 'zh' ? 'zh_vertical' : 'en_vertical'] && (
        <button type="button" className="btn ghost" style={box} title={t('dlVertical')} aria-label={t('dlVertical')} onClick={() => tool.download(true)} disabled={tool.busy === 'vertical'}>
          {tool.busy === 'vertical' ? <span className="spin" aria-hidden /> : <Icon n="vertical" />}
        </button>
      )}
      <button type="button" className="btn ghost" style={box} title={tool.copied ? t('copied') : t('copyLink')} aria-label={t('copyLink')} onClick={tool.copy}>
        <Icon n={tool.copied ? 'check' : 'link'} />
      </button>
      <a className="btn ghost" style={box} href={tool.shareX} title={t('shareX')} aria-label={t('shareX')} target="_blank" rel="noopener noreferrer">
        <Icon n="x" />
      </a>
      <a className="btn ghost" style={box} href={tool.shareIn} title={t('shareLinkedIn')} aria-label={t('shareLinkedIn')} target="_blank" rel="noopener noreferrer">
        <Icon n="in" />
      </a>
      <a className="btn ghost" style={box} href={tool.shareWeibo} title={t('shareWeibo')} aria-label={t('shareWeibo')} target="_blank" rel="noopener noreferrer">
        <Icon n="weibo" />
      </a>
    </div>
  );
}

export function Lightbox({
  job,
  lang,
  onClose,
}: {
  job: Job;
  lang: Lang;
  onClose: () => void;
}) {
  const { t } = usePrefs();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const src = videoUrl(job, lang) ?? '';
  useEffect(() => {
    const k = storageKind(src);
    if (k) track('video_play', { k });
  }, [src]);
  if (!src) return null;

  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label={job.title ?? ''} onClick={onClose}>
      <div className="lb-inner" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn ghost small lb-close" onClick={onClose} autoFocus>
          {t('close')} ✕
        </button>
        <video src={src} poster={job.sections?.find((s) => s.poster)?.poster ?? undefined} controls autoPlay playsInline preload="auto" />
        <div className="media-cap">
          <span className="t">{job.title}</span>
          <span className="mono small">{srcLabel(job)}</span>
        </div>
      </div>
    </div>
  );
}
