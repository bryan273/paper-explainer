import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoCard } from '@/components/app/VideoCard';
import { useAccount } from '@/lib/account';
import { useMyJobs } from '@/lib/jobs';
import { usePrefs } from '@/lib/prefs';
import { cn } from '@/lib/utils';

const L = {
  h: { en: 'Library', zh: '我的视频', vi: 'Thư viện', id: 'Pustaka' },
  s: { en: 'Every video you made, newest first.', zh: '你做过的所有视频，最新的在前。', vi: 'Mọi video bạn đã tạo, mới nhất trước.', id: 'Semua video yang Anda buat, terbaru di atas.' },
  sGuest: { en: 'Videos made in this browser. Sign up to keep them on every device.', zh: '本浏览器中做过的视频。注册后可在所有设备上查看。', vi: 'Video tạo trên trình duyệt này. Đăng ký để xem trên mọi thiết bị.', id: 'Video yang dibuat di peramban ini. Daftar untuk menyimpannya di semua perangkat.' },
  search: { en: 'Search your videos', zh: '搜索视频', vi: 'Tìm video', id: 'Cari video' },
  all: { en: 'All', zh: '全部', vi: 'Tất cả', id: 'Semua' },
  ready: { en: 'Ready', zh: '已完成', vi: 'Sẵn sàng', id: 'Siap' },
  making: { en: 'Making', zh: '生成中', vi: 'Đang tạo', id: 'Dibuat' },
  failed: { en: 'Failed', zh: '失败', vi: 'Lỗi', id: 'Gagal' },
  newV: { en: 'New video', zh: '新建视频', vi: 'Tạo video', id: 'Video baru' },
  empty: { en: 'Nothing here yet.', zh: '这里还没有内容。', vi: 'Chưa có gì ở đây.', id: 'Belum ada apa-apa.' },
  noMatch: { en: 'No video matches.', zh: '没有匹配的视频。', vi: 'Không có video phù hợp.', id: 'Tidak ada video yang cocok.' },
  more: { en: 'Show more', zh: '显示更多', vi: 'Xem thêm', id: 'Tampilkan lagi' },
};
type F = 'all' | 'ready' | 'making' | 'failed';

export default function LibraryPage() {
  const { t } = usePrefs();
  const { user } = useAccount();
  const { jobs } = useMyJobs();
  const [q, setQ] = useState('');
  const [f, setF] = useState<F>('all');
  const [n, setN] = useState(24);
  const list = useMemo(() => (jobs ?? []).filter((j) => {
    const st: F = j.status === 'done' ? 'ready' : j.status === 'failed' ? 'failed' : 'making';
    return (f === 'all' || st === f) && (!q.trim() || `${j.title ?? ''} ${j.arxiv} ${j.source_url ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()));
  }), [jobs, f, q]);
  return (
    <div className="mx-auto max-w-6xl py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-display text-3xl font-bold">{t(L.h)}</h1><p className="mt-1 text-muted-foreground">{user ? t(L.s) : t(L.sGuest)}</p></div>
        <Button asChild><Link to="/app/new"><Plus className="mr-1.5 h-4 w-4" />{t(L.newV)}</Link></Button>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(L.search)} className="pl-9" aria-label={t(L.search)} /></div>
        <div className="inline-flex w-fit rounded-lg bg-muted p-0.5" role="radiogroup">
          {(['all', 'ready', 'making', 'failed'] as F[]).map((k) => <button key={k} type="button" role="radio" aria-checked={f === k} onClick={() => setF(k)} className={cn('rounded-md px-3 py-1.5 text-sm font-medium', f === k ? 'bg-background shadow-sm' : 'text-muted-foreground')}>{t(L[k])}</button>)}
        </div>
      </div>
      {jobs === null ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i}><Skeleton className="aspect-video rounded-xl" /><Skeleton className="mt-2 h-4 w-3/4" /></div>)}</div>
        : list.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed p-10 text-center text-muted-foreground">{jobs.length ? t(L.noMatch) : t(L.empty)}<div className="mt-4"><Button asChild><Link to="/app/new">{t(L.newV)}</Link></Button></div></div>
        : (
          <>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{list.slice(0, n).map((j) => <VideoCard key={j.id} j={j} />)}</div>
            {list.length > n && <div className="mt-8 text-center"><Button variant="outline" onClick={() => setN(n + 24)}>{t(L.more)}</Button></div>}
          </>
        )}
    </div>
  );
}
