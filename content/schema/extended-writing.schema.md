# Extended Writing content schema

Every file in `content/extended-writing/` matches 3248 Paper 2, Exercise 3 (~200-word composition, 20 of that paper's 50 marks — the single highest-value exercise in the whole qualification). Same one-file-per-item + `_order.json` pattern as `content/topics/`. Filename must match the `id` field, and every id must be listed once in `content/extended-writing/_order.json`.

Like Summary Writing, only one exercise shape, fully self-assessed. The design doc (`new-categories-design-3248.md`) left open whether this should use a checklist (like Summary Writing/Translation) or stay unscored like Creative Corner — **resolved**: use the checklist pattern, now that it's been validated by those two categories.

## Required shape

```json
{
  "id": "kebab-case-unique-id",
  "ur": "Urdu title",
  "en": "English title",

  "prompt": {
    "ur": "the writing task, in Urdu, specifying purpose/format/audience",
    "en": "English gloss of the prompt",
    "purpose": "e.g. \"To inform and persuade\"",
    "format": "e.g. \"Article\", \"Report\", \"Letter\" — matches real exam framing",
    "audience": "e.g. \"School magazine readers\""
  },

  "modelResponse": "a ~200-word Urdu model composition answering the prompt",
  "checklist": ["a self-check question, one per AO2 objective (W1-W5) plus word count"]
}
```

## Scoring

Fully self-assessed, same pattern as Summary Writing and Translation's passage exercise. The checklist should map to the syllabus's actual AO2 writing objectives (communicate clearly; organize into coherent paragraphs with linking devices; accurate grammar/vocabulary in context; punctuation/spelling control; appropriate register/format for purpose and audience) rather than generic writing advice — see `igcse-olevel-urdu-curriculum-reference.md` for the AO2 wording.

## Notes for adding an entry

- `prompt.purpose`/`format`/`audience` should be shown to the student before they write, matching how the real exam specifies them.
- Aim for 5-6 checklist items: one per AO2 objective (W1-W5), plus a word-count check.
- Run `node build/build.js` after adding or editing a file.
