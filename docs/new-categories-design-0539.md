# New Content Categories — Design & Scope (IGCSE 0539)

Confirmed: your son is registered for **0539 (IGCSE Urdu as a Second Language)**. This drops Translation entirely (that's a 3248-only exercise) and adds a real Listening paper. This doc scopes all four text-based categories plus Listening. Build order, per your call: **Reading Skills → Grammar Lab → Summary Writing → Extended Writing**, one at a time, each verified before the next starts. Listening/Speaking: scoped here, not built yet.

---

## 1. Reading Skills (build first)

Matches 0539 Paper 1, exercises 1–3 (27 of 60 marks — worth the most of the "new" categories).

**Three exercise types, each its own quiz format:**
- **Short-answer** — a passage (120–200 words), 4–6 questions, answer in a few words or a short sentence. Scored by keyword/phrase match, not exact string match (Urdu has spelling variation).
- **Multiple matching** — a set of short texts or statements, match each to one of several categories/headings. Good fit for a drag-or-tap-to-pair UI, similar difficulty to what's already built for synonym-matching in Essays.
- **Note-making** — a longer passage, student picks out key points into a short list (e.g. 5 bullet points from a 200-word passage). Hardest of the three to auto-score cleanly — likely needs a "compare against model answer, self-assess" approach rather than exact matching, since note-making has no single correct answer.

**Content needed per topic:** one passage + 3 exercise sets (short-answer, matching, note-making) built around it. Suggest reusing existing Essay topics' reading passages where possible rather than writing new ones from scratch — less content-authoring work.

**Critique / risk:** note-making is the one exercise type here that doesn't fit the app's existing right/wrong scoring model. Worth deciding now whether "self-assess against a model list" is acceptable, or whether note-making gets simplified to something auto-scorable (e.g. "select the 5 correct points from 8 options") — a compromise that's easier to build but slightly further from the real exam format.

---

## 2. Grammar Lab (build second)

0539's Paper 1 doesn't have a standalone grammar paper the way 3248's Paper 2 does — grammar in 0539 is tested indirectly, inside the reading/writing exercises. So "Grammar Lab" for 0539 is less about matching an exact exam exercise type and more about building the underlying grammar skill that supports everything else.

**Suggested format:** cloze/gap-fill passages (fill in the correct word/form from context or a word bank) — same shape as the existing grammar drills in Essays, just reformatted as short standalone passages rather than single sentences. Multiple-choice cloze is the most reliable to auto-score.

**Content needed:** a bank of gap-fill passages, graded Easy/Medium/Hard like the existing Essay sections, each testing a specific grammar point (verb agreement, gender/number, postpositions, tense).

**Critique:** since this isn't a direct 0539 exam-paper match, it's worth treating as "supporting skill-building" rather than "exam simulation" in how it's labeled in the app — so it doesn't create a false impression that it mirrors a real paper the way Reading Skills does.

---

## 3. Summary Writing (build third)

Matches 0539 Paper 1, exercise 4 (10 of 60 marks). Genuinely new skill — condense a passage into ≤100 words, own words, no copying phrases verbatim from the source.

**Format:** a passage (200–300 words), student writes a summary, submits.

**Critique — this is the real scoring problem:** none of the app's existing content is free-text scored against a rubric; everything so far is MCQ, matching, or short-answer keyword-check. Summary writing needs either (a) a checklist of key points the summary should hit, with the student self-marking against it, or (b) some form of automated comparison. Given the app has no backend/AI-scoring layer yet, (a) — self-assessment against a model summary and a point checklist — is the realistic option for now. Worth being upfront that this is "practice + self-check," not real exam-style marking, until there's a scoring capability to plug in.

**Content needed per passage:** source passage, a model 100-word summary, and a short checklist of the 4–5 points a good summary should include.

---

## 4. Extended Writing / Composition (build fourth — most complex)

Matches 0539 Paper 1, exercise 6 (~200 words, 16 of 60 marks) — the single highest-value exercise in Paper 1.

**Format:** a writing prompt (similar to Creative Corner's free-writes, but scored against 0539's actual level-descriptor bands rather than left unscored).

**Critique — same core problem as Summary Writing, one level up:** scoring extended writing against real level descriptors (content, organization, language accuracy) is qualitative judgment, not something the app's current mechanics do. Realistic options: (a) self-assessment with a simplified rubric derived from the syllabus's level descriptors, turned into a checklist a student (or you) can tick through, or (b) leave it as free-writing practice with no formal score, same as Creative Corner today, just retitled to match the exam format. Given this is the last of the four to build, by the time we get here we'll know whether the self-assessment pattern from Summary Writing worked well enough to reuse, or whether it's better to keep this one score-free.

**Content needed:** a bank of prompts, plus (if going the rubric route) a simplified scoring checklist per band.

---

## 5. Listening — scope only, not building yet

Matches 0539 Paper 2 (30 marks, separate from Paper 1): short-answer (8), gap-fill (8), multiple matching (6), multiple-choice (8).

**What this needs that nothing else does:**
- **Audio content** — real recorded Urdu speech, not text. This is the one category that can't be authored the same way as everything else in the app (Claude-written text matched to topic titles). Someone needs to actually record (or otherwise legitimately source) audio clips.
- **A player**, not just a quiz UI — needs play/pause/replay controls, and the exam format typically allows a passage to be heard twice.
- **Volume** — a real Listening section needs a meaningful number of passages (the syllabus paper has 4 exercises per sitting) to be useful for practice, not just one or two demo clips.

**Critique — the honest constraint here:** everything else in this app is content Claude can write directly. Listening audio can't be generated the same way — it needs either a real human recording Urdu passages (you, or someone else), or a text-to-speech Urdu voice (quality varies, and may not sound natural enough for exam prep). Worth deciding which of those two routes before this becomes a real build item, since it changes the scope significantly — TTS could be scripted and generated in a batch; real recordings are a genuine time commitment per passage. This is worth flagging now precisely because it's the one place where "Claude writes the content" doesn't apply.

**Speaking** — per your earlier answer, staying out of the build queue for now, correctly: it's optional in the syllabus and adds recording (not just playback) on top of everything Listening already needs.

---

## Suggested next step

Start building **Reading Skills** — pick one existing Essay topic to pilot it on, build just the short-answer exercise type first (simplest of the three), verify it works, then add multiple matching and note-making to that same topic before moving to Grammar Lab. That keeps to the one-piece-at-a-time pace on the build side, while this doc covers the "scope everything" side of what you asked for.
