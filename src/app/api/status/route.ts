import { connection } from "next/server";
import { NextResponse } from "next/server";
import { getAiConfig } from "@/server/config";
import { getLedger } from "@/server/spendLedger";

/**
 * GET /api/status: tells the browser whether AI replies are switched on, so the
 * screens can label things truthfully. It reveals no secrets (no key, model, or caps).
 */
export async function GET() {
  // Evaluate on every request. The setting must never be frozen at build time.
  await connection();

  const config = getAiConfig();
  const live = config.live && !getLedger(config.dataDir).snapshot().broken;

  const response = NextResponse.json({
    mode: live ? "live" : "demo",
    provider: live ? "openai" : null,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
