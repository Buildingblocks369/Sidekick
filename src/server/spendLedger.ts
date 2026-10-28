import "server-only";
import fs from "node:fs";
import path from "node:path";
import { CACHE_WRITE_MULTIPLIER, type ModelPrice } from "./config";
import { logEvent } from "./log";

/**
 * SPENDING GATE + LEDGER
 *
 * Plain-English version:
 *  1. BEFORE each AI call we "reserve" the worst-case cost. If the reserve would
 *     push us over a cap, the call never happens.
 *  2. AFTER the call we replace the reservation with the real cost, computed from
 *     the token counts the provider reported.
 *  3. Totals are saved to a small file so restarting the server does NOT reset the cap.
 *
 * Why it is safe for simultaneous requests: `tryReserve` checks the totals and adds
 * the reservation in one step with no waiting in between. Node runs this kind of code
 * one request at a time, so two requests can never both "see" the same free budget.
 *
 * IMPORTANT LIMITS (also in the README):
 *  - This is an ESTIMATE made by this app. It cannot guarantee the provider's final bill.
 *    The provider's own spend limit is the real safety net, so set one there too.
 *  - It protects ONE server process with a local file. If you run several copies, or
 *    host somewhere without a durable disk, each copy counts separately. Public
 *    hosting needs a shared store first (a later phase).
 */

export interface TokenUsage {
  inputTokens: number;
  cachedInputTokens: number;
  cacheWriteTokens: number;
  outputTokens: number;
  reasoningTokens: number;
}

interface DayStats {
  usd: number;
  requests: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
}

interface LedgerFile {
  version: 1;
  totalUsd: number;
  totalRequests: number;
  byDay: Record<string, DayStats>;
}

export interface Reservation {
  id: number;
  estimatedUsd: number;
}

export type ReserveResult =
  | { ok: true; reservation: Reservation }
  | { ok: false; reason: "total_cap" | "daily_cap" | "ledger_unavailable" };

const emptyDay = (): DayStats => ({
  usd: 0,
  requests: 0,
  inputTokens: 0,
  cachedInputTokens: 0,
  outputTokens: 0,
  reasoningTokens: 0,
});

export function utcDay(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Cost in US dollars from provider-reported token counts. */
export function costFromUsage(usage: TokenUsage, price: ModelPrice, safetyMargin = 1): number {
  const cached = Math.max(0, usage.cachedInputTokens);
  const written = Math.max(0, usage.cacheWriteTokens);
  const plain = Math.max(0, usage.inputTokens - cached - written);
  const dollars =
    (plain * price.inputPerM +
      cached * price.cachedInputPerM +
      written * price.inputPerM * CACHE_WRITE_MULTIPLIER +
      // Output tokens include the model's hidden "reasoning" tokens, which are billed as output.
      Math.max(0, usage.outputTokens) * price.outputPerM) /
    1_000_000;
  return dollars * safetyMargin;
}

/**
 * Worst-case cost before sending. Every token is at least 1 byte of UTF-8 text, so the
 * byte count is a true upper bound on input tokens (real English text uses ~4x fewer).
 */
export function worstCaseCost(
  inputBytes: number,
  maxOutputTokens: number,
  price: ModelPrice,
  safetyMargin = 1,
): number {
  const inputTokensUpperBound = inputBytes + 100;
  return (
    ((inputTokensUpperBound * Math.max(price.inputPerM, price.cachedInputPerM) +
      maxOutputTokens * price.outputPerM) /
      1_000_000) *
    safetyMargin
  );
}

export class SpendLedger {
  private data: LedgerFile = { version: 1, totalUsd: 0, totalRequests: 0, byDay: {} };
  private reservedUsd = 0;
  private nextId = 1;
  private active = new Set<number>();
  /** True if the ledger file could not be read/written. We then refuse all paid calls. */
  private broken = false;

  constructor(private readonly file: string) {
    this.load();
  }

  private load(): void {
    try {
      if (!fs.existsSync(this.file)) return; // first run: start empty
      const parsed = JSON.parse(fs.readFileSync(this.file, "utf8")) as LedgerFile;
      const valid =
        parsed &&
        parsed.version === 1 &&
        Number.isFinite(parsed.totalUsd) &&
        parsed.totalUsd >= 0 &&
        typeof parsed.byDay === "object" &&
        parsed.byDay !== null;
      if (!valid) throw new Error("ledger shape is wrong");
      this.data = parsed;
    } catch {
      // Do NOT silently start from zero: that would reset the spending cap.
      this.broken = true;
      logEvent("ledger_unreadable", { file: path.basename(this.file) });
    }
  }

  private persist(): void {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      // Keep ~40 days of per-day detail; the lifetime total is kept separately.
      const days = Object.keys(this.data.byDay).sort();
      for (const old of days.slice(0, Math.max(0, days.length - 40))) delete this.data.byDay[old];
      const tmp = `${this.file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.data));
      fs.renameSync(tmp, this.file); // atomic swap, so a crash can't leave half a file
    } catch {
      this.broken = true;
      logEvent("ledger_write_failed", { file: path.basename(this.file) });
    }
  }

  /** Check caps and reserve the estimated cost in one synchronous step. */
  tryReserve(
    estimatedUsd: number,
    caps: { totalUsd: number; dailyUsd: number },
    now = new Date(),
  ): ReserveResult {
    if (this.broken) return { ok: false, reason: "ledger_unavailable" };
    const today = this.data.byDay[utcDay(now)] ?? emptyDay();
    if (this.data.totalUsd + this.reservedUsd + estimatedUsd > caps.totalUsd) {
      return { ok: false, reason: "total_cap" };
    }
    if (today.usd + this.reservedUsd + estimatedUsd > caps.dailyUsd) {
      return { ok: false, reason: "daily_cap" };
    }
    const reservation = { id: this.nextId++, estimatedUsd };
    this.active.add(reservation.id);
    this.reservedUsd += estimatedUsd;
    return { ok: true, reservation };
  }

  /** Replace a reservation with the real (estimated-from-usage) cost and save it. */
  settle(reservation: Reservation, actualUsd: number, usage: TokenUsage, now = new Date()): void {
    if (!this.active.delete(reservation.id)) return; // already settled/released
    this.reservedUsd = Math.max(0, this.reservedUsd - reservation.estimatedUsd);
    this.record(actualUsd, usage, now);
  }

  /** The request definitely was not processed (e.g. rejected before running). Costs nothing. */
  release(reservation: Reservation): void {
    if (!this.active.delete(reservation.id)) return;
    this.reservedUsd = Math.max(0, this.reservedUsd - reservation.estimatedUsd);
  }

  /**
   * We can't tell whether the provider processed the request (timeout, dropped
   * connection). Be cautious: count the full reserved amount as spent.
   */
  chargeAsSpent(reservation: Reservation, now = new Date()): void {
    this.settle(
      reservation,
      reservation.estimatedUsd,
      { inputTokens: 0, cachedInputTokens: 0, cacheWriteTokens: 0, outputTokens: 0, reasoningTokens: 0 },
      now,
    );
  }

  private record(usd: number, usage: TokenUsage, now: Date): void {
    const key = utcDay(now);
    const day = (this.data.byDay[key] ??= emptyDay());
    day.usd += usd;
    day.requests += 1;
    day.inputTokens += usage.inputTokens;
    day.cachedInputTokens += usage.cachedInputTokens;
    day.outputTokens += usage.outputTokens;
    day.reasoningTokens += usage.reasoningTokens;
    this.data.totalUsd += usd;
    this.data.totalRequests += 1;
    this.persist();
  }

  snapshot(now = new Date()) {
    const today = this.data.byDay[utcDay(now)] ?? emptyDay();
    return {
      totalUsd: this.data.totalUsd,
      todayUsd: today.usd,
      reservedUsd: this.reservedUsd,
      inFlight: this.active.size,
      broken: this.broken,
    };
  }
}

const globalForLedger = globalThis as unknown as { __sidekickLedgers?: Map<string, SpendLedger> };

/**
 * One ledger per file path, kept on `globalThis` so development hot-reloads
 * don't create a second ledger that forgets in-flight reservations.
 */
export function getLedger(dataDir: string): SpendLedger {
  const file = path.resolve(dataDir, "spend-ledger.json");
  const registry = (globalForLedger.__sidekickLedgers ??= new Map());
  let ledger = registry.get(file);
  if (!ledger) {
    ledger = new SpendLedger(file);
    registry.set(file, ledger);
  }
  return ledger;
}
