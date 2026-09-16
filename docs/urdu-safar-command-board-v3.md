# Urdu Safar — Command Board (v3)
*Status snapshot for resuming in a new session. Supersedes v2 — read this one first; older versions are kept for history.*

## How to work this next phase
Slower pace, build one piece at a time, verify it works, then move to the next. Design/scope decisions get locked in writing before any code is written — nothing counts as decided until explicitly confirmed. Scope creep gets flagged directly, not quietly absorbed. If anything is unclear mid-task, pause and ask rather than assume.

Full permissions are granted for routine build/test/backup actions (editing content, running the build, testing in an emulator/browser, running the backup script, committing). Still hold and discuss for genuine scope/design decisions — that hasn't changed.

---

## 1. Where this stands

**Correcting v2:** the syllabus was locked as IGCSE 0539 last session. That was wrong. Verified this session against the official Cambridge syllabus PDF: this app targets **Cambridge O Level Second Language Urdu, syllabus 3248, examination series 2027–2029**. Full detail and what changes because of it: `igcse-olevel-urdu-curriculum-reference.md` and `new-categories-design-3248.md` (supersedes the 0539 version, kept for history).

**What that correction changes:**
- Translation (English→Urdu) is a **required** category (Paper 2, 15/50 marks) — previously scoped out.
- Listening and Speaking are **out of scope entirely** — 3248 doesn't test either (0539 did).
- Grammar Lab is now a direct exam-format match (sentence transformation + MCQ cloze), not just "supporting skill-building."

**New this session:** scoring approach for free-text exercises decided (mixed by difficulty — see §4), Vocabulary Practice confirmed as a new standalone mode and moved to the front of the build order, Gemini API key scoped to build-time image generation only (topic/skill header art + Play Store graphics).

---

## 2. App structure (unchanged from v2)

```
safar/
├── content/
│   ├── topics/           one JSON file per Essay topic + _order.json
│   ├── skills/            one JSON file per Skill + _order.json
│   └── schema/            required fields for a topic/skill file
├── src/
│   ├── app.js              all app logic — router, quiz engine, medals, leaderboard, sign-up
│   ├── styles.css          all styling
│   └── index.template.html the page skeleton
├── build/
│   └── build.js            assembles content/ + src/ into dist/app.html
├── dist/
│   └── app.html             GENERATED — never hand-edit
├── docs/                    planning docs (this file, curriculum reference, category designs)
├── scripts/
│   └── backup_safar.sh      three-layer backup script
└── links.md                 live app URL + Claude Project reference
```

`node build/build.js` produces `dist/app.html`. Storage: `humi-nas` at `/mnt/storage/projects/Safar`. Backed up three ways: local snapshot (`/mnt/storage/project_backups/safar_backup/`), Google Drive, GitHub (`AwaizFatima08/safar`) — all three confirmed working end-to-end as of the previous session.

---

## 3. Development completed until now

**Content, two sections on the home screen:**
- **Essays / مضامین** — 17 topics, each with four sections (Vocabulary, Reading, Writing, Grammar), three difficulty levels, a synonym-matching round, a factoid, and an optional Creative Corner free-write at Hard.
- **Skills / صلاحیت** — 10 functional writing skills, each with format points, 3 worked samples, a 3-question practice quiz, and 3 free-write prompts.

**Progress + motivation layer:** star ratings, medals, nickname sign-up, local + opportunistically-shared leaderboard, shareable group code.

**Content honesty:** all authored content is Claude-written to match topic titles and correct Urdu register, not transcribed from real textbooks (the source Kawish PDFs are scanned images with no extractable text). Book/website review samples use invented or public-domain titles only.

**Infrastructure:** three-layer backup pipeline fixed and confirmed working (GitHub SSH key moved from a repo-scoped deploy key to an account-level key).

---

## 4. Objectives locked

| Decision | Status |
|---|---|
| Syllabus is O Level 3248, not IGCSE 0539 or 3247 | **Locked** — corrected this session, verified against official Cambridge PDF |
| Translation category — required, must be built | **Locked** — reverses the previous (wrong) "out of scope" call |
| Listening/Speaking — out of scope, not building | **Locked** — 3248 doesn't test either |
| Build order: Vocabulary Practice → Reading Skills → Grammar Lab → Translation → Summary Writing → Extended Writing | **Locked** — Vocabulary Practice moved to front this session per the "concentrate on vocabulary and skills" instruction |
| Free-text scoring: mixed by difficulty — auto-score matching/cloze/transformation; self-assess (model answer + checklist) for note-making, summary, translation, extended writing | **Locked** — decided this session |
| Vocabulary gets a standalone practice mode (flashcards, cross-topic quiz, idiom drills, spaced repetition), not just bigger in-topic word lists | **Locked** — decided this session |
| Gemini API key: build-time image generation only, never embedded in the shipped app; used for topic/skill header art and Play Store listing graphics | **Locked** — decided this session; key is security-sensitive, kept out of git |
| Firebase/Firestore backend work comes *after* the content categories are built, not alongside | **Locked**, reaffirmed from v2 |
| No Google/Facebook/Instagram/email OAuth possible in a static artifact page (structural) | **Locked**, from earlier sessions |
| Child logs in directly, not parent-managed, once real accounts exist | **Locked**, your explicit call |
| Planned stack for real backend: Capacitor (Android wrap) + Firebase (Auth + Firestore) | **Locked**, from earlier sessions |
| GitHub SSH access: account-level key, not per-repo deploy keys | **Locked**, from earlier sessions |

**Still open:**
- Home screen navigation redesign (2-tab bar → needs to scale to 8 top-level areas) — architectural prerequisite flagged in `new-categories-design-3248.md`, not yet decided how it should look.
- Extended Writing's self-assess checklist — whether the pattern from Summary Writing/Translation ends up good enough to reuse here, decided once those are built and tried.
- Play Console target age-group / content-rating declaration (legal call, for the Play Store phase).
- Whether Facebook login gets added later, or stays out permanently.

---

## 5. New content categories — locked design summary

Full detail (exercise formats, scoring, content needed, architecture notes) in `new-categories-design-3248.md`. Short version, in build order:

0. **Vocabulary Practice** (build first) — flashcard review, cross-topic word-match quiz, and a new idiom-drill (needs a new idiom-bank content file). Reuses vocab already authored in all 17 topics — no new topic content needed to start.
1. **Reading Skills** — short-answer, multiple matching (both auto-scored), note-making (self-assess). Matches 3248 Paper 1 Ex.1–3.
2. **Grammar Lab** — sentence transformation + multiple-choice cloze, both auto-scored. Matches 3248 Paper 2 Ex.1–2.
3. **Translation** — English→Urdu, self-assess against model translation + checklist. Matches 3248 Paper 2 Ex.4. New, required — wasn't in the old plan.
4. **Summary Writing** — ≤100 words, self-assess. Matches 3248 Paper 1 Ex.4.
5. **Extended Writing / Composition** — ~200 words, self-assess. Matches 3248 Paper 2 Ex.3, the single highest-value exercise in the qualification.

**Dropped from the old plan:** Listening and Speaking — not tested under 3248.

---

## 6. Reference resources identified

**Official Cambridge (3248):**
- Official syllabus PDF, 2027–2029 (the one verified this session): `www.cambridgeinternational.org/Images/721465-2027-2029-syllabus.pdf`
- Syllabus page: `www.cambridgeinternational.org/programmes-and-qualifications/cambridge-o-level-urdu-second-language-3248/`
- Past papers page (thin without a School Support Hub login — the school's own access is the reliable route for full mark schemes and recent papers).

**Endorsed textbooks (3248):**
- Bookmark — *Paper 1: Composition and Translation* and *Paper 2: Language Usage, Summary and Comprehension* (ISBN 9789697587827 / 9789697587957, pub. 2016).
- Cambridge University Press — *Urdu as a Second Language Skills Builder: Reading and Writing* (covers 3248 and 0539; ISBN 9781316609422, pub. 2018).
- Danesh Publications — *Urdu for Cambridge O Level Syllabus 3248* (ISBN 1845221915, pub. 2017).

**Study-aid resources (not authoritative, revision use only):**
- Urdu Clinic for O Level Second Language Urdu 3248 (YouTube/Facebook) — paper-pattern walkthroughs, idiom vocabulary drills, sentence-transformation and cloze-passage technique videos. Notably: idioms are called out repeatedly as a distinct scoring opportunity in Paper 2 — informs the Vocabulary Practice idiom-drill design.
- Third-party past-paper mirrors (PapaCambridge, PastPapers.co, etc.) — same caveat as always, treat as revision material only.

---

## 7. Documents saved to this project

- `igcse-olevel-urdu-curriculum-reference.md` — official Cambridge syllabus reference, corrected to 3248 this session.
- `new-categories-design-3248.md` — corrected category scope, supersedes the 0539 version.
- `new-categories-design-0539.md` — superseded, kept for history only.
- `real-login-project-scope.md`, `playstore-backend-plan.md` — unchanged from earlier sessions.
- `urdu-safar-command-board-v2.md`, `urdu-safar-command-board.md` (v1) — superseded, kept for history.
- `content/schema/*.md` — exact fields a topic/skill file needs; a new `idiom.schema.md` will be added when Vocabulary Practice's idiom bank is built.

---

## 8. Resuming point for the next session

**Immediate next step:** build **Vocabulary Practice** — home-screen navigation redesign first (2-tab bar can't scale to 8 areas), then the flashcard-review and cross-topic word-match modes (pure UI work, reuses existing topic vocab data), then author the idiom bank and add the idiom-drill mode.

**After Vocabulary Practice is verified:** Reading Skills → Grammar Lab → Translation → Summary Writing → Extended Writing, each built and verified before the next starts, per `new-categories-design-3248.md`.

**After all categories are built:** Gemini-generated header art and Play Store graphics (build-time, key kept out of git) → Firebase project → swap localStorage for real Firebase Auth + Firestore → Capacitor Android wrap → emulator testing → signed release build → Play Console listing, privacy policy, Data safety form, prelaunch checks → closed test → release.

**Not yet started:** Vocabulary Practice, Reading Skills, Grammar Lab, Translation, Summary Writing, Extended Writing, Gemini asset generation, Firebase project, Capacitor wrapping, Android build, emulator testing, Play Console listing.
