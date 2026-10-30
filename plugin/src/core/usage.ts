/** Usage & limits — pure helpers (no OpenCode imports). */

export interface UsageMeter {
  percent: number;
  limited: boolean;
  resetsAt: number;
}

export interface UsageBudgetModel {
  providerID: string;
  modelID: string;
  name: string;
  spent?: number;
}

export interface UsageBudget {
  id: string;
  limit: number;
  spent: number;
  scope: "each" | "combined";
  per: "set" | "model";
  coverage: "all" | "models";
  models: UsageBudgetModel[];
  vendors: string[];
  picked: boolean;
  shared: boolean;
  resetsAt: number;
}

export interface UsageLimits {
  workspace: { id: string; name?: string; usageURL: string };
  go?: { rolling: UsageMeter; weekly: UsageMeter; monthly: UsageMeter };
  budgets: UsageBudget[];
}

export type GoPlan = "go" | "plus";

/** Monthly allowance (USD) per model from the official Go pricing tables. */
export const GO_MONTHLY: Record<string, { go: number; plus: number }> = {
  "glm-5.3-flash": { go: 60, plus: 180 },
  "glm-5.3": { go: 15, plus: 120 },
  "glm-5.2": { go: 60, plus: 180 },
  "kimi-k3.1-pro": { go: 15, plus: 60 },
  "kimi-k3": { go: 15, plus: 60 },
  "kimi-k2.7-code": { go: 60, plus: 180 },
  "longcat-2.0": { go: 60, plus: 240 },
  "step-5-preview": { go: 15, plus: 60 },
  "mimo-v2.6-flash": { go: 60, plus: 120 },
  "mimo-v2.6-pro": { go: 15, plus: 60 },
  "mimo-v2.5": { go: 60, plus: 120 },
  "mimo-v2.5-pro": { go: 15, plus: 60 },
  "minimax-m3.1-flash": { go: 20, plus: 80 },
  "minimax-m3": { go: 60, plus: 180 },
  "muse-spark-1.3-contributor": { go: 60, plus: 120 },
  "muse-spark-1.2-contributor": { go: 60, plus: 120 },
  "qwen3.8-max": { go: 15, plus: 60 },
  "qwen3.8-flash": { go: 30, plus: 90 },
  "qwen3.7-plus": { go: 60, plus: 180 },
  "deepseek-v4.1-flash": { go: 80, plus: 160 },
  "deepseek-v4-pro": { go: 15, plus: 60 },
  "hy4-preview": { go: 30, plus: 120 },
  "hy3": { go: 60, plus: 240 },
  "grok-4.7": { go: 15, plus: 60 },
  "gpt-6-luna": { go: 15, plus: 60 },
  "gpt-5.6-luna": { go: 15, plus: 60 },
  "claude-haiku-5-5": { go: 15, plus: 60 },
  "gemini-4-argon": { go: 30, plus: 120 },
  "beam-free": { go: Infinity, plus: Infinity },
  "iceman-contributor-free": { go: Infinity, plus: Infinity },
};

export function goLimitFor(modelID: string, plan: GoPlan): number | undefined {
  const key = modelID.toLowerCase();
  const entry = GO_MONTHLY[key] ?? Object.entries(GO_MONTHLY).find(([k]) => key.endsWith(k))?.[1];
  if (!entry) return undefined;
  return plan === "plus" ? entry.plus : entry.go;
}

export function percentTone(percent: number): "success" | "warning" | "danger" {
  if (percent >= 90) return "danger";
  if (percent >= 70) return "warning";
  return "success";
}

export function meterColor(percent: number): string {
  if (percent >= 90) return "#ff3b30";
  if (percent >= 70) return "#ff9f0a";
  return "#34c759";
}

export function formatPercent(percent: number): string {
  return `${Math.min(100, Math.max(0, Math.round(percent)))}%`;
}

export function formatReset(ms: number, lang: "ru" | "en" = "ru"): string {
  if (!ms || !Number.isFinite(ms)) return lang === "ru" ? "—" : "—";
  const diff = ms - Date.now();
  if (diff <= 0) return lang === "ru" ? "сейчас" : "now";
  const mins = Math.ceil(diff / 60000);
  const h = Math.floor(mins / 60);
  const d = Math.floor(h / 24);
  if (lang === "en") {
    if (d > 0) return `in ${d}d ${h % 24}h`;
    if (h > 0) return `in ${h}h ${mins % 60}m`;
    return `in ${mins}m`;
  }
  if (d > 0) return `через ${d}д ${h % 24}ч`;
  if (h > 0) return `через ${h}ч ${mins % 60}м`;
  return `через ${mins}м`;
}

export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "∞";
  if (n === 0) return "$0";
  if (n < 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(0)}`;
}

/** One-line summary for pills/bars. */
export function usageSummary(u: UsageLimits | null, lang: "ru" | "en" = "ru"): string {
  if (!u?.go) return lang === "ru" ? "Go: нет данных" : "Go: no data";
  const r = Math.round(u.go.rolling.percent);
  const w = Math.round(u.go.weekly.percent);
  const m = Math.round(u.go.monthly.percent);
  return `Go ${r}% 5h · ${w}% week · ${m}% month`;
}
