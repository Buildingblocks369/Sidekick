import type { ConversationMessage, ConversationScope } from "@/domain/types";

export interface AssistantReplyRequest {
  /** The whole conversation so far, including lens-change markers. */
  messages: ConversationMessage[];
  scope: ConversationScope;
}

export interface AssistantReply {
  text: string;
  /** True when produced by the local demo engine (not a real AI). */
  isDemo: boolean;
}

export interface ReevaluationRequest {
  messages: ConversationMessage[];
  /** The lens to "re-read" the conversation through. */
  targetLensId: string;
}

/**
 * AssistantService is the "brain" seam.
 * Phase 1 plugged in a scripted demo engine. Phase 2A adds a real AI behind the same
 * shape (called through our own server, so API keys never reach the browser).
 */
export interface AssistantService {
  reply(request: AssistantReplyRequest): Promise<AssistantReply>;
  reevaluate(request: ReevaluationRequest): Promise<AssistantReply>;
}

/**
 * An error whose message is safe and friendly enough to show to the person chatting.
 * `retryable` tells the screen whether a "Try again" button makes sense.
 */
export class AssistantServiceError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "AssistantServiceError";
  }
}
