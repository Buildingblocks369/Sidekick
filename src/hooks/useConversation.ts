"use client";

import { useCallback, useRef, useState } from "react";
import { GENERAL_GUIDE_ID } from "@/domain/lenses";
import type { ConversationMessage, ConversationScope } from "@/domain/types";
import {
  AssistantServiceError,
  assistantService,
  knowledgeService,
  usagePolicy,
} from "@/services";

export type ConversationStatus = "idle" | "thinking";

let idCounter = 0;
/** Simple unique IDs. Good enough for a local demo with no saved data. */
function newId(): string {
  idCounter += 1;
  return `msg-${Date.now()}-${idCounter}`;
}

function makeMessage(
  partial: Omit<ConversationMessage, "id" | "createdAt">,
): ConversationMessage {
  return { ...partial, id: newId(), createdAt: new Date().toISOString() };
}

export interface ConversationError {
  message: string;
  /** Retrying only makes sense when a normal reply failed. */
  canRetry: boolean;
}

export interface SendResult {
  ok: boolean;
  /** Plain-English reason when `ok` is false. */
  reason?: string;
}

/**
 * Holds the whole conversation in the browser's memory (nothing is saved).
 * Refreshing the page starts a fresh conversation. That is intentional in Phase 1.
 */
export function useConversation() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [lensId, setLensId] = useState<string>(GENERAL_GUIDE_ID);
  const [status, setStatus] = useState<ConversationStatus>("idle");
  const [error, setError] = useState<ConversationError | null>(null);

  // Refs hold the latest values so async code never reads stale state.
  const messagesRef = useRef<ConversationMessage[]>([]);
  const lensIdRef = useRef<string>(GENERAL_GUIDE_ID);
  const statusRef = useRef<ConversationStatus>("idle");
  // Bumped on reset so an old, slow reply can't land in a new conversation.
  const runIdRef = useRef(0);

  const commitMessages = useCallback((next: ConversationMessage[]) => {
    messagesRef.current = next;
    setMessages(next);
  }, []);

  const commitStatus = useCallback((next: ConversationStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const buildScope = (): ConversationScope => ({
    lensId: lensIdRef.current,
    personalFolderIds: [],
    webEnabled: false,
  });

  const requestReply = useCallback(async () => {
    const runId = runIdRef.current;
    commitStatus("thinking");
    setError(null);
    try {
      const reply = await assistantService.reply({
        messages: messagesRef.current,
        scope: buildScope(),
      });
      if (runId !== runIdRef.current) return;
      commitMessages([
        ...messagesRef.current,
        makeMessage({
          role: "assistant",
          kind: "text",
          text: reply.text,
          lensId: lensIdRef.current,
          isDemo: reply.isDemo,
        }),
      ]);
    } catch (e) {
      if (runId !== runIdRef.current) return;
      setError({
        message: e instanceof Error ? e.message : "Something went wrong.",
        // The server says whether trying again could help (for example, not after a daily limit).
        canRetry: e instanceof AssistantServiceError ? e.retryable : true,
      });
    } finally {
      if (runId === runIdRef.current) commitStatus("idle");
    }
  }, [commitMessages, commitStatus]);

  const send = useCallback(
    (text: string): SendResult => {
      if (statusRef.current === "thinking") {
        return { ok: false, reason: "Please wait for Sidekick to finish replying." };
      }
      const decision = usagePolicy.checkMessage(text);
      if (!decision.allowed) return { ok: false, reason: decision.reason };

      commitMessages([
        ...messagesRef.current,
        makeMessage({
          role: "user",
          kind: "text",
          text: text.trim(),
          lensId: lensIdRef.current,
        }),
      ]);
      void requestReply();
      return { ok: true };
    },
    [commitMessages, requestReply],
  );

  const retry = useCallback(() => {
    if (statusRef.current === "thinking") return;
    void requestReply();
  }, [requestReply]);

  /**
   * Changes the lens. If a conversation is already going, the earlier messages
   * stay and a marker line is added so the change is visible in the transcript.
   */
  const switchLens = useCallback(
    (nextLensId: string) => {
      const previousLensId = lensIdRef.current;
      if (nextLensId === previousLensId) return;

      lensIdRef.current = nextLensId;
      setLensId(nextLensId);

      if (messagesRef.current.length > 0) {
        const nextLens = knowledgeService.getLens(nextLensId);
        commitMessages([
          ...messagesRef.current,
          makeMessage({
            role: "system",
            kind: "lens-change",
            text: `Lens changed to ${nextLens.name}`,
            lensId: nextLensId,
            fromLensId: previousLensId,
          }),
        ]);
      }
    },
    [commitMessages],
  );

  /** Demo only: shows a preset example. It does not re-read anything with AI. */
  const reevaluate = useCallback(
    async (markerId: string) => {
      if (statusRef.current === "thinking") return;
      const marker = messagesRef.current.find((m) => m.id === markerId);
      if (!marker) return;

      const runId = runIdRef.current;
      commitStatus("thinking");
      setError(null);
      try {
        const reply = await assistantService.reevaluate({
          messages: messagesRef.current,
          targetLensId: marker.lensId,
        });
        if (runId !== runIdRef.current) return;
        commitMessages([
          ...messagesRef.current,
          makeMessage({
            role: "assistant",
            kind: "reevaluation-demo",
            text: reply.text,
            lensId: marker.lensId,
            relatedMessageId: markerId,
            isDemo: reply.isDemo,
          }),
        ]);
      } catch (e) {
        if (runId !== runIdRef.current) return;
        setError({
          message: e instanceof Error ? e.message : "Something went wrong.",
          canRetry: false,
        });
      } finally {
        if (runId === runIdRef.current) commitStatus("idle");
      }
    },
    [commitMessages, commitStatus],
  );

  const dismissError = useCallback(() => setError(null), []);

  /** Start over: clears the chat and returns to General Guide. */
  const reset = useCallback(() => {
    runIdRef.current += 1;
    commitMessages([]);
    commitStatus("idle");
    setError(null);
    lensIdRef.current = GENERAL_GUIDE_ID;
    setLensId(GENERAL_GUIDE_ID);
  }, [commitMessages, commitStatus]);

  return { messages, lensId, status, error, send, retry, switchLens, reevaluate, dismissError, reset };
}
