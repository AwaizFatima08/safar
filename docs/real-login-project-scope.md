# Real Login & Accounts for Urdu Safar — what it would actually take

## Where things stand right now

Urdu Safar is a single, self-contained web page with no server behind it. "Sign up" is a nickname typed once and remembered on that device; the leaderboard is either local to that device or — when the viewer happens to be signed into the same Claude account as the page's owner — shared through a small built-in database. That's the ceiling for what a page like this can do on its own.

## Why Google / Facebook / Instagram / email login can't be added to this page

- **Google and Facebook sign-in** both require registering a developer app tied to a *fixed, verified domain* that the provider redirects back to after login. This page doesn't have a domain we control — it's hosted on Claude's artifact platform, not a website you own.
- **A real OAuth exchange needs a secret key** that must never be visible in the browser. Holding it safely requires a backend server. There isn't one here.
- **Instagram** doesn't offer a general sign-in API for outside apps anymore — Meta shut that down years ago. This one is off the table regardless of budget or effort.
- **Email/password accounts** need secure password storage (hashing), a database to hold accounts, and an email service to send verification and reset links — again, a backend + database + third-party service, none of which exist for a static page.

None of this is a limitation of my building the page a certain way — it's a structural fact about what a page-with-no-server can do.

## The realistic path, if you want to do this for real

Rather than hand-building a login server from scratch, the standard approach for an app this size is a **managed authentication service** — a company that already runs the login server and handles Google/Facebook safely. Two well-established, low-cost options:

- **Firebase (Google)** — Authentication + Firestore database + Hosting, all in one product. Google sign-in is close to a toggle switch to enable. Facebook sign-in needs a free Meta developer app, but Firebase does the token handling. Generous free tier for an app at this scale.
- **Supabase** — an open-source alternative built on Postgres, with similar sign-in providers and its own free tier.

Either removes the need to build or host a custom auth server or database — you configure providers in a web console, then a normal app talks to their SDK.

## What the project would actually involve

1. **Create a project** with Firebase or Supabase — a few minutes, just an account and a project name.
2. **Turn on sign-in providers** — Google is quick; Facebook needs a free Meta developer app plus a privacy policy URL (a few hours of setup, longer if you want it public rather than just for testers).
3. **Rebuild Urdu Safar's front end** to call that provider's login SDK, and move progress, medals, and the leaderboard into their database instead of the current local/on-device storage.
4. **Host the app somewhere with a real, stable domain** (Firebase Hosting, Vercel, Netlify, or a domain you own) — required because OAuth providers insist on a fixed, verified redirect address.
5. **Write a short privacy policy page** — legally expected once you're handling real sign-in data (even just an email and a nickname).

## Rough scope, so this is a real decision and not a guess

- **Time**: a few focused days for someone comfortable with JavaScript and reading provider documentation; longer while learning.
- **Cost**: likely $0 to a few dollars a month at this app's size (free tiers cover light use); a custom domain, if wanted, runs roughly $10–15/year.
- **Ongoing**: this becomes a real hosted service you maintain — dependency updates, provider policy changes — not a self-contained page you can just leave running.
- **Responsibility**: real accounts mean you're storing real user data, even if it's just an email and a nickname. That brings a genuine (if small) duty of care that the current nickname-only design doesn't carry.

## Recommendation

Treat this as a phase-two project, worth starting once the current version has proven itself useful — not something to build before you know the app is worth that investment. The current nickname sign-up already delivers the practice-and-motivation experience; real accounts would mainly buy portability across devices and outside-the-family sharing, which is a meaningfully bigger lift for a meaningfully narrower benefit at this stage.

## What's staying in the live app for now

The nickname sign-up stays as-is. I'm adding a shareable **group code** so a few people can compare progress against each other — with one caveat spelled out inside the app itself: a group only truly connects people who are on the same Claude account as whoever published the page. It won't reach a friend opening the link from their own separate account or phone. That gap only closes with the real backend described above.
