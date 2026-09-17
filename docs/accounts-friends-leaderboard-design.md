# Real accounts + friend groups + leaderboard — design (2026-09-17)

## Why this replaces the old "nickname" system

`src/app.js` already had a nickname-based "sign up" and a "group code"
leaderboard, but by its own design comment it had **no real backend**: the
shared leaderboard only worked via `window.claude.use("db")`, a capability
that exists solely inside a published Claude Artifact page — it is always
`null` in the actual Android app (Capacitor build), so on-device the
"group"/"shared leaderboard" features silently did nothing beyond the
single device. Now that Firebase project `urdu-safar` exists, we replace
that with a real backend: Firebase Authentication (email/password) +
Cloud Firestore.

## Play Store policy read

Accounts + a friend-group leaderboard are acceptable under Play policies,
provided:
1. **Privacy Policy** discloses exactly what's collected (email, display
   name, practice scores, group membership), who processes it (Firebase/
   Google Cloud), and that display name + scores are visible only to
   people in the same friend group — not public.
2. **Account deletion**: since the app allows account creation, Play's
   User Data policy requires a way to delete the account + data **both
   in-app and via a web page reachable without the app**. Both are being
   built (in-app self-service delete; `store-assets/delete-account.html`
   for the web path).
3. **Data Safety form** (filled in at Play Console submission time, not
   now) must list: Personal info (email), User IDs, App activity
   (scores) — collected, linked to identity, used for account
   functionality only, not shared with third parties, encrypted in
   transit (Firebase default), user-deletable.
4. **Target audience**: O Level students are mostly 14-16, not primarily
   children under 13, so this doesn't trigger Google Play's Families
   Policy program. Kept safe-by-design anyway: no public profile
   discovery, no messaging/chat, no real names required (display name
   only), groups are invite-code-only (not searchable).

## Data model (Cloud Firestore, `urdu-safar` project, `asia-south1`)

```
users/{uid}                        — one per signed-in account
  email, displayName, createdAt

groups/{groupId}                   — a friend group
  name, ownerUid, inviteCode, memberUids: [uid, ...], createdAt

groups/{groupId}/members/{uid}     — one member's score snapshot
  displayName, gold, silver, bronze, score, updatedAt
```

A group's leaderboard is just its `members` subcollection, sorted by
`score` client-side (small groups — no need for a Firestore composite
index or pagination).

## Auth flow

- **Guest mode stays the default** — opening the app for the first time
  still asks for a nickname only (matches the app's original zero-
  friction design and keeps it fully usable offline). Guest progress
  stays local-only, exactly as before.
- **Optional account** — a new "Account" entry (from the Leaderboard
  screen) offers **Sign up** / **Log in** with email + password via
  Firebase Auth. Signing in does not erase local progress; the existing
  medal totals are what gets synced to `users/{uid}` and to any group's
  `members/{uid}` doc.
- Creating or joining a group requires being signed in (it needs a
  stable `uid` for the security rules to key off).

## Group create/join

- **Create**: generate a random 6-character invite code (A-Z0-9, excluding
  ambiguous chars), write `groups/{autoId}` with `ownerUid`, `inviteCode`,
  `memberUids: [uid]`, and `members/{uid}` with the current score snapshot.
- **Join**: query `groups` where `inviteCode == <code>` (requires the
  rules' `read` to allow a query — see note below), then `update` to
  append the joiner's uid via the rules' join branch, then write their own
  `members/{uid}` doc.
  - Note: querying by `inviteCode` before joining needs a read that isn't
    yet a member — handled by keeping the query scoped to
    `where("inviteCode","==",code).limit(1)` and reading only the
    `groupId` + confirming via a Cloud Firestore rule that allows this
    specific query pattern is out of scope for v1; instead the client
    performs the join as a single `update()` call addressed directly at
    a `groupId` obtained out-of-band (the invite code IS the doc's
    `inviteCode` field, but the *document ID* used for the update is
    looked up via a `collectionGroup`-free indexed query restricted to
    return only `groupId` — acceptable because Firestore rules evaluate
    `list`/`query` per matched document with the SAME `read` rule as
    `get`, and our `read` rule already requires membership... this means
    a **non-member cannot query by invite code with these rules as
    written.** Resolved by adding a narrow allowance: see rules update
    below (`allow get` stays membership-only; a separate lightweight
    `groupLookup/{inviteCode}` doc — see next section).

### Invite-code lookup without leaking group contents

To let a non-member resolve an invite code to a `groupId` (needed to
join) without making the whole `groups` collection queryable by
outsiders, group creation also writes a tiny `groupLookup/{inviteCode}`
document: `{ groupId }`. This collection has its own rule — public
`get` (by exact document ID/invite code only, never `list`), not
`write` except by the group's creator at creation time. So the only
thing an outsider can ever learn from an invite code is which
`groupId` it maps to, nothing about members or scores.

## Account deletion

- **In-app**: Account screen → "Delete my account" → removes the
  user from every group they belong to (their `members/{uid}` docs +
  their uid from each group's `memberUids`), deletes `users/{uid}`,
  then `firebaseAuth.currentUser.delete()`. Firebase requires a recent
  sign-in for this; if it fails with `auth/requires-recent-login`, the
  UI re-prompts for the password before retrying.
- **Web path** (required by Play policy even without the app installed):
  `store-assets/delete-account.html`, hosted at
  `safar.homilabs.org/delete-account` — describes emailing
  homi55@gmail.com from the account's registered address; manually
  actioned within 30 days via the Firebase console until volume ever
  justifies a self-service Cloud Function.

## What's deliberately out of scope for v1

- No password reset email flow yet (Firebase Auth supports it trivially
  later — `sendPasswordResetEmail` — add once real users exist).
- No profanity/abuse filtering on display names or group names — low
  risk for an invite-only, non-public, no-chat feature; revisit if
  groups ever become discoverable.
- No Firebase App Check / Play Integrity hardening yet — no monetary or
  sensitive-data risk in this app's data (practice scores), so basic
  Firestore rules are enough for launch; note for later hardening.

## One manual step this session cannot do

Firebase's **Email/Password sign-in provider** must be turned on once by
a human in the console (no CLI/REST path is exposed for it on the free
tier): Firebase Console → Authentication → Sign-in method → Email/Password
→ Enable. Everything else (project, Firestore database, security rules)
is already provisioned by this session.
