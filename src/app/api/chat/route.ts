import { NextResponse, type NextRequest } from "next/server";
import { getAiConfig, INPUT_LIMITS } from "@/server/config";
import {
  applySession,
  clientIp,
  errorResponse,
  getSession,
  isSameOrigin,
  readBodyLimited,
  safetyIdFor,
} from "@/server/http";
import { logEvent } from "@/server/log";
import { buildSystemPrompt } from "@/server/prompt";
import { createProvider } from "@/server/providers";
import { ProviderError, type ProviderErrorKind } from "@/server/providers/types";
import { getLimiter } from "@/server/rateLimits";
import { costFromUsage, getLedger, worstCaseCost } from "@/server/spendLedger";
import { validateChatRequest } from "@/server/validation";

/**
 * POST /api/chat: the only place that talks to the AI provider.
 *
 * Order of checks (cheapest first, so bad traffic costs us almost nothing):
 *   AI switched on? -> same-origin + JSON? -> IP/global rate limit -> body size ->
 *   validation -> session limits -> free call slot -> spending reservation -> provider call
 *   -> record real cost.
 */

const PROVIDER_ERROR_RESPONSES: Record<
  ProviderErrorKind,
  { status: number; code: Parameters<typeof errorResponse>[1] }
> = {
  auth: { status: 502, code: "provider_error" },
  provider_budget: { status: 503, code: "budget_reached" },
  rate_limited: { status: 503, code: "provider_unavailable" },
  rejected: { status: 502, code: "provider_error" },
  unavailable: { status: 503, code: "provider_unavailable" },
  timeout: { status: 504, code: "provider_timeout" },
  refusal: { status: 502, code: "provider_error" },
  bad_response: { status: 502, code: "provider_error" },
};

export async function POST(request: NextRequest) {
  const started = Date.now();

  const config = getAiConfig();
  if (!config.live) {
    return errorResponse(503, "ai_not_configured");
  }
  const { limits } = config;

  if (!isSameOrigin(request)) return errorResponse(403, "forbidden");
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return errorResponse(415, "invalid_request");
  }

  const limiter = getLimiter();
  const early = limiter.checkEarly(clientIp(request), limits);
  if (early) return errorResponse(429, early.code, { retryAfterSeconds: early.retryAfterSeconds });

  const raw = await readBodyLimited(request, INPUT_LIMITS.maxBodyBytes);
  if (raw === null) return errorResponse(413, "invalid_request", { detail: "The request was too large." });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return errorResponse(400, "invalid_request");
  }
  const validation = validateChatRequest(parsed);
  if (!validation.ok) return errorResponse(400, "invalid_request", { detail: validation.message });
  const chat = validation.value;

  // From here on we may set the anonymous session cookie.
  const session = getSession(request);
  const respond = (response: NextResponse) => {
    applySession(response, session, request);
    return response;
  };

  const sessionDenial = limiter.checkSession(session.id, limits);
  if (sessionDenial) {
    return respond(
      errorResponse(429, sessionDenial.code, { retryAfterSeconds: sessionDenial.retryAfterSeconds }),
    );
  }

  const releaseSlot = limiter.acquireSlot(limits);
  if (!releaseSlot) return respond(errorResponse(503, "busy", { retryAfterSeconds: 3 }));

  try {
    const system = buildSystemPrompt(chat.lensId, chat.earlierLensIds);
    const inputBytes =
      Buffer.byteLength(system, "utf8") +
      chat.turns.reduce((sum, t) => sum + Buffer.byteLength(t.text, "utf8"), 0);
    const estimatedUsd = worstCaseCost(
      inputBytes,
      config.maxOutputTokens,
      config.price,
      limits.safetyMargin,
    );

    // Create the provider BEFORE reserving budget, so nothing can fail between
    // "reserve" and "call" and leave a reservation stuck.
    const provider = createProvider(config);
    const ledger = getLedger(config.dataDir);
    const reserved = ledger.tryReserve(estimatedUsd, {
      totalUsd: limits.totalSpendCapUsd,
      dailyUsd: limits.dailySpendCapUsd,
    });
    if (!reserved.ok) {
      logEvent("chat_blocked", { reason: reserved.reason });
      return respond(errorResponse(503, "budget_reached"));
    }
    const { reservation } = reserved;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const result = await provider.generate({
        system,
        messages: chat.turns.map((t) => ({ role: t.role, text: t.text })),
        maxOutputTokens: config.maxOutputTokens,
        safetyId: safetyIdFor(session.id),
        signal: controller.signal,
      });

      const costUsd = costFromUsage(result.usage, config.price, limits.safetyMargin);
      ledger.settle(reservation, costUsd, result.usage);
      limiter.recordSessionUse(session.id, costUsd);

      logEvent("chat_ok", {
        provider: provider.name,
        model: config.model,
        lens: chat.lensId,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        reasoningTokens: result.usage.reasoningTokens,
        estCostUsd: Number(costUsd.toFixed(6)),
        finish: result.finishReason,
        ms: Date.now() - started,
      });

      const text = result.finishReason === "length" ? `${result.text}…` : result.text;
      const response = NextResponse.json({
        reply: { text, finishReason: result.finishReason },
        quota: { messagesLeftToday: limiter.messagesLeftToday(session.id, limits) },
      });
      response.headers.set("Cache-Control", "no-store");
      return respond(response);
    } catch (error) {
      const failure =
        error instanceof ProviderError
          ? error
          : new ProviderError("bad_response", "unknown");

      // Decide how the spending gate treats this failure.
      if (failure.billing === "not_processed") {
        ledger.release(reservation);
      } else if (failure.billing === "processed" && failure.usage) {
        const costUsd = costFromUsage(failure.usage, config.price, limits.safetyMargin);
        ledger.settle(reservation, costUsd, failure.usage);
        limiter.recordSessionUse(session.id, costUsd);
      } else {
        // Unknown outcome: be cautious and count the full reserved amount as spent.
        ledger.chargeAsSpent(reservation);
        limiter.recordSessionUse(session.id, estimatedUsd);
      }

      logEvent("chat_failed", {
        provider: provider.name,
        kind: failure.kind,
        billing: failure.billing,
        status: failure.httpStatus,
        ms: Date.now() - started,
      });

      const mapped = PROVIDER_ERROR_RESPONSES[failure.kind];
      return respond(errorResponse(mapped.status, mapped.code, { retryAfterSeconds: 5 }));
    } finally {
      clearTimeout(timer);
    }
  } finally {
    releaseSlot();
  }
}
