# Sidekick — Living Product Requirements Document (PRD)

**Document:** Working PRD v1.0  
**Prepared:** October 27, 2026  
**Status:** Product decisions compiled from our Sidekick planning. Intended to be updated after each numbered PRD question.  
**Confidence conventions:** **LOCKED** = user explicitly chose; **PROPOSED** = reasonable engineering implementation, still requires approval; **TBD** = undecided.

## 1. Executive summary

Sidekick is a voice-first AI thinking partner that helps professionals think clearly, make decisions, understand unfamiliar ideas, and grow in confidence. It is warm, direct, helpful, and honest. It feels like talking to someone supportive and capable without performing therapy or unsolicited psychological analysis. Sidekick should create a sense of relief, clarity, and momentum. It gives accurate, plain-language, **ELI5 by default** responses. Core maxim: **Validate the person. Verify the facts.**

The central differentiator is **Professional Lenses** backed by **reusable Knowledge Domains**, augmented by creator-curated Global Knowledge and user-contributed Personal Knowledge (with persistent user libraries/memories in the account-based release). Future growth includes lens blending, user goal progress tracking, and persistent context.

## 2. Users and use cases — LOCKED direction

- Career professionals, including people who overthink, lack confidence, are learning unfamiliar work concepts, or want a safe place to pressure-test ideas.
- People seeking a Project Manager, Product Owner, Product Manager, Operations Manager, Financial Analyst, Engineering, or other specialist perspective.
- Ask fragmented voice questions, think out loud, ask basic questions without judgment, upload notes/processes, request practical next steps.
- Not positioned as medical advice, mental-health treatment, crisis counseling, or a regulated-professional substitute.

## 3. Principles / voice / UX — LOCKED

- **Opening phrase:** “Talk to me about anything. Let’s have an honest conversation.”
- **Welcome/home:** minimal, warm/cozy AND clean/modern, professional, safe-feeling; avoid childish wellness-app aesthetics.
- **Controls visible on home:** microphone (tap to start/tap to stop when live), text input (“What’s on your mind?”), selected lens (General Guide default), Browse Professions, Suggest a Profession.
- Conversational and professional; gentle correction when facts are wrong; explain uncertainty and welcome the user's perspective without automatic agreement.
- Simple-first / ELI5 for all explanations; avoid unnecessary acronyms, jargon, and long forms.
- Some proactivity is welcome when directly useful; don't overwhelm or control the user.
- Users can conversationally teach Sidekick response preferences (e.g., “be more direct”); persistence requires the account-based memory release.
- **Voice V1 requirement:** tap once to start recording, tap again to stop; audio → transcription → AI → text. Automatic voice-end detection and spoken replies are later/optional if easy; do not block initial launch for TTS.
- Trust: surface key citations naturally and provide expanded “Show sources” where appropriate; uploaded/document/web source claims must be grounded.

## 4. Professional Lenses vs Knowledge Domains — LOCKED

**Domains = what Sidekick knows.** Examples: Agile & Scrum, Waterfall, Project Management, Product Management, Operations, Finance/Financial Analysis, General Business, Engineering, Chemical Engineering. Domain documents are reusable, not copied into every profession.

**Lenses = how Sidekick interprets and applies what it knows.** Examples: General Guide, Project Manager, Product Manager, Product Owner, Operations Manager, Financial Analyst, Structural Engineer, Chemical Engineer.

- Active lens applies to all permissible sources: Global Knowledge, Personal Knowledge, general AI knowledge, and web research if needed.
- Same Agile domain can yield different recommendations under PM, PO, or Product Manager lens.
- General Guide is default; it is not advertised as a specialized subject matter expert.
- Users can browse AND search lenses. AI-based lens suggestion from a natural-language personal description is a **later enhancement** (though ordinary conversational help in General Guide remains available).
- Users can switch lens anytime within a chat; maintain prior messages, clearly indicate lens change; clickable action to **reinterpret/re-evaluate the earlier conversation** in new lens.
- **Future roadmap:** blend two or more professional lenses (e.g. Project Manager + Financial Analyst), potentially premium. Not a Phase 1 implementation requirement.

### Missing profession — LOCKED corrected flow

1. User asks for a lens that does not exist (e.g. Supply Chain Manager).
2. Sidekick identifies closest available lens (e.g. Operations Manager), **tells user and asks approval** before switching.
3. If user accepts, start with existing knowledge; optionally use general model knowledge, then cost-limited web research **only if needed to fill a gap**, not reflexively.
4. Log unmet lens/topic requests in privacy-preserving aggregate demand reporting.
5. Creator reviews demand daily, adds verified domain knowledge and later releases creator-curated Global Knowledge. Web content is **not auto-published as Global Knowledge**.
6. If user declines, offer lens alternatives/General Guide, not a forced substitution.

## 5. Sources / knowledge / reasoning — LOCKED

**Global Knowledge:** creator-controlled domain library, versioned and released centrally; domain updates benefit all relevant professional lenses. Creator/admin can upload new professional references. Version updates do not overwrite user Personal Knowledge.

**Personal Knowledge:** user-uploaded original documents and extracted/indexed knowledge are conceptually separate. Documents provide context and guidance, not inflexible rules. Automatically use relevant permitted Personal Knowledge unless user explicitly says not to. If local company procedure conflicts with a published general framework, explain both and follow contextual appropriateness rather than forcing an absolute hierarchy.

**General knowledge and web:** use internal/model knowledge first, web only when relevant current/missing facts warrant it; web may be turned off. Show sources, avoid unwarranted certainty.

**Files supported** in planned V1 temporary session upload: PDF, TXT, DOCX, CSV, XML. One file at a time in V1 with architecture ready for bulk upload. Keep source original and derived knowledge in session during processing, with transparent retention. Suggest combining related study documents to reduce upload count. If scans/handwriting are unreadable, make a reasonable attempt, state uncertainty, and ask a focused question. Allow reasonable file and usage size limits and graceful handling for oversized documents.

**Uploaded file UX:** lightweight progress messages, then ask “Is there anything else you want me to do?” and mention users can ask what Sidekick can do with the uploaded content.

### Source scope for knowledge folders — LOCKED

- In the persistent Personal Knowledge Library, users create their own folders. AI may suggest a folder **using extracted information already available**; user confirms.
- Default: search relevant knowledge across **all active folders**.
- User can restrict Personal Knowledge to chosen folder(s) during a conversation; applies for **that conversation only**. Changing chats resets folder restriction.
- A folder restriction applies to **Personal Knowledge**, not automatically to Global Knowledge, general AI knowledge, or cost-controlled web research.
- If user explicitly asks “only use files in this folder,” honor the tighter source-only limitation and state limitations.
- Archived documents are not searched automatically but can be consulted when the user explicitly asks.

## 6. Personal Memory — LOCKED behavior; **account-based release, not anonymous V1**

**Memory is curated useful long-term facts/preferences/goals, separate from conversation history and extracted document knowledge.** Don't use all old conversations as searchable context by default; only curated memories + relevant documents + current chat.

- Automatically remember and update low-risk helpful preferences/ordinary facts; ask before saving or changing personal/sensitive data.
- When asking permission, explain **what would be learned/stored and why it would help**; let user ask questions before deciding.
- Users can view, edit, delete, and conversationally manage memories via dedicated Memory page (“What do you remember about me?”, “Forget that”).
- Show each memory, date saved, why/how it was learned, and concise provenance/source reference when available.
- Preserve original goal AND achievement when the user achieves a goal. More detailed progression tracking is later.
- Sidekick may occasionally naturally mention relevant memories but should not be intrusive.
- Memories remain until user updates/deletes them; no periodic “is this still true?” checks in initial release. For inherently time-sensitive facts, avoid presenting an old fact as certain just because it is saved.
- Memory can be paused (no new saves), switched off (no use and no new saves), or cleared.
- Before deletion, clearly explain lost personalization/preferences and require confirmation. An export feature is not required initially.
- Standard delete: removed immediately from active use, recoverable for **72 hours** from an encrypted recovery area; then purge recovery material.
- **Delete Permanently Now:** bypasses recovery with stronger confirmation; implementation must disclose unavoidable backup retention and verify purge claims. Deleted memories must not leak back into AI context during recovery.

## 7. Source, extracted knowledge, and memory deletion — LOCKED

**Separate the three layers**: (1) original uploaded document; (2) derived/indexed Personal Knowledge; (3) separately curated Personal Memory. Provenance relationships must be preserved for user-facing deletion decisions, but deletion of one is not by default deletion of all.

- When deleting a **memory created from an uploaded document**, ask whether to delete the original too; keep original if user says no. A deleted memory must not automatically regenerate itself from remaining document content without permission.
- When deleting an **original file**, by default retain its extracted knowledge. Clearly tell user Sidekick may still use retained derived knowledge; give a distinct delete-derived-knowledge option.
- When deleting **extracted knowledge**, retain any separately created Personal Memories; clearly disclose, with distinct controls to delete memories.
- When uploading a newer version of a document, do not make costly whole-library automatic comparisons. Instead, ask whether this upload **replaces a previous document**, let user select it; if yes, replace/outdate source-specific extracted knowledge, update relevant non-sensitive memories, ask permission for sensitive changes, and avoid touching unrelated memories. Do not delete old originals without consent.
- On user-approved replacement, preserve original old version **72 hours** in Recently Deleted; old version is excluded from assistant's active sources. User may restore original **plus previously extracted knowledge snapshot**, without rerunning AI extraction, while unrelated memories are not rolled back.
- If old version restored, **ask which document is active** and keep other separate/archived. Use only active by default; archived available only on explicit request.
- Offer immediate permanent-delete option, accurately reflecting any unavoidable lower-level backup retention.

## 8. Internet research and cost controls — LOCKED through question #64

- Hybrid research: use existing knowledge first, only search web if insufficient or time-sensitive, with user option to turn web off.
- Citations should be visible and useful; be honest if no current verification can be performed.
- Enforce creator-configured spending/search budgets and generous but bounded user usage (exact numbers **TBD**).
- When daily web-search limit reached, **stop new searches**, explain live research is unavailable, continue using model knowledge, Global/Personal Knowledge, and reliable cached **non-sensitive public** research when relevant. Flag possibly stale cached material.
- No unbounded automatic browsing. Do not put user-private data into shared caches.
- **Question #65 remains open:** what TTL/freshness rules apply to shared public research (fixed seven days versus topic-based freshness versus another rule).

## 9. Product phases / launch plan — V1 versus V2

### V1: anonymous, free, immediate use
- No required accounts/sign-in; clear that temporary sessions and uploads may not persist.
- Core Sidekick conversation; General Guide; browse/search/select/switch lenses; lens markers and optional reevaluation; voice input text output; source transparency; initial curated Global Knowledge; limited document upload where feasible; controlled web research and safeguards.
- Consider simple daily limits and basic abuse prevention. Limits must be technically enforceable with awareness anonymous IDs can be reset/evaded.
- **User's distribution preference:** prioritize a ChatGPT app/plugin directory pathway when feasible, with architecture that also supports standalone web; validate feasibility/policies before committing to launch path. A standalone Next.js website and an MCP/ChatGPT app are not automatically the same deployment.
- Global Knowledge admin curation and daily aggregate missing-profession demand review are creator capabilities to scope against release capacity.

### V1.1: polish / test / operational safeguards
- Accessibility, logging limits, privacy review, quality evaluation, stability, explicit storage/retention, staged launch.

### V2: account + persistence
- Accounts and user-specific durable conversations, Personal Knowledge, folders, archived versions, memory, personal preference persistence, 72-hour restore/deletion features, cross-device continuity.
- Subsequent roadmap: weekly/biweekly private growth summaries (frequency TBD), profession blending, AI lens recommendations based on natural-language description/preferences, multi-file uploads, automatic silence detection, optional TTS, enhanced goal progress tracking, richer admin analytics.

**Important scope warning:** Many detailed choices about memory and personal document library are **LOCKED as product behavior**, but their delivery is tied to the first release that supports persistent accounts. Do NOT interpret every decision as “must be shipped in anonymous V1.”

## 10. Admin/global content management — proposed implementation, product intent LOCKED

- Private creator/admin control surface with knowledge domain taxonomy, file uploads, processing status, draft/release versions, and a publish action (exact implementation **TBD**).
- One domain may feed many lenses; no duplicate Agile assets per profession.
- Track privacy-safe daily aggregates of unavailable lens requests and relevant topic demand, allowing creator to fill gaps using reviewed Global Knowledge releases.
- Exact dashboard fields and AI-generated recommendations are **TBD**, not a requirement to store full user conversations. Do not log raw sensitive/private content as analytics by default.
- Unresolved earlier decision: whether log displays only counts, common topics, anonymized use cases, and/or suggested content priorities (prior options A–D were discussed but not selected).

## 11. Security, honesty, and test requirements — implementation constraints

- Don't present Sidekick as a licensed professional. Medical/legal/financial high-stakes guidance should communicate limits where relevant.
- Separate creator Global Knowledge from per-user Personal Knowledge: no data leakage between accounts or sessions.
- Avoid saving sensitive data without explicit informed choice, and don't log it to analytics by default.
- Respect no-web setting and user-only-documents source restrictions.
- Backend stores API credentials in server environment; never expose secrets to browser; create per-user/anonymous guardrails to limit cost abuse.
- Make deletion/recovery transactional/verified to avoid resurrecting removed knowledge or mishandling document versions.
- Do not claim upload comprehension, memory persistence, citations, or internet verification unless implemented and functioning.
- When tool source says something different from existing knowledge, reconcile transparently rather than blindly asserting.
- Design accessible keyboard controls, mobile responsive layout, and test failure/error UX.

## 12. Core conceptual data models — PROPOSED, not fixed schema

- `KnowledgeDomain { id, name, description, status, version }`
- `ProfessionalLens { id, name, description, enabled, domainIds[], framingInstructions }`
- `GlobalKnowledgeAsset { id, domainIds[], version, provenance, status }`
- `Conversation { id, activeLensId, permittedPersonalFolderIds?, webEnabled, messages[] }`
- `ConversationMessage { id, role, text, lensId?, sourceRefs?, createdAt }`
- `UserDocument { id, ownerId?, folderId?, activeVersionId?, archiveStatus }`
- `DocumentVersion { id, documentId, originalPath?, extractedSnapshotRef?, active, recoverUntil? }`
- `ExtractedKnowledgeItem { id, documentVersionId, contentRef, allowedToUse }`
- `PersonalMemory { id, ownerId, fact, sourceRef?, createdAt, updatedAt, sensitive, status, deletedAt?, purgeAt? }`
- `ProfessionDemandEvent/Aggregate { lensOrTopic, day, count, closestAvailableLens }`

These conceptual models inform future architecture. No database should be created in Phase 1 merely because models appear here.

## 13. Acceptance tests (grouped by when applicable)

**Phase 1 local/demo:**
1. Home loads with exact opening phrase and a clean responsive layout.
2. General Guide starts selected. Browse and search return appropriate sample lenses.
3. User types a message; deterministic demo text reply is clearly marked as mock; no external usage fees incurred.
4. Switch Project Manager → Operations Manager, keep chat transcript, show lens-change marker, new replies demonstrate different perspective.
5. User can activate a demo re-evaluation affordance; no false claim of AI processing.
6. Microphone is visibly marked coming soon rather than silently pretending speech works.
7. README provides exact setup, tests executed, current capabilities/limitations.

**Actual V1 AI/voice later:**
8. Tap-to-start/stop voice transcribes reliably on the chosen supported browsers or transparently offers fallback.
9. Global domains may be referenced by more than one professional lens without duplication.
10. No-op/stop when search budget exhausted, with explicit stale-data qualification.
11. Unavailable lens asks permission before switching; no unnecessary paid web research; aggregate demand counter works.

**Account-based release later:**
12. User scope to Work Projects persists only for the current conversation.
13. Memory consent gates sensitive personal data and can explain proposed data extracted before asking.
14. Delete original retains extracted knowledge by default; deleting extracted knowledge retains standalone memory by default.
15. A removed memory is excluded from all active retrieval immediately; 72-hour recover works; permanent delete acts subject to honest disclosed retention.
16. Replaced document restores original and derived snapshot without reprocessing; user chooses active version; archived version not used without asking.

## 14. Questions / decisions remaining

- **#65:** Web research cache duration/freshness rules.
- AI vendor/model, cost forecast based on real usage assumptions, hard daily search caps, provider voice/transcription, deployment budget.
- Source licensing and upload limits; how source citations and evidence verification appear in actual UI.
- What data V1 session retains, for how long, and how anonymous users control deletion.
- Which Global Knowledge domains and professional lenses launch with actual curated content; licensing/ownership of uploaded source material.
- Technical and directory review for ChatGPT plugin/app launch; integration choice may affect native voice and available chat history.
- Admin demand-log fields and privacy-preserving example capture.
- Persistent data hosting, consent details, authentication, backup retention, compliance, and user export roadmap.
- Versioning and cost thresholds for future features.

---

### PRD update rule

When user answers a numbered question, update the relevant section, mark as **LOCKED**, add a short entry to `DECISION_LOG.md`, and continue numbering from the latest agreed question. Do not rewrite previous decisions to fit your implementation preferences. If two requirements conflict, identify the conflict and request a decision before implementing that conflicting component.
