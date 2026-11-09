import { useRef, useState } from 'react';
import { GraduationCap, Upload, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { accountApi, useAccount } from '@/lib/account';
import { uploadProof, MAX_PROOF_BYTES } from '@/lib/proof';
import { usePrefs } from '@/lib/prefs';
import { COMMON, dateFmt } from '@/lib/strings';
import { cn } from '@/lib/utils';

const S = {
  title: { en: 'Students and teachers: 1 month of Plus, free', zh: '学生和教师：免费用 1 个月 Plus', vi: 'Sinh viên và giảng viên: tặng 1 tháng Plus', id: 'Mahasiswa dan pengajar: 1 bulan Plus gratis' },
  sub: { en: 'Send a photo of your student or staff card. We check it within a day, then Plus and its 50 videos switch on.', zh: '上传学生证或工作证照片，我们一天内审核，通过后开通 Plus 和 50 个视频。', vi: 'Gửi ảnh thẻ sinh viên hoặc thẻ giảng viên. Chúng tôi duyệt trong một ngày, sau đó Plus và 50 video được kích hoạt.', id: 'Kirim foto kartu mahasiswa atau kartu pengajar. Kami cek dalam sehari, lalu Plus dan 50 videonya aktif.' },
  cta: { en: 'Send my proof', zh: '提交证明', vi: 'Gửi giấy tờ', id: 'Kirim bukti' },
  login: { en: 'Sign up free first', zh: '请先免费注册', vi: 'Đăng ký miễn phí trước', id: 'Daftar gratis dulu' },
  student: { en: 'Student', zh: '学生', vi: 'Sinh viên', id: 'Mahasiswa' },
  teacher: { en: 'Teacher', zh: '教师', vi: 'Giảng viên', id: 'Pengajar' },
  school: { en: 'School or university', zh: '学校', vi: 'Trường', id: 'Sekolah atau kampus' },
  file: { en: 'Photo or PDF of your card or a school letter', zh: '证件或学校证明的照片或 PDF', vi: 'Ảnh hoặc PDF thẻ, hoặc giấy xác nhận của trường', id: 'Foto atau PDF kartu, atau surat dari sekolah' },
  pick: { en: 'Choose a file (max 6 MB)', zh: '选择文件（最大 6 MB）', vi: 'Chọn tệp (tối đa 6 MB)', id: 'Pilih berkas (maks 6 MB)' },
  privacy: { en: 'Only our team sees it.', zh: '仅我们的团队可见。', vi: 'Chỉ đội ngũ chúng tôi xem.', id: 'Hanya tim kami yang melihat.' },
  send: { en: 'Send for checking', zh: '提交审核', vi: 'Gửi để duyệt', id: 'Kirim untuk dicek' },
  pending: { en: 'Proof received. We are checking it, usually within a day.', zh: '已收到证明，通常一天内审核完。', vi: 'Đã nhận giấy tờ. Chúng tôi đang duyệt, thường trong một ngày.', id: 'Bukti diterima. Sedang kami cek, biasanya dalam sehari.' },
  rejected: { en: 'We could not verify that proof. Send a clearer photo.', zh: '这份证明未通过，请上传更清晰的照片。', vi: 'Chưa xác minh được giấy tờ này. Hãy gửi ảnh rõ hơn.', id: 'Bukti itu belum bisa diverifikasi. Kirim foto yang lebih jelas.' },
  approved: { en: 'Approved: Plus is on until {d}.', zh: '已通过：Plus 有效期至 {d}。', vi: 'Đã duyệt: Plus có hiệu lực đến {d}.', id: 'Disetujui: Plus aktif sampai {d}.' },
  again: { en: 'Send again', zh: '重新提交', vi: 'Gửi lại', id: 'Kirim lagi' },
  big: { en: 'Choose a photo or PDF under 6 MB.', zh: '请选择小于 6 MB 的照片或 PDF。', vi: 'Chọn ảnh hoặc PDF dưới 6 MB.', id: 'Pilih foto atau PDF di bawah 6 MB.' },
};

export function StudentVerify({ className }: { className?: string }) {
  const { lang, t } = usePrefs();
  const { user, me, refresh, openAuth } = useAccount();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [school, setSchool] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const v = me?.verify;
  const approved = !!me?.plan && (me.plan_source === 'student' || me.plan_source === 'teacher');

  const send = async () => {
    if (!file || file.size > MAX_PROOF_BYTES) { setErr(t(S.big)); return; }
    setBusy(true); setErr('');
    try {
      const path = await uploadProof(file, 'verify');
      await accountApi('proof_submit', { role, path, school: school.trim() });
      setOpen(false); setFile(null); await refresh();
    } catch (e) { setErr((e as Error).message === 'network' ? t(COMMON.network) : (e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div id="students" className={cn('pl-card flex scroll-mt-24 flex-col gap-4 p-6 sm:flex-row sm:items-center', className)}>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-primary"><GraduationCap className="h-6 w-6" /></span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-semibold">{t(S.title)}</p>
        <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
          {approved ? <><CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />{t(S.approved).replace('{d}', dateFmt(me?.plan_until, lang))}</>
            : v?.status === 'pending' ? <><Clock className="mt-0.5 h-4 w-4 text-warning" />{t(S.pending)}</>
            : v?.status === 'rejected' ? t(S.rejected) : t(S.sub)}
        </p>
      </div>
      {!approved && v?.status !== 'pending' && !(me?.plan) && (
        <Button onClick={() => (user ? setOpen(true) : openAuth('register'))}>{!user ? t(S.login) : v?.status === 'rejected' ? t(S.again) : t(S.cta)}</Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader><DialogTitle className="font-display">{t(S.title)}</DialogTitle><DialogDescription>{t(S.sub)}</DialogDescription></DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              {(['student', 'teacher'] as const).map((r) => (
                <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)} className={cn('rounded-lg border px-3 py-2.5 text-sm font-medium', role === r ? 'border-primary bg-accent text-primary' : 'text-muted-foreground')}>{t(S[r])}</button>
              ))}
            </div>
            <div className="grid gap-1.5"><Label htmlFor="pl-school">{t(S.school)}</Label><Input id="pl-school" value={school} maxLength={120} onChange={(e) => setSchool(e.target.value)} /></div>
            <div className="grid gap-1.5">
              <Label>{t(S.file)}</Label>
              <input ref={ref} type="file" accept="image/*,application/pdf" hidden onChange={(e) => { setFile(e.target.files?.[0] ?? null); setErr(''); }} />
              <button type="button" onClick={() => ref.current?.click()} className={cn('flex items-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-sm', file ? 'border-success text-success' : 'text-muted-foreground hover:border-primary hover:text-primary')}>
                <Upload className="h-4 w-4" />{file ? file.name : t(S.pick)}
              </button>
              <p className="text-xs text-muted-foreground">{t(S.privacy)}</p>
            </div>
            {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>{t(COMMON.cancel)}</Button>
              <Button onClick={send} disabled={busy || !file}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t(S.send)}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
