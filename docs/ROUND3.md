# Round 3: pricing re-set, "why people can't leave", names, guides, logo

Written for Bryan and the team. Everything here is live or ready to review.

## 1. What was done

| Request | Status |
|---|---|
| Use logo 5 for now | Done. Letter P with a play button, in the header, sign-in window, chat bubble and favicon. Temporary until the final name is chosen. |
| Read the real costs, re-set benefits and prices | Done. See section 2. |
| Interactive guides on every feature page, replay button | Done. See section 5. |
| Strategy for a product people cannot replace | Section 3. |
| Unique, SEO-friendly names | Section 4. |

## 2. Pricing re-set (from the admin "Pricing model" numbers)

### Costs we measured or assumed (per member, in yuan)

| Item | Cost | Source |
|---|---|---|
| Video up to 3 min | 0.081 | measured, 28 videos |
| Video 4 to 5 min | 0.321 | measured, only 1 video (treat as rough) |
| Video 7 to 10 min | about 0.50 | estimate, none made yet |
| Interactive mode for one video | 0.03 | estimate |
| One in-depth answer | 0.30 | estimate, about one whole 5 minute video |
| One quick answer | 0.01 | estimate |

What the old numbers said: Plus made 21% and Pro 8% when members used 40% of their allowance, and a free member cost 4.99. The reason was one line: **in-depth answers were counted per video (20, 35, 50)**, so one heavy user could cost 500 to 4,000 yuan. Videos themselves were never the problem.

### What changed

In-depth answers are now **one pool per month**, not per video. Everything else stays: it already felt generous and the video itself is cheap.

| | Free | Plus | Pro | Premium |
|---|---|---|---|---|
| Price a month (CNY / VND / IDR) | 0 | 33 / 89,000 / 79,000 | 59 / 159,000 / 139,000 | 109 / 299,000 / 259,000 |
| Videos | 5 a week, up to 3 min | 80 a month, up to 5 min | 150 a month, up to 10 min | 280 a month, up to 10 min |
| Interactive mode on | 3 videos a week | 40 | 75 | 140 |
| **In-depth answers a month** (was per video 5 / 20 / 35 / 50) | **3** | **30** | **80** | **160** |
| Videos kept | 7 days | 30 days | 90 days | 270 days |
| Notes, flashcards, answers pitched to your level | no | yes | yes | yes |

Prices were not changed: they are already about one fifth of ChatGPT Plus (about 145 yuan), and the new margins are healthy.

### Result (with the measured costs, members using 40% of videos, 35% of interactive and 40% of in-depth)

| Plan | Expected cost | Expected margin | Cost if every credit and answer is used | Margin then |
|---|---|---|---|---|
| Free | 1.5 | acquisition cost (was 4.99) | 3.7 | n/a |
| Plus 33 | 10.3 | **69%** | 38.3 | -16% |
| Pro 59 | 22.1 | **63%** | 78.9 | -34% |
| Premium 109 | 42.5 | **61%** | 150.5 | -38% |

The "fully used" column is a theory (every video 4 to 5 minutes, every answer used). Before the change it was -1,400% to -3,900%. Now the worst case is a bounded loss on a member who uses everything, which is acceptable because it almost never happens and they are our best advocates.

Revenue example with 1,000 free, 40 Plus, 10 Pro, 3 Premium (the admin default): income 2,237 yuan a month. Cost is about 2,275: 1,500 for the free members, 760 for the paid ones, 15 fixed. That is **break-even, before payment fees**; before the re-set the same mix showed -4,660. The free members are the whole cost here, and the 1.5 a head assumes all 1,000 use 40% of their allowance, which is high (most free accounts are inactive). With 300 active free members the same mix makes about +700 a month. The lesson: the margin per paying member is healthy (60% and up); what decides profit is the ratio of paying to free members (aim for 1 paying in 10 to 15 free) and keeping free cheap. The admin tab "Pricing model" recalculates with real costs whenever you open it, so check it again once a few 10 minute videos exist.

Why the ladder works for upgrading (the "feeling of lack" without being cruel):
- Free is enough to love the product (5 videos a week) but runs out of the things heavy learners hit first: **length (3 minutes)**, **in-depth answers (3 a month)** and **how long videos are kept (7 days)**.
- Plus unlocks the thing students hit next: notes, flashcards, answers pitched to their level, 5 minute videos, 30 in-depth answers.
- Pro is for long papers (10 minutes) and a real archive (90 days).
- Premium is for people who build a library (270 days, 160 in-depth answers) and get new features first.

Not changed, still your decision: whether video packs should also include in-depth answers (today a pack buyer without a plan gets the free amount, 3 a month).

## 3. How to become hard to replace

Today we are a very good converter: source in, video out. A converter is easy to swap, because the user leaves with nothing lost. A product people depend on is one where **leaving costs them something they built**. Six ideas, ordered by what I would build first.

1. **Their own library that gets smarter ("your second brain from everything you watched").**
   Every video, note, flashcard, quiz result and question is stored per person. Add: search across all their videos, "ask my whole library", a map of the topics they know and the ones they are weak on. After three months this is theirs and only exists here. Link to work: a PhD student asks "what did the 40 papers I read say about X" and gets an answer with page numbers. No other tool has their reading history. Paid plans keep the archive longer, so the archive itself is the upgrade reason.
2. **Spaced review that brings them back daily.**
   Flashcards and quiz questions from every video go into one daily review queue (the forgetting curve). A streak and a "5 minutes today" card on Home. Habit is the strongest moat and it costs almost nothing to run (reuses what the video already generated).
3. **Classes and teams.**
   A teacher or lab lead creates a shared library, assigns a video, sees who finished and who missed which question. Students then pull more students in, and a class does not move to another tool mid-term. This is also the cleanest way to sell a bigger plan (custom plans for classes are already on the pricing page). The student plan already gives us the audience.
4. **The reproducibility database (Check).**
   Nobody else re-runs papers' code and publishes the verdict. Each checked paper is a unique page that attracts search traffic and builds trust ("Paperlit checked this paper: 3 of 4 numbers reproduced"). It is slow to copy because it costs compute and care, and it links to real research work (citing it, reviewing, choosing which paper to build on).
5. **A public, shared cache of explainers (cost moat plus SEO).**
   When two people make a video of the same paper, the second one is almost free (reuse the script, only re-render in their language). Public explainer pages for popular papers get indexed and bring new users while our cost per video falls as the library grows. A competitor starting from zero has a higher cost per video than we do.
6. **Fit into the tools they already use, but make us the hub.**
   One-click export to Anki, Notion, Obsidian and Zotero, and a browser button "make a video of this page". It sounds like it makes leaving easy, but the opposite is true: once their notes and flashcards flow out of us into their daily tools, we are the source they refresh from. Pair it with a weekly "new papers in your field" digest with a one-line video for each, so they open us without having to remember.

Where the numbers fit: ideas 1, 2 and 5 cost almost nothing per member (stored text and reused content), so they can sit inside Plus and Pro and raise the value of the plans without touching the margins above. Ideas 3 and 4 are what makes a Premium or a team plan worth 3 to 10 times a normal member.

My suggestion for the next release: build 1 (library search and "ask my library") and 2 (daily review) first. They make the product something people open every day and give them a reason to stay on a paid plan only to keep their archive.

## 4. Names: unique, easy to search, with domain checked

Checked on 9 Nov by RDAP (the official domain registry lookup). A web search for each name found no existing product with the same name, but this is not a trademark search: before buying, search the name in the CNIPA (China), IP Viet Nam, DJKI (Indonesia) and WIPO databases.

What helps SEO: a coined word that nobody else owns (so you are the only result) that still carries a hint of what we do (learn, read, reel/video, gist).

| Name | Meaning | .com | .app | Our view |
|---|---|---|---|---|
| **Scholarreel** | scholar plus reel (video) | free | free | Best for search: both words are exactly what people look for, and the spelling is unique. A little long. |
| **Wondergist** | wonder (curiosity) plus gist (the main idea) | free | free | Friendliest and easiest to remember. Not specific to video. |
| **Scribelit** | scribe (notes) plus lit (light) | free | free | Short and distinctive, weaker hint of video. |
| **Cairnread** | a cairn is a trail marker | free | free | Calm, memorable, but needs explaining. |
| **Curiopage** | curious plus page | free | free | Good meaning, similar to many "curio" names. |
| Readaloft | read plus aloft | free | free | Pretty, hard to spell. |
| Yarnlearn | yarn (story) plus learn | free | free | Playful, weaker for research. |

Taken on .com (still free on .app): Clarivid, Learnloom, Gistreel, Thinkreel, Studyreel, Explainly, Elucidly. Taken on both: Gistly, Lumora, Notelit, Pagelight, Tutorly.

Recommendation: **Wondergist** if you want a friendly brand that works in every country (easy to pronounce in Chinese, Vietnamese and Indonesian), **Scholarreel** if you want search to find you by the words people type. Both need the same domain steps as in `LAUNCH_PLAN.md` section 3. Keeping **Paperlit** is still fine; the work then is only to buy `paperlit.app`.

## 5. Interactive guides

- Each page has its own guide that opens the first time you visit it: Home, New video, Library, a video, Read, Check, Account. The landing page and the pricing page have none.
- The guide points at the real control and, for most steps, **waits for you to do it** (click the highlighted tab, type in the highlighted box) before it moves on. Steps that would cost a video (like switching on interactive mode) only explain.
- There is no quick skip. Closing it (X or Esc) asks "Leave the guide?" first. A person who cannot do a step gets "Skip this step" after 7 seconds.
- A round **Guide** button sits at the bottom left of every app page and plays that page's guide again. The profile menu entry and the Help page button also open it.
- Works on phones (the card stays on screen above the bottom bar).
- Text is in all 9 languages.

## 6. Decisions we need

| # | Decision | My suggestion |
|---|---|---|
| D1 | Name | Wondergist or Scholarreel (section 4), or keep Paperlit |
| D2 | Logo | Option 5 for now; final one after the name |
| D3 | Should packs include in-depth answers | Yes, 3 per pack video, up to 30 a month |
| D4 | Build order for "hard to replace" | 1 and 2 first, then 3, then 4 and 5 |
| D5 | Tell us what the teachers or students you know would pay for (class workspace) | Ask 3 teachers before building idea 3 |

Earlier decisions D1 to D9 in `LAUNCH_PLAN.md` still apply (render runner, Cloudflare, e-mail).
