import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Shell, { scrollToSection } from '@/components/Shell';
import Hero from '@/components/sections/Hero';
import MakeSection from '@/components/sections/MakeSection';
import ExamplesSection from '@/components/sections/ExamplesSection';
import CapabilitiesSection from '@/components/sections/CapabilitiesSection';
import Tour from '@/components/Tour';
import HowSection from '@/components/sections/HowSection';
import PricingSection from '@/components/sections/PricingSection';
import FeedbackSection from '@/components/sections/FeedbackSection';
import ContactModal, { FaqSection } from '@/components/sections/ContactSection';
import { Link } from 'react-router-dom';
import { SuiteCta } from '@/components/SuiteFooter';
import SiteFooter from '@/components/SiteFooter';
import { accountGet, getToken, useAccount } from '@/lib/account';
import { useState } from 'react';
import { parseArxivId, useRecent } from '@/lib/explainer';
import { usePrefs } from '@/lib/prefs';
import { pick } from '@/lib/i18n_extra';
import { useSettings } from '@/lib/settings';

type Mine = { id: string; arxiv: string; title: string | null; status: string; sections?: { poster?: string | null }[] | null };

/** A signed-in member skips the sales hero: the form comes first, and their latest papers sit right below it. */
function MemberRecent() {
  const { lang } = usePrefs();
  const zh = lang === 'zh';
  const [jobs, setJobs] = useState<Mine[] | null>(null);
  useEffect(() => {
    let alive = true;
    accountGet('jobs=1').then((j) => alive && setJobs((j as Mine[]).slice(0, 4))).catch(() => alive && setJobs([]));
    return () => { alive = false; };
  }, []);
  if (!jobs || jobs.length === 0) return null;
  return (
    <section className="section member-recent" aria-label={zh ? '我的论文' : 'My papers'}>
      <div className="row between" style={{ alignItems: 'baseline', gap: 10 }}>
        <h2 className="sec" style={{ fontSize: 22, margin: 0 }}>{zh ? '最近的视频' : 'Your recent videos'}</h2>
        <Link className="small" to="/account">{zh ? '全部论文' : 'All my papers'}</Link>
      </div>
      <div className="member-row">
        {jobs.map((j) => {
          const poster = j.sections?.find((x) => x.poster)?.poster ?? null;
          return (
            <Link key={j.id} className="member-card" to={`/?job=${j.id}#make`}>
              <span className="member-thumb">{poster ? <img src={poster} alt="" loading="lazy" /> : <b aria-hidden>{(j.title || j.arxiv).slice(0, 1).toUpperCase()}</b>}</span>
              <span className="member-t">{j.title || j.arxiv}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}


const MH = {
  hi: { en: 'Welcome back', zh: '欢迎回来', vi: 'Chào mừng trở lại', id: 'Selamat datang kembali' },
  mode: { en: 'Mode', zh: '模式', vi: 'Chế độ', id: 'Mode' },
  none: { en: 'Pick a mode to make it yours', zh: '选一个模式，让它更懂你', vi: 'Chọn một chế độ để cá nhân hóa', id: 'Pilih mode untuk mempersonalisasi' },
  change: { en: 'Change', zh: '更改', vi: 'Đổi', id: 'Ubah' },
  left: { en: 'free videos today', zh: '今日免费视频', vi: 'video miễn phí hôm nay', id: 'video gratis hari ini' },
  credits: { en: 'credits', zh: '点额度', vi: 'tín dụng', id: 'kredit' },
  unlimited: { en: 'Unlimited', zh: '无限', vi: 'Không giới hạn', id: 'Tanpa batas' },
  modes: { study: { en: 'Student', zh: '学生', vi: 'Sinh viên', id: 'Mahasiswa' }, research: { en: 'Researcher', zh: '研究者', vi: 'Nhà nghiên cứu', id: 'Peneliti' }, teach: { en: 'Teacher', zh: '教师', vi: 'Giảng viên', id: 'Pengajar' }, share: { en: 'Creator', zh: '内容创作者', vi: 'Người sáng tạo', id: 'Kreator' }, curious: { en: 'Curious', zh: '好奇的人', vi: 'Tò mò', id: 'Penasaran' } },
} as const;

/** The first thing a member sees: who they are, their mode, what is left today. No sales hero, no empty band. */
function MemberHead() {
  const { lang } = usePrefs();
  const { user, me } = useAccount();
  const [s] = useSettings();
  const name = (user?.username ?? '').split('@')[0];
  const admin = !!(me as { admin?: boolean } | null)?.admin;
  const q = me?.quota;
  return (
    <section className="member-head" aria-label={pick(lang, MH.hi)}>
      <div>
        <h1 className="mh-hi">{pick(lang, MH.hi)}{name ? `, ${name}` : ''}</h1>
        <div className="mh-chips">
          <button type="button" className={`mh-mode${s.purpose ? ' on' : ''}`} onClick={() => window.dispatchEvent(new Event('pe-open-settings'))}>
            <span>{s.purpose ? `${pick(lang, MH.mode)}: ${pick(lang, MH.modes[s.purpose])}` : `✦ ${pick(lang, MH.none)}`}</span>
            <em>{pick(lang, MH.change)}</em>
          </button>
          {q && <span className="mh-stat"><b>{admin ? pick(lang, MH.unlimited) : q.day_left}</b> {pick(lang, MH.left)}</span>}
          {q && <span className="mh-stat"><b>{admin ? pick(lang, MH.unlimited) : q.credits}</b> {pick(lang, MH.credits)}</span>}
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  const { lang } = usePrefs();
  const { user, me } = useAccount();
  // a saved session means a member is on the way: do not flash the guest hero while the account loads
  const pending = !me && !!getToken();
  const { items, error } = useRecent();
  const [params] = useSearchParams();
  const shared = parseArxivId(params.get('v') ?? '');
  const paper = params.get('paper');

  useEffect(() => {
    if (!paper) return;
    const timer = window.setTimeout(() => scrollToSection('make'), 300);
    return () => window.clearTimeout(timer);
  }, [paper]);

  useEffect(() => {
    if (!items || !shared) return;
    if (items.some((job) => job.arxiv === shared)) {
      const timer = window.setTimeout(() => scrollToSection('examples'), 250);
      return () => window.clearTimeout(timer);
    }
  }, [items, shared]);

  return (
    <Shell>
      {pending ? <div className="member-head skeleton" aria-hidden /> : user ? <MemberHead /> : <Hero items={items} error={error} />}
      <MakeSection prefill={paper ?? shared} autoOpen={!!paper} />
      {user && <MemberRecent />}
      <CapabilitiesSection />
      <ExamplesSection items={items} error={error} openArxiv={shared} />
      {!user && !pending && <HowSection />}
      <PricingSection />
      <FeedbackSection />
      <FaqSection />
      <ContactModal />
      <Tour />

      <SuiteCta
        title={lang === 'zh' ? '把一篇论文变成 40 秒视频' : 'Turn a paper into a 40 second video'}
        body={lang === 'zh' ? '粘贴 arXiv 链接，无需注册即可试用。' : 'Paste an arXiv link. Free to try with no sign-up.'}
        label={lang === 'zh' ? '制作视频' : 'Make a video'}
        href="#make"
        onClick={() => scrollToSection('make')}
      />

      <SiteFooter />
    </Shell>
  );
}
