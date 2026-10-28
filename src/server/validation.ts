import "server-only";
import { INPUT_LIMITS } from "./config";
import { knowledgeService } from "@/services/knowledgeService";
import { usagePolicy } from "@/services/usagePolicy";

/**
 * Checks everything the browser sends. We never trust it:
 * the lens must exist, roles must be user/assistant (never "system"), text must be
 * a reasonable size, and only the most recent part of the chat is forwarded.
 */

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
  lensId: string;
}

export interface ValidChatRequest {
  lensId: string;
  /** Trimmed to the most recent messages; always ends with a user message. */
  turns: ChatTurn[];
  /** Names of other lenses used earlier in this chat (oldest first, no repeats). */
  earlierLensIds: string[];
}

export type ValidationResult =
  | { ok: true; value: ValidChatRequest }
  | { ok: false; message: string };

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function clean(text: string): string {
  return text.replace(CONTROL_CHARS, "").trim();
}

export function validateChatRequest(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "The request was not understood." };
  }
  const { lensId, messages } = body as { lensId?: unknown; messages?: unknown };

  if (typeof lensId !== "string" || !knowledgeService.listLenses().some((l) => l.id === lensId)) {
    return { ok: false, message: "Unknown lens." };
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, message: "There is no message to reply to." };
  }
  if (messages.length > INPUT_LIMITS.maxClientMessages) {
    return { ok: false, message: "This conversation is too long. Please start a new one." };
  }

  const turns: ChatTurn[] = [];
  for (const raw of messages) {
    if (typeof raw !== "object" || raw === null) {
      return { ok: false, message: "A message was not understood." };
    }
    const { role, text, lensId: messageLensId } = raw as {
      role?: unknown;
      text?: unknown;
      lensId?: unknown;
    };
    if (role !== "user" && role !== "assistant") {
      return { ok: false, message: "A message had an unsupported role." };
    }
    if (typeof text !== "string") {
      return { ok: false, message: "A message had no text." };
    }
    const cleaned = clean(text);
    if (cleaned.length === 0) {
      return { ok: false, message: "A message was empty." };
    }
    const decision =
      role === "user"
        ? usagePolicy.checkMessage(cleaned)
        : cleaned.length > INPUT_LIMITS.maxAssistantMessageChars
          ? { allowed: false, reason: "An earlier reply was too long to include." }
          : { allowed: true };
    if (!decision.allowed) {
      return { ok: false, message: decision.reason ?? "A message was not allowed." };
    }
    const lensForMessage =
      typeof messageLensId === "string" &&
      knowledgeService.listLenses().some((l) => l.id === messageLensId)
        ? messageLensId
        : lensId;
    turns.push({ role, text: cleaned, lensId: lensForMessage });
  }

  if (turns[turns.length - 1].role !== "user") {
    return { ok: false, message: "The last message must be from you." };
  }

  // Forward only recent context, capped by count and by total characters.
  let recent = turns.slice(-INPUT_LIMITS.maxContextMessages);
  let total = recent.reduce((sum, t) => sum + t.text.length, 0);
  while (recent.length > 1 && total > INPUT_LIMITS.maxContextChars) {
    total -= recent[0].text.length;
    recent = recent.slice(1);
  }
  // A chat should start with a user message.
  while (recent.length > 1 && recent[0].role !== "user") recent = recent.slice(1);

  const earlierLensIds: string[] = [];
  for (const turn of recent) {
    if (turn.lensId !== lensId && !earlierLensIds.includes(turn.lensId)) {
      earlierLensIds.push(turn.lensId);
    }
  }

  return { ok: true, value: { lensId, turns: recent, earlierLensIds } };
}
