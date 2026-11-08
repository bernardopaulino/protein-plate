# Case study: Protein Plate

> Versão em português: [case-study.md](case-study.md)

> **Protein without the diet.** A web app that shows how easy it is to hit your daily protein goal with real food.
>
> Next.js 16 · TypeScript strict · Cloudflare Workers + D1 · Better Auth · AI SDK · Vitest + fast-check · Playwright

<!-- TODO(launch): GIF of the first-time flow (landing → /comecar → /o-meu-dia) and link to production -->

## The problem

People who want to eat more protein usually find one of two things: diet apps that ask you to log everything, count calories and weigh your food, or lists of "high-protein foods" with no sense of portion size. The real question is simpler: *with the food I already eat, how much am I missing, and what should I add?*

Protein Plate answers that in under two minutes, with no account: you work out your goal, see a full day that already reaches it, adjust real portions and, if you want, generate a recipe from the foods you picked.

## Principles behind the decisions

Every feature was checked against seven principles written before any code (`docs/especificacao.md`, section 1). Three of them carried the most weight in technical decisions:

- **Numbers you can trust.** Protein always comes from a curated database (Portugal's national food composition table, TCA, from INSA), never from the AI.
- **Value before sign-up.** Everything works as a guest; the account only saves and syncs.
- **Zero guilt.** Below the goal you see "23 g to go", never red and never "you failed".

## Technical decisions

### 1. The AI writes the recipe, the app does the math

A language model is not a reliable source of nutrition data. So the AI never returns protein values. It returns a structured recipe whose ingredients can only be catalog ids, and the app calculates the protein from the database.

- The output schema is **built per request**: `ingredients[].foodId` is a `z.enum` of the chosen foods plus the pantry staples. The model can't invent ingredients because the schema doesn't allow it.
- After the model responds, a second domain validation runs: every chosen protein source is present, grams per serving stay within 3 × the default portion, and the (calculated) protein per serving falls between 1 and 120 g. If that fails, there is **one** retry with the error described. If the retry also fails, the user gets a friendly error and the request doesn't count against their quota.
- The request only has closed fields (ids, meal, time, servings) and no free text, which shuts the door on prompt injection.
- **Content-addressed cache**: the key is a SHA-256 of the normalized parameters, plus the prompt version, the model and the food data version. Identical requests cost nothing, and changing the prompt invalidates the cache with no migrations.

### 2. Where the day lives

In the first version, with no account required, the day lived in `localStorage` (versioned key, validated with Zod) and synced to D1 once there was an account. Once login became mandatory, that copy turned into a liability: a tab still running the previous version of the app would see the new data as invalid and delete it, leaving "My day" empty for people who had already built their plan.

Now the day lives only in D1. The page loads it from the server. Each change shows up on screen right away and is then saved through a Server Action, debounced, one request at a time and always with the latest day. The server uses the session's user and filters the items again against the person's meals and restrictions.

### 3. Health data only with consent

Weight and allergies are health data (GDPR, Art. 9). They are stored only with explicit consent at the end of the form, never sent to the AI, and the back office shows them only in aggregate. The Server Action schemas are `strict`, so an extra field is rejected instead of ignored. Tests make sure of it.

### 4. Pure domain, property-tested

The rules (goal, meals, example day, "To reach your goal" suggestions) live in `src/domain`, with no I/O and ~99% line coverage. The trickiest rule is the **deterministic example day**: for any goal from 80 to 250 g and any of the 57 meal combinations, the total must land between 100% and 110%. Instead of hand-picking cases, a **property-based** test (fast-check) covers the whole space.

### 5. Next.js 16 on Cloudflare Workers

Deployment uses `@opennextjs/cloudflare` on top of D1 in the EU jurisdiction. Some consequences:

- **Portuguese with no prefix and no middleware.** The Next 16 proxy runs on Node, which is still experimental on Workers. Routes are rewritten to `/pt/...` in `next.config.ts` using an explicit route list, because OpenNext's routing doesn't support lookaheads (I found that out through a bug, fixed in `b49323c`).
- **A custom Worker** in front of OpenNext validates the environment with Zod before serving any request (without valid secrets it returns 503 and logs only the *names* of the missing variables), adds HSTS and public caching for recipes, and runs the hourly cleanup cron.
- **A Drizzle client per request**, created from the binding, never global.
- Integration tests run against a **real local D1**, with two users per route, to catch ownership bugs.

### 6. Privacy by design

- No personal data in logs. For guest quotas, the IP only exists as an **HMAC with a daily key** derived from a secret and the date: enough to count today's requests, but not to track anyone from one day to the next.
- Sessions don't store IP or user agent. OAuth tokens are discarded, except Apple's refresh token (encrypted), which is needed to revoke access when the account is deleted.
- Exporting your data (JSON) and deleting your account are built into the app, and deleting requires a recent login.

## Quality

| Area | How |
| --- | --- |
| Domain | Vitest with ~99% line coverage in `src/domain`; fast-check for the example day |
| Integration | Server Actions and `/api/recipes` against a local D1, with two users |
| E2E | Playwright on mobile and desktop: first-time use, adjusting the day, generating a recipe (mocked model) |
| Accessibility | axe-core on the main pages in light and dark mode; `aria-live` announcements for "X g to go"; `prefers-reduced-motion` |
| AI | `eval:recipes`: 20 fixed combinations against the real model (validity, off-list ingredients, plausible protein, latency) |
| Performance | Lighthouse CI on mobile (weekly against staging and manually against production; fails below 90) |
| Security | Strict CSP, Better Auth endpoint allowlist, mandatory login, rate limiting and per-account quotas, health data only with consent |

## What I learned

- **Validating input isn't enough when the output comes from a model.** The model's schema constrains the *shape*, but only a second domain validation guarantees the recipe makes sense (all proteins present, plausible servings).
- **A local copy is a second source of truth.** Versioning and migrating aren't enough when two versions of the app run at the same time in different tabs. When the account became mandatory, removing the copy was simpler and safer than making it compatible in both directions.
- **The cost of Zod on the client.** Guest state was validated in the browser, which pulled classic Zod (about 32 KB gzipped) into the pages that show the day. The contracts that reach the client moved to `zod/mini`, whose functional API only bundles the checks you actually use (−14 KB gzipped). Server-only contracts stay on classic Zod. In the same spirit, fonts now load only the `latin` subset (which already covers Portuguese) instead of also preloading `latin-ext`.
- **The runtime shapes the architecture.** Choosing Workers over a Node server had consequences for routing (no middleware), the database (a client per request) and testing (a real local D1 instead of mocks).

## Results

<!-- To add: people and recipes generated in production (back office Dashboard) -->

| Metric | Target | Result |
| --- | --- | --- |
| Time to a day that reaches the goal, after signing in | < 2 min | verified on every push by the e2e test (`tests/e2e/first-use.spec.ts`) |
| Lighthouse mobile (production, median of 5 runs, Nov 8, 2026) | ≥ 90 | performance 90–92, accessibility 100, best practices 100, SEO 100 on indexable pages |
| Valid recipes in `eval:recipes` (27 cases, Haiku 5.5, prompt 5) | ≥ 90% | 27/27, all on the first try |
| Latency of a new recipe | p95 < 15 s | median 2.5 s, p95 3.2 s (down from 6.9 s and 25.7 s with prompt 1, before the fixed schema and before turning thinking off) |

## Next steps

- v1.1: multiple "day templates" (for example, a training day and a rest day). English (`/en`) and food preferences are already done.
- v2: an Expo app on the same backend (`/api/recipes` is already a public contract), a shopping list and cost per gram of protein.
