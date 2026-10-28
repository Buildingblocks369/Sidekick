import "server-only";
import type { ReasoningEffort } from "../config";
import {
  ProviderError,
  type ChatProvider,
  type ProviderRequest,
  type ProviderResult,
} from "./types";

/**
 * OpenAI adapter using the Responses API (POST /v1/responses).
 * Verified against OpenAI's API reference on 2026-10-27.
 *
 * Choices that protect cost and privacy:
 *  - store: false            Don't keep the conversation on OpenAI's side for retrieval.
 *  - service_tier: "default" Standard pricing. Never accidentally use 2x-priced "Fast" mode.
 *  - max_output_tokens       Hard cap on the reply. It also covers hidden reasoning tokens.
 *  - reasoning.effort        "none" by default: no hidden thinking tokens (cheaper, faster).
 *  - safety_identifier       A hashed per-session ID, never a name or email.
 *  - No retries              A retry could be billed twice. The user can press "Try again".
 *
 * The API key is only ever placed in the Authorization header of this one request.
 * It is never logged, and error messages never contain provider text.
 */

interface OpenAiOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  reasoningEffort: ReasoningEffort;
}

/** OpenAI error codes that mean "your spend limit or credits ran out" (not a short rate limit). */
const BUDGET_CODES = new Set([
  "insufficient_quota",
  "credit_balance_exhausted",
  "project_spend_limit_exceeded",
  "organization_spend_limit_exceeded",
  "organization_usage_limit_exceeded",
]);

/** Network errors that happen before any request could have reached the provider. */
const NEVER_SENT_CODES = new Set(["ENOTFOUND", "ECONNREFUSED", "EAI_AGAIN"]);

interface OutputContent {
  type?: string;
  text?: string;
}
interface OutputItem {
  type?: string;
  content?: OutputContent[];
}
interface ResponsesBody {
  status?: string;
  error?: unknown;
  incomplete_details?: { reason?: string } | null;
  output?: OutputItem[];
  usage?: {
    input_tokens?: number;
    input_tokens_details?: { cached_tokens?: number; cache_write_tokens?: number };
    output_tokens?: number;
    output_tokens_details?: { reasoning_tokens?: number };
  };
}

function asCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

export class OpenAiProvider implements ChatProvider {
  readonly name = "openai";

  constructor(private readonly options: OpenAiOptions) {}

  async generate(request: ProviderRequest): Promise<ProviderResult> {
    const body = {
      model: this.options.model,
      instructions: request.system,
      input: request.messages.map((m) => ({ role: m.role, content: m.text })),
      max_output_tokens: request.maxOutputTokens,
      reasoning: { effort: this.options.reasoningEffort },
      store: false,
      service_tier: "default",
      safety_identifier: request.safetyId,
    };

    let response: Response;
    try {
      response = await fetch(`${this.options.baseUrl}/responses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: request.signal,
        cache: "no-store",
      });
    } catch (error) {
      if (request.signal.aborted) throw new ProviderError("timeout", "unknown");
      const code = (error as { cause?: { code?: string } })?.cause?.code;
      if (code && NEVER_SENT_CODES.has(code)) throw new ProviderError("unavailable", "not_processed");
      throw new ProviderError("unavailable", "unknown");
    }

    if (!response.ok) {
      let code = "";
      try {
        const errorBody = (await response.json()) as { error?: { code?: string; type?: string } };
        code = String(errorBody?.error?.code ?? errorBody?.error?.type ?? "");
      } catch {
        // Ignore unreadable error bodies. The status code is enough.
      }
      const status = response.status;
      if (status === 401 || status === 403) throw new ProviderError("auth", "not_processed", status);
      if (status === 429) {
        throw new ProviderError(
          BUDGET_CODES.has(code) ? "provider_budget" : "rate_limited",
          "not_processed",
          status,
        );
      }
      if (status >= 500 || status === 408) throw new ProviderError("unavailable", "unknown", status);
      throw new ProviderError("rejected", "not_processed", status);
    }

    let data: ResponsesBody;
    try {
      data = (await response.json()) as ResponsesBody;
    } catch {
      // We got a success status but no readable body. It was probably processed.
      if (request.signal.aborted) throw new ProviderError("timeout", "unknown");
      throw new ProviderError("bad_response", "unknown");
    }

    const usage = {
      inputTokens: asCount(data.usage?.input_tokens),
      cachedInputTokens: asCount(data.usage?.input_tokens_details?.cached_tokens),
      cacheWriteTokens: asCount(data.usage?.input_tokens_details?.cache_write_tokens),
      outputTokens: asCount(data.usage?.output_tokens),
      reasoningTokens: asCount(data.usage?.output_tokens_details?.reasoning_tokens),
    };

    // If the provider reported token usage, it did the work and we can bill it exactly.
    const processed = usage.inputTokens > 0;

    if (data.error || data.status === "failed") {
      throw processed
        ? new ProviderError("unavailable", "processed", undefined, usage)
        : new ProviderError("unavailable", "unknown");
    }

    let text = "";
    let refused = false;
    for (const item of data.output ?? []) {
      if (item.type !== "message") continue;
      for (const part of item.content ?? []) {
        if (part.type === "output_text" && typeof part.text === "string") text += part.text;
        if (part.type === "refusal") refused = true;
      }
    }
    text = text.trim();

    if (!text) {
      const kind = refused ? "refusal" : "bad_response";
      throw processed
        ? new ProviderError(kind, "processed", undefined, usage)
        : new ProviderError(kind, "unknown");
    }

    return {
      text,
      usage,
      finishReason:
        data.status === "incomplete" && data.incomplete_details?.reason === "max_output_tokens"
          ? "length"
          : "complete",
    };
  }
}
