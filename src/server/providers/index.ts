import "server-only";
import type { AiConfig } from "../config";
import { OpenAiProvider } from "./openai";
import type { ChatProvider } from "./types";

/**
 * Chooses the provider from the (already validated) config.
 * To add a provider later, add a case here. `AiConfig` would grow a matching variant.
 */
export function createProvider(config: Extract<AiConfig, { live: true }>): ChatProvider {
  switch (config.provider) {
    case "openai":
      return new OpenAiProvider({
        apiKey: config.openaiApiKey,
        baseUrl: config.openaiBaseUrl,
        model: config.model,
        reasoningEffort: config.reasoningEffort,
      });
  }
}
