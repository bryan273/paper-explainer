import { useState } from 'react';
import { saveFeedback } from '@/lib/data';
import { useFeedbackCount } from '@/lib/feedback';
import { usePrefs, type StringKey } from '@/lib/prefs';

const USE_CASES: { key: StringKey; value: string }[] = [
  { key: 'useStudying', value: 'studying' },
  { key: 'useTeaching', value: 'teaching' },
  { key: 'useOwnPaper', value: 'own_paper' },
  { key: 'useSocial', value: 'social' },
  { key: 'useOther', value: 'other' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FeedbackSection() {
  const { t } = usePrefs();
  const { count, reload } = useFeedbackCount();
  const [rating, setRating] = useState<number | null>(null);
  const [useCase, setUseCase] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (rating === null) {
      setError(t('fbNeedRating'));
      return;
    }
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      setError(t('errEmail'));
      return;
    }
    setSending(true);
    setError(null);
    try {
      await saveFeedback({
        rating,
        use_case: useCase ?? '',
        comment: comment.trim(),
        email: email.trim(),
        arxiv: '',
        kind: 'general',
      });
      setSent(true);
      reload();
    } catch {
      setError(t('saveError'));
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setSent(false);
    setRating(null);
    setUseCase(null);
    setComment('');
    setEmail('');
    setError(null);
  };

  return (
    <section className="section" id="feedback" aria-labelledby="fb-title">
      <h2 className="sec" id="fb-title">
        {t('fbTitle')}
      </h2>
      <p className="sec-sub">{t('fbSub')}</p>
      {count !== null && (
        <p className="small muted" style={{ marginTop: 10 }}>
          {t('fbCount', { n: count })}
        </p>
      )}

      <div className="card" style={{ marginTop: 22 }}>
        {sent ? (
          <div className="stack fade" role="status" style={{ marginTop: 0 }}>
            <div className="done-box">
              {t('fbThanks')}
              <span style={{ fontWeight: 400 }}>{t('fbThanksSub')}</span>
            </div>
            <div>
              <button type="button" className="btn ghost small" onClick={reset}>
                {t('fbAnother')}
              </button>
            </div>
          </div>
        ) : (
          <div className="stack" style={{ marginTop: 0 }}>
            <div>
              <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 14 }}>{t('fbRating')}</p>
              <div className="stars" role="group" aria-label={t('fbRating')}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={rating !== null && n <= rating ? 'on' : undefined}
                    aria-pressed={rating === n}
                    aria-label={t('fbStar', { n })}
                    onClick={() => {
                      setRating(n);
                      setError(null);
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 14 }}>{t('fbUse')}</p>
              <div className="chips" role="group" aria-label={t('fbUse')}>
                {USE_CASES.map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    className={useCase === u.value ? 'on' : undefined}
                    aria-pressed={useCase === u.value}
                    onClick={() => setUseCase(useCase === u.value ? null : u.value)}
                  >
                    {t(u.key)}
                  </button>
                ))}
              </div>
            </div>

            <label className="field">
              {t('fbComment')}
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
            </label>
            <label className="field">
              {t('fbEmail')}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>

            {error && <p className="err">{error}</p>}
            <div>
              <button type="button" className="btn primary" onClick={send} disabled={sending}>
                {sending ? <span className="spin" aria-hidden /> : null}
                {t('fbSend')}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
