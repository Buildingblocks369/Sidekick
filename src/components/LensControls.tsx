"use client";

import { knowledgeService } from "@/services";

interface LensControlsProps {
  activeLensId: string;
  onBrowse: () => void;
  onSuggest: () => void;
  /** "center" for the home screen, "start" for the chat bar. */
  align?: "center" | "start";
}

/** The three lens-related buttons that appear on both screens. */
export function LensControls({ activeLensId, onBrowse, onSuggest, align = "center" }: LensControlsProps) {
  const lens = knowledgeService.getLens(activeLensId);
  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${
        align === "center" ? "justify-center" : "justify-start"
      }`}
    >
      <button
        type="button"
        onClick={onBrowse}
        className="rounded-full border border-accent bg-accent-soft px-4 py-2 text-sm text-ink hover:bg-white"
      >
        <span className="text-muted">Lens: </span>
        <span className="font-semibold">{lens.name}</span>
        <span className="sr-only">. Activate to change lens.</span>
      </button>
      <button
        type="button"
        onClick={onBrowse}
        className="rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium hover:bg-cream"
      >
        Browse Professions
      </button>
      <button
        type="button"
        onClick={onSuggest}
        className="rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium hover:bg-cream"
      >
        Suggest a Profession
      </button>
    </div>
  );
}
