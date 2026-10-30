import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyze } from "../src/core/analyzer";
import { estimateTokens } from "../src/core/tokens";
import { detectComplexity } from "../src/core/scoring";
import { improvePrompt, llmRewriteInstruction } from "../src/core/rewrite";
import { fromModelInfos, pickFromCandidates, MODEL_CATALOG } from "../src/core/models";

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
    { providerID: "opencode-go", modelID: "kimi-k3", name: "Kimi K3", enabled: true, status: "active", cost: [{ input: 3, output: 15 }], limit: { context: 262_000, output: 16_000 } },
    { providerID: "opencode-go", modelID: "glm-5.3", name: "GLM-5.3", enabled: false, status: "active", cost: [{ input: 1.4, output: 4.4 }], limit: { context: 1_000_000 } },
    { providerID: "opencode-go", modelID: "kimi-k3.1-pro", name: "Kimi K3.1 Pro", enabled: true, status: "deprecated", cost: [{ input: 2, output: 10 }], limit: { context: 262_000 } },
    { providerID: "openai", modelID: "outside-list", name: "Outside", enabled: true, status: "active", cost: [{ input: 1, output: 1 }], limit: { context: 100_000 } },
  ];

  it("has exactly 36 curated models without duplicates", () => {
    assert.equal(MODEL_CATALOG.length, 36);
    assert.equal(new Set(MODEL_CATALOG.map((m) => m.id)).size, 36);
    assert.equal(MODEL_CATALOG.filter((m) => m.category === "zen").length, 3);
    assert.equal(MODEL_CATALOG.filter((m) => ["flash", "code", "smart", "multimodal", "fast"].includes(m.category ?? "")).length, 18);
    assert.equal(MODEL_CATALOG.filter((m) => m.category === "free").length, 15);
  });

  it("normalizes and filters live models", () => {
    const list = fromModelInfos(infos);
    assert.equal(list.length, 2);
    assert.equal(list[0].name, "GLM-5.3-Flash");
    assert.equal(list[0].context, 1_000_000);
    assert.equal(list[0].inputPerM, 0.15);
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
    const a = analyze("fix src/a.ts and run npm test", { lang: "en" }, undefined, list);
    assert.equal(a.availableModels?.length, 2);
    assert.ok(a.recommendedModel.name);
    assert.ok(a.alternativeModel.name);
  });

  it("falls back to the static catalog when the list is empty", () => {
    const a = analyze("fix src/a.ts", { lang: "en" }, undefined, []);
    assert.equal(a.availableModels?.length, 36);
  });
});
