import { useEffect, useState, type FormEvent } from 'react';
import { accountApi, useAcctText } from '@/lib/account';
import { usePrefs } from '@/lib/prefs';

const FAQ: Record<'en' | 'zh', [string, string][]> = {
  en: [
    ['How long does a video take?', 'About 5 to 10 minutes for a 3 minute video. You see each section as soon as it is ready, so you can start watching before the whole video is done.'],
    ['Which papers work?', 'Any arXiv paper, a direct PDF link, or a DOI that points to an open-access PDF. Very long or scanned papers may fail; a failed video returns your credits.'],
    ['Can I change the style or length?', 'Pick the length (1 to 10 minutes), the voice and the teaching tone. In "Context and instructions" you can ask for anything: focus on the experiments, skip the maths, explain it to a high-school student.'],
    ['Is it accurate?', 'Quotes and numbers are checked against the paper and removed if they do not match. AI can still slip, so check important claims in the original.'],
    ['How do free videos and credits work?', 'Everyone gets free videos in any 24 hours; a free account gets more. When they are used up, credits are spent (a video up to 3 minutes costs 1 credit). Credits never expire.'],
    ['How do I pay?', 'Pick a credit pack in your account, scan the WeChat Pay or Alipay code and tap "I have paid". We confirm by hand and add the credits, usually within 24 hours.'],
    ['Can I use the videos on Douyin, Xiaohongshu or YouTube?', 'Yes. Every video comes in 16:9 and 9:16, in English and Chinese. Credit the original paper.'],
  ],
  zh: [
    ['一个视频要多久？', '3 分钟的视频大约 5 到 10 分钟。每个章节做好就能先看，不用等整支视频完成。'],
    ['哪些论文可以？', '任何 arXiv 论文、PDF 直链，或指向开放获取 PDF 的 DOI。特别长或扫描版论文可能失败；失败的视频会退还额度。'],
    ['能改风格和时长吗？', '可选时长（1 到 10 分钟）、声音和讲解语气。在"背景与要求"里可以随意提要求：重点讲实验、少讲公式、讲给高中生听。'],
    ['准确吗？', '引文和数字会对照论文核对，不一致就删除。AI 仍可能出错，重要结论请回到原文核实。'],
    ['免费视频和额度怎么算？', '任何人在 24 小时内都有免费视频，免费账户更多。用完后才扣额度（3 分钟以内的视频扣 1 点）。额度永不过期。'],
    ['怎么付款？', '在账户里选额度包，扫微信或支付宝二维码后点击"我已付款"。我们人工确认并加额度，通常 24 小时内。'],
    ['能发到抖音、小红书或 YouTube 吗？', '可以。每个视频都有 16:9 和 9:16，中英文各一版。请注明原论文出处。'],
  ],
};

export function FaqSection() {
  const a = useAcctText();
  const { lang } = usePrefs();
  return (
    <section className="section" id="faq" aria-labelledby="faq-title">
      <h2 className="sec" id="faq-title">{a('faqTitle')}</h2>
      <div className="stack" style={{ gap: 10, marginTop: 14 }}>
        {FAQ[lang === 'zh' ? 'zh' : 'en'].map(([q, ans]) => (
          <details key={q} className="card" style={{ margin: 0, padding: '12px 16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{q}</summary>
            <p style={{ margin: '10px 0 0', lineHeight: 1.65 }}>{ans}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function ContactForm({ onDone }: { onDone?: () => void }) {
  const a = useAcctText();
  const [f, setF] = useState({ topic: 'question', name: '', email: '', message: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [err, setErr] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState('sending'); setErr('');
    try {
      await accountApi('contact', f);
      setState('sent');
      setF({ topic: 'question', name: '', email: '', message: '' });
    } catch (x) { setErr((x as Error).message); setState('idle'); }
  };
  return (
    <>
        {state === 'sent' ? (
  <div className="done-box" role="status">{a('sent')}</div>
) : (
  <form className="stack" onSubmit={submit}>
    <div className="row" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <label className="field" style={{ flex: '1 1 160px' }}>{a('topic')}
        <select value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}>
          <option value="question">{a('topicQ')}</option>
          <option value="bug">{a('topicBug')}</option>
          <option value="idea">{a('topicIdea')}</option>
          <option value="billing">{a('topicBilling')}</option>
          <option value="business">{a('topicBiz')}</option>
        </select>
      </label>
      <label className="field" style={{ flex: '1 1 160px' }}>{a('yourName')}
        <input value={f.name} maxLength={80} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" />
      </label>
    </div>
    <label className="field">{a('yourEmail')}
      <input type="email" value={f.email} maxLength={200} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
    </label>
    <label className="field">{a('message')}
      <textarea rows={5} value={f.message} maxLength={3000} onChange={(e) => setF({ ...f, message: e.target.value })} required />
    </label>
    {err && <p className="err" role="alert">{err}</p>}
    <div><button className="btn primary" type="submit" disabled={state === 'sending'}>{state === 'sending' ? <span className="spin" aria-hidden /> : null}{a('send')}</button></div>
  </form>
)}
    </>
  );
}

/** The contact form in a dialog: opened from the footer or the navbar, so the page itself stays short. */
export default function ContactModal() {
  const a = useAcctText();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener('pe-open-contact', on);
    return () => window.removeEventListener('pe-open-contact', on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={a('contactTitle')} className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="card stack modal-card">
        <div className="row between">
          <h3 style={{ font: '700 20px var(--display)', margin: 0 }}>{a('contactTitle')}</h3>
          <button type="button" className="btn ghost small" onClick={() => setOpen(false)} aria-label={a('close')}>×</button>
        </div>
        <p className="small muted" style={{ margin: 0 }}>{a('contactSub')}</p>
        <ContactForm onDone={() => setOpen(false)} />
      </div>
    </div>
  );
}

export const openContact = () => window.dispatchEvent(new Event('pe-open-contact'));
