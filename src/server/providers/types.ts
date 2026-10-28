import "server-only";
import type { TokenUsage } from "../spendLedger";

/**
 * The seam that keeps the AI vendor swappable.
 * To add another provider (say Google Gemini), write a new file that implements
 * `ChatProvider`, and choose it in `providers/index.ts`. Nothing else changes:
 * the route, limits, spending gate, and screens only know this shape.
 */

export interface ProviderMessage {
  role: "user" | "assistant";
  text: string;
}

export interface ProviderRequest {
  system: string;
  messages: ProviderMessage[];
  maxOutputTokens: number;
  /** Hashed, stable per anonymous session. Helps the provider spot abuse. Never a real identity. */
  safetyId: string;
  /** Aborts the call when the timeout expires. */
  signal: AbortSignal;
}

export interface ProviderResult {
  text: string;
  usage: TokenUsage;
  /** "length" means the reply was cut off by the output cap. */
  finishReason: "complete" | "length";
}

/**
 * What a failure means for billing. This decides what the spending gate does.
 *  - "not_processed": the provider rejected it up front (bad key, rate limit...). Costs nothing.
 *  - "processed": it ran and we know the exact token usage (e.g. the model refused). Billed exactly.
 *  - "unknown": it may have been processed (timeout, dropped connection). Counted as spent.
 */
export type ProviderErrorKind =
  | "auth"
  | "provider_budget"
  | "rate_limited"
  | "rejected"
  | "unavailable"
  | "timeout"
  | "refusal"
  | "bad_response";

export class ProviderError extends Error {
  constructor(
    public readonly kind: ProviderErrorKind,
    public readonly billing: "not_processed" | "processed" | "unknown",
    public readonly httpStatus?: number,
    /** Present when billing is "processed". */
    public readonly usage?: TokenUsage,
  ) {
    // The message is deliberately generic. It never includes provider text or secrets.
    super(`provider error: ${kind}`);
    this.name = "ProviderError";
  }
}

export interface ChatProvider {
  readonly name: string;
  generate(request: ProviderRequest): Promise<ProviderResult>;
}
