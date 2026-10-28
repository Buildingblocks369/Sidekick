import { GENERAL_GUIDE_ID } from "@/domain/lenses";

/**
 * Scripted text for the DEMO engine. None of this is AI-generated at run time.
 * It exists so you can SEE how switching lenses changes the way Sidekick responds.
 *
 * Topics are picked by simple keyword matching (see demoAssistantService.ts).
 */
export type DemoTopic = "delay" | "decision" | "general";

export const VALIDATION_LINES: Record<DemoTopic, string> = {
  delay: "A project slipping is stressful, and it's a good sign that you're looking at it head-on.",
  decision: "Big choices are hard. It makes sense that you're weighing this carefully.",
  general: "Thanks for sharing that. Let's take it one piece at a time.",
};

interface LensScript {
  delay: string;
  decision: string;
  general: string;
  /** Optional honesty note shown under replies for lenses where limits matter. */
  caution?: string;
}

export const LENS_SCRIPTS: Record<string, LensScript> = {
  [GENERAL_GUIDE_ID]: {
    delay:
      "Let's start simple: what was promised, what's actually done, and what's getting in the way? Once we can see those three things, the next step usually gets clearer. I'm a general guide, not a specialist, so if you'd like a project-focused view you can switch lenses any time. What worries you most about the delay?",
    decision:
      "A good first step is to write down your options and what matters most to you, like money, growth, time, or people. Then we can see which option fits best. I'm a general guide here, not a career specialist. Which option are you leaning toward, even a little?",
    general:
      "Tell me more and I'll help you sort it out in plain language. We can break it into smaller pieces, separate what's known from what's guessed, and find a sensible next step. What would help most right now: understanding it, deciding something, or just talking it through?",
  },
  "project-manager": {
    delay:
      "Think of the project like a road trip that's running late. I'd check three things: what's left to do (scope), how long that really takes (schedule), and what could slow it down even more (risks). Then I'd look for the smallest change that gets you back on track, like trimming scope, adding help, or moving the date, and I'd tell stakeholders early. What's the original deadline, and how much work is left?",
    decision:
      "I'd treat this like a small project: define the goal, list the options, note the risks and what each option needs from you, then pick a first step with a date on it. Which option has the clearest first step?",
    general:
      "From a project view, I'd start with: what's the goal, what's the deadline, who's involved, and what could go wrong? That turns a fuzzy worry into a short plan. What's the goal here?",
  },
  "product-manager": {
    delay:
      "From a product view, a delay is a chance to ask what matters most to your users. If we can't ship everything, which part solves their biggest problem? I'd focus on that, postpone the nice-to-haves, and be honest about what's changing. Who is the user, and what's the one thing they need first?",
    decision:
      "I'd ask which choice solves a real problem and creates the most value. Write down what each option gives you, what you'd give up, and what you'd still need to learn before deciding. What do you know for sure, and what is still a guess?",
    general:
      "Product thinking starts with the problem: who is struggling, with what, and how will we know it's better? Let's pin that down first. Who is this for?",
  },
  "product-owner": {
    delay:
      "As a product owner, I'd look at the backlog, which is the team's to-do list. What's still in it, what order should it be in, and what can wait? The aim is to protect the most valuable items for the next sprint (one short work cycle) and agree on a clear goal for it. Which items would hurt most to lose?",
    decision:
      "I'd turn this into an ordered list: what is most valuable to do first, and why? Then pick a small step you can finish soon and learn from. What's the most valuable thing on your list right now?",
    general:
      "I'd start by writing what needs doing as a simple list, putting the most valuable item first, and defining what \"done\" means. That keeps the work focused. What would \"done\" look like here?",
  },
  "operations-manager": {
    delay:
      "Think of work flowing through a pipe. I'd look for the bottleneck, the narrow spot that slows everything down. Is it too few people, unclear handoffs, waiting on approvals, or a broken step? Fix the narrowest spot first, then make the process steady so it doesn't happen again. Where does work tend to pile up or wait?",
    decision:
      "I'd look at what each option does to your day-to-day: the capacity it needs, what could break, and how repeatable it is. A choice that works once but fails every Monday isn't a good fit. Which option would be easiest to keep up week after week?",
    general:
      "From an operations view, I'd map how the work really happens, step by step, then find where it gets stuck or repeats. What are the main steps, and which one is slowest?",
  },
  "financial-analyst": {
    delay:
      "A delay usually costs something: extra labor, lost income, or penalties. I'd put rough numbers on \"what does one more week cost?\" and compare that with the cost of fixing it faster. That makes the trade-off visible. Roughly what does the project cost per week?",
    decision:
      "I'd compare the options with simple numbers: what each costs, what it could earn, and how sure we are. I'd also check the downside if things go worse than expected. What numbers do you already have?",
    general:
      "I'd start by finding the numbers behind it: what comes in, what goes out, and what's uncertain. Even rough numbers help. What figures do you have so far?",
    caution: "General education only. This is not personalized financial advice.",
  },
  "structural-engineer": {
    delay:
      "In engineering work, a delay is a reason to protect safety and quality first. I'd check which tasks are on the critical path, which checks or reviews can't be skipped, and which constraints are fixed, like codes and materials. Speed-ups that skip safety checks are off the table. Which review or approval is holding things up?",
    decision:
      "I'd start with the constraints that can't move, like safety, rules, and budget, then compare the options against them while keeping a safety margin for unknowns. What are your must-haves?",
    general:
      "In structural thinking we ask: what forces is this carrying, what could make it fail, and how much margin do we have? Applied to your question: what's the load you're worried about, and what's holding it up?",
    caution: "Not a licensed engineer. Safety-critical work needs a qualified professional.",
  },
  "chemical-engineer": {
    delay:
      "Think of it like a recipe at a very large scale. I'd check the inputs (materials), the steps in the process, and the outputs (what you get). Where is the process slow or losing yield, and which safety checks must stay in place? Which step is holding things up?",
    decision:
      "I'd map what goes in and what comes out for each option, include safety and waste, then compare efficiency. What's the main thing you want to improve: cost, output, or safety?",
    general:
      "I'd start by drawing the process: what goes in, what happens, what comes out, and where material or energy gets lost. What process are you looking at?",
    caution: "Not a licensed engineer. Safety-critical work needs a qualified professional.",
  },
};
