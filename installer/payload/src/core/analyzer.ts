import { ALL_RULES } from "./rules";
import { detectComplexity, overallScore } from "./scoring";
import { fromCatalog, pickForTask } from "./models";
import { detectTask } from "./task";
import { estimateTokens, wordCount, isRussian } from "./tokens";
import { mapAll } from "./i18n";
import { improvePrompt, tokenTips } from "./rewrite";
import { CATEGORY_ORDER, DEFAULT_CONFIG } from "./types";
import type { Analysis, CategoryScore, CoachConfig, ModelCandidate, RuleContext } from "./types";

const cache = new Map<string, Analysis>();
const CACHE_MAX = 100;

function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return String(h >>> 0);
}

/** Analyze prompt synchronously. Cached by text hash + model catalog signature. */
export function analyze(
  text: string,
  cfg: Partial<CoachConfig> = {},
  availableModels?: string[],
  candidates?: readonly ModelCandidate[],
): Analysis {
  const config: CoachConfig = { ...DEFAULT_CONFIG, ...cfg, weights: { ...DEFAULT_CONFIG.weights, ...(cfg.weights ?? {}) } };
  const catalogKey = candidates?.length
    ? candidates
        .map((m) => `${m.providerID}/${m.modelID}:${m.inputPerM}/${m.outputPerM}:${m.intelligence}`)
        .join("|")
    : "";
  const key = hash(text + JSON.stringify(config.weights) + config.lang + catalogKey);
  const cached = cache.get(key);
  if (cached) return cached;

  const trimmed = text.trim();
  const lang = config.lang ?? (isRussian(trimmed) ? "ru" : "en");
  const tokens = estimateTokens(trimmed);
  const words = wordCount(trimmed);
  const ctx: RuleContext = { words, lower: trimmed.toLowerCase(), lang, tokens };

  const byCat = new Map<string, { scores: number[]; missing: string[]; tips: string[] }>();
  for (const rule of ALL_RULES) {
    const res = rule.run(trimmed, ctx);
    const bucket = byCat.get(rule.category) ?? { scores: [], missing: [], tips: [] };
    bucket.scores.push(res.score);
    bucket.missing.push(...(res.missing ?? []));
    bucket.tips.push(...(res.tips ?? []));
    byCat.set(rule.category, bucket);
  }

  const categories: CategoryScore[] = CATEGORY_ORDER.map((k) => {
    const b = byCat.get(k) ?? { scores: [1], missing: [], tips: [] };
    const avg = b.scores.reduce((a, c) => a + c, 0) / b.scores.length;
    return {
      key: k,
      score: Math.round(avg * 100),
      weight: config.weights[k],
      missing: mapAll(b.missing, lang),
      tips: mapAll(b.tips, lang),
    };
  });

  const complexity = detectComplexity(trimmed, lang);
  const task = detectTask(trimmed, lang, tokens);
  const score = overallScore(categories, config.weights);
  const models = pickForTask(candidates ?? [], task.kind, complexity, tokens);
  const available = candidates?.length ? [...candidates] : fromCatalog();
  const missing = categories.flatMap((c) => c.missing);
  const suggestions = categories.flatMap((c) => c.tips).slice(0, 6);

  const partial = { tokens, complexity, categories } as Analysis;
  const improved = improvePrompt(trimmed, partial, lang);
  const tips = tokenTips({ ...partial, score }, lang);

  const weak = categories.filter((c) => c.score < 60).map((c) => c.key);
  const oneLine = `${score}/100 · ${complexity} · ${task.label}: ${models.primary.name} · ~${tokens} tok` +
    (weak.length ? ` · fix: ${weak.join(",")}` : "");

  const result: Analysis = {
    score,
    tokens,
    estimatedCostUsd: models.primary.costPerRequestUsd,
    complexity,
    task,
    categories,
    missing,
    suggestions,
    tokenTips: tips,
    recommendedModel: models.primary,
    alternativeModel: models.alternative,
    availableModels: available,
    improvedPrompt: improved,
    oneLine,
    hash: key,
  };

  cache.set(key, result);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
  return result;
}
