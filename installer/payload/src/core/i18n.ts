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
};

export function t(key: string, lang: Lang): string {
  return STRINGS[key]?.[lang] ?? key;
}

export function mapAll(keys: string[] | undefined, lang: Lang): string[] {
  return (keys ?? []).map((k) => t(k, lang));
}
