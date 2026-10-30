import type { Rule, RuleContext, RuleResult } from "../types";

const SUCCESS_RU = ["тест", "провер", "ожид", "должен", "результат", "проходит", "assert", "валид"];
const SUCCESS_EN = ["test", "check", "expect", "should", "result", "pass", "assert", "valid"];

export const successRule: Rule = {
  id: "success",
  category: "success",
  run(text, ctx): RuleResult {
    const missing: string[] = [];
    const tips: string[] = [];
    const words = ctx.lang === "ru" ? SUCCESS_RU : SUCCESS_EN;
    const hits = words.filter((w) => ctx.lower.includes(w));

    if (hits.length === 0) {
      missing.push("no_success_criteria");
      tips.push("success");
    }

    const hasTestCmd = /(npm test|bun test|pytest|go test|cargo test)/i.test(text);
    if (hasTestCmd) tips.push("testcmd");

    let score = hits.length ? 0.6 : 0.15;
    if (hasTestCmd) score += 0.25;
    if (hits.length >= 2) score += 0.15;
    score = Math.max(0, Math.min(1, score));

    return { score, missing, tips };
  },
};
