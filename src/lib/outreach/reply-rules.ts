import { OUTREACH_ESCALATION_CATEGORIES, type ReplyCategory } from "./constants";

/**
 * Deterministic reply rules.
 *
 * The classifier proposes a category; these rules have the final say. Anything
 * safety-relevant — stopping automation, escalating to a human, suppressing an
 * opt-out — is derived from the category and the raw text, never from the
 * model's own booleans.
 */

export type ReplyDecisionInput = {
  modelCategory: ReplyCategory;
  modelConfidence: number;
  inboundSubject: string | null;
  inboundBody: string;
};

export type ReplyDecision = {
  category: ReplyCategory;
  confidence: number;
  requiresHumanReply: boolean;
  stopAutomation: boolean;
  suppress: boolean;
  markInterested: boolean;
  suggestedAction: string;
  ruleApplied: string;
};

const OPT_OUT_PATTERNS = [
  /\bunsubscrib/i,
  /\bremove\s+me\b/i,
  /\bstop\s+(email|emailing|messaging|contacting)/i,
  /\bdo\s+not\s+(contact|email|message)/i,
  /\bd[o']n'?t\s+(contact|email|message|write)/i,
  // Equally explicit phrasings that are easy to miss.
  /\b(do\s+not|don't|dont)\s+(want|wish|like)\s+to\s+(be\s+)?(contacted|receive|hear)/i,
  /\bno\s+longer\s+(wish|want)\s+to\s+(be\s+)?(contacted|emailed|receive|hear)/i,
  /\bnot\s+(to\s+be\s+)?(contacted|emailed)\s+(any\s*)?(more|further|again)\b/i,
  /\bmark\s+as\s+(spam|junk)/i,
];

const INTERESTED_PATTERNS = [
  /\b(yes[,!.]|sure[,!.]|absolutely)\b/i,
  /\b(we'?d\s+like\s+to|we\s+would\s+like\s+to|we'?d\s+be\s+interested)\b/i,
  /\b(interested|keen)\b/i,
  /\bsounds\s+good\b/i,
  /\b(let'?s\s+(talk|chat|discuss))\b/i,
];

const MEETING_PATTERNS = [
  /\b(book|call|meeting|demo|chat|schedule)\s+(a\s+)?(call|meeting|demo|chat|time|slot)/i,
  /\bwhen\s+(can|are)\s+you\s+available\b/i,
  /\bavailable\s+(this|next|tomorrow|monday|tuesday|wednesday|thursday|friday)/i,
  /\bcan\s+we\s+(arrange|schedule|set\s+up)\b/i,
  /\bcalendar\s+link\b/i,
];

const PRICE_PATTERNS = [
  /\b(price|pricing|cost|costs|how\s+much|quote|quotation|budget|rate|rates|fee|fees|expensive|afford)\b/i,
  /\bdevis\b/i,
  /\btarif(s)?\b/i,
  /\bprix\b/i,
];

const QUESTION_PATTERN = /\?/;

const LATER_PATTERNS = [
  /\b(later|not\s+now|right\s+now|busy|another\s+time|next\s+(month|quarter|year)|down\s+the\s+road)\b/i,
];

const PROVIDER_PATTERNS = [
  /\b(already\s+(have|has|got|work)\s+with|our\s+(agency|developer|designer|freelancer|provider))\b/i,
];

const WRONG_CONTACT_PATTERNS = [
  /\b(wrong\s+(address|person|contact)|not\s+the\s+right|former\s+employee|no\s+longer\s+here)\b/i,
];

const NOT_INTERESTED_PATTERNS = [
  /\b(not\s+interested|no\s+thanks|no\s+thank\s+you|we\s+are\s+not\s+interested|delete\s+my\s+contact)\b/i,
];

const UNDELIVERABLE_PATTERNS = [
  /\b(undeliverable|mail\s+delivery\s+failed|this\s+account\s+does\s+not\s+exist|user\s+unknown|5\.1\.1|5\.2\.1|550\s)/i,
  /\b(automatic\s+reply|auto-?reply|out\s+of(\s+the)?\s+office|away\s+from\s+my\s+desk|on\s+(annual\s+|parental\s+)?leave)\b/i,
];

export function containsAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

/**
 * Ordering matters. Opt-out beats everything, undeliverable beats intent, and
 * an explicit opt-out or bounce is never downgraded to a softer category.
 */
export function decideReply(input: ReplyDecisionInput): ReplyDecision {
  const body = input.inboundBody.slice(0, 8_000);
  const haystack = `${input.inboundSubject ?? ""}\n${body}`.slice(0, 8_000);

  const finalize = (
    category: ReplyCategory,
    confidence: number,
    suggestedAction: string,
    ruleApplied: string
  ): ReplyDecision => {
    const suppress = category === "UNSUBSCRIBE";
    return {
      category,
      confidence,
      requiresHumanReply: OUTREACH_ESCALATION_CATEGORIES.includes(category),
      stopAutomation: category !== "LATER",
      suppress,
      markInterested: category === "INTERESTED",
      suggestedAction,
      ruleApplied,
    };
  };

  // A reply with no body at all is never a meaningful answer. Treating it as
  // undeliverable stops the sequence instead of letting it linger.
  if (body.trim().length === 0) {
    return finalize("BOUNCE", 0.9, "Empty reply body. Treat as undeliverable and stop the sequence.", "rule:empty_body");
  }
  if (containsAny(haystack, UNDELIVERABLE_PATTERNS)) {
    return finalize("BOUNCE", 0.95, "Treat as undeliverable. Suppress the address and stop the sequence.", "rule:undeliverable");
  }
  if (containsAny(haystack, OPT_OUT_PATTERNS)) {
    return finalize("UNSUBSCRIBE", 0.98, "Suppress immediately and stop all automation.", "rule:opt_out");
  }
  if (containsAny(haystack, MEETING_PATTERNS)) {
    return finalize("MEETING_REQUEST", 0.9, "Stop automation and ask a human to book the meeting.", "rule:meeting");
  }
  if (containsAny(haystack, PRICE_PATTERNS)) {
    return finalize("PRICE_REQUEST", 0.9, "Stop automation. A human must answer; the engine never quotes pricing.", "rule:price");
  }
  if (containsAny(haystack, WRONG_CONTACT_PATTERNS)) {
    return finalize("WRONG_CONTACT", 0.85, "Stop automation. Correct the contact record before any further outreach.", "rule:wrong_contact");
  }
  if (containsAny(haystack, PROVIDER_PATTERNS)) {
    return finalize("ALREADY_HAS_PROVIDER", 0.8, "Leave the prospect alone. No further automated contact.", "rule:existing_provider");
  }
  if (containsAny(haystack, NOT_INTERESTED_PATTERNS)) {
    return finalize("NOT_INTERESTED", 0.9, "Stop automation. Do not contact again.", "rule:not_interested");
  }
  if (containsAny(haystack, LATER_PATTERNS)) {
    return finalize("LATER", 0.75, "Stop the current sequence. Do not re-queue a follow-up without review.", "rule:later");
  }

  // The model's own category is accepted only when the rules above stayed silent
  // and it is not an optimistic guess on ambiguous text.
  const ambiguous = !containsAny(haystack, INTERESTED_PATTERNS) && !QUESTION_PATTERN.test(haystack);
  if (ambiguous && (input.modelCategory === "INTERESTED" || input.modelConfidence < 0.6)) {
    return finalize("OTHER", 0.5, "Ambiguous reply. Route to a human without assuming interest.", "rule:ambiguous_guard");
  }
  if (input.modelCategory === "INTERESTED" && !containsAny(haystack, INTERESTED_PATTERNS)) {
    return finalize("OTHER", 0.5, "Model claimed interest but no positive signal is present in the text.", "rule:interest_requires_evidence");
  }

  return finalize(
    input.modelCategory,
    input.modelConfidence,
    input.modelCategory === "QUESTION" ? "Stop the sequence and answer the question personally." : "Route to a human for review.",
    "rule:model_category"
  );
}
