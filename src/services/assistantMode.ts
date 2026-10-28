/**
 * Asks our own server whether AI replies are switched on.
 * "live" = real AI replies. "demo" = scripted demo replies (the default).
 * The answer is remembered for the life of the page.
 */
export interface AssistantMode {
  mode: "live" | "demo";
  provider: string | null;
}

const DEMO: AssistantMode = { mode: "demo", provider: null };

let cached: Promise<AssistantMode> | null = null;

export function getAssistantMode(): Promise<AssistantMode> {
  if (!cached) {
    cached = fetch("/api/status", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("status unavailable");
        const data = (await response.json()) as Partial<AssistantMode>;
        return data.mode === "live"
          ? ({ mode: "live", provider: typeof data.provider === "string" ? data.provider : null } as AssistantMode)
          : DEMO;
      })
      .catch(() => {
        // If we can't tell, stay in demo mode (the safe, free choice) and ask again next time.
        cached = null;
        return DEMO;
      });
  }
  return cached;
}
