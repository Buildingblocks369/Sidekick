"use client";

import { useState } from "react";
import { useAssistantMode } from "@/hooks/useAssistantMode";
import { useConversation } from "@/hooks/useConversation";
import { ChatView } from "./ChatView";
import { HomeView } from "./HomeView";
import { LensPickerDialog } from "./LensPickerDialog";
import { SuggestProfessionDialog } from "./SuggestProfessionDialog";

/**
 * The top-level screen. It owns the conversation and decides what to show:
 * the home screen (no messages yet) or the chat screen (once someone sends a message).
 */
export function SidekickApp() {
  const conversation = useConversation();
  const mode = useAssistantMode();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const hasStarted = conversation.messages.length > 0;

  return (
    <>
      {hasStarted ? (
        <ChatView
          mode={mode}
          messages={conversation.messages}
          status={conversation.status}
          error={conversation.error}
          activeLensId={conversation.lensId}
          onSend={conversation.send}
          onReevaluate={conversation.reevaluate}
          onRetry={conversation.retry}
          onDismissError={conversation.dismissError}
          onBrowse={() => setPickerOpen(true)}
          onSuggest={() => setSuggestOpen(true)}
          onNewConversation={conversation.reset}
        />
      ) : (
        <HomeView
          mode={mode}
          activeLensId={conversation.lensId}
          onSend={conversation.send}
          onBrowse={() => setPickerOpen(true)}
          onSuggest={() => setSuggestOpen(true)}
        />
      )}

      <LensPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        activeLensId={conversation.lensId}
        onSelectLens={conversation.switchLens}
      />
      <SuggestProfessionDialog
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        activeLensId={conversation.lensId}
        onUseLens={conversation.switchLens}
      />
    </>
  );
}
