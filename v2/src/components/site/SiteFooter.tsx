import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand';
import { usePrefs } from '@/lib/prefs';
import { COMMON, NAV, PRODUCT } from '@/lib/strings';

const TAG = { en: 'Learn anything, your way. We make it easier.', zh: '用你的方式，学会任何东西。我们让它更简单。', vi: 'Học bất cứ điều gì, theo cách của bạn. Chúng tôi giúp việc đó dễ hơn.', id: 'Pelajari apa saja, dengan cara Anda. Kami membuatnya lebih mudah.' };
const COLS = {
  product: { en: 'Product', zh: '产品', vi: 'Sản phẩm', id: 'Produk' },
  resources: { en: 'Resources', zh: '资源', vi: 'Tài nguyên', id: 'Sumber' },
  company: { en: 'Company', zh: '公司', vi: 'Công ty', id: 'Perusahaan' },
  examples: { en: 'Examples', zh: '示例', vi: 'Ví dụ', id: 'Contoh' },
  students: { en: 'Students and teachers', zh: '学生与教师', vi: 'Sinh viên và giảng viên', id: 'Mahasiswa dan pengajar' },
  tutorials: { en: 'Tutorials' },
  where: { en: 'For learners in China, Vietnam, Indonesia and everywhere else. Available in 9 languages.' },
};

export function SiteFooter() {
  const { t } = usePrefs();
  const open = () => window.dispatchEvent(new CustomEvent('pl-support', { detail: 'contact' }));
  const cols = [
    { h: t(COLS.product), l: [[t(NAV.newVideo), '/app/new'], [t(PRODUCT.deep), '/app/v/6a21030a-b5f8-4c0e-977e-39090d7ebc70'], [t(PRODUCT.text), '/app/read'], [t(PRODUCT.repro), '/app/check'], [t(NAV.pricing), '/pricing']] },
    { h: t(COLS.resources), l: [[t(NAV.help), '/help'], [t(COLS.tutorials), '/help#tutorials'], [t(NAV.whatsNew), '/whats-new'], [t(COLS.examples), '/#examples'], [t(COLS.students), '/pricing#students']] },
    { h: t(COLS.company), l: [[t(COMMON.terms), '/terms'], [t(COMMON.privacy), '/privacy']] },
  ];
  return (
    <footer className="mt-24 border-t bg-muted/40">
      <div className="pl-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-[30ch] text-sm text-muted-foreground">{t(TAG)}</p>
        </div>
        {cols.map((c) => (
          <nav key={c.h} aria-label={c.h} className="grid content-start gap-2.5 text-sm">
            <p className="font-semibold text-foreground">{c.h}</p>
            {c.l.map(([n, h]) => <Link key={h} to={h} className="text-muted-foreground no-underline hover:text-foreground">{n}</Link>)}
            {c.h === t(COLS.company) && <button type="button" onClick={open} className="text-left text-muted-foreground hover:text-foreground">{t(COMMON.contact)}</button>}
          </nav>
        ))}
      </div>
      <div className="border-t">
        <div className="pl-container flex flex-col gap-1 py-6 text-[13px] text-muted-foreground sm:flex-row sm:justify-between"><p>© {new Date().getFullYear()} Paperlit. {t(COMMON.rights)}</p><p>{t(COLS.where)}</p></div>
      </div>
    </footer>
  );
}
