# Urdu Safar — Command Board (v2)
*Status snapshot for resuming in a new session. Supersedes the previous command board — read this one first; the old one is kept for history.*

## How to work this next phase
Slower pace, build one piece at a time, verify it works, then move to the next. Design/scope decisions get locked in writing before any code is written — nothing counts as decided until explicitly confirmed. Scope creep gets flagged directly, not quietly absorbed. If anything is unclear mid-task, pause and ask rather than assume.

---

## 1. Where this stands

The app grew feature-by-feature without a design lock first. Before adding more (Play Store, real backend), the design was frozen and history captured. Syllabus is now confirmed, four new content categories are scoped (not yet built), and the backup pipeline (local + Drive + GitHub) is fully working after a NAS-side SSH fix this session.

---

## 2. App structure (as of last restructuring)

No longer one flat HTML file. Small build system:

```
safar/
├── content/
│   ├── topics/           one JSON file per Essay topic + _order.json (display order)
│   ├── skills/            one JSON file per Skill + _order.json
│   └── schema/            required fields for a topic/skill file
├── src/
│   ├── app.js              all app logic — router, quiz engine, medals, leaderboard, sign-up
│   ├── styles.css          all styling
│   └── index.template.html the page skeleton
├── build/
│   └── build.js            assembles content/ + src/ into dist/app.html
├── dist/
│   └── app.html             GENERATED — never hand-edit. This is what gets published/shipped.
├── docs/                    planning docs (login scope, Play Store plan, command board)
├── scripts/
│   └── backup_safar.sh      three-layer backup script
└── links.md                 live app URL + Claude Project reference
```

`node build/build.js` produces `dist/app.html` — validates required fields, checks filename/id matches, and fails loudly on missing `_order.json` entries rather than shipping something broken. This restructuring was checked against the previous single-file version and behaves identically — no feature change, pure reorganization.

Storage: `humi-nas` at `/mnt/storage/projects/Safar`. Backed up three ways — local snapshot, Google Drive sync, GitHub (`AwaizFatima08/safar`).

---

## 3. Development completed until now

**Content, two sections on the home screen:**
- **Essays / مضامین** — 17 topics, each with four sections (Vocabulary, Reading, Writing, Grammar), three difficulty levels (Easy/Medium/Hard), a synonym-matching round, a factoid, and an optional "Creative Corner" free-write at Hard difficulty.
- **Skills / صلاحیت** — 10 functional writing skills (email, application/دخواست, report, book review, blog, tweet, website review, invitation, debate, letter types), each with format points, 3 worked samples, a 3-question practice quiz, and 3 free-write prompts.

**Progress + motivation layer:**
- Star ratings per section; medals (🥇🥈🥉) per completed section based on score.
- Nickname-based "sign up" (not a real account).
- Leaderboard: local on-device always; opportunistically syncs to a shared board if the viewer is signed into the same Claude account/org as the publisher.
- Shareable group code, with an honest in-app caveat about its account/org reach limit.

**Content honesty:** Kawish PDFs are scanned images with no extractable text — all authored content is Claude-written to match topic titles and correct Urdu register, not transcribed from the real textbooks. Book/website review samples use public-domain or invented titles only.

**Curriculum research:**
- Confirmed syllabus: **IGCSE 0539 (Urdu as a Second Language)**, not O Level 3248 or O Level 3247.
- Translation exercise (a 3248-only requirement) is **not** relevant to this app going forward.
- Full official syllabus mapping — assessment objectives, paper structure, marking scheme — is in `igcse-olevel-urdu-curriculum-reference.md`.

**New category design (scoped, not built):** see Section 5 below.

**Infrastructure fixed this session:**
- Diagnosed and fixed a GitHub push failure in `backup_safar.sh` — root cause was an SSH key (`flocount-nas`) scoped as a repo-specific deploy key on the `flocount` repo rather than registered at the GitHub account level. Removed the deploy key, re-registered the same key as an account-level SSH key, set upstream tracking for `main` → `origin/main`. All three backup layers (local, Drive, GitHub) now confirmed working end-to-end.

---

## 4. Objectives locked

| Decision | Status |
|---|---|
| Syllabus is IGCSE 0539, not 3248 or 3247 | **Locked** — confirmed this session |
| Translation category — out of scope | **Locked** — 0539 doesn't require it |
| New category build order: Reading Skills → Grammar Lab → Summary Writing → Extended Writing | **Locked** — agreed this session |
| Listening/Speaking: scope now, build later; Speaking stays deferred (optional component, needs recording not just playback) | **Locked** |
| Firebase/Firestore backend work comes *after* the four content categories are built, not alongside | **Locked** — reaffirmed this session after a proposal to start it in parallel; reasoning: avoids rebuilding the data layer twice against a moving content set |
| No Google/Facebook/Instagram/email OAuth possible in a static artifact page (structural, not a build choice) | **Locked**, from earlier sessions |
| Child logs in directly, not parent-managed, once real accounts exist | **Locked**, your explicit call |
| Planned stack for real backend: Capacitor (Android wrap) + Firebase (Auth + Firestore), minimal data collection (email, nickname, progress only) | **Locked**, from earlier sessions |
| GitHub SSH access: broadened to account-level key rather than kept as per-repo deploy keys | **Locked** — your explicit choice, trading strict per-repo scoping for simplicity across multiple NAS projects |

**Still open (genuinely yours to decide):**
- The design lock itself — which parts of the current app are "final v1" (feature set, visual design, content scope) vs. still open.
- Note-making exercise scoring approach (self-assess against a model list, vs. simplified to auto-scorable multiple-choice) — flagged in the category design doc, unresolved.
- Summary Writing / Extended Writing scoring approach — same open question, no free-text rubric-scoring capability exists yet.
- Listening audio sourcing — real human recording vs. text-to-speech Urdu voice. Not decided; changes the scope of that category significantly once it's actually built.
- Play Console target age-group / content-rating declaration (legal call, for when Play Store phase starts).
- Whether Facebook login gets added later, or stays out permanently.

---

## 5. New content categories — locked design summary

Full detail (exercise formats, scoring approach, content needed per category, and the risk/critique notes for each) is in `new-categories-design-0539.md`, produced this session. Short version:

1. **Reading Skills** (build first) — short-answer, multiple matching, note-making. Matches 0539 Paper 1 exercises 1–3 (27 of 60 marks). Note-making has no clean auto-scoring fit yet — open decision above.
2. **Grammar Lab** (build second) — cloze/gap-fill passages, graded Easy/Medium/Hard. Not a direct 0539 paper match (0539 tests grammar indirectly) — treat as supporting skill-building, label accordingly so it's not mistaken for exam simulation.
3. **Summary Writing** (build third) — condense a passage to ≤100 words in own words. New free-text skill; no existing scoring mechanism fits — likely self-assessment against a model summary + checklist until an AI-scoring capability exists.
4. **Extended Writing / Composition** (build fourth) — ~200-word composition matching 0539 Paper 1 exercise 6 (16 of 60 marks, highest single-exercise value). Same scoring problem as Summary Writing, one level up in complexity (needs level-descriptor judgment, not just content-point checking).
5. **Listening** (scope only, not building) — matches 0539 Paper 2 (30 marks): short-answer, gap-fill, multiple matching, multiple-choice. Needs real audio content and a player with replay — the one category where content can't be authored the same way (text) as everything else.
6. **Speaking** — deferred indefinitely. Optional component; needs recording, not just playback, on top of everything Listening needs.

---

## 6. Reference resources identified

**Official Cambridge:**
- [Published Resources page for 0539](https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-urdu-as-a-second-language-0539/published-resources/) — Cambridge's own endorsed/recommended resource list.
- [Official past papers page for 0539](https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-urdu-as-a-second-language-0539/past-papers/) — thin without a School Support Hub login; his school is the reliable route for full mark schemes and recent papers.
- Official syllabus PDF: [2025–2027 syllabus](https://www.cambridgeinternational.org/Images/664633-2025-2027-syllabus.pdf) — already the basis of the curriculum reference doc.
- **Learner Guide** (for examination from 2021) — explains what students need to know/understand/demonstrate, and includes a real examiner-marked sample response. Directly useful groundwork for the Extended Writing scoring problem above.

**Endorsed textbooks:**
- *Cambridge O Level Urdu as a Second Language Skills Builder: Reading and Writing* — covers 0539's reading/writing components.
- *IGCSE Urdu (0539) Coursebook* by Mujeeb ur Rehman — Cambridge-endorsed, colour-coded to separate 0539 from 3248 content; useful as a second-opinion check on which exercise types belong in this syllabus.

**Third-party past-paper mirrors (unverified, study-aid only, not authoritative):**
PapaCambridge, PastPapers.co, PapersDaddy, XtraPapers, EduTV Online, IGCSE Union Egypt. Same caveat as always — treat as revision material, not a guaranteed-accurate source; prefer the school's official access for anything relied on precisely.

---

## 7. Documents saved to this project

- `real-login-project-scope.md` — why third-party login needs a backend.
- `playstore-backend-plan.md` — full Play Store backend plan (login, data table, Firestore schema, Play Console requirements, build phases).
- `igcse-olevel-urdu-curriculum-reference.md` — official Cambridge syllabus reference and content mapping.
- `new-categories-design-0539.md` — detailed scope for the four new categories + Listening, produced this session.
- `urdu-safar-command-board.md` (v1, superseded by this file) and `README.md` — project structure.
- `content/schema/*.md` — exact fields a topic/skill file needs.

---

## 8. Resuming point for the next session

**Immediate next step:** start building **Reading Skills** — pick one existing Essay topic to pilot it on, build just the short-answer exercise type first, verify it works, then add multiple matching and note-making to that same topic before moving to Grammar Lab.

**Before that build starts, worth deciding (not blocking, but cheaper to settle now):**
- How note-making will be scored (self-assess vs. simplified multiple-choice).

**After all four categories are built and verified:** create a free Firebase project → swap nickname/localStorage for real Firebase Auth + Firestore reads/writes (testable as a website first) → wrap with Capacitor → build a signed Android package → Play Console listing, privacy policy, Data safety form → closed test → release.

**Not yet started:** Firebase project, any Firestore code, Capacitor wrapping, Android build, Play Console listing, Listening/Speaking build.
