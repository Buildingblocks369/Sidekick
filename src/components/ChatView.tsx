"use client";

import type { ConversationMessage } from "@/domain/types";
import type {
  ConversationError,
  ConversationStatus,
  SendResult,
} from "@/hooks/useConversation";
import { Composer } from "./Composer";
import type { AssistantMode } from "@/services";
import { ModeBadge } from "./ModeBadge";
import { LensControls } from "./LensControls";
import { Transcript } from "./Transcript";

interface ChatViewProps {
  mode: AssistantMode | null;
  messages: ConversationMessage[];
  status: ConversationStatus;
  error: ConversationError | null;
  activeLensId: string;
  onSend: (text: string) => SendResult;
  onReevaluate: (markerId: string) => void;
  onRetry: () => void;
  onDismissError: () => void;
  onBrowse: () => void;
  onSuggest: () => void;
  onNewConversation: () => void;
}

export function ChatView({
  mode,
  messages,
  status,
  error,
  activeLensId,
  onSend,
  onReevaluate,
  onRetry,
  onDismissError,
  onBrowse,
  onSuggest,
  onNewConversation,
}: ChatViewProps) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-line bg-cream">
        <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-semibold">Sidekick</h1>
            <ModeBadge mode={mode} compact />
          </div>
          <button
            type="button"
            onClick={onNewConversation}
            className="rounded-lg border border-line bg-paper px-3 py-1.5 text-sm font-medium hover:bg-cream"
          >
            New conversation
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <Transcript
          mode={mode}
          messages={messages}
          status={status}
          error={error}
          onReevaluate={onReevaluate}
          onRetry={onRetry}
          onDismissError={onDismissError}
        />
      </main>

      <div className="sticky bottom-0 border-t border-line bg-cream">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-3">
          <LensControls
            activeLensId={activeLensId}
            onBrowse={onBrowse}
            onSuggest={onSuggest}
            align="start"
          />
          <Composer onSubmit={onSend} busy={status === "thinking"} focusOnMount />
        </div>
      </div>
    </div>
  );
}
