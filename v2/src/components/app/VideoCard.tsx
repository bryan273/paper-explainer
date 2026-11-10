import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Film, Loader2, PlayCircle } from 'lucide-react';
import { usePrefs } from '@/lib/prefs';
import { dateFmt } from '@/lib/strings';
import { posterOfJob, sourceLabel, stageText, type MyJob } from '@/lib/jobs';
import { cn } from '@/lib/utils';

const V = {
  ready: { en: 'Ready', zh: '已完成', vi: 'Sẵn sàng', id: 'Siap' },
  making: { en: 'Making', zh: '生成中', vi: 'Đang tạo', id: 'Dibuat' },
  failed: { en: 'Failed', zh: '失败', vi: 'Lỗi', id: 'Gagal' },
  expired: { en: 'Expired', zh: '已过期', vi: 'Hết hạn', id: 'Kedaluwarsa' },
  min: { en: '{n} min', zh: '{n} 分钟', vi: '{n} phút', id: '{n} menit' },
};

export function VideoCard({ j }: { j: MyJob }) {
  const { lang, t } = usePrefs();
  const poster = posterOfJob(j);
  const running = j.status === 'queued' || j.status === 'running';
  const state = j.expired_at ? 'expired' : j.status === 'done' ? 'ready' : j.status === 'failed' ? 'failed' : 'making';
  return (
    <Link to={`/app/v/${j.id}`} className="group block no-underline">
      <div className="relative overflow-hidden rounded-xl border bg-muted" style={{ aspectRatio: "16 / 9" }}>
        {poster ? <img src={poster} alt="" loading="lazy" className={cn('h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]', state !== 'ready' && 'opacity-60')} />
          : <div className="absolute inset-0 grid place-items-center text-muted-foreground"><Film className="h-8 w-8" /></div>}
        {state === 'ready' && <span className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/25"><PlayCircle className="h-10 w-10 text-white opacity-0 drop-shadow transition group-hover:opacity-100" /></span>}
        <span className={cn('absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
          state === 'ready' ? 'bg-success text-white' : state === 'making' ? 'bg-primary text-primary-foreground' : state === 'failed' ? 'bg-destructive text-white' : 'bg-black/70 text-white')}>
          {running ? <Loader2 className="h-3 w-3 animate-spin" /> : state === 'failed' ? <AlertTriangle className="h-3 w-3" /> : null}{t(V[state])}
        </span>
        {j.seconds ? <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[11px] text-white"><Clock className="h-3 w-3" />{t(V.min).replace('{n}', String(Math.round(j.seconds / 60)))}</span> : null}
      </div>
      <p className="mt-2 line-clamp-2 text-[14px] font-medium leading-snug text-foreground">{j.title || sourceLabel(j)}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{running ? stageText(j.stage, lang) : `${sourceLabel(j)} · ${dateFmt(j.created_at, lang, { day: 'numeric', month: 'short' })}`}</p>
    </Link>
  );
}
