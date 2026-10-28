"use client";

import type { SendResult } from "@/hooks/useConversation";
import { Composer } from "./Composer";
import type { AssistantMode } from "@/services";
import { ModeBadge } from "./ModeBadge";
import { LensControls } from "./LensControls";

interface HomeViewProps {
  mode: AssistantMode | null;
  activeLensId: string;
  onSend: (text: string) => SendResult;
  onBrowse: () => void;
  onSuggest: () => void;
}

export function HomeView({ mode, activeLensId, onSend, onBrowse, onSuggest }: HomeViewProps) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-5 py-10 text-center">
      <ModeBadge mode={mode} />

      <div>
        <h1 className="font-serif text-5xl font-semibold tracking-tight sm:text-6xl">Sidekick</h1>
        <p className="mt-3 text-lg text-muted sm:text-xl">
          Talk to me about anything. Let’s have an honest conversation.
        </p>
      </div>

      <Composer onSubmit={onSend} />

      <LensControls activeLensId={activeLensId} onBrowse={onBrowse} onSuggest={onSuggest} />

      {mode?.mode === "live" && (
        <p className="max-w-md text-xs text-muted">
          Sidekick is an AI thinking partner, not a therapist or a licensed professional. In this
          early test, your messages are sent to an AI service (OpenAI) to write replies. Sidekick
          doesn’t save them, and the service may keep them for up to 30 days for safety checks.
          Please don’t share sensitive personal details. A random cookie is used only to apply
          fair-use limits. Refresh the page and the chat is gone.
        </p>
      )}
      {mode?.mode === "demo" && (
        <p className="max-w-md text-xs text-muted">
          Sidekick is a thinking partner, not a therapist or a licensed professional. In demo mode,
          nothing you type is saved or sent anywhere. Refresh the page and the chat is gone.
        </p>
      )}
    </main>
  );
}
