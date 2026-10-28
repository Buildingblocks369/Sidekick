import "server-only";
import type { LimitsConfig } from "./config";
import { utcDay } from "./spendLedger";

/**
 * Limits for ANONYMOUS visitors (no accounts yet).
 *
 * Honest limitations (the PRD asks us to be upfront about these):
 *  - A "session" is just a random cookie. Someone can delete it to get a fresh
 *    allowance. So per-session limits are a courtesy, not security.
 *  - The IP address is "best effort": behind a proxy it can be spoofed unless the
 *    proxy is trusted and configured.
 *  - The real protection is the GLOBAL caps: requests per minute, simultaneous calls,
 *    and the daily and total spending caps. Those apply to everyone together.
 *
 * All counters live in memory and reset when the server restarts. The spending
 * totals are the exception: they are saved to disk (see spendLedger.ts).
 */

export type Denial =
  | { code: "rate_limited"; retryAfterSeconds: number }
  | { code: "session_quota"; retryAfterSeconds: number }
  | { code: "busy"; retryAfterSeconds: number };

const MINUTE_MS = 60_000;
const MAX_TRACKED_SESSIONS = 5000;
const MAX_TRACKED_IPS = 5000;

interface SessionState {
  day: string;
  messages: number;
  usd: number;
  recent: number[];
}

class SlidingWindow {
  private hits: number[] = [];
  /** Records a hit. Returns seconds to wait if the limit is already reached, else 0. */
  hit(limit: number, now: number): number {
    const cutoff = now - MINUTE_MS;
    while (this.hits.length > 0 && this.hits[0] <= cutoff) this.hits.shift();
    if (this.hits.length >= limit) {
      return Math.max(1, Math.ceil((this.hits[0] + MINUTE_MS - now) / 1000));
    }
    this.hits.push(now);
    return 0;
  }
  get size(): number {
    return this.hits.length;
  }
}

class UsageLimiter {
  private global = new SlidingWindow();
  private ips = new Map<string, SlidingWindow>();
  private sessions = new Map<string, SessionState>();
  private inFlight = 0;

  /** Cheap checks done BEFORE we read the request body. */
  checkEarly(ip: string, limits: LimitsConfig, now = Date.now()): Denial | null {
    const globalWait = this.global.hit(limits.globalPerMinute, now);
    if (globalWait > 0) return { code: "rate_limited", retryAfterSeconds: globalWait };

    let window = this.ips.get(ip);
    if (!window) {
      if (this.ips.size >= MAX_TRACKED_IPS) this.evictOldest(this.ips);
      window = new SlidingWindow();
      this.ips.set(ip, window);
    }
    const ipWait = window.hit(limits.ipPerMinute, now);
    if (ipWait > 0) return { code: "rate_limited", retryAfterSeconds: ipWait };
    return null;
  }

  private session(id: string, now: number): SessionState {
    const today = utcDay(new Date(now));
    let state = this.sessions.get(id);
    if (!state) {
      if (this.sessions.size >= MAX_TRACKED_SESSIONS) this.evictOldest(this.sessions);
      state = { day: today, messages: 0, usd: 0, recent: [] };
      this.sessions.set(id, state);
    }
    if (state.day !== today) {
      state.day = today;
      state.messages = 0;
      state.usd = 0;
    }
    return state;
  }

  private evictOldest<T>(map: Map<string, T>): void {
    const oldest = map.keys().next();
    if (!oldest.done) map.delete(oldest.value);
  }

  /** Per-session checks (after the body is validated). */
  checkSession(id: string, limits: LimitsConfig, now = Date.now()): Denial | null {
    const state = this.session(id, now);

    const cutoff = now - MINUTE_MS;
    state.recent = state.recent.filter((t) => t > cutoff);
    if (state.recent.length >= limits.sessionPerMinute) {
      const wait = Math.max(1, Math.ceil((state.recent[0] + MINUTE_MS - now) / 1000));
      return { code: "rate_limited", retryAfterSeconds: wait };
    }
    state.recent.push(now);

    const secondsToMidnightUtc = () => {
      const next = new Date(now);
      next.setUTCHours(24, 0, 0, 0);
      return Math.max(1, Math.ceil((next.getTime() - now) / 1000));
    };
    if (state.messages >= limits.sessionDailyMessages || state.usd >= limits.sessionDailySpendCapUsd) {
      return { code: "session_quota", retryAfterSeconds: secondsToMidnightUtc() };
    }
    return null;
  }

  messagesLeftToday(id: string, limits: LimitsConfig, now = Date.now()): number {
    return Math.max(0, limits.sessionDailyMessages - this.session(id, now).messages);
  }

  /** Count a message against the session only when it actually went to the AI. */
  recordSessionUse(id: string, usd: number, now = Date.now()): void {
    const state = this.session(id, now);
    state.messages += 1;
    state.usd += usd;
  }

  /** Take one of the limited "simultaneous call" slots, or null if none are free. */
  acquireSlot(limits: LimitsConfig): (() => void) | null {
    if (this.inFlight >= limits.maxConcurrent) return null;
    this.inFlight += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.inFlight -= 1;
    };
  }
}

const globalForLimiter = globalThis as unknown as { __sidekickLimiter?: UsageLimiter };

/** One shared limiter per server process (survives dev hot-reloads). */
export function getLimiter(): UsageLimiter {
  return (globalForLimiter.__sidekickLimiter ??= new UsageLimiter());
}
