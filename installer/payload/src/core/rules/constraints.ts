import type { Rule, RuleContext, RuleResult } from "../types";

const CONSTRAINT_RU = ["не меняй", "не трогай", "только", "без", "сохрани", "оставь", "не удаляй"];
const CONSTRAINT_EN = ["don't change", "don't touch", "only", "without", "keep", "leave", "don't remove", "preserve"];

export const constraintsRule: Rule = {
  id: "constraints",
  category: "constraints",
  run(text, ctx): RuleResult {
    const missing: string[] = [];
    const tips: string[] = [];
    const words = ctx.lang === "ru" ? CONSTRAINT_RU : CONSTRAINT_EN;
    const hits = words.filter((w) => ctx.lower.includes(w));

    if (hits.length === 0) {
      missing.push("no_constraints");
      tips.push("constraints");
    }

    let score = hits.length ? 0.8 : 0.3;
    if (hits.length >= 2) score = 1;
    score = Math.max(0, Math.min(1, score));

    return { score, missing, tips };
  },
};
