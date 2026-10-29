import { useState } from 'react';
import { markOrderPaid } from '@/lib/data';
import { track } from '@/lib/account';
import { usePrefs } from '@/lib/prefs';

/** QR payment step shared by Studio orders and credit packs: pick WeChat Pay or Alipay, scan, then "I have paid". The owner confirms in the admin page. */
export default function PayPanel({ orderId, price, intro, onClose }: { orderId: string; price: string; intro?: string; onClose: () => void }) {
  const { t } = usePrefs();
  const [method, setMethod] = useState<'wechat' | 'alipay' | null>(null);
  const [paid, setPaid] = useState(false);
  const [sending, setSending] = useState(false);
  const [payError, setPayError] = useState(false);
  const methods = [
    { id: 'wechat' as const, src: import.meta.env.BASE_URL + 'pay/wechat.webp', label: t('payWechat') },
    { id: 'alipay' as const, src: import.meta.env.BASE_URL + 'pay/alipay.webp', label: t('payAlipay') },
  ];
  const confirm = async () => {
    if (!method) return;
    setSending(true); setPayError(false);
    try { await markOrderPaid(orderId, method); track('order_paid_claimed'); setPaid(true); } catch { setPayError(true); } finally { setSending(false); }
  };
  if (paid) {
    return (
      <div className="stack fade" role="status">
        <div className="done-box">{t('payDone')}</div>
        <p className="small muted" style={{ margin: 0 }}>{t('payOrderNo')}: <span className="mono">{orderId.slice(0, 8)}</span></p>
        <div><button type="button" className="btn ghost small" onClick={onClose}>{t('close')}</button></div>
      </div>
    );
  }
  return (
    <div className="stack fade" role="status">
      <div className="done-box">{intro ?? t('orderThanks')}</div>
      {!method ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <b style={{ font: '700 16px var(--display)' }}>{t('payChoose')}</b>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {methods.map((m) => <button key={m.id} type="button" className="btn ghost" onClick={() => setMethod(m.id)}>{m.label}</button>)}
          </div>
        </div>
      ) : (
        <div className="pay" style={{ display: 'grid', gap: 12 }}>
          {(() => {
            const m = methods.find((x) => x.id === method)!;
            return (
              <>
                <b style={{ font: '700 16px var(--display)' }}>{t('payScan').replace('{m}', m.label).replace('{p}', price)}</b>
                <figure style={{ margin: 0, width: 220 }}>
                  <img src={m.src} alt={m.label} width={220} style={{ width: 220, height: 'auto', borderRadius: 14, border: '1px solid var(--line)', display: 'block' }} />
                </figure>
                <p className="small muted" style={{ margin: 0 }}>{t('payNote')}</p>
                <p className="small muted" style={{ margin: 0 }}>{t('payOrderNo')}: <span className="mono">{orderId.slice(0, 8)}</span></p>
                {payError && <p className="err">{t('payFail')}</p>}
                <div className="row">
                  <button type="button" className="btn primary" disabled={sending} onClick={confirm}>{sending ? <span className="spin" aria-hidden /> : null}{t('payIPaid')}</button>
                  <button type="button" className="btn ghost" onClick={() => setMethod(null)}>{t('payBack')}</button>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
