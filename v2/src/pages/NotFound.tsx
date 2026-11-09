import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand';
import { usePrefs } from '@/lib/prefs';

const N = {
  h: { en: 'This page does not exist', zh: '页面不存在', vi: 'Trang này không tồn tại', id: 'Halaman ini tidak ada' },
  p: { en: 'The link may be old or mistyped.', zh: '链接可能已过期或输入有误。', vi: 'Liên kết có thể đã cũ hoặc gõ sai.', id: 'Tautan mungkin lama atau salah ketik.' },
  home: { en: 'Go to the home page', zh: '返回首页', vi: 'Về trang chủ', id: 'Ke beranda' },
  app: { en: 'Open dashboard', zh: '打开控制台', vi: 'Mở bảng điều khiển', id: 'Buka dasbor' },
};

export default function NotFound() {
  const { t } = usePrefs();
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <Logo className="justify-center" />
        <p className="mt-10 font-display text-6xl font-bold text-primary">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold">{t(N.h)}</h1>
        <p className="mt-2 text-muted-foreground">{t(N.p)}</p>
        <div className="mt-6 flex justify-center gap-2"><Button asChild><Link to="/">{t(N.home)}</Link></Button><Button asChild variant="outline"><Link to="/app">{t(N.app)}</Link></Button></div>
      </div>
    </div>
  );
}
