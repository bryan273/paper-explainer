import { useState } from 'react';
import { accountApi, useAccount } from '@/lib/account';
import { usePrefs } from '@/lib/prefs';
import { pick } from '@/lib/i18n_extra';

const S = {"h": {"en": "Student? 3 months of Interactive mode and unlimited Deep questions, free.", "zh": "你是学生？互动模式和不限次数的深入提问，免费用 3 个月。", "vi": "Bạn là sinh viên? 3 tháng Chế độ tương tác và câu hỏi Sâu không giới hạn, miễn phí.", "id": "Mahasiswa? 3 bulan Mode interaktif dan pertanyaan Mendalam tanpa batas, gratis."}, "btn": {"en": "Claim my student months", "zh": "领取学生免费月", "vi": "Nhận 3 tháng cho sinh viên", "id": "Klaim bulan gratis mahasiswa"}, "need": {"en": "Sign up with your school email (.edu or .ac) to claim it.", "zh": "用学校邮箱（.edu 或 .ac）注册即可领取。", "vi": "Đăng ký bằng email trường (.edu hoặc .ac) để nhận.", "id": "Daftar dengan email kampus (.edu atau .ac) untuk mengklaim."}, "ok": {"en": "Done. Your student months are active.", "zh": "已开通，学生免费月已生效。", "vi": "Xong. Ba tháng sinh viên đã được kích hoạt.", "id": "Selesai. Bulan gratis mahasiswa sudah aktif."}} as const;

/** The student offer: free Interactive mode and Deep questions for 3 months, claimed once with a school e-mail. */
export default function StudentTrial() {
  const { lang } = usePrefs();
  const { user, me, refresh, openAuth } = useAccount();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const m = me as unknown as { student_eligible?: boolean; plan?: string | null } | null;
  if (m?.plan) return null;
  const claim = async () => {
    if (!user) { openAuth('register'); return; }
    setBusy(true); setMsg('');
    try { await accountApi('student_trial'); setMsg(pick(lang, S.ok)); refresh?.(); } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="student-trial">
      <div><b>🎓 {pick(lang, S.h)}</b>{(!user || m?.student_eligible === false) && !msg && <p className="small muted" style={{ margin: '2px 0 0' }}>{pick(lang, S.need)}</p>}{msg && <p className="small" role="status" style={{ margin: '2px 0 0' }}>{msg}</p>}</div>
      {(!user || m?.student_eligible) && !msg.startsWith(pick(lang, S.ok)) && <button type="button" className="btn primary small" disabled={busy} onClick={claim}>{pick(lang, S.btn)}</button>}
    </div>
  );
}
