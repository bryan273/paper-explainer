# Paperlit v2: every requirement Bryan gave, and where it is handled

Status: todo / done (with the file or test that proves it). Old site (`/repro-suite/*`) stays as it is; v2 lives at `https://bryan273.github.io/paperlit/`.

## Positioning and words
| # | Requirement | Where | Status |
|---|---|---|---|
| R1 | Reposition: knowledge transformation and learning platform. "From information to understanding", "One source, many ways to learn", inputs to five transformations to four outputs, brand promise, five traits. Video stays the main selling point. | Landing | done: pages/Landing.tsx (prism, verbs, who it is for, promise) |
| R2 | Plain product names that say what the thing does; no model names shown to users; mini apps out of the nav | Nav, landing | done: nav says Video, Read, Check; no model names; mini apps gone |
| R3 | Landing built like the /paperlit page he liked (prism: one source to four outputs), better colours, looks like a commercial product | Landing | done: Landing prism from /paperlit, new palette (ink, violet, amber) |
| R4 | No filler words; short copy; no em dash | All copy | done: short copy; grep finds no em dash in v2/src |
| R5 | en, zh, vi, id everywhere; UI chrome follows the UI language, video content follows the video language; no English left in vi | i18n | done for the UI (4 languages on every page); some server error texts are still English, the admin page is English |
| R6 | Footer: product columns, "© {year} Paperlit. All rights reserved."; no team/partners | Footer | done: components/site/SiteFooter.tsx |

## Navigation and structure
| R7 | Short navbar: the products (Video, Read, Check), Pricing, Help. No long menus | Nav | done: SiteHeader (Video, Read, Check, Pricing, Help) |
| R8 | One profile menu holds everything personal: account, settings, switch or add account, sign out. No separate settings button | Nav | done: menus.tsx ProfileMenu; test v2e2e 'profile menu holds...' |
| R9 | One Dashboard: a member sees theirs, an admin sees the admin dashboard in the same place. Admin is not a public link | /app, /app/admin | done: /app sidebar shows Admin only for admins; admin page needs an admin session |
| R10 | Pricing is a page that is always open (no collapsed section with a close button) | /pricing | done: pages/Pricing.tsx |
| R11 | Support chat at the bottom right of every page | Widget | done: SupportChat (AI answers from product facts + message the team); live test |
| R12 | Help: a real guide with examples (sources, settings, interactive, asking, quiz, plans), and guidance next to the make form | /help, make page | done: pages/Help.tsx (13 topics) + guide beside the make form |

## Account
| R13 | Log in with email or username; username separate from email; sign up asks country and language (required), source and role (optional); invite code kept | Auth dialog | done: AuthDialog (email or username, country and language required, source and role optional, invite code) |
| R14 | E-mail confirmation and password reset (works when the mail keys are set) | Auth dialog | done: links open /paperlit/ (backend #73); needs the mail keys to send |
| R15 | Several accounts: switch and add from the profile menu | Profile menu | done: switch/add in profile menu, Account > Accounts; current account always remembered |
| R16 | After log in the first screen is personal: videos in progress, plan, what is left | /app | done: pages/app/Home.tsx |
| R17 | Credits shown one way everywhere (no "0 free videos" next to credits); credit history and password visible without expanding | /account | done: one 'videos you can make' number with its breakdown; billing tab shows orders and history |
| R18 | Student/teacher: proof photo required, one month of Plus, short wording; approved banner and plan visible | /account, /pricing | done: StudentVerify (photo or PDF required, Plus month + 50 videos) |
| R19 | Invite a friend: 3 videos | /account | done: InviteCard (3 videos) |
| R20 | Settings: language, theme, text size, font, reduce motion, purpose (personalisation) | /account | done: Account > Preferences |

## Making a video
| R21 | Sources: any web link, pasted text, file upload; one input mode at a time | Make page | done: NewVideo tabs Link / Paste text / Upload file |
| R22 | Unreadable link stops at the first step with a clear message | Make page | done: failed page explains and offers paste text or upload; backend stops unreadable links at the reading step |
| R23 | Settings shown first: one video language, length, tone, voice; interactive asked here; Make button at the bottom | Make page | done: settings first, one video language, interactive switch, Make button at the bottom |
| R24 | Keeps making when the tab is closed; running job resumes; stages in the UI language | Make page, Dashboard | done: Watch progress page polls; tab can close; Home lists running videos |
| R25 | Videos longer than 5 minutes for Pro and Premium only | Make page | done: 7 and 10 min locked for Plus/Free |

## Watching (studio)
| R26 | Player with chapters; interactive questions prepared up front, shown inside the video (also full screen), explanation ready at once; chosen per video; monthly count shown | Studio | done: questions inside the player (also full screen), explanation ready, per video, monthly count |
| R27 | Quiz: history, reset, final quiz, score; study pack (notes, flashcards) on plans | Studio | done: QuizPanel |
| R28 | Ask: Quick and In-depth, per-plan limits, answers point to the page; same names everywhere | Studio | done: AskPanel Quick / In-depth with left count and page chips |
| R29 | Shared link is watch only; asking needs an account | Studio | done: guest watching a shared video sees watch-only prompts |
| R30 | Read the paper next to the video | Studio | done: Source tab (PaperPane) |

## Pricing and payment
| R31 | Free, Plus, Pro, Premium + Custom (contact). Local prices (89.000đ / 159.000đ / 299.000đ, IDR, CNY), monthly/yearly, saving shown in the card, buttons aligned at the bottom, Plus not overloaded, Pro clearly special | /pricing | done: 4 plans + Custom, local prices, yearly saving in the card, buttons aligned, Pro and Premium dark cards |
| R32 | Payment: VietQR bank transfer (vi), WeChat/Alipay (zh/en), contact (id); payment screenshot; credit packs | /pricing | done: PayPanel (VietQR, WeChat, Alipay, Indonesia via chat, screenshot), packs |
| R33 | Interactive value as questions: 10 videos x about 4 = 40 questions | /pricing | done: '10 interactive videos (about 40 questions)' |

## Admin
| R34 | Admin grouped by importance (Overview, Revenue, Members, Audience, Videos, Infrastructure, Releases, Feedback), big charts, filters, paging, visitors by country, gateway balance, storage left, proofs as images, approve and mark paid work, grant and ban, releases with PR bullets | /app/admin | done: hub admin ported into /app/admin with v2 colours |

## Read and Check
| R35 | Read: read a paper with an AI that cites the page (Reading Companion agent) | /app/read | done: pages/app/Read.tsx (Reading Companion agent) |
| R36 | Check: reproduced results and asking for a check (Paper Repro Agent data) | /app/check | done: pages/app/Check.tsx (real results + request); the detailed run log still opens the older page |

## Quality
| R37 | Works well on a phone | all | done: no horizontal overflow on 10 pages at 390 px (mock and live) |
| R38 | Every button and flow tested end to end on the live site | tests | done: v2e2e.py 36/36 (mocked backend), v2live.py on the live site |
| R39 | One icon set (lucide), one illustration style, consistent assets | all | done: lucide icons only, one mark, one palette |
| R40 | New address /paperlit/; the old site is left alone | deploy | done: https://bryan273.github.io/paperlit/; /repro-suite/* untouched |
