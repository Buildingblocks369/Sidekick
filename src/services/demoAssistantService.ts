import { GENERAL_GUIDE_ID } from "@/domain/lenses";
import { knowledgeService } from "./knowledgeService";
import type {
  AssistantReply,
  AssistantReplyRequest,
  AssistantService,
  ReevaluationRequest,
} from "./assistantService";
import { LENS_SCRIPTS, VALIDATION_LINES, type DemoTopic } from "./demoReplies";

/** A short pause so the "thinking" state is visible. No network is involved. */
const FAKE_THINKING_MS = 600;

/**
 * Typing this exact text sends a demo error so you can see the error screen.
 * Remove it when a real AI service exists.
 */
export const DEMO_ERROR_TRIGGER = "/demo-error";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Very simple keyword matching. Deterministic: same words in, same reply out. */
export function detectTopic(text: string): DemoTopic {
  const lower = text.toLowerCase();
  if (/(delay|delayed|late|behind|slip|slipping|deadline|overdue|missed)/.test(lower)) {
    return "delay";
  }
  if (/(decide|decision|choose|choice|career|job|offer|option|should i)/.test(lower)) {
    return "decision";
  }
  return "general";
}

/**
 * A scripted stand-in for a real AI.
 * It makes no network calls, uses no API keys, and costs nothing.
 */
class DemoAssistantService implements AssistantService {
  async reply({ messages, scope }: AssistantReplyRequest): Promise<AssistantReply> {
    await wait(FAKE_THINKING_MS);

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user" && m.kind === "text");
    if (!lastUserMessage) throw new Error("There is no message to reply to.");
    if (lastUserMessage.text.trim() === DEMO_ERROR_TRIGGER) {
      throw new Error("This is a demo error, triggered on purpose.");
    }

    // Topic comes from the most recent message that has a recognizable topic,
    // so short follow-ups ("ok, what next?") keep the earlier topic. That also
    // makes the lens switch obvious: same topic, different lens.
    const userTexts = messages
      .filter((m) => m.role === "user" && m.kind === "text")
      .map((m) => m.text);
    let topic: DemoTopic = "general";
    for (const text of [...userTexts].reverse()) {
      const detected = detectTopic(text);
      if (detected !== "general") {
        topic = detected;
        break;
      }
    }

    const script = LENS_SCRIPTS[scope.lensId] ?? LENS_SCRIPTS[GENERAL_GUIDE_ID];
    const parts = [VALIDATION_LINES[topic], script[topic]];
    if (script.caution) parts.push(script.caution);

    return { text: parts.join("\n\n"), isDemo: true };
  }

  async reevaluate({ messages, targetLensId }: ReevaluationRequest): Promise<AssistantReply> {
    await wait(FAKE_THINKING_MS);

    const lens = knowledgeService.getLens(targetLensId);
    const earlierCount = messages.filter((m) => m.role === "user" && m.kind === "text").length;

    const text = [
      `Preset example: what a re-evaluation through the ${lens.name} lens could look like.`,
      `In a real version, Sidekick would re-read your ${earlierCount} earlier message${
        earlierCount === 1 ? "" : "s"
      } and re-explain them with more attention on ${lens.focus}.`,
      "What actually happened here: nothing was re-read and no AI ran. This is a fixed example that only shows where the feature will go.",
    ].join("\n\n");

    return { text, isDemo: true };
  }
}

export const demoAssistantService: AssistantService = new DemoAssistantService();
