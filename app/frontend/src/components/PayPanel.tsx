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
  const confirm = async () => {
    if (!method) return;
    setSending(true); setPayError(false);
    try { await markOrderPaid(orderId, method); track('order_paid_claimed'); setPaid(true); } catch { setPayError(true); } finally { setSending(false); }
  };
  if (lang === 'id') {   // no Indonesian bank account is set up yet: say so plainly and let the person reach us with the order number
    return (
      <div className="stack fade" role="status">
        <div className="done-box">{intro ?? 'Pesanan dibuat.'}</div>
        <b style={{ font: '700 16px var(--display)' }}>Total: {price}</b>
        <p className="small" style={{ margin: 0 }}>Kirim kode pesanan <span className="mono">{orderId.slice(0, 8)}</span> kepada kami lewat tombol Kontak. Kami membalas dengan detail pembayaran (transfer bank atau QRIS) dan mengaktifkan paket Anda setelah pembayaran dikonfirmasi, dalam satu hari.</p>
        <div className="row">
          <button type="button" className="btn primary" onClick={() => window.dispatchEvent(new Event('pe-open-contact'))}>Hubungi kami</button>
          <button type="button" className="btn ghost" onClick={onClose}>{t('close')}</button>
        </div>
      </div>
    );
  }
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
                <b style={{ font: '700 16px var(--display)' }}>{vi ? `Quét mã bằng ứng dụng ngân hàng và chuyển đúng ${price}` : t('payScan').replace('{m}', m.label).replace('{p}', price)}</b>
                <figure style={{ margin: 0, width: vi ? 280 : 220 }}>
                  <img src={m.src} alt={m.label} width={vi ? 280 : 220} style={{ width: vi ? 280 : 220, height: 'auto', borderRadius: 14, border: '1px solid var(--line)', display: 'block' }} />
                </figure>
                <p className="small muted" style={{ margin: 0 }}>{vi ? `Ghi mã đơn hàng ${orderId.slice(0, 8)} vào nội dung chuyển khoản. Chúng tôi xác nhận và kích hoạt trong vòng một ngày.` : t('payNote')}</p>
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
