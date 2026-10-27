import { SUITE_URLS } from '@/lib/explainer';
import { usePrefs, type StringKey } from '@/lib/prefs';

const STEPS: { head: StringKey; body: StringKey }[] = [
  { head: 'how1h', body: 'how1' },
  { head: 'how2h', body: 'how2' },
  { head: 'how3h', body: 'how3' },
  { head: 'how4h', body: 'how4' },
];

export default function HowSection() {
  const { t } = usePrefs();

  return (
    <section className="section" id="how" aria-labelledby="how-title">
      <h2 className="sec" id="how-title">
        {t('howTitle')}
      </h2>
      <p className="sec-sub">{t('howSub')}</p>

      <ol className="how">
        {STEPS.map((s, i) => (
          <li key={s.head}>
            <div className="num" aria-hidden>
              {i + 1}
            </div>
            <b>{t(s.head)}</b>
            <p>{t(s.body)}</p>
          </li>
        ))}
      </ol>

      <div className="two">
        <div className="card">
          <b style={{ fontFamily: 'var(--display)', fontSize: 15 }}>{t('notCheckTitle')}</b>
          <p className="small muted" style={{ margin: '8px 0 0', lineHeight: 1.6 }}>
            {t('notCheck')}
          </p>
        </div>
        <a className="card cardlink" href={SUITE_URLS.repro} target="_blank" rel="noopener noreferrer">
          <b>{t('reproTitle')}</b>
          <span className="small muted">{t('reproSub')}</span>
          <span className="go">
            {t('appRepro')} ↗
          </span>
        </a>
      </div>
    </section>
  );
}
