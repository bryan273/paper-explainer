import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { client } from '@/lib/api';
import { usePrefs } from '@/lib/prefs';
import { parseArxivId } from '@/lib/makePreview';

export interface MadePreview {
  id: number;
  arxiv_id: string;
  title: string;
  scene_count: number;
  created_at?: string;
}

function useLatestPreviews() {
  const [items, setItems] = useState<MadePreview[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    client.entities.made_previews
      .query({ sort: '-created_at', limit: 6 })
      .then((res) => alive && setItems((res.data?.items ?? []) as MadePreview[]))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  return { items, error };
}

export default function OwnPaperSection() {
  const { t, lang } = usePrefs();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);
  const { items, error } = useLatestPreviews();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const id = parseArxivId(value);
    if (!id) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    navigate(`/make?id=${encodeURIComponent(id)}`);
  };

  const dateFmt = new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' });

  return (
    <section id="own" className="scroll-mt-20 border-t border-border">
      <div className="mx-auto grid max-w-[1120px] gap-10 px-5 py-14 md:px-8 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-6">
          <h2 className="font-display text-[28px] font-semibold leading-tight">{t('ownTitle')}</h2>
          <p className="mt-2 text-muted-foreground">{t('ownLine')}</p>
          <form onSubmit={submit} noValidate className="mt-6">
            <label htmlFor="own-id" className="mb-1.5 block text-sm font-semibold">
              {t('ownLabel')}
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="own-id"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="2210.03629 / https://arxiv.org/abs/2210.03629"
                aria-invalid={invalid}
                aria-describedby={invalid ? 'own-id-err' : undefined}
                className={`min-h-[44px] w-full min-w-0 flex-1 rounded-lg border bg-card px-3 text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  invalid ? 'border-destructive' : 'border-border'
                }`}
              />
              <button
                type="submit"
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Sparkles className="h-4 w-4" />
                {t('ownButton')}
              </button>
            </div>
            {invalid && (
              <p id="own-id-err" className="mt-1.5 text-[13px] text-destructive">
                {t('ownInvalid')}
              </p>
            )}
            <p className="mt-3 text-[13px] text-muted-foreground">{t('ownHint')}</p>
          </form>
        </div>

        <div className="min-w-0 lg:col-span-6">
          <h3 className="font-display text-xl font-semibold">{t('latestTitle')}</h3>
          {error && <p className="mt-4 text-sm text-destructive">{t('latestError')}</p>}
          {!items && !error && <p className="mt-4 text-sm text-muted-foreground">{t('loading')}</p>}
          {items && items.length === 0 && <p className="mt-4 text-sm text-muted-foreground">{t('latestEmpty')}</p>}
          {items && items.length > 0 && (
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
              {items.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/make?id=${encodeURIComponent(p.arxiv_id)}`}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.title}</p>
                      <p className="text-[13px] text-muted-foreground">
                        arXiv:{p.arxiv_id} · {p.scene_count} {t('scenesUnit')}
                        {p.created_at ? ` · ${dateFmt.format(new Date(p.created_at))}` : ''}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
