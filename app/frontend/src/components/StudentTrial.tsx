import { useRef, useState } from 'react';
import { accountApi, useAccount } from '@/lib/account';
import { uploadProof } from '@/lib/proof';
import { usePrefs } from '@/lib/prefs';
import { pick } from '@/lib/i18n_extra';

type L4 = { en: string; zh: string; vi: string; id: string };
const S = {
  title: { en: 'Student or teacher? 1 month of Plus, free.', zh: '学生或教师？免费用 1 个月 Plus。', vi: 'Sinh viên hay giảng viên? Tặng 1 tháng Plus.', id: 'Mahasiswa atau pengajar? Gratis 1 bulan Plus.' } as L4,
  sub: { en: 'Send a quick proof. We check it within a day.', zh: '发一张证明，我们一天内审核。', vi: 'Gửi một giấy tờ chứng minh. Chúng tôi duyệt trong 1 ngày.', id: 'Kirim bukti singkat. Kami cek dalam sehari.' } as L4,
  cta: { en: 'Get my month', zh: '领取', vi: 'Nhận ngay', id: 'Klaim' } as L4,
  student: { en: 'Student', zh: '学生', vi: 'Sinh viên', id: 'Mahasiswa' } as L4,
  teacher: { en: 'Teacher', zh: '教师', vi: 'Giảng viên', id: 'Pengajar' } as L4,
  school: { en: 'School or university', zh: '学校', vi: 'Trường', id: 'Sekolah atau kampus' } as L4,
  file: { en: 'Photo or PDF of your student card, staff card or a school letter', zh: '学生证、工作证或学校证明的照片或 PDF', vi: 'Ảnh hoặc PDF thẻ sinh viên, thẻ giảng viên hoặc giấy xác nhận của trường', id: 'Foto atau PDF kartu mahasiswa, kartu pengajar, atau surat dari sekolah' } as L4,
  pick: { en: 'Choose a file', zh: '选择文件', vi: 'Chọn tệp', id: 'Pilih berkas' } as L4,
  send: { en: 'Send for checking', zh: '提交审核', vi: 'Gửi để duyệt', id: 'Kirim untuk dicek' } as L4,
  privacy: { en: 'Only our team sees it.', zh: '仅我们的团队可见。', vi: 'Chỉ đội ngũ chúng tôi xem.', id: 'Hanya tim kami yang melihat.' } as L4,
  cancel: { en: 'Cancel', zh: '取消', vi: 'Hủy', id: 'Batal' } as L4,
  pending: { en: 'Proof received. We are checking it, usually within a day.', zh: '已收到证明，通常一天内审核完。', vi: 'Đã nhận giấy tờ. Chúng tôi đang duyệt, thường trong 1 ngày.', id: 'Bukti diterima. Sedang kami cek, biasanya dalam sehari.' } as L4,
  rejected: { en: 'We could not verify that proof. Send a clearer one.', zh: '这份证明无法通过，请发一份更清晰的。', vi: 'Chưa xác minh được giấy tờ này. Hãy gửi bản rõ hơn.', id: 'Bukti itu belum bisa diverifikasi. Kirim yang lebih jelas.' } as L4,
  again: { en: 'Send again', zh: '重新提交', vi: 'Gửi lại', id: 'Kirim lagi' } as L4,
  login: { en: 'Sign up free first', zh: '请先免费注册', vi: 'Đăng ký miễn phí trước', id: 'Daftar gratis dulu' } as L4,
  bad: { en: 'Choose a photo or a PDF under 6 MB.', zh: '请选择小于 6 MB 的照片或 PDF。', vi: 'Chọn ảnh hoặc PDF dưới 6 MB.', id: 'Pilih foto atau PDF di bawah 6 MB.' } as L4,
};

/** The student and teacher offer: one free month of Plus, after a person on our side has looked at a proof. */
export default function StudentTrial() {
  const { lang } = usePrefs();
  const { user, me, refresh, openAuth } = useAccount();
  const m = me as unknown as { verify?: { role: string; status: string } | null; plan?: string | null } | null;
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [school, setSchool] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pick_ = useRef<HTMLInputElement>(null);
  const v = m?.verify;
  if (m?.plan) return null;

  const send = async () => {
    if (!file) { setErr(pick(lang, S.bad)); return; }
    setBusy(true); setErr('');
    try {
      const path = await uploadProof(file, 'verify');
      await accountApi('proof_submit', { role, path, school: school.trim() });
      setOpen(false); setFile(null);
      await refresh?.();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className={`verify-card${v?.status === 'pending' ? ' wait' : ''}`}>
      <span className="verify-ico" aria-hidden>🎓</span>
      <div className="verify-txt">
        <b>{pick(lang, S.title)}</b>
        <span>{v?.status === 'pending' ? pick(lang, S.pending) : v?.status === 'rejected' ? pick(lang, S.rejected) : pick(lang, S.sub)}</span>
      </div>
      {v?.status !== 'pending' && (
        <button type="button" className="btn primary small" onClick={() => { if (!user) openAuth('register'); else setOpen(true); }}>
          {!user ? pick(lang, S.login) : v?.status === 'rejected' ? pick(lang, S.again) : pick(lang, S.cta)}
        </button>
      )}
      {open && (
        <div className="verify-modal" role="dialog" aria-modal="true" aria-label={pick(lang, S.title)} onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="verify-box">
            <b className="verify-h">{pick(lang, S.title)}</b>
            <div className="verify-seg" role="radiogroup">
              {(['student', 'teacher'] as const).map((r) => (
                <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)}>{pick(lang, S[r])}</button>
              ))}
            </div>
            <label className="verify-f">{pick(lang, S.school)}<input type="text" value={school} maxLength={120} onChange={(e) => setSchool(e.target.value)} /></label>
            <div className="verify-f">
              <span>{pick(lang, S.file)}</span>
              <input ref={pick_} type="file" accept="image/*,application/pdf" hidden onChange={(e) => { setFile(e.target.files?.[0] ?? null); setErr(''); }} />
              <button type="button" className="verify-drop" onClick={() => pick_.current?.click()}>{file ? `✓ ${file.name}` : pick(lang, S.pick)}</button>
              <small>{pick(lang, S.privacy)}</small>
            </div>
            {err && <p className="err" role="alert">{err}</p>}
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn ghost small" onClick={() => setOpen(false)}>{pick(lang, S.cancel)}</button>
              <button type="button" className="btn primary small" disabled={busy || !file} onClick={send}>{busy ? '…' : pick(lang, S.send)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
