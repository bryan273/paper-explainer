import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { accountApi, track, useAccount } from '@/lib/account';
import { uploadProof } from '@/lib/proof';
import { markOrderPaid } from '@/lib/billing';
import { CURS, METHODS, money, useCurrency, type Cur, type PayMethod, type PriceKey } from '@/lib/currency';
import { usePrefs } from '@/lib/prefs';
import { COMMON } from '@/lib/strings';
import { cn } from '@/lib/utils';

const T = {
  total: { en: 'Total', zh: '金额', vi: 'Tổng', id: 'Total' },
  payIn: { en: 'Pay in', zh: '付款货币', vi: 'Thanh toán bằng', id: 'Bayar dengan' },
  order: { en: 'Order number', zh: '订单号', vi: 'Mã đơn hàng', id: 'Kode pesanan' },
  making: { en: 'creating…', zh: '生成中…', vi: 'đang tạo…', id: 'sedang dibuat…' },
  s1: { en: 'Scan the code with {m} and pay exactly {p}.', zh: '用 {m} 扫码，支付 {p}。', vi: 'Quét mã bằng {m} và chuyển đúng {p}.', id: 'Pindai kode dengan {m} dan bayar tepat {p}.' },
  s2: { en: 'Write the order number {o} in the payment note.', zh: '在付款备注中填写订单号 {o}。', vi: 'Ghi mã đơn {o} vào nội dung chuyển khoản.', id: 'Tulis kode pesanan {o} di catatan pembayaran.' },
  s3: { en: 'Add a screenshot of the payment. It is optional, but we confirm faster with it.', zh: '附上付款截图。可不附，但有截图确认更快。', vi: 'Đính kèm ảnh chụp giao dịch. Không bắt buộc, nhưng có ảnh chúng tôi xác nhận nhanh hơn.', id: 'Lampirkan tangkapan layar pembayaran. Opsional, tetapi kami bisa konfirmasi lebih cepat.' },
  s4: { en: 'Press "I have paid". Your plan switches on as soon as we confirm, usually within a few hours and always within a day.', zh: '点击“我已付款”。我们确认后立即开通，通常几小时内，最迟一天。', vi: 'Nhấn "Tôi đã chuyển khoản". Gói được kích hoạt ngay khi chúng tôi xác nhận, thường trong vài giờ và chậm nhất trong một ngày.', id: 'Tekan "Saya sudah bayar". Paket aktif begitu kami konfirmasi, biasanya dalam beberapa jam dan paling lambat sehari.' },
  pickShot: { en: 'Choose a screenshot', zh: '选择截图', vi: 'Chọn ảnh chụp', id: 'Pilih tangkapan layar' },
  paid: { en: 'I have paid', zh: '我已付款', vi: 'Tôi đã chuyển khoản', id: 'Saya sudah bayar' },
  done: { en: 'Thank you. We are checking the payment and will switch everything on soon, always within a day. The order is in Account > Plan and billing.', zh: '谢谢！我们正在核对付款，很快开通，最迟一天。订单可在 账户 > 套餐与账单 查看。', vi: 'Cảm ơn bạn. Chúng tôi đang kiểm tra thanh toán và sẽ kích hoạt sớm, chậm nhất trong một ngày. Xem đơn tại Tài khoản > Gói và thanh toán.', id: 'Terima kasih. Pembayaran sedang kami cek dan semuanya segera aktif, paling lambat sehari. Pesanan ada di Akun > Paket dan tagihan.' },
  fail: { en: 'We could not record the payment. Please try again.', zh: '付款记录失败，请重试。', vi: 'Chưa ghi nhận được thanh toán. Vui lòng thử lại.', id: 'Pembayaran belum tercatat. Silakan coba lagi.' },
  orderFail: { en: 'We could not create the order. Check your connection and try again.', zh: '订单创建失败，请检查网络后重试。', vi: 'Chưa tạo được đơn hàng. Kiểm tra kết nối và thử lại.', id: 'Pesanan belum bisa dibuat. Periksa koneksi lalu coba lagi.' },
  retry: { en: 'Try again', zh: '重试', vi: 'Thử lại', id: 'Coba lagi' },
};

export type OrderReq = { key: string; body: Record<string, unknown>; label: string; priceKey: PriceKey };

/** The payment window: opens at once with the payment code; the order is created in the background in the chosen money. */
export function PayPanel({ req, onClose }: { req: OrderReq; onClose: () => void }) {
  const { lang, t } = usePrefs();
  const { me } = useAccount();
  const [cur, setCur] = useCurrency(lang, me?.country);
  const [method, setMethod] = useState<PayMethod>(METHODS[cur][0].id);
  const [orders, setOrders] = useState<Partial<Record<Cur, string>>>({});
  const [orderErr, setOrderErr] = useState(false);
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [shot, setShot] = useState<File | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const inflight = useRef<Partial<Record<Cur, Promise<string>>>>({});
  const base = import.meta.env.BASE_URL;

  // one order per money: switching back and forth does not create a pile of orders
  const ensureOrder = (c: Cur) => {
    if (orders[c]) return Promise.resolve(orders[c] as string);
    if (!inflight.current[c]) {
      inflight.current[c] = (accountApi('buy', { ...req.body, currency: c }) as Promise<{ id: string }>).then((o) => { setOrders((x) => ({ ...x, [c]: o.id })); return o.id; });
      inflight.current[c]!.catch(() => { delete inflight.current[c]; setOrderErr(true); });
    }
    return inflight.current[c]!;
  };
  useEffect(() => { setOrderErr(false); setMethod(METHODS[cur][0].id); ensureOrder(cur).catch(() => undefined); track('click_plan', { key: req.key, cur }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [cur]);

  const orderId = orders[cur];
  const code = orderId ? orderId.slice(0, 8) : '';
  const m = METHODS[cur].find((x) => x.id === method) ?? METHODS[cur][0];
  const price = money(req.priceKey, cur);
  const confirm = async () => {
    setBusy(true); setErr('');
    try {
      const id = await ensureOrder(cur);
      if (shot) { try { await accountApi('order_proof', { order: id, path: await uploadProof(shot, 'payment') }); } catch { /* optional */ } }
      await markOrderPaid(id, m.id); track('order_paid_claimed'); setPaid(true);
    } catch { setErr(t(T.fail)); } finally { setBusy(false); }
  };

  const head = (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
      <div><p className="font-display text-lg font-semibold">{req.label}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{t(T.order)}: <span className="font-mono text-foreground">{code || t(T.making)}</span></p></div>
      <div className="text-right"><p className="text-sm text-muted-foreground">{t(T.total)}</p><p className="font-display text-2xl font-bold">{price}</p></div>
    </div>
  );
  if (paid) {
    return (
      <div className="grid gap-4">{head}
        <p className="flex gap-2 rounded-xl bg-success/10 p-4 text-sm text-success"><CheckCircle2 className="h-5 w-5 shrink-0" />{t(T.done)}</p>
        <Button variant="outline" onClick={onClose} className="w-fit">{t(COMMON.close)}</Button>
      </div>
    );
  }
  return (
    <div className="grid gap-5">{head}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-sm font-medium text-muted-foreground">{t(T.payIn)}</span>
        <div className="inline-flex rounded-lg bg-muted p-0.5" role="radiogroup" aria-label={t(T.payIn)}>
          {CURS.map((c) => <button key={c.k} type="button" role="radio" aria-checked={cur === c.k} onClick={() => setCur(c.k)} className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition', cur === c.k ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{c.sym} {c.label}</button>)}
        </div>
        {METHODS[cur].length > 1 && (
          <div className="inline-flex rounded-lg border p-0.5" role="radiogroup" aria-label="Method">
            {METHODS[cur].map((x) => <button key={x.id} type="button" role="radio" aria-checked={method === x.id} onClick={() => setMethod(x.id)} className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition', method === x.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>{x.label}</button>)}
          </div>
        )}
      </div>
      <div className="grid gap-5 sm:grid-cols-[240px_1fr]">
        <img key={m.img} src={`${base}${m.img}`} alt={m.label} className="mx-auto w-full max-w-[260px] rounded-xl border bg-white" decoding="async" />
        <ol className="grid content-start gap-3 text-sm">
          <li className="flex gap-2.5"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">1</span><span className="font-medium">{t(T.s1).replace('{m}', m.label).replace('{p}', price)}</span></li>
          <li className="flex gap-2.5"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">2</span><span>{t(T.s2).replace('{o}', code || '…')}</span></li>
          <li className="flex gap-2.5"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">3</span><span className="grid gap-2">{t(T.s3)}
            <input ref={ref} type="file" accept="image/*,application/pdf" hidden onChange={(e) => setShot(e.target.files?.[0] ?? null)} />
            <button type="button" onClick={() => ref.current?.click()} className={cn('flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-left', shot && 'border-success text-success')}><ImagePlus className="h-4 w-4 shrink-0" /><span className="truncate">{shot ? shot.name : t(T.pickShot)}</span></button></span></li>
          <li className="flex gap-2.5"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">4</span><span className="text-muted-foreground">{t(T.s4)}</span></li>
          {orderErr && <li className="flex flex-wrap items-center gap-2 text-destructive" role="alert">{t(T.orderFail)}<Button size="sm" variant="outline" onClick={() => { setOrderErr(false); ensureOrder(cur).catch(() => undefined); }}>{t(T.retry)}</Button></li>}
          {err && <li className="text-destructive" role="alert">{err}</li>}
          <li><Button onClick={confirm} disabled={busy || orderErr}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t(T.paid)}</Button></li>
        </ol>
      </div>
    </div>
  );
}
