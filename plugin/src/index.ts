import { Plugin } from "@opencode/plugin";
import { analyze } from "./core/analyzer";
import { fromModelInfos } from "./core/models";
import { improvePrompt } from "./core/rewrite";
import type { CoachConfig } from "./core/types";
import { DEFAULT_CONFIG } from "./core/types";
import type { Analysis } from "./core/types";

const HELP_TEXT = [
  "**Prompt Coach**",
  "`/coach <text>` — analyze a prompt",
  "`/coach improve <text>` — rewrite and send an improved prompt",
  "`/coach tutorial` — 5-step tutorial",
  "`/coach help` — this help",
  "",
  "In Desktop, the live score pill above the composer updates as you type.",
].join("\n");

const TUTORIAL_TEXT = [
  "**Prompt Coach — 5 steps**",
  "1/5. Score 0–100: green ≥80, yellow 50–79, red <50.",
  "2/5. Formula: Role + Task + Context + Constraints + Success criteria.",
  "3/5. Try `/coach сделай форму входа` — see what is missing.",
  "4/5. Apply the fix: `/coach improve сделай форму входа`.",
  "5/5. Save tokens: one task per prompt, narrow context, cheap model for routine.",
].join("\n");

function formatReport(a: Analysis): string {
  const cats = a.categories.map((c) => `- ${c.key}: ${c.score}/100`).join("\n");
  const missing = a.missing.length ? a.missing.map((m) => `- ${m}`).join("\n") : "- none";
  const tips = a.suggestions.length ? a.suggestions.slice(0, 4).map((m) => `- ${m}`).join("\n") : "- none";
  return [
    `**Prompt Coach — ${a.score}/100** (${a.complexity}, ~${a.tokens} tok)`,
    "",
    "**Categories**",
    cats,
    "",
    "**Missing**",
    missing,
    "",
    "**Tips**",
    tips,
    "",
    `**Models:** ${a.recommendedModel.name} (quality) / ${a.alternativeModel.name} (budget)`,
    "",
    "**Improved prompt**",
    "```",
    a.improvedPrompt,
    "```",
    "",
    "Apply: `/coach improve <your text>`",
  ].join("\n");
}

const ANALYZE_SCHEMA = {
  type: "object",
  properties: {
    text: { type: "string", description: "Prompt text to analyze" },
    deep: { type: "boolean", description: "Use LLM for rewrite (costs tokens)" },
  },
  required: ["text"],
  additionalProperties: false,
} as const;

export default Plugin.define({
  id: "prompt-coach",
  async setup(ctx) {
    const options = (ctx.options ?? {}) as Partial<CoachConfig>;
    const cfg: CoachConfig = { ...DEFAULT_CONFIG, ...options, weights: { ...DEFAULT_CONFIG.weights, ...(options.weights ?? {}) } };

    // Tools available to the agent
    await ctx.tool.transform((editor) => {
      editor.namespace({ name: "coach", description: "Prompt quality tools" });
      editor.add({
        name: "analyze",
        description: "Analyze a prompt: score, missing parts, model suggestion, token tips",
        input: ANALYZE_SCHEMA,
        options: { namespace: "coach" },
        execute: async (input) => {
          const { text } = input as { text: string };
          const infos = (await ctx.model.list()).data;
          const candidates = fromModelInfos(infos as unknown[]);
          const result = analyze(text, cfg, undefined, candidates);
          return { content: JSON.stringify(result, null, 2) };
        },
      });
      editor.add({
        name: "score",
        description: "Quick 0-100 prompt score with one-line summary",
        input: ANALYZE_SCHEMA,
        options: { namespace: "coach" },
        execute: async (input) => {
          const { text } = input as { text: string };
          const result = analyze(text, cfg);
          return { content: `${result.score}/100 — ${result.oneLine}` };
        },
      });
      editor.add({
        name: "rewrite",
        description: "Return an improved prompt. Set deep=true for LLM rewrite.",
        input: ANALYZE_SCHEMA,
        options: { namespace: "coach" },
        execute: async (input) => {
          const { text, deep } = input as { text: string; deep?: boolean };
          const analysis = analyze(text, cfg);
          if (deep) {
            try {
              const def = await ctx.model.default();
              const model = def.data;
              if (model) {
                const out = await ctx.experimental.generate.text({
                  model: { providerID: model.providerID, id: model.id },
                  prompt:
                    "Rewrite the user's prompt to be clear, complete and token-efficient. " +
                    "Keep their intent and language. Add sections: Context, Constraints, Success criteria. Return only the improved prompt.\n\nPROMPT:\n" +
                    text,
                });
                return { content: out.text ?? improvePrompt(text, analysis, cfg.lang) };
              }
            } catch {
              // fall back to template
            }
          }
          return { content: improvePrompt(text, analysis, cfg.lang) };
        },
      });
    });

    // Analyze every admitted prompt; store last result for TUI.
    await ctx.session.hook("prompt", async (event) => {
      const text = event.prompt.text ?? "";
      if (!text.trim()) return;
      const result = analyze(text, cfg);
      await ctx.storage.set("lastAnalysis", JSON.parse(JSON.stringify(result)));
      event.metadata = { ...event.metadata, coachScore: result.score, coachOneLine: result.oneLine };
    });

    // Slash command available in every client (Desktop, TUI, web).
    await ctx.command.transform((editor) => {
      editor.add({
        name: "coach",
        description: "Analyze a prompt, suggest a model, save tokens. /coach improve <text> to rewrite.",
        execute: async ({ sessionID, prompt, delivery }) => {
          const arg = (prompt.text ?? "").trim();
          if (!arg || arg === "help") {
            await ctx.session.synthetic({ sessionID, text: HELP_TEXT });
            return;
          }
          if (arg === "tutorial") {
            await ctx.session.synthetic({ sessionID, text: TUTORIAL_TEXT });
            return;
          }
          const isImprove = /^improve\s+/i.test(arg);
          const text = isImprove ? arg.replace(/^improve\s+/i, "") : arg;
          const result = analyze(text, cfg);
          if (isImprove) {
            await ctx.session.prompt({ sessionID, text: result.improvedPrompt, delivery });
            return;
          }
          await ctx.session.synthetic({ sessionID, text: formatReport(result) });
        },
      });
    });
  },
});
