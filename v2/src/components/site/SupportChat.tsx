import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MessageCircle, Send, X, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mark } from '@/components/brand';
import { accountApi, useAccount } from '@/lib/account';
import { visitorId } from '@/lib/explainer';
import { usePrefs, type Lang, pick, type Tr } from '@/lib/prefs';
import { COMMON } from '@/lib/strings';
import { cn } from '@/lib/utils';

const LLM_URL = 'https://wzdkroxbfrlqijbeiwpk.supabase.co/functions/v1/agent-llm';
const LANGNAME: Record<Lang, string> = { en: 'English', zh: 'Simplified Chinese', vi: 'Vietnamese', id: 'Indonesian', ja: 'Japanese', ko: 'Korean', es: 'Spanish', fr: 'French', de: 'German' };

/** What the support assistant knows. Keep it in step with pricing and the help page. */
const FACTS = `Paperlit is a learning platform. It turns one source (a research paper, an article, a web page, pasted text, a PDF or a .txt file) into: a narrated video with chapters (main feature), interactive mode (a feature turned on per video: questions inside the video at the end of each part, a quiz tab and a final quiz), Ask (Quick answers and In-depth answers that quote the source with page numbers), notes and flashcards (paid plans), Read (read papers with an AI that cites pages), and Check (re-running papers with public code to see if the reported numbers hold).
Making a video: Dashboard > New video, choose Link / Paste text / Upload file, pick the video language (English, Chinese, Vietnamese or Indonesian), the length (Free up to 3 minutes, Plus up to 5, Pro and Premium up to 10), tone and voice, optionally turn on interactive mode, press Make video. It takes about 4 to 8 minutes and keeps going if the tab is closed. A video uses up to the first 60,000 characters (about 25 pages) of the source. A failed video is given back. A video of up to 5 minutes counts as 1, longer as 2.
Plans (price per month in China / Vietnam / Indonesia): Free: 5 videos a week up to 3 minutes, interactive mode on 3 videos a week, 3 in-depth answers a month, videos kept 7 days; new accounts also get 3 welcome videos with interactive mode. Plus ¥33 / 89.000đ / Rp79.000: 80 videos a month up to 5 minutes, interactive mode on 40 videos, 30 in-depth answers a month, notes and flashcards, answers pitched to your level, videos kept 30 days. Pro ¥59 / 159.000đ / Rp139.000: 150 videos up to 10 minutes, interactive mode on 75, 80 in-depth answers a month, videos kept 90 days. Premium ¥109 / 299.000đ / Rp259.000: 280 videos, interactive mode on 140, 160 in-depth answers a month, videos kept 270 days, new features first. Yearly costs 10 months. Plans never renew on their own. Video packs: 5, 20 or 50 Pro videos (up to 10 minutes), never expire. Custom plans for classes and teams: contact us.
Students and teachers: send a photo of a student or staff card in Account > Students and teachers (button "Verify"); after approval, usually within a day, you get one free month of Plus with its 80 videos.
Invite a friend: you get 3 videos when they sign up with your link (Account > Invite friends), up to 5 friends.
Payment: the buyer chooses the money: yuan (WeChat Pay or Alipay), dong (VietQR: Techcombank or BIDV) or rupiah (QRIS: GoPay, OVO, DANA or any Indonesian bank app). Pay the exact amount, write the order number in the note, add a screenshot, press "I have paid". Plans switch on once the payment is confirmed, usually within a few hours, always within a day.
Shared video links are watch only; asking questions needs a free account.
Account: log in with email or username; click the profile picture at the top right for settings, theme, language and to switch between saved accounts. The site is in English, Chinese, Vietnamese, Indonesian, Japanese, Korean, Spanish, French and German. A short guide shows on the first visit and can be replayed from Help.`;

const T = {
  title: { en: 'Paperlit support', zh: 'Paperlit 客服', vi: 'Hỗ trợ Paperlit', id: 'Bantuan Paperlit' },
  sub: { en: 'Answers right away. A person replies by email within a day.', zh: '马上回答。需要人工时，一天内邮件回复。', vi: 'Trả lời ngay. Khi cần hỗ trợ, chúng tôi trả lời qua email trong một ngày.', id: 'Jawaban langsung. Staf kami membalas lewat email dalam sehari.' },
  hello: { en: 'Hi! Ask me anything about Paperlit: making videos, plans, payment or your account.', zh: '你好！关于 Paperlit 的任何问题都可以问我：做视频、套餐、付款或账户。', vi: 'Chào bạn! Hỏi mình bất cứ điều gì về Paperlit: tạo video, các gói, thanh toán hay tài khoản.', id: 'Halo! Tanyakan apa saja tentang Paperlit: membuat video, paket, pembayaran, atau akun Anda.' },
  ph: { en: 'Type your question', zh: '输入你的问题', vi: 'Nhập câu hỏi', id: 'Ketik pertanyaan Anda' },
  person: { en: 'Message the team', zh: '联系人工', vi: 'Nhắn cho đội ngũ', id: 'Kirim pesan ke tim' },
  email: { en: 'Your email, so we can reply', zh: '你的邮箱（用于回复）', vi: 'Email của bạn để chúng tôi trả lời', id: 'Email Anda agar kami bisa membalas' },
  msg: { en: 'How can we help?', zh: '需要什么帮助？', vi: 'Chúng tôi giúp gì được cho bạn?', id: 'Apa yang bisa kami bantu?' },
  send: { en: 'Send message', zh: '发送', vi: 'Gửi tin nhắn', id: 'Kirim pesan' },
  sent: { en: 'Thanks, your message is in. We reply by email, usually within a day.', zh: '已收到你的留言，通常一天内邮件回复。', vi: 'Đã nhận tin nhắn. Chúng tôi sẽ trả lời qua email, thường trong một ngày.', id: 'Pesan Anda sudah masuk. Kami membalas lewat email, biasanya dalam sehari.' },
  backChat: { en: 'Back to chat', zh: '返回聊天', vi: 'Quay lại trò chuyện', id: 'Kembali ke obrolan' },
  fail: { en: 'I could not answer just now. Try again, or message the team.', zh: '暂时无法回答，请重试或联系人工。', vi: 'Mình chưa trả lời được lúc này. Thử lại hoặc nhắn cho đội ngũ nhé.', id: 'Belum bisa menjawab sekarang. Coba lagi, atau kirim pesan ke tim.' },
  open: { en: 'Open support chat', zh: '打开客服', vi: 'Mở trò chuyện hỗ trợ', id: 'Buka obrolan bantuan' },
  chips: {
    en: ['How do I make a video?', 'What does Plus include?', 'How do I pay?', 'Student discount'],
    zh: ['怎么做视频？', 'Plus 包含什么？', '怎么付款？', '学生优惠'],
    vi: ['Tạo video thế nào?', 'Gói Plus có gì?', 'Thanh toán thế nào?', 'Ưu đãi sinh viên'],
    id: ['Bagaimana membuat video?', 'Apa isi paket Plus?', 'Bagaimana cara bayar?', 'Diskon mahasiswa'],
  },
};

type Msg = { role: 'user' | 'assistant'; content: string };

export function SupportChat() {
  const { lang, t } = usePrefs();
  const { user } = useAccount();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'chat' | 'contact'>('chat');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = (e: Event) => { setOpen(true); setMode((e as CustomEvent).detail === 'contact' ? 'contact' : 'chat'); };
    window.addEventListener('pl-support', on);
    return () => window.removeEventListener('pl-support', on);
  }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs, busy, open]);

  const ask = async (text: string) => {
    const question = text.trim(); if (!question || busy) return;
    const next = [...msgs, { role: 'user' as const, content: question }];
    setMsgs(next); setQ(''); setBusy(true);
    try {
      const res = await fetch(LLM_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app: 'companion', visitor: visitorId(), max_tokens: 500,
          messages: [
            { role: 'system', content: `You are the friendly support assistant of Paperlit. Answer in ${LANGNAME[lang]}, in at most 4 short sentences, plain text, no markdown. Use only these facts; if the answer is not in them or the person needs an account change, a refund or a payment check, say a person will help and suggest the "Message the team" button.\n${FACTS}` },
            ...next.slice(-8),
          ],
        }),
      });
      const data = await res.json().catch(() => ({}));
      const answer = String(data?.message?.content ?? '').trim();
      setMsgs([...next, { role: 'assistant', content: answer || t(T.fail) }]);
    } catch { setMsgs([...next, { role: 'assistant', content: t(T.fail) }]); }
    finally { setBusy(false); }
  };
  const sendContact = async (e: FormEvent) => {
    e.preventDefault(); setErr('');
    try {
      const transcript = msgs.length ? `\n\n--- chat ---\n${msgs.map((m) => `${m.role}: ${m.content}`).join('\n')}` : '';
      await accountApi('contact', { topic: 'support', email: form.email || user?.username || '', message: form.message + transcript });
      setSent(true); setForm({ email: '', message: '' });
    } catch (x) { setErr((x as Error).message === 'network' ? t(COMMON.network) : (x as Error).message); }
  };

  return (
    <>
      {!open && (
        <button type="button" data-tour="chat" onClick={() => setOpen(true)} aria-label={t(T.open)}
          className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 max-md:bottom-20">
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
      {open && (
        <section role="dialog" aria-label={t(T.title)} className="fixed bottom-5 right-5 z-50 flex h-[min(600px,calc(100dvh-40px))] w-[min(380px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl max-md:bottom-3 max-md:right-3">
          <header className="flex items-start gap-3 bg-primary px-4 py-4 text-primary-foreground">
            <Mark className="h-9 w-9 rounded-xl ring-2 ring-white/40" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-semibold">{t(T.title)}</p>
              <p className="text-xs opacity-85">{t(T.sub)}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-white/15" aria-label={t(COMMON.close)}><X className="h-5 w-5" /></button>
          </header>
          {mode === 'chat' ? (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                <Bubble role="assistant">{t(T.hello)}</Bubble>
                {msgs.length === 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pick4(lang, T.chips).map((c) => <button key={c} type="button" onClick={() => ask(c)} className="rounded-full border px-3 py-1.5 text-[13px] text-foreground hover:border-primary hover:text-primary">{c}</button>)}
                  </div>
                )}
                {msgs.map((m, i) => <Bubble key={i} role={m.role}>{m.content}</Bubble>)}
                {busy && <Bubble role="assistant"><Loader2 className="h-4 w-4 animate-spin" /></Bubble>}
                <div ref={end} />
              </div>
              <div className="border-t p-3">
                <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="flex gap-2">
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(T.ph)} maxLength={500} aria-label={t(T.ph)} />
                  <Button type="submit" size="icon" disabled={busy || !q.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
                </form>
                <button type="button" onClick={() => { setMode('contact'); setSent(false); }} className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"><Mail className="h-3.5 w-3.5" />{t(T.person)}</button>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {sent ? <p className="rounded-xl bg-muted p-4 text-sm">{t(T.sent)}</p> : (
                <form onSubmit={sendContact} className="grid gap-3">
                  <p className="text-sm font-semibold">{t(T.person)}</p>
                  {!user && <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t(T.email)} aria-label={t(T.email)} />}
                  <Textarea required minLength={5} rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={t(T.msg)} aria-label={t(T.msg)} />
                  {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
                  <Button type="submit">{t(T.send)}</Button>
                </form>
              )}
              <button type="button" onClick={() => setMode('chat')} className="mt-4 text-[13px] font-medium text-primary hover:underline">{t(T.backChat)}</button>
            </div>
          )}
        </section>
      )}
    </>
  );
}

const pick4 = (lang: Lang, v: Tr<string[]>) => pick(lang, v);

function Bubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  return (
    <div className={cn('flex', role === 'user' ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed', role === 'user' ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-muted text-foreground')}>{children}</div>
    </div>
  );
}
