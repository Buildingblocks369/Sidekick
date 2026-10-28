# SIDEKICK — MASTER CURSOR BUILD PROMPT v1.0

**Use:** Place this file and `SIDEKICK_LIVING_PRD_V1.md` at the root of your Cursor workspace. Give Cursor Agent the **First instruction to Cursor** below. This is a working master brief, **not** a command to build everything at once.

## First instruction to Cursor (copy/paste into Cursor Agent)

You are my senior full-stack engineer, product-minded technical architect, and patient teacher. We are building **Sidekick**, a low-cost, voice-first AI thinking partner for professionals. Read `SIDEKICK_MASTER_CURSOR_PROMPT_V1.md` and `SIDEKICK_LIVING_PRD_V1.md` fully before you make any changes. Treat the PRD's LOCKED decisions as authoritative, and distinguish MVP features from future-roadmap features.

**Your task in this run is PHASE 1 ONLY: create a locally runnable, polished, responsive, accessible Sidekick foundation with mock data, NOT production AI integrations.** Do not implement accounts, persistent personal memories, paid features, web search, document processing, or production ChatGPT/MCP integration yet. You may create clearly labeled interfaces/stubs that make those features easier to add later, but do not pretend those features work.

1. Inspect the current workspace and describe what exists in 3–6 plain-English bullets. If it is empty, start from a current stable **Next.js App Router + TypeScript + Tailwind CSS** project. Prefer standard dependencies and minimal complexity. Verify any framework-specific commands against current installed versions/docs when needed.
2. Present a concise implementation plan (Phase 1 only), clearly identifying what is real and what is simulated. Then implement it, run available checks, and fix errors.
3. Build a warm-but-professional, uncluttered Sidekick interface. Hero name: **Sidekick**. Opening sentence exactly: **“Talk to me about anything. Let’s have an honest conversation.”** Include text input (placeholder **“What’s on your mind?”**), a visible microphone affordance labeled **“Voice — coming soon”** (unless speech-to-text is truly implemented and tested), current lens selector defaulting to **General Guide**, **Browse Professions**, and **Suggest a Profession**. No mandatory sign-in.
4. Create a browse/search lens picker backed by data, using sample lenses: General Guide, Project Manager, Product Manager, Product Owner, Operations Manager, Financial Analyst, Structural Engineer, Chemical Engineer. Distinguish **Professional Lenses** from **Knowledge Domains** in the data models. Sample domains: Agile & Scrum, Waterfall, Project Management, Product Management, Operations, Finance, General Business, Engineering, Chemical Engineering. Do not copy domain content into every lens.
5. Build a chat screen using a clearly labeled **demo response engine** (deterministic local example replies; no OpenAI API calls). Support changing the active lens mid-conversation while retaining messages and marking the change in the transcript. Add a clickable **“Re-evaluate this conversation through [lens]”** option, but in mock mode make its limitations explicit; it can demonstrate the UI with a preset example and should not claim that real AI reasoning happened. The lens must affect demo responses so the conceptual difference is observable.
6. Provide a minimal responsive design with keyboard operation, visible focus indicators, accessible labels, empty/loading/error states where relevant, and no fake production integrations.
7. Separate UI from future services with small, readable abstractions, such as `Lens`, `KnowledgeDomain`, `ConversationMessage`, `ConversationScope`, `AssistantService`, `KnowledgeService`, and `UsagePolicy`. Do not create unnecessary infrastructure or add a database in Phase 1. Keep code modular enough to later support a web client and an MCP/ChatGPT app adapter backed by shared services.
8. Add `README.md` with exact local setup and run commands, an architectural overview, a **What works now / What is not built** table, and the next small development milestone. Include `.env.example` with placeholders only if required, never secrets. Keep model/API keys server-side in future stages.
9. Run lint/typecheck/build as available and report which commands passed or failed. Do not claim success unless you actually ran them. Show me the local URL/command to open it and explain in simple English how to verify the lens switch feature.
10. When Phase 1 is finished, **STOP**. Ask for my approval before implementing Phase 2. Do not proactively install payment, auth, voice SaaS, database, analytics, or cloud hosting.

**Working style:** I am not an experienced programmer. Explain technical decisions in ELI5 language. Be budget-conscious, show small steps, don't overwhelm me with a large code dump, don't skip verification, and avoid overengineering. If a detail isn't decided, use a reversible default, label it an assumption in the README, and ask me only when truly blocking progress. Do not modify LOCKED requirements without my explicit permission.

---

## Project vision (applies across phases)

Sidekick is a **supportive, honest, practical AI thinking partner**, primarily for professionals learning, deciding, problem-solving, and developing confidence. It is not a therapist, mental-health diagnosis app, or a generic unstructured chatbot. It should help users feel relief and clarity after talking. Core behavior: **“Validate the person. Verify the facts.”** Gently correct unsupported assumptions, avoid unsolicited psychoanalysis, and explain things **simply by default (ELI5)** without sacrificing truth.

A user chooses a **Professional Lens** — the perspective with which Sidekick applies knowledge. A **Knowledge Domain** is reusable information, independent of the lens. Example: the Agile & Scrum domain can inform a Project Manager, Product Owner, or Product Manager lens, with different emphases. The active lens applies to creator-curated Global Knowledge, permitted user Personal Knowledge, general model knowledge, and occasional necessary web research. When a requested lens is missing, suggest the closest available lens **and ask permission before using it**, then optionally fill gaps using general knowledge or cost-controlled web research only when needed; log unmet demand for admin review later.

Important distinctions:
- **Global Knowledge:** curated by Sidekick creator, categorized into reusable domains, versioned, publishable without deleting any user data.
- **Personal Knowledge:** user-supplied files and extracted/indexed information, with user-managed folders, versioning, deletion/recovery, and archived items in the account-based release.
- **Personal Memory:** a curated set of useful preferences/facts/goals, distinct from conversation history and distinct from extracted document knowledge.
- **Professional Lens:** governs the perspective of the final answer, not ownership or duplication of knowledge.
- **Conversation source scope:** optional restrictions to selected Personal Knowledge folders for the current conversation; this does not restrict Global Knowledge unless the user explicitly requests source-only responses.

## Incremental delivery plan (do NOT build all in one pass)

### Phase 1 — Local visual foundation (NOW)
- Next.js/TypeScript/Tailwind local app, with clean component boundaries.
- Home, text chat demo, search/browse lenses, lens switching, clear perspective-change marker, re-evaluation demo affordance.
- General Guide default, visible Suggest a Profession action, simple warm polished UI.
- Deterministic mock demo only; no external API charges, keys, user accounts, or persistence promises.
- Cost expectation: **$0 AI usage for running this local demo**, excluding any paid IDE tools already owned; local compute required.

### Phase 2 — Real AI chat + voice-to-text + initial knowledge logic
- Choose exact AI provider/model based on up-to-date quality, API prices, privacy, and limits; keep choice configurable.
- Add server-side AI chat; prompt and retrieval source precedence; basic conversation scope; source visibility; safe error handling.
- V1 voice input as tap-to-start/tap-to-stop → transcription → Sidekick → text response; optional spoken replies only if economical and not blocking MVP.
- Add limited creator-curated Global Knowledge domains and evaluation examples.
- Add cost instrumentation, request rate/usage limits, abuse protection, optional/cost-bounded web search and cache policy when decided.
- Verify actual usage pricing with current provider docs before selecting.

### Phase 3 — Anonymous V1 launch hardening
- No required account; temporary session data with honest clear retention notices.
- PDF/TXT/DOCX/CSV/XML one-at-a-time session document uploads, size/usage limits, and graceful failures, **only after storage/processing design and security review**.
- Profession suggestion/unavailable-lens logging with privacy-preserving aggregated admin reporting; creator-curated knowledge publishing workflow if prioritized.
- Accessibility, privacy, abuse handling, errors, deploy/test, and compatibility checks for distribution through a ChatGPT-compatible MCP app adapter if launch channel is approved.
- Clarify up front that an ordinary Next.js page is not automatically a ChatGPT app; an MCP server and optionally an MCP Apps UI adapter may be required.

### Phase 4 — Account-based persistent V2 (future, not anonymous V1)
- Login, persistent Personal Knowledge and document/folder library, persistent Personal Memory with permission controls, per-item deletion, 72-hour recovery, archive/versioning, cross-device continuity.
- User can pause/turn off/clear Memory, with explicit immediate permanent-delete option and transparent backup retention.
- User-directed upload replacement and memory updates, growth summary/goal tracking enhancements, blended professional lenses as a separate future/premium possibility.

## Engineering principles

1. **Cost-first:** no silent paid calls, hard budgets where tools support them, usage counters, caching for public non-sensitive research, keep the API model configurable. Never claim a numeric operational cost without a measured traffic scenario and current prices.
2. **Truthful UX:** disabled/unbuilt features are marked as coming soon, not functional. Tool citations/source claims only when a source was actually used. Do not claim web research happened in mock mode.
3. **Privacy-by-design:** no browser-exposed API secrets; no public/shared cache of user-private data; sensitive memory requires explicit opt-in; no deleted memory should affect AI answers during recovery. State accurately what can be purged from backups and when.
4. **Source control and provenance:** keep future associations between document original, extracted knowledge, generated memories, and versions without assuming deleting one deletes all three.
5. **Professional lens remains active:** every real response uses the selected lens while respecting user-specified source restrictions and model uncertainty.
6. **No overengineering:** avoid microservices, premature vector databases, auth providers, queue systems, and analytics dashboards unless a concrete milestone requires them. Favor readable service seams over speculative implementation.
7. **Verify changes:** test every milestone locally, document commands and known limitations, and stop for approval before beginning a new phase.
8. **Current docs:** verify integration assumptions from official documentation when implementing, especially Next.js, OpenAI Responses API, MCP/ChatGPT app capabilities, and provider pricing.

## Product examples / acceptance checks for later phases

- General Guide can discuss a career decision without presenting itself as a specialist.
- Project Manager and Operations Manager apply different frames to the same delayed project problem using shared domains.
- Switching a lens retains conversational context and leaves an explicit marker; optional user-triggered reevaluation is available.
- Unavailable lens flows **suggest closest → ask user's approval → use knowledge first → web only if needed**; demand is logged with privacy-preserving aggregate counts.
- If a user says “Only use my Work Projects folder for this conversation,” Sidekick restricts Personal Knowledge to that folder but may use Global Knowledge and general model knowledge unless told otherwise.
- Uploaded Personal Knowledge is used when relevant unless user prohibits it; conflicting personal company procedures are distinguished from general frameworks.
- User asks “What do you remember about me?” and can view/edit/delete curated memory when persistent Memory ships.
- Deleted memory is never used during its 72-hour recovery window; older uploaded document can be restored with its retained extracted snapshot; changing a document does not secretly roll back unrelated memories.

## Open decisions — not permission to improvise expensive integrations

- Question #65: public web research cache duration/freshness policy.
- Specific AI model/provider, speech recognition service, per-user daily quota and spending cap, hosting/DB/vendor, source licensing, detailed data retention/legal and compliance policies, first-release MCP/ChatGPT distribution feasibility, pricing/monetization.
- Exact V1 admin dashboard minimum and safe analytics retention.
- Whether release numbering should remain "V1/V2" after scope adjustment; treat phase names as implementation staging, not unalterable marketing versions.

## Official reference links (check for updates when implementing)

- Next.js docs: https://nextjs.org/docs
- OpenAI Responses API: https://developers.openai.com/api/reference/responses/overview
- OpenAI web search: https://developers.openai.com/api/docs/guides/tools-web-search
- OpenAI file search: https://developers.openai.com/api/docs/guides/tools-file-search
- ChatGPT MCP server/UI quickstart: https://developers.openai.com/plugins/build/app-quickstart

**END OF MASTER PROMPT — In the first Cursor run, build Phase 1 and STOP.**
