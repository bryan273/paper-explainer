import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Check, PencilLine, ChevronLeft, ChevronRight, Circle, FileText, HelpCircle, Loader2, MessageSquare, RotateCcw, Share2, Sparkles, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Player, type Chapter, type PlayerHandle } from '@/components/watch/Player';
import { AskPanel } from '@/components/watch/AskPanel';
import { QuizPanel, Options, type QLog } from '@/components/watch/QuizPanel';
import { PaperPane } from '@/components/watch/PaperPane';
import { ApiError, askPaper, availableLangs, copyText, editJob, editsOf, getJob, isMine, localPdfs, quizAll, quizPart, secText, storageKind, videoUrl, type EditKind, type Job, type Quiz } from '@/lib/explainer';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { track, useAccount } from '@/lib/account';
import { fill, usePrefs, type Lang, pick } from '@/lib/prefs';
import { dateFmt } from '@/lib/strings';
import { progressOf, sourceLabel, stageText, stepOf } from '@/lib/jobs';
import { cn } from '@/lib/utils';

const KIND_IDS: EditKind[] = ['fix', 'add', 'simpler', 'deeper', 'other'];
const W = {
  notFound: { en: 'This video does not exist or was removed.', zh: '这个视频不存在或已被删除。', vi: 'Video này không tồn tại hoặc đã bị xóa.', id: 'Video ini tidak ada atau sudah dihapus.' },
  making: { en: 'Making your video', zh: '正在制作视频', vi: 'Đang tạo video', id: 'Membuat video Anda' },
  closeOk: { en: 'You can close this tab. It keeps going and waits in your Library.', zh: '可以关掉页面，它会继续生成并保存在视频库里。', vi: 'Bạn có thể đóng tab này. Video vẫn được tạo tiếp và chờ trong Thư viện.', id: 'Anda boleh menutup tab. Proses berlanjut dan menunggu di Pustaka.' },
  left: { en: 'About {n} min left', zh: '大约还需 {n} 分钟', vi: 'Còn khoảng {n} phút', id: 'Sekitar {n} menit lagi' },
  steps: { en: ['Reading the source', 'Writing the script', 'Checking quotes and numbers', 'Drawing and recording'], zh: ['阅读资料', '撰写讲稿', '核对引文和数字', '绘制并录音'], vi: ['Đọc nguồn', 'Viết kịch bản', 'Kiểm tra trích dẫn và số liệu', 'Vẽ và thu âm'], id: ['Membaca sumber', 'Menulis naskah', 'Memeriksa kutipan dan angka', 'Menggambar dan merekam'] },
  queued: { en: 'Waiting for a free renderer', zh: '等待空闲渲染器', vi: 'Đang chờ máy dựng trống', id: 'Menunggu perender kosong' },
  parts: { en: 'Parts', zh: '章节', vi: 'Các phần', id: 'Bagian' },
  failed: { en: 'This video could not be made', zh: '这个视频没能生成', vi: 'Không tạo được video này', id: 'Video ini tidak bisa dibuat' },
  failedP: { en: 'Nothing was used: the credit went back to your balance. Common reasons: the page needs a login, is behind a paywall, or has too little text.', zh: '没有扣次数，额度已退还。常见原因：页面需要登录、付费墙，或正文太少。', vi: 'Không mất lượt: tín dụng đã được hoàn lại. Lý do thường gặp: trang cần đăng nhập, bị chặn trả phí, hoặc có quá ít nội dung.', id: 'Tidak ada yang terpakai: kredit sudah dikembalikan. Penyebab umum: halaman perlu login, berbayar, atau teksnya terlalu sedikit.' },
  tryText: { en: 'Paste the text instead', zh: '改为粘贴文字', vi: 'Dán văn bản thay thế', id: 'Tempel teksnya saja' },
  tryFile: { en: 'Upload the PDF', zh: '上传 PDF', vi: 'Tải PDF lên', id: 'Unggah PDF' },
  again: { en: 'Try again', zh: '重试', vi: 'Thử lại', id: 'Coba lagi' },
  support: { en: 'Ask support', zh: '联系客服', vi: 'Hỏi hỗ trợ', id: 'Tanya bantuan' },
  ask: { en: 'Ask', zh: '提问', vi: 'Hỏi', id: 'Tanya' },
  quiz: { en: 'Quiz', zh: '测验', vi: 'Kiểm tra', id: 'Kuis' },
  paper: { en: 'Source', zh: '原文', vi: 'Nguồn', id: 'Sumber' },
  edit: { en: 'Edit' },
  editH: { en: 'Edit this video' },
  editS: { en: 'Choose a part and say what to change. Only that part is made again; the rest stays as it is. An edit does not use a video credit.' },
  editPart: { en: 'Which part?' },
  editKind: { en: 'What kind of change?' },
  kinds: { en: ['Fix a mistake', 'Add detail', 'Make it simpler', 'Go deeper', 'Something else'] },
  editNote: { en: 'What should change?' },
  editPh: { en: 'e.g. The formula on screen is wrong: it should be F(x) + x. Also say why the shortcut helps training.' },
  editLeft: { en: '{n} of {c} edits left for this video' },
  editNone: { en: 'This video has used all its edits. Make a new video, or choose a plan with more edits.' },
  editGo: { en: 'Make the new version' },
  editWait: { en: 'The new version is being made. This page shows it as soon as it is ready.' },
  editSign: { en: 'Sign in to edit your videos.' },
  share: { en: 'Share', zh: '分享', vi: 'Chia sẻ', id: 'Bagikan' },
  copied: { en: 'Link copied', zh: '链接已复制', vi: 'Đã sao chép liên kết', id: 'Tautan disalin' },
  shareHint: { en: 'Anyone with the link can watch. Asking needs a free account.', zh: '拿到链接的人都能观看，提问需要免费账户。', vi: 'Ai có liên kết đều xem được. Muốn hỏi cần tài khoản miễn phí.', id: 'Siapa pun dengan tautan bisa menonton. Bertanya butuh akun gratis.' },
  guestH: { en: 'You are watching a shared video', zh: '你正在观看分享的视频', vi: 'Bạn đang xem video được chia sẻ', id: 'Anda menonton video yang dibagikan' },
  guestP: { en: 'Sign up free to ask questions, take the quiz and make your own videos.', zh: '免费注册即可提问、做测验并制作自己的视频。', vi: 'Đăng ký miễn phí để đặt câu hỏi, làm bài kiểm tra và tạo video của riêng bạn.', id: 'Daftar gratis untuk bertanya, mengerjakan kuis, dan membuat video sendiri.' },
  signup: { en: 'Sign up free', zh: '免费注册', vi: 'Đăng ký miễn phí', id: 'Daftar gratis' },
  login: { en: 'Log in', zh: '登录', vi: 'Đăng nhập', id: 'Masuk' },
  inter: { en: 'Interactive mode', zh: '互动模式', vi: 'Chế độ tương tác', id: 'Mode interaktif' },
  interHint: { en: 'Stops after each part with one question.', zh: '每段结束暂停并提问一题。', vi: 'Dừng sau mỗi phần với một câu hỏi.', id: 'Berhenti setiap bagian dengan satu pertanyaan.' },
  interLeft: { en: '{n} of {c} left this month', zh: '本月还剩 {n} / {c} 次', vi: 'Còn {n}/{c} lượt trong tháng này', id: 'Sisa {n} dari {c} bulan ini' },
  interLeftW: { en: '{n} of {c} left this week', zh: '本周还剩 {n} / {c} 次', vi: 'Còn {n}/{c} lượt trong tuần này', id: 'Sisa {n} dari {c} minggu ini' },
  interUses: { en: 'Turning it on here uses 1.', zh: '在这里打开会用掉 1 个。', vi: 'Bật ở đây sẽ dùng 1 lượt.', id: 'Menyalakan di sini memakai 1.' },
  interCounted: { en: 'Counted for this video: switching off and on is free.', zh: '本视频已计入：再次开关不扣次数。', vi: 'Đã tính cho video này: tắt bật lại miễn phí.', id: 'Sudah dihitung untuk video ini: matikan dan nyalakan lagi gratis.' },
  interNone: { en: 'Interactive mode is used up for now. It comes back on {d}.', zh: '互动模式次数已用完，{d} 恢复。', vi: 'Đã hết lượt tương tác. Có lại vào {d}.', id: 'Jatah mode interaktif habis. Kembali pada {d}.' },
  interReady: { en: 'Questions ready {a}/{b}', zh: '题目已准备 {a}/{b}', vi: 'Câu hỏi sẵn sàng {a}/{b}', id: 'Pertanyaan siap {a}/{b}' },
  interOld: { en: 'This video was made before interactive mode existed, so it has no stopping points. Make it again to use it.', zh: '这个视频制作于互动模式上线之前，没有暂停点。重新生成后即可使用。', vi: 'Video này được tạo trước khi có chế độ tương tác nên không có điểm dừng. Hãy tạo lại để dùng.', id: 'Video ini dibuat sebelum ada mode interaktif, jadi tidak punya titik berhenti. Buat ulang untuk memakainya.' },
  upsell: { en: 'Plus gives interactive mode on 40 videos a month, Pro 75, Premium 140.', zh: 'Plus 每月 40 个视频可开互动模式，Pro 75 个，Premium 140 个。', vi: 'Plus có chế độ tương tác cho 40 video mỗi tháng, Pro 75, Premium 140.', id: 'Plus memberi mode interaktif untuk 40 video per bulan, Pro 75, Premium 140.' },
  plans: { en: 'See plans', zh: '查看套餐', vi: 'Xem các gói', id: 'Lihat paket' },
  check: { en: 'Check yourself', zh: '自测一下', vi: 'Tự kiểm tra', id: 'Uji diri' },
  skip: { en: 'Skip', zh: '跳过', vi: 'Bỏ qua', id: 'Lewati' },
  qLoading: { en: 'Getting the question…', zh: '正在取题…', vi: 'Đang lấy câu hỏi…', id: 'Mengambil pertanyaan…' },
  right: { en: 'Correct', zh: '答对了', vi: 'Chính xác', id: 'Benar' },
  wrong: { en: 'Not quite', zh: '不太对', vi: 'Chưa đúng', id: 'Belum tepat' },
  cont: { en: 'Continue', zh: '继续播放', vi: 'Xem tiếp', id: 'Lanjutkan' },
  more: { en: 'Explain more', zh: '再讲深一点', vi: 'Giải thích thêm', id: 'Jelaskan lagi' },
  replay: { en: 'Replay this part', zh: '重看这一段', vi: 'Xem lại phần này', id: 'Ulang bagian ini' },
  chapters: { en: 'Chapters', zh: '章节', vi: 'Các chương', id: 'Bab' },
  takeaway: { en: 'Key point', zh: '要点', vi: 'Ý chính', id: 'Poin utama' },
  stuck: { en: 'I do not get this part', zh: '这部分没看懂', vi: 'Tôi chưa hiểu phần này', id: 'Saya belum paham bagian ini' },
  prev: { en: 'Previous', zh: '上一节', vi: 'Trước', id: 'Sebelumnya' },
  next: { en: 'Next', zh: '下一节', vi: 'Tiếp', id: 'Berikutnya' },
  noVideo: { en: 'The video file has expired. Make it again to watch.', zh: '视频文件已过期，重新生成即可观看。', vi: 'Tệp video đã hết hạn. Hãy tạo lại để xem.', id: 'Berkas video sudah kedaluwarsa. Buat ulang untuk menonton.' },
  makeAgain: { en: 'Make it again', zh: '重新生成', vi: 'Tạo lại', id: 'Buat lagi' },
  library: { en: 'Library', zh: '视频库', vi: 'Thư viện', id: 'Pustaka' },
  exErr: { en: 'Could not explain this right now.', zh: '暂时无法讲解。', vi: 'Hiện chưa giải thích được.', id: 'Belum bisa menjelaskan sekarang.' },
};

type CheckState = { i: number; status: 'loading' | 'ready' | 'error'; quiz?: Quiz; picked?: number; err?: string; code?: string; explain?: { status: 'loading' | 'ready' | 'error'; text?: string } };

export default function Watch() {
  const { id = '' } = useParams();
  const { lang: ui, t } = usePrefs();
  const [job, setJob] = useState<Job | null>(null);
  const [err, setErr] = useState('');
  const started = useRef(Date.now());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let alive = true, timer = 0, fails = 0;
    const load = () => getJob(id).then((j) => {
      if (!alive) return;
      setJob(j); fails = 0;
      if (j.created_at) started.current = Date.parse(j.created_at) || started.current;
      if (j.status !== 'done' && j.status !== 'failed') timer = window.setTimeout(load, 5000);
      else { try { if (localStorage.getItem('pe-active-job') === j.id) localStorage.removeItem('pe-active-job'); } catch { /* private */ } }
    }).catch((e) => { if (!alive) return; if (e instanceof ApiError && e.status === 404) setErr(t(W.notFound)); else if (++fails < 20) timer = window.setTimeout(load, 6000); else setErr(t(W.notFound)); });
    setJob(null); setErr(''); load();
    return () => { alive = false; window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => { const i = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(i); }, []);

  if (err) return <Center><AlertTriangle className="h-8 w-8 text-warning" /><p className="mt-3">{err}</p><Button asChild className="mt-4"><Link to="/app/library">{t(W.library)}</Link></Button></Center>;
  if (!job) return <Center><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></Center>;
  if (job.status === 'failed') return <Failed job={job} />;
  if (job.status !== 'done') return <Making job={job} started={started.current} now={now} lang={ui} />;
  return <Studio job={job} />;
}

function Center({ children }: { children: React.ReactNode }) { return <div className="grid min-h-[60vh] place-items-center text-center"><div className="grid place-items-center">{children}</div></div>; }

function Making({ job, started, now, lang }: { job: Job; started: number; now: number; lang: Lang }) {
  const { t } = usePrefs();
  const st = stepOf(job);
  const { pct, leftMin } = progressOf(job, started, now);
  const secs = job.sections ?? [];
  return (
    <div className="mx-auto max-w-3xl py-10">
      <Link to="/app/library" className="inline-flex items-center gap-1 text-sm text-muted-foreground no-underline hover:text-foreground"><ArrowLeft className="h-4 w-4" />{t(W.library)}</Link>
      <div className="pl-card mt-4 overflow-hidden">
        <div className="relative h-1.5 bg-muted"><div className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000" style={{ width: `${pct}%` }} /></div>
        <div className="p-6 sm:p-8">
          <p className="flex items-center gap-2 text-sm font-medium text-primary"><Loader2 className="h-4 w-4 animate-spin" />{t(W.making)} · {pct}%</p>
          <h1 className="mt-2 font-display text-2xl font-bold">{job.title || sourceLabel(job)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{st < 0 ? t(W.queued) : stageText(job.stage, lang)} · {fill(t(W.left), { n: leftMin })}</p>
          <ol className="mt-6 grid gap-3">
            {pick(lang, W.steps).map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                {i < st ? <span className="grid h-6 w-6 place-items-center rounded-full bg-success text-white"><Check className="h-3.5 w-3.5" /></span>
                  : i === st ? <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /></span>
                  : <Circle className="h-6 w-6 text-muted-foreground/40" />}
                <span className={cn(i > st && 'text-muted-foreground')}>{s}</span>
              </li>
            ))}
          </ol>
          {secs.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold">{t(W.parts)}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {secs.map((s) => (
                  <div key={s.i} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                    {s.status === 'done' ? <Check className="h-4 w-4 text-success" /> : <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <span className="truncate">{secText(s, 'title', job.langs && job.langs !== 'both' ? job.langs : lang)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="mt-6 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">{t(W.closeOk)}</p>
        </div>
      </div>
    </div>
  );
}

function Failed({ job }: { job: Job }) {
  const { t } = usePrefs();
  const url = job.source_url && /^https?:/.test(job.source_url) ? job.source_url : /^\d{4}\.\d{4,5}$/.test(job.arxiv) ? `https://arxiv.org/abs/${job.arxiv}` : '';
  return (
    <div className="mx-auto max-w-2xl py-12">
      <div className="pl-card p-6 sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive"><AlertTriangle className="h-6 w-6" /></span>
        <h1 className="mt-4 font-display text-2xl font-bold">{t(W.failed)}</h1>
        {job.title && <p className="mt-1 text-sm text-muted-foreground">{job.title}</p>}
        {job.error && <p className="mt-4 rounded-lg bg-muted px-4 py-3 text-sm">{job.error}</p>}
        <p className="mt-4 text-sm text-muted-foreground">{t(W.failedP)}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {url && <Button asChild><Link to={`/app/new?url=${encodeURIComponent(url)}`}><RotateCcw className="mr-1.5 h-4 w-4" />{t(W.again)}</Link></Button>}
          <Button asChild variant="outline"><Link to="/app/new?tab=text">{t(W.tryText)}</Link></Button>
          <Button asChild variant="outline"><Link to="/app/new?tab=file">{t(W.tryFile)}</Link></Button>
          <Button variant="ghost" onClick={() => window.dispatchEvent(new CustomEvent('pl-support', { detail: 'contact' }))}><HelpCircle className="mr-1.5 h-4 w-4" />{t(W.support)}</Button>
        </div>
      </div>
    </div>
  );
}

function Studio({ job }: { job: Job }) {
  const { lang: ui, t } = usePrefs();
  const { user, me, openAuth, refresh } = useAccount();
  const nav = useNavigate();
  const langs = availableLangs(job);
  const [lang, setLang] = useState<Lang>(() => (langs.includes(ui) ? ui : langs[0] ?? 'en'));
  const src = videoUrl(job, lang);
  const guest = !user && !isMine(job.id);
  const player = useRef<PlayerHandle>(null);
  const [tab, setTab] = useState<'ask' | 'quiz' | 'paper'>('ask');
  const [page, setPage] = useState<number | null>(null);
  const [pageKey, setPageKey] = useState(0);
  const [seed, setSeed] = useState<{ i: number; n: number } | null>(null);
  const [now, setNow] = useState(0);
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [edits, setEdits] = useState<{ used: number; cap: number } | null>(null);
  const [ePart, setEPart] = useState(0);
  const [eKind, setEKind] = useState<EditKind>('fix');
  const [eNote, setENote] = useState('');
  const [eBusy, setEBusy] = useState(false);
  const [eErr, setEErr] = useState('');
  const openEdit = () => { setEditOpen(true); setEErr(''); setEPart(Math.max(0, current)); editsOf(job.id).then(setEdits).catch(() => setEdits(null)); };
  const sendEdit = async () => {
    setEBusy(true); setEErr('');
    try { const n = await editJob(job.id, ePart, eKind, eNote.trim()); track('video_edit', { kind: eKind }); setEditOpen(false); nav(`/app/v/${n.id}`); }
    catch (x) { setEErr(x instanceof ApiError ? x.message : (x as Error).message); }
    finally { setEBusy(false); }
  };
  const secs = job.sections ?? [];
  const chapters: Chapter[] = useMemo(() => secs.map((s) => ({ start: s.clip?.[lang as 'en']?.[0] ?? s.clip?.en?.[0] ?? -1, end: s.clip?.[lang as 'en']?.[1] ?? s.clip?.en?.[1] ?? -1, title: secText(s, 'title', lang) })).filter((c) => c.start >= 0 && c.end > c.start), [secs, lang]);
  const current = Math.max(0, chapters.findIndex((c) => now >= c.start && now < c.end));
  const poster = secs.find((s) => s.poster)?.poster ?? undefined;

  // quiz log of this video and language
  const logKey = `pe-qlog:${job.id}:${lang}`;
  const readLog = (): QLog => { try { const v = JSON.parse(localStorage.getItem(logKey) ?? 'null') as QLog | null; return v && v.parts && v.finals ? v : { parts: {}, finals: [] }; } catch { return { parts: {}, finals: [] }; } };
  const [qlog, setQ] = useState<QLog>(readLog);
  const setQlog = (l: QLog) => { setQ(l); try { localStorage.setItem(logKey, JSON.stringify(l)); } catch { /* full */ } };

  // interactive mode: chosen per video, counted per month by the server
  const interKey = `pe-inter:${job.id}`;
  const readInter = () => { try { const v = localStorage.getItem(interKey); return v ? v === '1' : false; } catch { return false; } };
  const [inter, setInter] = useState(readInter);
  const [iu, setIu] = useState(me?.interactive ?? null);
  const [counted, setCounted] = useState(() => !!me?.interactive?.jobs?.includes(job.id) || (() => { try { return localStorage.getItem(`pe-inter-counted:${job.id}`) === '1'; } catch { return false; } })());
  const [interErr, setInterErr] = useState<{ msg: string; code: string } | null>(null);
  const [prepared, setPrepared] = useState(0);
  const [check, setCheck] = useState<CheckState | null>(null);
  const quizCache = useRef<Map<number, Promise<Quiz>>>(new Map());
  const allRef = useRef<Promise<Quiz[]> | null>(null);
  const asked = useRef<Set<number>>(new Set());
  useEffect(() => { if (me?.interactive) { setIu(me.interactive); if (me.interactive.jobs?.includes(job.id)) setCounted(true); } }, [me?.interactive, job.id]);
  useEffect(() => {
    const on = (e: Event) => { const d = (e as CustomEvent).detail; if (d) { setIu(d); setCounted(true); try { localStorage.setItem(`pe-inter-counted:${job.id}`, '1'); } catch { /* private */ } } };
    window.addEventListener('pe-interactive-used', on);
    return () => window.removeEventListener('pe-interactive-used', on);
  }, [job.id]);
  useEffect(() => { asked.current = new Set(); quizCache.current = new Map(); allRef.current = null; setPrepared(0); setCheck(null); setQ(readLog()); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [lang]);

  const getAll = () => {
    if (!allRef.current) {
      const p = quizAll({ job: job.id, lang }).then((list) => { const by: Quiz[] = []; list.forEach((q) => { if (q.section !== undefined && by[q.section] === undefined) by[q.section] = q; }); return by; });
      allRef.current = p;
      p.then((by) => { setPrepared(by.filter(Boolean).length); refresh(); }).catch(() => { allRef.current = null; });
    }
    return allRef.current;
  };
  const getQuiz = (i: number): Promise<Quiz> => {
    let pr = quizCache.current.get(i);
    if (!pr) {
      const key = `pe-quiz:${job.id}:${lang}:${i}`;
      let saved: Quiz | null = null;
      try { saved = JSON.parse(localStorage.getItem(key) ?? 'null') as Quiz | null; } catch { /* none */ }
      pr = saved ? Promise.resolve(saved) : getAll().then((by) => by[i] ?? quizPart({ job: job.id, section: i, lang })).catch((e) => (e instanceof ApiError && /^quiz_/.test(e.code ?? '') ? Promise.reject(e) : quizPart({ job: job.id, section: i, lang })));
      quizCache.current.set(i, pr);
      pr.then((q) => { try { localStorage.setItem(key, JSON.stringify(q)); } catch { /* full */ } }).catch(() => quizCache.current.delete(i));
    }
    return pr;
  };
  useEffect(() => {
    if (!inter || guest || !chapters.length) return;
    setInterErr(null);
    chapters.forEach((_, i) => { void getQuiz(i).catch((e) => { if (e instanceof ApiError && /^quiz_/.test(e.code ?? '')) { setInterErr({ msg: e.message, code: e.code ?? '' }); setInter(false); try { localStorage.setItem(interKey, '0'); } catch { /* private */ } } }); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inter, lang, chapters.length]);
  useEffect(() => {
    if (!inter || guest || check) return;
    const i = chapters.findIndex((c, k) => now >= c.end - 0.3 && now < c.end + 0.9 && !asked.current.has(k));
    if (i < 0) return;
    asked.current.add(i); player.current?.pause(); openCheck(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, inter, check]);
  const openCheck = (i: number) => {
    setCheck({ i, status: 'loading' });
    getQuiz(i).then((quiz) => setCheck((c) => (c && c.i === i ? { ...c, status: 'ready', quiz } : c)))
      .catch((e) => setCheck((c) => (c && c.i === i ? { ...c, status: 'error', err: e instanceof ApiError ? e.message : t(W.exErr), code: e instanceof ApiError ? e.code : undefined } : c)));
  };
  const explainMore = (i: number) => {
    const ready = check?.quiz?.more;
    if (ready) { setCheck((c) => (c ? { ...c, explain: { status: 'ready', text: ready } } : c)); return; }
    setCheck((c) => (c ? { ...c, explain: { status: 'loading' } } : c));
    askPaper({ job: job.id, q: '', mode: 'plus', intent: 'simpler', model: 'fast', section: i, history: [], lang })
      .then((r) => setCheck((c) => (c && c.i === i ? { ...c, explain: { status: 'ready', text: r.blocks.map((x) => x.text).join('\n\n') } } : c)))
      .catch(() => setCheck((c) => (c && c.i === i ? { ...c, explain: { status: 'error', text: t(W.exErr) } } : c)));
  };
  const toggleInter = (v: boolean) => { setInter(v); asked.current = new Set(); setCheck(null); try { localStorage.setItem(interKey, v ? '1' : '0'); } catch { /* private */ } track('interactive_toggle', { on: v }); };
  const resume = () => { setCheck(null); player.current?.play(); };
  const go = (time: number) => { player.current?.seek(time, true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const cite = (c: { page?: number; t?: number }) => { if (c.page) { setPage(c.page); setPageKey((k) => k + 1); setTab('paper'); } if (c.t !== undefined) go(c.t); };
  const share = async () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}app/v/${job.id}`;
    track('share_link');
    const n = navigator as Navigator & { share?: (d: { title?: string; url: string }) => Promise<void> };
    if (n.share && /Mobi|Android/i.test(navigator.userAgent)) { try { await n.share({ title: job.title ?? 'Paperlit', url }); return; } catch { /* cancelled */ } }
    if (await copyText(url)) { setCopied(true); window.setTimeout(() => setCopied(false), 2500); }
  };

  const overlay = check ? (
    <div className="w-full max-w-lg rounded-2xl bg-card p-5 text-card-foreground shadow-2xl" role="dialog" aria-label={t(W.check)}>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-primary"><Sparkles className="h-4 w-4" />{t(W.check)} · {check.i + 1}/{chapters.length}</p>
        <button type="button" onClick={resume} className="text-sm text-muted-foreground hover:text-foreground">{t(W.skip)}</button>
      </div>
      {check.status === 'loading' && <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t(W.qLoading)}</p>}
      {check.status === 'error' && (
        <div className="mt-3 text-sm"><p>{check.code === 'quiz_quota' ? t(W.upsell) : check.err}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {check.code === 'quiz_signup' && <Button size="sm" onClick={() => openAuth('register')}>{t(W.signup)}</Button>}
            {check.code === 'quiz_quota' && <Button size="sm" onClick={() => nav('/pricing')}>{t(W.plans)}</Button>}
            <Button size="sm" variant="outline" onClick={resume}>{t(W.cont)}</Button>
          </div>
        </div>
      )}
      {check.status === 'ready' && check.quiz && (
        <div className="mt-3 grid gap-3">
          <p className="font-display text-[17px] font-semibold leading-snug">{check.quiz.question}</p>
          <Options quiz={check.quiz} picked={check.picked} onPick={(k) => { setCheck({ ...check, picked: k }); setQlog({ ...qlog, parts: { ...qlog.parts, [check.i]: { q: check.quiz!, picked: k } } }); }} />
          {check.picked !== undefined && (
            <>
              <p className="text-sm"><b className={check.picked === check.quiz.answer ? 'text-success' : 'text-destructive'}>{check.picked === check.quiz.answer ? t(W.right) : t(W.wrong)}.</b> {check.quiz.why}</p>
              {check.explain && <div className="max-h-48 overflow-y-auto rounded-lg bg-muted/70 p-3 text-sm leading-relaxed">{check.explain.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : check.explain.text?.split('\n\n').map((p, k) => <p key={k} className="mb-2 last:mb-0">{p}</p>)}</div>}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={resume}>{t(W.cont)}</Button>
                {!check.explain && <Button size="sm" variant="outline" onClick={() => explainMore(check.i)}>{t(W.more)}</Button>}
                <Button size="sm" variant="ghost" onClick={() => { const c = chapters[check.i]; setCheck(null); if (c) go(c.start); }}>{t(W.replay)}</Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  ) : null;

  if (!src) return <Center><p>{t(W.noVideo)}</p><Button asChild className="mt-4"><Link to={`/app/new?url=${encodeURIComponent(job.source_url && /^https?:/.test(job.source_url) ? job.source_url : `https://arxiv.org/abs/${job.arxiv}`)}`}>{t(W.makeAgain)}</Link></Button></Center>;
  const s = secs[current];
  const showNone = iu && !me?.admin && iu.left === 0 && !counted;

  return (
    <div className="mx-auto grid max-w-[1400px] gap-6 py-4 sm:py-6 min-[1360px]:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0">
        <div data-g="player"><Player ref={player} src={src} poster={poster} chapters={chapters} title={job.title ?? ''} onTime={setNow} overlay={overlay} onPlay={() => { const k = storageKind(src); if (k) track('video_play', { k }); }} /></div>
        <div className="px-4 sm:px-0">
          <div className="mt-4 flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-bold leading-snug sm:text-2xl">{job.title || sourceLabel(job)}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{sourceLabel(job)}{job.created_at && ` · ${dateFmt(job.created_at, ui)}`}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {langs.length > 1 && <div className="inline-flex rounded-lg bg-muted p-0.5">{langs.map((l) => <button key={l} type="button" onClick={() => setLang(l)} className={cn('rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase', lang === l ? 'bg-background shadow-sm' : 'text-muted-foreground')}>{l === 'zh' ? '中文' : l}</button>)}</div>}
              {user && <Button variant="outline" size="sm" onClick={openEdit} data-g="edit"><PencilLine className="mr-1.5 h-4 w-4" />{t(W.edit)}</Button>}
              <Button variant="outline" size="sm" onClick={share}>{copied ? <Check className="mr-1.5 h-4 w-4 text-success" /> : <Share2 className="mr-1.5 h-4 w-4" />}{copied ? t(W.copied) : t(W.share)}</Button>
            </div>
          </div>
          {copied && <p className="mt-1 text-xs text-muted-foreground">{t(W.shareHint)}</p>}

          {guest ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border bg-accent/60 p-4 sm:flex-row sm:items-center">
              <div className="flex-1"><p className="font-semibold">{t(W.guestH)}</p><p className="text-sm text-muted-foreground">{t(W.guestP)}</p></div>
              <div className="flex gap-2"><Button size="sm" onClick={() => openAuth('register')}>{t(W.signup)}</Button><Button size="sm" variant="outline" onClick={() => openAuth('login')}>{t(W.login)}</Button></div>
            </div>
          ) : (
            <div data-g="inter" className="mt-4 rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary"><Sparkles className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{t(W.inter)}</p>
                  <p className="text-xs text-muted-foreground">{t(W.interHint)}</p>
                </div>
                <Switch checked={inter} onCheckedChange={toggleInter} aria-label={t(W.inter)} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {iu && !me?.admin && <span className={cn('font-semibold', showNone ? 'text-destructive' : 'text-primary')}>{showNone ? fill(t(W.interNone), { d: dateFmt(iu.resets, ui, { day: 'numeric', month: 'short' }) }) : fill(t(iu.period === 'week' ? W.interLeftW : W.interLeft), { n: iu.left, c: iu.cap })}</span>}
                {iu && !me?.admin && (counted || iu.left > 0) && <span className="text-muted-foreground">{counted ? t(W.interCounted) : !inter ? t(W.interUses) : ''}</span>}
                {inter && chapters.length > 0 && <span className="text-muted-foreground">{prepared >= chapters.length ? '✓ ' : ''}{fill(t(W.interReady), { a: Math.min(prepared, chapters.length), b: chapters.length })}</span>}
                {inter && chapters.length === 0 && <span className="text-muted-foreground">{t(W.interOld)}</span>}
              </div>
              {interErr && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm" role="alert">
                  <span className="flex-1">{interErr.code === 'quiz_quota' ? t(W.upsell) : interErr.msg}</span>
                  {interErr.code === 'quiz_signup' ? <Button size="sm" onClick={() => openAuth('register')}>{t(W.signup)}</Button> : <Button asChild size="sm"><Link to="/pricing">{t(W.plans)}</Link></Button>}
                </div>
              )}
            </div>
          )}

          {secs.length > 0 && s && (
            <section data-g="chapters" className="mt-4 rounded-2xl border p-4 sm:p-5" aria-label={t(W.chapters)}>
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2">
                {secs.map((x, i) => (
                  <button key={x.i} type="button" onClick={() => chapters[i] && go(chapters[i].start)} disabled={!chapters[i]} aria-current={i === current ? 'step' : undefined}
                    className={cn('flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition', i === current ? 'border-primary bg-primary text-primary-foreground' : i < current ? 'border-primary/40 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                    <span className="font-bold">{i + 1}</span><span className="max-w-[160px] truncate">{secText(x, 'title', lang)}</span>
                  </button>
                ))}
              </div>
              <h2 className="mt-3 font-display text-lg font-semibold">{secText(s, 'title', lang)}</h2>
              {secText(s, 'text', lang) && <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{secText(s, 'text', lang)}</p>}
              {secText(s, 'takeaway', lang) && <p className="mt-3 rounded-lg border-l-2 border-lit bg-lit/10 px-3 py-2 text-sm"><b>{t(W.takeaway)}:</b> {secText(s, 'takeaway', lang)}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" disabled={current === 0} onClick={() => chapters[current - 1] && go(chapters[current - 1].start)}><ChevronLeft className="mr-1 h-4 w-4" />{t(W.prev)}</Button>
                <Button variant="ghost" size="sm" disabled={current >= secs.length - 1} onClick={() => chapters[current + 1] && go(chapters[current + 1].start)}>{t(W.next)}<ChevronRight className="ml-1 h-4 w-4" /></Button>
                {!guest && <Button variant="outline" size="sm" onClick={() => { setSeed({ i: current, n: Date.now() }); setTab('ask'); document.getElementById('side')?.scrollIntoView({ behavior: 'smooth' }); }}><HelpCircle className="mr-1.5 h-4 w-4" />{t(W.stuck)}</Button>}
              </div>
            </section>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="font-display text-xl">{t(W.editH)}</DialogTitle>
          <p className="text-sm text-muted-foreground">{t(W.editS)}</p>
          {edits && edits.used >= edits.cap ? <p className="rounded-lg bg-warning/10 p-3 text-sm">{t(W.editNone)} <Link to="/pricing" className="font-semibold">{t(W.plans)}</Link></p> : (
            <div className="grid gap-4">
              <div>
                <p className="mb-1.5 text-sm font-medium">{t(W.editPart)}</p>
                <div className="grid max-h-48 gap-1.5 overflow-y-auto pr-1">
                  {secs.map((x, i) => (
                    <button key={i} type="button" aria-pressed={ePart === i} onClick={() => setEPart(i)} className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition', ePart === i ? 'border-primary bg-accent' : 'hover:border-foreground/30')}>
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate">{secText(x, 'title', lang)}</span>
                      {chapters[i] && chapters[i].start >= 0 && <span className="shrink-0 font-mono text-xs text-muted-foreground">{Math.floor(chapters[i].start / 60)}:{String(Math.floor(chapters[i].start % 60)).padStart(2, '0')}</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium">{t(W.editKind)}</p>
                <div className="flex flex-wrap gap-1.5">{(pick(ui, W.kinds) as string[]).map((l, n) => [KIND_IDS[n], l] as [EditKind, string]).map(([k, l]) => <button key={k} type="button" aria-pressed={eKind === k} onClick={() => setEKind(k)} className={cn('rounded-full border px-3 py-1 text-sm', eKind === k ? 'border-primary bg-accent text-primary' : 'text-muted-foreground hover:border-foreground/30')}>{l}</button>)}</div>
              </div>
              <div>
                <label htmlFor="pl-edit-note" className="mb-1.5 block text-sm font-medium">{t(W.editNote)}</label>
                <Textarea id="pl-edit-note" rows={4} maxLength={500} value={eNote} onChange={(e) => setENote(e.target.value)} placeholder={t(W.editPh)} />
              </div>
              {edits && <p className="text-xs text-muted-foreground">{fill(t(W.editLeft), { n: Math.max(0, edits.cap - edits.used), c: edits.cap })}</p>}
              {eErr && <p className="text-sm text-destructive" role="alert">{eErr}</p>}
              <Button onClick={sendEdit} disabled={eBusy || eNote.trim().length < 5}>{eBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PencilLine className="mr-2 h-4 w-4" />}{t(W.editGo)}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <aside id="side" className="mx-4 flex min-h-[560px] flex-col overflow-hidden rounded-2xl border bg-card sm:mx-0 min-[1360px]:sticky min-[1360px]:top-20 min-[1360px]:h-[calc(100dvh-104px)]">
        <div className="grid grid-cols-3 border-b p-1" role="tablist" data-g="side-tabs">
          {([['ask', MessageSquare, t(W.ask)], ['quiz', Trophy, t(W.quiz)], ['paper', FileText, t(W.paper)]] as const).map(([k, Icon, label]) => (
            <button key={k} data-g={`tab-${k}`} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn('flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition', tab === k ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground')}><Icon className="h-4 w-4" />{label}</button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div hidden={tab !== 'ask'} className="h-full">
            {guest ? <div className="p-6 text-center"><p className="font-semibold">{t(W.guestH)}</p><p className="mt-1 text-sm text-muted-foreground">{t(W.guestP)}</p><Button className="mt-4" onClick={() => openAuth('register')}>{t(W.signup)}</Button></div>
              : <AskPanel job={job} lang={lang} seed={seed} onCite={cite} />}
          </div>
          <div hidden={tab !== 'quiz'}>
            {guest ? <div className="p-6 text-center text-sm text-muted-foreground">{t(W.guestP)}</div>
              : <QuizPanel job={job} lang={lang} log={qlog} onLog={setQlog} onReset={() => { setQlog({ ...qlog, parts: {} }); asked.current = new Set(); setCheck(null); }} />}
          </div>
          <div hidden={tab !== 'paper'} className="h-full"><PaperPane job={job} page={page} pageKey={pageKey} localPdf={localPdfs.get(job.id)} /></div>
        </div>
      </aside>
    </div>
  );
}
