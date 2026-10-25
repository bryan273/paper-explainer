---
last_updated: 2026-10-25T18:30:00Z
---

# Architecture Design

## System Overview
Paper Explainer is a Vite React SPA with an Atoms Cloud backend. The supplied static player and demos are served from `public/explainer/`. The player is embedded unmodified in a 16:9 iframe. Full-video requests are saved to the `full_video_requests` entity.

## Tech Stack
React, TypeScript, Tailwind, shadcn/ui, react-router-dom, @metagptx/web-sdk, FastAPI (auto-generated entity routes).

## Module Design
| Module | Responsibility | Key Files |
|--------|---------------|-----------|
| Prefs | UI language (en/zh) strings and light/dark theme, persisted in localStorage | src/lib/prefs.tsx |
| Demos | Loads /explainer/index.json, builds the player URL, formats request numbers | src/lib/demos.ts |
| Layout | Header (nav, language toggle, theme toggle) and footer | src/components/SiteLayout.tsx |
| Home | Hero plus demo cards | src/pages/Index.tsx |
| Watch | Iframe player, EN/中文 video toggle, locked request form, "How it is made" note | src/pages/Watch.tsx |
| Requests API | Anonymous create for full_video_requests (email, arxiv_id, note, ui_lang, source_arxiv) | app/backend/routers/full_video_requests.py |

## Tech Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Preview end detection | PlayerOnEnd callback plus polling of window.__done | The player is same-origin and must not be modified |
| Request number | PE- followed by the zero-padded DB id | Stable and unique |

## File Tree Plan
public/explainer/** (bundle), src/pages/{Index,Watch}.tsx, src/lib/{prefs.tsx,demos.ts}, src/components/SiteLayout.tsx

## Implementation Guide
Do not edit public/explainer/player.html. The player URL is /explainer/player.html?script=/explainer/<arxiv>/script_<lang>.json&auto&limit=20.
