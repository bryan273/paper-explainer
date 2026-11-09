# Round 2 (9 Nov): what Bryan and the team asked, and where each item is handled

| # | Request | Status |
|---|---|---|
| A1 | Hero: replace "From information to understanding" with a "learn anything, your way, we make it easy" slogan plus a line that says what the product does | done: Landing h1 "Learn anything, your way." + a line that says what it does (4 languages written by hand) |
| A2 | Vietnamese text: fix typos and broken diacritics; use a font that renders Vietnamese | done: root cause was our font files (latin only, 51 Vietnamese letters missing, drawn by a fallback font); now Inter and Space Grotesk ship their Vietnamese and latin-ext parts. 34 Vietnamese texts corrected after a proofreading pass (scripts/vi-review.py) |
| A3 | Payment: choose the currency yourself (not tied to the page language); the first choice is the country set in the profile; several methods per currency | done: lib/currency.ts useCurrency (choice, else profile country from the backend, else page language); switch on the pricing page, the landing plans and inside the payment window; VND: Techcombank/BIDV, CNY: WeChat/Alipay, IDR: QRIS |
| A4 | Payment dialog opens slowly (QRIS etc.): make it instant | done: the window opens with the code at once (order created in the background, one order per currency), payment images preloaded; test: under 1.5 s |
| A5 | New page languages: Japanese, Korean, Spanish, French, German (with English, Chinese, Vietnamese, Indonesian) | done: Japanese, Korean, Spanish, French, German through dictionaries (src/i18n, scripts/i18n-*.{cjs,py}), loaded only when chosen; language menu lists all nine |
| A6 | "Talk to us" becomes "Contact us"; "Send my proof" becomes "Verify" | done |
| A7 | Billing FAQ: not centered, longer answers, a professional heading | done: two columns (heading left, answers right), 9 longer answers, heading "Plans and payment, explained" |
| B1 | Free: 5 videos a week, up to 3 minutes, no "+3" in the table; the 3 welcome videos (interactive included) are told in the sign-up banner | done (backend PLANS/TIERS/quotaFor rolling 7 days; welcome videos told in the sign-up line) |
| B2 | Plus 80, Pro 150, Premium 280 videos a month | done |
| B3 | "Interactive mode" (a feature of a video, not extra videos): Free 3 a week, Plus 40, Pro 75, Premium 140 a month; no "(~40 questions)" | done (renamed everywhere, backend counts free per week) |
| B4 | In-depth answers per video: 5, 20, 35, 50 | done |
| B5 | Quick answers, quiz and final quiz, notes and flashcards, answers pitched to your level: make sure each really exists | checked: all four exist; notes/flashcards were already paid-only, answers pitched to your level now paid-only in the backend to match the table |
| B6 | Videos kept: 7 days, 30 days, 90 days, 270 days | done (r2_maintain.py 7/30/90/270) |
| B7 | Credit packs follow Pro (pack videos are Pro videos) | done as "pack videos are Pro videos (up to 10 min)"; asked in LAUNCH_PLAN D3 |
| B8 | Pricing analysis (cost per video, interactive, in-depth, revenue estimate) in the admin view and in a document | done: Admin > Pricing model (measured cost per video, editable assumptions, plan margins, packs, scenario) and docs/LAUNCH_PLAN.md section 7 |
| B9 | Advice: credits or videos, limits on pages and characters, how to explain it to users | done: docs/LAUNCH_PLAN.md section 7 (videos not credits, 2 for long videos, 60,000 characters cap) |
| C1 | First-visit guide: skippable, can be replayed | done: components/site/Tour.tsx, 7 steps pointing at the real controls, skip, keys, replay from Help and the profile menu |
| C2 | Switch account like ChatGPT: click the profile picture, pick an account | done: avatar opens accounts first (current with a tick, others one click), then settings |
| C3 | More attractive, professional design and wording; clear language, not AI-sounding | done in part: new wording across pricing, help, payment; design kept, details polished |
| D1 | Faster video rendering than GitHub Actions, free | analysed: render is 45 s setup + 6 min work, so the fix is more cores (self-hosted runner) not another host; LAUNCH_PLAN section 6 |
| D2 | Name suggestions, domain, e-mail (also for China), Cloudflare, full prices, in one document | done: docs/LAUNCH_PLAN.md (names with live domain checks, prices, e-mail, Cloudflare) |
| D3 | Logo options | done: docs/brand (6 options, preview PNG) |
| E1 | Test everything thoroughly | done: v2e2e.py 40 checks, v2round2.py 80 checks, phone overflow on 7 pages |
