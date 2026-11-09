# Paperlit v2: every requirement Bryan gave, and where it is handled

Status: todo / done (with the file or test that proves it). Old site (`/repro-suite/*`) stays as it is; v2 lives at `https://bryan273.github.io/paperlit/`.

## Positioning and words
| # | Requirement | Where | Status |
|---|---|---|---|
| R1 | Reposition: knowledge transformation and learning platform. "From information to understanding", "One source, many ways to learn", inputs to five transformations to four outputs, brand promise, five traits. Video stays the main selling point. | Landing | todo |
| R2 | Plain product names that say what the thing does; no model names shown to users; mini apps out of the nav | Nav, landing | todo |
| R3 | Landing built like the /paperlit page he liked (prism: one source to four outputs), better colours, looks like a commercial product | Landing | todo |
| R4 | No filler words; short copy; no em dash | All copy | todo |
| R5 | en, zh, vi, id everywhere; UI chrome follows the UI language, video content follows the video language; no English left in vi | i18n | todo |
| R6 | Footer: product columns, "© {year} Paperlit. All rights reserved."; no team/partners | Footer | todo |

## Navigation and structure
| R7 | Short navbar: the products (Video, Read, Check), Pricing, Help. No long menus | Nav | todo |
| R8 | One profile menu holds everything personal: account, settings, switch or add account, sign out. No separate settings button | Nav | todo |
| R9 | One Dashboard: a member sees theirs, an admin sees the admin dashboard in the same place. Admin is not a public link | /app, /app/admin | todo |
| R10 | Pricing is a page that is always open (no collapsed section with a close button) | /pricing | todo |
| R11 | Support chat at the bottom right of every page | Widget | todo |
| R12 | Help: a real guide with examples (sources, settings, interactive, asking, quiz, plans), and guidance next to the make form | /help, make page | todo |

## Account
| R13 | Log in with email or username; username separate from email; sign up asks country and language (required), source and role (optional); invite code kept | Auth dialog | todo |
| R14 | E-mail confirmation and password reset (works when the mail keys are set) | Auth dialog | todo |
| R15 | Several accounts: switch and add from the profile menu | Profile menu | todo |
| R16 | After log in the first screen is personal: videos in progress, plan, what is left | /app | todo |
| R17 | Credits shown one way everywhere (no "0 free videos" next to credits); credit history and password visible without expanding | /account | todo |
| R18 | Student/teacher: proof photo required, one month of Plus, short wording; approved banner and plan visible | /account, /pricing | todo |
| R19 | Invite a friend: 3 videos | /account | todo |
| R20 | Settings: language, theme, text size, font, reduce motion, purpose (personalisation) | /account | todo |

## Making a video
| R21 | Sources: any web link, pasted text, file upload; one input mode at a time | Make page | todo |
| R22 | Unreadable link stops at the first step with a clear message | Make page | todo |
| R23 | Settings shown first: one video language, length, tone, voice; interactive asked here; Make button at the bottom | Make page | todo |
| R24 | Keeps making when the tab is closed; running job resumes; stages in the UI language | Make page, Dashboard | todo |
| R25 | Videos longer than 5 minutes for Pro and Premium only | Make page | todo |

## Watching (studio)
| R26 | Player with chapters; interactive questions prepared up front, shown inside the video (also full screen), explanation ready at once; chosen per video; monthly count shown | Studio | todo |
| R27 | Quiz: history, reset, final quiz, score; study pack (notes, flashcards) on plans | Studio | todo |
| R28 | Ask: Quick and In-depth, per-plan limits, answers point to the page; same names everywhere | Studio | todo |
| R29 | Shared link is watch only; asking needs an account | Studio | todo |
| R30 | Read the paper next to the video | Studio | todo |

## Pricing and payment
| R31 | Free, Plus, Pro, Premium + Custom (contact). Local prices (89.000đ / 159.000đ / 299.000đ, IDR, CNY), monthly/yearly, saving shown in the card, buttons aligned at the bottom, Plus not overloaded, Pro clearly special | /pricing | todo |
| R32 | Payment: VietQR bank transfer (vi), WeChat/Alipay (zh/en), contact (id); payment screenshot; credit packs | /pricing | todo |
| R33 | Interactive value as questions: 10 videos x about 4 = 40 questions | /pricing | todo |

## Admin
| R34 | Admin grouped by importance (Overview, Revenue, Members, Audience, Videos, Infrastructure, Releases, Feedback), big charts, filters, paging, visitors by country, gateway balance, storage left, proofs as images, approve and mark paid work, grant and ban, releases with PR bullets | /app/admin | todo |

## Read and Check
| R35 | Read: read a paper with an AI that cites the page (Reading Companion agent) | /app/read | todo |
| R36 | Check: reproduced results and asking for a check (Paper Repro Agent data) | /app/check | todo |

## Quality
| R37 | Works well on a phone | all | todo |
| R38 | Every button and flow tested end to end on the live site | tests | todo |
| R39 | One icon set (lucide), one illustration style, consistent assets | all | todo |
| R40 | New address /paperlit/; the old site is left alone | deploy | todo |
