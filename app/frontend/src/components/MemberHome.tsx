import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountSwr, useAccount } from '@/lib/account';
import { usePrefs } from '@/lib/prefs';
import { pick } from '@/lib/i18n_extra';
import { useSettings } from '@/lib/settings';
import StudentTrial from '@/components/StudentTrial';
import InviteCard from '@/components/InviteCard';

type L4 = { en: string; zh: string; vi: string; id: string };
const T = {
  hi: { en: 'Welcome back', zh: '欢迎回来', vi: 'Chào mừng trở lại', id: 'Selamat datang kembali' } as L4,
  free: { en: 'Free plan', zh: '免费版', vi: 'Gói miễn phí', id: 'Paket gratis' } as L4,
  student: { en: 'Student', zh: '学生', vi: 'Sinh viên', id: 'Mahasiswa' } as L4,
  teacher: { en: 'Teacher', zh: '教师', vi: 'Giảng viên', id: 'Pengajar' } as L4,
  until: { en: 'until {d}', zh: '至 {d}', vi: 'đến {d}', id: 'sampai {d}' } as L4,
  left: { en: '{n} days left', zh: '剩 {n} 天', vi: 'còn {n} ngày', id: 'sisa {n} hari' } as L4,
  seePlans: { en: 'See plans', zh: '查看套餐', vi: 'Xem các gói', id: 'Lihat paket' } as L4,
  available: { en: 'videos you can make now', zh: '个视频现在可做', vi: 'video có thể tạo ngay', id: 'video yang bisa dibuat sekarang' } as L4,
  breakdown: { en: '{f} free today + {c} credits', zh: '今日免费 {f} + 额度 {c}', vi: '{f} miễn phí hôm nay + {c} tín dụng', id: '{f} gratis hari ini + {c} kredit' } as L4,
  unlimited: { en: 'Unlimited', zh: '无限', vi: 'Không giới hạn', id: 'Tanpa batas' } as L4,
  mode: { en: 'Mode', zh: '模式', vi: 'Chế độ', id: 'Mode' } as L4,
  pickMode: { en: 'Pick a mode to make it yours', zh: '选一个模式，让它更懂你', vi: 'Chọn một chế độ để cá nhân hóa', id: 'Pilih mode untuk mempersonalisasi' } as L4,
  change: { en: 'Change', zh: '更改', vi: 'Đổi', id: 'Ubah' } as L4,
  bannerH: { en: 'Your free month of Plus is active', zh: '你的 Plus 免费月已开通', vi: 'Tháng Plus miễn phí của bạn đã được kích hoạt', id: 'Bulan Plus gratis Anda sudah aktif' } as L4,
  bannerP: { en: 'Until {d}: 50 videos, 10 interactive videos and in-depth answers. Enjoy.', zh: '有效期至 {d}：50 个视频、10 个互动视频和深入回答。', vi: 'Đến {d}: 50 video, 10 video tương tác và câu trả lời chuyên sâu. Chúc bạn học tốt.', id: 'Sampai {d}: 50 video, 10 video interaktif, dan jawaban mendalam. Selamat belajar.' } as L4,
  inter: { en: 'interactive videos left this month', zh: '本月剩余互动视频', vi: 'video tương tác còn lại tháng này', id: 'video interaktif tersisa bulan ini' } as L4,
  interSub: { en: 'about {q} questions inside videos · resets {d}', zh: '约 {q} 道视频内答题 · {d} 重置', vi: 'khoảng {q} câu hỏi trong video · làm mới {d}', id: 'sekitar {q} pertanyaan di dalam video · reset {d}' } as L4,
  pendingH: { en: 'We are checking your proof', zh: '我们正在审核你的证明', vi: 'Chúng tôi đang duyệt giấy tờ của bạn', id: 'Kami sedang memeriksa bukti Anda' } as L4,
  pendingP: { en: 'Usually within a day. You will get an email and this page will show your plan.', zh: '通常一天内完成。结果会发到邮箱，本页也会显示你的套餐。', vi: 'Thường trong vòng một ngày. Bạn sẽ nhận email và trang này sẽ hiện gói của bạn.', id: 'Biasanya dalam sehari. Anda akan mendapat email dan halaman ini akan menampilkan paket Anda.' } as L4,
  jobs: { en: 'Your videos', zh: '你的视频', vi: 'Video của bạn', id: 'Video Anda' } as L4,
  all: { en: 'All my videos', zh: '全部视频', vi: 'Tất cả video', id: 'Semua video' } as L4,
  ready: { en: 'Ready', zh: '已完成', vi: 'Sẵn sàng', id: 'Siap' } as L4,
  making: { en: 'Making', zh: '生成中', vi: 'Đang làm', id: 'Sedang dibuat' } as L4,
  failed: { en: 'Failed', zh: '失败', vi: 'Lỗi', id: 'Gagal' } as L4,
  expired: { en: 'Expired', zh: '已过期', vi: 'Hết hạn', id: 'Kedaluwarsa' } as L4,
  none: { en: 'No videos yet. Make your first one below.', zh: '还没有视频，在下面做第一个吧。', vi: 'Chưa có video. Hãy tạo video đầu tiên bên dưới.', id: 'Belum ada video. Buat yang pertama di bawah.' } as L4,
  statVideos: { en: 'Videos made', zh: '已做视频', vi: 'Video đã tạo', id: 'Video dibuat' } as L4,
  statReady: { en: 'Ready to watch', zh: '可观看', vi: 'Sẵn sàng xem', id: 'Siap ditonton' } as L4,
  statQuiz: { en: 'Quiz answers right', zh: '答对题数', vi: 'Câu trả lời đúng', id: 'Jawaban benar' } as L4,
  statFinal: { en: 'Best final quiz', zh: '最高期末测验', vi: 'Bài kiểm tra cuối tốt nhất', id: 'Kuis akhir terbaik' } as L4,
  morePlans: { en: 'Compare plans', zh: '比较套餐', vi: 'So sánh các gói', id: 'Bandingkan paket' } as L4,
};

type Mine = { id: string; arxiv: string; title: string | null; status: string; created_at?: string; expired_at?: string | null; sections?: { poster?: string | null }[] | null };

const fmtDate = (iso: string, lang: string) => new Date(iso).toLocaleDateString(lang === 'zh' ? 'zh-CN' : lang === 'vi' ? 'vi-VN' : lang === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** The top of a member's home: who they are, their plan and what is left to make, in one place. */
export function MemberHead() {
  const { lang } = usePrefs();
  const { user, me } = useAccount();
  const [s] = useSettings();
  const m = me as unknown as { admin?: boolean; plan?: string | null; plan_until?: string | null; plan_source?: string | null; quota?: { day_left: number }; interactive?: { used: number; cap: number; left: number; resets: string } } | null;
  const name = user?.handle || (user?.username ?? '').split('@')[0];
  const free = m?.quota?.day_left ?? 0;
  const credits = user?.credits ?? 0;
  const days = m?.plan_until ? Math.max(0, Math.ceil((Date.parse(m.plan_until) - Date.now()) / 86400000)) : 0;
  const planName = m?.plan ? `${m.plan === 'premium' ? 'Premium' : m.plan === 'pro' ? 'Pro' : 'Plus'}${m.plan_source === 'student' ? ` · ${pick(lang, T.student)}` : m.plan_source === 'teacher' ? ` · ${pick(lang, T.teacher)}` : ''}` : pick(lang, T.free);
  return (
    <section className="member-head" aria-label={pick(lang, T.hi)}>
      <div className="mh-top">
        <span className="mh-ava" aria-hidden>{(name || '?')[0]?.toUpperCase()}</span>
        <div>
          <h1 className="mh-hi">{pick(lang, T.hi)}, {name}</h1>
          <div className="mh-plan">
            <span className={`mh-badge ${m?.plan === 'premium' ? 'pro premium' : m?.plan === 'pro' ? 'pro' : m?.plan ? 'plus' : ''}`}>{planName}</span>
            {m?.plan && m.plan_until && <span className="small muted">{pick(lang, T.until).replace('{d}', fmtDate(m.plan_until, lang))} · {pick(lang, T.left).replace('{n}', String(days))}</span>}
            {!m?.plan && <button type="button" className="linkbtn small" onClick={() => window.dispatchEvent(new Event('pe-show-plans'))}>{pick(lang, T.seePlans)}</button>}
          </div>
        </div>
      </div>
      <div className="mh-chips">
        <span className="mh-stat big"><b>{m?.admin ? pick(lang, T.unlimited) : free + credits}</b> {pick(lang, T.available)}
          {!m?.admin && <small>{pick(lang, T.breakdown).replace('{f}', String(free)).replace('{c}', String(credits))}</small>}
        </span>
        {m?.interactive && !m.admin && (
          <span className="mh-stat big"><b>{m.interactive.left}<em className="mh-of"> / {m.interactive.cap}</em></b> {pick(lang, T.inter)}
            <small>{pick(lang, T.interSub).replace('{q}', String(m.interactive.left * 4)).replace('{d}', fmtDate(m.interactive.resets, lang))}</small>
          </span>
        )}
        <button type="button" className={`mh-mode${s.purpose ? ' on' : ''}`} onClick={() => window.dispatchEvent(new Event('pe-open-settings'))}>
          <span>{s.purpose ? `${pick(lang, T.mode)}: ${pick(lang, { study: T.student, research: { en: 'Researcher', zh: '研究者', vi: 'Nhà nghiên cứu', id: 'Peneliti' }, teach: T.teacher, share: { en: 'Creator', zh: '内容创作者', vi: 'Người sáng tạo', id: 'Kreator' }, curious: { en: 'Curious', zh: '好奇的人', vi: 'Tò mò', id: 'Penasaran' } }[s.purpose] as L4)}` : `✦ ${pick(lang, T.pickMode)}`}</span>
          <em>{pick(lang, T.change)}</em>
        </button>
      </div>
    </section>
  );
}

/** Messages that belong to this member right now: the plan that just started, or a proof still being checked. */
export function MemberNotice() {
  const { lang } = usePrefs();
  const { me } = useAccount();
  const m = me as unknown as { plan?: string | null; plan_until?: string | null; plan_source?: string | null; verify?: { status: string } | null } | null;
  const key = m?.plan_until ? `pe-plan-seen:${m.plan_until}` : '';
  const [seen, setSeen] = useState(() => { try { return !!key && localStorage.getItem(key) === '1'; } catch { return false; } });
  useEffect(() => { try { setSeen(!!key && localStorage.getItem(key) === '1'); } catch { setSeen(false); } }, [key]);
  if (m?.plan && (m.plan_source === 'student' || m.plan_source === 'teacher') && !seen) {
    return (
      <div className="member-notice good" role="status">
        <span aria-hidden>🎓</span>
        <div><b>{pick(lang, T.bannerH)}</b><p>{pick(lang, T.bannerP).replace('{d}', fmtDate(m.plan_until!, lang))}</p></div>
        <button type="button" className="tour-x" aria-label="Close" onClick={() => { try { localStorage.setItem(key, '1'); } catch { /* private mode */ } setSeen(true); }}>×</button>
      </div>
    );
  }
  if (!m?.plan && m?.verify?.status === 'pending') {
    return <div className="member-notice" role="status"><span aria-hidden>⏳</span><div><b>{pick(lang, T.pendingH)}</b><p>{pick(lang, T.pendingP)}</p></div></div>;
  }
  return null;
}

/** The member's own videos with their state, newest first. */
export function MemberJobs() {
  const { lang } = usePrefs();
  const [jobs, setJobs] = useState<Mine[] | null>(null);
  useEffect(() => {
    let alive = true;
    accountSwr<Mine[]>('jobs=1', (j) => alive && setJobs(j)).catch(() => alive && setJobs((x) => x ?? []));
    return () => { alive = false; };
  }, []);
  const badge = (j: Mine) => (j.expired_at ? ['expired', T.expired] : j.status === 'done' ? ['ready', T.ready] : j.status === 'failed' ? ['failed', T.failed] : ['making', T.making]) as [string, L4];
  return (
    <section className="section member-recent" aria-label={pick(lang, T.jobs)}>
      <div className="row between" style={{ alignItems: 'baseline', gap: 10 }}>
        <h2 className="sec" style={{ fontSize: 22, margin: 0 }}>{pick(lang, T.jobs)}</h2>
        <Link className="small" to="/account">{pick(lang, T.all)}</Link>
      </div>
      {jobs && jobs.length === 0 && <p className="muted" style={{ marginTop: 10 }}>{pick(lang, T.none)}</p>}
      <div className="member-row">
        {(jobs ?? []).slice(0, 8).map((j) => {
          const poster = j.sections?.find((x) => x.poster)?.poster ?? null;
          const [cls, label] = badge(j);
          return (
            <Link key={j.id} className="member-card" to={`/?job=${j.id}#make`}>
              <span className="member-thumb">{poster ? <img src={poster} alt="" loading="lazy" /> : <b aria-hidden>{(j.title || j.arxiv).slice(0, 1).toUpperCase()}</b>}<i className={`mj-badge ${cls}`}>{pick(lang, label)}</i></span>
              <span className="member-t">{j.title || j.arxiv}</span>
              {j.created_at && <span className="small muted">{fmtDate(j.created_at, lang)}</span>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** Progress: what the member made and how their quizzes went (kept in this browser). */
export function MemberStats() {
  const { lang } = usePrefs();
  const [jobs, setJobs] = useState<Mine[]>([]);
  useEffect(() => {
    let alive = true;
    accountSwr<Mine[]>('jobs=1', (j) => alive && setJobs(j)).catch(() => undefined);
    return () => { alive = false; };
  }, []);
  const quiz = useMemo(() => {
    let ans = 0, good = 0, best = 0, bestOf = 0;
    try {
      for (const k of Object.keys(localStorage)) {
        if (!k.startsWith('pe-qlog:')) continue;
        const v = JSON.parse(localStorage.getItem(k) ?? 'null') as { parts?: Record<string, { q: { answer: number }; picked: number }>; finals?: { score: number; total: number }[] } | null;
        for (const it of Object.values(v?.parts ?? {})) { ans++; if (it.picked === it.q.answer) good++; }
        for (const f of v?.finals ?? []) if (f.total && f.score / f.total >= (bestOf ? best / bestOf : 0)) { best = f.score; bestOf = f.total; }
      }
    } catch { /* no storage */ }
    return { ans, good, best, bestOf };
  }, []);
  return (
    <section className="member-stats" aria-label="stats">
      <div className="ms-tile"><span>{pick(lang, T.statVideos)}</span><b>{jobs.length}</b></div>
      <div className="ms-tile"><span>{pick(lang, T.statReady)}</span><b>{jobs.filter((j) => j.status === 'done' && !j.expired_at).length}</b></div>
      <div className="ms-tile"><span>{pick(lang, T.statQuiz)}</span><b>{quiz.ans ? `${quiz.good}/${quiz.ans}` : '-'}</b></div>
      <div className="ms-tile"><span>{pick(lang, T.statFinal)}</span><b>{quiz.bestOf ? `${quiz.best}/${quiz.bestOf}` : '-'}</b></div>
    </section>
  );
}

/** The things a member can still do or get: invite a friend, the student month, the plans. */
export function MemberCards() {
  const { lang } = usePrefs();
  return (
    <section className="section member-cards" aria-label="more">
      <InviteCard />
      <StudentTrial />
      <button type="button" className="btn ghost" style={{ justifySelf: 'start' }} onClick={() => window.dispatchEvent(new Event('pe-show-plans'))}>{pick(lang, T.morePlans)}</button>
    </section>
  );
}
