import "server-only";

type LogValue = string | number | boolean | null | undefined;

/**
 * The only way server code writes logs.
 *
 * Privacy/safety rules enforced here:
 *  - Only short, simple values are allowed. Long strings (like a user's message
 *    or an AI reply) are cut to 40 characters so they can't leak into logs by accident.
 *  - Never pass keys, message text, or provider response bodies. Callers pass
 *    only counts, codes, model names, and timings.
 */
export function logEvent(event: string, fields: Record<string, LogValue> = {}): void {
  const safe: Record<string, LogValue> = {};
  for (const [key, value] of Object.entries(fields)) {
    safe[key] = typeof value === "string" ? value.slice(0, 40) : value;
  }
  console.info(JSON.stringify({ ts: new Date().toISOString(), event, ...safe }));
}
