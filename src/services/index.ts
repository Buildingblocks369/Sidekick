/**
 * The one place where the app decides which service implementations to use.
 * The screens only know the `AssistantService` shape. Whether a reply comes from the
 * scripted demo or a real AI is decided here (and by the server's settings).
 */
import { demoAssistantService } from "./demoAssistantService";
import { knowledgeService } from "./knowledgeService";
import { RemoteAssistantService } from "./remoteAssistantService";
import { RoutedAssistantService } from "./routedAssistantService";
import { usagePolicy } from "./usagePolicy";
import type { AssistantService } from "./assistantService";

export const assistantService: AssistantService = new RoutedAssistantService(
  demoAssistantService,
  new RemoteAssistantService(demoAssistantService),
);
export { knowledgeService, usagePolicy };
export { DEMO_ERROR_TRIGGER } from "./demoAssistantService";
export { AssistantServiceError } from "./assistantService";
export { getAssistantMode, type AssistantMode } from "./assistantMode";
export type { ClosestLensResult } from "./knowledgeService";
