import { Link, useNavigate } from 'react-router-dom';
import { Compass, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrefs, type Lang, pick, type Tr } from '@/lib/prefs';

type Topic = { id: string; h: string; intro?: string; items: [string, string][]; cta?: [string, string] };
const TOPICS: Tr<Topic[]> = {
  en: [
    { id: 'start', h: 'Getting started', intro: 'Paperlit turns one source into the way you learn best: a narrated video you can question, test yourself on and edit. Most people start with a video.', items: [['1. Create a free account', 'You get 3 free videos every week, plus 3 welcome videos with interactive mode. Guests can make 1 video a day without signing up.'], ['2. Make your first video', 'Go to New video, paste a link (for example https://arxiv.org/abs/1706.03762) and press Make video at the bottom of the screen.'], ['3. Watch, ask and test yourself', 'Open the finished video from Home or Library. Turn on interactive mode, ask questions on the right, and take the final quiz.'], ['4. Fix what you would explain differently', 'Press Edit under the video, choose a part and say what to change. Only that part is made again.']] },
    { id: 'products', h: 'What each page does', items: [['New video and Library', 'Make a narrated video from a link, pasted text or a file, and find all your videos again.'], ['Inside every video', 'Quick and in-depth answers that quote the source, interactive questions, a final quiz, notes and flashcards, and the source itself, opened at the right page.'], ['Research', 'Ask one research question across many papers. The answer is built from what the papers say, with every quote matched to its page.'], ['Check', 'See papers whose published results we re-ran from their code, with the verdict, or ask for a paper to be checked.']] },
    { id: 'sources', h: 'What you can put in', items: [['A paper link', 'arXiv (https://arxiv.org/abs/2005.14165), a DOI (10.48550/arXiv.1512.03385), or a direct PDF link.'], ['An article or web page', 'A blog post, a news story, a Wikipedia page, a course page. It must open without a login or paywall.'], ['Pasted text', 'Lecture notes, a chapter, a report: at least 300 characters. The video is made from the first 60,000 characters, about 25 pages.'], ['A file', 'PDF, TXT or Markdown, up to 5 files of 20 MB each. One video per file. The video covers the first 60,000 characters.']] },
    { id: 'settings', h: 'Choosing the settings', items: [['Video language', 'Choose one of 9 languages for the narration, captions and questions. The source can be in any language. To get the same video in another language, add it under "Also make it in": each language is its own video.'], ['Length', '1 to 2 minutes for the main idea, 3 minutes is a good default, 5 to 10 minutes to learn it properly, 15 to 20 minutes for a full lesson. Free makes videos of up to 3 minutes, Plus up to 5, Pro up to 10 and Premium up to 20. Every started 5 minutes uses one video credit.'], ['Style of explaining', 'Clear teacher, Friendly chat, Academic, For beginners or Story. Choose "Your own style" to describe it in your words, for example "like a lab meeting, short and direct".'], ['Anything to focus on', 'One line such as "focus on the experiments" or "explain for a first-year student". The script follows it.']] },
    { id: 'making', h: 'While the video is made', items: [['How long', 'Usually 4 to 8 minutes for a short video, longer for a long one. The page shows each step and each part as it finishes.'], ['You can close the tab', 'It keeps going on our side. Find it later in Home or Library.'], ['If it fails', 'You are told why, and the credit goes back. The most common reason is a link that needs a login: paste the text or upload the PDF instead.']] },
    { id: 'editing', h: 'Editing a video', items: [['What an edit does', 'It re-makes one part of a finished video as you ask: fix a mistake, add detail, make it simpler or go deeper. The rest stays as it was. The new version opens when it is ready, and the first one is kept.'], ['How', 'Under the video, press Edit, choose the part (the chapter), choose what kind of change, and write what you want in a sentence or two.'], ['How many', 'Free: 1 edit per video. Plus: 2. Pro and Premium: 3. An edit does not use a video credit.']] },
    { id: 'interactive', h: 'Interactive mode', items: [['What it does', 'The video stops at the end of each part and asks one question. After you answer, the explanation is there at once, and "Explain more" goes deeper. It also adds the quiz tab and the final quiz.'], ['Turning it on', 'Use the switch under the video, or turn it on before making the video. It works in full screen too.'], ['How it is counted', 'Each video you turn it on for uses one from your allowance: Free 2 a week (plus 3 in your first week), every video on Plus, Pro and Premium. Turning it on again for the same video is free.']] },
    { id: 'ask', h: 'Asking questions', items: [['Quick and In-depth', 'Quick answers come in seconds. In-depth uses a stronger AI that thinks longer and quotes the source with page numbers. Your home page shows how many of each you have left.'], ['Source + background or Source only', 'Source only answers strictly from the source. Source + background adds explanations and examples, and labels which is which.'], ['Checking an answer', 'Parts from the source show a quote and a "Page N" chip: tap it to open the source on that page, or the time chip to jump in the video.'], ['"I do not get this part"', 'Under the chapter text: it asks for a simpler explanation of the part you are on.']] },
    { id: 'quiz', h: 'Quiz, notes and flashcards', items: [['Quiz tab', 'Lists the questions you answered inside the video with your score. Reset to try again.'], ['Final quiz', 'A short test on the whole video with a score. Your past attempts are kept.'], ['Notes and flashcards', 'On every paid plan: download notes for each part (.md) and flashcards for Anki (.csv).']] },
    { id: 'read', h: 'Research and Check', items: [['Research', 'Ask a research question; the AI searches arXiv, reads full papers and answers with numbered quotes you can verify, then checks its own answer. Each question counts once: Free 2 a week, Plus 8, Pro 15, Premium 25 a month.'], ['Check', 'See papers whose results were re-run from their own code, with the verdict and the full run log, or ask for a paper with public code to be checked.']] },
    { id: 'plans', h: 'Plans and limits', items: [['Free', '3 videos a week of up to 3 minutes, 1 edit per video, interactive mode on 2 videos a week, 20 quick answers and 2 research questions a week, 2 in-depth answers a month, videos kept for 7 days.'], ['Plus, Pro, Premium', '20, 40 or 80 videos a month; videos of up to 5, 10 or 20 minutes; 2, 3 or 3 edits per video; interactive mode on every video; 100, 200 or 300 quick answers, 10, 20 or 30 in-depth answers and 8, 15 or 25 research questions a month; videos kept for 30, 90 or 270 days.'], ['How videos are counted', 'Every started 5 minutes uses one video credit. Each language is its own video. The credits of a plan are added when the plan starts and do not expire. Your free videos of the week are used first.'], ['Video credit packs', '5, 20 or 50 credits, bought once, never expire; videos of up to 10 minutes.']], cta: ['See pricing', '/pricing'] },
    { id: 'pay', h: 'Paying', items: [['Choose your money', 'Prices show in the money of the country in your profile. Switch between yuan, dong and rupiah at the top of the pricing page or in the payment window.'], ['Yuan', 'WeChat Pay or Alipay: scan the code and pay the exact amount.'], ['Dong', 'VietQR (Techcombank or BIDV): scan the code with your bank app and pay the exact amount.'], ['Rupiah', 'QRIS: scan with GoPay, OVO, DANA or any Indonesian bank app and type the exact amount.'], ['Then', 'Write the order number in the payment note, add the screenshot if you can, and press "I have paid". Your plan switches on as soon as we confirm, usually within a few hours and always within a day.']] },
    { id: 'students', h: 'Students and teachers', items: [['The offer', 'One free month of Plus: 20 videos, edits, interactive mode on every video, notes and flashcards.'], ['Teachers', 'Premium makes videos of up to 20 minutes, enough for a full lesson, and every part can be edited until it sounds like you. For a whole class, ask us for a custom plan.'], ['How', 'Account > Students and teachers: choose student or teacher, add your school and a photo of your card or a school letter. We check it within a day and email you.']], cta: ['Verify', '/app/account?tab=students'] },
    { id: 'account', h: 'Your account', items: [['Log in', 'With your email or your username.'], ['Several accounts', 'Click your profile picture at the top right: your other accounts are listed there, and one click switches. "Add an account" signs in to another one without signing out of this one.'], ['Language and theme', 'In the profile menu. The theme follows your device until you choose light or dark.'], ['Forgot your password', 'Choose "Forgot password?" on the log in screen. The link works for one hour.'], ['Invite friends', 'Account > Invite friends: you get 2 videos for each friend who signs up with your link, up to 5.']] },
    { id: 'tutorials', h: 'Tutorials', items: [['First visit', 'The first time you open a page, a short tutorial shows what each part does, with an example. Use Next and Back, or close it.'], ['See it again', 'Press Tutorial in the top bar on any page of the app.'], ['Turned off', 'If you close a tutorial, no tutorial opens by itself again. You can still open them from the top bar.']] },
    { id: 'trouble', h: 'Something is not working', items: [['"This link cannot be read"', 'The page needs a login, is behind a paywall or has little text. Paste the text or upload the PDF.'], ['The video is stuck', 'If nothing changes for 15 minutes, it is stopped and the credit goes back. Try once more; if it happens again, tell us in the chat.'], ['A page looks broken after an update', 'Reload the page. The site loads the newest version by itself in most cases.']] },
  ],
};
const H = {
  tour: { en: 'Open the tutorial' },
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
