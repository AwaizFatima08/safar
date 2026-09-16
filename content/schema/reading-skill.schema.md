# Reading Skills content schema

Every file in `content/reading-skills/` is one entry matching 3248 Paper 1, Exercises 1–3 (short-answer, multiple matching, note-making — 26 of that paper's 50 marks). Same one-file-per-item + `_order.json` pattern as `content/topics/`. Filename must match the `id` field, and every id must be listed once in `content/reading-skills/_order.json`.

Unlike Essay topics, the passages here should read like the exam's actual text types (Exercise 1 is explicitly "advertisement, brochure, leaflet, guide, report, manual, instructions, newspaper/magazine article" — not a narrative story), and there are no difficulty levels — these mirror one fixed exam format, like `content/skills/`.

## Required shape

```json
{
  "id": "kebab-case-unique-id",
  "ur": "Urdu title",
  "en": "English title",

  "shortAnswer": {
    "passage": "Urdu text, ~120-200 words, a practical/factual text type (leaflet, notice, ad, report, etc.)",
    "questions": [
      { "q": "question in Urdu", "answers": ["acceptable single-word/phrase answer", "an accepted variant spelling/phrasing"] }
    ]
  },

  "multipleMatching": {
    "paragraphs": [
      { "label": "A", "ur": "a short paragraph/notice" }
    ],
    "statements": [
      { "ur": "a statement that matches exactly one paragraph by meaning, not word overlap", "match": "A" }
    ]
  },

  "noteMaking": {
    "passage": "Urdu text, ~200-250 words, longer than the short-answer passage",
    "headings": [
      { "key": "kebab-case-key", "ur": "heading text students note points under" }
    ],
    "modelNotes": {
      "kebab-case-key": ["a model note point", "another model note point"]
    },
    "checklist": [
      "a self-check question the student answers about their own notes, in Urdu or English"
    ]
  }
}
```

## Scoring, per `new-categories-design-3248.md`

- **Short-answer**: auto-scored. A typed answer counts as correct if it matches (or contains, or is contained in) any string in that question's `answers` list, after trimming whitespace/punctuation — not an exact-string match, since Urdu spelling varies.
- **Multiple matching**: auto-scored. Each statement's chosen paragraph label is compared to `match`.
- **Note-making**: self-assessed. The app shows `modelNotes` and `checklist` after the student writes their own notes; the student rates themselves (not auto-scored) — there's no single correct set of notes.

## Notes for adding an entry

- `id` doesn't have to match an Essay topic's id, but reusing one (e.g. `home-family`) keeps the theme consistent across categories — it's still tracked as separate content/progress from that Essay topic.
- Aim for 5 questions in `shortAnswer`, 5 paragraphs/statements in `multipleMatching`, and 3 headings in `noteMaking` — the UI doesn't hard-require these counts, but keep new entries consistent with existing ones.
- Run `node build/build.js` after adding or editing a file.
