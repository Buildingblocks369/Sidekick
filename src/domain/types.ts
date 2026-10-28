/**
 * Core data shapes for Sidekick.
 *
 * Plain-English guide:
 * - A KnowledgeDomain is "what Sidekick knows" (e.g. Agile & Scrum).
 * - A Lens is "how Sidekick looks at things" (e.g. Project Manager).
 * - One domain can feed many lenses, so we never copy domain content into a lens.
 *   A lens only lists the IDs of the domains it draws on.
 */

/** Reusable information, independent of any profession. */
export interface KnowledgeDomain {
  id: string;
  name: string;
  description: string;
}

/** The professional perspective Sidekick uses when it answers. */
export interface Lens {
  id: string;
  name: string;
  description: string;
  /** Short phrase describing what this lens pays most attention to. */
  focus: string;
  /** Which knowledge domains this lens draws on (IDs only, no copied content). */
  domainIds: string[];
  /** Extra words people might use when searching or suggesting this lens. */
  keywords: string[];
  enabled: boolean;
}

export type MessageRole = "user" | "assistant" | "system";

/**
 * - "text": a normal chat message.
 * - "lens-change": a marker line saying the lens changed.
 * - "reevaluation-demo": a preset example shown by the demo re-evaluate button.
 */
export type MessageKind = "text" | "lens-change" | "reevaluation-demo";

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  kind: MessageKind;
  text: string;
  /** The lens that was active when this message was created. */
  lensId: string;
  /** Only for "lens-change" markers: the lens we switched away from. */
  fromLensId?: string;
  /** Only for "reevaluation-demo": the marker message this example belongs to. */
  relatedMessageId?: string;
  /** True when the text came from the local demo engine, not a real AI. */
  isDemo?: boolean;
  createdAt: string;
}

/**
 * The settings that apply to the current conversation.
 * Phase 1 only uses `lensId`. The other fields exist so future phases
 * (folder restrictions, web research) have a clear place to live.
 * They do nothing yet.
 */
export interface ConversationScope {
  lensId: string;
  /** Not used yet. Reserved for "only use my Work Projects folder" (later phase). */
  personalFolderIds: string[];
  /** Not used yet. Web research is not built, so this is always false. */
  webEnabled: boolean;
}
