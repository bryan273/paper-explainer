import type { Tr } from '@/lib/prefs';

/** What changed for the people who use Paperlit, newest first. Written for them, not for us: no internal names. */
export type Release = { date: string; title: Tr<string>; items: Tr<string[]> };
export const RELEASES: Release[] = [
  {
    date: '2026-11-10',
    title: { en: 'Edit your videos, 9 video languages, longer lessons' },
    items: { en: [
      'Edit a finished video: choose a part, say what to change, and only that part is made again. Editing does not use a video credit.',
      'Videos can now be narrated in 9 languages: English, Chinese, Vietnamese, Indonesian, Japanese, Korean, Spanish, French and German. Make the same video in more languages in one go.',
      'Premium makes videos of up to 20 minutes, long enough for a full lesson.',
      'Describe your own narration style, for example "like a lab meeting, short and direct".',
      'New plans: Plus, Pro and Premium now cost less and include edits, research questions and interactive mode on every video.',
      'Every page of the app has a short tutorial with examples. Open it again with Tutorial in the top bar.',
      'The site follows your device in light or dark, unless you choose one.',
      'Videos are made faster.',
    ] },
  },
  {
    date: '2026-11-09',
    title: { en: 'Pay in your own currency, the site in 9 languages' },
    items: { en: [
      'Pay in yuan (WeChat Pay, Alipay), dong (VietQR) or rupiah (QRIS). The payment window opens at once.',
      'The whole site is available in English, Chinese, Vietnamese, Indonesian, Japanese, Korean, Spanish, French and German.',
      'Switch between your accounts from the profile picture, in one click.',
      'Students and teachers get a free month of Plus after a quick check of their card.',
    ] },
  },
  {
    date: '2026-11-08',
    title: { en: 'Interactive mode and a new home page' },
    items: { en: [
      'Interactive mode: the video stops after each part with one question and explains the answer, then a final quiz checks the whole video.',
      'A home page with what you can still make, your latest videos and your plan.',
      'Notes and flashcards for Anki on the paid plans.',
    ] },
  },
  {
    date: '2026-11-07',
    title: { en: 'Upload a PDF, ask about any video' },
    items: { en: [
      'Make a video from a PDF, a text file or pasted notes, not only from a link.',
      'Ask questions next to the video: answers quote the source and open it at the right page.',
    ] },
  },
];
