# Urdu Safar v1.1 — scope (2026-10-09)

Source review: the user's two *Kawish* workbooks (Book 1 = 3248 Paper 1,
Exercises 1–5; Book 2 = 3248 Paper 2: transformation, cloze, extended
writing, translation) plus their contents-page extract. The books were used
only to choose topics and match exam formats — every passage, question and
model answer in the app is original writing, not copied from the books.

## Content: 20 new topics (37 total)

Each new topic gets the full set, same as v1.0's 17: Essay topic (vocab,
reading, writing, grammar), Reading Skills, Grammar Lab, Translation, plus a
standalone Summary Writing passage and Extended Writing task.

| id | Topic | Reading Skills text type (Ex.1) |
|---|---|---|
| kalash-valley | Kalash valleys | travel brochure |
| mohenjo-daro | Mohenjo-daro | museum visitor guide |
| lahore-fort | Lahore Fort (Shahi Qila) | visitor information notice |
| karakoram-highway | Karakoram Highway | travel advisory |
| deosai-plains | Deosai | national park rules |
| cholistan-desert | Cholistan | event poster (jeep rally) |
| markhor | Markhor, national animal | wildlife report |
| indus-dolphin | Indus river dolphin | awareness leaflet |
| khewra-salt-mine | Khewra salt mine | tour leaflet |
| amazon-rainforest | Amazon rainforest | magazine article |
| helen-keller | Helen Keller | library book-week poster |
| patras-bokhari | Patras Bokhari | literary evening invitation |
| earthquake-safety | Earthquake safety | safety instructions |
| heatwave | Heatwave / heatstroke | public health advisory |
| road-safety | Road safety & the motorway | motorway police leaflet |
| solar-energy | Solar energy | company leaflet (fictional) |
| olympic-games | Olympic Games | news report |
| truck-art | Pakistani truck art | exhibition advert |
| scouting | Scouting | camp joining instructions |
| success-failure | Success and failure | workshop advert |

## Exam-format gaps closed

1. **Paper 2 Ex.1 format.** The real exam gives a second, half-written
   sentence to complete without changing the meaning. New Grammar Lab items
   use an optional `stem` field (with `____`); the student types only the
   missing words. Old items (free rewrite) still work unchanged.
2. **Paper 1 Ex.5 format.** The real exam's writing task is a ~150-word
   email/letter covering 3 given points. Extended Writing gains optional
   `prompt.points` (shown as bullets) and `prompt.words` (default 200). New
   tasks mix emails (formal/informal), a book review, an application, reports,
   articles and blogs — the formats the syllabus names.

## Accounts, leaderboard, groups

These already existed in v1.0 (email/password, one group, group leaderboard).
v1.1 makes them a proper flow:

- Welcome screen: start as guest *or* sign in / create an account.
- Account screens: separate Sign in / Create account forms (display name,
  email, password, confirm), "Forgot password?" (Firebase reset email),
  change display name, log out, delete account.
- Groups: up to 5 groups per account (class + friends), in-app Create and
  Join forms instead of system prompts, group page with ranked members,
  invite code with Copy and Share, Leave group; the group owner can remove
  a member or delete the group (basic moderation for user-visible names).
- Leaderboard: list of your groups, each with your rank; this-device board
  kept for guests.
- No in-app messaging (as requested).

## Fixes

- User-supplied text (nicknames, group names, emails) is HTML-escaped
  everywhere — previously a group member's display name was inserted raw
  into other members' screens (stored script injection across devices).
- Firestore rules validate member/group fields and sizes.
- Home screen showed "[object Object]" for the group name.
- Found in device testing: the Android back button closed the app from every
  screen. Screens now push history entries and an @capacitor/app backButton
  listener steps back through them, closing the app only from home.
- Home progress card squeezed its text into a narrow column on phones.

## Release

versionCode 6, versionName 1.1, minSdk 24 (Play automatic protection needs 24+;
the versionCode 5 bundle with minSdk 23 was refused). Signed
with the existing release keystore. Files: releases/v1.1-versioncode6/.
Upload to Play Console is the user's step (no console access from here).
