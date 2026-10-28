import { usePrefs } from '@/lib/prefs';

/** Visitors can chip in to refill the AI credit that makes the videos. Same two QR codes as the Studio order. */
export default function SupportSection() {
  const { t } = usePrefs();
  const qrs = [
    { src: '/pay/wechat.webp', label: t('payWechat') },
    { src: '/pay/alipay.webp', label: t('payAlipay') },
  ];
  return (
    <section className="section" id="support" aria-labelledby="support-title">
      <h2 className="sec" id="support-title">
        {t('supportTitle')}
      </h2>
      <p className="sec-sub">{t('supportSub')}</p>
      <div className="card" style={{ marginTop: 18, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 260px' }}>
          <p style={{ margin: '0 0 8px' }}>{t('supportBody')}</p>
          <p className="small muted" style={{ margin: 0 }}>
            {t('supportNote')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {qrs.map((q) => (
            <figure key={q.src} style={{ margin: 0, width: 168 }}>
              <img src={q.src} alt={q.label} width={168} style={{ width: 168, height: 'auto', borderRadius: 14, border: '1px solid var(--line)', display: 'block' }} />
              <figcaption className="small" style={{ textAlign: 'center', marginTop: 6 }}>
                {q.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
