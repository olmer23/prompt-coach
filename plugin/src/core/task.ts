import { t } from "./i18n";
import type { Lang } from "./i18n";
import type { TaskInfo, TaskKind } from "./types";

interface Signal {
  re: RegExp;
  weight: number;
}

/**
 * Weighted keyword signals. A task wins by total weight; ties are broken by
 * TASK_PRIORITY (most specific first). Kept dependency-free so it runs in the
 * plugin, the trainer and tests.
 */
const SIGNALS: Record<Exclude<TaskKind, "general">, Signal[]> = {
  arch: [
    { re: /архитектур/i, weight: 5 },
    { re: /спроектир/i, weight: 5 },
    { re: /system\s*design/i, weight: 5 },
    { re: /структур[а-я]*\s+проект/i, weight: 4 },
    { re: /с\s+чего\s+начать/i, weight: 3 },
    { re: /планир/i, weight: 3 },
    { re: /миграц/i, weight: 3 },
    { re: /migration/i, weight: 3 },
    { re: /рефактор/i, weight: 2 },
    { re: /refactor/i, weight: 2 },
    { re: /план/i, weight: 2 },
    { re: /\bplan\b/i, weight: 2 },
  ],
  code: [
    { re: /реализуй/i, weight: 4 },
    { re: /напиши/i, weight: 3 },
    { re: /создай/i, weight: 3 },
    { re: /\bimplement\b/i, weight: 3 },
    { re: /\bwrite\b/i, weight: 2 },
    { re: /добав(ь|ить)/i, weight: 2 },
    { re: /функци/i, weight: 2 },
    { re: /компонент/i, weight: 2 },
    { re: /\bcomponent\b/i, weight: 2 },
    { re: /код/i, weight: 2 },
    { re: /\.(tsx?|jsx?|py|go|rs|java|css|html)\b/i, weight: 2 },
    { re: /тест/i, weight: 2 },
    { re: /\btest/i, weight: 2 },
  ],
  debug: [
    { re: /баг/i, weight: 4 },
    { re: /\bbug/i, weight: 4 },
    { re: /не\s+работает/i, weight: 4 },
    { re: /падает/i, weight: 4 },
    { re: /crash/i, weight: 4 },
    { re: /отлад/i, weight: 4 },
    { re: /\bdebug/i, weight: 4 },
    { re: /stack\s*trace/i, weight: 4 },
    { re: /ошибк/i, weight: 3 },
    { re: /\berror\b/i, weight: 3 },
    { re: /exception/i, weight: 3 },
    { re: /исключени/i, weight: 3 },
    { re: /ломает/i, weight: 3 },
    { re: /broken/i, weight: 3 },
    { re: /исправ/i, weight: 2 },
    { re: /поправ/i, weight: 2 },
    { re: /\bfix\b/i, weight: 1 },
  ],
  ui: [
    { re: /скриншот/i, weight: 5 },
    { re: /screenshot/i, weight: 5 },
    { re: /figma/i, weight: 4 },
    { re: /макет/i, weight: 4 },
    { re: /изображени/i, weight: 3 },
    { re: /картинк/i, weight: 3 },
    { re: /фото/i, weight: 3 },
    { re: /видео/i, weight: 3 },
    { re: /\bpdf\b/i, weight: 3 },
    { re: /\bimage\b/i, weight: 3 },
    { re: /\bvision\b/i, weight: 3 },
    { re: /интерфейс/i, weight: 2 },
    { re: /\bui\b/i, weight: 2 },
    { re: /\bux\b/i, weight: 2 },
    { re: /дизайн/i, weight: 2 },
    { re: /вёрстк/i, weight: 2 },
    { re: /верстк/i, weight: 2 },
    { re: /кнопк/i, weight: 1 },
  ],
  quick: [
    { re: /переимен/i, weight: 5 },
    { re: /\brename\b/i, weight: 5 },
    { re: /форматир/i, weight: 5 },
    { re: /\bformat\b/i, weight: 4 },
    { re: /опечатк/i, weight: 5 },
    { re: /\btypo\b/i, weight: 5 },
    { re: /одн[уо][йю]\s+строк/i, weight: 4 },
    { re: /\blint\b/i, weight: 4 },
    { re: /\bquick\b/i, weight: 4 },
    { re: /мелк/i, weight: 3 },
    { re: /документац/i, weight: 3 },
    { re: /комментар/i, weight: 3 },
  ],
  long: [
    { re: /больш(ой|ого|ому)\s+файл/i, weight: 5 },
    { re: /весь\s+файл/i, weight: 5 },
    { re: /полный\s+файл/i, weight: 5 },
    { re: /large\s+file/i, weight: 5 },
    { re: /whole\s+file/i, weight: 5 },
    { re: /full\s+file/i, weight: 5 },
    { re: /сгенерир[а-я]*\s+файл/i, weight: 4 },
    { re: /512\s*k/i, weight: 4 },
    { re: /много\s+кода/i, weight: 3 },
    { re: /long\s+output/i, weight: 4 },
    { re: /целиком/i, weight: 2 },
  ],
  fallback: [
    { re: /лимит[а-я]*\s+(конч|исчерп)/i, weight: 5 },
    { re: /out\s+of\s+quota/i, weight: 5 },
    { re: /резерв/i, weight: 4 },
    { re: /\bfallback\b/i, weight: 4 },
    { re: /исчерп/i, weight: 4 },
    { re: /\bvpn\b/i, weight: 3 },
  ],
};

/** Most specific task first; used to break weight ties. */
export const TASK_PRIORITY: TaskKind[] = [
  "ui",
  "debug",
  "arch",
  "long",
  "quick",
  "code",
  "fallback",
  "general",
];

/** Long prompts usually ask for large output. */
const LONG_TOKENS = 120_000;

export function detectTask(text: string, lang: Lang, tokens = 0): TaskInfo {
  const scores = new Map<TaskKind, number>();

  for (const [kind, signals] of Object.entries(SIGNALS) as [Exclude<TaskKind, "general">, Signal[]][]) {
    let score = 0;
    for (const { re, weight } of signals) if (re.test(text)) score += weight;
    if (score > 0) scores.set(kind, score);
  }

  if (tokens >= LONG_TOKENS) scores.set("long", (scores.get("long") ?? 0) + 4);

  let best: TaskKind = "general";
  let bestScore = 0;
  for (const kind of TASK_PRIORITY) {
    const score = scores.get(kind) ?? 0;
    if (score > bestScore) {
      best = kind;
      bestScore = score;
    }
  }

  const total = [...scores.values()].reduce((a, b) => a + b, 0);
  // No signal: keep the confidence in the header honest but non-zero.
  const confidence =
    best === "general"
      ? Math.min(0.45, 0.25 + Math.min(text.length, 800) / 4000)
      : bestScore / Math.max(total, bestScore);

  return {
    kind: best,
    confidence: Math.round(confidence * 100) / 100,
    label: t(`task.${best}`, lang),
    short: t(`task.short.${best}`, lang),
    advice: t(`advice.${best}`, lang),
  };
}
