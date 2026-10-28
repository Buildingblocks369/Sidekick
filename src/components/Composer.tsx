"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { SendResult } from "@/hooks/useConversation";

interface ComposerProps {
  onSubmit: (text: string) => SendResult;
  /** True while Sidekick is "thinking", so people can't send twice. */
  busy?: boolean;
  /** Move keyboard focus into the text box when this appears. */
  focusOnMount?: boolean;
}

function MicIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

/** The text box, Send button, and the (not yet working) microphone. */
export function Composer({ onSubmit, busy = false, focusOnMount = false }: ComposerProps) {
  const [text, setText] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const hintId = useId();
  const micHintId = useId();

  useEffect(() => {
    if (focusOnMount) textareaRef.current?.focus();
  }, [focusOnMount]);

  function submit() {
    const result = onSubmit(text);
    if (result.ok) {
      setText("");
      setProblem(null);
    } else {
      setProblem(result.reason ?? "That message could not be sent.");
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends. Shift+Enter makes a new line. Skip while an input method (IME) is composing.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl border border-line bg-paper p-3 text-left shadow-sm"
    >
      <label htmlFor={inputId} className="sr-only">
        Your message to Sidekick
      </label>
      <textarea
        id={inputId}
        ref={textareaRef}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          if (problem) setProblem(null);
        }}
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder="What’s on your mind?"
        aria-describedby={hintId}
        aria-invalid={problem ? true : undefined}
        className="block w-full resize-none rounded-lg bg-transparent px-2 py-1.5 text-base text-ink placeholder:text-muted"
      />
      <p id={hintId} className="px-2 text-xs text-muted">
        Enter to send. Shift+Enter for a new line.
      </p>

      {problem && (
        <p role="alert" className="mt-2 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-ink">
          {problem}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {/* aria-disabled (not "disabled") keeps it reachable by keyboard and screen readers, so they hear that it's coming soon. */}
        <button
          type="button"
          aria-disabled="true"
          aria-describedby={micHintId}
          onClick={(event) => event.preventDefault()}
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-dashed border-muted bg-cream px-3.5 py-2 text-sm font-medium text-muted"
        >
          <MicIcon />
          Voice — coming soon
        </button>
        <span id={micHintId} className="sr-only">
          Voice input is not built yet. Please type your message.
        </span>

        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-muted"
        >
          {busy ? "Thinking…" : "Send"}
        </button>
      </div>
    </form>
  );
}
