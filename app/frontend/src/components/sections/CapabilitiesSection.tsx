import { usePrefs } from '@/lib/prefs';
import { pick } from '@/lib/i18n_extra';

type L4 = { en: string; zh: string; vi: string; id: string };

const T = {
  title: { en: 'Everything you can do with one paper', zh: '一篇论文，你可以做这些', vi: 'Mọi thứ bạn làm được với một bài báo', id: 'Semua yang bisa Anda lakukan dengan satu makalah' } as L4,
  sub: { en: 'Drop in a paper once. Learn it, test yourself, ask about it, and check if its result is real.', zh: '只需丢进一次论文：学会它、自测、提问，还能检验结果是不是真的。', vi: 'Chỉ cần thả bài báo vào một lần: học, tự kiểm tra, đặt câu hỏi và xem kết quả có thật không.', id: 'Masukkan makalah sekali saja: pelajari, uji diri, bertanya, dan periksa apakah hasilnya nyata.' } as L4,
  items: [
    { k: 'video', h: { en: 'A video lesson', zh: '一堂视频课', vi: 'Bài giảng video', id: 'Video pelajaran' } as L4, p: { en: 'A short narrated video that explains the paper step by step, with its real charts and figures.', zh: '一段短视频一步步讲解论文，并配上论文里的真实图表。', vi: 'Video ngắn có lời dẫn giảng từng bước, kèm biểu đồ và hình thật từ bài báo.', id: 'Video singkat bernarasi yang menjelaskan makalah langkah demi langkah, lengkap dengan grafik dan gambar aslinya.' } as L4 },
    { k: 'quiz', h: { en: 'Quiz yourself as you watch', zh: '边看边自测', vi: 'Tự kiểm tra khi xem', id: 'Uji diri saat menonton' } as L4, p: { en: 'The video pauses after each part and asks one question, so you know you really got it.', zh: '每段结束后视频暂停并问一个问题，让你确认自己真的懂了。', vi: 'Video dừng sau mỗi phần và hỏi một câu để bạn biết mình thật sự hiểu.', id: 'Video berhenti setiap bagian dan menanyakan satu pertanyaan agar Anda tahu benar-benar paham.' } as L4 },
    { k: 'ask', h: { en: 'Ask anything, with the page', zh: '随便问，附出处页码', vi: 'Hỏi gì cũng được, kèm số trang', id: 'Tanya apa saja, lengkap dengan halaman' } as L4, p: { en: 'Stuck? Ask the AI. Every answer says which page it came from, so you can check it.', zh: '卡住了？问 AI。每个回答都标出出处页码，方便你核对。', vi: 'Bí chỗ nào? Hỏi AI. Mỗi câu trả lời đều nêu rõ lấy từ trang nào để bạn kiểm tra.', id: 'Buntu? Tanya AI. Setiap jawaban menyebut halaman asalnya agar bisa Anda periksa.' } as L4 },
    { k: 'mode', h: { en: 'Made for how you learn', zh: '按你的学习方式定制', vi: 'Dành riêng cho cách bạn học', id: 'Dibuat sesuai cara Anda belajar' } as L4, p: { en: 'Student, researcher, teacher or creator: pick a mode and the videos, quizzes and answers fit you.', zh: '学生、研究者、教师或创作者：选一个模式，视频、自测和回答都会贴合你。', vi: 'Sinh viên, nhà nghiên cứu, giảng viên hay người sáng tạo: chọn một chế độ và video, câu hỏi, câu trả lời sẽ phù hợp với bạn.', id: 'Mahasiswa, peneliti, pengajar atau kreator: pilih mode dan video, kuis, serta jawabannya akan cocok untuk Anda.' } as L4 },
    { k: 'check', h: { en: 'Check if the result is real', zh: '检验结果是不是真的', vi: 'Kiểm chứng kết quả có thật không', id: 'Periksa apakah hasilnya nyata' } as L4, p: { en: 'An AI agent re-runs the experiment and tells you whether the published number holds.', zh: 'AI 智能体重新运行实验，告诉你发表的数字是否成立。', vi: 'Một tác tử AI chạy lại thí nghiệm và cho bạn biết con số đã công bố có đúng không.', id: 'Agen AI menjalankan ulang eksperimen dan memberi tahu apakah angka yang dipublikasikan berlaku.' } as L4 },
    { k: 'lang', h: { en: 'In your language', zh: '用你的语言', vi: 'Bằng ngôn ngữ của bạn', id: 'Dalam bahasa Anda' } as L4, p: { en: 'English, 中文, Tiếng Việt and Bahasa Indonesia: the page, the video and the answers.', zh: 'English、中文、Tiếng Việt、Bahasa Indonesia：页面、视频和回答都支持。', vi: 'English, 中文, Tiếng Việt và Bahasa Indonesia: trang web, video và câu trả lời.', id: 'English, 中文, Tiếng Việt dan Bahasa Indonesia: halaman, video, dan jawabannya.' } as L4 },
  ],
  student: { en: 'Student', zh: '学生', vi: 'Sinh viên', id: 'Mahasiswa' } as L4,
  researcher: { en: 'Researcher', zh: '研究者', vi: 'Nhà nghiên cứu', id: 'Peneliti' } as L4,
  teacher: { en: 'Teacher', zh: '教师', vi: 'Giảng viên', id: 'Pengajar' } as L4,
  reproduced: { en: 'Reproduced', zh: '已复现', vi: 'Đã tái lập', id: 'Terreproduksi' } as L4,
  page: { en: 'page', zh: '第', vi: 'trang', id: 'halaman' } as L4,
  q: { en: 'What does the shortcut connection do?', zh: '捷径连接起什么作用？', vi: 'Kết nối tắt có tác dụng gì?', id: 'Apa fungsi koneksi pintas?' } as L4,
  a: { en: 'It lets each layer learn only the change from its input.', zh: '它让每一层只需学习相对输入的变化量。', vi: 'Nó giúp mỗi lớp chỉ cần học phần thay đổi so với đầu vào.', id: 'Ini membuat tiap lapisan hanya belajar perubahan dari masukannya.' } as L4,
  reported: { en: 'reported', zh: '论文报告', vi: 'báo cáo', id: 'dilaporkan' } as L4,
  measured: { en: 'we got', zh: '我们得到', vi: 'chúng tôi đo được', id: 'hasil kami' } as L4,
};

function Mock({ k, lang }: { k: string; lang: string }) {
  if (k === 'video') {
    return (
      <div className="cap-mock cap-video" aria-hidden>
        <div className="cap-bars"><i style={{ height: '26%' }} /><i style={{ height: '88%' }} /><i style={{ height: '54%' }} /></div>
        <div className="cap-play">▶</div>
        <div className="cap-track"><b /></div>
      </div>
    );
  }
  if (k === 'quiz') {
    return (
      <div className="cap-mock" aria-hidden>
        <div className="cap-qline" /><div className="cap-qline short" />
        <div className="cap-opt">A</div><div className="cap-opt ok">B ✓</div><div className="cap-opt">C</div>
      </div>
    );
  }
  if (k === 'ask') {
    return (
      <div className="cap-mock" aria-hidden>
        <div className="cap-bubble me">{pick(lang, T.q)}</div>
        <div className="cap-bubble ai">{pick(lang, T.a)} <span className="cap-chip">{pick(lang, T.page)} 4</span></div>
      </div>
    );
  }
  if (k === 'mode') {
    return (
      <div className="cap-mock cap-chips" aria-hidden>
        <span className="on">{pick(lang, T.student)}</span><span>{pick(lang, T.researcher)}</span><span>{pick(lang, T.teacher)}</span>
      </div>
    );
  }
  if (k === 'check') {
    return (
      <div className="cap-mock cap-verdict" aria-hidden>
        <div><small>{pick(lang, T.reported)}</small><b>0.85</b></div>
        <div><small>{pick(lang, T.measured)}</small><b>0.85</b></div>
        <span className="cap-ok">✓ {pick(lang, T.reproduced)}</span>
      </div>
    );
  }
  return (
    <div className="cap-mock cap-chips" aria-hidden>
      <span className="on">English</span><span>中文</span><span>Tiếng Việt</span><span>Indonesia</span>
    </div>
  );
}

/** What the product can do, shown, not told: six small pictures with one plain sentence each. */
export default function CapabilitiesSection() {
  const { lang } = usePrefs();
  return (
    <section className="section" id="features" aria-labelledby="features-title">
      <h2 className="sec" id="features-title">{pick(lang, T.title)}</h2>
      <p className="sec-sub">{pick(lang, T.sub)}</p>
      <div className="cap-grid">
        {T.items.map((it) => (
          <article key={it.k} className="cap-card">
            <Mock k={it.k} lang={lang} />
            <h3>{pick(lang, it.h)}</h3>
            <p>{pick(lang, it.p)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
