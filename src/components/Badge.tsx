interface BadgeProps {
  children: string;
  /** "demo" = amber (simulated content). "live" = calm green-ish (real AI, early test). */
  tone: "demo" | "live";
}

/** A small label so nothing looks "real" when it is simulated, and nothing looks "fake" when it is real. */
export function Badge({ children, tone }: BadgeProps) {
  const colors =
    tone === "demo" ? "bg-demo-bg text-demo-ink" : "bg-accent-soft text-accent-dark";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors}`}>
      {children}
    </span>
  );
}
