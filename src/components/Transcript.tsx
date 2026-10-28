"use client";

import { useEffect } from "react";
import type { ConversationMessage } from "@/domain/types";
import type { ConversationError, ConversationStatus } from "@/hooks/useConversation";
import { knowledgeService } from "@/services";
import type { AssistantMode } from "@/services";
import { Badge } from "./Badge";

interface TranscriptProps {
  mode: AssistantMode | null;
  messages: ConversationMessage[];
  status: ConversationStatus;
  error: ConversationError | null;
  onReevaluate: (markerId: string) => void;
  onRetry: () => void;
  onDismissError: () => void;
}

export function Transcript({
  mode,
  messages,
  status,
  error,
  onReevaluate,
  onRetry,
  onDismissError,
}: TranscriptProps) {
  // Keep the newest message in view. We scroll the whole page to its very bottom,
  // which leaves the newest message sitting just above the sticky input bar.
  useEffect(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight });
  }, [messages.length, status, error]);

  return (
    <div
      role="log"
      aria-label="Conversation"
      aria-live="polite"
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6"
    >
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          alreadyReevaluated={messages.some(
            (m) => m.kind === "reevaluation-demo" && m.relatedMessageId === message.id,
          )}
          busy={status === "thinking"}
          onReevaluate={onReevaluate}
        />
      ))}

      {status === "thinking" && (
        <p role="status" className="text-sm italic text-muted">
          {mode?.mode === "live"
            ? "Sidekick is thinking…"
            : "Sidekick is thinking… (demo engine, no real AI)"}
        </p>
      )}

      {error && (
        <div role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger-ink">
          <p className="font-semibold">Sorry, that didn’t work.</p>
          <p className="mt-1">{error.message}</p>
          <div className="mt-2 flex gap-2">
            {error.canRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-lg bg-danger-ink px-3 py-1.5 text-sm font-semibold text-white"
              >
                Try again
              </button>
            )}
            <button
              type="button"
              onClick={onDismissError}
              className="rounded-lg border border-danger-ink px-3 py-1.5 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface MessageItemProps {
  message: ConversationMessage;
  alreadyReevaluated: boolean;
  busy: boolean;
  onReevaluate: (markerId: string) => void;
}

function MessageItem({ message, alreadyReevaluated, busy, onReevaluate }: MessageItemProps) {
  if (message.kind === "lens-change") {
    const from = message.fromLensId ? knowledgeService.getLens(message.fromLensId).name : "";
    const to = knowledgeService.getLens(message.lensId).name;
    return (
      <div className="rounded-xl border border-dashed border-accent bg-accent-soft px-4 py-3 text-center text-sm">
        <p className="font-semibold">
          Lens changed{from ? `: ${from} → ${to}` : ` to ${to}`}
        </p>
        <p className="mt-0.5 text-muted">
          Your earlier messages are still here. New replies use the {to} lens.
        </p>
        <button
          type="button"
          disabled={alreadyReevaluated || busy}
          onClick={() => onReevaluate(message.id)}
          className="mt-2 rounded-full border border-accent bg-paper px-4 py-1.5 text-sm font-semibold text-accent-dark hover:bg-cream disabled:cursor-not-allowed disabled:border-line disabled:text-muted"
        >
          {alreadyReevaluated
            ? "Preset example shown below"
            : `Re-evaluate this conversation through ${to}`}
        </button>
        {!alreadyReevaluated && (
          <p className="mt-1 text-xs text-muted">
            Preset example only: no AI re-reads your chat yet.
          </p>
        )}
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-white">
          <span className="sr-only">You said: </span>
          {message.text}
        </p>
      </div>
    );
  }

  // Assistant message (normal reply or re-evaluation example)
  const lens = knowledgeService.getLens(message.lensId);
  const isReevaluation = message.kind === "reevaluation-demo";
  return (
    <div className="flex justify-start">
      <div
        className={`max-w-[92%] rounded-2xl rounded-bl-md bg-paper px-4 py-3 ${
          isReevaluation ? "border border-dashed border-demo-ink" : "border border-line"
        }`}
      >
        <p className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="font-semibold text-ink">Sidekick</span>
          <span>{lens.name} lens</span>
          {message.isDemo ? (
            <Badge tone="demo">
              {isReevaluation ? "Preset example, not real AI" : "Demo reply, not real AI"}
            </Badge>
          ) : (
            <Badge tone="live">AI reply · early test</Badge>
          )}
        </p>
        <p className="whitespace-pre-line break-words">{message.text}</p>
      </div>
    </div>
  );
}
