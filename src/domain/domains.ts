import type { KnowledgeDomain } from "./types";

/**
 * Sample Knowledge Domains. These are labels only in Phase 1:
 * no real domain content (documents, articles) exists yet.
 */
export const KNOWLEDGE_DOMAINS: KnowledgeDomain[] = [
  {
    id: "agile-scrum",
    name: "Agile & Scrum",
    description: "Working in short cycles, backlogs, sprints, and regular feedback.",
  },
  {
    id: "waterfall",
    name: "Waterfall",
    description: "Planning work in clear stages, one after the other.",
  },
  {
    id: "project-management",
    name: "Project Management",
    description: "Scope, schedule, budget, risks, and keeping people aligned.",
  },
  {
    id: "product-management",
    name: "Product Management",
    description: "Finding user problems and deciding what is worth building.",
  },
  {
    id: "operations",
    name: "Operations",
    description: "How day-to-day work flows, where it gets stuck, and how to keep it steady.",
  },
  {
    id: "finance",
    name: "Finance",
    description: "Costs, returns, budgets, and comparing options with numbers.",
  },
  {
    id: "general-business",
    name: "General Business",
    description: "Everyday workplace basics: teams, goals, communication, and trade-offs.",
  },
  {
    id: "engineering",
    name: "Engineering",
    description: "Constraints, safety margins, testing, and careful design.",
  },
  {
    id: "chemical-engineering",
    name: "Chemical Engineering",
    description: "Processes that turn raw materials into products, safely and efficiently.",
  },
];
