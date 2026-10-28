import { useState } from 'react';
import { saveFeedback } from '@/lib/data';
import { usePrefs } from '@/lib/prefs';

/** "Was this useful?" thumbs plus an optional comment, saved as one feedback row (kind "video"). */
export default function VideoFeedback({ arxiv }: { arxiv: string }) {
  const { t } = usePrefs();
  const [rating, setRating] = useState<number | null>(null);
  const [rowId, setRowId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (nextRating: number, nextComment: string) => {
    setSending(true);
    setError(null);
    try {
      const data = { rating: nextRating, use_case: '', comment: nextComment, email: '', arxiv, kind: 'video' };
      const res = await saveFeedback(data, rowId);
      if (res.id) setRowId(res.id);
      setSaved(true);
      return true;
    } catch {
      setError(t('saveError'));
      return false;
    } finally {
      setSending(false);
    }
  };

  const choose = async (value: number) => {
    const prev = rating;
    setRating(value);
    if (!(await save(value, comment.trim()))) setRating(prev);
  };

  const sendComment = async () => {
    if (rating === null) {
      setError(t('pickThumb'));
      return;
    }
    await save(rating, comment.trim());
  };

  return (
    <div className="stack" style={{ marginTop: 22 }}>
      <div className="row between" style={{ gap: 12 }}>
        <strong style={{ fontSize: 14 }}>{t('usefulQ')}</strong>
        <div className="row" style={{ gap: 8 }}>
          {[
            { value: 5, label: `👍 ${t('usefulYes')}` },
            { value: 1, label: `👎 ${t('usefulNo')}` },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`btn small ${rating === opt.value ? 'primary' : 'ghost'}`}
              aria-pressed={rating === opt.value}
              disabled={sending}
              onClick={() => choose(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {saved && (
        <p className="small" style={{ margin: 0, color: 'var(--ok)' }}>
          {t('usefulThanks')}
        </p>
      )}
      <label className="field">
        <span className="hint">{t('commentOptional')}</span>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
      </label>
      <div>
        <button type="button" className="btn ghost small" onClick={sendComment} disabled={sending || !comment.trim()}>
          {sending ? t('sending') : t('send')}
        </button>
      </div>
      {error && <p className="err">{error}</p>}
    </div>
  );
}
