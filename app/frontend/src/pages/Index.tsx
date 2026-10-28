import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Shell, { scrollToSection } from '@/components/Shell';
import Hero from '@/components/sections/Hero';
import MakeSection from '@/components/sections/MakeSection';
import ExamplesSection from '@/components/sections/ExamplesSection';
import HowSection from '@/components/sections/HowSection';
import PricingSection from '@/components/sections/PricingSection';
import FeedbackSection from '@/components/sections/FeedbackSection';
import SupportSection from '@/components/sections/SupportSection';
import { SUITE_URLS, parseArxivId, useRecent } from '@/lib/explainer';
import { usePrefs } from '@/lib/prefs';

export default function Index() {
  const { t } = usePrefs();
  const { items, error } = useRecent();
  const [params] = useSearchParams();
  const shared = parseArxivId(params.get('v') ?? '');

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
      <MakeSection prefill={shared} />
      <ExamplesSection items={items} error={error} openArxiv={shared} />
      <HowSection />
      <PricingSection />
      <SupportSection />
      <FeedbackSection />

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
        <span className="tiny">{t('footerNote')}</span>
      </footer>
    </Shell>
  );
}
