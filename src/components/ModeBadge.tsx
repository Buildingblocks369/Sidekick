import type { AssistantMode } from "@/services";
import { Badge } from "./Badge";

interface ModeBadgeProps {
  mode: AssistantMode | null;
  /** Shorter wording for the chat header. */
  compact?: boolean;
}

/** Tells the truth about whether replies come from the demo script or a real AI. */
export function ModeBadge({ mode, compact = false }: ModeBadgeProps) {
  if (!mode) return null; // Still asking the server. Show nothing rather than something wrong.
  if (mode.mode === "live") return <Badge tone="live">Live AI · early test</Badge>;
  return (
    <Badge tone="demo">
      {compact ? "Demo mode: no real AI" : "Demo mode: scripted replies, no real AI"}
    </Badge>
  );
}
