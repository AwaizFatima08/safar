# Summary Writing content schema

Every file in `content/summary-writing/` matches 3248 Paper 1, Exercise 4 (10 of that paper's 50 marks) — condense a passage into no more than 100 words, in the student's own words. Same one-file-per-item + `_order.json` pattern as `content/topics/`. Filename must match the `id` field, and every id must be listed once in `content/summary-writing/_order.json`.

Only one exercise shape — unlike Reading Skills or Translation, there's no auto-scorable warm-up here, since summarizing is inherently open-ended.

## Required shape

```json
{
  "id": "kebab-case-unique-id",
  "ur": "Urdu title",
  "en": "English title",

  "passage": "Urdu source passage, ~200-300 words",
  "modelSummary": "A model Urdu summary of the passage, at most ~100 words",
  "checklist": ["a self-check question the student answers about their own summary"]
}
```

## Scoring

Fully self-assessed, same pattern as Reading Skills' note-making and Translation's passage exercise — summarizing well (hitting the right points, in the student's own words, under the word limit) isn't something exact-match or keyword-match can judge. The app shows `modelSummary` and `checklist` after the student writes their own summary; the student rates themselves.

## Notes for adding an entry

- `passage` should be a real piece of continuous prose (not a leaflet/notice like Reading Skills' short-answer passages) — an article, report, or descriptive piece, matching the exam's Ex.4 source material.
- Aim for 4-5 checklist items: word-limit compliance, coverage of the passage's main points, own-words phrasing (not verbatim copying), and conciseness are the standard checks.
- Run `node build/build.js` after adding or editing a file.
