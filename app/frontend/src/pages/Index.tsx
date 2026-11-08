import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Shell, { scrollToSection } from '@/components/Shell';
import Hero from '@/components/sections/Hero';
import MakeSection from '@/components/sections/MakeSection';
import ExamplesSection from '@/components/sections/ExamplesSection';
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
            <Link key={j.id} className="member-card" to={`/?paper=${encodeURIComponent(j.arxiv)}#make`}>
              <span className="member-thumb">{poster ? <img src={poster} alt="" loading="lazy" /> : <b aria-hidden>{(j.title || j.arxiv).slice(0, 1).toUpperCase()}</b>}</span>
              <span className="member-t">{j.title || j.arxiv}</span>
            </Link>
          );
        })}
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
      {pending ? <div className="pending-band" aria-hidden /> : user ? null : <Hero items={items} error={error} />}
      <MakeSection prefill={paper ?? shared} autoOpen={!!paper} />
      {user && <MemberRecent />}
      <ExamplesSection items={items} error={error} openArxiv={shared} />
      {!user && !pending && <HowSection />}
      <PricingSection />
      <FeedbackSection />
      <FaqSection />
      <ContactModal />

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
