import type { Lang } from '@/lib/prefs';
import { parseArxivId, type Job } from '@/lib/explainer';

const T = {
  en: {
    title: 'The paper', page: 'Showing page {p}', open: 'Open the PDF in a new tab', none: 'The original is not shown here.', upload: 'You uploaded this PDF, and we do not keep your file. Upload it again here to read along.',
    link: 'Open the original', hint: 'Click "p. N" in an answer to jump to that page.', local: 'Your file',
  },
  zh: {
    title: '原文', page: '当前第 {p} 页', open: '在新标签页打开 PDF', none: '这里无法显示原文。', upload: '这是你上传的 PDF，我们不保存你的文件。重新选择该文件即可在此对照阅读。',
    link: '打开原文', hint: '点击答案里的“第 N 页”可跳到对应页。', local: '你的文件',
  },
} as const;

/** The original paper beside the video and the answers. An answer's "p. 5" opens the PDF on that page. */
export default function PaperPane({ job, lang, page, pageKey, localPdf }: { job: Job; lang: Lang; page: number | null; pageKey: number; localPdf?: string | null }) {
  const t = T[lang === 'zh' ? 'zh' : 'en'];
  const isUpload = (job.source_url ?? '').startsWith('upload:');
  const arxiv = !job.source_url ? parseArxivId(job.arxiv) : null;
  const base = localPdf || (arxiv ? `https://arxiv.org/pdf/${arxiv}` : null);
  const url = base ? `${base}${page ? `#page=${page}` : ''}` : null;
  return (
    <div className="paper">
      <div className="row between" style={{ gap: 8, flexWrap: 'wrap' }}>
        <h3 className="sec" style={{ fontSize: 20, margin: 0 }}>{t.title}</h3>
        {base && (
          <a className="small" href={url ?? base} target="_blank" rel="noopener noreferrer">
            {t.open} ↗
          </a>
        )}
      </div>
      {url ? (
        <>
          <p className="small muted" style={{ margin: '6px 0 10px' }}>{page ? t.page.replace('{p}', String(page)) : t.hint}</p>
          <iframe key={`${pageKey}-${base}`} className="paper-frame" src={url} title={t.title} />
        </>
      ) : (
        <div className="note" style={{ marginTop: 12 }}>
          <p style={{ margin: 0 }}>{isUpload ? t.upload : t.none}</p>
          {!isUpload && job.source_url && /^https?:/.test(job.source_url) && (
            <p style={{ margin: '8px 0 0' }}>
              <a href={job.source_url} target="_blank" rel="noopener noreferrer">{t.link} ↗</a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
