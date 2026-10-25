import { useEffect, useState, type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { client } from '@/lib/api';
import { usePrefs } from '@/lib/prefs';
import { formatRequestNo, type FullVideoRequest } from '@/lib/demos';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ARXIV_RE = /^(\d{4}\.\d{4,5}(v\d+)?|[a-z-]+(\.[A-Z]{2})?\/\d{7}(v\d+)?)$/i;

function RequestForm({ defaultArxiv }: { defaultArxiv: string }) {
  const { t, lang } = usePrefs();
  const [email, setEmail] = useState('');
  const [arxiv, setArxiv] = useState(defaultArxiv);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ email?: boolean; arxiv?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [requestId, setRequestId] = useState<number | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = { email: !EMAIL_RE.test(email.trim()), arxiv: !ARXIV_RE.test(arxiv.trim()) };
    setErrors(next);
    if (next.email || next.arxiv) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      const res = await client.entities.full_video_requests.create({
        data: {
          email: email.trim(),
          arxiv_id: arxiv.trim(),
          note: note.trim(),
          ui_lang: lang,
          source_arxiv: defaultArxiv,
        },
      });
      setRequestId((res.data as FullVideoRequest).id);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (requestId !== null) {
    return (
      <div role="status" className="animate-in fade-in duration-300">
        <h3 className="font-display text-xl font-semibold">{t('successTitle')}</h3>
        <p className="mt-3 text-[13px] text-muted-foreground">{t('requestNo')}</p>
        <p className="font-display text-3xl font-semibold tracking-wide text-primary">{formatRequestNo(requestId)}</p>
        <p className="mt-3 text-sm text-muted-foreground">{t('successLine')}</p>
        <button
          type="button"
          onClick={() => {
            setRequestId(null);
            setNote('');
          }}
          className="mt-5 min-h-[40px] text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t('another')}
        </button>
      </div>
    );
  }

  const inputCls =
    'w-full min-h-[44px] rounded-lg border bg-background px-3 text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label htmlFor="req-email" className="mb-1.5 block text-sm font-semibold">
          {t('email')}
        </label>
        <input
          id="req-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={errors.email}
          aria-describedby={errors.email ? 'req-email-err' : undefined}
          className={`${inputCls} ${errors.email ? 'border-destructive' : 'border-border'}`}
        />
        {errors.email && (
          <p id="req-email-err" className="mt-1 text-[13px] text-destructive">
            {t('errEmail')}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="req-arxiv" className="mb-1.5 block text-sm font-semibold">
          {t('arxiv')}
        </label>
        <input
          id="req-arxiv"
          value={arxiv}
          onChange={(e) => setArxiv(e.target.value)}
          aria-invalid={errors.arxiv}
          aria-describedby={errors.arxiv ? 'req-arxiv-err' : undefined}
          className={`${inputCls} ${errors.arxiv ? 'border-destructive' : 'border-border'}`}
        />
        {errors.arxiv && (
          <p id="req-arxiv-err" className="mt-1 text-[13px] text-destructive">
            {t('errArxiv')}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="req-note" className="mb-1.5 block text-sm font-semibold">
          {t('note')}
        </label>
        <textarea
          id="req-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('notePlaceholder')}
          className={`${inputCls} border-border py-2`}
        />
      </div>
      {submitError && <p className="text-[13px] text-destructive">{t('errSubmit')}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {submitting ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}

/** "Want the full video?" panel; unlocks when the preview ends (or on request) and stays open afterwards. */
export default function RequestPanel({ arxiv, ended }: { arxiv: string; ended: boolean }) {
  const { t } = usePrefs();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ended) setOpen(true);
  }, [ended]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
          <Lock className="h-4 w-4" />
        </span>
        <h2 className="font-display text-xl font-semibold">{t('lockedTitle')}</h2>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t('lockedLine')}</p>
      <div className="mt-5">
        {open ? (
          <div className="animate-in fade-in duration-300">
            <RequestForm key={arxiv} defaultArxiv={arxiv} />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4">
            <p className="text-sm text-muted-foreground">{t('lockedWaiting')}</p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-3 min-h-[40px] text-sm font-semibold text-primary hover:underline underline-offset-4"
            >
              {t('unlockNow')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
