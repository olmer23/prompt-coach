import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyze } from "../src/core/analyzer";
import { estimateTokens } from "../src/core/tokens";
import { detectComplexity } from "../src/core/scoring";
import { detectTask } from "../src/core/task";
import { improvePrompt, llmRewriteInstruction } from "../src/core/rewrite";
import { fromCatalog, fromModelInfos, pickFromCandidates, pickForTask, MODEL_CATALOG } from "../src/core/models";

const GOOD_RU =
  "Ты senior-разработчик. Исправь функцию handleSubmit в src/components/Login.tsx (React). Не меняй стили и публичный API. Критерий: npm test проходит, форма валидирует email.";

describe("analyzer", () => {
  it("rates weak prompt low", () => {
    const a = analyze("fix it");
    assert.ok(a.score < 50, `score=${a.score}`);
    assert.ok(a.missing.length > 0);
  });

  it("rates good prompt high", () => {
    const a = analyze(GOOD_RU, { lang: "ru" });
    assert.ok(a.score >= 75, `score=${a.score}`);
    assert.equal(a.complexity, "medium");
  });

  it("detects files and functions", () => {
    const a = analyze(GOOD_RU, { lang: "ru" });
    const ctx = a.categories.find((c) => c.key === "context")!;
    assert.ok(ctx.score >= 80, `context=${ctx.score}`);
  });

  it("flags multiple tasks", () => {
    const a = analyze("Добавь кнопку в src/App.tsx, а также исправь меню, и также обнови тесты", { lang: "ru" });
    const scope = a.categories.find((c) => c.key === "scope")!;
    assert.ok(scope.score < 80);
  });

  it("suggests budget model for simple tasks", () => {
    const a = analyze("Переименуй переменную x в y в src/a.ts, не меняй остальное, npm test должен проходить", { lang: "ru" });
    assert.equal(a.complexity, "low");
    assert.equal(a.alternativeModel.tier, "budget");
  });

  it("improved prompt contains sections", () => {
    const a = analyze("сделай кнопку", { lang: "ru" });
    assert.ok(a.improvedPrompt.includes("Задача"));
    assert.ok(a.improvedPrompt.includes("Контекст"));
    assert.ok(a.improvedPrompt.length > 50);
  });

  it("caches identical input", () => {
    const a1 = analyze(GOOD_RU, { lang: "ru" });
    const a2 = analyze(GOOD_RU, { lang: "ru" });
    assert.equal(a1.hash, a2.hash);
  });
});

describe("tokens", () => {
  it("estimates tokens", () => {
    assert.equal(estimateTokens(""), 0);
    assert.ok(estimateTokens("hello world") > 0);
  });
});

describe("complexity", () => {
  it("detects high", () => {
    assert.equal(detectComplexity("Спроектируй архитектуру системы", "ru"), "high");
  });
  it("detects low", () => {
    assert.equal(detectComplexity("Отформатируй файл", "ru"), "low");
  });
});

describe("task detection", () => {
  it("detects architecture", () => {
    assert.equal(detectTask("Спроектируй архитектуру сервиса и план миграции", "ru").kind, "arch");
  });
  it("detects coding", () => {
    assert.equal(detectTask("Напиши компонент формы входа в src/Login.tsx", "ru").kind, "code");
  });
  it("detects debugging", () => {
    assert.equal(detectTask("Исправь баг: приложение падает с ошибкой в консоли", "ru").kind, "debug");
  });
  it("detects UI work", () => {
    assert.equal(detectTask("Посмотри скриншот интерфейса из Figma и поправь вёрстку", "ru").kind, "ui");
  });
  it("detects quick edits", () => {
    assert.equal(detectTask("Переименуй переменную x в y", "ru").kind, "quick");
  });
  it("detects long output", () => {
    assert.equal(detectTask("Сгенерируй весь файл целиком, большой файл на 2000 строк", "ru").kind, "long");
  });
  it("falls back to general", () => {
    assert.equal(detectTask("привет", "ru").kind, "general");
  });
});

describe("task-based model choice", () => {
  const catalog = fromCatalog();

  it("picks the coding model for code", () => {
    const picked = pickForTask(catalog, "code", "medium", 1000);
    assert.equal(picked.primary.id, "opencode-go/kimi-k2.7-code");
    assert.equal(picked.alternative.id, "opencode-go/deepseek-v4.1-flash");
  });

  it("picks the cheap flash for debugging", () => {
    const picked = pickForTask(catalog, "debug", "high", 1000);
    assert.equal(picked.primary.id, "opencode-go/deepseek-v4.1-flash");
    assert.equal(picked.alternative.id, "opencode-go/deepseek-v4-pro");
  });

  it("picks the smart backup for architecture", () => {
    const picked = pickForTask(catalog, "arch", "high", 1000);
    assert.equal(picked.primary.id, "opencode-go/deepseek-v4.1-flash");
    assert.equal(picked.alternative.id, "opencode-go/glm-5.3");
  });

  it("picks the multimodal model for UI", () => {
    assert.equal(pickForTask(catalog, "ui", "medium", 1000).primary.id, "opencode-go/gemini-4-argon");
  });

  it("picks the cheapest flash for quick edits", () => {
    assert.equal(pickForTask(catalog, "quick", "low", 100).primary.id, "opencode-go/glm-5.3-flash");
  });

  it("picks the long-output model", () => {
    assert.equal(pickForTask(catalog, "long", "medium", 1000).primary.id, "opencode-go/minimax-m3.1-flash");
  });

  it("picks a free fallback when limits are gone", () => {
    assert.equal(pickForTask(catalog, "fallback", "medium", 100).primary.id, "openrouter/cohere/north-mini-code:free");
  });

  it("shows price per 1M and capability", () => {
    const s = pickForTask(catalog, "code", "medium", 1000).primary;
    assert.equal(s.inputPerM, 0.95);
    assert.equal(s.outputPerM, 4);
    assert.ok((s.intelligence ?? 0) > 80);
    assert.ok((s.efficiency ?? 0) > 0);
    assert.equal(s.monthlyLimit, 60);
  });
});

describe("rewrite", () => {
  it("keeps original text", () => {
    const a = analyze("fix login bug", { lang: "en" });
    const out = improvePrompt("fix login bug", a, "en");
    assert.ok(out.includes("fix login bug"));
    assert.ok(out.includes("Task"));
  });

  it("builds an LLM rewrite instruction", () => {
    const out = llmRewriteInstruction("исправь тест", "ru");
    assert.ok(out.includes("ПРОМПТ"));
    assert.ok(out.includes("исправь тест"));
  });
});

describe("real model catalog", () => {
  const infos = [
    { providerID: "opencode-go", modelID: "glm-5.3-flash", name: "GLM-5.3-Flash", enabled: true, status: "active", cost: [{ input: 0.15, output: 0.5 }], limit: { context: 1_000_000, output: 8_000 } },
    { providerID: "opencode-go", modelID: "deepseek-v4.1-flash", name: "DeepSeek V4.1 Flash", enabled: true, status: "active", cost: [{ input: 0.15, output: 0.6 }], limit: { context: 1_000_000, output: 384_000 } },
    { providerID: "opencode-go", modelID: "glm-5.3", name: "GLM-5.3", enabled: true, status: "active", cost: [{ input: 1.4, output: 4.4 }], limit: { context: 1_000_000 } },
    { providerID: "opencode-go", modelID: "kimi-k3.1-pro", name: "Kimi K3.1 Pro", enabled: true, status: "deprecated", cost: [{ input: 2, output: 10 }], limit: { context: 1_048_576 } },
    { providerID: "openai", modelID: "outside-list", name: "Outside", enabled: true, status: "active", cost: [{ input: 1, output: 1 }], limit: { context: 100_000 } },
  ];

  it("has a curated catalog without duplicates", () => {
    assert.equal(MODEL_CATALOG.length, 35);
    assert.equal(new Set(MODEL_CATALOG.map((m) => m.id)).size, 35);
    assert.equal(MODEL_CATALOG.filter((m) => m.category === "zen").length, 7);
    assert.equal(MODEL_CATALOG.filter((m) => m.category === "free").length, 5);
    assert.equal(MODEL_CATALOG.filter((m) => ["flash", "code", "smart", "multimodal", "fast"].includes(m.category ?? "")).length, 23);
  });

  it("normalizes and filters live models", () => {
    const list = fromModelInfos(infos);
    assert.equal(list.length, 3);
    assert.equal(list[0].name, "DeepSeek V4.1 Flash");
    assert.equal(list[1].name, "GLM-5.3");
    assert.equal(list[2].name, "GLM-5.3-Flash");
    assert.equal(list[2].context, 1_000_000);
    assert.equal(list[2].inputPerM, 0.15);
    assert.ok((list[2].intelligence ?? 0) > 0);
  });

  it("picks quality and budget from the live list", () => {
    const list = fromModelInfos(infos);
    const picked = pickFromCandidates(list, "medium", 100);
    assert.equal(picked.quality.tier, "quality");
    assert.equal(picked.budget.tier, "budget");
    assert.notEqual(picked.quality.id, picked.budget.id);
    assert.ok(picked.quality.id.startsWith("opencode-go/"));
  });

  it("analyze exposes availableModels without breaking fields", () => {
    const list = fromModelInfos(infos);
    const a = analyze("fix the bug in src/a.ts and run npm test", { lang: "en" }, undefined, list);
    assert.equal(a.availableModels?.length, 3);
    assert.ok(a.recommendedModel.name);
    assert.ok(a.alternativeModel.name);
    assert.equal(a.task.kind, "debug");
  });

  it("falls back to the static catalog when the list is empty", () => {
    const a = analyze("fix src/a.ts", { lang: "en" }, undefined, []);
    assert.equal(a.availableModels?.length, 35);
  });
});
