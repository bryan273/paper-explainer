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
import { useAcctText } from '@/lib/account';
import { SUITE_URLS, parseArxivId, useRecent } from '@/lib/explainer';
import { usePrefs } from '@/lib/prefs';

export default function Index() {
  const { t } = usePrefs();
  const ac = useAcctText();
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
      <Hero items={items} error={error} />
      <MakeSection prefill={paper ?? shared} autoOpen={!!paper} />
      <ExamplesSection items={items} error={error} openArxiv={shared} />
      <HowSection />
      <PricingSection />
      <FeedbackSection />
      <FaqSection />
      <ContactSection />

      <footer className="foot">
        <span>
          {t('footerLine')}{' '}
          <a href={SUITE_URLS.all} target="_blank" rel="noopener noreferrer">
            {t('appAll')} ↗
          </a>{' '}
          <a href={SUITE_URLS.repro} target="_blank" rel="noopener noreferrer">
            {t('appRepro')} ↗
          </a>
        </span>
        <span className="tiny">
          <Link to="/terms">{ac('terms')}</Link> · <Link to="/privacy">{ac('privacy')}</Link> · <Link to="/account">{ac('account')}</Link> · {t('footerNote')}
        </span>
      </footer>
    </Shell>
  );
}
