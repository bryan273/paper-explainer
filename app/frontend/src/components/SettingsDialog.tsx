import { useEffect, useState } from 'react';
import { usePrefs } from '@/lib/prefs';
import { accountApi, useAccount } from '@/lib/account';
import { pick } from '@/lib/i18n_extra';
import { PURPOSE, pullProfile, useSettings, type Level, type Purpose } from '@/lib/settings';

const PERSONA = {"study": {"en": ["Student", "Exam prep: clear teacher, 3 minutes"], "zh": ["学生", "备考：清晰讲解，3 分钟"], "vi": ["Sinh viên", "Ôn thi: giảng rõ ràng, 3 phút"], "id": ["Mahasiswa", "Persiapan ujian: penjelasan jelas, 3 menit"]}, "research": {"en": ["Researcher", "Academic tone, 5 minutes, In-depth answers selected"], "zh": ["研究者", "学术语气，5 分钟，默认深入回答"], "vi": ["Nhà nghiên cứu", "Giọng học thuật, 5 phút, mặc định trả lời chuyên sâu"], "id": ["Peneliti", "Nada akademik, 5 menit, jawaban mendalam dipilih"]}, "teach": {"en": ["Teacher", "Class-ready: a clear 5 minute lesson"], "zh": ["教师", "适合上课：清晰的 5 分钟课程"], "vi": ["Giảng viên", "Dùng cho lớp: bài giảng rõ ràng 5 phút"], "id": ["Pengajar", "Siap untuk kelas: pelajaran jelas 5 menit"]}, "share": {"en": ["Creator", "Story style, 1 minute, made to post"], "zh": ["内容创作者", "故事风格，1 分钟，适合发布"], "vi": ["Người sáng tạo", "Phong cách kể chuyện, 1 phút, để đăng bài"], "id": ["Kreator", "Gaya cerita, 1 menit, siap diposting"]}, "curious": {"en": ["Curious", "New to the topic: everyday analogies, 2 minutes"], "zh": ["好奇的人", "初学者：生活化类比，2 分钟"], "vi": ["Tò mò", "Mới với chủ đề: ví dụ đời thường, 2 phút"], "id": ["Penasaran", "Baru di topik ini: analogi sehari-hari, 2 menit"]}} as const;
const UN = {"h": {"en": "Your username", "zh": "你的用户名", "vi": "Tên người dùng của bạn", "id": "Nama pengguna Anda"}, "p": {"en": "You sign in with your email or this username. 3 to 24 letters, numbers, dots or underscores.", "zh": "可用邮箱或此用户名登录。3 到 24 位字母、数字、点或下划线。", "vi": "Bạn đăng nhập bằng email hoặc tên người dùng này. 3 đến 24 chữ cái, số, dấu chấm hoặc gạch dưới.", "id": "Anda masuk dengan email atau nama pengguna ini. 3 sampai 24 huruf, angka, titik, atau garis bawah."}, "save": {"en": "Save", "zh": "保存", "vi": "Lưu", "id": "Simpan"}, "saved": {"en": "Saved.", "zh": "已保存。", "vi": "Đã lưu.", "id": "Tersimpan."}} as const;
const X = {"title": {"en": "Settings", "zh": "设置", "vi": "Cài đặt", "id": "Pengaturan"}, "comfort": {"en": "Reading comfort", "zh": "阅读舒适度", "vi": "Độ thoải mái khi đọc", "id": "Kenyamanan membaca"}, "size": {"en": "Text size", "zh": "字号", "vi": "Cỡ chữ", "id": "Ukuran teks"}, "font": {"en": "Font", "zh": "字体", "vi": "Phông chữ", "id": "Font"}, "lang": {"en": "Language", "zh": "语言", "vi": "Ngôn ngữ", "id": "Bahasa"}, "theme": {"en": "Theme", "zh": "外观", "vi": "Giao diện", "id": "Tema"}, "motion": {"en": "Animations", "zh": "动画", "vi": "Hiệu ứng", "id": "Animasi"}, "sm": {"en": "Small", "zh": "小", "vi": "Nhỏ", "id": "Kecil"}, "md": {"en": "Medium", "zh": "中", "vi": "Vừa", "id": "Sedang"}, "lg": {"en": "Large", "zh": "大", "vi": "Lớn", "id": "Besar"}, "sans": {"en": "Clean", "zh": "简洁", "vi": "Gọn", "id": "Bersih"}, "serif": {"en": "Book", "zh": "书籍", "vi": "Sách", "id": "Buku"}, "plain": {"en": "Plain", "zh": "朴素", "vi": "Đơn giản", "id": "Polos"}, "light": {"en": "Light", "zh": "浅色", "vi": "Sáng", "id": "Terang"}, "dark": {"en": "Dark", "zh": "深色", "vi": "Tối", "id": "Gelap"}, "on": {"en": "On", "zh": "开", "vi": "Bật", "id": "Nyala"}, "off": {"en": "Off", "zh": "关", "vi": "Tắt", "id": "Mati"}, "done": {"en": "Done", "zh": "完成", "vi": "Xong", "id": "Selesai"}, "mine": {"en": "Made for you", "zh": "为你定制", "vi": "Dành riêng cho bạn", "id": "Dibuat untuk Anda"}, "mineSub": {"en": "Pick a mode. It sets your videos, your quiz and your tutor, and follows you to every device.", "zh": "选一个模式，它会决定你的视频、自测和导师风格，并在所有设备上同步。", "vi": "Chọn một chế độ. Nó quyết định video, câu hỏi và gia sư của bạn, và theo bạn trên mọi thiết bị.", "id": "Pilih satu mode. Mode ini mengatur video, kuis, dan tutor Anda, dan mengikuti Anda di semua perangkat."}, "level": {"en": "Your level in this field", "zh": "你在该领域的水平", "vi": "Trình độ của bạn trong lĩnh vực này", "id": "Level Anda di bidang ini"}, "beginner": {"en": "Beginner", "zh": "入门", "vi": "Mới bắt đầu", "id": "Pemula"}, "intermediate": {"en": "Some background", "zh": "有基础", "vi": "Có nền tảng", "id": "Punya dasar"}, "expert": {"en": "Expert", "zh": "专家", "vi": "Chuyên gia", "id": "Ahli"}, "field": {"en": "Your field", "zh": "你的专业领域", "vi": "Lĩnh vực của bạn", "id": "Bidang Anda"}, "fieldPh": {"en": "e.g. biology, finance, computer vision", "zh": "例如：生物、金融、计算机视觉", "vi": "ví dụ: sinh học, tài chính, thị giác máy tính", "id": "mis. biologi, keuangan, visi komputer"}, "goal": {"en": "What are you working towards?", "zh": "你想达成什么目标？", "vi": "Bạn đang hướng tới điều gì?", "id": "Apa yang sedang Anda kejar?"}, "goalPh": {"en": "e.g. pass my ML exam in June", "zh": "例如：六月通过机器学习考试", "vi": "ví dụ: thi đậu môn ML vào tháng 6", "id": "mis. lulus ujian ML bulan Juni"}, "interactive": {"en": "Questions while watching", "zh": "边看边答题", "vi": "Câu hỏi khi xem", "id": "Pertanyaan saat menonton"}, "askModel": {"en": "Ask answers with", "zh": "提问使用", "vi": "Hỏi bằng", "id": "Tanya dengan"}, "fast": {"en": "Fast", "zh": "快速", "vi": "Nhanh", "id": "Cepat"}, "deep": {"en": "In-depth ✦", "zh": "深入 ✦", "vi": "Chuyên sâu ✦", "id": "Mendalam ✦"}, "lockTitle": {"en": "Make it yours", "zh": "让它更懂你", "vi": "Biến nó thành của bạn", "id": "Jadikan milik Anda"}, "lockBody": {"en": "Log in to pick a mode (student, researcher, teacher, creator), tell the tutor your level and field, and keep it all on every device. Free.", "zh": "登录后可选择模式（学生、研究者、教师、创作者），告诉导师你的水平和领域，并在所有设备同步。免费。", "vi": "Đăng nhập để chọn chế độ (sinh viên, nhà nghiên cứu, giảng viên, người sáng tạo), cho gia sư biết trình độ và lĩnh vực của bạn, và giữ mọi thứ trên mọi thiết bị. Miễn phí.", "id": "Masuk untuk memilih mode (mahasiswa, peneliti, pengajar, kreator), memberi tahu tutor level dan bidang Anda, dan menyimpan semuanya di semua perangkat. Gratis."}, "login": {"en": "Log in or sign up free", "zh": "登录或免费注册", "vi": "Đăng nhập hoặc đăng ký miễn phí", "id": "Masuk atau daftar gratis"}} as const;

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="askseg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)}>{o.l}</button>
      ))}
    </div>
  );
}

/** Reading comfort for everyone; for members a personal profile (mode, level, field, goal) that is kept on the account and shapes videos, quizzes and the tutor. */
export default function SettingsDialog() {
  const { lang, setLang, theme, toggleTheme } = usePrefs();
  const { user, openAuth, refresh } = useAccount();
  const [handle, setHandle] = useState('');
  const [handleMsg, setHandleMsg] = useState('');
  useEffect(() => { setHandle(user?.handle ?? ''); }, [user?.handle]);
  const saveHandle = async () => {
    setHandleMsg('');
    try { await accountApi('set_handle', { handle: handle.trim().toLowerCase() }); await refresh?.(); setHandleMsg(pick(lang, UN.saved)); } catch (e) { setHandleMsg((e as Error).message); }
  };
  const [s, set] = useSettings();
  const [open, setOpen] = useState(false);
  const x = <K extends keyof typeof X>(k: K) => pick(lang, X[k] as { en: string; zh: string; vi: string; id: string });
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener('pe-open-settings', on);
    return () => window.removeEventListener('pe-open-settings', on);
  }, []);
  useEffect(() => { if (user) void pullProfile(); }, [user?.id]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);
  if (!open) return null;
  const modes = Object.keys(PERSONA) as Purpose[];
  const choose = (p: Purpose) => {
    if (s.purpose === p) { set({ purpose: '' }, true); return; }
    set({ purpose: p, askModel: PURPOSE[p].askModel }, true);   // a mode never switches interactive mode on: that stays the person's own choice
  };
  return (
    <div role="dialog" aria-modal="true" aria-label={x('title')} className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="card stack modal-card settings-card" style={{ gap: 18 }}>
        <div className="row between">
          <h3 style={{ font: '700 20px var(--display)', margin: 0 }}>{x('title')}</h3>
          <button type="button" className="btn ghost small" onClick={() => setOpen(false)} aria-label="Close">×</button>
        </div>

        {user ? (
          <>
          <section className="mine" aria-label={pick(lang, UN.h)}>
            <h4>{pick(lang, UN.h)}</h4>
            <p className="small muted" style={{ margin: 0 }}>{pick(lang, UN.p)}</p>
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <input type="text" value={handle} maxLength={24} autoComplete="username" onChange={(e) => setHandle(e.target.value)} style={{ maxWidth: 260 }} />
              <button type="button" className="btn primary small" onClick={saveHandle}>{pick(lang, UN.save)}</button>
            </div>
            {handleMsg && <p className="small" role="status" style={{ margin: 0 }}>{handleMsg}</p>}
          </section>
          <section className="mine" aria-label={x('mine')}>
            <h4>{x('mine')}</h4>
            <p className="small muted" style={{ margin: 0 }}>{x('mineSub')}</p>
            <div className="persona-grid" role="radiogroup" aria-label={x('mine')}>
              {modes.map((p) => (
                <button key={p} type="button" role="radio" aria-checked={s.purpose === p} className="persona" onClick={() => choose(p)}>
                  <b>{pick(lang, PERSONA[p] as unknown as { en: string[]; zh: string[]; vi: string[]; id: string[] })[0]}</b>
                  <span>{pick(lang, PERSONA[p] as unknown as { en: string[]; zh: string[]; vi: string[]; id: string[] })[1]}</span>
                </button>
              ))}
            </div>
            <div className="set-row"><span>{x('level')}</span><Seg label={x('level')} value={(s.level || '') as Level} onChange={(v) => set({ level: s.level === v ? '' : v }, true)} options={[{ v: 'beginner', l: x('beginner') }, { v: 'intermediate', l: x('intermediate') }, { v: 'expert', l: x('expert') }]} /></div>
            <label className="field">{x('field')}<input type="text" maxLength={60} value={s.field} placeholder={x('fieldPh')} onChange={(e) => set({ field: e.target.value }, true)} /></label>
            <label className="field">{x('goal')}<input type="text" maxLength={140} value={s.goal} placeholder={x('goalPh')} onChange={(e) => set({ goal: e.target.value }, true)} /></label>
            <div className="set-row"><span>{x('interactive')}</span><Seg label={x('interactive')} value={s.interactive ? 'on' : 'off'} onChange={(v) => set({ interactive: v === 'on' }, true)} options={[{ v: 'on', l: x('on') }, { v: 'off', l: x('off') }]} /></div>
            <div className="set-row"><span>{x('askModel')}</span><Seg label={x('askModel')} value={s.askModel} onChange={(v) => set({ askModel: v }, true)} options={[{ v: 'fast', l: x('fast') }, { v: 'deep', l: x('deep') }]} /></div>
          </section>
          </>
        ) : (
          <section className="mine locked">
            <h4>✦ {x('lockTitle')}</h4>
            <p className="small" style={{ margin: 0 }}>{x('lockBody')}</p>
            <div><button type="button" className="btn primary small" onClick={() => { setOpen(false); openAuth('register'); }}>{x('login')}</button></div>
          </section>
        )}

        <section className="stack" style={{ gap: 14 }}>
          <h4 style={{ margin: 0 }}>{x('comfort')}</h4>
          <div className="set-row"><span>{x('size')}</span><Seg label={x('size')} value={s.size} onChange={(v) => set({ size: v }, !!user)} options={[{ v: 'sm', l: x('sm') }, { v: 'md', l: x('md') }, { v: 'lg', l: x('lg') }]} /></div>
          <div className="set-row"><span>{x('font')}</span><Seg label={x('font')} value={s.font} onChange={(v) => set({ font: v }, !!user)} options={[{ v: 'sans', l: x('sans') }, { v: 'serif', l: x('serif') }, { v: 'plain', l: x('plain') }]} /></div>
          <div className="set-row"><span>{x('lang')}</span><Seg label={x('lang')} value={lang} onChange={(v) => setLang(v)} options={[{ v: 'en', l: 'English' }, { v: 'zh', l: '中文' }, { v: 'vi', l: 'Tiếng Việt' }, { v: 'id', l: 'Bahasa Indonesia' }]} /></div>
          <div className="set-row"><span>{x('theme')}</span><Seg label={x('theme')} value={theme} onChange={(v) => { if (v !== theme) toggleTheme(); }} options={[{ v: 'light', l: x('light') }, { v: 'dark', l: x('dark') }]} /></div>
          <div className="set-row"><span>{x('motion')}</span><Seg label={x('motion')} value={s.motion ? 'on' : 'off'} onChange={(v) => set({ motion: v === 'on' })} options={[{ v: 'on', l: x('on') }, { v: 'off', l: x('off') }]} /></div>
        </section>
        <div><button type="button" className="btn primary" onClick={() => setOpen(false)}>{x('done')}</button></div>
      </div>
    </div>
  );
}
