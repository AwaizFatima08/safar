# Urdu Safar — project structure

This is the source project behind the Urdu Safar app. It replaces the earlier single `app.html` file with a proper build: content and code are separate, so growing the curriculum means adding content files, not editing code.

## Layout

```
safar/
├── content/
│   ├── topics/           one JSON file per Essay topic + _order.json (display order)
│   ├── skills/            one JSON file per Skill + _order.json
│   └── schema/            what fields a topic/skill file must have (read before adding content)
├── src/
│   ├── app.js              all app logic — router, quiz engine, medals, leaderboard, sign-up
│   ├── styles.css          all styling
│   └── index.template.html the page skeleton the build fills in
├── build/
│   └── build.js            assembles content/ + src/ into dist/app.html
├── dist/
│   └── app.html             GENERATED — never hand-edit. This is what gets published/shipped.
├── docs/                    planning docs (login scope, Play Store plan, command board)
├── scripts/
│   └── backup_safar.sh      three-layer backup script
└── links.md                 live app URL + Claude Project reference
```

## Adding a new topic or skill

1. Copy an existing file in `content/topics/` (or `content/skills/`) as a starting template — see `content/schema/topic.schema.md` or `skill.schema.md` for the exact fields required.
2. Give it a new, unique `id` (kebab-case) matching its filename.
3. Add that `id` to the matching `_order.json` file, wherever in the list you want it to appear.
4. Run the build (below). It checks for missing fields, mismatched filenames/ids, and files that exist but were forgotten in `_order.json` — it'll fail loudly with a clear message rather than silently shipping something broken.

## Building

```
node build/build.js
```

Produces `dist/app.html` — a single self-contained file, same as the app has always been under the hood. That file is what gets:
- published as the Claude Artifact (the live link), and
- later wrapped by Capacitor for the Play Store build.

No npm install, no framework, no bundler — deliberately. The app is plain HTML/CSS/JS; the "build" is just gluing content into code and checking it for mistakes first.

## What hasn't changed

The app's behavior, content, and appearance are identical to the single-file version — this is a restructuring of the source, not a feature change. `dist/app.html` built from this structure has been checked against the previous version and behaves the same.

## What's still pending (see docs/urdu-safar-command-board.md)

- No backend yet — accounts and progress still live in the browser only.
- No Capacitor/Android wrapping yet.
- Design lock (the actual point of doing this restructuring now) is still an open conversation.
