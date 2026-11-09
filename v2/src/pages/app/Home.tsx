import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarClock, FlaskConical, Gift, GraduationCap, Link2, Sparkles, Video, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoCard } from '@/components/app/VideoCard';
import { PlanBadge } from '@/components/site/menus';
import { InviteCard } from '@/components/app/InviteCard';
import { displayName, useAccount } from '@/lib/account';
import { useMyJobs } from '@/lib/jobs';
import { fill, usePrefs } from '@/lib/prefs';
import { dateFmt } from '@/lib/strings';
import { posterOf } from '@/pages/Landing';

const H = {
  hi: { en: 'Hi, {n}', zh: '你好，{n}', vi: 'Chào {n}', id: 'Halo, {n}' },
  hiGuest: { en: 'Welcome to Paperlit', zh: '欢迎使用 Paperlit', vi: 'Chào mừng đến với Paperlit', id: 'Selamat datang di Paperlit' },
  sub: { en: 'What do you want to understand today?', zh: '今天想弄懂什么？', vi: 'Hôm nay bạn muốn hiểu điều gì?', id: 'Apa yang ingin Anda pahami hari ini?' },
  quickPh: { en: 'Paste a link to a paper or an article', zh: '粘贴论文或文章链接', vi: 'Dán liên kết đến bài báo hoặc bài viết', id: 'Tempel tautan makalah atau artikel' },
  go: { en: 'Make video', zh: '制作视频', vi: 'Tạo video', id: 'Buat video' },
  orText: { en: 'or paste text / upload a file', zh: '或粘贴文字 / 上传文件', vi: 'hoặc dán văn bản / tải tệp', id: 'atau tempel teks / unggah berkas' },
  canMake: { en: 'Videos you can make', zh: '可制作视频', vi: 'Video có thể tạo', id: 'Video yang bisa dibuat' },
  canWeek: { en: '{f} free this week + {c} credits', zh: '本周免费 {f} + 额度 {c}', vi: '{f} miễn phí trong tuần + {c} tín dụng', id: '{f} gratis minggu ini + {c} kredit' },
  canSub: { en: '{f} free today + {c} credits', zh: '今日免费 {f} + 额度 {c}', vi: '{f} miễn phí hôm nay + {c} tín dụng', id: '{f} gratis hari ini + {c} kredit' },
  inter: { en: 'Interactive mode left', zh: '剩余互动模式次数', vi: 'Lượt tương tác còn lại', id: 'Sisa mode interaktif' },
  interSub: { en: 'resets {d}', zh: '{d} 重置', vi: 'làm mới {d}', id: 'reset {d}' },
  plan: { en: 'Your plan', zh: '当前套餐', vi: 'Gói của bạn', id: 'Paket Anda' },
  planUntil: { en: 'until {d} · {n} days left', zh: '至 {d} · 剩 {n} 天', vi: 'đến {d} · còn {n} ngày', id: 'sampai {d} · sisa {n} hari' },
  planFree: { en: 'Upgrade for 80 videos a month and interactive mode on 40 of them', zh: '升级可获每月 80 个视频，其中 40 个可开互动模式', vi: 'Nâng cấp để có 80 video mỗi tháng và chế độ tương tác cho 40 video', id: 'Tingkatkan untuk 80 video per bulan dan mode interaktif untuk 40 di antaranya' },
  upgrade: { en: 'See plans', zh: '查看套餐', vi: 'Xem các gói', id: 'Lihat paket' },
  making: { en: 'In progress', zh: '正在生成', vi: 'Đang tạo', id: 'Sedang dibuat' },
  recent: { en: 'Recent videos', zh: '最近的视频', vi: 'Video gần đây', id: 'Video terbaru' },
  all: { en: 'View all', zh: '查看全部', vi: 'Xem tất cả', id: 'Lihat semua' },
  empty: { en: 'No videos yet. Paste a link above to make your first one, or watch an example.', zh: '还没有视频。在上方粘贴链接做第一个，或先看个示例。', vi: 'Chưa có video. Dán liên kết ở trên để tạo video đầu tiên, hoặc xem ví dụ.', id: 'Belum ada video. Tempel tautan di atas untuk membuat yang pertama, atau lihat contoh.' },
  examples: { en: 'Examples to try', zh: '可以试试的示例', vi: 'Ví dụ để thử', id: 'Contoh untuk dicoba' },
  more: { en: 'More ways to learn', zh: '更多学习方式', vi: 'Thêm cách học', id: 'Cara belajar lainnya' },
  readP: { en: 'Read a paper with an AI that cites the page.', zh: '与 AI 一起读论文，回答标注页码。', vi: 'Đọc bài báo cùng AI có trích dẫn trang.', id: 'Baca makalah dengan AI yang mengutip halaman.' },
  checkP: { en: 'See whether a paper\'s results hold when re-run.', zh: '看看论文结果重新运行后是否成立。', vi: 'Kiểm tra kết quả bài báo có đúng khi chạy lại.', id: 'Lihat apakah hasil makalah tetap berlaku saat dijalankan ulang.' },
  studentH: { en: 'Free month of Plus for students and teachers', zh: '学生和教师免费用 1 个月 Plus', vi: 'Tặng 1 tháng Plus cho sinh viên và giảng viên', id: 'Gratis 1 bulan Plus untuk mahasiswa dan pengajar' },
  studentP: { en: 'Send a photo of your card, we check it within a day.', zh: '上传证件照片，一天内审核。', vi: 'Gửi ảnh thẻ, chúng tôi duyệt trong một ngày.', id: 'Kirim foto kartu Anda, kami cek dalam sehari.' },
  studentPending: { en: 'We are checking your proof. Usually within a day.', zh: '正在审核你的证明，通常一天内完成。', vi: 'Chúng tôi đang duyệt giấy tờ, thường trong một ngày.', id: 'Bukti Anda sedang kami cek, biasanya dalam sehari.' },
  studentOk: { en: 'Your free month of Plus is on until {d}. Enjoy!', zh: '你的免费 Plus 月已开通，有效期至 {d}。', vi: 'Tháng Plus miễn phí của bạn có hiệu lực đến {d}. Chúc bạn học tốt!', id: 'Bulan Plus gratis Anda aktif sampai {d}. Selamat belajar!' },
  send: { en: 'Send proof', zh: '提交证明', vi: 'Gửi giấy tờ', id: 'Kirim bukti' },
  guestH: { en: 'Make a video without an account', zh: '无需账户也能做视频', vi: 'Tạo video không cần tài khoản', id: 'Buat video tanpa akun' },
  guestP: { en: 'Guests get 1 video a day. A free account gives 5 videos a week and 3 welcome videos with interactive mode, keeps your videos and lets you ask questions.', zh: '访客每天 1 个视频。免费账户每周 5 个视频，另送 3 个含互动模式的欢迎视频，还能保存视频并提问。', vi: 'Khách được 1 video mỗi ngày. Tài khoản miễn phí có 5 video mỗi tuần, 3 video chào mừng với chế độ tương tác, lưu video và cho phép đặt câu hỏi.', id: 'Tamu mendapat 1 video per hari. Akun gratis memberi 5 video per minggu dan 3 video sambutan dengan mode interaktif, menyimpan video, dan bisa bertanya.' },
  signup: { en: 'Sign up free', zh: '免费注册', vi: 'Đăng ký miễn phí', id: 'Daftar gratis' },
};
const EX = [
  { id: '6a21030a-b5f8-4c0e-977e-39090d7ebc70', title: 'Deep Residual Learning' },
  { id: 'c91b06ea-3226-4fdf-90ae-1a7a21b9f283', title: 'Language Models are Few-Shot Learners' },
  { id: 'ea94b4d8-195f-43b5-a267-72d7ac02bbad', title: 'An Image is Worth 16x16 Words' },
];

export default function Home() {
  const { lang, t } = usePrefs();
  const { user, me, openAuth } = useAccount();
  const { jobs } = useMyJobs();
  const nav = useNavigate();
  const [link, setLink] = useState('');
  const quick = (e: FormEvent) => { e.preventDefault(); nav(link.trim() ? `/app/new?url=${encodeURIComponent(link.trim())}` : '/app/new'); };
  const free = me?.quota?.day_left ?? 0, credits = user?.credits ?? 0;
  const it = me?.interactive;
  const days = me?.plan_until ? Math.max(0, Math.ceil((Date.parse(me.plan_until) - Date.now()) / 86400000)) : 0;
  const running = (jobs ?? []).filter((j) => j.status === 'queued' || j.status === 'running');
  const recent = (jobs ?? []).filter((j) => !(j.status === 'queued' || j.status === 'running')).slice(0, 8);
  const v = me?.verify;
  const student = me?.plan && (me.plan_source === 'student' || me.plan_source === 'teacher');
  const kpi = 'pl-card p-5';

  return (
    <div className="mx-auto max-w-6xl py-8">
      <h1 className="font-display text-3xl font-bold">{user ? fill(t(H.hi), { n: displayName(user) }) : t(H.hiGuest)}</h1>
      <p className="mt-1 text-muted-foreground">{t(H.sub)}</p>

      <form onSubmit={quick} className="mt-6 flex flex-col gap-2 rounded-2xl border bg-card p-2 shadow-sm sm:flex-row">
        <div className="relative flex-1"><Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={link} onChange={(e) => setLink(e.target.value)} placeholder={t(H.quickPh)} className="h-12 border-0 pl-9 text-[15px] shadow-none focus-visible:ring-0" aria-label={t(H.quickPh)} /></div>
        <Button type="submit" size="lg" className="h-12"><Sparkles className="mr-2 h-4 w-4" />{t(H.go)}</Button>
      </form>
      <Link to="/app/new?tab=text" className="mt-2 inline-block text-sm text-muted-foreground no-underline hover:text-primary">{t(H.orText)}</Link>

      {!user && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-primary/30 bg-accent p-5 sm:flex-row sm:items-center">
          <div className="flex-1"><p className="font-semibold">{t(H.guestH)}</p><p className="text-sm text-muted-foreground">{t(H.guestP)}</p></div>
          <Button onClick={() => openAuth('register')}>{t(H.signup)}</Button>
        </div>
      )}

      {user && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className={kpi}>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Video className="h-4 w-4" />{t(H.canMake)}</p>
            <p className="mt-2 font-display text-3xl font-bold">{me?.admin ? '∞' : free + credits}</p>
            {!me?.admin && <p className="text-xs text-muted-foreground">{fill(t(me?.quota?.period === 'day' ? H.canSub : H.canWeek), { f: free, c: credits })}</p>}
          </div>
          <div className={kpi}>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Zap className="h-4 w-4" />{t(H.inter)}</p>
            <p className="mt-2 font-display text-3xl font-bold">{me?.admin ? '∞' : it ? <>{it.left}<span className="text-lg text-muted-foreground"> / {it.cap}</span></> : '-'}</p>
            {it && !me?.admin && <p className="text-xs text-muted-foreground">{fill(t(H.interSub), { d: dateFmt(it.resets, lang, { day: 'numeric', month: 'short' }) })}</p>}
          </div>
          <div className={kpi}>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarClock className="h-4 w-4" />{t(H.plan)}</p>
            <div className="mt-2 flex items-center gap-2"><PlanBadge plan={me?.plan} className="px-3 py-1 text-sm" /></div>
            <p className="mt-2 text-xs text-muted-foreground">{me?.plan ? fill(t(H.planUntil), { d: dateFmt(me.plan_until, lang), n: days }) : t(H.planFree)}</p>
            {!me?.plan && <Link to="/pricing" className="mt-1 inline-block text-xs font-semibold text-primary no-underline hover:underline">{t(H.upgrade)}</Link>}
          </div>
        </div>
      )}

      {user && (student || !me?.plan) && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary"><GraduationCap className="h-5 w-5" /></span>
          <div className="flex-1">
            <p className="text-sm font-semibold">{t(H.studentH)}</p>
            <p className="text-sm text-muted-foreground">{student ? fill(t(H.studentOk), { d: dateFmt(me?.plan_until, lang) }) : v?.status === 'pending' ? t(H.studentPending) : t(H.studentP)}</p>
          </div>
          {!student && v?.status !== 'pending' && <Button asChild size="sm" variant="outline"><Link to="/app/account?tab=students">{t(H.send)}</Link></Button>}
        </div>
      )}

      {running.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">{t(H.making)}</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{running.map((j) => <VideoCard key={j.id} j={j} />)}</div>
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-baseline justify-between"><h2 className="font-display text-lg font-semibold">{t(H.recent)}</h2>{recent.length > 0 && <Link to="/app/library" className="flex items-center gap-1 text-sm font-medium text-primary no-underline">{t(H.all)}<ArrowRight className="h-4 w-4" /></Link>}</div>
        {jobs === null ? <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i}><Skeleton className="aspect-video rounded-xl" /><Skeleton className="mt-2 h-4 w-3/4" /></div>)}</div>
          : recent.length ? <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{recent.map((j) => <VideoCard key={j.id} j={j} />)}</div>
          : (
            <div className="mt-4 rounded-2xl border border-dashed p-6">
              <p className="text-sm text-muted-foreground">{t(H.empty)}</p>
              <p className="mt-4 text-sm font-semibold">{t(H.examples)}</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                {EX.map((e) => <Link key={e.id} to={`/app/v/${e.id}`} className="group no-underline"><img src={posterOf(e.id)} alt="" className="aspect-video w-full rounded-xl border object-cover" /><p className="mt-2 text-sm font-medium text-foreground group-hover:text-primary">{e.title}</p></Link>)}
              </div>
            </div>
          )}
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-3">
        <Link to="/app/read" className="pl-card flex gap-3 p-5 no-underline transition hover:border-primary"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary"><BookOpen className="h-5 w-5" /></span><span><span className="block font-semibold text-foreground">{t({ en: 'Read', zh: '阅读', vi: 'Đọc', id: 'Baca' })}</span><span className="block text-sm text-muted-foreground">{t(H.readP)}</span></span></Link>
        <Link to="/app/check" className="pl-card flex gap-3 p-5 no-underline transition hover:border-primary"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary"><FlaskConical className="h-5 w-5" /></span><span><span className="block font-semibold text-foreground">{t({ en: 'Check', zh: '复现', vi: 'Kiểm chứng', id: 'Cek' })}</span><span className="block text-sm text-muted-foreground">{t(H.checkP)}</span></span></Link>
        {user ? <InviteCard compact /> : <div className="pl-card flex gap-3 p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary"><Gift className="h-5 w-5" /></span><span className="text-sm text-muted-foreground">{t(H.guestP)}</span></div>}
      </section>
    </div>
  );
}
