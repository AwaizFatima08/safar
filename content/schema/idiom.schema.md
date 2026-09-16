# Idiom content schema

Unlike `content/topics/` and `content/skills/` (one file per item + `_order.json`), idioms live as a **single flat array** in `content/idioms/idioms.json` — there's no per-idiom structure worth splitting into separate files, and the Vocabulary Practice idiom-drill just needs the whole pool at once.

## Required shape

```json
[
  {
    "id": "kebab-case-unique-id",
    "ur": "the idiom itself, in Urdu",
    "meaning_ur": "plain-Urdu explanation of what it means",
    "meaning_en": "English meaning/equivalent",
    "example_ur": "one example sentence using the idiom naturally",
    "example_en": "translation of the example sentence"
  }
]
```

## Notes for adding idioms

- Every `id` must be unique across the file — the build fails loudly if two entries share one.
- Pick idioms genuinely common in O Level 3248 Paper 2 usage (the "Urdu Clinic" prep resource repeatedly flags idioms as a distinct, high-value vocabulary skill) — not obscure or archaic ones.
- `example_ur` should use the idiom in a natural sentence, not just restate the idiom in isolation.
- Run `node build/build.js` after editing — it validates every entry has all five required fields and that ids are unique.
