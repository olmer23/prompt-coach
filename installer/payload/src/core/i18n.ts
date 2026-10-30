export type Lang = "ru" | "en";

type Dict = Record<string, { ru: string; en: string }>;

export const STRINGS: Dict = {
  too_short: { ru: "Слишком коротко — добавьте детали", en: "Too short — add details" },
  no_action_verb: { ru: "Нет глагола действия (добавь/исправь/создай)", en: "No action verb (add/fix/create)" },
  no_file: { ru: "Укажите конкретный файл (src/...)", en: "Specify a concrete file (src/...)" },
  no_function: { ru: "Укажите функцию/компонент", en: "Specify function/component" },
  no_success_criteria: { ru: "Добавьте критерий успеха (тест/ожидаемый результат)", en: "Add success criteria (test/expected result)" },
  no_constraints: { ru: "Укажите, что нельзя менять", en: "Specify what must not change" },
  multiple_tasks: { ru: "Несколько задач в одном промпте — разбейте", en: "Multiple tasks in one prompt — split them" },
  huge_scope: { ru: "Слишком широкий контекст (весь репозиторий)", en: "Too broad context (whole repo)" },

  short: { ru: "Добавьте: файл, функцию, ожидаемое поведение", en: "Add: file, function, expected behavior" },
  verb: { ru: "Начните с глагола: «Добавь…», «Исправь…»", en: "Start with a verb: 'Add…', 'Fix…'" },
  vague: { ru: "Уберите расплывчатые слова, дайте конкретику", en: "Remove vague words, be specific" },
  file: { ru: "Пример: src/components/Button.tsx", en: "Example: src/components/Button.tsx" },
  function: { ru: "Пример: функция handleSubmit", en: "Example: function handleSubmit" },
  stack: { ru: "Укажите стек (React, Node…)", en: "Mention stack (React, Node…)" },
  success: { ru: "Добавьте: «Тест npm test должен проходить»", en: "Add: 'npm test must pass'" },
  testcmd: { ru: "Команда теста — отличный критерий", en: "Test command is a great criterion" },
  constraints: { ru: "Добавьте: «Не меняй стили/публичный API»", en: "Add: 'Do not change styles/public API'" },
  split: { ru: "Один промпт = одна задача (экономит токены)", en: "One prompt = one task (saves tokens)" },
  narrow: { ru: "Сузьте контекст до нужных файлов", en: "Narrow context to needed files" },
  long: { ru: "Сократите текст — каждый токен стоит денег", en: "Trim text — every token costs" },
  repeat: { ru: "Уберите повторы", en: "Remove repetitions" },
  codeblock: { ru: "Вставляйте только нужные фрагменты кода", en: "Paste only needed code fragments" },

  "task.arch": { ru: "Архитектура / планирование", en: "Architecture / planning" },
  "task.code": { ru: "Написание кода", en: "Coding" },
  "task.debug": { ru: "Отладка / баги", en: "Debugging" },
  "task.ui": { ru: "UI / скриншоты", en: "UI / screenshots" },
  "task.quick": { ru: "Быстрая правка", en: "Quick edit" },
  "task.long": { ru: "Большой файл / вывод", en: "Large file / output" },
  "task.fallback": { ru: "Резерв при лимитах", en: "Fallback on limits" },
  "task.general": { ru: "Общая задача", en: "General task" },

  "task.short.arch": { ru: "План", en: "Plan" },
  "task.short.code": { ru: "Код", en: "Code" },
  "task.short.debug": { ru: "Отладка", en: "Debug" },
  "task.short.ui": { ru: "UI", en: "UI" },
  "task.short.quick": { ru: "Правка", en: "Quick" },
  "task.short.long": { ru: "Объём", en: "Long" },
  "task.short.fallback": { ru: "Резерв", en: "Fallback" },
  "task.short.general": { ru: "Задача", en: "Task" },

  "advice.arch": {
    ru: "Планирование — 1–2 длинных запроса. Не гоняйте флагман в цикле.",
    en: "Planning is 1–2 long requests. Do not loop a flagship model.",
  },
  "advice.code": {
    ru: "Пишите модулями, не весь проект за один запрос.",
    en: "Write in modules, not the whole project in one request.",
  },
  "advice.debug": {
    ru: "Сначала дешёвый flash на рутину; флагман — только когда зашли в тупик.",
    en: "Start with a cheap flash; use a flagship only when stuck.",
  },
  "advice.ui": {
    ru: "Режьте скриншоты и уменьшайте изображения — они жгут токены.",
    en: "Crop screenshots and shrink images — they burn tokens.",
  },
  "advice.quick": {
    ru: "Не тратьте флагманы на мелочь — хватит flash-модели.",
    en: "Do not spend flagships on small edits — a flash model is enough.",
  },
  "advice.long": {
    ru: "Генерируйте частями: 512k выхода за раз дорого и рискованно.",
    en: "Generate in chunks: 512k of output in one go is expensive and risky.",
  },
  "advice.fallback": {
    ru: "Резерв: бесплатный код-роутер OpenRouter. Часто нужен VPN, 50 запросов/сутки.",
    en: "Fallback: free OpenRouter code router. VPN is often needed, 50 requests/day.",
  },
  "advice.general": {
    ru: "Один запрос = один шаг. Разбивайте работу на модули.",
    en: "One request = one step. Split work into modules.",
  },
};

export function t(key: string, lang: Lang): string {
  return STRINGS[key]?.[lang] ?? key;
}

export function mapAll(keys: string[] | undefined, lang: Lang): string[] {
  return (keys ?? []).map((k) => t(k, lang));
}
