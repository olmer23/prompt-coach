import type { Complexity, ModelCandidate, ModelSuggestion, TaskKind } from "./types";
import { goLimitFor } from "./usage";

export interface ModelEntry {
  id: string;
  name: string;
  tier: "frontier" | "balanced" | "budget";
  complexity: Complexity[];
  inputPerM: number;
  outputPerM: number;
  strengths: string[];
  /** max context tokens */
  context: number;
  category?: ModelCandidate["category"];
  /** typical agent request: input + cached + output */
  tokenUsage?: string;
  /** selection criterion / purpose */
  purpose?: string;
  /** 0..100 curated capability estimate (not a benchmark) */
  intelligence: number;
  /** task types this model is a strong fit for */
  tasks: TaskKind[];
}

/**
 * Curated catalog, verified against the live OpenCode providers (Zen, Go,
 * OpenRouter) on 2026-10-30. Prices are USD per 1M tokens.
 * `intelligence` is an editorial estimate (0–100), not a benchmark score:
 * it combines public capability signals and model positioning.
 */
export const MODEL_CATALOG: ModelEntry[] = [
  // OpenCode Zen — 7 free models
  { id: "opencode/big-pickle", name: "Big Pickle", tier: "budget", complexity: ["low", "medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "fallback"], context: 200_000, category: "zen", tokenUsage: "1k + 55k + 0.2k", purpose: "Бесплатный fallback, черновики, простые правки", intelligence: 55, tasks: ["general", "fallback"] },
  { id: "opencode/deepseek-v4.1-flash-free", name: "DeepSeek V4.1 Flash Free", tier: "budget", complexity: ["low", "medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "code"], context: 200_000, category: "zen", tokenUsage: "1k + 55k + 0.2k", purpose: "Бесплатный объём: код, рутина, тесты", intelligence: 62, tasks: ["code", "debug", "general"] },
  { id: "opencode/glm-5.3-flash-free", name: "GLM-5.3-Flash Free", tier: "budget", complexity: ["low", "medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "fast"], context: 200_000, category: "zen", tokenUsage: "1k + 55k + 0.2k", purpose: "Бесплатные быстрые правки и документация", intelligence: 56, tasks: ["quick", "code"] },
  { id: "opencode/mimo-v2.6-flash-free", name: "MiMo-V2.6-Flash Free", tier: "budget", complexity: ["low", "medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "volume"], context: 200_000, category: "zen", purpose: "Бесплатный объём простой рутины", intelligence: 54, tasks: ["quick", "general"] },
  { id: "opencode/flint-40b-free", name: "Flint 40B Free", tier: "budget", complexity: ["low", "medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "general"], context: 262_144, category: "zen", purpose: "Бесплатный короткий диалог и черновики", intelligence: 48, tasks: ["general"] },
  { id: "opencode/nemotron-3.5-super-vl-free", name: "Nemotron 3.5 Super VL Free", tier: "balanced", complexity: ["medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "vision"], context: 1_048_576, category: "zen", purpose: "Бесплатный vision/скриншоты", intelligence: 52, tasks: ["ui"] },
  { id: "opencode/beam-free", name: "Beam Free", tier: "budget", complexity: ["low"], inputPerM: 0, outputPerM: 0, strengths: ["free", "fallback"], context: 1_048_576, category: "zen", purpose: "Бесплатный резерв с большим контекстом", intelligence: 42, tasks: ["fallback"] },

  // OpenCode Go — flash / volume (9)
  { id: "opencode-go/glm-5.3-flash", name: "GLM-5.3-Flash", tier: "budget", complexity: ["low", "medium"], inputPerM: 0.15, outputPerM: 0.5, strengths: ["flash", "volume"], context: 1_000_000, category: "flash", tokenUsage: "1k + 55k + 0.2k", purpose: "Массовые правки, тесты, документация", intelligence: 74, tasks: ["quick", "ui", "general"] },
  { id: "opencode-go/minimax-m3.1-flash", name: "MiniMax M3.1 Flash", tier: "budget", complexity: ["low", "medium"], inputPerM: 0.15, outputPerM: 0.6, strengths: ["flash", "long-output"], context: 1_000_000, category: "flash", tokenUsage: "0.5k + 49.4k + 0.36k", purpose: "Большой вывод до 512k токенов, генерация файлов", intelligence: 74, tasks: ["long"] },
  { id: "opencode-go/qwen3.8-flash", name: "Qwen3.8 Flash", tier: "budget", complexity: ["low", "medium"], inputPerM: 0.15, outputPerM: 0.47, strengths: ["flash", "cheap"], context: 1_000_000, category: "flash", tokenUsage: "0.6k + 58k + 0.2k", purpose: "Дешёвый код/текст, черновики", intelligence: 71, tasks: ["quick", "general"] },
  { id: "opencode-go/deepseek-v4.1-flash", name: "DeepSeek V4.1 Flash", tier: "budget", complexity: ["low", "medium"], inputPerM: 0.15, outputPerM: 0.6, strengths: ["flash", "code", "reasoning"], context: 1_000_000, category: "flash", tokenUsage: "0.41k + 71.3k + 0.31k", purpose: "Основная рабочая лошадка: код, план, отладка", intelligence: 79, tasks: ["arch", "debug", "code", "general"] },
  { id: "opencode-go/gpt-6-luna", name: "GPT-6 Luna", tier: "budget", complexity: ["low", "medium"], inputPerM: 0.1, outputPerM: 0.5, strengths: ["fast", "cheap"], context: 1_050_000, category: "flash", tokenUsage: "1k + 50k + 0.22k", purpose: "Быстрый дешёвый агент", intelligence: 82, tasks: ["quick", "general"] },
  { id: "opencode-go/claude-haiku-5-5", name: "Claude Haiku 5.5", tier: "balanced", complexity: ["low", "medium"], inputPerM: 0.1, outputPerM: 0.5, strengths: ["fast", "code"], context: 1_000_000, category: "flash", tokenUsage: "1.1k + 55k + 0.24k", purpose: "Быстрый код/чат, низкая задержка", intelligence: 85, tasks: ["quick", "code"] },
  { id: "opencode-go/mimo-v2.5", name: "MiMo V2.5", tier: "budget", complexity: ["low", "medium"], inputPerM: 0.14, outputPerM: 0.28, strengths: ["flash", "volume"], context: 1_000_000, category: "flash", purpose: "Самый дешёвый объём простой рутины", intelligence: 70, tasks: ["quick", "general"] },
  { id: "opencode-go/muse-spark-1.3-contributor", name: "Muse Spark 1.3 Contributor", tier: "budget", complexity: ["low", "medium"], inputPerM: 0.1, outputPerM: 0.2, strengths: ["cheap", "general"], context: 1_048_576, category: "flash", purpose: "Дёшево, но обучается на данных — без приватного кода", intelligence: 68, tasks: ["quick"] },
  { id: "opencode-go/iceman-contributor-free", name: "Iceman Contributor Free", tier: "budget", complexity: ["low", "medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "code"], context: 262_144, category: "flash", purpose: "Бесплатный contributor: не для приватного кода", intelligence: 60, tasks: ["fallback", "code"] },

  // OpenCode Go — code (6)
  { id: "opencode-go/kimi-k2.7-code", name: "Kimi K2.7 Code", tier: "balanced", complexity: ["medium"], inputPerM: 0.95, outputPerM: 4, strengths: ["code", "agents"], context: 262_144, category: "code", tokenUsage: "0.87k + 55k + 0.2k", purpose: "Кодинг-агент, рефакторинг модулями", intelligence: 87, tasks: ["code"] },
  { id: "opencode-go/glm-5.3", name: "GLM-5.3", tier: "balanced", complexity: ["medium", "high"], inputPerM: 1.4, outputPerM: 4.4, strengths: ["code", "flagship", "reasoning"], context: 1_000_000, category: "code", tokenUsage: "0.7k + 52k + 0.15k", purpose: "Сложные фичи и архитектура, флагман Zhipu", intelligence: 89, tasks: ["arch", "code", "debug"] },
  { id: "opencode-go/kimi-k3.1-pro", name: "Kimi K3.1 Pro", tier: "frontier", complexity: ["medium", "high"], inputPerM: 2, outputPerM: 10, strengths: ["code", "quality"], context: 1_048_576, category: "code", tokenUsage: "1.05k + 76.5k + 0.3k", purpose: "Максимальное качество кода, тяжёлые задачи", intelligence: 93, tasks: ["arch", "code"] },
  { id: "opencode-go/qwen3.7-plus", name: "Qwen3.7 Plus", tier: "balanced", complexity: ["medium", "high"], inputPerM: 0.4, outputPerM: 1.6, strengths: ["code", "balanced"], context: 1_000_000, category: "code", purpose: "Средний код и анализ за умеренную цену", intelligence: 79, tasks: ["code", "general"] },
  { id: "opencode-go/longcat-2.0", name: "LongCat-2.0", tier: "balanced", complexity: ["medium", "high"], inputPerM: 0.3, outputPerM: 1.2, strengths: ["long-context", "code"], context: 1_000_000, category: "code", purpose: "Длинный контекст, большие модули", intelligence: 76, tasks: ["long", "code"] },
  { id: "opencode-go/step-5-preview", name: "Step 5 Preview", tier: "balanced", complexity: ["medium", "high"], inputPerM: 1, outputPerM: 2.7, strengths: ["code", "reasoning"], context: 1_000_000, category: "code", purpose: "Сильный код и разбор сложных багов", intelligence: 86, tasks: ["code", "debug"] },

  // OpenCode Go — smart / reasoning (4)
  { id: "opencode-go/deepseek-v4-pro", name: "DeepSeek V4 Pro", tier: "balanced", complexity: ["high", "medium"], inputPerM: 0.66, outputPerM: 1.98, strengths: ["reasoning", "debug"], context: 1_000_000, category: "smart", tokenUsage: "0.75k + 82k + 0.29k", purpose: "Сложная логика, тупики в отладке", intelligence: 88, tasks: ["debug", "arch"] },
  { id: "opencode-go/qwen3.8-max", name: "Qwen3.8 Max", tier: "frontier", complexity: ["high", "medium"], inputPerM: 2, outputPerM: 6, strengths: ["reasoning", "long-context"], context: 1_000_000, category: "smart", tokenUsage: "0.42k + 66k + 0.2k", purpose: "Длинный контекст, анализ, архитектура", intelligence: 90, tasks: ["arch", "code"] },
  { id: "opencode-go/grok-4.7", name: "Grok 4.7", tier: "frontier", complexity: ["high"], inputPerM: 2, outputPerM: 6, strengths: ["reasoning", "long-context"], context: 500_000, category: "smart", tokenUsage: "0.39k + 32.5k + 0.12k", purpose: "Сложные рассуждения, редкие задачи", intelligence: 91, tasks: ["debug", "arch", "long"] },
  { id: "opencode-go/hy4-preview", name: "Hy4 preview", tier: "balanced", complexity: ["medium", "high"], inputPerM: 0.834, outputPerM: 2.501, strengths: ["reasoning", "debug"], context: 1_024_000, category: "smart", purpose: "Альтернативный reasoning для отладки", intelligence: 84, tasks: ["debug", "code"] },

  // OpenCode Go — multimodal (2)
  { id: "opencode-go/gemini-4-argon", name: "Gemini 4 Argon", tier: "balanced", complexity: ["medium", "high"], inputPerM: 2, outputPerM: 10, strengths: ["multimodal", "long-context"], context: 1_048_576, category: "multimodal", tokenUsage: "1k + 55k + 0.2k", purpose: "Скриншоты, изображения, видео, PDF, длинный контекст", intelligence: 92, tasks: ["ui", "long", "arch"] },
  { id: "opencode-go/mimo-v2.6-pro", name: "MiMo-V2.6-Pro", tier: "balanced", complexity: ["medium", "high"], inputPerM: 0.435, outputPerM: 0.87, strengths: ["multimodal", "vision"], context: 1_048_576, category: "multimodal", tokenUsage: "0.79k + 86k + 0.305k", purpose: "Мультимодальные/vision-задачи", intelligence: 78, tasks: ["ui", "code"] },

  // OpenCode Go — fast / agents (2)
  { id: "opencode-go/minimax-m3", name: "MiniMax M3", tier: "balanced", complexity: ["medium"], inputPerM: 0.3, outputPerM: 1.2, strengths: ["fast", "agents"], context: 1_000_000, category: "fast", tokenUsage: "0.51k + 56k + 0.19k", purpose: "Быстрый агентный цикл, большие ответы", intelligence: 80, tasks: ["long", "code"] },
  { id: "opencode-go/mimo-v2.5-pro", name: "MiMo V2.5 Pro", tier: "balanced", complexity: ["medium", "high"], inputPerM: 0.435, outputPerM: 0.87, strengths: ["agents", "code"], context: 1_048_576, category: "fast", purpose: "Агентные задачи по средней цене", intelligence: 76, tasks: ["code", "general"] },

  // OpenRouter Free — 5 verified free models
  { id: "openrouter/cohere/north-mini-code:free", name: "North Mini Code (free)", tier: "budget", complexity: ["low", "medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "code"], context: 256_000, category: "free", purpose: "Бесплатный кодер — резерв, когда Go исчерпан", intelligence: 62, tasks: ["fallback", "code"] },
  { id: "openrouter/recursive/flint-v1.0:free", name: "Flint (free)", tier: "budget", complexity: ["low", "medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "general"], context: 262_144, category: "free", purpose: "Бесплатный общий резерв", intelligence: 55, tasks: ["fallback", "general"] },
  { id: "openrouter/nvidia/nemotron-3.5-super-vl:free", name: "Nemotron 3.5 Super VL (free)", tier: "balanced", complexity: ["medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "vision"], context: 1_000_000, category: "free", purpose: "Бесплатный vision/скриншоты", intelligence: 52, tasks: ["ui"] },
  { id: "openrouter/google/gemma-4-31b-it:free", name: "Gemma 4 31B (free)", tier: "budget", complexity: ["low"], inputPerM: 0, outputPerM: 0, strengths: ["free", "light"], context: 262_144, category: "free", purpose: "Лёгкие задачи, быстрый fallback", intelligence: 50, tasks: ["general"] },
  { id: "openrouter/xingchen-agi/xing4.0-29b-a4b:free", name: "Xing4.0 29B A4B (free)", tier: "budget", complexity: ["low"], inputPerM: 0, outputPerM: 0, strengths: ["free", "general"], context: 262_144, category: "free", purpose: "Текст, общие задачи", intelligence: 48, tasks: ["general"] },
];

/**
 * Preferred model per detected task, in priority order. The first model that is
 * present in the live catalog wins; the list itself is the fallback chain.
 */
const TASK_PLAN: Record<TaskKind, { primary: string[]; budget: string[] }> = {
  arch: {
    primary: ["opencode-go/deepseek-v4.1-flash", "opencode-go/glm-5.3", "opencode-go/kimi-k3.1-pro"],
    budget: ["opencode-go/glm-5.3", "opencode-go/glm-5.3-flash"],
  },
  code: {
    primary: ["opencode-go/kimi-k2.7-code", "opencode-go/deepseek-v4.1-flash", "opencode-go/glm-5.3"],
    budget: ["opencode-go/deepseek-v4.1-flash", "opencode-go/glm-5.3-flash"],
  },
  debug: {
    primary: ["opencode-go/deepseek-v4.1-flash", "opencode-go/deepseek-v4-pro", "opencode-go/glm-5.3"],
    budget: ["opencode-go/deepseek-v4-pro", "opencode-go/glm-5.3-flash"],
  },
  ui: {
    primary: ["opencode-go/gemini-4-argon", "opencode-go/mimo-v2.6-pro", "opencode/nemotron-3.5-super-vl-free"],
    budget: ["opencode-go/glm-5.3-flash", "opencode/nemotron-3.5-super-vl-free"],
  },
  quick: {
    primary: ["opencode-go/glm-5.3-flash", "opencode-go/gpt-6-luna", "opencode-go/claude-haiku-5-5"],
    budget: ["opencode-go/gpt-6-luna", "opencode-go/mimo-v2.5"],
  },
  long: {
    primary: ["opencode-go/minimax-m3.1-flash", "opencode-go/minimax-m3", "opencode-go/grok-4.7"],
    budget: ["opencode-go/minimax-m3", "opencode-go/deepseek-v4.1-flash"],
  },
  fallback: {
    primary: ["openrouter/cohere/north-mini-code:free", "opencode-go/deepseek-v4.1-flash"],
    budget: ["opencode/big-pickle", "opencode/beam-free"],
  },
  general: {
    primary: ["opencode-go/deepseek-v4.1-flash", "opencode-go/glm-5.3-flash", "opencode-go/qwen3.8-flash"],
    budget: ["opencode-go/glm-5.3-flash", "opencode-go/gpt-6-luna"],
  },
};

const ALLOWED = new Map(MODEL_CATALOG.map((m) => [m.id.toLowerCase(), m]));

/** Find a curated entry by the real provider/model pair (strict provider match). */
export function findCatalogEntry(providerID: string, modelID: string): ModelEntry | undefined {
  return ALLOWED.get(`${providerID}/${modelID}`.toLowerCase());
}

export function isAllowedModel(providerID: string, modelID: string): boolean {
  return Boolean(findCatalogEntry(providerID, modelID));
}

/** Typical agent mix: output is 2x more expensive per token than input. */
export function blendedPerM(m: { inputPerM: number; outputPerM: number }): number {
  return (m.inputPerM + m.outputPerM * 2) / 3;
}

/**
 * Relative value, 0..100: capability per dollar. 100 = best value in the
 * catalog (free models), 1 = most expensive flagship. Not a quality score.
 */
export function efficiencyFor(m: { intelligence: number; inputPerM: number; outputPerM: number }): number {
  const price = blendedPerM(m);
  if (price <= 0) return 100;
  const raw = m.intelligence / price;
  return Math.max(1, Math.min(100, Math.round((raw / 360) * 100)));
}

/** Go monthly allowance: free models are unlimited, paid Go models use the table. */
export function monthlyLimitFor(m: { id?: string; modelID?: string; category?: ModelCandidate["category"]; inputPerM: number }): number | undefined {
  if (m.inputPerM === 0 || m.category === "free" || m.category === "zen") return Infinity;
  const id = m.modelID ?? m.id ?? "";
  return goLimitFor(id, "go");
}

function withMeta(m: ModelEntry): ModelCandidate {
  const slash = m.id.indexOf("/");
  return {
    providerID: slash >= 0 ? m.id.slice(0, slash) : "",
    modelID: slash >= 0 ? m.id.slice(slash + 1) : m.id,
    name: m.name,
    inputPerM: m.inputPerM,
    outputPerM: m.outputPerM,
    context: m.context,
    tier: m.tier,
    category: m.category,
    tokenUsage: m.tokenUsage,
    purpose: m.purpose,
    intelligence: m.intelligence,
    efficiency: efficiencyFor(m),
    tasks: m.tasks,
    monthlyLimit: monthlyLimitFor(m),
  };
}

/** Static catalog in the same shape as live models (fallback). */
export function fromCatalog(): ModelCandidate[] {
  return MODEL_CATALOG.map(withMeta);
}

export function tierFor(inputPerM: number, outputPerM: number): ModelCandidate["tier"] {
  const avg = (inputPerM + outputPerM) / 2;
  if (avg >= 5) return "frontier";
  if (avg >= 0.6) return "balanced";
  return "budget";
}

function cost(m: { inputPerM: number; outputPerM: number }): number {
  return blendedPerM(m);
}

function qualityRank(tier: ModelCandidate["tier"], complexity: Complexity): number {
  if (complexity === "high") return tier === "frontier" ? 3 : tier === "balanced" ? 2 : 1;
  if (complexity === "low") return tier === "budget" ? 3 : tier === "balanced" ? 2 : 1;
  return tier === "balanced" ? 3 : tier === "frontier" ? 2 : 1;
}

function suggestionFromCandidate(
  m: ModelCandidate,
  tier: "quality" | "budget",
  tokens: number,
  task?: TaskKind,
): ModelSuggestion {
  const estIn = Math.max(tokens, 500);
  const estOut = task === "long" ? 4000 : 800;
  const usd = (estIn * m.inputPerM + estOut * m.outputPerM) / 1_000_000;
  return {
    id: `${m.providerID}/${m.modelID}`,
    name: m.name,
    tier,
    reason:
      `$${m.inputPerM} in / $${m.outputPerM} out за 1M · ум ${m.intelligence}/100` +
      (m.efficiency !== undefined ? ` · выгода ${m.efficiency}/100` : ""),
    costPerRequestUsd: Math.round(usd * 10000) / 10000,
    context: m.context,
    tokenUsage: m.tokenUsage,
    purpose: m.purpose,
    inputPerM: m.inputPerM,
    outputPerM: m.outputPerM,
    intelligence: m.intelligence,
    efficiency: m.efficiency ?? efficiencyFor(m),
    monthlyLimit: m.monthlyLimit ?? monthlyLimitFor(m),
  };
}

function pickByTier(pool: readonly ModelCandidate[], complexity: Complexity) {
  const quality = [...pool].sort((a, b) => {
    const rank = qualityRank(b.tier, complexity) - qualityRank(a.tier, complexity);
    return rank !== 0 ? rank : b.intelligence - a.intelligence || cost(a) - cost(b);
  })[0];
  const budget = [...pool].sort((a, b) => cost(a) - cost(b) || b.intelligence - a.intelligence)[0];
  return { quality, budget };
}

/** Static fallback selection (kept for backward compatibility). */
export function pickModels(
  complexity: Complexity,
  tokens: number,
  available?: string[],
): { quality: ModelSuggestion; budget: ModelSuggestion } {
  const pool = available?.length
    ? MODEL_CATALOG.filter((m) => available.some((a) => a.includes(m.id) || m.id.includes(a)))
    : MODEL_CATALOG;

  const candidates = (pool.length ? pool : MODEL_CATALOG).filter((m) =>
    m.complexity.includes(complexity),
  );

  const needLong = tokens > 150_000;
  const filtered = needLong ? candidates.filter((m) => m.context >= tokens) : candidates;
  const list = (filtered.length ? filtered : candidates).map(withMeta);
  const picked = pickByTier(list, complexity);

  return {
    quality: suggestionFromCandidate(picked.quality, "quality", tokens),
    budget: suggestionFromCandidate(picked.budget, "budget", tokens),
  };
}

/** Pick quality/budget from the real catalog. Falls back to the static catalog. */
export function pickFromCandidates(
  candidates: readonly ModelCandidate[],
  complexity: Complexity,
  tokens: number,
): { quality: ModelSuggestion; budget: ModelSuggestion } {
  const pool = candidates.length ? [...candidates] : fromCatalog();
  const needLong = tokens > 150_000;
  const eligible = needLong ? pool.filter((m) => m.context >= tokens) : pool;
  const list = eligible.length ? eligible : pool;
  const picked = pickByTier(list, complexity);

  return {
    quality: suggestionFromCandidate(picked.quality, "quality", tokens),
    budget: suggestionFromCandidate(picked.budget, "budget", tokens),
  };
}

/** Normalize OpenCode Model.Info entries into candidates. Keeps only the curated catalog. */
export function fromModelInfos(infos: readonly unknown[]): ModelCandidate[] {
  const out: ModelCandidate[] = [];
  const seen = new Set<string>();
  for (const raw of infos) {
    if (!raw || typeof raw !== "object") continue;
    const m = raw as Record<string, any>;
    if (m.enabled === false || m.available === false) continue;
    if (m.status === "deprecated") continue;
    const providerID = typeof m.providerID === "string" ? m.providerID : "";
    const modelID =
      typeof m.modelID === "string" ? m.modelID : typeof m.id === "string" ? m.id : "";
    if (!providerID || !modelID) continue;
    const entry = findCatalogEntry(providerID, modelID);
    if (!entry) continue;
    const key = `${providerID}/${modelID}`;
    if (seen.has(key)) continue;
    const liveCost = Array.isArray(m.cost) ? m.cost[0] : undefined;
    const rawIn = Number(liveCost?.input ?? entry.inputPerM);
    const rawOut = Number(liveCost?.output ?? entry.outputPerM);
    const inputPerM = Number.isFinite(rawIn) ? rawIn : entry.inputPerM;
    const outputPerM = Number.isFinite(rawOut) ? rawOut : entry.outputPerM;
    const context = Number(m.limit?.context ?? entry.context);
    const maxOutput = Number(m.limit?.output ?? 0);
    if (!(context > 0)) continue;
    seen.add(key);
    out.push({
      providerID,
      modelID,
      name: entry.name,
      inputPerM,
      outputPerM,
      context,
      maxOutput: maxOutput > 0 ? maxOutput : undefined,
      tier: entry.tier,
      category: entry.category,
      tokenUsage: entry.tokenUsage,
      purpose: entry.purpose,
      intelligence: entry.intelligence,
      efficiency: efficiencyFor({ intelligence: entry.intelligence, inputPerM, outputPerM }),
      tasks: entry.tasks,
      monthlyLimit: monthlyLimitFor({ modelID, category: entry.category, inputPerM }),
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function findPreferred(pool: readonly ModelCandidate[], ids: readonly string[], exclude?: string): ModelCandidate | undefined {
  const byKey = new Map(pool.map((m) => [`${m.providerID}/${m.modelID}`.toLowerCase(), m]));
  for (const id of ids) {
    const wanted = id.toLowerCase();
    const hit = byKey.get(wanted) ?? pool.find((m) => m.modelID.toLowerCase() === wanted);
    if (!hit) continue;
    if (exclude && `${hit.providerID}/${hit.modelID}` === exclude) continue;
    return hit;
  }
  return undefined;
}

/**
 * Pick the best model for the detected task, plus a cheaper/backup option.
 * Honors the curated task plan first, then falls back to quality/cost ranking.
 */
export function pickForTask(
  candidates: readonly ModelCandidate[],
  task: TaskKind,
  complexity: Complexity,
  tokens: number,
): { primary: ModelSuggestion; alternative: ModelSuggestion } {
  const pool = candidates.length ? [...candidates] : fromCatalog();
  const needed = Math.max(tokens, task === "long" ? 200_000 : 0);
  const fitting = needed > 0 ? pool.filter((m) => m.context >= needed) : pool;
  const list = fitting.length ? fitting : pool;
  const plan = TASK_PLAN[task] ?? TASK_PLAN.general;

  const primary =
    findPreferred(list, plan.primary) ??
    (list.some((m) => m.tasks?.includes(task)) ? [...list].filter((m) => m.tasks?.includes(task)).sort((a, b) => b.intelligence - a.intelligence || cost(a) - cost(b))[0] : undefined) ??
    pickByTier(list, complexity).quality;

  const alt =
    findPreferred(list, plan.budget, `${primary.providerID}/${primary.modelID}`) ??
    [...list]
      .filter((m) => `${m.providerID}/${m.modelID}` !== `${primary.providerID}/${primary.modelID}`)
      .sort((a, b) => cost(a) - cost(b) || b.intelligence - a.intelligence)[0] ??
    primary;

  return {
    primary: suggestionFromCandidate(primary, "quality", tokens, task),
    alternative: suggestionFromCandidate(alt, "budget", tokens, task),
  };
}
