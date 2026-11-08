import type { Lang } from '@/lib/prefs';

/** Prices are set in the money of the market: yuan for the Chinese and English pages, dong for Vietnam, rupiah for Indonesia. No conversion on the way. */
export type PriceKey = 'plus_month' | 'plus_year' | 'pro_month' | 'pro_year' | 'pack_5' | 'pack_20' | 'pack_50';
const TABLE: Record<PriceKey, [number, number, number]> = {
  //            CNY   VND        IDR
  plus_month: [33, 89000, 79000],
  plus_year: [330, 890000, 790000],
  pro_month: [59, 159000, 139000],
  pro_year: [590, 1590000, 1390000],
  pack_5: [19, 69000, 45000],
  pack_20: [59, 209000, 139000],
  pack_50: [129, 459000, 299000],
};
export type Cur = 'cny' | 'vnd' | 'idr';
export const curOf = (lang: Lang): Cur => (lang === 'vi' ? 'vnd' : lang === 'id' ? 'idr' : 'cny');

export function amount(key: PriceKey, lang: Lang): number {
  const row = TABLE[key];
  return row[lang === 'vi' ? 1 : lang === 'id' ? 2 : 0];
}
export function fmtMoney(n: number, lang: Lang): string {
  if (lang === 'vi') return `${new Intl.NumberFormat('vi-VN').format(n)}\u20ab`;
  if (lang === 'id') return `Rp${new Intl.NumberFormat('id-ID').format(n)}`;
  return `\u00a5${n}`;
}
export const money = (key: PriceKey, lang: Lang) => fmtMoney(amount(key, lang), lang);
/** A year's price per month, rounded to something a person would say. */
export function perMonthOfYear(key: 'plus_year' | 'pro_year', lang: Lang): number {
  const m = amount(key, lang) / 12;
  return lang === 'zh' || lang === 'en' ? Math.round(m) : Math.round(m / 1000) * 1000;
}
