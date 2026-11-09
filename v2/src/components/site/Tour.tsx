import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BookOpen, CircleUser, FlaskConical, MessageCircle, PlayCircle, Sparkles, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrefs } from '@/lib/prefs';

const K = 'pl-tour-done';
const S = {
  skip: { en: 'Skip', zh: '跳过', vi: 'Bỏ qua', id: 'Lewati' },
  back: { en: 'Back', zh: '上一步', vi: 'Quay lại', id: 'Kembali' },
  next: { en: 'Next', zh: '下一步', vi: 'Tiếp', id: 'Lanjut' },
  done: { en: 'Start learning', zh: '开始学习', vi: 'Bắt đầu học', id: 'Mulai belajar' },
  of: { en: '{i} of {n}', zh: '第 {i} / {n} 步', vi: 'Bước {i}/{n}', id: '{i} dari {n}' },
};
type Step = { icon: typeof Sparkles; target?: string; h: { en: string; zh: string; vi: string; id: string }; p: { en: string; zh: string; vi: string; id: string } };
const STEPS: Step[] = [
  { icon: Sparkles, h: { en: 'Welcome to Paperlit', zh: '欢迎使用 Paperlit', vi: 'Chào mừng đến với Paperlit', id: 'Selamat datang di Paperlit' },
    p: { en: 'Learn anything, your way. This short guide shows the six things worth knowing. It takes about 30 seconds.', zh: '用你的方式，学会任何东西。这份简短引导介绍六个值得了解的功能，大约 30 秒。', vi: 'Học bất cứ điều gì, theo cách của bạn. Hướng dẫn ngắn này giới thiệu sáu điều nên biết, chỉ mất khoảng 30 giây.', id: 'Pelajari apa saja, dengan cara Anda. Panduan singkat ini menunjukkan enam hal yang perlu diketahui, sekitar 30 detik.' } },
  { icon: PlayCircle, target: '[data-tour="/app/new"]', h: { en: 'Make a video from anything', zh: '把任何资料变成视频', vi: 'Tạo video từ bất cứ tài liệu nào', id: 'Buat video dari apa saja' },
    p: { en: 'Paste a link to a paper or an article, paste your notes, or upload a PDF. Your narrated video is ready in about five minutes, and you can close the tab while it is made.', zh: '粘贴论文或文章链接、粘贴笔记，或上传 PDF。约五分钟就能生成带讲解的视频，生成时可以关闭页面。', vi: 'Dán liên kết đến bài báo hoặc bài viết, dán ghi chú, hoặc tải lên PDF. Video có thuyết minh sẽ sẵn sàng trong khoảng năm phút, và bạn có thể đóng tab trong lúc nó được tạo.', id: 'Tempel tautan makalah atau artikel, tempel catatan, atau unggah PDF. Video bernarasi siap dalam sekitar lima menit, dan tab boleh ditutup selama proses.' } },
  { icon: Zap, h: { en: 'Turn on interactive mode', zh: '打开互动模式', vi: 'Bật chế độ tương tác', id: 'Nyalakan mode interaktif' },
    p: { en: 'With interactive mode on, the video stops at the end of each part and asks you one question, then explains the answer. A final quiz checks the whole video.', zh: '打开互动模式后，视频在每段结束时暂停提一个问题，并讲解答案。期末测验检验整个视频。', vi: 'Khi bật chế độ tương tác, video dừng ở cuối mỗi phần để hỏi bạn một câu hỏi, sau đó giải thích đáp án. Bài kiểm tra cuối cùng ôn tập toàn bộ nội dung.', id: 'Dengan mode interaktif, video berhenti di akhir tiap bagian untuk mengajukan satu pertanyaan, lalu menjelaskan jawabannya. Kuis akhir menguji seluruh video.' } },
  { icon: BookOpen, target: '[data-tour="/app/read"]', h: { en: 'Read and ask, with the page shown', zh: '边读边问，答案标注页码', vi: 'Đọc và hỏi, có ghi rõ trang', id: 'Baca dan tanya, dengan halaman ditunjukkan' },
    p: { en: 'Ask a research question and get an answer built from real papers, with every quote matched to the page it comes from.', zh: '提出研究问题，获得基于真实论文的回答，每条引文都对应到原文页码。', vi: 'Đặt câu hỏi nghiên cứu và nhận câu trả lời dựa trên bài báo thật, mỗi trích dẫn đều khớp với trang nguồn.', id: 'Ajukan pertanyaan riset dan dapatkan jawaban dari makalah nyata, setiap kutipan dicocokkan dengan halaman sumbernya.' } },
  { icon: FlaskConical, target: '[data-tour="/app/check"]', h: { en: 'Check whether a result holds', zh: '检验结果是否成立', vi: 'Kiểm chứng kết quả có đúng không', id: 'Cek apakah hasilnya berlaku' },
    p: { en: 'For papers with public code, Paperlit re-runs the experiment and shows whether the reported numbers come out again.', zh: '对公开代码的论文，Paperlit 会重新运行实验，看报告的数字能否再次得到。', vi: 'Với bài báo có mã nguồn công khai, Paperlit chạy lại thí nghiệm và cho thấy các con số công bố có lặp lại được không.', id: 'Untuk makalah dengan kode terbuka, Paperlit menjalankan ulang eksperimen dan menunjukkan apakah angka yang dilaporkan muncul lagi.' } },
  { icon: CircleUser, target: '[data-tour="profile"]', h: { en: 'Your account in one place', zh: '账户设置集中在一处', vi: 'Tài khoản ở một nơi', id: 'Akun Anda di satu tempat' },
    p: { en: 'Your profile picture at the top right holds your settings, language, theme and your other accounts: one click switches between them.', zh: '右上角的头像里有设置、语言、主题和你的其他账户，点一下即可切换。', vi: 'Ảnh đại diện ở góc trên bên phải chứa cài đặt, ngôn ngữ, giao diện và các tài khoản khác của bạn: chỉ một cú nhấp để chuyển đổi.', id: 'Foto profil di kanan atas berisi pengaturan, bahasa, tema, dan akun Anda yang lain: satu klik untuk berpindah.' } },
  { icon: MessageCircle, target: '[data-tour="chat"]', h: { en: 'Questions? Ask the chat', zh: '有问题？问聊天助手', vi: 'Có thắc mắc? Hỏi trong khung chat', id: 'Ada pertanyaan? Tanya lewat chat' },
    p: { en: 'The chat at the bottom right answers right away, and a person replies by email when needed. You can replay this guide from Help or from your profile menu.', zh: '右下角的聊天会立即回答，需要时会有真人通过邮件回复。可在帮助页或头像菜单中重新查看本引导。', vi: 'Khung chat ở góc dưới bên phải trả lời ngay, người hỗ trợ sẽ phản hồi qua email nếu cần. Bạn có thể xem lại hướng dẫn này trong mục Trợ giúp hoặc menu hồ sơ.', id: 'Chat di kanan bawah menjawab langsung, dan bila perlu tim kami membalas lewat email. Panduan ini bisa diputar ulang dari Bantuan atau menu profil.' } },
];

const visible = (sel?: string) => {
  if (!sel) return null;
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden') return el;
  }
  return null;
};

/** The first-visit guide: a few steps that point at the real controls. Skippable; replay with the event "pl-tour". */
export function Tour() {
  const { t } = usePrefs();
  const loc = useLocation();
  const [i, setI] = useState(-1);
  const [box, setBox] = useState<DOMRect | null>(null);
  const close = useCallback(() => { setI(-1); try { localStorage.setItem(K, '1'); } catch { /* private mode */ } }, []);

  useEffect(() => {
    const on = () => setI(0);
    window.addEventListener('pl-tour', on);
    let seen = false; try { seen = localStorage.getItem(K) === '1'; } catch { seen = true; }
    // the first visit opens it, but not on a shared video (people came to watch) and not inside the admin pages
    const auto = !seen && !/\/app\/(v|admin)\//.test(loc.pathname + '/') ? window.setTimeout(() => { if (!document.querySelector('[role=dialog]')) setI(0); }, 1200) : 0;
    return () => { window.removeEventListener('pl-tour', on); window.clearTimeout(auto); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = i >= 0 ? STEPS[i] : null;
  useLayoutEffect(() => {
    if (!step) return;
    const place = () => { const el = visible(step.target); setBox(el ? el.getBoundingClientRect() : null); };
    const el = visible(step.target);
    if (el) el.scrollIntoView({ block: 'nearest' });
    place();
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [step]);
  useEffect(() => {
    if (!step) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') setI((x) => Math.min(STEPS.length - 1, x + 1)); if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1)); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [step, close]);
  if (!step) return null;

  const last = i === STEPS.length - 1;
  const W = Math.min(360, window.innerWidth - 24);
  // the card sits under (or over) the control it explains; without one it is centred
  let pos: React.CSSProperties = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  if (box) {
    const below = box.bottom + 14 + 230 < window.innerHeight;
    const left = Math.max(12, Math.min(window.innerWidth - W - 12, box.left + box.width / 2 - W / 2));
    pos = below ? { left, top: box.bottom + 14 } : { left, top: Math.max(12, box.top - 14 - 230) };
  }
  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="pl-tour-h">
      {box
        ? <div className="pointer-events-none absolute rounded-xl ring-2 ring-primary transition-all duration-300" style={{ left: box.left - 6, top: box.top - 6, width: box.width + 12, height: box.height + 12, boxShadow: '0 0 0 9999px rgba(10,10,30,0.55)' }} />
        : <div className="absolute inset-0 bg-[rgba(10,10,30,0.55)]" />}
      <div className="absolute rounded-2xl border bg-card p-5 text-card-foreground shadow-2xl" style={{ width: W, ...pos }}>
        <button type="button" onClick={close} className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label={t(S.skip)}><X className="h-4 w-4" /></button>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><step.icon className="h-5 w-5" /></span>
        <h2 id="pl-tour-h" className="mt-3 pr-6 font-display text-lg font-semibold">{t(step.h)}</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{t(step.p)}</p>
        <div className="mt-4 flex items-center gap-1.5" aria-label={t(S.of).replace('{i}', String(i + 1)).replace('{n}', String(STEPS.length))}>
          {STEPS.map((_, k) => <span key={k} className={k === i ? 'h-1.5 w-5 rounded-full bg-primary' : 'h-1.5 w-1.5 rounded-full bg-muted-foreground/30'} />)}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={close}>{t(S.skip)}</Button>
          <div className="flex gap-2">
            {i > 0 && <Button variant="outline" size="sm" onClick={() => setI(i - 1)}>{t(S.back)}</Button>}
            <Button size="sm" onClick={() => (last ? close() : setI(i + 1))}>{last ? t(S.done) : t(S.next)}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
