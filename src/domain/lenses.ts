import type { Lens } from "./types";

export const GENERAL_GUIDE_ID = "general-guide";

/**
 * Sample Professional Lenses.
 * Each lens points at Knowledge Domains by ID, so the same domain
 * (like Agile & Scrum) can be shared by several lenses without copying.
 */
export const LENSES: Lens[] = [
  {
    id: GENERAL_GUIDE_ID,
    name: "General Guide",
    description:
      "A friendly all-purpose thinking partner. Not a specialist, just here to help you think things through.",
    focus: "clear, plain-language thinking and sensible next steps",
    domainIds: ["general-business"],
    keywords: ["general", "anything", "career", "advice", "guide"],
    enabled: true,
  },
  {
    id: "project-manager",
    name: "Project Manager",
    description: "Looks at scope, schedule, risks, and who needs to know what.",
    focus: "scope, schedule, risks, and next actions",
    domainIds: ["project-management", "agile-scrum", "waterfall", "general-business"],
    keywords: ["project", "pm", "schedule", "deadline", "scrum master", "program"],
    enabled: true,
  },
  {
    id: "product-manager",
    name: "Product Manager",
    description: "Looks at user problems, value, and what is worth building first.",
    focus: "user problems, value, and priorities",
    domainIds: ["product-management", "agile-scrum", "general-business"],
    keywords: ["product", "roadmap", "users", "customers", "strategy"],
    enabled: true,
  },
  {
    id: "product-owner",
    name: "Product Owner",
    description: "Looks at backlog order, sprint goals, and what the team can deliver.",
    focus: "backlog order, sprint goals, and what the team can deliver",
    domainIds: ["product-management", "agile-scrum"],
    keywords: ["owner", "po", "backlog", "sprint", "scrum", "agile", "stories"],
    enabled: true,
  },
  {
    id: "operations-manager",
    name: "Operations Manager",
    description: "Looks at processes, capacity, bottlenecks, and keeping work reliable.",
    focus: "processes, capacity, bottlenecks, and reliability",
    domainIds: ["operations", "project-management", "general-business"],
    keywords: [
      "operations",
      "ops",
      "process",
      "supply chain",
      "logistics",
      "warehouse",
      "procurement",
      "inventory",
      "manufacturing",
      "facilities",
    ],
    enabled: true,
  },
  {
    id: "financial-analyst",
    name: "Financial Analyst",
    description: "Looks at numbers, trade-offs, and risk. General education, not personal advice.",
    focus: "numbers, trade-offs, and risk",
    domainIds: ["finance", "general-business"],
    keywords: [
      "finance",
      "financial",
      "money",
      "budget",
      "accounting",
      "accountant",
      "investment",
      "forecast",
    ],
    enabled: true,
  },
  {
    id: "structural-engineer",
    name: "Structural Engineer",
    description: "Looks at loads, safety margins, and constraints. Not a licensed engineer.",
    focus: "loads, safety margins, and fixed constraints",
    domainIds: ["engineering"],
    keywords: ["structural", "civil", "engineer", "building", "bridge", "construction", "architect"],
    enabled: true,
  },
  {
    id: "chemical-engineer",
    name: "Chemical Engineer",
    description: "Looks at process steps, inputs and outputs, safety, and yield. Not a licensed engineer.",
    focus: "process steps, inputs and outputs, safety, and yield",
    domainIds: ["engineering", "chemical-engineering"],
    keywords: ["chemical", "chemistry", "process engineer", "plant", "refinery", "engineer"],
    enabled: true,
  },
];
