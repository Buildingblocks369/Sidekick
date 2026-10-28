/**
 * UsagePolicy decides "is this request allowed?"
 * In Phase 1 there is no cost to protect (the demo engine is free), so this is
 * just a basic sanity check on message length.
 * Later phases will add real limits (daily quotas, search budgets, abuse protection).
 * Those numbers are still undecided in the PRD, so none are invented here.
 */
export interface UsageDecision {
  allowed: boolean;
  /** Plain-English reason shown to the user when `allowed` is false. */
  reason?: string;
}

export interface UsagePolicy {
  checkMessage(text: string): UsageDecision;
}

/** Assumption (reversible): 2,000 characters is plenty for one chat message in the demo. */
export const MAX_MESSAGE_LENGTH = 2000;

class DemoUsagePolicy implements UsagePolicy {
  checkMessage(text: string): UsageDecision {
    if (text.trim().length === 0) {
      return { allowed: false, reason: "Type a message first." };
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
      return {
        allowed: false,
        reason: `That message is a bit long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.`,
      };
    }
    return { allowed: true };
  }
}

export const usagePolicy: UsagePolicy = new DemoUsagePolicy();
