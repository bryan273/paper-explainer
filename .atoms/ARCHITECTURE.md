---
last_updated: 2026-10-27T12:40:00Z
---

# Architecture Design

## System Overview
Paper Explainer is the flagship app of Repro Suite: a single-page React site (left sidebar shell + main column) that turns an arXiv paper into a narrated video. It calls the external `explainer-render` function for real videos and stats, and the Atoms Cloud backend for orders and feedback. The old in-browser draft player, the local `/explainer` bundle and the demo list were removed.

## Tech Stack
Vite + React + TypeScript, Tailwind (base utilities only; the Repro Suite CSS system in `src/index.css` does the styling), @metagptx/web-sdk entities, FastAPI auto-generated entity routes.

## Module Design
| Module | Responsibility | Key Files |
|--------|---------------|-----------|
| Design system | Repro Suite tokens (light/dark, Inter/JetBrains Mono, cards, pills), shell, sections | src/index.css, src/components/Shell.tsx |
| Prefs | EN/中文 strings + theme, theme key `repro.theme2` | src/lib/prefs.tsx |
| Render API | `?recent=1`, POST queue, `?id=` poll, share/download helpers, `?v=` links | src/lib/explainer.ts |
| Sections | Hero + stats, Make (5 steps, EN/中文, share), Examples (lightbox), How, Pricing + order, Feedback | src/components/sections/*, src/pages/Index.tsx |
| Video feedback | Thumbs + comment as one row (kind "video") | src/components/VideoFeedback.tsx |
| Orders | Studio orders (email, arxiv, language, notes, status "new") | app/backend/routers/studio_orders.py |
| Feedback | rating, use_case, comment, email, arxiv, kind | app/backend/routers/feedback.py |

## Tech Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Video data | External explainer-render function (no key) | Real finished videos and real check counts |
| Polling | GET `?id=` every 5 s until done/failed | Matches the documented contract |
| Cached jobs | Show result immediately with a note | Server returns existing videos at once |
| Share link | `?v=<arxiv>` opens that video in the examples lightbox | Stable, no extra routes |

## File Tree Plan
src/pages/Index.tsx, src/components/{Shell.tsx,media.tsx,VideoFeedback.tsx}, src/components/sections/*, src/lib/{prefs.tsx,explainer.ts,feedback.ts}

## Implementation Guide
Never reintroduce `.json`/`.md` requests (the published host serves index.html for them). Keep all new text in both EN and ZH; keep tables `full_video_requests`, `made_previews`, `studio_orders`, `feedback`.
