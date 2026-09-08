# Topic content schema

Every file in `content/topics/` is one topic under the **Essays / مضامین** section. Filename must match the `id` field exactly (`home-family.json` has `"id": "home-family"`), and every id must be listed once in `content/topics/_order.json` — that file controls the order topics appear in on the home screen.

## Required shape

```json
{
  "id": "kebab-case-unique-id",
  "ur": "Urdu title",
  "en": "English title",
  "factoid": { "ur": "...", "en": "..." },

  "vocab": [
    { "ur": "word", "en": "meaning", "ex_ur": "example sentence", "ex_en": "translation", "syn": "optional synonym" }
  ],

  "reading": {
    "passage": "Urdu passage text",
    "questions": [
      { "q": "question in Urdu", "opts": ["opt1","opt2","opt3","opt4"], "a": 0 }
    ]
  },

  "writing": {
    "build": [
      { "bank": ["word","word","..."], "answer": ["word","word","..."], "en": "translation of correct sentence" }
    ],
    "blanks": [
      { "text": "sentence with _____ blank", "opts": ["opt1","opt2","opt3","opt4"], "a": 0, "en": "translation" }
    ],
    "creative": { "ur": "free-write prompt in Urdu", "en": "English gloss" }
  },

  "grammar": {
    "title": "grammar point title",
    "explain": "short explanation",
    "rows": [ ["Urdu example", "English gloss"] ],
    "practice": [
      { "q": "question", "opts": ["opt1","opt2","opt3","opt4"], "a": 0, "en": "translation" }
    ]
  }
}
```

## Notes for adding a new topic

- `vocab` currently has 10 entries per topic; `reading.questions`, `grammar.practice` have 4; `writing.build` and `writing.blanks` have 3. These aren't hard-enforced by the build, but keep new topics consistent so difficulty levels (which slice down these lists) behave the same way across topics.
- `syn` on a vocab word is optional — only add it where a genuine, useful synonym exists. Words without it are simply skipped by the synonym-quiz round.
- Every grammar point should teach something distinct from every other topic's grammar point — the app is building broad coverage, not repeating the same rule.
- `factoid` is optional but every topic so far has one; it's a small "did you know" shown above the tabs.
- Run `node build/build.js` after adding or editing a file — it validates required fields and clear filename/id/order mismatches before anything gets built.
