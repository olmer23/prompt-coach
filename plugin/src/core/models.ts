import type { Complexity, ModelCandidate, ModelSuggestion } from "./types";

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
}

const T = "1k + 55k + 0.2k";

/** Exactly 36 curated models: 3 Zen + 18 Go + 15 OpenRouter Free. */
export const MODEL_CATALOG: ModelEntry[] = [
  // OpenCode Zen — 3
  { id: "opencode/big-pickle", name: "big-pickle", tier: "budget", complexity: ["low", "medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "fallback"], context: 200_000, category: "zen", tokenUsage: T, purpose: "Бесплатный fallback, черновики, простые правки" },
  { id: "opencode/deepseek-v4.1-flash-free", name: "deepseek-v4.1-flash-free", tier: "budget", complexity: ["low", "medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "code"], context: 1_000_000, category: "zen", tokenUsage: T, purpose: "Бесплатный объём: код, рутина, тесты" },
  { id: "opencode/glm-5.3-flash-free", name: "glm-5.3-flash-free", tier: "budget", complexity: ["low", "medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "fast"], context: 1_000_000, category: "zen", tokenUsage: T, purpose: "Бесплатные быстрые правки и документация" },

  // OpenCode Go — flash (5)
  { id: "opencode-go/glm-5.3-flash", name: "GLM-5.3-Flash", tier: "budget", complexity: ["low", "medium"], inputPerM: 0.15, outputPerM: 0.5, strengths: ["flash", "volume"], context: 1_000_000, category: "flash", tokenUsage: "1k + 55k + 0.2k", purpose: "Массовые правки, тесты, документация" },
  { id: "opencode-go/minimax-m3.1-flash", name: "MiniMax M3.1 Flash", tier: "budget", complexity: ["low", "medium"], inputPerM: 0.15, outputPerM: 0.6, strengths: ["flash", "agents"], context: 200_000, category: "flash", tokenUsage: "0.5k + 49.4k + 0.36k", purpose: "Быстрый агентный цикл, средние задачи" },
  { id: "opencode-go/mimo-v2.6-flash", name: "MiMo-V2.6-Flash", tier: "budget", complexity: ["low", "medium"], inputPerM: 0.14, outputPerM: 0.28, strengths: ["flash", "volume"], context: 1_100_000, category: "flash", tokenUsage: "0.83k + 71.5k + 0.295k", purpose: "Большой объём простой рутины" },
  { id: "opencode-go/qwen3.8-flash", name: "Qwen3.8 Flash", tier: "budget", complexity: ["low", "medium"], inputPerM: 0.15, outputPerM: 0.47, strengths: ["flash", "cheap"], context: 1_000_000, category: "flash", tokenUsage: "0.6k + 58k + 0.2k", purpose: "Дешёвый код/текст, черновики" },
  { id: "opencode-go/deepseek-v4.1-flash", name: "DeepSeek V4.1 Flash", tier: "budget", complexity: ["low", "medium"], inputPerM: 0.15, outputPerM: 0.6, strengths: ["flash", "code"], context: 1_000_000, category: "flash", tokenUsage: "0.41k + 71.3k + 0.31k", purpose: "Основная рабочая лошадка для кода" },

  // OpenCode Go — code (4)
  { id: "opencode-go/kimi-k2.7-code", name: "Kimi K2.7 Code", tier: "balanced", complexity: ["medium"], inputPerM: 0.95, outputPerM: 4, strengths: ["code"], context: 262_000, category: "code", tokenUsage: "0.87k + 55k + 0.2k", purpose: "Кодинг-агент, рефакторинг" },
  { id: "opencode-go/kimi-k3", name: "Kimi K3", tier: "frontier", complexity: ["medium", "high"], inputPerM: 3, outputPerM: 15, strengths: ["code", "long-context"], context: 262_000, category: "code", tokenUsage: "1.05k + 76.5k + 0.3k", purpose: "Сложный код, длинный контекст" },
  { id: "opencode-go/kimi-k3.1-pro", name: "Kimi K3.1 Pro", tier: "frontier", complexity: ["medium", "high"], inputPerM: 2, outputPerM: 10, strengths: ["code", "quality"], context: 262_000, category: "code", tokenUsage: "1.05k + 76.5k + 0.3k", purpose: "Максимальное качество кода, тяжёлые задачи" },
  { id: "opencode-go/glm-5.3", name: "GLM-5.3", tier: "balanced", complexity: ["medium", "high"], inputPerM: 1.4, outputPerM: 4.4, strengths: ["code", "flagship"], context: 1_000_000, category: "code", tokenUsage: "0.7k + 52k + 0.15k", purpose: "Сложные фичи, флагман Zhipu" },

  // OpenCode Go — smart/reasoning (4)
  { id: "opencode-go/deepseek-v4-pro", name: "DeepSeek V4 Pro", tier: "balanced", complexity: ["high", "medium"], inputPerM: 0.66, outputPerM: 1.98, strengths: ["reasoning", "debug"], context: 1_000_000, category: "smart", tokenUsage: "0.75k + 82k + 0.29k", purpose: "Сложная логика, отладка" },
  { id: "opencode-go/qwen3.8-max", name: "Qwen3.8 Max", tier: "frontier", complexity: ["high", "medium"], inputPerM: 2, outputPerM: 6, strengths: ["reasoning", "long-context"], context: 1_000_000, category: "smart", tokenUsage: "0.42k + 66k + 0.2k", purpose: "Длинный контекст, анализ" },
  { id: "opencode-go/grok-4.7", name: "Grok 4.7", tier: "frontier", complexity: ["high"], inputPerM: 2, outputPerM: 6, strengths: ["reasoning"], context: 2_000_000, category: "smart", tokenUsage: "0.39k + 32.5k + 0.12k", purpose: "Сложные рассуждения, редкие задачи" },
  { id: "opencode-go/gpt-5.6-luna", name: "GPT 5.6 Luna", tier: "balanced", complexity: ["medium", "high"], inputPerM: 0.2, outputPerM: 1.2, strengths: ["reasoning", "price"], context: 1_100_000, category: "smart", tokenUsage: "1k + 50k + 0.22k", purpose: "Баланс reasoning и цены" },

  // OpenCode Go — multimodal (2)
  { id: "opencode-go/gemini-4-argon", name: "Gemini 4 Argon", tier: "balanced", complexity: ["medium", "high"], inputPerM: 2, outputPerM: 10, strengths: ["multimodal", "long-context"], context: 1_000_000, category: "multimodal", tokenUsage: "1k + 55k + 0.2k", purpose: "Изображения, длинный контекст" },
  { id: "opencode-go/mimo-v2.6-pro", name: "MiMo-V2.6-Pro", tier: "balanced", complexity: ["medium", "high"], inputPerM: 0.435, outputPerM: 0.87, strengths: ["multimodal", "vision"], context: 1_100_000, category: "multimodal", tokenUsage: "0.79k + 86k + 0.305k", purpose: "Мультимодальные/vision-задачи" },

  // OpenCode Go — fast (3)
  { id: "opencode-go/claude-haiku-5-5", name: "Claude Haiku 5.5", tier: "balanced", complexity: ["low", "medium"], inputPerM: 0.1, outputPerM: 0.5, strengths: ["fast", "code"], context: 200_000, category: "fast", tokenUsage: "1.1k + 55k + 0.24k", purpose: "Быстрый код/чат, низкая задержка" },
  { id: "opencode-go/gpt-6-luna", name: "GPT 6 Luna", tier: "budget", complexity: ["low", "medium"], inputPerM: 0.1, outputPerM: 0.5, strengths: ["fast", "cheap"], context: 1_100_000, category: "fast", tokenUsage: "1k + 50k + 0.22k", purpose: "Быстрый дешёвый агент" },
  { id: "opencode-go/minimax-m3", name: "MiniMax M3", tier: "balanced", complexity: ["medium"], inputPerM: 0.3, outputPerM: 1.2, strengths: ["fast", "agents"], context: 200_000, category: "fast", tokenUsage: "0.51k + 56k + 0.19k", purpose: "Быстрый агентный цикл" },

  // OpenRouter Free — 15 (content-safety and the 404 model excluded)
  { id: "openrouter/cohere/north-mini-code:free", name: "cohere/north-mini-code:free", tier: "budget", complexity: ["low", "medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "code"], context: 128_000, category: "free", tokenUsage: T, purpose: "Код, бесплатный fallback" },
  { id: "openrouter/dots-studio/dots-3-note-preview:free", name: "dots-studio/dots-3-note-preview:free", tier: "budget", complexity: ["low"], inputPerM: 0, outputPerM: 0, strengths: ["free", "text"], context: 128_000, category: "free", tokenUsage: T, purpose: "Текст/заметки, preview" },
  { id: "openrouter/google/gemma-4-26b-a4b-it:free", name: "google/gemma-4-26b-a4b-it:free", tier: "budget", complexity: ["low"], inputPerM: 0, outputPerM: 0, strengths: ["free", "light"], context: 128_000, category: "free", tokenUsage: T, purpose: "Лёгкие задачи, быстрый fallback" },
  { id: "openrouter/google/gemma-4-31b-it:free", name: "google/gemma-4-31b-it:free", tier: "budget", complexity: ["low", "medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "balanced"], context: 128_000, category: "free", tokenUsage: T, purpose: "Баланс качества и скорости" },
  { id: "openrouter/liquid/lfm-2.5-2.6b:free", name: "liquid/lfm-2.5-2.6b:free", tier: "budget", complexity: ["low"], inputPerM: 0, outputPerM: 0, strengths: ["free", "micro"], context: 32_000, category: "free", tokenUsage: T, purpose: "Микро-задачи, классификация" },
  { id: "openrouter/nvidia/nemotron-3.5-lightning:free", name: "nvidia/nemotron-3.5-lightning:free", tier: "budget", complexity: ["low", "medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "fast"], context: 128_000, category: "free", tokenUsage: T, purpose: "Быстрые ответы" },
  { id: "openrouter/nvidia/nemotron-3.5-super-vl:free", name: "nvidia/nemotron-3.5-super-vl:free", tier: "balanced", complexity: ["medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "vision"], context: 128_000, category: "free", tokenUsage: T, purpose: "Vision/мультимодальность" },
  { id: "openrouter/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", name: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", tier: "balanced", complexity: ["medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "reasoning"], context: 128_000, category: "free", tokenUsage: T, purpose: "Компактный reasoning" },
  { id: "openrouter/nvidia/nemotron-3-ultra-550b-a55b:free", name: "nvidia/nemotron-3-ultra-550b-a55b:free", tier: "frontier", complexity: ["high", "medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "reasoning", "long-context"], context: 1_000_000, category: "free", tokenUsage: T, purpose: "Сложные задачи, большой контекст" },
  { id: "openrouter/poolside/laguna-s-2.1:free", name: "poolside/laguna-s-2.1:free", tier: "balanced", complexity: ["medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "code"], context: 128_000, category: "free", tokenUsage: T, purpose: "Код" },
  { id: "openrouter/poolside/laguna-xs-2.1:free", name: "poolside/laguna-xs-2.1:free", tier: "budget", complexity: ["low"], inputPerM: 0, outputPerM: 0, strengths: ["free", "fast-code"], context: 128_000, category: "free", tokenUsage: T, purpose: "Быстрый код" },
  { id: "openrouter/recursive/flint-v1.0:free", name: "recursive/flint-v1.0:free", tier: "balanced", complexity: ["medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "general"], context: 128_000, category: "free", tokenUsage: T, purpose: "Общие задачи" },
  { id: "openrouter/thinkingmachines/inkling:free", name: "thinkingmachines/inkling:free", tier: "frontier", complexity: ["high", "medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "reasoning", "agents"], context: 128_000, category: "free", tokenUsage: T, purpose: "Reasoning/агенты" },
  { id: "openrouter/thinkingmachines/inkling-small:free", name: "thinkingmachines/inkling-small:free", tier: "budget", complexity: ["low", "medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "reasoning"], context: 128_000, category: "free", tokenUsage: T, purpose: "Быстрый reasoning" },
  { id: "openrouter/xingchen-agi/xing4.0-29b-a4b:free", name: "xingchen-agi/xing4.0-29b-a4b:free", tier: "balanced", complexity: ["medium"], inputPerM: 0, outputPerM: 0, strengths: ["free", "general"], context: 128_000, category: "free", tokenUsage: T, purpose: "Текст, общие задачи" },
];

const ALLOWED = new Map(MODEL_CATALOG.map((m) => [m.id.toLowerCase(), m]));
const ALLOWED_MODEL_IDS = new Map(
  MODEL_CATALOG.map((m) => [m.id.slice(m.id.indexOf("/") + 1).toLowerCase(), m]),
);

/** Find a curated entry by the real provider/model pair. */
export function findCatalogEntry(providerID: string, modelID: string): ModelEntry | undefined {
  const full = `${providerID}/${modelID}`.toLowerCase();
  return ALLOWED.get(full) ?? ALLOWED_MODEL_IDS.get(modelID.toLowerCase());
}

export function isAllowedModel(providerID: string, modelID: string): boolean {
  return Boolean(findCatalogEntry(providerID, modelID));
}

/** Static catalog in the same shape as live models (fallback). */
export function fromCatalog(): ModelCandidate[] {
  return MODEL_CATALOG.map((m) => {
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
    };
  });
}

export function tierFor(inputPerM: number, outputPerM: number): ModelCandidate["tier"] {
  const avg = (inputPerM + outputPerM) / 2;
  if (avg >= 5) return "frontier";
  if (avg >= 0.6) return "balanced";
  return "budget";
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
  const list = filtered.length ? filtered : candidates;

  const sorted = [...list].sort((a, b) => cost(b) - cost(a));
  const q = sorted[0] ?? MODEL_CATALOG[0];
  const b = sorted[sorted.length - 1] ?? q;

  return {
    quality: toSuggestion(q, "quality", complexity, tokens),
    budget: toSuggestion(b, "budget", complexity, tokens),
  };
}

function cost(m: ModelEntry): number {
  return (m.inputPerM + m.outputPerM) / 2;
}

function toSuggestion(m: ModelEntry, tier: "quality" | "budget", complexity: Complexity, tokens: number): ModelSuggestion {
  const estIn = Math.max(tokens, 500);
  const estOut = 800;
  const usd = (estIn * m.inputPerM + estOut * m.outputPerM) / 1_000_000;
  return {
    id: m.id,
    name: m.name,
    tier,
    reason: `${m.tier} · ${m.strengths.join(", ")}`,
    costPerRequestUsd: Math.round(usd * 10000) / 10000,
    context: m.context,
    tokenUsage: m.tokenUsage,
    purpose: m.purpose,
  };
}

/** Normalize OpenCode Model.Info entries into candidates. Keeps only the curated 36. */
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
    const cost = Array.isArray(m.cost) ? m.cost[0] : undefined;
    const inputPerM = Number(cost?.input ?? entry.inputPerM);
    const outputPerM = Number(cost?.output ?? entry.outputPerM);
    const context = Number(m.limit?.context ?? entry.context);
    const maxOutput = Number(m.limit?.output ?? 0);
    if (!(context > 0)) continue;
    seen.add(key);
    out.push({
      providerID,
      modelID,
      name: entry.name,
      inputPerM: Number.isFinite(inputPerM) ? inputPerM : entry.inputPerM,
      outputPerM: Number.isFinite(outputPerM) ? outputPerM : entry.outputPerM,
      context,
      maxOutput: maxOutput > 0 ? maxOutput : undefined,
      tier: entry.tier,
      category: entry.category,
      tokenUsage: entry.tokenUsage,
      purpose: entry.purpose,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function qualityRank(tier: ModelCandidate["tier"], complexity: Complexity): number {
  if (complexity === "high") return tier === "frontier" ? 3 : tier === "balanced" ? 2 : 1;
  if (complexity === "low") return tier === "budget" ? 3 : tier === "balanced" ? 2 : 1;
  return tier === "balanced" ? 3 : tier === "frontier" ? 2 : 1;
}

function candidateCost(m: ModelCandidate): number {
  return (m.inputPerM + m.outputPerM) / 2;
}

function suggestionFromCandidate(
  m: ModelCandidate,
  tier: "quality" | "budget",
  tokens: number,
): ModelSuggestion {
  const estIn = Math.max(tokens, 500);
  const estOut = 800;
  const usd = (estIn * m.inputPerM + estOut * m.outputPerM) / 1_000_000;
  return {
    id: `${m.providerID}/${m.modelID}`,
    name: m.name,
    tier,
    reason: `${m.tier} · $${m.inputPerM}/$${m.outputPerM} per 1M · ${Math.round(m.context / 1000)}K ctx`,
    costPerRequestUsd: Math.round(usd * 10000) / 10000,
    context: m.context,
    tokenUsage: m.tokenUsage,
    purpose: m.purpose,
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

  const quality = [...list].sort((a, b) => {
    const rank = qualityRank(b.tier, complexity) - qualityRank(a.tier, complexity);
    return rank !== 0 ? rank : candidateCost(a) - candidateCost(b);
  })[0];
  const budget = [...list].sort((a, b) => candidateCost(a) - candidateCost(b))[0];

  return {
    quality: suggestionFromCandidate(quality, "quality", tokens),
    budget: suggestionFromCandidate(budget, "budget", tokens),
  };
}
