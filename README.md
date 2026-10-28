# Sidekick (Phase 2A: real text chat, switched OFF by default)

Sidekick is a voice-first AI thinking partner for professionals. **This version adds real AI text chat behind a double switch. Out of the box it is still the free demo.** No API key is set, no paid call can happen, and nothing is deployed.

The product rules live in three files at the project root. They are the source of truth:

- `SIDEKICK_MASTER_CURSOR_PROMPT_V1.md`
- `SIDEKICK_LIVING_PRD_V1.md`
- `DECISION_LOG.md`

## Run it on your computer (free demo mode)

You need [Node.js](https://nodejs.org) (built and tested with Node 24 and npm 11).

```bash
cd /Users/sujitsuchdev/Downloads/sidekick_cursor_starter
npm install        # first time only
npm run dev        # then open http://localhost:3000
```

Press `Ctrl+C` in the terminal to stop it. With no setup you get **Demo mode**: scripted replies, an amber "Demo mode" label, and no network calls.

### Checks

```bash
npm run lint        # style and common-mistake checker
npm run typecheck   # type checker
npm run build       # production build
npm run test:api    # free end-to-end tests of the AI server code (fake provider; run build first, stop `npm run dev` first)
npm run spend       # shows Sidekick's own estimated spending record
```

## Cost comparison

Prices are **US dollars per 1 million tokens**, Standard tier, taken from the official pages on **2026-10-27**: [OpenAI pricing](https://developers.openai.com/api/docs/pricing) and [Google Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing). A token is roughly three-quarters of a word.

"Cost per conversation" assumes an 8-message conversation: a ~480-token instruction block, ~60-token user messages, ~250-token (about 180-word) replies, no hidden "reasoning" tokens. That is about 13,000 input tokens and 2,000 output tokens in total. **These are estimates from list prices, not measured bills.**

| Model | Input | Output | Est. cost per 8-message conversation | Conversations per $1 | Notes |
| --- | --- | --- | --- | --- | --- |
| **OpenAI GPT-6 Luna** | $0.10 | $0.50 | **about $0.002** | about 430 | **Recommended start.** Needs `reasoning effort = none` (set by default) or cost and latency rise. |
| OpenAI GPT-6.1 Terra | $1.00 | $5.00 | about $0.023 | about 43 | Quality-upgrade candidate. About 10x Luna. |
| OpenAI GPT-6.1 Sol | $2.00 | $10.00 | about $0.046 | about 22 | Probably more than this product needs for now. |
| Google Gemini 2.5 Flash-Lite | $0.10 | $0.40 | about $0.002 | about 480 | **Not a good choice for a new project:** Google says access to 2.5 models is limited to people who already used them, and tells new projects to use 3.5 Flash-Lite or 3.8 Flash ([deprecations page](https://ai.google.dev/gemini-api/docs/deprecations)). |
| Google Gemini 3.5 Flash-Lite | $0.30 | $2.50 | about $0.009 | about 110 | Google's current low-cost model for new projects. About 4x Luna. |

Other points, honestly:

- **Quality.** I did not benchmark these. Each is a small, low-cost tier that should suit short, plain-language answers. Whether Luna's answers are good enough is something to judge by reading real replies. Terra is the easy upgrade if they are not.
- **Latency.** I could not verify Luna's speed at `effort = none`. Only third-party numbers measured with heavy reasoning exist. Measure it after you approve a first paid test.
- **Stability.** Every candidate is under about 3 months old. The code **pins the model name** (`AI_MODEL`) so a provider change cannot silently change cost. Re-check prices before relying on them.
- **Privacy.** On Google's free tier, content is used to improve Google's products (the pricing page says "Yes"). The paid tier says "No". The free tier is not suitable for real user conversations. For OpenAI, Sidekick sends `store: false`. OpenAI may still keep API data for up to 30 days for safety monitoring (per OpenAI's documentation when I checked it. Re-verify before any public launch). The app tells users this.
- **Provider flexibility.** All AI calls go through one small interface (`ChatProvider`). Only the OpenAI adapter exists today. Adding Gemini later means writing one new file. The screens, limits and spending gate do not change.

**Recommendation: start with OpenAI GPT-6 Luna, reasoning effort `none`.** It is about the cheapest option that Google and OpenAI both allow for new projects, and one provider keeps Phase 2A simple. Do not assume it is the best. If replies feel thin, try Terra for the same conversations and compare. The extra cost is about 2 cents per conversation.

## Proposed development budget: no more than $5

| Layer | Setting | Where |
| --- | --- | --- |
| Your money | Buy **the minimum $5 prepaid credit**. Keep **auto-recharge OFF**. | OpenAI billing page (you do this) |
| OpenAI's own limit | Set a project budget / spend limit of **$5 or less**. OpenAI's limits are **not instant**, so treat them as a backstop. | OpenAI project settings (you do this) |
| Sidekick total cap | **$2** estimated, lifetime | `SPEND_CAP_TOTAL_USD` (code ceiling: $5) |
| Sidekick daily cap | **$0.50** estimated per UTC day | `SPEND_CAP_DAILY_USD` |
| Per-session cap | **$0.05** per anonymous session per day, 30 messages per day | `SPEND_CAP_SESSION_DAILY_USD`, `LIMIT_SESSION_DAILY_MESSAGES` |

At about $0.002 per conversation, **$2 is on the order of 800 conversations** (estimate), so the $5 budget leaves a lot of headroom for testing.

## IMPORTANT: what the spending caps can and cannot do

Sidekick keeps its **own estimate** of spending. Before each call it reserves the worst-case cost, and after each call it records the cost from the token counts the provider reported (times a 1.2 safety margin). A call that would break a cap never happens. The reservation is done in a single step, so simultaneous requests cannot overspend (the tests prove this with a 12-request burst).

**This is an estimate made by this app. It cannot guarantee your real OpenAI bill.** Reasons: prices can change, the provider may count tokens slightly differently, a request that times out may still be billed, and the record is only on this computer. **Your real protection is the prepaid-credit limit with auto-recharge off.** Always set the provider-side limit too.

Also: the spending record is a file on this machine (`.sidekick-data/`). It protects **one server process**. If you ever run several copies or host on a service without a durable disk, each copy counts separately. **Public hosting needs a shared store first.** Do not deploy publicly until that is built.

## How to set up the API key safely (do this only after you approve paid calls)

1. **Create an OpenAI account and add $5 prepaid credit.** Leave auto-recharge OFF. Set a project spend limit of $5 or less.
2. **Create a key just for Sidekick**, inside that project. If OpenAI offers restricted permissions, allow only what chat needs (the Responses API). Copy it once. You cannot see it again.
3. **Copy the template and edit the copy:**
   ```bash
   cp .env.example .env.local
   chmod 600 .env.local
   ```
   Open `.env.local` and set **both** switches:
   ```
   SIDEKICK_AI_ENABLED=true
   OPENAI_API_KEY=paste-your-key-here
   ```
4. **Restart** `npm run dev`. Check `http://localhost:3000/api/status`. It should say `"mode":"live"`. The page header will say **"Live AI · early test"**.
5. **Send one test message**, then run `npm run spend` to see the estimated cost.

Safety rules built into the project:

- The key is read only on the server. It is never sent to the browser. The tests scan the browser files for it.
- `.env.local` is in `.gitignore`. Only the placeholder `.env.example` may be committed.
- **Never** start a variable name with `NEXT_PUBLIC_`. That sends it to the browser.
- The key is never written to logs. Logs hold only counts, costs and timings, never message text.
- A key alone does nothing. `SIDEKICK_AI_ENABLED` must also be exactly `true`.
- To switch AI off at any time, set `SIDEKICK_AI_ENABLED=false` (or delete the key) and restart.
- If you ever paste a key somewhere by mistake, delete it on the OpenAI site and make a new one.

## How Phase 2A works

```
Browser                         Sidekick server                           OpenAI
-------                         ---------------                           ------
RoutedAssistantService
  asks /api/status: live or demo?
  demo  -> DemoAssistantService (local, free, unchanged)
  live  -> RemoteAssistantService
              POST /api/chat  ------------>  1. AI switched on? (else refuse)
                                             2. Same-origin + JSON only
                                             3. Rate limit (IP + global)
                                             4. Body size cap (64 KB)
                                             5. Validate every field
                                             6. Per-session limits
                                             7. Free "call slot" (max simultaneous)
                                             8. Reserve worst-case cost (spend gate)
                                             9. Call provider (timeout, no retries) ---> /v1/responses
                                            10. Record the real cost  <------------------
              reply + remaining quota <----- 11. Respond (never cached)
```

- **Provider is swappable.** `src/server/providers/types.ts` defines `ChatProvider`. `openai.ts` is the only adapter.
- **Lens and domain architecture is preserved.** The server builds the instructions from `KnowledgeService`, so the active lens (and its domains) shape the reply. Only the lens ID travels from the browser, never instructions.
- **Sidekick's voice** (warm, honest, plain-language, "validate the person, verify the facts") is in `src/server/prompt.ts`. It tells the model the truth about its limits: no documents, no memory, no internet, not a licensed professional.
- **Cost controls:** replies are capped at 500 output tokens (code ceiling 1,000). Only the last 10 messages (10,000 characters at most) are sent. Each user message is capped at 2,000 characters. `store: false`, standard pricing tier, and no hidden reasoning tokens. There are no automatic retries, because a retry could be billed twice.
- **Errors are friendly and never leak details.** Out of budget, daily limit, busy, rate limited, timeout, and provider trouble each give a clear message, and "Try again" appears only when retrying could help.
- **Fails closed.** Unknown model price, a damaged spending file, or any odd setting means demo mode or refused calls, never a silent paid call.
- **Honest labels.** "Live AI · early test" and "AI reply · early test" appear only in live mode. The privacy note changes to say messages go to OpenAI. "Re-evaluate through [lens]" is still a clearly labeled preset example. Real re-evaluation is a later milestone.

### Settings (all in `.env.local`, all server-only; see `.env.example`)

| Name | Default | Meaning |
| --- | --- | --- |
| `SIDEKICK_AI_ENABLED` | `false` | Switch 1 of 2. Must be exactly `true`. |
| `OPENAI_API_KEY` | empty | Switch 2 of 2. |
| `AI_MODEL` | `gpt-6-luna` | Pinned model name. Unknown models need `AI_PRICE_*` values or live mode stays off. |
| `AI_REASONING_EFFORT` | `none` | `none`, `minimal`, `low`, `medium`, `high`. |
| `AI_MAX_OUTPUT_TOKENS` | `500` | Reply cap (ceiling 1,000). |
| `AI_TIMEOUT_MS` | `25000` | Give up after this long (ceiling 60,000). |
| `SPEND_CAP_TOTAL_USD` / `_DAILY_USD` / `SPEND_CAP_SESSION_DAILY_USD` | `2` / `0.5` / `0.05` | Estimated caps (total ceiling $5). |
| `LIMIT_SESSION_DAILY_MESSAGES` / `_PER_MINUTE` | `30` / `8` | Per anonymous session. |
| `LIMIT_IP_PER_MINUTE` / `LIMIT_GLOBAL_PER_MINUTE` | `20` / `60` | Per IP address / everyone together. |
| `LIMIT_MAX_CONCURRENT` | `3` | Simultaneous AI calls. |

Environment variables can lower the hard ceilings, never raise them.

### Limits of anonymous usage (be aware)

- A "session" is a random cookie. Clearing cookies gives a fresh allowance, so per-session limits are a courtesy, not security.
- The IP address is best effort. It can be spoofed unless a trusted proxy sets it.
- The **global** limits (requests per minute, simultaneous calls, and the daily and total spending caps) are the real protection, because they apply to everyone together.
- Limit counters live in memory and reset when the server restarts. The spending totals are saved to disk and do not reset.
- Real fairness needs accounts, which is a later phase.

## What works now / What is not built

| Area | Status |
| --- | --- |
| Demo mode (scripted replies, no key, no network) | Works, and is the default |
| Real AI text chat (OpenAI, server-side) | **Built and tested against a fake provider only. Not yet run against real OpenAI. Needs your approval.** |
| Server-enforced limits, spending gate, timeouts, input validation | Works (tested) |
| Lenses, domains, lens switching, Suggest a Profession | Works (unchanged) |
| Re-evaluate through another lens | Preset example only, clearly labeled |
| Microphone / voice, text-to-speech | **Not built** ("Voice — coming soon") |
| Accounts, saved chats, memory, personal knowledge | **Not built** |
| Database, uploads, web search, citations, real knowledge documents | **Not built** |
| Payments, analytics, public hosting | **Not built. Do not deploy publicly yet.** |

## How the code is organized

```
src/
  domain/        Data shapes and sample data (lenses, domains)
  services/      The "plugs" the screens use (browser side)
    assistantService.ts         AssistantService interface + AssistantServiceError
    demoAssistantService.ts     Scripted free engine
    remoteAssistantService.ts   Calls our /api/chat (no keys here)
    routedAssistantService.ts   Picks demo or live from /api/status
    assistantMode.ts            Asks the server "live or demo?"
    knowledgeService.ts         KnowledgeService (unchanged)
    usagePolicy.ts              UsagePolicy (unchanged, also used by the server)
    index.ts                    Chooses the implementations
  server/        SERVER ONLY (every file starts with `import "server-only"`)
    config.ts          Reads settings, hard ceilings, known prices, fails closed
    spendLedger.ts     Spending gate + saved record
    rateLimits.ts      Per-session / per-IP / global limits, concurrency slots
    validation.ts      Checks everything the browser sends
    prompt.ts          Sidekick's personality + the active lens
    http.ts            Session cookie, same-origin check, friendly errors
    log.ts             Safe logging (counts and codes only)
    providers/         ChatProvider interface and the OpenAI adapter
  app/api/chat/route.ts     POST: the only code that calls the AI
  app/api/status/route.ts   GET: "live" or "demo", no secrets
  hooks/ components/ app/   Screens
scripts/
  fake-openai-server.mjs    Free stand-in for OpenAI, used by the tests
  test-api.mjs              End-to-end tests (npm run test:api)
  show-spend.mjs            Prints the spending record (npm run spend)
```

## Assumptions (reversible defaults)

- **Nothing is saved.** Chats live in browser memory only. The server stores only the spending totals (no message text).
- **Demo by default.** The page asks `/api/status` once. If it cannot tell, it stays in demo mode.
- **Default model** `gpt-6-luna` at `effort = none`. Prices are in `src/server/config.ts` and were verified on 2026-10-27.
- **Worst-case reservation** uses the request's byte count as an upper bound on tokens (every token is at least 1 byte). That is deliberately pessimistic, so the gate is stricter than the real bill. A few simultaneous requests can be refused near a cap.
- **Timeouts are charged as spent** (the provider may still have billed them). Calls rejected up front (bad key, rate limit) are released at no cost.
- **Closest-lens matching** in "Suggest a Profession" is keyword-based and runs in your browser. It does not use AI.
- **`/demo-error`** still triggers the demo error state, in demo mode only.
- **Light theme only.**
- The project uses Next.js 16 (App Router, TypeScript, Tailwind CSS 4). The scaffold's `cacheComponents` setting is on, which is why the API routes read the request on every call.

## Checks run for this version

| Check | Result |
| --- | --- |
| `npm run lint` | Passed, no warnings |
| `npm run typecheck` | Passed |
| `npm run build` | Passed (`/api/chat` and `/api/status` are dynamic) |
| `npm run test:api` (fake provider, 85 checks) | 85 passed, 0 failed |
| Browser, demo mode | Header and notice correct, scripted reply, zero provider calls |
| Browser, live mode (fake provider) | Live labels and honest privacy note, AI reply badge, provider error with Try again, daily-limit message with no Try again |

**Not tested:** any call to the real OpenAI service. That requires your key and your approval.

## Next step (needs your approval)

**Approve a first paid test** (about $0.01 of real usage): you create the key following the steps above, and then we send a few messages, compare Luna's replies and speed, and check `npm run spend` against the OpenAI dashboard. After that we can decide on Terra vs Luna. Voice and the other Phase 2 features come after.
