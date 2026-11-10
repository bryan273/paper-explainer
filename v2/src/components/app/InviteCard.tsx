import { useState } from 'react';
import { Check, Copy, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccount } from '@/lib/account';
import { copyText } from '@/lib/explainer';
import { fill, usePrefs } from '@/lib/prefs';
import { cn } from '@/lib/utils';

const I = {
  h: { en: 'Invite a friend, get 2 videos', zh: '邀请好友，得 2 个视频', vi: 'Mời bạn bè, nhận 2 video', id: 'Undang teman, dapat 2 video' },
  p: { en: 'You get 2 videos as soon as a friend signs up with your link. Up to {m} friends.', zh: '好友用你的链接注册后，你立即获得 2 个视频。最多 {m} 位好友。', vi: 'Bạn nhận 2 video ngay khi bạn bè đăng ký bằng liên kết của bạn. Tối đa {m} người.', id: 'Anda dapat 2 video begitu teman mendaftar lewat tautan Anda. Hingga {m} teman.' },
  count: { en: '{n} of {m} friends joined', zh: '已邀请 {n} / {m} 位', vi: 'Đã mời {n}/{m} người', id: '{n} dari {m} teman bergabung' },
  copy: { en: 'Copy invite link', zh: '复制邀请链接', vi: 'Sao chép liên kết mời', id: 'Salin tautan undangan' },
  copied: { en: 'Copied', zh: '已复制', vi: 'Đã sao chép', id: 'Tersalin' },
};

export function InviteCard({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { me } = useAccount();
  const { t } = usePrefs();
  const [done, setDone] = useState(false);
  const r = me?.referral;
  if (!r) return null;
  const link = `${window.location.origin}${import.meta.env.BASE_URL}?ref=${r.code}`;
  const copy = async () => { if (await copyText(link)) { setDone(true); window.setTimeout(() => setDone(false), 2200); } };
  return (
    <div className={cn('pl-card flex gap-3 p-5', className)}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lit/20 text-[#b07800]"><Gift className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{t(I.h)}</p>
        {!compact && <p className="mt-0.5 text-sm text-muted-foreground">{fill(t(I.p), { m: r.max })}</p>}
        <p className="mt-0.5 text-xs text-muted-foreground">{fill(t(I.count), { n: r.invited, m: r.max })}</p>
        {!compact && <p className="mt-3 truncate rounded-lg bg-muted px-3 py-2 font-mono text-xs">{link}</p>}
        <Button size="sm" variant="outline" className="mt-3" onClick={copy}>{done ? <Check className="mr-1.5 h-4 w-4 text-success" /> : <Copy className="mr-1.5 h-4 w-4" />}{done ? t(I.copied) : t(I.copy)}</Button>
      </div>
    </div>
  );
}
