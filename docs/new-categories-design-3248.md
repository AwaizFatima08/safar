# New Content Categories — Design & Scope (O Level 3248)

**Supersedes `new-categories-design-0539.md`.** That doc was scoped against the wrong syllabus (IGCSE 0539); this app targets **Cambridge O Level Second Language Urdu, syllabus 3248** — see `igcse-olevel-urdu-curriculum-reference.md` for the correction and verification. The old doc is kept for history only; don't build from it.

**Locked this session (2026-09-16):**
- Scoring approach: **mixed by difficulty** — auto-scorable formats (multiple matching, multiple-choice cloze, sentence transformation) get real right/wrong scoring like the rest of the app; genuinely open-ended free-text exercises (note-making, summary, translation, extended writing) get **self-assessment against a model answer + checklist**, same pattern as Creative Corner.
- Vocabulary gets a **new standalone Vocabulary Practice mode** (flashcards, cross-topic word-match quiz, idiom drills, spaced repetition) — not just bigger word lists inside each topic.
- Build order: **Vocabulary Practice → Reading Skills → Grammar Lab → Translation → Summary Writing → Extended Writing.** Vocabulary Practice moved to the front because "concentrate on vocabulary and skills practice" was the top-level ask; it also reuses vocab already authored in all 17 Essay topics, so it ships without new content-authoring first.
- Gemini image generation (build-time only, key never shipped in the app — see below): **topic/skill header art and Play Store listing graphics.** Not vocabulary-card illustrations.

---

## 0. Vocabulary Practice (build first)

Not a direct exam-paper match — 3248 doesn't have a standalone vocabulary paper — but it's the AO2 skill that underpins every writing exercise (`W3: manipulate ... vocabulary in context`), and it's the thing you asked to prioritize.

**Reuses existing data:** every topic in `content/topics/*.json` already has a 10-word `vocab` array with example sentences and (often) a synonym. 17 topics × 10 words = 170 words, ready to pull from immediately — no new content files needed for the word bank itself.

**New content needed:** an idiom bank. 3248 prep resources (the Urdu Clinic notes you sent) repeatedly call out idioms as a distinct, high-value vocabulary skill for Paper 2. Idioms aren't a field on the topic schema — add `content/idioms/idioms.json`, a flat list: `{ id, ur (the idiom), meaning_ur, meaning_en, example_ur, example_en }`. Start with ~30 idioms pitched at O Level difficulty.

**Modes:**
- **Flashcard review** — cross-topic deck, same flip-card UI as today's per-topic vocab, but drawing from all topics at once, with a simple spaced-repetition weighting (words marked "still learning" resurface sooner than words marked "know it").
- **Word-match quiz** — same MCQ engine as today's per-topic vocab quiz (meaning + synonym rounds), just pulling its pool from all 170 words instead of one topic's 10, so a session doesn't repeat the same small set.
- **Idioms drill** — matching quiz: idiom → meaning, and meaning → idiom, same pattern as the synonym round.

**Scoring:** MCQ formats score automatically like the rest of the app (stars, medals). Flashcard review isn't scored — completion/repetition count only, same as today's flashcard pass before a quiz.

---

## 1. Reading Skills (build second)

Matches 3248 Paper 1, exercises 1–3 (26 of 50 marks on that paper).

- **Short-answer** — a passage (120–200 words), 4–6 questions answered in a word or short phrase. Scored by keyword/phrase match (Urdu has spelling variation, so match loosely, not exact-string).
- **Multiple matching** — a set of short texts/statements, match each to one of several headings/categories. Auto-scorable; tap-to-pair UI similar to the existing synonym-matching round.
- **Note-making** — a longer passage, student picks out key points under supplied headings. **Self-assess**: show a model set of notes + a checklist of the points a good answer should include; student compares and marks themselves. No single correct answer, so this doesn't get auto-scored.

**Content needed per topic:** one passage + the three exercise sets built around it. Reuse existing Essay topics' reading passages where sensible rather than authoring from scratch.

---

## 2. Grammar Lab (build third)

Matches 3248 Paper 2, exercises 1–2 (15 of 50 marks on that paper) — this is a real exam-format match now, unlike under 0539 where grammar was only tested indirectly.

- **Sentence transformation** — five short sentences, transform each per a given prompt (e.g. change tense, change to negative) without changing the original meaning. Auto-scorable: compare the transformed sentence against the expected form (allow for minor whitespace/punctuation variance).
- **Multiple-choice cloze passage** — a short passage with gaps, each gap a 4-option MCQ testing verb agreement, comparatives, postpositions, articles, vocabulary-in-context. Auto-scorable, same engine as the existing grammar practice MCQs.

**Content needed:** a bank of cloze passages and transformation sets, graded Easy/Medium/Hard like Essay topics, each targeting a specific grammar point (verb agreement, gender/number, postpositions, tense, comparatives).

---

## 3. Translation (build fourth — new, required under 3248)

Matches 3248 Paper 2, exercise 4 (15 of 50 marks) — the exercise the old 0539-based plan dropped entirely. Candidates translate a short English passage (~150 words) into Urdu.

- **Format:** an English passage, student writes the Urdu translation.
- **Scoring: self-assess.** Translation quality (register, idiom, accuracy) isn't something exact-match or keyword-match can judge. Show a model Urdu translation plus a checklist (key vocabulary used correctly, verb agreement, register appropriate to the passage) for the student to mark themselves against.
- **Easier warm-up format, for lower difficulty:** sentence-level translation with a word bank (reusing the existing sentence-builder tile UI from Essays' Writing section) before working up to full-passage translation at Medium/Hard.

**Content needed:** a bank of English passages/sentences with model Urdu translations and a self-check checklist per passage.

---

## 4. Summary Writing (build fifth)

Matches 3248 Paper 1, exercise 4 (10 of 50 marks). Condense a passage (200–300 words) into ≤100 words, own words, no verbatim copying.

- **Scoring: self-assess** — model summary + a checklist of the 4–5 points a good summary should include. Same rationale as `new-categories-design-0539.md` gave for this one: no free-text rubric-scoring capability exists yet, so this is practice + self-check, not exam-accurate marking, and should be labeled honestly as such in the UI.

**Content needed per passage:** source passage, model 100-word summary, checklist.

---

## 5. Extended Writing / Composition (build sixth — most complex)

Matches 3248 Paper 2, exercise 3 (20 of 50 marks — the single highest-value exercise in the whole qualification). ~200-word continuous prose response to a prompt with specified purpose/format/audience.

- **Scoring: self-assess** against a simplified checklist derived from the syllabus's AO2 writing objectives (W1–W5: clear communication, coherent paragraphing with linking devices, accurate grammar/vocabulary in context, punctuation/spelling control, appropriate register/format). Same open question as before: whether this checklist pattern (validated by Summary Writing and Translation, built earlier in the order) is good enough, or whether this stays closer to today's un-scored Creative Corner. Decide once the earlier self-assess categories have been tried.

**Content needed:** a bank of prompts (with purpose/format/audience specified, matching real exam framing) plus the self-check checklist.

---

## Architecture notes (for whoever builds this)

- New content types need: a `content/<kind>/` directory + `_order.json` + a schema doc under `content/schema/`, following the exact pattern `content/topics/` and `content/skills/` already use — see `README.md` for the mechanism.
- `build/build.js`'s `loadContent()` helper already generalizes over "a kind with required fields" — extending it for new content kinds is additive, not a rewrite.
- The home screen currently has a 2-tab bar (Essays/Skills). Adding 6 more top-level areas needs a navigation redesign before the first new category ships — a scrollable/wrapping tab bar or a card-menu home screen, not 8 squeezed tabs. Do this once, up front, so every category after the first slots into an already-scalable layout instead of re-litigating navigation each time.
- Reuse existing UI primitives wherever the exercise shape matches: the MCQ engine (`renderReading`'s question loop), the sentence-tile builder (`renderWriting`'s `drawBuild`), and the free-write step (`renderCreativeStep`) already cover most of what these categories need. Self-assess exercises are the one genuinely new UI pattern — model answer/checklist shown after submission, "I marked myself: got it / partially / not yet" recorded instead of auto-scored correct/incorrect.

## Gemini image generation — constraint and use

The API key provided is for build-time use only. `dist/app.html` is a single self-contained static file with no server — the Play Store package (via Capacitor) is this same static file wrapped in a WebView. Any API key embedded in it is trivially extractable (view-source in a browser, or unzip the APK) and would let anyone drain the quota. So: Gemini is called from a local script during content authoring, output images get saved as static assets and baked into the build; the key itself lives in a local, gitignored file, never in `content/`, `src/`, or `dist/`.

**Confirmed use:** topic/skill header art (one illustrative image per Essay topic and per Skill) and Play Store listing graphics (app icon, feature graphic, screenshots) — not per-vocabulary-word illustrations.
