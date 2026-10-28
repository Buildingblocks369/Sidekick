import { getAssistantMode } from "./assistantMode";
import type {
  AssistantReply,
  AssistantReplyRequest,
  AssistantService,
  ReevaluationRequest,
} from "./assistantService";

/**
 * Picks the right assistant for each request:
 *  - AI switched on at the server  -> the real (server-backed) service
 *  - otherwise                     -> the free scripted demo engine
 * This is what keeps demo mode working when no API key is configured.
 */
export class RoutedAssistantService implements AssistantService {
  constructor(
    private readonly demo: AssistantService,
    private readonly live: AssistantService,
  ) {}

  async reply(request: AssistantReplyRequest): Promise<AssistantReply> {
    const { mode } = await getAssistantMode();
    return (mode === "live" ? this.live : this.demo).reply(request);
  }

  reevaluate(request: ReevaluationRequest): Promise<AssistantReply> {
    // Always the labeled preset example for now (real re-evaluation comes later).
    return this.demo.reevaluate(request);
  }
}
