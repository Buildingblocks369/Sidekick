import "server-only";

/**
 * Server-side settings for live AI chat. Everything here is read from environment
 * variables on the SERVER. Nothing in this file is ever sent to the browser.
 *
 * Safety design:
 *  - Live AI needs TWO things: SIDEKICK_AI_ENABLED=true AND a provider key.
 *    Having a key alone never causes a paid call.
 *  - If anything is missing or unclear (unknown model price, bad setting), we
 *    stay in demo mode. We "fail closed".
 *  - Hard ceilings are written in code, so a typo in an env var can't
 *    raise a cap above them.
 */

export type ReasoningEffort = "none" | "minimal" | "low" | "medium" | "high";

export interface ModelPrice {
  /** US dollars per 1,000,000 tokens. */
  inputPerM: number;
  cachedInputPerM: number;
  outputPerM: number;
}

/**
 * Prices verified on 2026-10-27 from https://developers.openai.com/api/docs/pricing
 * (Standard processing, short context). Prices change. Re-check before relying on them.
 * Models not in this table need explicit AI_PRICE_* env values, or live mode stays off.
 */
const KNOWN_PRICES: Record<string, ModelPrice> = {
  "gpt-6-luna": { inputPerM: 0.1, cachedInputPerM: 0.01, outputPerM: 0.5 },
  "gpt-6.1-terra": { inputPerM: 1.0, cachedInputPerM: 0.05, outputPerM: 5.0 },
  "gpt-6.1-sol": { inputPerM: 2.0, cachedInputPerM: 0.1, outputPerM: 10.0 },
};

/** Cache writes are billed at 1.25x the normal input price (per OpenAI's pricing page). */
export const CACHE_WRITE_MULTIPLIER = 1.25;

/** Hard ceilings. Env vars can lower these but never raise them. */
export const HARD_CEILINGS = {
  /** Matches the agreed "no more than $5" development budget. */
  totalSpendUsd: 5,
  dailySpendUsd: 5,
  maxOutputTokens: 1000,
  timeoutMs: 60_000,
} as const;

export interface LimitsConfig {
  /** Estimated lifetime spend cap across all users (this machine). */
  totalSpendCapUsd: number;
  /** Estimated spend cap per UTC day, across all users. */
  dailySpendCapUsd: number;
  /** Estimated spend cap per anonymous session per UTC day. */
  sessionDailySpendCapUsd: number;
  /** Max AI messages per anonymous session per UTC day. */
  sessionDailyMessages: number;
  /** Max requests per session per minute. */
  sessionPerMinute: number;
  /** Max requests per IP address per minute (best effort; see README). */
  ipPerMinute: number;
  /** Max requests per minute across everyone. */
  globalPerMinute: number;
  /** Max simultaneous AI calls. */
  maxConcurrent: number;
  /** Multiplier applied to provider-reported cost to stay on the cautious side. */
  safetyMargin: number;
}

export type AiConfig =
  | { live: false; reason: "disabled" | "no_key" | "unsupported_provider" | "unknown_pricing" }
  | {
      live: true;
      provider: "openai";
      model: string;
      reasoningEffort: ReasoningEffort;
      maxOutputTokens: number;
      timeoutMs: number;
      price: ModelPrice;
      openaiApiKey: string;
      openaiBaseUrl: string;
      limits: LimitsConfig;
      dataDir: string;
    };

function readNumber(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

const EFFORTS: ReasoningEffort[] = ["none", "minimal", "low", "medium", "high"];

export function getAiConfig(): AiConfig {
  if (process.env.SIDEKICK_AI_ENABLED !== "true") return { live: false, reason: "disabled" };

  const provider = (process.env.AI_PROVIDER ?? "openai").trim().toLowerCase();
  if (provider !== "openai") return { live: false, reason: "unsupported_provider" };

  const openaiApiKey = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!openaiApiKey) return { live: false, reason: "no_key" };

  const model = (process.env.AI_MODEL ?? "gpt-6-luna").trim();

  const known = KNOWN_PRICES[model];
  const envPrice =
    process.env.AI_PRICE_INPUT_PER_M && process.env.AI_PRICE_OUTPUT_PER_M
      ? {
          inputPerM: Number(process.env.AI_PRICE_INPUT_PER_M),
          cachedInputPerM: Number(
            process.env.AI_PRICE_CACHED_INPUT_PER_M ?? process.env.AI_PRICE_INPUT_PER_M,
          ),
          outputPerM: Number(process.env.AI_PRICE_OUTPUT_PER_M),
        }
      : undefined;
  const price = envPrice ?? known;
  const priceIsValid =
    price !== undefined &&
    [price.inputPerM, price.cachedInputPerM, price.outputPerM].every(
      (n) => Number.isFinite(n) && n >= 0,
    );
  // No known price means no cost estimate, so no spending gate. Refuse to go live.
  if (!price || !priceIsValid) return { live: false, reason: "unknown_pricing" };

  const requestedEffort = (process.env.AI_REASONING_EFFORT ?? "none").trim().toLowerCase();
  const reasoningEffort = (EFFORTS as string[]).includes(requestedEffort)
    ? (requestedEffort as ReasoningEffort)
    : "none";

  const totalSpendCapUsd = readNumber("SPEND_CAP_TOTAL_USD", 2, 0, HARD_CEILINGS.totalSpendUsd);
  const dailySpendCapUsd = Math.min(
    readNumber("SPEND_CAP_DAILY_USD", 0.5, 0, HARD_CEILINGS.dailySpendUsd),
    totalSpendCapUsd,
  );

  return {
    live: true,
    provider: "openai",
    model,
    reasoningEffort,
    maxOutputTokens: readNumber("AI_MAX_OUTPUT_TOKENS", 500, 64, HARD_CEILINGS.maxOutputTokens),
    timeoutMs: readNumber("AI_TIMEOUT_MS", 25_000, 500, HARD_CEILINGS.timeoutMs),
    price,
    openaiApiKey,
    openaiBaseUrl: (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1")
      .trim()
      .replace(/\/+$/, ""),
    limits: {
      totalSpendCapUsd,
      dailySpendCapUsd,
      sessionDailySpendCapUsd: Math.min(
        readNumber("SPEND_CAP_SESSION_DAILY_USD", 0.05, 0, HARD_CEILINGS.dailySpendUsd),
        dailySpendCapUsd,
      ),
      sessionDailyMessages: readNumber("LIMIT_SESSION_DAILY_MESSAGES", 30, 1, 1000),
      sessionPerMinute: readNumber("LIMIT_SESSION_PER_MINUTE", 8, 1, 120),
      ipPerMinute: readNumber("LIMIT_IP_PER_MINUTE", 20, 1, 600),
      globalPerMinute: readNumber("LIMIT_GLOBAL_PER_MINUTE", 60, 1, 6000),
      maxConcurrent: readNumber("LIMIT_MAX_CONCURRENT", 3, 1, 50),
      safetyMargin: readNumber("SPEND_SAFETY_MARGIN", 1.2, 1, 5),
    },
    dataDir: (process.env.SIDEKICK_DATA_DIR ?? ".sidekick-data").trim() || ".sidekick-data",
  };
}

/** Input limits for what we accept and forward. Smaller inputs mean smaller bills. */
export const INPUT_LIMITS = {
  /** Largest request body we will even read. */
  maxBodyBytes: 64 * 1024,
  /** Most messages the browser may send (we forward fewer). */
  maxClientMessages: 60,
  /** Longest assistant message we accept back as context. */
  maxAssistantMessageChars: 4000,
  /** Most recent messages forwarded to the model. */
  maxContextMessages: 10,
  /** Total characters of conversation forwarded to the model. */
  maxContextChars: 10_000,
} as const;
