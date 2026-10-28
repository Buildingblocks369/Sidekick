"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * A pop-up built on the browser's native <dialog> element.
 * The browser gives us for free: keeping keyboard focus inside the pop-up,
 * closing with the Esc key, and returning focus to the button that opened it.
 */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // Clicking the dimmed area outside the box closes the pop-up.
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[min(94vw,40rem)] max-h-[88vh] overflow-hidden rounded-2xl border border-line bg-paper p-0 text-ink shadow-xl"
    >
      {open && (
        <div className="flex max-h-[88vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <h2 id={titleId} className="font-serif text-2xl">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-cream"
            >
              Close
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
