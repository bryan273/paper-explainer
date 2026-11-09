import { ExternalLink } from 'lucide-react';
import { parseArxivId, type Job } from '@/lib/explainer';
import { usePrefs } from '@/lib/prefs';

const T = {
  open: { en: 'Open in a new tab', zh: '在新标签页打开', vi: 'Mở trong tab mới', id: 'Buka di tab baru' },
  page: { en: 'Showing page {p}', zh: '当前第 {p} 页', vi: 'Đang xem trang {p}', id: 'Menampilkan halaman {p}' },
  hint: { en: 'Tap a "Page N" chip in an answer to jump to that page.', zh: '点击回答里的“第 N 页”即可跳转。', vi: 'Bấm nhãn "Trang N" trong câu trả lời để nhảy tới trang đó.', id: 'Ketuk label "Halaman N" di jawaban untuk melompat ke halaman itu.' },
  none: { en: 'The original cannot be shown here.', zh: '这里无法显示原文。', vi: 'Không hiển thị được bản gốc ở đây.', id: 'Aslinya tidak bisa ditampilkan di sini.' },
  upload: { en: 'This came from your file, and we do not keep files. It shows here only in the browser you uploaded it from.', zh: '这来自你上传的文件，我们不保存文件，只在你上传时所用的浏览器中显示。', vi: 'Nội dung từ tệp của bạn và chúng tôi không lưu tệp. Chỉ hiển thị trên trình duyệt bạn đã tải lên.', id: 'Ini dari berkas Anda, dan kami tidak menyimpan berkas. Hanya tampil di peramban tempat Anda mengunggahnya.' },
  link: { en: 'Open the original', zh: '打开原文', vi: 'Mở bản gốc', id: 'Buka aslinya' },
};

export function PaperPane({ job, page, pageKey, localPdf }: { job: Job; page: number | null; pageKey: number; localPdf?: string | null }) {
  const { t } = usePrefs();
  const isUpload = (job.source_url ?? '').startsWith('upload:');
  const arxiv = !job.source_url ? parseArxivId(job.arxiv) : null;
  const base = localPdf || (arxiv ? `https://arxiv.org/pdf/${arxiv}` : null);
  const url = base ? `${base}${page ? `#page=${page}` : ''}` : null;
  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-2 p-4">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{page ? t(T.page).replace('{p}', String(page)) : t(T.hint)}</span>
        {base && <a href={url ?? base} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-medium text-primary no-underline hover:underline">{t(T.open)}<ExternalLink className="h-3 w-3" /></a>}
      </div>
      {url ? <iframe key={`${pageKey}-${base}`} src={url} title="Paper" className="min-h-[520px] w-full rounded-xl border bg-white" />
        : (
          <div className="rounded-xl bg-muted/60 p-4 text-sm">
            <p>{isUpload ? t(T.upload) : t(T.none)}</p>
            {!isUpload && job.source_url && /^https?:/.test(job.source_url) && <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-medium text-primary">{t(T.link)}<ExternalLink className="h-3 w-3" /></a>}
          </div>
        )}
    </div>
  );
}
