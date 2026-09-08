# IGCSE / O Level Urdu — official curriculum reference

Pulled directly from Cambridge International's own syllabus documents (linked at the bottom). This is what a standard, exam-board-aligned redesign of the app would map onto.

## First: which syllabus is your son actually registered for?

Cambridge runs **three different Urdu qualifications**, and they're not interchangeable — worth confirming before we redesign around one of them:

| Code | Name | Level | Character |
|---|---|---|---|
| **3247** | First Language Urdu | O Level | Literature-heavy — ghazals, nazmein, prose essays by canonical authors. Half the qualification is literary analysis. |
| **3248** | Second Language Urdu | O Level | Practical/communicative — no literature. Reading, functional writing, grammar, translation. |
| **0539** | Urdu as a Second Language | IGCSE | Same practical character as 3248, plus a Listening paper and an optional Speaking component. |

**My read:** given what's already built — vocabulary, comprehension, functional writing genres (email, application, report), grammar drills, no poetry or literary essay content — this app lines up closely with **3248 (O Level Second Language Urdu)**, and closely enough with **0539** that most content would transfer either way. It does **not** currently match **3247**, which would need a real content pivot toward poetry and prescribed prose texts. Worth confirming which one his school has him registered for before locking the next design phase around it.

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

## 0539 — IGCSE Urdu as a Second Language (close cousin)

**Assessment objectives:** Reading (AO1), Writing (AO2), Listening (AO3), Speaking (AO4, optional). Weighting: Reading/Writing/Listening roughly equal thirds; Speaking separately endorsed.

**Paper 1 — Reading and Writing** (2h, 60 marks, 6 exercises): short-answer (8), multiple matching (9), note-making (9), summary ≤100 words (10), functional writing ~120 words (8), extended writing ~200 words (16).

**Paper 2 — Listening** (~35–45 min, 30 marks, 4 exercises): short-answer (8), gap-fill (8), multiple matching (6), multiple-choice (8).

**Component 5 — Speaking** (optional, ~10–12 min, 60 marks): presentation (20), topic conversation (20), general conversation on 2–3 prescribed topics (20). Marked on a 5-level grid per part (Level 5 "very good," down to Level 1 "poor").

**Grading:** A*–G, or Ungraded.

## What this suggests for "segregating into more categories"

Mapped against what's already in the app:

| Syllabus exercise type | Covered today? | Notes |
|---|---|---|
| Short-answer / multiple matching / note-making (Reading) | Partially — Essays' reading comprehension MCQs are close, but not in the exact note-making/matching formats the exam uses | Worth a dedicated **Reading Skills** category matching exam exercise formats exactly |
| Summary writing (≤100 words) | Not yet built | A real gap — summarizing a passage in your own words is a distinct skill from anything currently in the app |
| Functional writing (~120–150 words) | **Yes — this is exactly the Skills section already built** (email, application, report, etc.) | Good validation that this category was the right call |
| Extended writing (~200 words) | Partially — the "Creative Corner" free-writes are close but not scored/structured like an exam composition | Could become its own **Extended Writing / Composition** category, scored against the syllabus's own level descriptors |
| Grammar (sentence transformation, cloze) | Partially — Essays' grammar drills exist but not in cloze/transformation format | A **Grammar Lab** category in the exact exam formats would directly build exam familiarity |
| Translation (English→Urdu) | Not built at all | Only relevant if he's on 3248, not 0539 — a real new category if so |
| Listening | Not built at all | Only relevant if he's on 0539 (IGCSE), not 3248 — would need audio, a genuinely new kind of content, not just new topics |
| Speaking | Not built at all | Same as above — optional component, needs audio recording/playback, a bigger technical lift |

That table is a reasonable starting shape for the "more categories" conversation: Reading Skills, Summary Writing, Functional Writing (exists), Extended Writing/Composition, Grammar Lab, and — only if relevant to his actual registration — Translation and Listening.

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
