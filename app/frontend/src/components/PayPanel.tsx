import { useState } from 'react';
import { markOrderPaid } from '@/lib/data';
import { track } from '@/lib/account';
import { usePrefs } from '@/lib/prefs';

/** QR payment step shared by Studio orders and credit packs: pick WeChat Pay or Alipay, scan, then "I have paid". The owner confirms in the admin page. */
export default function PayPanel({ orderId, price, intro, onClose }: { orderId: string; price: string; intro?: string; onClose: () => void }) {
  const { t } = usePrefs();
  const { lang } = usePrefs();
  const vi = lang === 'vi';
  const [method, setMethod] = useState<'wechat' | 'alipay' | 'techcombank' | 'bidv' | null>(null);
  const [paid, setPaid] = useState(false);
  const [sending, setSending] = useState(false);
  const [payError, setPayError] = useState(false);
  // Vietnamese visitors pay by bank transfer (VietQR); everyone else by WeChat Pay or Alipay
  const methods = vi
    ? [
        { id: 'techcombank' as const, src: import.meta.env.BASE_URL + 'pay/techcombank.webp', label: 'Techcombank (VietQR)' },
        { id: 'bidv' as const, src: import.meta.env.BASE_URL + 'pay/bidv.webp', label: 'BIDV (VietQR)' },
      ]
    : [
        { id: 'wechat' as const, src: import.meta.env.BASE_URL + 'pay/wechat.webp', label: t('payWechat') },
        { id: 'alipay' as const, src: import.meta.env.BASE_URL + 'pay/alipay.webp', label: t('payAlipay') },
      ];
  const cny = Number(price.replace(/[^0-9.]/g, '')) || 0;
  const vnd = new Intl.NumberFormat('vi-VN').format(Math.round((cny * 3600) / 1000) * 1000);   // a reference rate; the owner confirms the exact amount
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
          <b style={{ font: '700 16px var(--display)' }}>{vi ? 'Bạn muốn chuyển khoản qua ngân hàng nào?' : t('payChoose')}</b>
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
                <b style={{ font: '700 16px var(--display)' }}>{vi ? `Quét mã bằng ứng dụng ngân hàng và chuyển khoảng ${vnd} VND (${price})` : t('payScan').replace('{m}', m.label).replace('{p}', price)}</b>
                <figure style={{ margin: 0, width: vi ? 280 : 220 }}>
                  <img src={m.src} alt={m.label} width={vi ? 280 : 220} style={{ width: vi ? 280 : 220, height: 'auto', borderRadius: 14, border: '1px solid var(--line)', display: 'block' }} />
                </figure>
                <p className="small muted" style={{ margin: 0 }}>{vi ? `Ghi mã đơn hàng ${orderId.slice(0, 8)} vào nội dung chuyển khoản để chúng tôi đối chiếu. Số tiền VND chỉ là tỷ giá tham khảo; chúng tôi xác nhận số tiền chính xác và kích hoạt gói trong vòng một ngày.` : t('payNote')}</p>
                <p className="small muted" style={{ margin: 0 }}>{t('payOrderNo')}: <span className="mono">{orderId.slice(0, 8)}</span></p>
                {payError && <p className="err">{t('payFail')}</p>}
                <div className="row">
                  <button type="button" className="btn primary" disabled={sending} onClick={confirm}>{sending ? <span className="spin" aria-hidden /> : null}{vi ? 'Tôi đã chuyển khoản' : t('payIPaid')}</button>
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
