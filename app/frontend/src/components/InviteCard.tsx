import { useState } from 'react';
import { useAccount } from '@/lib/account';
import { usePrefs } from '@/lib/prefs';
import { pick } from '@/lib/i18n_extra';
import { copyText } from '@/lib/explainer';

type L4 = { en: string; zh: string; vi: string; id: string };
const S = {
  title: { en: 'Invite a friend, get 10 free videos', zh: '邀请好友，得 10 个免费视频', vi: 'Mời bạn bè, nhận ngay 10 video miễn phí', id: 'Undang teman, dapat 10 video gratis' } as L4,
  sub: { en: 'You get 10 videos the moment a friend signs up with your link. Up to {m} friends.', zh: '好友通过你的链接注册，你立刻得到 10 个视频。最多 {m} 位好友。', vi: 'Bạn nhận 10 video ngay khi bạn bè đăng ký bằng liên kết của bạn. Tối đa {m} người.', id: 'Anda dapat 10 video begitu teman mendaftar lewat tautan Anda. Hingga {m} teman.' } as L4,
  copy: { en: 'Copy my link', zh: '复制我的链接', vi: 'Sao chép liên kết', id: 'Salin tautan saya' } as L4,
  done: { en: 'Copied', zh: '已复制', vi: 'Đã sao chép', id: 'Disalin' } as L4,
  joined: { en: '{n} of {m} friends joined', zh: '已有 {n} / {m} 位好友加入', vi: '{n}/{m} bạn đã tham gia', id: '{n} dari {m} teman bergabung' } as L4,
};

/** Share a personal link: each friend who signs up through it earns the member 10 videos. */
export default function InviteCard() {
  const { lang } = usePrefs();
  const { me } = useAccount();
  const [ok, setOk] = useState(false);
  const r = (me as unknown as { referral?: { code: string; invited: number; max: number } | null } | null)?.referral;
  if (!r) return null;
  const link = `${window.location.origin}${window.location.pathname}?ref=${r.code}`;
  return (
    <div className="invite-card">
      <span className="verify-ico" aria-hidden>🎁</span>
      <div className="verify-txt">
        <b>{pick(lang, S.title)}</b>
        <span>{pick(lang, S.sub).replace('{m}', String(r.max))} · {pick(lang, S.joined).replace('{n}', String(r.invited)).replace('{m}', String(r.max))}</span>
      </div>
      <button type="button" className="btn primary small" onClick={async () => { if (await copyText(link)) { setOk(true); window.setTimeout(() => setOk(false), 2200); } }}>{ok ? `✓ ${pick(lang, S.done)}` : pick(lang, S.copy)}</button>
    </div>
  );
}
