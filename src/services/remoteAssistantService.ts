import {
  AssistantServiceError,
  type AssistantReply,
  type AssistantReplyRequest,
  type AssistantService,
  type ReevaluationRequest,
} from "./assistantService";

/** Longer than the server's own timeout, so the server's friendlier message wins. */
const CLIENT_TIMEOUT_MS = 40_000;

/**
 * Calls our server (`/api/chat`), which holds the API key and talks to the AI provider.
 * The browser never sees a key, and never talks to the provider directly.
 */
export class RemoteAssistantService implements AssistantService {
  constructor(private readonly fallbackForReevaluation: AssistantService) {}

  async reply({ messages, scope }: AssistantReplyRequest): Promise<AssistantReply> {
    // Send only real chat messages. Lens-change markers and demo examples stay in the browser.
    const turns = messages
      .filter((m) => m.kind === "text" && (m.role === "user" || m.role === "assistant"))
      .map((m) => ({ role: m.role, text: m.text, lensId: m.lensId }));

    let response: Response;
    try {
      response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lensId: scope.lensId, messages: turns }),
        signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
      });
    } catch {
      throw new AssistantServiceError(
        "Couldn’t reach Sidekick’s server. Check your connection and try again.",
        true,
      );
    }

    if (!response.ok) {
      let message = "Something went wrong while writing a reply. Please try again.";
      let retryable = true;
      try {
        const data = (await response.json()) as {
          error?: { message?: string; retryable?: boolean };
        };
        if (typeof data.error?.message === "string") message = data.error.message;
        if (typeof data.error?.retryable === "boolean") retryable = data.error.retryable;
      } catch {
        // Keep the generic message.
      }
      throw new AssistantServiceError(message, retryable);
    }

    const data = (await response.json()) as { reply?: { text?: string } };
    const text = data.reply?.text;
    if (typeof text !== "string" || text.length === 0) {
      throw new AssistantServiceError("The reply came back empty. Please try again.", true);
    }
    return { text, isDemo: false };
  }

  /** Real re-evaluation is a later milestone. Keep showing the clearly labeled preset example. */
  reevaluate(request: ReevaluationRequest): Promise<AssistantReply> {
    return this.fallbackForReevaluation.reevaluate(request);
  }
}
