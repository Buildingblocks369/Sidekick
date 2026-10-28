import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "sk_sid";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export interface Session {
  id: string;
  /** True when we just created it, so the response must set the cookie. */
  isNew: boolean;
}

/**
 * Anonymous session = a random ID in an HTTP-only cookie. It contains no personal
 * information and is only used to apply fair-use limits. Clearing cookies gives a
 * fresh session. That is a known limit of anonymous use (see rateLimits.ts).
 */
export function getSession(request: NextRequest): Session {
  const existing = request.cookies.get(SESSION_COOKIE)?.value;
  if (existing && /^[a-f0-9]{32}$/.test(existing)) return { id: existing, isNew: false };
  return { id: randomBytes(16).toString("hex"), isNew: true };
}

export function applySession(response: NextResponse, session: Session, request: NextRequest): void {
  if (!session.isNew) return;
  const secure =
    request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  response.cookies.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** A stable but anonymous ID to send to the provider for abuse detection. */
export function safetyIdFor(sessionId: string): string {
  return createHash("sha256").update(`sidekick:${sessionId}`).digest("hex");
}

/**
 * Best-effort client address. Only trustworthy when a proxy you control sets the header.
 * Used only for rate limiting, and never logged.
 */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

/** Blocks other websites from using visitors' browsers to call this endpoint. */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Reads the body but gives up (returns null) if it is bigger than `maxBytes`. */
export async function readBodyLimited(request: NextRequest, maxBytes: number): Promise<string | null> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export type ApiErrorCode =
  | "ai_not_configured"
  | "invalid_request"
  | "forbidden"
  | "rate_limited"
  | "session_quota"
  | "busy"
  | "budget_reached"
  | "provider_unavailable"
  | "provider_timeout"
  | "provider_error";

/** Friendly, honest messages. They never include provider text, keys, or internal details. */
const MESSAGES: Record<ApiErrorCode, { message: string; retryable: boolean }> = {
  ai_not_configured: {
    message: "AI replies are not switched on for this copy of Sidekick.",
    retryable: false,
  },
  invalid_request: { message: "That message could not be sent.", retryable: false },
  forbidden: { message: "That request was blocked.", retryable: false },
  rate_limited: {
    message: "You’re sending messages quickly. Please wait a moment and try again.",
    retryable: true,
  },
  session_quota: {
    message: "You’ve reached today’s message limit for this test. Please come back tomorrow.",
    retryable: false,
  },
  busy: {
    message: "Sidekick is handling other requests right now. Please try again in a moment.",
    retryable: true,
  },
  budget_reached: {
    message:
      "Sidekick’s AI budget for this test has been used up for now, so AI replies are paused.",
    retryable: false,
  },
  provider_unavailable: {
    message: "The AI service is having trouble right now. Please try again in a moment.",
    retryable: true,
  },
  provider_timeout: {
    message: "The AI service took too long to answer. Please try again.",
    retryable: true,
  },
  provider_error: {
    message: "Something went wrong while writing a reply. Please try again.",
    retryable: true,
  },
};

export function errorResponse(
  status: number,
  code: ApiErrorCode,
  options: { detail?: string; retryAfterSeconds?: number } = {},
): NextResponse {
  const base = MESSAGES[code];
  const response = NextResponse.json(
    {
      error: {
        code,
        message: options.detail ? `${base.message} ${options.detail}` : base.message,
        retryable: base.retryable,
        ...(options.retryAfterSeconds ? { retryAfterSeconds: options.retryAfterSeconds } : {}),
      },
    },
    { status },
  );
  response.headers.set("Cache-Control", "no-store");
  if (options.retryAfterSeconds) {
    response.headers.set("Retry-After", String(options.retryAfterSeconds));
  }
  return response;
}
