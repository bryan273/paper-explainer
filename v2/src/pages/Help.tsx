import { Link, useNavigate } from 'react-router-dom';
import { Compass, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrefs, type Lang, pick, type Tr } from '@/lib/prefs';

type Topic = { id: string; h: string; intro?: string; items: [string, string][]; cta?: [string, string] };
const TOPICS: Tr<Topic[]> = {
  en: [
    { id: 'start', h: 'Getting started', intro: 'Paperlit turns one source into the way you learn best. Most people start with a video.', items: [['1. Create a free account', 'You get 5 free videos every week, plus 3 welcome videos with interactive mode. Guests can make 1 video a day without signing up.'], ['2. Make your first video', 'Go to New video, paste a link (for example https://arxiv.org/abs/1706.03762) and press Make video.'], ['3. Watch, ask and test yourself', 'Open the finished video from Home or Library. Turn on interactive mode, ask questions on the right, and take the final quiz.']], cta: ['Make a video', '/app/new'] },
    { id: 'sources', h: 'What you can put in', items: [['A paper link', 'arXiv (https://arxiv.org/abs/2005.14165), a DOI (10.48550/arXiv.1512.03385), or a direct PDF link.'], ['An article or web page', 'A blog post, a news story, a Wikipedia page, a course page. It must open without a login or paywall.'], ['Pasted text', 'Lecture notes, a chapter, a report: at least 300 characters. The video is made from the first 60,000 characters, about 25 pages.'], ['A file', 'PDF, TXT or Markdown, up to 5 files of 20 MB each. One video per file. The video covers the first 60 pages (about 60,000 characters); for a longer book, upload the chapter you need. Files are deleted after the video is made.'], ['Coming soon', 'Lecture videos and podcasts.']] },
    { id: 'settings', h: 'Choosing the settings', items: [['Video language', 'The source can be in any language. The narration, captions, questions and answers come out in the language you choose.'], ['Length', '1 to 2 minutes for the main idea, 3 minutes is a good default, 5 minutes to learn it properly. Free makes videos of up to 3 minutes, Plus up to 5, and Pro and Premium up to 10. A video longer than 5 minutes counts as 2.'], ['Style of explaining', 'Clear teacher (default), Friendly chat, Academic (for researchers), For beginners (no jargon) or Story.'], ['Anything to focus on', 'One line changes the whole script, for example "focus on the experiments" or "explain for a first-year student".']] },
    { id: 'making', h: 'While the video is made', items: [['How long', 'About 4 to 8 minutes. The page shows each step and each part as it finishes.'], ['You can close the tab', 'It keeps going on our side. Find it later in Home or Library.'], ['If it fails', 'You are told what happened and the credit goes back. Try pasting the text or uploading the PDF instead.']] },
    { id: 'interactive', h: 'Interactive mode', items: [['What it does', 'Interactive mode is a feature you turn on for a video. The video stops at the end of each part and asks one question. After you answer, the explanation is there at once, and "Explain more" goes deeper. It also adds the quiz tab and the final quiz.'], ['Turning it on', 'Use the switch under the video, or turn it on before making the video. It works in full screen too.'], ['How it is counted', 'Each video you turn it on for uses one from your allowance: Free 3 a week (plus 3 in your first week), Plus 40, Pro 75 and Premium 140 a month. Switching it off and on again for the same video is free. It does not give you extra videos.']] },
    { id: 'ask', h: 'Asking questions', items: [['Quick and In-depth', 'Quick answers come in seconds. In-depth uses a stronger AI that thinks longer: 3 a month on Free, 30 on Plus, 80 on Pro, 160 on Premium.'], ['Source + background or Source only', 'Source only answers strictly from the source. Source + background adds explanations and examples, and labels which is which.'], ['Checking an answer', 'Parts from the source show a quote and a "Page N" chip: tap it to open the source on that page, or the time chip to jump in the video.'], ['"I do not get this part"', 'Under the chapter text: it asks for a simpler explanation of the part you are on.']] },
    { id: 'quiz', h: 'Quiz, notes and flashcards', items: [['Quiz tab', 'Lists the questions you answered inside the video with your score. Reset to try again.'], ['Final quiz', 'A short test on the whole video with a score. Your past attempts are kept.'], ['Notes and flashcards', 'On every paid plan: download notes for each part (.md) and flashcards for Anki (.csv).']] },
    { id: 'read', h: 'Read and Check', items: [['Read', 'Ask a research question; the AI searches arXiv, reads full papers and answers with numbered quotes you can verify, then checks its own answer.'], ['Check', 'See papers whose results were re-run by our agent, with the verdict and the full run log, or ask for a paper with public code to be checked.']] },
    { id: 'plans', h: 'Plans and limits', items: [['Free', '5 videos a week of up to 3 minutes, interactive mode on 3 videos a week, 3 in-depth answers a month, videos kept for 7 days.'], ['Plus, Pro, Premium', '80, 150 or 280 videos a month; interactive mode on 40, 75 or 140 of them; 30, 80 or 160 in-depth answers a month; videos kept for 30, 90 or 270 days. Plus makes videos of up to 5 minutes, Pro and Premium up to 10.'], ['How videos are counted', 'A video of up to 5 minutes counts as 1, a 7 or 10 minute video as 2. The videos of a plan are added to your balance when the plan starts and do not expire. Your free videos of the week are used first.'], ['Video packs', '5, 20 or 50 Pro videos (up to 10 minutes each), bought once, never expire.']], cta: ['See pricing', '/pricing'] },
    { id: 'pay', h: 'Paying', items: [['Choose your money', 'Prices show in the money of the country in your profile. Switch between yuan, dong and rupiah at the top of the pricing page or in the payment window.'], ['Yuan', 'WeChat Pay or Alipay: scan the code and pay the exact amount.'], ['Dong', 'VietQR (Techcombank or BIDV): scan the code with your bank app and pay the exact amount.'], ['Rupiah', 'QRIS: scan with GoPay, OVO, DANA or any Indonesian bank app and type the exact amount.'], ['Then', 'Write the order number in the payment note, add the screenshot if you can, and press "I have paid". We switch your plan on as soon as the payment is confirmed, usually within a few hours and always within a day. Follow the order in Account > Plan and billing.']] },
    { id: 'students', h: 'Students and teachers', items: [['The offer', 'One free month of Plus with its 80 videos.'], ['How', 'Account > Students and teachers: choose student or teacher, add your school and a photo of your card or a school letter. We check it within a day and email you.']], cta: ['Verify', '/app/account?tab=students'] },
    { id: 'account', h: 'Your account', items: [['Log in', 'With your email or your username.'], ['Several accounts', 'Click your profile picture at the top right: your other accounts are listed there, one click switches. "Add an account" signs in to another one.'], ['Forgot your password', 'Choose "Forgot password?" on the log in screen. The link works for one hour.'], ['Invite friends', 'Account > Invite friends: you get 3 videos for each friend who signs up with your link, up to 5.']] },
    { id: 'trouble', h: 'Something is not working', items: [['"This link cannot be read"', 'The page needs a login, is behind a paywall or has little text. Paste the text or upload the PDF.'], ['The video is stuck', 'If a step does not move for more than 20 minutes, it is stopped and the credit goes back. Try again.'], ['No email arrived', 'Check spam. You can send the confirmation again from the dialog.'], ['Anything else', 'Write in the support chat. A person answers by email within a day.']] },
  ],
};
const H = {
  tour: { en: 'Replay the guided tour', zh: '重新播放使用引导', vi: 'Xem lại phần hướng dẫn', id: 'Putar ulang panduan' },
  h: { en: 'Help center', zh: '帮助中心', vi: 'Trung tâm trợ giúp', id: 'Pusat bantuan' },
  s: { en: 'Everything about making videos, learning with them, plans and your account.', zh: '关于制作视频、用视频学习、套餐和账户的一切。', vi: 'Mọi thứ về tạo video, học với video, các gói và tài khoản.', id: 'Semua tentang membuat video, belajar dengannya, paket, dan akun Anda.' },
  toc: { en: 'On this page', zh: '本页内容', vi: 'Trong trang này', id: 'Di halaman ini' },
  still: { en: 'Still need help?', zh: '还需要帮助？', vi: 'Vẫn cần trợ giúp?', id: 'Masih butuh bantuan?' },
  stillP: { en: 'Ask the support chat. It answers right away, and a person replies by email within a day.', zh: '在客服聊天提问，马上回答；需要人工时，一天内邮件回复。', vi: 'Hỏi trong khung chat hỗ trợ. Trả lời ngay, và một người sẽ phản hồi qua email trong vòng một ngày.', id: 'Tanya di obrolan bantuan. Langsung dijawab, dan staf membalas lewat email dalam sehari.' },
  chat: { en: 'Open support chat', zh: '打开客服', vi: 'Mở khung hỗ trợ', id: 'Buka obrolan bantuan' },
};

export default function Help() {
  const { lang, t } = usePrefs();
  const nav = useNavigate();
  const topics = pick(lang, TOPICS);
  return (
    <main className="pl-container pt-14">
      <h1 className="pl-h2 sm:text-[2.6rem]">{t(H.h)}</h1>
      <p className="pl-lede mt-3 max-w-2xl">{t(H.s)}</p>
      <Button variant="outline" className="mt-5" onClick={() => nav('/app/new?guide=1')}><Compass className="mr-1.5 h-4 w-4" />{t(H.tour)}</Button>
      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
        <nav className="hidden lg:block" aria-label={t(H.toc)}>
          <div className="sticky top-24 grid gap-1 text-sm">
            <p className="mb-2 font-semibold">{t(H.toc)}</p>
            {topics.map((x) => <a key={x.id} href={`#${x.id}`} className="rounded-md px-2 py-1.5 text-muted-foreground no-underline hover:bg-muted hover:text-foreground">{x.h}</a>)}
          </div>
        </nav>
        <div className="grid gap-12">
          {topics.map((x) => (
            <section key={x.id} id={x.id} className="scroll-mt-24">
              <h2 className="font-display text-2xl font-semibold">{x.h}</h2>
              {x.intro && <p className="mt-2 text-muted-foreground">{x.intro}</p>}
              <dl className="mt-5 grid gap-4">
                {x.items.map(([a, b]) => (
                  <div key={a} className="rounded-xl border p-4">
                    <dt className="font-semibold">{a}</dt>
                    <dd className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{b}</dd>
                  </div>
                ))}
              </dl>
              {x.cta && <Button asChild variant="outline" className="mt-4"><Link to={x.cta[1]}>{x.cta[0]}</Link></Button>}
            </section>
          ))}
          <section className="flex flex-col gap-4 rounded-2xl bg-muted/60 p-6 sm:flex-row sm:items-center">
            <div className="flex-1"><p className="font-display text-lg font-semibold">{t(H.still)}</p><p className="text-sm text-muted-foreground">{t(H.stillP)}</p></div>
            <Button onClick={() => window.dispatchEvent(new CustomEvent('pl-support', { detail: 'chat' }))}><MessageCircle className="mr-2 h-4 w-4" />{t(H.chat)}</Button>
          </section>
        </div>
      </div>
    </main>
  );
}
