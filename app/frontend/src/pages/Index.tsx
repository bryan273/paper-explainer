import { useEffect, useState } from 'react';
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
import { accountSwr, getToken, useAccount } from '@/lib/account';
import { parseArxivId, useRecent } from '@/lib/explainer';
import { usePrefs } from '@/lib/prefs';
import { pick } from '@/lib/i18n_extra';
import { MemberHead, MemberNotice, MemberJobs, MemberStats, MemberCards } from '@/components/MemberHome';
import { useSettings } from '@/lib/settings';

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

  const member = !!user;
  const [plansOpen, setPlansOpen] = useState(() => window.location.hash === '#pricing');
  useEffect(() => {
    const open = () => setPlansOpen(true);
    window.addEventListener('pe-show-plans', open);
    return () => window.removeEventListener('pe-show-plans', open);
  }, []);

  return (
    <Shell>
      {pending ? <div className="member-head skeleton" aria-hidden /> : member ? <><MemberHead /><MemberNotice /></> : <Hero items={items} error={error} />}
      <MakeSection prefill={paper ?? shared} autoOpen={!!paper} />
      {member ? (
        <>
          <MemberJobs />
          <MemberStats />
          <MemberCards />
          {plansOpen && <PricingSection />}
        </>
      ) : (
        <>
          <CapabilitiesSection />
          <ExamplesSection items={items} error={error} openArxiv={shared} />
          {!pending && <HowSection />}
          <PricingSection />
          <FeedbackSection />
          <FaqSection />
        </>
      )}
      <ContactModal />
      <Tour />
      {!member && (
        <SuiteCta
          title={pick(lang, { en: 'Turn a paper into a 40 second video', zh: '把一篇论文变成 40 秒视频', vi: 'Biến một bài báo thành video 40 giây', id: 'Ubah makalah menjadi video 40 detik' })}
          body={pick(lang, { en: 'Paste a link or some text. Free to try with no sign-up.', zh: '粘贴链接或文字，无需注册即可试用。', vi: 'Dán một liên kết hoặc văn bản. Dùng thử miễn phí, không cần đăng ký.', id: 'Tempel tautan atau teks. Gratis dicoba tanpa mendaftar.' })}
          label={pick(lang, { en: 'Make a video', zh: '制作视频', vi: 'Tạo video', id: 'Buat video' })}
          href="#make"
          onClick={() => scrollToSection('make')}
        />
      )}

      <SiteFooter />
    </Shell>
  );
}
