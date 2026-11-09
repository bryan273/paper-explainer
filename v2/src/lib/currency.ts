import { useCallback, useEffect, useState } from 'react';
import type { Lang } from '@/lib/prefs';

/** Prices are set in each market's own money: no exchange rate on the way. The buyer picks the money; the first choice is the country of their profile. */
export type PriceKey = 'plus_month' | 'plus_year' | 'pro_month' | 'pro_year' | 'premium_month' | 'premium_year' | 'pack_5' | 'pack_20' | 'pack_50';
const TABLE: Record<PriceKey, [number, number, number]> = {
  //            CNY   VND        IDR
  plus_month: [29, 79000, 69000],
  plus_year: [290, 790000, 690000],
  pro_month: [55, 149000, 129000],
  pro_year: [550, 1490000, 1290000],
  premium_month: [99, 269000, 239000],
  premium_year: [990, 2690000, 2390000],
  pack_5: [19, 69000, 45000],
  pack_20: [59, 209000, 139000],
  pack_50: [129, 459000, 299000],
};
export type Cur = 'cny' | 'vnd' | 'idr';
export const CURS: { k: Cur; label: string; sym: string }[] = [
  { k: 'cny', label: 'CNY', sym: '¥' }, { k: 'vnd', label: 'VND', sym: '₫' }, { k: 'idr', label: 'IDR', sym: 'Rp' },
];
/** How each money is paid: Vietnam by bank QR, China by WeChat Pay or Alipay, Indonesia by QRIS. */
export type PayMethod = 'wechat' | 'alipay' | 'techcombank' | 'bidv' | 'qris';
export const METHODS: Record<Cur, { id: PayMethod; label: string; img: string }[]> = {
  cny: [{ id: 'wechat', label: 'WeChat Pay', img: 'pay/wechat.webp' }, { id: 'alipay', label: 'Alipay', img: 'pay/alipay.webp' }],
  vnd: [{ id: 'techcombank', label: 'Techcombank (VietQR)', img: 'pay/techcombank.webp' }, { id: 'bidv', label: 'BIDV (VietQR)', img: 'pay/bidv.webp' }],
  idr: [{ id: 'qris', label: 'QRIS', img: 'pay/qris.webp' }],
};
/** Load every payment code once, so the payment window shows them at once. */
export function preloadPayImages() {
  for (const list of Object.values(METHODS)) for (const m of list) { const i = new Image(); i.src = `${import.meta.env.BASE_URL}${m.img}`; }
}

const byCountry = (c?: string | null): Cur | null => (c === 'VN' ? 'vnd' : c === 'ID' ? 'idr' : c === 'CN' || c === 'HK' || c === 'MO' || c === 'TW' ? 'cny' : null);
const byLang = (lang: Lang): Cur => (lang === 'vi' ? 'vnd' : lang === 'id' ? 'idr' : 'cny');
const KEY = 'pl-cur';

/** The money prices are shown and paid in: what the person chose, else their profile country, else the page language. */
export function useCurrency(lang: Lang, country?: string | null): [Cur, (c: Cur) => void] {
  const read = useCallback((): Cur => {
    try { const s = localStorage.getItem(KEY); if (s === 'cny' || s === 'vnd' || s === 'idr') return s; } catch { /* no storage */ }
    return byCountry(country) ?? byLang(lang);
  }, [lang, country]);
  const [cur, setS] = useState<Cur>(read);
  useEffect(() => { setS(read()); }, [read]);
  useEffect(() => {
    const on = () => setS(read());
    window.addEventListener('pl-cur', on);
    return () => window.removeEventListener('pl-cur', on);
  }, [read]);
  const set = useCallback((c: Cur) => {
    try { localStorage.setItem(KEY, c); } catch { /* private mode */ }
    setS(c); window.dispatchEvent(new Event('pl-cur'));
  }, []);
  return [cur, set];
}

export function amount(key: PriceKey, cur: Cur): number {
  return TABLE[key][cur === 'vnd' ? 1 : cur === 'idr' ? 2 : 0];
}
export function fmtMoney(n: number, cur: Cur): string {
  if (cur === 'vnd') return `${new Intl.NumberFormat('vi-VN').format(n)}₫`;
  if (cur === 'idr') return `Rp${new Intl.NumberFormat('id-ID').format(n)}`;
  return `¥${n}`;
}
export const money = (key: PriceKey, cur: Cur) => fmtMoney(amount(key, cur), cur);
/** A year's price per month, rounded to something a person would say. */
export function perMonthOfYear(key: 'plus_year' | 'pro_year' | 'premium_year', cur: Cur): number {
  const m = amount(key, cur) / 12;
  return cur === 'cny' ? Math.round(m) : Math.round(m / 1000) * 1000;
}
