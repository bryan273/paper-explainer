import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { usePrefs } from '@/lib/prefs';
import { pick } from '@/lib/i18n_extra';

type L4 = { en: string; zh: string; vi: string; id: string };
const KEY = 'pe-tour-seen';

const STEPS: { sel: string; h: L4; p: L4 }[] = [
  { sel: '#make .src-tabs', h: { en: '1. Drop in a paper', zh: '1. 丢进一篇论文', vi: '1. Thả bài báo vào', id: '1. Masukkan makalah' }, p: { en: 'Paste an arXiv link, a PDF link or a DOI here. Or upload a PDF from your computer.', zh: '在这里粘贴 arXiv 链接、PDF 链接或 DOI，也可以上传电脑里的 PDF。', vi: 'Dán liên kết arXiv, liên kết PDF hoặc DOI vào đây. Hoặc tải PDF từ máy lên.', id: 'Tempel tautan arXiv, tautan PDF, atau DOI di sini. Atau unggah PDF dari komputer.' } },
  { sel: '.make-opts', h: { en: '2. Pick your language', zh: '2. 选择语言', vi: '2. Chọn ngôn ngữ', id: '2. Pilih bahasa' }, p: { en: 'The video can teach in English, 中文, Tiếng Việt or Bahasa Indonesia.', zh: '视频可以用 English、中文、Tiếng Việt 或 Bahasa Indonesia 讲解。', vi: 'Video có thể giảng bằng English, 中文, Tiếng Việt hoặc Bahasa Indonesia.', id: 'Video bisa mengajar dalam English, 中文, Tiếng Việt atau Bahasa Indonesia.' } },
  { sel: '.inter-pick', h: { en: '3. Shape the lesson', zh: '3. 调整这堂课', vi: '3. Tùy chỉnh bài giảng', id: '3. Atur pelajarannya' }, p: { en: 'Choose how long it is, how it sounds, and the voice. Log in to save a mode that fits how you learn.', zh: '选择时长、语气和声音。登录后可保存适合你的学习模式。', vi: 'Chọn độ dài, giọng điệu và giọng đọc. Đăng nhập để lưu một chế độ phù hợp với cách bạn học.', id: 'Pilih durasi, nada, dan suara. Masuk untuk menyimpan mode yang cocok dengan cara belajar Anda.' } },
  { sel: '#features', h: { en: '4. Then learn, quiz and ask', zh: '4. 然后学习、自测、提问', vi: '4. Rồi học, tự kiểm tra và hỏi', id: '4. Lalu belajar, uji, dan tanya' }, p: { en: 'Watch the video, answer a question after each part, ask the AI about anything, and check if the result is real.', zh: '观看视频，每段之后答一道题，随时问 AI，还能检验结果是不是真的。', vi: 'Xem video, trả lời một câu sau mỗi phần, hỏi AI bất cứ điều gì, và kiểm chứng kết quả có thật không.', id: 'Tonton video, jawab satu pertanyaan setelah tiap bagian, tanya AI apa saja, dan periksa apakah hasilnya nyata.' } },
  { sel: '#examples', h: { en: '5. See real examples', zh: '5. 看真实示例', vi: '5. Xem ví dụ thật', id: '5. Lihat contoh nyata' }, p: { en: 'These videos were made from famous papers. Press play to see what you will get.', zh: '这些视频由知名论文制作。点击播放看看你会得到什么。', vi: 'Các video này được làm từ những bài báo nổi tiếng. Nhấn phát để xem bạn sẽ nhận được gì.', id: 'Video ini dibuat dari makalah terkenal. Tekan putar untuk melihat yang akan Anda dapat.' } },
  { sel: '#pricing', h: { en: '6. Free to start', zh: '6. 免费开始', vi: '6. Bắt đầu miễn phí', id: '6. Mulai gratis' }, p: { en: 'One free video a day and three welcome videos. Plans start at ¥33 a month.', zh: '每天一个免费视频，另送三个欢迎视频。套餐每月 ¥33 起。', vi: 'Mỗi ngày một video miễn phí và ba video chào mừng. Gói bắt đầu từ ¥33 mỗi tháng.', id: 'Satu video gratis per hari dan tiga video selamat datang. Paket mulai dari ¥33 per bulan.' } },
];
const U = {
  offer: { en: 'New here? See how it works in 30 seconds.', zh: '第一次来？30 秒看懂怎么用。', vi: 'Lần đầu ghé thăm? Xem cách dùng trong 30 giây.', id: 'Baru di sini? Lihat cara pakainya dalam 30 detik.' } as L4,
  start: { en: 'Show me', zh: '带我看看', vi: 'Xem hướng dẫn', id: 'Tunjukkan' } as L4,
  next: { en: 'Next', zh: '下一步', vi: 'Tiếp', id: 'Lanjut' } as L4,
  back: { en: 'Back', zh: '上一步', vi: 'Quay lại', id: 'Kembali' } as L4,
  done: { en: 'Got it', zh: '知道了', vi: 'Đã hiểu', id: 'Mengerti' } as L4,
  skip: { en: 'Skip', zh: '跳过', vi: 'Bỏ qua', id: 'Lewati' } as L4,
  tour: { en: 'How to use', zh: '使用指南', vi: 'Hướng dẫn sử dụng', id: 'Cara pakai' } as L4,
};

/** A guided tour for first-time visitors: it lights up each part of the page in turn and says, in one line, what it is for. */
export default function Tour() {
  const { lang } = usePrefs();
  const [seen, setSeen] = useState(() => { try { return localStorage.getItem(KEY) === '1'; } catch { return true; } });
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const steps = STEPS.filter((s) => typeof document !== 'undefined' && document.querySelector(s.sel));

  const mark = useCallback(() => { setSeen(true); try { localStorage.setItem(KEY, '1'); } catch { /* private mode */ } }, []);
  const close = useCallback(() => { setStep(null); mark(); }, [mark]);

  const measure = useCallback(() => {
    if (step === null) return;
    const el = document.querySelector(steps[step]?.sel ?? '');
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step, steps]);

  useLayoutEffect(() => {
    if (step === null) return;
    const el = document.querySelector(steps[step]?.sel ?? '');
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const timer = window.setTimeout(measure, 450);
    measure();
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step === null) return;
    const on = () => measure();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('resize', on); window.addEventListener('scroll', on, true); window.addEventListener('keydown', key);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('scroll', on, true); window.removeEventListener('keydown', key); };
  }, [step, measure, close]);

  useEffect(() => {
    const open = () => setStep(0);
    window.addEventListener('pe-open-tour', open);
    return () => window.removeEventListener('pe-open-tour', open);
  }, []);

  if (step === null) {
    return (
      <div className="tour-fab-wrap">
        {!seen && (
          <div className="tour-offer" role="status">
            <span>{pick(lang, U.offer)}</span>
            <button type="button" className="btn primary small" onClick={() => { mark(); setStep(0); }}>{pick(lang, U.start)}</button>
            <button type="button" className="tour-x" onClick={mark} aria-label={pick(lang, U.skip)}>×</button>
          </div>
        )}
        {seen && <button type="button" className="tour-fab" onClick={() => setStep(0)} aria-label={pick(lang, U.tour)}><span aria-hidden>?</span><span className="tour-t"> {pick(lang, U.tour)}</span></button>}
      </div>
    );
  }
  const s = steps[step];
  if (!s) { close(); return null; }
  const pad = 10;
  const box = rect ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 } : null;
  const below = rect ? rect.bottom + 16 + 190 < window.innerHeight : true;
  const cardTop = box ? (below ? box.top + box.height + 12 : Math.max(12, box.top - 12 - 190)) : 120;
  const cardLeft = box ? Math.min(Math.max(12, box.left), Math.max(12, window.innerWidth - 372)) : 12;
  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label={pick(lang, s.h)}>
      {box && <div className="tour-spot" style={box} />}
      <div className="tour-card" style={{ top: cardTop, left: cardLeft }}>
        <b>{pick(lang, s.h)}</b>
        <p>{pick(lang, s.p)}</p>
        <div className="row between">
          <button type="button" className="linkbtn small" onClick={close}>{pick(lang, U.skip)}</button>
          <span className="row" style={{ gap: 8 }}>
            {step > 0 && <button type="button" className="btn ghost small" onClick={() => setStep(step - 1)}>{pick(lang, U.back)}</button>}
            {step < steps.length - 1
              ? <button type="button" className="btn primary small" onClick={() => setStep(step + 1)}>{pick(lang, U.next)} ({step + 1}/{steps.length})</button>
              : <button type="button" className="btn primary small" onClick={close}>{pick(lang, U.done)}</button>}
          </span>
        </div>
      </div>
    </div>
  );
}
