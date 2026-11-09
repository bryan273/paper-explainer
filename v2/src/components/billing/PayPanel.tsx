import { useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { accountApi, track } from '@/lib/account';
import { uploadProof } from '@/lib/proof';
import { markOrderPaid, type PayMethod } from '@/lib/billing';
import { usePrefs } from '@/lib/prefs';
import { COMMON } from '@/lib/strings';
import { cn } from '@/lib/utils';

const T = {
  created: { en: 'Order created', zh: '订单已创建', vi: 'Đã tạo đơn hàng', id: 'Pesanan dibuat' },
  total: { en: 'Total', zh: '金额', vi: 'Tổng', id: 'Total' },
  order: { en: 'Order number', zh: '订单号', vi: 'Mã đơn hàng', id: 'Kode pesanan' },
  choose: { en: 'How would you like to pay?', zh: '选择付款方式', vi: 'Bạn muốn thanh toán qua đâu?', id: 'Ingin bayar dengan apa?' },
  scan: { en: 'Scan with {m} and pay exactly {p}.', zh: '用{m}扫码，支付 {p}。', vi: 'Quét bằng ứng dụng {m} và chuyển đúng {p}.', id: 'Pindai dengan {m} dan bayar tepat {p}.' },
  note: { en: 'Write the order number {o} in the payment note. We confirm and switch your plan on within a day.', zh: '请在付款备注里写订单号 {o}。我们会在一天内确认并开通。', vi: 'Ghi mã đơn {o} vào nội dung chuyển khoản. Chúng tôi xác nhận và kích hoạt trong vòng một ngày.', id: 'Tulis kode pesanan {o} di catatan pembayaran. Kami konfirmasi dan aktifkan dalam sehari.' },
  shot: { en: 'Add a screenshot of the payment (optional, faster)', zh: '附上付款截图（可选，更快确认）', vi: 'Thêm ảnh chụp giao dịch (không bắt buộc, xác nhận nhanh hơn)', id: 'Tambah tangkapan layar pembayaran (opsional, lebih cepat)' },
  pickShot: { en: 'Choose a photo', zh: '选择图片', vi: 'Chọn ảnh', id: 'Pilih foto' },
  paid: { en: 'I have paid', zh: '我已付款', vi: 'Tôi đã chuyển khoản', id: 'Saya sudah bayar' },
  other: { en: 'Another method', zh: '换一种方式', vi: 'Cách khác', id: 'Cara lain' },
  done: { en: 'Thank you! We are checking the payment and will switch everything on within a day. You can see the order in Account > Billing.', zh: '谢谢！我们正在核对付款，一天内开通。可在 账户 > 账单 查看订单。', vi: 'Cảm ơn bạn! Chúng tôi đang kiểm tra thanh toán và sẽ kích hoạt trong vòng một ngày. Xem đơn tại Tài khoản > Thanh toán.', id: 'Terima kasih! Pembayaran sedang kami cek dan semuanya aktif dalam sehari. Lihat pesanan di Akun > Tagihan.' },
  fail: { en: 'Could not record the payment. Try again.', zh: '付款记录失败，请重试。', vi: 'Không ghi nhận được thanh toán. Thử lại nhé.', id: 'Pembayaran gagal dicatat. Coba lagi.' },
  idText: { en: 'Send us the order number {o} with the Contact button. We reply with payment details (bank transfer or QRIS) and switch your plan on once paid, within a day.', zh: '', vi: '', id: 'Kirim kode pesanan {o} lewat tombol Kontak. Kami membalas dengan detail pembayaran (transfer bank atau QRIS) dan mengaktifkan paket setelah dibayar, dalam sehari.' },
  contact: { en: 'Contact us', zh: '联系我们', vi: 'Liên hệ', id: 'Hubungi kami' },
  wechat: { en: 'WeChat Pay', zh: '微信支付', vi: 'WeChat Pay', id: 'WeChat Pay' },
  alipay: { en: 'Alipay', zh: '支付宝', vi: 'Alipay', id: 'Alipay' },
};

/** The payment step after an order: VietQR in Vietnam, WeChat Pay or Alipay elsewhere, a message to us in Indonesia. */
export function PayPanel({ orderId, price, label, onClose }: { orderId: string; price: string; label: string; onClose: () => void }) {
  const { lang, t } = usePrefs();
  const vi = lang === 'vi';
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [shot, setShot] = useState<File | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const base = import.meta.env.BASE_URL;
  const methods = vi
    ? [{ id: 'techcombank' as const, src: `${base}pay/techcombank.webp`, label: 'Techcombank (VietQR)' }, { id: 'bidv' as const, src: `${base}pay/bidv.webp`, label: 'BIDV (VietQR)' }]
    : [{ id: 'wechat' as const, src: `${base}pay/wechat.webp`, label: t(T.wechat) }, { id: 'alipay' as const, src: `${base}pay/alipay.webp`, label: t(T.alipay) }];
  const code = orderId.slice(0, 8);
  const confirm = async () => {
    if (!method) return;
    setBusy(true); setErr('');
    try {
      if (shot) { try { await accountApi('order_proof', { order: orderId, path: await uploadProof(shot, 'payment') }); } catch { /* optional */ } }
      await markOrderPaid(orderId, method); track('order_paid_claimed'); setPaid(true);
    } catch { setErr(t(T.fail)); } finally { setBusy(false); }
  };
  const head = (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-4">
      <div><p className="text-sm text-muted-foreground">{t(T.created)}</p><p className="font-display text-lg font-semibold">{label}</p></div>
      <div className="text-right"><p className="text-sm text-muted-foreground">{t(T.total)}</p><p className="font-display text-xl font-bold">{price}</p></div>
    </div>
  );
  if (lang === 'id') {
    return (
      <div className="grid gap-4">{head}
        <p className="text-sm">{t(T.idText).replace('{o}', code)}</p>
        <div className="flex gap-2"><Button onClick={() => window.dispatchEvent(new CustomEvent('pl-support', { detail: 'contact' }))}>{t(T.contact)}</Button><Button variant="outline" onClick={onClose}>{t(COMMON.close)}</Button></div>
      </div>
    );
  }
  if (paid) {
    return (
      <div className="grid gap-4">{head}
        <p className="flex gap-2 rounded-xl bg-success/10 p-4 text-sm text-success"><CheckCircle2 className="h-5 w-5 shrink-0" />{t(T.done)}</p>
        <p className="text-sm text-muted-foreground">{t(T.order)}: <span className="font-mono">{code}</span></p>
        <Button variant="outline" onClick={onClose} className="w-fit">{t(COMMON.close)}</Button>
      </div>
    );
  }
  const m = methods.find((x) => x.id === method);
  return (
    <div className="grid gap-4">{head}
      {!m ? (
        <>
          <p className="font-semibold">{t(T.choose)}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {methods.map((x) => <button key={x.id} type="button" onClick={() => setMethod(x.id)} className="rounded-xl border p-4 text-left font-medium transition hover:border-primary hover:bg-accent">{x.label}</button>)}
          </div>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
          <img src={m.src} alt={m.label} className="w-full max-w-[260px] rounded-xl border bg-white" />
          <div className="grid content-start gap-3 text-sm">
            <p className="font-semibold">{t(T.scan).replace('{m}', m.label).replace('{p}', price)}</p>
            <p className="text-muted-foreground">{t(T.note).replace('{o}', code)}</p>
            <div>
              <p className="mb-1.5 text-muted-foreground">{t(T.shot)}</p>
              <input ref={ref} type="file" accept="image/*,application/pdf" hidden onChange={(e) => setShot(e.target.files?.[0] ?? null)} />
              <button type="button" onClick={() => ref.current?.click()} className={cn('flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-left', shot && 'border-success text-success')}><ImagePlus className="h-4 w-4" />{shot ? shot.name : t(T.pickShot)}</button>
            </div>
            {err && <p className="text-destructive" role="alert">{err}</p>}
            <div className="flex flex-wrap gap-2">
              <Button onClick={confirm} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t(T.paid)}</Button>
              <Button variant="ghost" onClick={() => setMethod(null)}>{t(T.other)}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
