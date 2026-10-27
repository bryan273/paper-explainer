import { useEffect, useState } from 'react';
import { copyText, downloadFile, shareUrl, videoUrl, type Job } from '@/lib/explainer';
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

  const en = job?.videos?.en ?? '';
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

export function ShareRow({ job, lang }: { job: Job; lang: Lang }) {
  const tool = useVideoTools(job, lang);
  const { t } = tool;
  return (
    <div className="actions">
      <button type="button" className="btn primary" onClick={() => tool.download(false)} disabled={tool.busy === 'mp4'}>
        {tool.busy === 'mp4' ? <span className="spin" aria-hidden /> : '↓'}
        {t('dlMp4')}
      </button>
      {job.videos?.[lang === 'zh' ? 'zh_vertical' : 'en_vertical'] && (
        <button type="button" className="btn ghost" onClick={() => tool.download(true)} disabled={tool.busy === 'vertical'}>
          {tool.busy === 'vertical' ? <span className="spin" aria-hidden /> : '▯'}
          {t('dlVertical')}
        </button>
      )}
      <button type="button" className="btn ghost" onClick={tool.copy}>
        {tool.copied ? t('copied') : t('copyLink')}
      </button>
      <a className="btn ghost" href={tool.shareX} target="_blank" rel="noopener noreferrer">
        {t('shareX')}
      </a>
      <a className="btn ghost" href={tool.shareIn} target="_blank" rel="noopener noreferrer">
        {t('shareLinkedIn')}
      </a>
      <a className="btn ghost" href={tool.shareWeibo} target="_blank" rel="noopener noreferrer">
        {t('shareWeibo')}
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
  if (!src) return null;

  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label={job.title ?? ''} onClick={onClose}>
      <div className="lb-inner" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn ghost small lb-close" onClick={onClose} autoFocus>
          {t('close')} ✕
        </button>
        <video src={src} controls autoPlay playsInline />
        <div className="media-cap">
          <span className="t">{job.title}</span>
          <span className="mono small">arXiv:{job.arxiv}</span>
        </div>
      </div>
    </div>
  );
}
