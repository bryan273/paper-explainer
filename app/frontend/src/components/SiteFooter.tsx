import { Link } from 'react-router-dom';
import { openContact } from '@/components/sections/ContactSection';
import { scrollToSection } from '@/components/Shell';
import { SUITE_URLS } from '@/lib/explainer';
import { useAcctText } from '@/lib/account';
import { usePrefs } from '@/lib/prefs';

/** A quiet footer: what to do next, who to ask, and the fine print. Contact opens a dialog instead of taking page space. */
export default function SiteFooter() {
  const { t, lang } = usePrefs();
  const a = useAcctText();
  const zh = lang === 'zh';
  const go = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); scrollToSection(id); };
  return (
    <footer className="foot2">
      <div className="foot2-in">
        <div className="foot2-brand">
          <b>Paperlit</b>
          <span>{lang === 'zh' ? '把论文讲明白的短视频。' : lang === 'vi' ? 'Bài báo được giải thích bằng video ngắn.' : lang === 'id' ? 'Makalah dijelaskan lewat video singkat.' : 'Papers explained in short videos.'}</span>
        </div>
        <nav aria-label={zh ? '页面' : 'Product'}>
          <a href="#make" onClick={go('make')}>{t('navMake')}</a>
          <a href="#examples" onClick={go('examples')}>{t('navExamples')}</a>
          <a href="#pricing" onClick={go('pricing')}>{t('navPricing')}</a>
        </nav>
        <nav aria-label={zh ? '帮助' : 'Help'}>
          <button type="button" className="linkbtn" onClick={openContact}>{zh ? '联系我们' : 'Contact us'}</button>
          <Link to="/terms">{a('terms')}</Link>
          <Link to="/privacy">{a('privacy')}</Link>
        </nav>
        <nav aria-label="Paperlit">
          <a href={SUITE_URLS.repro}>{t('appRepro')}</a>
          <a href={SUITE_URLS.all}>{t('appAll')}</a>
          <Link to="/account">{a('account')}</Link>
        </nav>
      </div>
      <p className="foot2-note">{t('footerNote')} {zh ? 'AI 可能出错，重要结论请核对原文。' : 'AI can make mistakes: check important claims in the paper.'}</p>
    </footer>
  );
}
