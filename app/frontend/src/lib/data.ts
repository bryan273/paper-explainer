/** Feedback and Studio orders live in Supabase (explainer-data function), so the site runs on any host. */
const URL = 'https://vzvyghmtsakixlhzzuol.supabase.co/functions/v1/explainer-data';

async function post(body: unknown): Promise<{ id?: string }> {
  const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const out = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
  if (!res.ok || out.error) throw new Error(out.error || `HTTP ${res.status}`);
  return out;
}

export type FeedbackData = { rating: number; use_case: string; comment: string; email: string; arxiv: string; kind: string };

export const saveFeedback = (data: FeedbackData, id?: string | null) => post({ type: 'feedback', id: id ?? undefined, data });
export const saveOrder = (data: { email: string; arxiv: string; language: string; notes: string }) => post({ type: 'order', data });

export async function feedbackTotal(): Promise<number> {
  const res = await fetch(`${URL}?count=1`);
  const out = (await res.json()) as { count?: number };
  return out.count ?? 0;
}
