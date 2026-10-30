import type { Rule, RuleContext, RuleResult } from "../types";
import { estimateTokens } from "../tokens";

export const tokensRule: Rule = {
  id: "tokens",
  category: "tokens",
  run(text, ctx): RuleResult {
    const missing: string[] = [];
    const tips: string[] = [];

    const t = estimateTokens(text);
    const hasCodeBlock = /```/.test(text);
    const repeated = (text.match(/(.{20,})\1/) || []).length > 0;

    if (t > 1500) { tips.push("long"); }
    if (repeated) { tips.push("repeat"); }
    if (hasCodeBlock && t > 800) { tips.push("codeblock"); }

    let score = 1;
    if (t > 1500) score -= 0.3;
    if (t > 3000) score -= 0.3;
    if (repeated) score -= 0.2;
    score = Math.max(0, Math.min(1, score));

    return { score, missing, tips };
  },
};
