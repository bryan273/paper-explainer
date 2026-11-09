// Orders and payment claims. Orders are created by explainer-account (op buy); "I have paid" goes to explainer-data.
const DATA_URL = 'https://wzdkroxbfrlqijbeiwpk.supabase.co/functions/v1/explainer-data';

export type PayMethod = 'wechat' | 'alipay' | 'techcombank' | 'bidv';
export async function markOrderPaid(id: string, method: PayMethod) {
  const res = await fetch(DATA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'order_paid', id, method }) });
  const out = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok || out.error) throw new Error(out.error || `HTTP ${res.status}`);
}
export async function saveFeedback(data: { rating: number; use_case: string; comment: string; email: string; arxiv: string; kind: string }) {
  await fetch(DATA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'feedback', data }) });
}
