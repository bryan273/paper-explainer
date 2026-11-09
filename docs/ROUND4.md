# Round 4: editing, 9 video languages, new plans, tutorials, admin

Written for Bryan and the team, 10 Nov 2026. The checklist of every request is in `v2/ROUND4.md`.

## 1. What changed for members

| Area | Before | Now |
|---|---|---|
| Make video button | Inside the form, looked static | A bar fixed to the bottom of the screen, with a summary (source, languages, length, interactive) and the credits it uses |
| Video language | 4 languages, plus "English + Chinese" | 9 languages, one per video; "Also make it in" adds up to 3 more languages, each its own video |
| Length | Up to 10 min | Up to 20 min on Premium (for full lessons); every started 5 minutes = 1 video credit |
| Style | 5 fixed styles | Plus "Your own style", written by the member |
| Editing | Not possible | Edit under the video: choose the part, the kind of change, a note. Only that part is rewritten; the rest of the script is kept word for word. Free 1, Plus 2, Pro and Premium 3 edits per video; no video credit used |
| Tutorials | Forced clicks, floating button bottom left, entry in the profile menu | Next / Back, every step shows an example of the result; "Tutorial" in the top bar; closing one turns automatic tutorials off for good |
| Language switch | Twice (globe and profile menu) | Once: in the profile menu when signed in, the globe only for guests |
| Theme | Saved on the first visit, so it stopped following the device | Auto (follows the device) by default; Light / Dark in the profile menu |
| What is new | A chip on the hero | Its own page (`/whats-new`), linked in the footer |
| Products | "Text learning" and "Deep learning" cards led to pages that do something else | Cards named like the pages: Video learning, Research answers, Ask quiz and notes (opens an example video), Reproduction check |
| Footer | Different slogan from the hero | Same slogan ("Learn anything, your way. We make it easier."), support chat, tutorials, what is new, 9 languages |
| Support chat | "Message the team" only by hand | The assistant offers "Send to the team" when it cannot solve something; the owner gets an e-mail once e-mail is set up |
| Help center | Old numbers | Rewritten: what each page does, settings, editing, plans, accounts and several accounts, tutorials, troubleshooting |
| Research page | Unlimited | Counted, with "N of M left this month" under the button |

## 2. What things really cost (measured, last 30 days)

| Feature | Model | Cost each | Note |
|---|---|---|---|
| Video, per minute | Claude Haiku 4.5 writes the script; gpt-6.1-sol / gpt-5.6-terra draw the animations (RKAPI) | about ¥0.065 | 1 min ¥0.03 to 0.07, 3 min ¥0.08 to 0.25, 5 min ¥0.32 |
| Quick answer | Claude Haiku 4.5 (RKAPI) | about ¥0.13 before this round, about ¥0.05 now | It sent the whole source (48,000 characters) every time; now only the closest 14,000 |
| In-depth answer | Claude Sonnet 4.6 (RKAPI) | about ¥0.5 | |
| Research question | Claude Haiku 4.5, several calls | about ¥0.3 to 0.5 | |
| Reproduction check | DeepSeek V4.1 Flash for steps 1 to 3, GitHub runner | small; requested by hand | |

The surprise was the quick answer, not the video: a video is cheap, an answer reads the source again each time. The admin "Videos and usage" tab now shows this table from live data, and the "Pricing model" tab uses it.

## 3. New plans (prices lowered, everything counted, safe when fully used)

| | Free | Plus | Pro | Premium |
|---|---|---|---|---|
| Price a month (CNY / VND / IDR) | 0 | 29 / 79,000 / 69,000 | 55 / 149,000 / 129,000 | 99 / 269,000 / 239,000 |
| Videos | 3 a week | 20 a month | 40 a month | 80 a month |
| Longest video | 3 min | 5 min | 10 min | 20 min |
| Edits per video | 1 | 2 | 3 | 3 |
| Interactive mode | 2 videos a week | every video | every video | every video |
| Quick answers | 20 a week | 100 | 200 | 300 |
| In-depth answers | 2 a month | 10 | 20 | 30 |
| Research questions | 2 a week | 8 | 15 | 25 |
| Videos kept | 7 days | 30 days | 90 days | 270 days |

Yearly = 10 months. Packs unchanged (5 / 20 / 50 credits for ¥19 / 59 / 129).

Fully used (every credit spent on a 5 minute video, every edit, answer and research question used): Plus about ¥29, Pro about ¥61, Premium about ¥109, so each plan is around break-even in the very worst case and roughly 60 to 70% margin for a normal member. Before this round the worst case was 15 to 40 times the price. The admin "Pricing model" tab shows each cell as amount times cost each (point at a cell).

Why fewer videos: an edit fixes a video instead of making a new one, so members need fewer videos, and the plans still feel generous (Plus has an edit or two on every video).

## 4. Admin

- Two views: `qa-admin@repro-suite.dev` sees everything including test accounts; any other admin (the owner) sees real members only, with a note of how many test accounts are hidden. Test accounts are recognised by their address (`qa-...`, `@example.com`, `@repro-suite.dev`).
- **For the real admin view, sign up with `bryantjandra273@gmail.com`** (it is the owner address the backend already treats as admin).
- Hourly numbers for the last 7 days (choose "48 hours" or "Hourly").
- Cost per feature table, "Why videos failed" table.
- The tab bar no longer scrolls sideways; cards and the payment viewer have solid backgrounds.

## 5. Render speed (free)

Measured on a 1 minute video: 7.6 minutes, of which the animation step took 5. Two free fixes are in:
- one repair round for the animation layout instead of two (the second one rarely helped: +106 s, kept the old version);
- four parts drawn at the same time instead of three.
Expected: about 2 minutes faster per video. Further free options, in order: run the renderer on an Oracle Cloud Always Free machine (no GitHub queue, 4 cores; needs your account), and start the drawing of part 1 while the script of part 2 is still being written.

## 6. E-mail and domain (cheap options to try)

| Option | Cost | Limit | Notes |
|---|---|---|---|
| Resend (already wired in) | free | 3,000 a month, 100 a day | needs a domain you own |
| Gmail SMTP with an app password | free | about 500 a day | works without a domain, but mail comes from a gmail address and can land in spam; fine for notices to yourself |
| Alibaba Cloud DirectMail (already wired in) | about ¥2 per 1,000 | | better delivery to Chinese inboxes; needs a domain and a Chinese account |

Domain: still your decision (see `ROUND3.md`); `.app` names cost about USD 14 a year at Cloudflare.

## 7. Decisions for you

| # | Question | My suggestion |
|---|---|---|
| D1 | The plan numbers above | Keep them for a month and watch the admin cost table |
| D2 | Should edits be allowed on pack videos | Yes, 1 edit per pack video |
| D3 | Extra languages: full price per language, or cheaper | Full price for now (a language needs new narration and new drawings); cheaper later if we reuse the drawings |
| D4 | Teacher plan | Premium covers it (20 minutes, edits); a class plan is a custom offer |
| D5 | Paste an image into a question | Next round: the models can read images, it needs a size limit and a price check |
