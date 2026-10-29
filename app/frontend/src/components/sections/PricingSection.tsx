import { Link } from 'react-router-dom';
import { useAccount, useAcctText } from '@/lib/account';
import { usePrefs } from '@/lib/prefs';

export default function PricingSection() {
  const { t } = usePrefs();
  const ac = useAcctText();
  const { me, user, openAuth } = useAccount();
  const lim = me?.limits ?? { guest: 1, member: 3, welcome: 3 };
  const packs = Object.values(me?.packs ?? { 10: { credits: 10, price: 10 } });
  const from = packs.length ? packs.reduce((a, b) => (a.credits <= b.credits ? a : b)) : null;
  const list = (items: string[]) => (
    <ul className="tick">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );

  return (
    <section className="section" id="pricing" aria-labelledby="pricing-title">
      <h2 className="sec" id="pricing-title">
        {t('pricingTitle')}
      </h2>
      <p className="sec-sub">{ac('plansTitle')}</p>

      <div className="pricing">
        <div className="card price-card featured">
          <div className="row between">
            <b style={{ font: '700 17px var(--display)' }}>{ac('memberPlan')}</b>
            <span className="badge-launch">{ac('freeBadge')}</span>
          </div>
          <div className="price">
            ¥0 <small>{ac('perDay', { n: lim.member })}</small>
          </div>
          {list([ac('memberL1', { m: lim.member }), ac('memberL2', { w: lim.welcome }), ac('memberL3'), ac('guestL3')])}
          {user ? (
            <Link className="btn ghost" to="/account">
              {ac('myVideos')}
            </Link>
          ) : (
            <button type="button" className="btn primary" onClick={() => openAuth('register')}>
              {ac('signUp')}
            </button>
          )}
        </div>

        <div className="card price-card">
          <b style={{ font: '700 17px var(--display)' }}>{ac('packsPlan')}</b>
          <div className="price">
            {from ? `¥${from.price}` : '¥10'} <small>{from ? ac('forVideos', { n: from.credits }) : ''}</small>
          </div>
          {list([ac('packsL1'), ac('packsL2'), ac('packsL3'), ac('packsL4')])}
          {user ? (
            <Link className="btn primary" to="/account#buy">
              {ac('buyCredits')}
            </Link>
          ) : (
            <button type="button" className="btn ghost" onClick={() => openAuth('register')}>
              {ac('needLogin')}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
