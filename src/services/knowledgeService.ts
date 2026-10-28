import { KNOWLEDGE_DOMAINS } from "@/domain/domains";
import { GENERAL_GUIDE_ID, LENSES } from "@/domain/lenses";
import type { KnowledgeDomain, Lens } from "@/domain/types";

export interface ClosestLensResult {
  lens: Lens;
  /** True when the text matches the lens name itself (the lens already exists). */
  isExactMatch: boolean;
}

/**
 * KnowledgeService answers "which lenses and domains exist?"
 * Phase 1 reads from sample data in the code.
 * A later phase can swap in a version that reads real, curated Global Knowledge,
 * without the screens needing to change.
 */
export interface KnowledgeService {
  listLenses(): Lens[];
  searchLenses(query: string): Lens[];
  getLens(id: string): Lens;
  listDomains(): KnowledgeDomain[];
  getDomainsForLens(lensId: string): KnowledgeDomain[];
  getLensesForDomain(domainId: string): Lens[];
  /** Suggests the closest existing lens for a profession name, or null if nothing is close. */
  findClosestLens(professionText: string): ClosestLensResult | null;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whole-word/phrase check so that "po" does not match inside "support". */
function containsPhrase(haystack: string, phrase: string): boolean {
  return ` ${haystack} `.includes(` ${normalize(phrase)} `);
}

class StaticKnowledgeService implements KnowledgeService {
  listLenses(): Lens[] {
    return LENSES.filter((lens) => lens.enabled);
  }

  getLens(id: string): Lens {
    const lens = LENSES.find((l) => l.id === id);
    // Falling back to General Guide keeps the app usable if an ID is ever wrong.
    return lens ?? LENSES.find((l) => l.id === GENERAL_GUIDE_ID)!;
  }

  listDomains(): KnowledgeDomain[] {
    return KNOWLEDGE_DOMAINS;
  }

  getDomainsForLens(lensId: string): KnowledgeDomain[] {
    const lens = this.getLens(lensId);
    return KNOWLEDGE_DOMAINS.filter((d) => lens.domainIds.includes(d.id));
  }

  getLensesForDomain(domainId: string): Lens[] {
    return this.listLenses().filter((lens) => lens.domainIds.includes(domainId));
  }

  searchLenses(query: string): Lens[] {
    const tokens = normalize(query).split(" ").filter(Boolean);
    if (tokens.length === 0) return this.listLenses();

    return this.listLenses().filter((lens) => {
      const domainNames = this.getDomainsForLens(lens.id).map((d) => d.name);
      const haystack = normalize(
        [lens.name, lens.description, ...lens.keywords, ...domainNames].join(" "),
      );
      return tokens.every((token) => haystack.includes(token));
    });
  }

  findClosestLens(professionText: string): ClosestLensResult | null {
    const query = normalize(professionText);
    if (!query) return null;

    let best: { lens: Lens; score: number } | null = null;

    for (const lens of this.listLenses()) {
      if (lens.id === GENERAL_GUIDE_ID) continue; // General Guide is the fallback, not a "match".

      const name = normalize(lens.name);
      let score = 0;
      if (query === name) score += 100;
      else if (containsPhrase(query, name) || containsPhrase(name, query)) score += 50;
      for (const keyword of lens.keywords) {
        if (containsPhrase(query, keyword)) score += 10;
      }

      if (score > 0 && (!best || score > best.score)) best = { lens, score };
    }

    if (!best) return null;
    return { lens: best.lens, isExactMatch: normalize(best.lens.name) === query };
  }
}

export const knowledgeService: KnowledgeService = new StaticKnowledgeService();
