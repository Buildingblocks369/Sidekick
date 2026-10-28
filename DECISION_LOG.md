# Sidekick — Decision Log

Keep brief chronological records of new explicitly confirmed decisions. The authoritative consolidated specification is `SIDEKICK_LIVING_PRD_V1.md`.

## Seeded decisions through Question #64 (compiled October 27, 2026)

- Professional Lenses are distinct from reusable Knowledge Domains; no duplicated common domains.
- Users browse/search lenses, General Guide default; may switch lenses mid-conversation and request reinterpretation.
- Missing lens: suggest closest and obtain user approval before use; fill gaps only when necessary; record aggregate demand for admin.
- Personal Knowledge used contextually by default, unless user restricts it; workplace practice vs general knowledge explained appropriately.
- Memory: curated, consent for sensitive facts, user edits, dated/source-backed explanations, retention/deletion and recovery controls; persistent features belong to account-based release.
- Original files, extracted Personal Knowledge, and Personal Memories have separate deletion semantics.
- Documents: low-cost user-directed replacements, 72-hour recovery, old knowledge snapshot restoration, active/archived choice, explicit archive access.
- Personal Knowledge folders: user-created with low-cost AI filing suggestions; default search active folders; per-chat folder restriction only.
- Web research: existing knowledge first; necessary search with budget and disable option; at budget cap stop new searches but use reliable cached public information and disclose staleness.
- Outstanding: Question #65 web cache freshness policy.

## Phase 2A (October 27, 2026)

Confirmed by the owner:

- Phase 2 proceeds incrementally with minimal API cost. Phase 2A is real text chat only (no voice, accounts, database, uploads, or web search yet).
- AssistantService, KnowledgeService, UsagePolicy, and the existing UI are preserved. The AI provider stays swappable. Secrets stay on the server only.
- Anonymous usage gets server-enforced per-session limits and rate limiting. A concurrency-safe spending gate tracks estimated spend. Estimated app caps cannot guarantee the provider's final bill (documented).
- Demo mode keeps working when no API key is configured. No public deployment. No paid resources, billing activation, or paid API calls without explicit owner approval.

Proposed by the build, awaiting owner approval (not yet active):

- Start with OpenAI GPT-6 Luna at reasoning effort `none`. Terra is the quality-upgrade candidate. Gemini 2.5 Flash-Lite is limited to existing Google users, so it is not a fit for a new project.
- Initial development budget of $5 or less: $5 minimum prepaid credit, auto-recharge OFF, provider-side limit, and app caps of $2 total and $0.50 per day.
- Live AI requires two switches: `SIDEKICK_AI_ENABLED=true` and a provider key. The system fails closed on any unclear setting.
- Outstanding: measure Luna's real latency and reply quality in a first small paid test. Public hosting needs a shared spending store and accounts first.
