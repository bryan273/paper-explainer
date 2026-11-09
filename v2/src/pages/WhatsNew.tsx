import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RELEASES } from '@/lib/changelog';
import { usePrefs, pick } from '@/lib/prefs';
import { dateFmt } from '@/lib/strings';

const T = {
  h: { en: 'What is new' },
  s: { en: 'Every change that makes a difference to you, newest first.' },
  cta: { en: 'Make a video' },
};

export default function WhatsNew() {
  const { lang, t } = usePrefs();
  return (
    <main className="pl-container max-w-3xl pt-14">
      <h1 className="pl-h2 sm:text-[2.6rem]">{t(T.h)}</h1>
      <p className="pl-lede mt-3">{t(T.s)}</p>
      <ol className="mt-12 grid gap-12 border-l pl-6 sm:pl-8">
        {RELEASES.map((r) => (
          <li key={r.date} className="relative">
            <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary sm:-left-[39px]" aria-hidden />
            <p className="text-sm font-medium text-muted-foreground"><time dateTime={r.date}>{dateFmt(r.date, lang, { day: 'numeric', month: 'long', year: 'numeric' })}</time></p>
            <h2 className="mt-1 font-display text-xl font-semibold">{t(r.title)}</h2>
            <ul className="mt-3 grid gap-2 text-[15px] leading-relaxed text-muted-foreground">
              {pick(lang, r.items).map((x) => <li key={x} className="flex gap-2.5"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lit" aria-hidden />{x}</li>)}
            </ul>
          </li>
        ))}
      </ol>
      <Button asChild className="mt-12"><Link to="/app/new">{t(T.cta)}</Link></Button>
    </main>
  );
}
