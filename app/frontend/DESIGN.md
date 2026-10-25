# Paper Explainer — Design

## Direction & Layout
- Purpose: authors preview a 20-second cinematic explainer of a paper, then ask for the full video. The mood is academic and calm, like a quiet journal reading room with a dark screening window inside it.
- Defining idea: the page stays light, blue and neutral, while the dark 16:9 player sits in it like a framed screen. The hero places a serif statement next to a "screen" frame that shows the first demo.
- Reference: the supplied player (dark stage with green particles). The page must never restyle it.
- Layout: max width 1120px, 12-column grid. Hero splits 7/5 on desktop and stacks on mobile. Demo cards use 3 columns on desktop, 1 on mobile, with a 24px gap. The Watch page has the player (8 columns) plus a side panel (4 columns) on desktop, stacked on mobile.
- Breakpoints: 640 / 1024. Padding is 20px on mobile and 32px on desktop. Nothing may scroll horizontally at 390px, so every row wraps and the iframe is width 100% with aspect-ratio 16/9.
- Do: serif headings, generous whitespace, thin 1px rules. Don't: emoji, glowing gradients, blue-purple neon, colored left borders, or changes to the player's styling.

## Tokens
- Light: bg #F5F7FA, surface #FFFFFF, ink #0F1B2D, muted #5B6B80, border #DCE3EC, primary #1F4E89 (text on primary #FFFFFF), primary-soft #E6EEF8.
- Dark: bg #0B1220, surface #121B2B, ink #E6ECF4, muted #93A3B8, border #24324A, primary #7FA8DC (text on primary #0B1220), primary-soft #16243A.
- Status: success #2F7D5B, error #B23B3B. Accent use stays scarce: CTAs, the active toggle and the request number only.
- Type: headings "Source Serif 4" 600 (h1 44/1.1 desktop and 34 mobile, h2 28/1.2, h3 20/1.3); body "IBM Plex Sans" 400 at 16/1.6; captions 13/1.4 in muted color; buttons 15/600. Chinese text falls back to "Noto Serif SC" and "Noto Sans SC".
- Radii: buttons and inputs 8px, cards 12px, player frame 14px. Icon buttons are circular with a 40px diameter.
- Depth: 1px borders on surfaces. The player frame gets a shadow of 0 20px 50px -20px rgba(15,27,45,.45). The sticky header is a surface at 90% opacity with backdrop blur 8px.

## Shared Patterns & States
- Header: wordmark, nav, a language toggle (EN / 中文) and a theme toggle (icon button).
- DemoCard: a dark 16:9 thumbnail (CSS particle dots) with the title, arXiv id and a play button.
- PlayerFrame: a 16:9 iframe wrapper with a #000 background.
- LockedPanel: appears after the preview ends. It has a lock icon, the serif heading "Want the full video?" and a form with inline validation errors, a loading state on submit, and a success state that shows the request number.
- Lang toggle on Watch: a segmented control that reloads the iframe.
- Motion: 150ms ease-out hover. The locked panel fades in over 300ms. The page adds no motion of its own.
- Accessibility: 40px minimum targets, a 2px primary focus ring, labelled inputs and aria-labels on icon buttons.

## Media
- No generated imagery. The real visual is the supplied player and its videos. Card thumbnails use simple CSS dot fields on #05080F, an abstract stand-in that is acceptable because the actual video sits one click away.
