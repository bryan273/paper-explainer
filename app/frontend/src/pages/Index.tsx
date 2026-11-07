import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Shell, { scrollToSection } from '@/components/Shell';
import Hero from '@/components/sections/Hero';
import MakeSection from '@/components/sections/MakeSection';
import ExamplesSection from '@/components/sections/ExamplesSection';
import HowSection from '@/components/sections/HowSection';
import PricingSection from '@/components/sections/PricingSection';
import FeedbackSection from '@/components/sections/FeedbackSection';
import ContactSection, { FaqSection } from '@/components/sections/ContactSection';
import { Link } from 'react-router-dom';
import { SuiteCta } from '@/components/SuiteFooter';
import { accountGet, useAccount, useAcctText } from '@/lib/account';
import { useState } from 'react';
import { SUITE_URLS, parseArxivId, useRecent } from '@/lib/explainer';
import { usePrefs } from '@/lib/prefs';

type Mine = { id: string; arxiv: string; title: string | null; status: string; sections?: { poster?: string | null }[] | null };

/** What a signed-in member sees first instead of the sales page: their latest papers, and a way to the rest. */
function MemberBand({ name }: { name: string }) {
  const { lang } = usePrefs();
  const zh = lang === 'zh';
  const [jobs, setJobs] = useState<Mine[] | null>(null);
  useEffect(() => {
    let alive = true;
    accountGet('jobs=1').then((j) => alive && setJobs((j as Mine[]).slice(0, 3))).catch(() => alive && setJobs([]));
    return () => { alive = false; };
  }, []);
  return (
    <section className="member-band" aria-label={zh ? '我的论文' : 'My papers'}>
      <div className="row between" style={{ flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
        <div>
          <h1 className="member-h">{zh ? '欢迎回来' : 'Welcome back'}</h1>
          <p className="small muted" style={{ margin: '4px 0 0' }}>{name}</p>
        </div>
        <Link className="btn ghost small" to="/account">{zh ? '查看全部论文' : 'See all my papers'}</Link>
      </div>
      {jobs && jobs.length > 0 && (
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
      )}
    </section>
  );
}

export default function Index() {
  const { t, lang } = usePrefs();
  const ac = useAcctText();
  const { user } = useAccount();
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
      {user ? <MemberBand name={user.username} /> : <Hero items={items} error={error} />}
      <MakeSection prefill={paper ?? shared} autoOpen={!!paper} />
      <ExamplesSection items={items} error={error} openArxiv={shared} />
      {!user && <HowSection />}
      <PricingSection />
      <FeedbackSection />
      <FaqSection />
      <ContactSection />

      <SuiteCta
        title={lang === 'zh' ? '把一篇论文变成 40 秒视频' : 'Turn a paper into a 40 second video'}
        body={lang === 'zh' ? '粘贴 arXiv 链接，无需注册即可试用。' : 'Paste an arXiv link. Free to try with no sign-up.'}
        label={lang === 'zh' ? '制作视频' : 'Make a video'}
        href="#make"
        onClick={() => scrollToSection('make')}
      />

      <footer className="foot">
        <span>
          {t('footerLine')}{' '}
          <a href={SUITE_URLS.all}>
            {t('appAll')}
          </a>{' '}
          <a href={SUITE_URLS.repro}>
            {t('appRepro')}
          </a>
        </span>
        <span className="tiny">
          <Link to="/terms">{ac('terms')}</Link> · <Link to="/privacy">{ac('privacy')}</Link> · <Link to="/account">{ac('account')}</Link> · {t('footerNote')}
        </span>
      </footer>
    </Shell>
  );
}
