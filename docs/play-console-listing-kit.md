# Play Console listing kit — Urdu Safar

Everything below is ready to copy-paste into Play Console (console.play.google.com,
under the `homilabs` developer account). This session has no login/payment
access to Play Console itself, so app-listing creation and submission need
to happen in your own browser — this doc exists so that's fast.

## 1. Create the app

Play Console → **Create app**:
- App name: `Urdu Safar - for O-Level/IGCSE`
- Default language: English (United States) — or English (India) if that reads better for your audience
- App or game: **App**
- Free or paid: **Free**
- Declarations: confirm developer program policies + US export laws (standard checkboxes)

## 2. Store listing text

**App name** (30 char max): `Urdu Safar - for O-Level/IGCSE` (30 chars — final, accepted by the user)

**Short description** (80 char max):
```
Learn Urdu as a Second Language for Cambridge O Level and IGCSE exams
```

**Full description** (4000 char max):
```
Urdu Safar is a focused practice app for students preparing for Cambridge O Level Urdu (Second Language, 3248) or IGCSE Urdu (Foreign Language, 0539) — the two Cambridge Urdu qualifications share most of the same core vocabulary, topics, and skills, and Urdu Safar practices exactly those.

Instead of another textbook, Urdu Safar turns exam prep into bite-sized, repeatable practice:

VOCABULARY PRACTICE
Spaced-repetition flashcards covering 170+ words across every topic, a mixed word-match quiz, and a 30-idiom drill — the single most requested skill for these exams.

17 ESSAY TOPICS, FULLY WORKED
Every core topic (Home & Family, School Life, Festivals & Culture, and more) with vocabulary, reading, writing, and grammar practice at three difficulty levels, plus a cultural note for context.

10 SKILLS, WITH SAMPLE ANSWERS
Letter-writing, dialogue, and other functional-writing genres with model answers and guided prompts.

READING SKILLS
Short-answer questions, multiple matching, and note-making, with lenient answer-checking that accepts natural spelling variation.

GRAMMAR LAB
Sentence transformation and multiple-choice cloze passages, with difficulty levels to build up from the basics.

TRANSLATION
English-to-Urdu sentence-building warm-ups plus full passage translation with a model answer and checklist.

SUMMARY WRITING & EXTENDED WRITING
Condense a passage to under 100 words, or write a full ~200-word composition with a clear purpose, format, and audience, each with a model answer to self-assess against.

PROGRESS & MOTIVATION
Earn gold, silver, and bronze medals as you go. Track your practice with a personal leaderboard, and — if you sign in — create a private friend group to compare progress with classmates, synced across devices.

Works fully offline. No account is ever required — signing in is optional, only needed for the friend-group leaderboard.

Urdu Safar is an independent study aid; it is not an official Cambridge publication. The O Level and IGCSE Urdu syllabi differ in some exam components (such as exact paper structure), so always check the current official syllabus and past papers for your specific qualification from Cambridge International as your primary reference.
```

**Category:** Education
**Tags:** exam prep, Urdu, language learning, O Level, IGCSE, Cambridge

**Contact details:**
- Email: homi55@gmail.com
- Website: https://safar.homilabs.org (optional field)
- Privacy policy URL (required): https://safar.homilabs.org/privacy-policy.html

## 3. Graphics

All already generated in `store-assets/`:
| Slot | File | Size |
|---|---|---|
| App icon | `store-assets/icon-512.png` | 512×512 |
| Feature graphic | `store-assets/feature-graphic-1024x500.png` | 1024×500 |
| Phone screenshots (upload all 5, in order) | `store-assets/screenshots/01-home-essays.png` … `05-topic-detail.png` | 1080×2400 |

Play requires at least 2 phone screenshots; these 5 show the home screen, vocabulary practice, a flashcard in use, the leaderboard, and a topic's four-skill structure.

## 4. Content rating questionnaire

Answer honestly; expected outcome is **Everyone** / **PEGI 3**:
- Violence, sexual content, profanity, drugs/alcohol/gambling: **None** — it's an educational app
- User-generated content: friend-group display names are user-chosen text, but there is **no chat, messaging, or public content sharing** — groups are private and invite-code-only
- Shares location: **No**
- Allows purchases: **No** (free, no IAP, no ads)

## 5. App content declarations

- **Privacy policy:** https://safar.homilabs.org/privacy-policy.html
- **Ads:** No ads
- **App access:** All functionality available without special access — guest mode (no login) already reaches every practice feature. A test account exists anyway so reviewers can also check the sign-in/friend-group leaderboard path — credentials in `.secrets/play-console-test-account.txt` (gitignored, this repo is public; enter them under Play Console → App content → App access → "All or some functionality is restricted" → add instructions, even though strictly nothing requires them).
- **Target audience:** Recommend 13+ or 16+ given the exam-prep audience (O Level students, typically 14-16) — avoids the stricter Families Policy review that applies to apps primarily aimed at under-13s, and is an honest reflection of who the syllabus is for
- **News app:** No · **COVID-19 app:** No · **Data safety:** see below
- **Government app:** No · **Financial features:** No

## 6. Data safety form

Data collected **only if the user chooses to sign in** (clearly state this is optional in the form's description field):

| Data type | Collected? | Shared with 3rd parties? | Purpose | Optional? |
|---|---|---|---|---|
| Email address | Yes | No | Account management | Yes — guest mode needs none |
| User IDs | Yes | No | Account management, app functionality | Yes |
| App activity (in-app actions / scores) | Yes | No | App functionality (leaderboard) | Yes |

- Data is encrypted in transit: **Yes** (Firebase/HTTPS default)
- Users can request data deletion: **Yes** — https://safar.homilabs.org/delete-account.html (also in-app, Account screen)
- Data collection practices reviewed against the actual privacy policy text at https://safar.homilabs.org/privacy-policy.html — keep these two in sync if the app's data handling ever changes

## 7. Release status

**Submitted and in review as of 2026-09-18** — versionCode 3 (versionName 1.0), signed with `.secrets/urdu-safar-release.keystore`, built targeting SDK 36. AAB: `releases/v1.0-versioncode3/urdu-safar-v1.0-3.aab`.
