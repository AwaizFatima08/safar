# IGCSE / O Level Urdu — official curriculum reference

Pulled directly from Cambridge International's own syllabus documents (linked at the bottom). This is what a standard, exam-board-aligned redesign of the app would map onto.

## Confirmed: Cambridge O Level Second Language Urdu, syllabus 3248 (2027–2029)

**Locked 2026-09-16, correcting an earlier wrong lock.** A previous session's command board recorded this app's syllabus as IGCSE 0539 — that was wrong. Verified directly against the official Cambridge syllabus PDF (`3248_y27-29_sy.pdf` / `721465-2027-2029-syllabus.pdf`, byte-identical copies): this app targets **3248, O Level Second Language Urdu, for examination series 2027, 2028 and 2029**.

Cambridge runs three different Urdu qualifications — not interchangeable:

| Code | Name | Level | Character |
|---|---|---|---|
| **3247** | First Language Urdu | O Level | Literature-heavy — ghazals, nazmein, prose essays by canonical authors. Half the qualification is literary analysis. Not a match — this app has no poetry/literary-essay content. |
| **3248** | Second Language Urdu | O Level | **This app's syllabus.** Practical/communicative — no literature. Reading, functional writing, grammar, translation. No Listening or Speaking component. |
| **0539** | Urdu as a Second Language | IGCSE | Close cousin of 3248, but adds a required Listening paper and an optional Speaking component, and drops Translation. Not this app — do not build Listening/Speaking. |

**What changes from the old (wrong) 0539-based plan:**
- **Translation (English → Urdu, ~150 words, 15/50 marks on Paper 2)** is a **required** category — it was previously scoped out as "0539 doesn't need it." It does, under 3248.
- **Listening and Speaking drop out of scope entirely** — 3248 doesn't test either. Nothing to build here; any earlier scoping notes for a Listening category are moot.
- Paper 2 also has a **sentence transformation** exercise (5 marks) that 0539 doesn't have in the same form.

## 3248 — O Level Second Language Urdu (most likely match)

**Assessment objectives:** Reading (AO1) and Writing (AO2) only. Weighting: 35% Reading, 65% Writing.

**Paper 1 — Reading and Writing** (1h45, 50 marks, 5 exercises):
1. Short-answer questions — 8 marks
2. Multiple matching — 9 marks
3. Note-making — 9 marks
4. Summary writing, max 100 words — 10 marks
5. Functional writing, ~150 words — 14 marks

**Paper 2 — Grammar, Writing and Translation** (1h30, 50 marks, 4 exercises):
1. Sentence transformation — 5 marks
2. Multiple-choice cloze passage — 10 marks
3. Extended writing, ~200 words — 20 marks
4. English-to-Urdu translation, ~150 words — 15 marks

**Grading:** A*, A, B, C, D, E, or Ungraded.

## 0539 — IGCSE Urdu as a Second Language (not this app — kept for reference only)

**Assessment objectives:** Reading (AO1), Writing (AO2), Listening (AO3), Speaking (AO4, optional). Weighting: Reading/Writing/Listening roughly equal thirds; Speaking separately endorsed.

**Paper 1 — Reading and Writing** (2h, 60 marks, 6 exercises): short-answer (8), multiple matching (9), note-making (9), summary ≤100 words (10), functional writing ~120 words (8), extended writing ~200 words (16).

**Paper 2 — Listening** (~35–45 min, 30 marks, 4 exercises): short-answer (8), gap-fill (8), multiple matching (6), multiple-choice (8).

**Component 5 — Speaking** (optional, ~10–12 min, 60 marks): presentation (20), topic conversation (20), general conversation on 2–3 prescribed topics (20). Marked on a 5-level grid per part (Level 5 "very good," down to Level 1 "poor").

**Grading:** A*–G, or Ungraded.

## Category build plan against 3248 (locked)

Mapped against what's already in the app — see `new-categories-design-3248.md` for full exercise-format detail per category:

| Syllabus exercise type | Covered today? | Notes |
|---|---|---|
| Short-answer / multiple matching / note-making (Reading, Paper 1 Ex.1–3) | Partially — Essays' reading comprehension MCQs are close, but not in the exact note-making/matching formats the exam uses | **Reading Skills** category, exact exam formats |
| Summary writing, ≤100 words (Paper 1 Ex.4) | Not yet built | New **Summary Writing** category |
| Functional writing, ~150 words (Paper 1 Ex.5) | **Yes — this is exactly the Skills section already built** (email, application, report, etc.) | Validated — no change needed |
| Sentence transformation + multiple-choice cloze (Paper 2 Ex.1–2) | Partially — Essays' grammar drills exist but not in cloze/transformation format | New **Grammar Lab** category |
| Extended writing, ~200 words (Paper 2 Ex.3) | Partially — "Creative Corner" free-writes are close but not scored/structured like an exam composition | New **Extended Writing** category |
| Translation, English→Urdu, ~150 words (Paper 2 Ex.4) | Not built at all | New **Translation** category — required under 3248 |
| Listening / Speaking | N/A | **Out of scope — 3248 does not test either** |

Build order locked in `urdu-safar-command-board-v3.md`: **Vocabulary Practice → Reading Skills → Grammar Lab → Translation → Summary Writing → Extended Writing.**

## Past papers and mark schemes

Cambridge's own past papers live behind their **School Support Hub**, which requires a registered-school login — not something openly downloadable. Their public past-papers page lists what's freely available:
- [Cambridge IGCSE Urdu as a Second Language (0539) — past papers page](https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-urdu-as-a-second-language-0539/past-papers/)

Several third-party sites mirror past Cambridge papers and mark schemes (commonly used by students for revision) — I haven't verified these are authorized copies, so treat them as a study aid rather than an authoritative source, and prefer the official Cambridge route (through his school) for anything you want to rely on precisely:
- [PapaCambridge — Urdu 0539 IGCSE Past Papers](https://pastpapers.papacambridge.com/papers/caie/igcse-urdu-0539)
- [pastpapers.co — Urdu Second Language 0539](https://pastpapers.co/cie/?dir=IGCSE%2FUrdu-Second-Language-0539)

His school (or wherever he's registered for the exam) is the most reliable way to get the real, current mark schemes and recent past papers — school accounts get full School Support Hub access that the public internet doesn't.

## Sources

- [Cambridge IGCSE Urdu as a Second Language (0539) syllabus, 2025–2027](https://www.cambridgeinternational.org/Images/664633-2025-2027-syllabus.pdf)
- [Cambridge O Level First Language Urdu (3247) syllabus, 2027](https://www.cambridgeinternational.org/Images/721463-2027-syllabus.pdf)
- [Cambridge O Level Second Language Urdu (3248) syllabus, 2024–2026](https://www.cambridgeinternational.org/Images/634455-2024-2026-syllabus.pdf)
- [Cambridge IGCSE Urdu as a Second Language (0539) — programme page](https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-urdu-as-a-second-language-0539/)
- [Cambridge O Level Urdu as a Second Language — programme page](https://www.cambridge.org/us/education/subject/languages/urdu/cambridge-o-level-urdu-second-language)
