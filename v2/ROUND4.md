# Round 4: everything Bryan asked on 10 Nov (pilot until done)

Status legend: [x] done and tested, [~] done, waiting on something outside, [d] decision for Bryan. Details and numbers: `docs/ROUND4.md`.

## A. Making a video
- [x] A1 The Make video bar is fixed to the bottom of the screen (above the phone navigation), with a summary of the choices; the chat bubble no longer covers it.
- [x] A2 9 video languages, one per video; "Also make it in" adds up to 3 more, each its own video. No "English + Chinese" choice. Japanese, Korean, Spanish, French and German voices and fonts added to the renderer.
- [x] A3 "Your own style": the member writes the narration style.
- [x] A4 The focus line goes into the script prompt (unchanged path, checked in the renderer).
- [x] A5 Lengths up to 20 minutes (Premium); every started 5 minutes = 1 credit.
- [x] A6 Teachers: Premium 20 minute lessons plus edits; class plans as a custom offer (help center, pricing FAQ).
- [x] A7 Upload and pasted text work; a bug found live: short pasted texts (300 to 500 characters) were rejected as "garbled". Fixed.
- [x] A8 Faster render, free: one layout repair round instead of two, four parts drawn at once.
- [x] A9 A failed video shows its reason to the member; admin lists the reasons.
- [~] A10 Quality: Japanese render in progress at the time of writing (title came out in Japanese).

## B. Editing a finished video
- [x] B1 Edit under the video: part, kind of change, note; makes a new version that keeps the rest of the script word for word.
- [x] B2 Edits per video by plan (Free 1, Plus 2, Pro 3, Premium 3), no credit used, counted on the original across versions.

## C. Tutorials
- [x] C1 Next / Back only.
- [x] C2 An example picture in every step (sources, languages and length, styles, a question inside the video, making progress, the finished video, answers, quiz, edit, research, verdicts).
- [x] C3 "Tutorial" in the top bar of every app page; removed from the profile menu and the bottom left.
- [x] C4 Closing a tutorial turns automatic tutorials off for good; finishing one marks that page.
- [x] C5 Every app page: home, new video, library, video, research, check, account.

## D. Navigation, layout, consistency
- [x] D1 One language switch: profile menu when signed in, globe for guests only.
- [x] D2 Products named like the pages; the "Ask, quiz and notes" card opens an example video instead of the make page; nav "Research".
- [x] D3 What is new: own page `/whats-new`, linked in the footer; nothing on the hero.
- [x] D4 Footer: same slogan as the hero, support chat, tutorials, what is new, 9 languages.
- [x] D5 Theme Auto (follows the device) by default; the old code saved the theme on the first visit and never followed the device again.
- [x] D6 Texts rewritten for the new plans everywhere (pricing, help, chat facts, sign up, home, student offer).
- [x] D7 Help center rewritten (16 topics).

## E. Pricing and plans
- [x] E1 New plans, safe when fully used: Plus 29, Pro 55, Premium 99 CNY; 20 / 40 / 80 videos with edits.
- [x] E2 Admin pricing model shows every worst-case cell as amount x cost each.
- [x] E3 Research questions counted per plan; reproduction checks are requests.
- [x] E4 Prices lowered (33 -> 29, 59 -> 55, 109 -> 99).
- [x] E5 Costs measured per feature from live data (admin Videos and usage).

## F. Admin
- [x] F1 No sideways scrollbar (tabs wrap; checked live).
- [x] F2 Real admin sees real members only; QA admin sees test data, with a banner saying which view it is.
- [x] F3 Hourly numbers for the last 7 days (48 hours, Hourly).
- [x] F4 Cost per feature table (video per minute, quick, in-depth, interactive, research, edits).
- [x] F5 Why videos failed.
- [x] F6 Solid cards and viewer, instant row updates (round 3), wording.

## G. Support
- [x] G1 The assistant offers "Send to the team" when it cannot help; the owner gets an e-mail once e-mail is set up; admin sees it in Feedback.
- [x] G2 Ask with a picture: paste or attach; tested live (the answer explained the arrow in a test diagram).

## H. Research and decisions
- [x] H1 Models and costs per feature (docs/ROUND4.md section 2).
- [x] H2 E-mail and domain options (section 6).
- [x] H3 Render speed options (section 5).
- [d] Decisions D1 to D5 in docs/ROUND4.md section 7.

## I. Quality
- [x] I1 Tests: v2e2e 40/40, v2round2 83/83, v2round4 39/39 (mocked backend); live: API pools, admin views, pricing, picture questions.
- [x] I2 A stale tab after a release reloads once instead of breaking.
- [~] Japanese, Korean, Spanish, French and German texts of this round: the translation gateway's daily limit was reached; they show in English until it resets. Vietnamese, Indonesian and Chinese are complete.
