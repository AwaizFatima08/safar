# Urdu Safar → Play Store: backend & login plan

## What's changing, and why

Right now the app remembers a nickname and progress in the phone's browser only — switch devices and it forgets everything. Publishing to Play Store means fixing that properly: a real account, a real database, progress that follows the student. This plan covers how to do that while keeping the data collected, and the database itself, as small and simple as possible — per your instruction, and because less data collected is also less to secure, less to explain in a privacy policy, and less that can go wrong.

You've confirmed: the child logs in directly with his own account (not a parent-managed login), and this plan should be reviewed before any code changes.

## Architecture at a glance

- **The app itself doesn't need a rewrite.** It's already plain HTML/CSS/JS. **Capacitor** (an open-source tool) wraps it into a real Android app almost unchanged — same code, same look, now installable from Play Store.
- **Backend: Firebase** (Google's own managed backend service) — specifically **Firebase Authentication** (handles login) and **Firestore** (the database). This is the same "managed auth, no server to build" path from the earlier scoping note, now put to use.
- Firebase is a reasonable default here for one practical reason beyond cost: it's Google's own product, so Google Sign-In integrates natively, and Play Console/Firebase already expect each other.

## Login: what the child sees

Two sign-in options, both handled by Firebase so no passwords ever pass through your own code:

1. **Email + password** — he types an email and a password once; Firebase stores and checks it, not you.
2. **Google Sign-In** — one tap, using a Google account he (or you) already has on the phone.

I'd leave **Facebook out for now.** Not because it's technically hard, but because it adds a Meta developer app, a business verification step, and Meta's own review process on top of everything else — extra setup for a login method that Google Sign-In already covers for most students. Easy to add later if it turns out to matter.

## Keeping data collection minimal — what's actually stored

This is the part worth being deliberate about, since he's a minor signing up directly. The plan is to store the least amount that makes the app work, and nothing else:

| Data | Why it's needed | Notes |
|---|---|---|
| Email address | Required by the login method he picks | Held by Firebase Authentication, not duplicated elsewhere |
| Nickname | Shown in-app and on the leaderboard | Chosen by him, not his real name |
| Progress (stars, medals per section) | The whole point of the app | Numbers only — no free-text answers stored |

**Explicitly not collected:** real name, date of birth, phone number, location, contacts, photos, or any advertising/analytics identifiers. No ad SDKs, no third-party trackers. That's a deliberate choice, not a default — it keeps the Play Console "Data safety" form short and keeps this out of the messier parts of children's-data policy, even though O-level-age students (roughly 14–17) generally sit outside the strictest "primarily child-directed," under-13-focused rules.

## Simple database shape

Two small pieces, both in Firestore:

- **`users/{uid}`** — one document per signed-in child, holding `{ nickname, progress: {...same shape the app already tracks...} }`. This is a straight port of what's already in the browser's local storage today — same structure, new home.
- **`leaderboard/{uid}`** — one small document per child: `{ nickname, gold, silver, bronze, score }`. Kept separate from the full progress document on purpose, so the leaderboard (which is more widely visible) never exposes anything beyond medal counts.

Security rules (a Firebase feature, not extra code to maintain) enforce that each child can only read/write their own `users/{uid}` document and their own `leaderboard/{uid}` entry — nobody can see another student's detailed progress, and nobody can fake their own leaderboard score by editing someone else's.

This is intentionally flat and boring. Future features (new topics, new skill types, a new section) just add fields inside the existing documents — no schema redesign needed as the app grows, which matters since you've said more will follow.

## What Play Store specifically requires

- **A privacy policy page** — mandatory, even for an app collecting this little. One simple page describing exactly the table above is enough; I can draft it once the backend is real.
- **The "Data safety" form in Play Console** — filled in to match that same table, truthfully. Short and easy precisely because the data collected is short.
- **An account-deletion path.** Play policy requires that if you collect account data, users can request deletion of their account and data — commonly a simple in-app "Delete my account" button, or at minimum a contact email in the privacy policy that you commit to acting on.
- **Target age group declaration** — a deliberate choice in Play Console about who the app is for; worth deciding with intent rather than defaulting, given the audience.

## Build phases

1. **Firebase project setup** — you create a free Firebase project (a few minutes in a browser) and share its config keys with me. No card required at this scale.
2. **Backend swap, still tested as a website** — I replace the current nickname/localStorage code with real Firebase sign-in and Firestore reads/writes. Fully testable in a browser before touching Android at all.
3. **Capacitor wrap** — turn the same code into an Android project.
4. **Build a signed release package (AAB)** — this needs Android build tooling (Android Studio or the command-line SDK). This step is best done on a machine that can stay set up for it (yours, most likely) rather than in this chat's temporary workspace — I can walk you through it when we get there.
5. **Play Console listing** — screenshots, description, the privacy policy and Data safety form above, upload the AAB, then a closed test with a few real devices before public release.

## Rough scope

A few focused days for phases 1–3 (backend + wrapping), assuming steady back-and-forth here. Phase 4–5 (the actual Play Store submission) adds review turnaround time outside anyone's control — Google's review can take from under a day to about a week.

## Recommendation

Proceed as scoped above. The one open decision that's genuinely yours to make, not mine: the exact age-group / content-rating answers in Play Console, since those are legal declarations about your app and your audience. Everything else here is ready to build once you've created the Firebase project.
