/** Prompt Coach — shared types */

export type Complexity = "low" | "medium" | "high";

/** Task type detected from the prompt text. Drives the model recommendation. */
export type TaskKind =
  | "arch"
  | "code"
  | "debug"
  | "ui"
  | "quick"
  | "long"
  | "fallback"
  | "general";

export interface TaskInfo {
  kind: TaskKind;
  /** 0..1, how sure the detector is */
  confidence: number;
  /** localized label, e.g. "Написание кода" */
  label: string;
  /** short localized label for pills, e.g. "Код" */
  short: string;
  /** localized one-line advice on how to spend the model's limits */
  advice: string;
}

export type CategoryKey =
  | "clarity"
  | "context"
  | "success"
  | "constraints"
  | "scope"
  | "tokens";

export interface CategoryScore {
  key: CategoryKey;
  score: number; // 0..100
  weight: number; // 0..1
  missing: string[];
  tips: string[];
}

export interface ModelSuggestion {
  id: string;
  name: string;
  reason: string;
  costPerRequestUsd: number;
  tier: "quality" | "budget";
  context?: number;
  tokenUsage?: string;
  purpose?: string;
  /** USD per 1M input tokens */
  inputPerM?: number;
  /** USD per 1M output tokens */
  outputPerM?: number;
  /** 0..100 estimate of general capability (curated, not a benchmark) */
  intelligence?: number;
  /** 0..100 relative value: capability per dollar */
  efficiency?: number;
  /** Go monthly allowance in USD; Infinity for free/unlimited models */
  monthlyLimit?: number;
  /** why this model fits the detected task */
  fit?: string;
}

/** A model that is actually available in the current OpenCode catalog. */
export interface ModelCandidate {
  providerID: string;
  modelID: string;
  name: string;
  inputPerM: number;
  outputPerM: number;
  context: number;
  maxOutput?: number;
  tier: "frontier" | "balanced" | "budget";
  category?: "zen" | "flash" | "code" | "smart" | "multimodal" | "fast" | "free";
  tokenUsage?: string;
  purpose?: string;
  /** 0..100 estimate of general capability (curated, not a benchmark) */
  intelligence: number;
  /** 0..100 relative value: capability per dollar */
  efficiency?: number;
  /** task types this model is good at */
  tasks?: TaskKind[];
  /** Go monthly allowance in USD; Infinity for free/unlimited models */
  monthlyLimit?: number;
}

export interface Analysis {
  /** 0..100 overall quality */
  score: number;
  /** estimated token count */
  tokens: number;
  /** estimated USD for recommended model */
  estimatedCostUsd: number;
  complexity: Complexity;
  /** task type detected from the prompt */
  task: TaskInfo;
  categories: CategoryScore[];
  missing: string[];
  suggestions: string[];
  tokenTips: string[];
  recommendedModel: ModelSuggestion;
  alternativeModel: ModelSuggestion;
  /** Models available in the current catalog; falls back to the static catalog. */
  availableModels?: ModelCandidate[];
  /** template-based improved prompt (no LLM) */
  improvedPrompt: string;
  /** short one-line summary for live overlay */
  oneLine: string;
  /** hash of input (for cache) */
  hash: string;
}

export interface Rule {
  id: string;
  category: CategoryKey;
  /** returns 0..1 (1 = perfect) */
  run(text: string, ctx: RuleContext): RuleResult;
}

export interface RuleContext {
  words: string[];
  lower: string;
  lang: "ru" | "en";
  tokens: number;
}

export interface RuleResult {
  score: number; // 0..1
  missing?: string[];
  tips?: string[];
}

export interface CoachConfig {
  lang: "ru" | "en";
  live: boolean;
  blockOnLowScore: boolean;
  threshold: number; // 0..100, warn below
  debounceMs: number;
  weights: Record<CategoryKey, number>;
  modelOverrides?: Record<Complexity, string>;
}

export const DEFAULT_CONFIG: CoachConfig = {
  lang: "ru",
  live: true,
  blockOnLowScore: false,
  threshold: 50,
  debounceMs: 200,
  weights: {
    clarity: 0.2,
    context: 0.25,
    success: 0.2,
    constraints: 0.1,
    scope: 0.1,
    tokens: 0.15,
  },
};

export const CATEGORY_LABELS: Record<"ru" | "en", Record<CategoryKey, string>> = {
  ru: {
    clarity: "Ясность",
    context: "Контекст",
    success: "Критерий успеха",
    constraints: "Ограничения",
    scope: "Объём задачи",
    tokens: "Экономия токенов",
  },
  en: {
    clarity: "Clarity",
    context: "Context",
    success: "Success criteria",
    constraints: "Constraints",
    scope: "Scope",
    tokens: "Token efficiency",
  },
};

export const CATEGORY_ORDER: CategoryKey[] = [
  "clarity",
  "context",
  "success",
  "constraints",
  "scope",
  "tokens",
];
