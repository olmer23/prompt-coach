import type { CategoryKey, CoachConfig, Complexity } from "./types";

/** Complexity detection by keywords */
const HIGH_RU = ["архитектур", "рефактор", "миграц", "безопасн", "производительн", "оптимизируй", "отлад", "расслед", "deep", "system design"];
const HIGH_EN = ["architecture", "refactor", "migration", "security", "performance", "optimize", "debug", "investigate", "system design"];
const LOW_RU = ["форматир", "переимен", "документац", "комментар", "описание", "autocomplete", "классифиц", "суммар", "lint"];
const LOW_EN = ["format", "rename", "documentation", "comment", "describe", "classify", "summarize", "lint"];

export function detectComplexity(text: string, lang: "ru" | "en"): Complexity {
  const lower = text.toLowerCase();
  const high = lang === "ru" ? HIGH_RU : HIGH_EN;
  const low = lang === "ru" ? LOW_RU : LOW_EN;
  if (high.some((w) => lower.includes(w))) return "high";
  if (low.some((w) => lower.includes(w))) return "low";
  return "medium";
}

/** Weighted overall score */
export function overallScore(categories: { key: CategoryKey; score: number }[], weights: CoachConfig["weights"]): number {
  let total = 0;
  let wsum = 0;
  for (const c of categories) {
    const w = weights[c.key] ?? 0;
    total += c.score * w;
    wsum += w;
  }
  return wsum ? Math.round(total / wsum) : 0;
}
