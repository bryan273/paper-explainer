# Paperlit launch plan: name, domain, e-mail, hosting, rendering, pricing

Written 9 November 2026 for Bryan and the team. Prices and availability were checked on that day; they change, so check again before paying.

## 1. Decisions we need from you

| # | Decision | Our recommendation |
|---|---|---|
| D1 | The name | Keep **Paperlit** and buy `paperlit.app`, or move to **PaperAha** (`paperaha.com` is free). See section 2. |
| D2 | Which logo | Option 3 "Play page" for Paperlit (it says paper becomes video), option 4 "Aha bubble" if the name becomes PaperAha. See section 9. |
| D3 | What "packs follow Pro" means | We built it as: pack videos are **Pro videos** (up to 10 minutes, interactive mode included). Prices of packs did not change. Tell us if you meant something else, for example pricing packs at Pro's price per video. |
| D4 | A 7 or 10 minute video counts as 2 videos | Built this way (before: 1 credit per started 3 minutes, so a 10 minute video cost 4). Say if you want 10 minutes to count as 1. |
| D5 | Prices stayed the same while allowances went up (Plus 50 to 80, Pro 120 to 150, Premium 250 to 280) | Fine: a video costs us cents (section 7). Keep the prices. |
| D6 | A monthly cap on in-depth answers | Add one (for example Plus 150, Pro 400, Premium 800 a month) on top of the per-video number. It is invisible in normal use and stops one heavy user from costing more than they pay. Not built yet. |
| D7 | Faster video rendering | Run the renderer on a stronger free machine: an Oracle Cloud "Always Free" server or a spare PC as a GitHub self-hosted runner. Needs an account from you. See section 6. |
| D8 | Move the website to Cloudflare Pages | Yes: faster worldwide, deploys by itself on every merge (today a person copies the build), free. Needs access to your Cloudflare account. See section 5. |
| D9 | E-mail | Resend for app e-mails, Cloudflare Email Routing for receiving, optional Aliyun DirectMail for Chinese mailboxes. Needs a domain first (D1). See section 4. |

## 2. Name

"Paperlit" is fine but you said you do not love it. What a good name needs here: short, easy to say in English, Chinese, Vietnamese and Indonesian, about understanding (not only papers, since articles and notes work too), and a domain we can buy.

Availability checked through the registries (RDAP) on 9 Nov 2026:

| Name | Idea | .com | .app | .ai | Notes |
|---|---|---|---|---|---|
| **Paperlit** (keep) | papers, lit up | taken | **free** | **free** | `getpaperlit.com`, `trypaperlit.com`, `usepaperlit.com` and `paperlitapp.com` are free too |
| **PaperAha** | the "aha" moment of a paper | **free** | **free** | **free** | "Aha" is understood in all four languages (啊哈, à há, aha); the .com is free |
| **Studyova** | study + nova | **free** | **free** | **free** | Sounds like a product; less about understanding |
| **Brightgist** | the gist, made clear | **free** | **free** | **free** | Easy to read, harder to say for Chinese speakers |
| **Learnlit** | learning, lit up | taken | **free** | **free** | Close to Paperlit, broader than papers |
| Gistcast | the gist as a show | taken | free | free | |
| Papergist | the gist of a paper | taken | free | free | |
| Lumio, Clario, Lucidly, Explainly, Gistly, Mindcast, Learnova and about 40 more | | taken | mostly taken | mostly taken | Short English words are gone on every ending |

Our pick: **keep Paperlit on `paperlit.app`** (people already know it, the logo and site exist, `.app` is cheap and forces HTTPS), or **PaperAha on `paperaha.com`** if you want a fresh start with a .com. Before deciding, search the name in the trademark databases of China (CNIPA), Vietnam (IP Viet Nam), Indonesia (DJKI) and WIPO; we did not do a legal search.

## 3. Domain: where and how much

Buy at **Cloudflare Registrar**: it sells at cost (no markup), includes WHOIS privacy, and the DNS is then already in Cloudflare, which we need for e-mail and hosting. Prices on 9 Nov 2026 ([cfdomainpricing.com](https://cfdomainpricing.com/)):

| Ending | First year | Each renewal |
|---|---|---|
| .com | US$10.46 | US$10.46 |
| .app | US$8.20 | US$14.20 |
| .xyz | US$12.30 | US$11.20 |
| .me | US$16.56 | US$16.56 |
| .co | US$30.00 | US$30.00 |
| .io | US$32.00 | US$50.00 |
| .academy | US$36.20 | US$36.20 |
| .ai | US$80.00 | US$80.00 (sold for 2 years at a time) |

Steps: dash.cloudflare.com, then Domain Registration, then Register Domains, search, pay by card. It is live in minutes. If the name is for China too, note that a site **hosted inside mainland China** needs an ICP licence; a site hosted outside (Cloudflare, GitHub) does not, but loads more slowly there (section 5).

## 4. E-mail on our own domain

There are four separate jobs. One domain covers all of them.

| Job | Service | Cost | Limits |
|---|---|---|---|
| App e-mails: confirm e-mail, reset password, receipts | **Resend** | Free | 3,000 a month, 100 a day, 3 domains. Pro: US$20 a month for 50,000, no daily limit ([pricing](https://resend.com/pricing)) |
| App e-mails to Chinese mailboxes (qq.com, 163.com, school mail) | **Aliyun DirectMail** (optional) | 2,000 free in total, then about US$0.29 or ¥2 per 1,000 | 200 free a day; the daily quota starts at 2,000 and moves with reputation ([limits](https://help.aliyun.com/en/direct-mail/product-overview/limits), [billing](https://help.aliyun.com/en/direct-mail/billing-methods)) |
| Receiving mail at hello@ / support@ | **Cloudflare Email Routing** | Free | Forwards to any inbox (Gmail, QQ, Outlook); sending is not included |
| Writing from hello@ in your own mail app | Gmail "Send mail as" through Resend's SMTP | Free within Resend's limits | Or a real mailbox: Zoho Mail or Tencent Exmail, check their current free tiers |

The code already supports Resend and Aliyun: a Chinese address goes through Aliyun when it is set up, any other through Resend, and each falls back to the other.

**Setup with Resend (about 20 minutes):**
1. Buy the domain (section 3).
2. resend.com, then Domains, then Add domain. Use a subdomain for sending, for example `mail.paperlit.app`, so receiving mail on the main domain is never affected.
3. Resend shows three DNS records (SPF and MX on `send.mail…`, DKIM on `resend._domainkey…`). Add them in Cloudflare, then DNS. Copy the values exactly and do not create a second SPF record for the same name. Verification usually takes about 15 minutes.
4. Resend, then API Keys, then create a key with "Sending access".
5. Supabase dashboard (project `wzdkroxbfrlqijbeiwpk`), then Edge Functions, then Secrets: add `RESEND_API_KEY` (the key) and `MAIL_FROM` = `Paperlit <no-reply@mail.paperlit.app>`. The part before @ can be anything; the domain must be the verified one. Set these yourself, do not paste the key in a chat.
6. Tell us: we then test sign-up confirmation and password reset end to end.

From that moment new accounts must confirm their e-mail; existing accounts are not affected.

**Aliyun DirectMail (only if many users have Chinese mailboxes):** an Alibaba Cloud account (the China site needs identity verification), DirectMail console, add the sending domain and verify it with the TXT, SPF and MX records it shows, create a sender address such as `no-reply@dm.paperlit.app`, create a RAM user with DirectMail permission and an AccessKey, then set `ALIYUN_DM_KEY_ID`, `ALIYUN_DM_KEY_SECRET` and `MAIL_FROM` (the same address as the sender). Our code calls the Hangzhou endpoint; an account on the international site may need another one. Tell us which site you use and we adjust it.

**Without a domain** the only option is sending from a Gmail address over SMTP (about 500 a day, more often in spam, needs a code change). Not recommended for a product.

## 5. Hosting and what Cloudflare can do for us

| Cloudflare product | What it gives us | Cost |
|---|---|---|
| **Pages** | Hosts the website. Builds and deploys by itself on every merge to main (today the build is copied by hand into another repository). Global CDN, preview link for every pull request, HTTPS on our domain | Free: unlimited bandwidth and requests, 500 builds a month |
| **R2** | Already stores our videos | Free up to 10 GB, no download fees |
| **Email Routing** | hello@ and support@ forwarded to your inbox | Free |
| **Turnstile** | An invisible "are you human" check on sign-up, better than limiting by IP address | Free |
| **Web Analytics** | Privacy-friendly visitor numbers | Free |
| **Registrar** | Domains at cost | Section 3 |

**China:** neither GitHub Pages nor Cloudflare has servers inside mainland China, so pages load more slowly there and the `*.pages.dev` address is sometimes blocked; a custom domain usually works. Fully fast in China needs hosting inside China with an ICP licence (Aliyun or Tencent Cloud), which is a separate project.

**Moving the site to Pages (once you give access):** connect the `paper-explainer` repository, root folder `v2`, build command `npm ci && npm run build`, output `dist`, add the domain. The old addresses on bryan273.github.io keep redirecting.

## 6. Making video rendering faster

We measured a recent render on GitHub Actions: **about 45 seconds of setup and 6 minutes of rendering** (writing the script, voice, drawing the animations, checking each part, joining). So moving to another free host does not help by itself; the work needs more processor cores, or less work.

| Option | Speed gain | Cost | Effort |
|---|---|---|---|
| **Oracle Cloud Always Free** server (4 ARM cores, 24 GB) as a GitHub self-hosted runner; our workflow already reads the runner name from `RENDER_RUNNER`, and we can raise parallel parts from 3 to 4 | Medium, and no waiting for GitHub runners | Free (needs a card for sign-up) | You create the account; we set up the runner |
| A spare PC or laptop as a self-hosted runner | Large if it has 8 or more cores | Free (electricity) | Must stay on |
| Skip the per-part visual check for Free videos | About 1 minute faster | Free | Small code change; slightly more drawing mistakes on Free |
| GitHub larger runners | Large | About US$0.03 to 0.06 a minute | No work, not free |
| Google Cloud Run, Hugging Face Spaces | Small or none | Free tiers too small or slower CPUs | Not worth it |

Recommendation: Oracle Always Free runner first, and measure again.

## 7. Pricing

### The plans now (live after this release)

| | Free | Plus | Pro | Premium |
|---|---|---|---|---|
| Price a month (CNY / VND / IDR) | 0 | ¥33 / 89.000đ / Rp79.000 | ¥59 / 159.000đ / Rp139.000 | ¥109 / 299.000đ / Rp259.000 |
| Videos | 5 a week | 80 a month | 150 a month | 280 a month |
| Longest video | 3 min | 5 min | 10 min | 10 min |
| Interactive mode | 3 videos a week (plus 3 in the first week) | 40 videos | 75 videos | 140 videos |
| In-depth answers per video | 5 | 20 | 35 | 50 |
| Notes and flashcards, answers pitched to your level | no | yes | yes | yes |
| Videos kept | 7 days | 30 days | 90 days | 270 days |

Yearly is 10 months' price. Packs: 5, 20 or 50 Pro videos for ¥19, ¥59, ¥129 (89.000đ … ; see the site). A video of up to 5 minutes counts as 1, longer as 2. Payment in yuan, dong or rupiah, chosen by the buyer, defaulting to the country in the profile.

### What a member costs us

Measured cost per video is stored for every render (`cost_usd`) and the new **Admin > Pricing model** tab reads it. We could not read it from outside the admin, so the numbers below are estimates from the token prices we pay (RKAPI) and the size of a render:

- A video: about ¥0.05 to ¥0.30 in AI calls (more for 10 minutes). Rendering on GitHub and storage on R2 are free at our size.
- Interactive mode on a video: about ¥0.01 to ¥0.03 (writing the questions and explanations).
- A quick answer: under ¥0.01. An in-depth answer: about ¥0.02 to ¥0.30 depending on the model and how much of the source it reads. This is the line to watch.

Worst case per month (every allowance fully used, longest videos, every in-depth answer used): Plus about ¥40 to ¥330, which is more than its ¥33 price, almost entirely from in-depth answers (80 videos × 20 answers). Expected case (people use about 40% of videos and ask 1 to 2 in-depth questions per video): Plus about ¥4 to ¥15, a margin of 55 to 90%. Hence decision D6.

The admin tab lets you change every assumption (cost per video, usage share, number of members per plan) and shows the margin per plan, the margin of packs and a monthly revenue scenario next to the real income of the last 30 days.

### Credits or videos?

Users understand **videos**, not credits. Keep saying "videos" everywhere (we did), count a long video as 2 and say so next to the length choice (done), and keep "credits" only in the history list of the billing page. Credits from plans and packs never expire, which removes the "use it or lose it" stress and costs us little.

### Limits on pages and characters

A video reads at most the first 60,000 characters of a source (about 25 pages; for a PDF at most 60 pages), so a long book never costs more than a short paper. The Ask tab reads the same text. We now say this in Help ("What you can put in"). We recommend also showing it under the upload box: "We use about the first 25 pages; for a book, upload the chapter you need."

### How to explain the plans to users

One line per plan on the card (done), the full table below, and the FAQ "What counts as one video?" and "What is interactive mode?" (done). Interactive mode is named as a feature of a video, never as extra videos.

## 8. What changed on the site in this round

See `v2/ROUND2.md` for the request-by-request list, including: new headline, Vietnamese accents fixed (our font files had no Vietnamese letters, so the browser mixed in another font), currency chosen by the buyer, faster payment window, five more languages, the first-visit guide, the account switcher in the profile menu, and the pricing changes above.

## 9. Logo options

Files: `docs/brand/logo-1-lit-page.svg` to `logo-6-open-book.svg`, preview: `docs/brand/logo-options.png` (each mark large, with the name, on dark, and at 32 and 16 pixels).

1. **Lit page** (today's mark, tidied): a page giving off light.
2. **Prism**: one beam in, several ways out, like the landing page. Weak at 16 pixels.
3. **Play page**: a page whose folded corner is a play button. Clearest at small sizes. Our pick for Paperlit.
4. **Aha bubble**: a spark in a speech bubble. Our pick if the name becomes PaperAha.
5. **p play**: a lowercase p whose bowl holds a play button.
6. **Open book**: an open book with a small sun rising from it.
