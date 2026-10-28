"use client";

import { useEffect, useState } from "react";
import { getAssistantMode, type AssistantMode } from "@/services";

/**
 * Returns whether AI replies are live or demo. `null` while we are still asking,
 * so the screens never show a wrong label for a moment.
 */
export function useAssistantMode(): AssistantMode | null {
  const [mode, setMode] = useState<AssistantMode | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getAssistantMode().then((result) => {
      if (!cancelled) setMode(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return mode;
}
