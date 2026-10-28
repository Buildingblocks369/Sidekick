"use client";

import { useId, useState } from "react";
import { knowledgeService } from "@/services";
import { Modal } from "./Modal";

interface LensPickerDialogProps {
  open: boolean;
  onClose: () => void;
  activeLensId: string;
  onSelectLens: (lensId: string) => void;
}

type Tab = "lenses" | "domains";

/** Browse and search lenses. A second tab shows Knowledge Domains so the difference is visible. */
export function LensPickerDialog({
  open,
  onClose,
  activeLensId,
  onSelectLens,
}: LensPickerDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="Browse Professions">
      {/* Inner component mounts only while open, so the search box resets each time. */}
      <PickerBody activeLensId={activeLensId} onSelectLens={onSelectLens} onClose={onClose} />
    </Modal>
  );
}

function PickerBody({
  activeLensId,
  onSelectLens,
  onClose,
}: Pick<LensPickerDialogProps, "activeLensId" | "onSelectLens" | "onClose">) {
  const [tab, setTab] = useState<Tab>("lenses");
  const [query, setQuery] = useState("");
  const searchId = useId();

  const lenses = knowledgeService.searchLenses(query);
  const normalizedQuery = query.trim().toLowerCase();
  const domains = knowledgeService
    .listDomains()
    .filter(
      (d) =>
        !normalizedQuery ||
        `${d.name} ${d.description}`.toLowerCase().includes(normalizedQuery),
    );

  return (
    <div>
      <div role="group" aria-label="What to browse" className="mb-4 flex gap-2">
        <TabButton active={tab === "lenses"} onClick={() => setTab("lenses")}>
          Professional Lenses
        </TabButton>
        <TabButton active={tab === "domains"} onClick={() => setTab("domains")}>
          Knowledge Domains
        </TabButton>
      </div>

      <p className="mb-4 rounded-lg bg-accent-soft px-3 py-2 text-sm text-ink">
        {tab === "lenses" ? (
          <>
            A <strong>lens</strong> is <em>how</em> Sidekick looks at your question. Pick one to
            change the perspective of its answers.
          </>
        ) : (
          <>
            A <strong>knowledge domain</strong> is <em>what</em> Sidekick knows. One domain can
            serve several lenses. For now, domains are labels only: no real knowledge
            documents are loaded yet.
          </>
        )}
      </p>

      <label htmlFor={searchId} className="mb-1 block text-sm font-medium">
        {tab === "lenses" ? "Search professions" : "Search domains"}
      </label>
      <input
        id={searchId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={tab === "lenses" ? "Try “project”, “money”, or “engineer”" : "Try “agile” or “finance”"}
        className="mb-3 w-full rounded-lg border border-line bg-paper px-3 py-2 text-base placeholder:text-muted"
      />

      <p role="status" className="mb-2 text-sm text-muted">
        {tab === "lenses"
          ? `${lenses.length} ${lenses.length === 1 ? "lens" : "lenses"} shown`
          : `${domains.length} ${domains.length === 1 ? "domain" : "domains"} shown`}
      </p>

      {tab === "lenses" ? (
        lenses.length === 0 ? (
          <EmptyState>
            No lens matches “{query}”. Close this window and try <strong>Suggest a Profession</strong>{" "}
            to see the closest lens we have.
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {lenses.map((lens) => {
              const isActive = lens.id === activeLensId;
              const domainNames = knowledgeService
                .getDomainsForLens(lens.id)
                .map((d) => d.name);
              return (
                <li key={lens.id}>
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      onSelectLens(lens.id);
                      onClose();
                    }}
                    className={`w-full rounded-xl border px-4 py-3 text-left hover:bg-cream ${
                      isActive ? "border-accent bg-accent-soft" : "border-line bg-paper"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{lens.name}</span>
                      {isActive && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
                          Current
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">{lens.description}</span>
                    <span className="mt-1 block text-xs text-muted">
                      Draws on: {domainNames.join(", ")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )
      ) : domains.length === 0 ? (
        <EmptyState>No domain matches “{query}”.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {domains.map((domain) => {
            const usedBy = knowledgeService.getLensesForDomain(domain.id).map((l) => l.name);
            return (
              <li key={domain.id} className="rounded-xl border border-line bg-paper px-4 py-3">
                <p className="font-semibold">{domain.name}</p>
                <p className="mt-0.5 text-sm text-muted">{domain.description}</p>
                <p className="mt-1 text-xs text-muted">
                  Used by: {usedBy.length > 0 ? usedBy.join(", ") : "no lens yet"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
        active
          ? "border-accent bg-accent text-white"
          : "border-line bg-paper text-ink hover:bg-cream"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
      {children}
    </p>
  );
}
