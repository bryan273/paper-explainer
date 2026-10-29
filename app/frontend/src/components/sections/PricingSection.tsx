import { useState, type FormEvent } from 'react';
import { markOrderPaid, saveOrder } from '@/lib/data';
import { parseArxivId } from '@/lib/explainer';

const PRICE = '¥10';
/** An arXiv id/link, or any http(s) link or DOI to a paper. */
const isPaperRef = (v: string) => !!parseArxivId(v) || /^https?:\/\/\S+\.\S+/i.test(v.trim()) || /^10\.\d{4,9}\/\S+$/.test(v.trim());
import { usePrefs } from '@/lib/prefs';
import { Link } from 'react-router-dom';
import { useAccount, useAcctText } from '@/lib/account';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type OrderLang = 'en' | 'zh' | 'both';

function OrderForm({ onClose }: { onClose: () => void }) {
  const { t } = usePrefs();
  const [email, setEmail] = useState('');
  const [arxiv, setArxiv] = useState('');
  const [language, setLanguage] = useState<OrderLang>('en');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ email?: boolean; arxiv?: boolean }>({});
  const [sending, setSending] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [method, setMethod] = useState<'wechat' | 'alipay' | null>(null);
  const [paid, setPaid] = useState(false);
  const [payError, setPayError] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = { email: !EMAIL_RE.test(email.trim()), arxiv: !isPaperRef(arxiv) };
    setErrors(next);
    if (next.email || next.arxiv) return;
    setSending(true);
    setFailed(false);
    try {
      const res = await saveOrder({ email: email.trim(), arxiv: arxiv.trim(), language, notes: notes.trim() });
      setOrderId(res.id ?? null);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  const confirmPaid = async () => {
    if (!orderId || !method) return;
    setSending(true);
    setPayError(false);
    try {
      await markOrderPaid(orderId, method);
      setPaid(true);
    } catch {
      setPayError(true);
    } finally {
      setSending(false);
    }
  };

  if (orderId) {
    const methods = [
      { id: 'wechat' as const, src: import.meta.env.BASE_URL + 'pay/wechat.webp', label: t('payWechat') },
      { id: 'alipay' as const, src: import.meta.env.BASE_URL + 'pay/alipay.webp', label: t('payAlipay') },
    ];
    if (paid) {
      return (
        <div className="stack fade" role="status">
          <div className="done-box">{t('payDone')}</div>
          <p className="small muted" style={{ margin: 0 }}>{t('payOrderNo')}: <span className="mono">{orderId.slice(0, 8)}</span></p>
          <div>
            <button type="button" className="btn ghost small" onClick={onClose}>{t('close')}</button>
          </div>
        </div>
      );
    }
    return (
      <div className="stack fade" role="status">
        <div className="done-box">{t('orderThanks')}</div>
        {!method ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <b style={{ font: '700 16px var(--display)' }}>{t('payChoose')}</b>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {methods.map((m) => (
                <button key={m.id} type="button" className="btn ghost" onClick={() => setMethod(m.id)}>{m.label}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="pay" style={{ display: 'grid', gap: 12 }}>
            {(() => {
              const m = methods.find((x) => x.id === method)!;
              return (
                <>
                  <b style={{ font: '700 16px var(--display)' }}>{t('payScan').replace('{m}', m.label).replace('{p}', PRICE)}</b>
                  <figure style={{ margin: 0, width: 220 }}>
                    <img src={m.src} alt={m.label} width={220} style={{ width: 220, height: 'auto', borderRadius: 14, border: '1px solid var(--line)', display: 'block' }} />
                  </figure>
                  <p className="small muted" style={{ margin: 0 }}>{t('payNote')}</p>
                  <p className="small muted" style={{ margin: 0 }}>{t('payOrderNo')}: <span className="mono">{orderId.slice(0, 8)}</span></p>
                  {payError && <p className="err">{t('payFail')}</p>}
                  <div className="row">
                    <button type="button" className="btn primary" disabled={sending} onClick={confirmPaid}>
                      {sending ? <span className="spin" aria-hidden /> : null}
                      {t('payIPaid')}
                    </button>
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

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <h3 style={{ font: '700 18px var(--display)' }}>{t('orderTitle')}</h3>
      <p className="small muted" style={{ margin: 0 }}>
        {t('orderSub')}
      </p>
      <label className="field">
        {t('email')}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={errors.email}
          autoComplete="email"
        />
      </label>
      {errors.email && <p className="err">{t('errEmail')}</p>}
      <label className="field">
        {t('arxivLink')}
        <input
          type="text"
          value={arxiv}
          onChange={(e) => setArxiv(e.target.value)}
          aria-invalid={errors.arxiv}
          placeholder="https://arxiv.org/abs/1706.03762"
          spellCheck={false}
        />
      </label>
      {errors.arxiv && <p className="err">{t('errArxiv')}</p>}
      <label className="field">
        {t('language2')}
        <select value={language} onChange={(e) => setLanguage(e.target.value as OrderLang)}>
          <option value="en">{t('langEnglish')}</option>
          <option value="zh">{t('langChinese')}</option>
          <option value="both">{t('langBoth')}</option>
        </select>
      </label>
      <label className="field">
        <span>
          {t('notes')} <span className="hint">({t('optional')})</span>
        </span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('notesPh')} rows={3} />
      </label>
      {failed && <p className="err">{t('saveError')}</p>}
      <div className="row">
        <button type="submit" className="btn primary" disabled={sending}>
          {sending ? <span className="spin" aria-hidden /> : null}
          {t('sendOrder')}
        </button>
        <button type="button" className="btn ghost" onClick={onClose}>
          {t('close')}
        </button>
      </div>
    </form>
  );
}

export default function PricingSection() {
  const { t } = usePrefs();
  const ac = useAcctText();
  const { me, user, openAuth } = useAccount();
  const [ordering, setOrdering] = useState(false);
  const studio = [t('studio1'), t('studio2'), t('studio3'), t('studio4'), t('studio5')];
  const lim = me?.limits ?? { guest: 2, member: 8, welcome: 3 };
  const list = (items: string[]) => (
    <ul className="tick">
      {items.map((item) => (<li key={item}>{item}</li>))}
    </ul>
  );

  return (
    <section className="section" id="pricing" aria-labelledby="pricing-title">
      <h2 className="sec" id="pricing-title">{t('pricingTitle')}</h2>
      <p className="sec-sub">{ac('plansTitle')}</p>

      <div className="pricing" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="card price-card">
          <b style={{ font: '700 17px var(--display)' }}>{ac('guestPlan')}</b>
          <div className="price">¥0</div>
          {list([ac('guestL1', { g: lim.guest }), ac('guestL2'), ac('guestL3')])}
        </div>
        <div className="card price-card featured">
          <div className="row between">
            <b style={{ font: '700 17px var(--display)' }}>{ac('memberPlan')}</b>
            <span className="badge-launch">{ac('signUp')}</span>
          </div>
          <div className="price">¥0</div>
          {list([ac('memberL1', { m: lim.member }), ac('memberL2', { w: lim.welcome }), ac('memberL3'), ac('memberL4')])}
          {!user && <button type="button" className="btn primary" onClick={() => openAuth('register')}>{ac('signUp')}</button>}
        </div>
        <div className="card price-card">
          <b style={{ font: '700 17px var(--display)' }}>{ac('packsPlan')}</b>
          <div className="price">¥9 <small>/ 10</small></div>
          {list([ac('packsL1'), ac('packsL2'), ac('packsL3'), ac('packsL4')])}
          {user ? (
            <Link className="btn primary" to="/account#buy">{ac('buyCredits')}</Link>
          ) : (
            <button type="button" className="btn ghost" onClick={() => openAuth('register')}>{ac('needLogin')}</button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="row between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div>
            <b style={{ font: '700 17px var(--display)' }}>{t('planStudio')}</b> <span className="badge-launch">{t('launchPrice')}</span>
            <div className="small muted" style={{ marginTop: 4 }}>{studio.join(' · ')}</div>
          </div>
          {!ordering && (
            <button type="button" className="btn ghost" onClick={() => setOrdering(true)}>{PRICE} · {t('orderBtn')}</button>
          )}
        </div>
        {ordering && (
          <div style={{ marginTop: 16 }}>
            <OrderForm onClose={() => setOrdering(false)} />
          </div>
        )}
      </div>
    </section>
  );
}
