# Skill content schema

Every file in `content/skills/` is one entry under the **Skills / صلاحیت** section — a functional writing genre (email, report, debate, etc.), not a comprehension topic. Filename must match the `id` field, and every id must be listed once in `content/skills/_order.json`.

## Required shape

```json
{
  "id": "kebab-case-unique-id",
  "ur": "Urdu title, e.g. ای میل لکھنا",
  "en": "English title, e.g. How to write an email",

  "points": [
    "format/structure rule, one per line, in Urdu"
  ],

  "samples": [
    { "caption": "English caption describing the sample", "ur": "the full worked sample text in Urdu" }
  ],

  "practice": [
    { "q": "practice question", "opts": ["opt1","opt2","opt3","opt4"], "a": 0 }
  ],

  "prompts": [
    { "ur": "free-write prompt in Urdu", "en": "English gloss of the prompt" }
  ]
}
```

## Notes for adding a new skill

- `samples`, `practice`, and `prompts` currently hold exactly 3 items each — the app doesn't hard-require exactly 3, but the UI (progress dots, "x/3 done" counters) assumes it, so keep new skills at 3 unless you also revisit those bits of `src/app.js`.
- A sample that discusses a real book, website, or product must use an invented or public-domain title — never present a real, identifiable work as genuine. See the existing `book-review.json` and `website-review.json` for the pattern (الف لیلہ for public-domain, invented names like "اردو دنیا" otherwise).
- Skills don't have difficulty levels (unlike topics) — they're meant to stay simple: read the format, see samples, take one quiz, try the prompts.
- Run `node build/build.js` after adding or editing a file.
