import type { Rule, RuleContext, RuleResult } from "../types";

const ACTION_VERBS_RU = [
  "добав", "сделай", "реализ", "исправ", "отрефактор", "напиши", "создай",
  "удали", "переимен", "оптимиз", "провер", "протестируй", "разбей",
];
const ACTION_VERBS_EN = [
  "add", "implement", "fix", "refactor", "write", "create", "delete",
  "rename", "optimize", "test", "split", "update", "remove",
];

export const clarityRule: Rule = {
  id: "clarity",
  category: "clarity",
  run(text, ctx): RuleResult {
    const missing: string[] = [];
    const tips: string[] = [];
    const words = ctx.words;
    const n = words.length;

    // Too short
    if (n < 8) {
      missing.push("too_short");
      tips.push("short");
    }

    // No action verb
    const verbs = ctx.lang === "ru" ? ACTION_VERBS_RU : ACTION_VERBS_EN;
    const hasVerb = verbs.some((v) => ctx.lower.includes(v));
    if (!hasVerb) {
      missing.push("no_action_verb");
      tips.push("verb");
    }

    // Vague words penalty
    const vague = ["что-то", "как-нибудь", "нормально", "хорошо", "улучши", "something", "somehow", "better", "nice"];
    const vagueHits = vague.filter((v) => ctx.lower.includes(v));
    if (vagueHits.length) {
      tips.push("vague");
    }

    // Specificity: numbers / identifiers boost
    const hasIdent = /[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z]/.test(text) || /[A-Z][a-z]+[A-Z]/.test(text);
    const boost = hasIdent ? 0.15 : 0;

    let score = 0.5;
    if (n >= 8 && n <= 60) score += 0.2;
    if (n > 60) score -= 0.1;
    if (hasVerb) score += 0.2;
    if (vagueHits.length) score -= 0.15 * vagueHits.length;
    score += boost;
    score = Math.max(0, Math.min(1, score));

    return { score, missing, tips };
  },
};
