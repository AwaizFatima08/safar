# Grammar Lab content schema

Every file in `content/grammar-lab/` matches 3248 Paper 2, Exercises 1–2 (sentence transformation + multiple-choice cloze — 15 of that paper's 50 marks). Same one-file-per-item + `_order.json` pattern as `content/topics/`. Filename must match the `id` field, and every id must be listed once in `content/grammar-lab/_order.json`.

Unlike Reading Skills, Grammar Lab **does** get difficulty levels (Easy/Medium/Hard) like Essay topics — per `new-categories-design-3248.md`, this is supporting skill-building rather than a fixed one-shot exam simulation, so scaffolding helps.

## Required shape

```json
{
  "id": "kebab-case-unique-id",
  "ur": "Urdu title",
  "en": "English title",

  "grammarPoint": { "ur": "Urdu name of the grammar point(s) covered", "en": "English name, shown as a hint at Easy difficulty" },

  "cloze": {
    "passage": "Urdu passage with gaps marked inline as (1)_____ (2)_____ etc., in order",
    "gaps": [
      { "opts": ["opt1", "opt2", "opt3", "opt4"], "a": 0, "en": "gloss of the correct answer / the rule it tests" }
    ]
  },

  "transformation": [
    {
      "original": "Urdu sentence to transform",
      "instruction_ur": "the transformation to apply, in Urdu (e.g. \"نفی میں تبدیل کریں\")",
      "instruction_en": "English gloss of the instruction (e.g. \"Change to negative\")",
      "answers": ["expected transformed sentence", "an accepted variant phrasing"],
      "en": "English gloss of the original sentence"
    }
  ]
}
```

## Scoring

Both exercise types are auto-scored, unlike Reading Skills' note-making:
- **Cloze**: each gap is a standard MCQ, sliced down by difficulty like the existing per-topic grammar practice (`sliceOptions`).
- **Transformation**: free-text auto-scored with the same lenient matching as Reading Skills' short-answer (`isShortAnswerCorrect` — accepts an exact match or containment against any string in `answers`, after trimming punctuation/whitespace).

## Notes for adding an entry

- `gaps` must be in the same order as the `(1)`, `(2)`, ... markers in `passage`.
- Aim for 5 gaps and 5 transformation items per entry, each targeting a distinct grammar point (verb agreement, tense, postpositions, comparatives, sentence type) — avoid repeating the same rule twice in one entry.
- Run `node build/build.js` after adding or editing a file.
