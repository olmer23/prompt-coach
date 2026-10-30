import type { Analysis, CategoryKey } from "./types";

/** Template-based prompt improvement (no LLM, zero tokens) */
export function improvePrompt(text: string, analysis: Analysis, lang: "ru" | "en"): string {
  const missing = new Set(analysis.categories.flatMap((c) => (c.score < 60 ? [c.key] : [])));
  const lines: string[] = [];
  const trimmed = text.trim();

  if (lang === "ru") {
    lines.push("Ты — senior-разработчик. Действуй аккуратно и по делу.");
    lines.push("");
    lines.push("## Задача");
    lines.push(trimmed);
    lines.push("");
    if (missing.has("context")) {
      lines.push("## Контекст");
      lines.push("- Файл: <укажи путь, напр. src/components/Button.tsx>");
      lines.push("- Функция/компонент: <имя>");
      lines.push("- Стек: <React/Node/...>");
      lines.push("");
    }
    if (missing.has("constraints")) {
      lines.push("## Ограничения");
      lines.push("- Не меняй: <стили/публичный API/другие файлы>");
      lines.push("");
    }
    if (missing.has("success")) {
      lines.push("## Критерий успеха");
      lines.push("- <например: npm test проходит; поведение X>");
      lines.push("");
    }
    if (missing.has("scope")) {
      lines.push("## Объём");
      lines.push("- Только эта задача, остальное — отдельными промптами.");
      lines.push("");
    }
    lines.push("## Формат ответа");
    lines.push("- Краткий план (1–3 пункта), затем код. Без лишних пояснений.");
  } else {
    lines.push("You are a senior developer. Be precise and concise.");
    lines.push("");
    lines.push("## Task");
    lines.push(trimmed);
    lines.push("");
    if (missing.has("context")) {
      lines.push("## Context");
      lines.push("- File: <path, e.g. src/components/Button.tsx>");
      lines.push("- Function/component: <name>");
      lines.push("- Stack: <React/Node/...>");
      lines.push("");
    }
    if (missing.has("constraints")) {
      lines.push("## Constraints");
      lines.push("- Do not change: <styles/public API/other files>");
      lines.push("");
    }
    if (missing.has("success")) {
      lines.push("## Success criteria");
      lines.push("- <e.g. npm test passes; behavior X>");
      lines.push("");
    }
    if (missing.has("scope")) {
      lines.push("## Scope");
      lines.push("- Only this task; everything else in separate prompts.");
      lines.push("");
    }
    lines.push("## Response format");
    lines.push("- Short plan (1–3 bullets), then code. No fluff.");
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

/** Instruction for one-click LLM rewrite (used by the Desktop panel). */
export function llmRewriteInstruction(text: string, lang: "ru" | "en"): string {
  if (lang === "ru") {
    return [
      "Ты senior-разработчик. Перепиши промпт пользователя так, чтобы он был максимально понятным,",
      "полным и экономным по токенам. Сохрани исходный смысл и язык.",
      "Добавь секции: Контекст, Ограничения, Критерий успеха. Убери воду и повторы.",
      "Верни ТОЛЬКО улучшенный промпт, без пояснений и без markdown-обёртки.",
      "",
      "ПРОМПТ:",
      text,
    ].join("\n");
  }
  return [
    "You are a senior developer. Rewrite the user's prompt to be clear, complete and token-efficient.",
    "Keep the original intent and language. Add sections: Context, Constraints, Success criteria.",
    "Remove fluff and repetition. Return ONLY the improved prompt, no explanations, no markdown fence.",
    "",
    "PROMPT:",
    text,
  ].join("\n");
}

/** Generic token-saving tips based on analysis */
export function tokenTips(analysis: Analysis, lang: "ru" | "en"): string[] {
  const tips: string[] = [];
  const push = (ru: string, en: string) => tips.push(lang === "ru" ? ru : en);
  if (analysis.tokens > 1500) push("Сократите контекст: оставьте только нужные файлы/функции", "Trim context: keep only needed files/functions");
  if (analysis.complexity === "low") push("Простая задача — используйте дешёвую модель", "Simple task — use a cheap model");
  push("Один промпт = одна задача", "One prompt = one task");
  push("Держите системный промпт коротким (кэшируется префикс)", "Keep system prompt short (prefix caching)");
  push("Откат (/undo) вместо повторной генерации", "Use /undo instead of regenerating");
  return tips;
}
