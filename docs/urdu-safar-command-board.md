# Urdu Safar — Command Board
*Status snapshot for resuming in a new session. Written in discussion mode — nothing here triggers further build work on its own.*

## Where this stands

You've paused deliberately: the app grew feature-by-feature without a design lock first, and before adding more (Play Store, real backend), you want the design frozen and this history captured so a new session can pick up exactly here — not rediscover it.

## What exists today (live, working)

**Project structure (updated):** the app is no longer one flat HTML file to hand-edit. It's now a small build: `content/` holds one JSON file per topic and per skill, `src/` holds the app's code (logic, CSS, HTML skeleton), and `build/build.js` assembles them into `dist/app.html` — the single file that actually gets published/shipped. See the project's `README.md` for the full layout and how to add new content. This was a pure restructuring, done deliberately before the design lock — the app's behavior, content, and appearance are unchanged; it was checked against the previous single-file version and behaves identically.

**Live app:** runs entirely in the browser — no backend yet. What's published as the Claude Artifact is `dist/app.html`, generated from the structure above.

**Content, two sections on the home screen:**
- **Essays / مضامین** — 17 topics, each with four sections (Vocabulary, Reading, Writing, Grammar), three difficulty levels (Easy/Medium/Hard), a synonym-matching round, a factoid, and an optional "Creative Corner" free-write at Hard difficulty. Topics: the original set built for general IGCSE Urdu, plus 5 pulled from your scanned Kawish index photos, plus 6 you typed directly (museum, sports, village/city life, journey north, plantation drive, water conservation).
- **Skills / صلاحیت** — 10 functional writing skills you asked for (email, application/دخواست, report, book review, blog, tweet, website review, invitation, debate, letter types), each with format points, 3 worked samples, a 3-question practice quiz, and 3 free-write prompts.

**Progress + motivation layer:**
- Star ratings per section, medals (🥇🥈🥉) awarded per completed section based on score.
- Nickname-based "sign up" (not a real account — see decision log).
- A leaderboard: always works locally on-device; opportunistically syncs to a shared board if the viewer happens to be signed into the same Claude account/org as the publisher (rare in practice for outside friends).
- A shareable group code, with an honest in-app caveat that it only connects people within that same account/org limit.

**Content honesty notes carried throughout:** the Kawish PDFs are scanned images with no extractable text, so all authored content (samples, passages, questions) is Claude-written to match topic titles and correct Urdu register — not transcribed from the real textbooks. Book/website review samples deliberately use public-domain or invented titles, never real ones presented as genuine.

## Decision log (why things are the way they are)

| Decision | Why |
|---|---|
| No Google/Facebook/Instagram/email OAuth in the current app | A static single-page artifact has no server to hold OAuth secrets, no fixed domain for redirect URIs, and Instagram has no general sign-in API anymore. Structural, not a build choice. |
| Nickname sign-up + local/shared leaderboard | Chosen as the pragmatic stand-in for "sign up," given the above. Recommended and picked by you at the time. |
| 2-tab home (Essays / Skills) | Your explicit request, replacing an earlier single scrolling page. |
| Group-code feature built despite its reach limit | You chose to add it anyway, with the limitation stated in-app rather than hidden. |
| Moving to Play Store changes the calculus | Once the app needs to survive a device switch and be a real listed product, a real backend stops being optional. |
| Child logs in directly (not a parent-managed account) | Your explicit call, overriding my initial recommendation of parent-managed login — noted so a future session doesn't "fix" this back. |
| Planned stack: Capacitor (Android wrapper) + Firebase (Auth + Firestore) | No-rewrite path for the existing code; Firebase keeps the backend itself off your hands to build/host. Facebook login deliberately deferred (extra Meta review/verification overhead) in favor of email + Google to start. |
| Minimal data collection, simple database | Your explicit constraint. Plan: only email (via Firebase Auth), nickname, and progress/medals — no name, DOB, location, ads, or trackers. Two small Firestore collections (`users/{uid}` for progress, `leaderboard/{uid}` slim public copy). |
| Split single `app.html` into `content/` + `src/` + `build/` before the design lock | You asked directly: continuing as one file wouldn't scale to a full curriculum (50–100+ topics). Content (topics/skills as JSON) is now separate from app code, so growth means adding files, not editing the app. `build/build.js` validates each content file's required fields before assembling `dist/app.html`. |

## Documents already saved to this project
- `real-login-project-scope.md` — why true third-party login needs a backend, and what building one (Firebase/Supabase route) would take.
- `playstore-backend-plan.md` — the full Play Store backend plan: login model, minimal-data table, Firestore schema, Play Console requirements (privacy policy, Data safety form, account deletion, age-group declaration), and build phases.
- This command board.
- `README.md` (project root) and `content/schema/*.md` — the new project structure and the exact fields a topic/skill file needs.

## Explicitly NOT started yet
- No Firebase project created.
- No code has been changed to use Firebase Auth/Firestore — the live app is still 100% localStorage + the Claude db capability.
- No Capacitor wrapping, no Android build, no Play Console listing.

## Open items that are genuinely yours to decide
- **The design lock itself** — which parts of the current app count as "final v1" (feature set, visual design, content scope) versus what's still open to change. Nothing below can be built cleanly without this.
- Play Console's target age-group / content-rating declaration — a legal call about your specific app and audience.
- Whether Facebook login gets added later, or stays out permanently.

## Resuming point for the next session
Once the design is locked: create a free Firebase project and share its config keys → I swap the current nickname/localStorage code for real Firebase sign-in and Firestore reads/writes (still testable as a website) → wrap with Capacitor → build a signed Android package → fill in the Play Console listing, privacy policy, and Data safety form → closed test → release.

# Important Commads
## Backup Script
bash /mnt/storage/projects/Safar/scripts/backup_safar.sh