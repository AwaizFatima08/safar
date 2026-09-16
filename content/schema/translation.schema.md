# Translation content schema

Every file in `content/translation/` matches 3248 Paper 2, Exercise 4 (English→Urdu translation, 15 of that paper's 50 marks) — the exercise the app's design mistakenly dropped when the syllabus was briefly (and wrongly) locked as IGCSE 0539; see `igcse-olevel-urdu-curriculum-reference.md`. Same one-file-per-item + `_order.json` pattern as `content/topics/`. Filename must match the `id` field, and every id must be listed once in `content/translation/_order.json`.

Two exercise shapes per entry, matching the "easier warm-up before full-passage" progression from `new-categories-design-3248.md`:

## Required shape

```json
{
  "id": "kebab-case-unique-id",
  "ur": "Urdu title",
  "en": "English title",

  "warmup": [
    {
      "en": "English sentence to translate",
      "bank": ["Urdu", "word", "tiles", "in", "shuffled", "order"],
      "answer": ["Urdu", "word", "tiles", "in", "correct", "order"]
    }
  ],

  "passage": {
    "en": "English passage, ~150 words, factual/descriptive — matches the exam's Ex.4 style",
    "modelUr": "A model Urdu translation of the full passage",
    "checklist": ["a self-check question the student answers about their own translation"]
  }
}
```

## Scoring

- **`warmup`**: auto-scored — reuses the same sentence-builder tile UI and exact-order check as Essay topics' `writing.build`. This is the "easier" entry point before attempting a full passage.
- **`passage`**: self-assessed, same pattern as Reading Skills' note-making — translation quality (register, idiom, accuracy) isn't something exact-match or keyword-match can judge. The app shows `modelUr` and `checklist` after the student writes their own translation; the student rates themselves.

## Notes for adding an entry

- Aim for 5 items in `warmup` and one `passage` per entry.
- `passage.en` should read like real exam material — a factual or descriptive short passage, not dialogue or a list.
- Run `node build/build.js` after adding or editing a file.
