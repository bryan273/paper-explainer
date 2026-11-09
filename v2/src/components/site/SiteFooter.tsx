import { Link } from 'react-router-dom';
import { Logo } from '@/components/brand';
import { usePrefs } from '@/lib/prefs';
import { COMMON, NAV, PRODUCT } from '@/lib/strings';

const TAG = { en: 'From information to understanding.', zh: '从信息，到理解。', vi: 'Từ thông tin đến hiểu biết.', id: 'Dari informasi menjadi pemahaman.' };
const COLS = {
  product: { en: 'Product', zh: '产品', vi: 'Sản phẩm', id: 'Produk' },
  resources: { en: 'Resources', zh: '资源', vi: 'Tài nguyên', id: 'Sumber' },
  company: { en: 'Company', zh: '公司', vi: 'Công ty', id: 'Perusahaan' },
  examples: { en: 'Examples', zh: '示例', vi: 'Ví dụ', id: 'Contoh' },
  students: { en: 'Students and teachers', zh: '学生与教师', vi: 'Sinh viên và giảng viên', id: 'Mahasiswa dan pengajar' },
};

export function SiteFooter() {
  const { t } = usePrefs();
  const open = () => window.dispatchEvent(new CustomEvent('pl-support', { detail: 'contact' }));
  const cols = [
    { h: t(COLS.product), l: [[t(PRODUCT.video), '/app/new'], [t(PRODUCT.text), '/app/read'], [t(PRODUCT.repro), '/app/check'], [t(NAV.pricing), '/pricing']] },
    { h: t(COLS.resources), l: [[t(NAV.help), '/help'], [t(COLS.examples), '/#examples'], [t(COLS.students), '/pricing#students']] },
    { h: t(COLS.company), l: [[t(COMMON.terms), '/terms'], [t(COMMON.privacy), '/privacy']] },
  ];
  return (
    <footer className="mt-24 border-t bg-muted/40">
      <div className="pl-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-[28ch] text-sm text-muted-foreground">{t(TAG)}</p>
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
        <p className="pl-container py-6 text-[13px] text-muted-foreground">© {new Date().getFullYear()} Paperlit. {t(COMMON.rights)}</p>
      </div>
    </footer>
  );
}
