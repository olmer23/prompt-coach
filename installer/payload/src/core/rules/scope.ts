import type { Rule, RuleContext, RuleResult } from "../types";

export const scopeRule: Rule = {
  id: "scope",
  category: "scope",
  run(text, ctx): RuleResult {
    const missing: string[] = [];
    const tips: string[] = [];

    // Multiple tasks in one prompt
    const separators = (text.match(/(и\s+также|а\s+также|плюс|also|and\s+also|additionally)/gi) || []).length;
    const tooManyAnd = (text.match(/,\s*(и|and)\s/gi) || []).length;
    const multi = separators + tooManyAnd >= 2;

    // Huge scope markers
    const huge = /весь\s+(репозитор|проект|код)|all\s+(files|repo|codebase)/i.test(text);

    if (multi) { missing.push("multiple_tasks"); tips.push("split"); }
    if (huge) { missing.push("huge_scope"); tips.push("narrow"); }

    let score = 1;
    if (multi) score -= 0.4;
    if (huge) score -= 0.4;
    score = Math.max(0, Math.min(1, score));

    return { score, missing, tips };
  },
};
