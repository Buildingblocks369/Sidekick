"use client";

import { useId, useState, type FormEvent } from "react";
import { GENERAL_GUIDE_ID } from "@/domain/lenses";
import { knowledgeService, type ClosestLensResult } from "@/services";
import { Modal } from "./Modal";
import { Badge } from "./Badge";

interface SuggestProfessionDialogProps {
  open: boolean;
  onClose: () => void;
  activeLensId: string;
  onUseLens: (lensId: string) => void;
}

export function SuggestProfessionDialog(props: SuggestProfessionDialogProps) {
  return (
    <Modal open={props.open} onClose={props.onClose} title="Suggest a Profession">
      <SuggestBody {...props} />
    </Modal>
  );
}

type Outcome =
  | { kind: "none" }
  | { kind: "match"; match: ClosestLensResult; asked: string }
  | { kind: "declined" };

/**
 * Demonstrates the agreed "missing profession" flow:
 * find the closest lens -> ask permission -> only then switch.
 * Nothing typed here is saved or sent anywhere in Phase 1.
 */
function SuggestBody({ onClose, activeLensId, onUseLens }: SuggestProfessionDialogProps) {
  const [text, setText] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const inputId = useId();

  function findClosest() {
    if (!text.trim()) return;
    const match = knowledgeService.findClosestLens(text);
    setOutcome(match ? { kind: "match", match, asked: text.trim() } : { kind: "none" });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    findClosest();
  }

  function chooseLensAndClose(lensId: string) {
    onUseLens(lensId);
    onClose();
  }

  const activeLens = knowledgeService.getLens(activeLensId);

  return (
    <div>
      <p className="mb-3">
        <Badge tone="demo">Simple keyword match, not AI</Badge>
      </p>
      <p className="mb-4 text-sm text-muted">
        Don’t see your profession? Type it below and Sidekick will show the closest lens we have.
        It will <strong>ask before switching</strong>. Nothing you type here is saved or sent
        anywhere.
      </p>

      <form onSubmit={handleSubmit} className="mb-4">
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium">
          Which profession would you like?
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            type="text"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setOutcome(null);
            }}
            onKeyDown={(event) => {
              // Handle Enter explicitly so it behaves the same everywhere (and is testable).
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault();
                findClosest();
              }
            }}
            placeholder="For example: Supply Chain Manager"
            className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-base placeholder:text-muted"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            Find closest
          </button>
        </div>
      </form>

      <div role="status" aria-live="polite">
        {outcome?.kind === "match" && (
          <Result>
            {outcome.match.isExactMatch ? (
              <p>
                Good news: <strong>{outcome.match.lens.name}</strong> already exists.
              </p>
            ) : (
              <p>
                We don’t have “{outcome.asked}” yet. The closest lens is{" "}
                <strong>{outcome.match.lens.name}</strong>. Would you like to use it?
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => chooseLensAndClose(outcome.match.lens.id)}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
              >
                Yes, use {outcome.match.lens.name}
              </button>
              {!outcome.match.isExactMatch && (
                <button
                  type="button"
                  onClick={() => setOutcome({ kind: "declined" })}
                  className="rounded-lg border border-line bg-paper px-4 py-2 text-sm font-medium hover:bg-cream"
                >
                  No thanks
                </button>
              )}
            </div>
          </Result>
        )}

        {outcome?.kind === "none" && (
          <Result>
            <p>
              We don’t have a close match for that yet. <strong>General Guide</strong> can still
              help you think it through, and you can browse the other lenses any time.
            </p>
            <div className="mt-3">
              {activeLensId !== GENERAL_GUIDE_ID && (
                <button
                  type="button"
                  onClick={() => chooseLensAndClose(GENERAL_GUIDE_ID)}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
                >
                  Use General Guide
                </button>
              )}
            </div>
          </Result>
        )}

        {outcome?.kind === "declined" && (
          <Result>
            <p>
              No problem. We won’t switch anything. You’re still using{" "}
              <strong>{activeLens.name}</strong>. You can browse the other lenses any time
              {activeLensId !== GENERAL_GUIDE_ID ? ", or go back to General Guide" : ""}.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeLensId !== GENERAL_GUIDE_ID && (
                <button
                  type="button"
                  onClick={() => chooseLensAndClose(GENERAL_GUIDE_ID)}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
                >
                  Use General Guide
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-line bg-paper px-4 py-2 text-sm font-medium hover:bg-cream"
              >
                Keep {activeLens.name}
              </button>
            </div>
          </Result>
        )}
      </div>
    </div>
  );
}

function Result({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-line bg-cream px-4 py-3 text-sm">{children}</div>;
}
