import { Plugin, usePlugin } from "@opencode/plugin/tui";
import { createSignal, createMemo, Show, onCleanup } from "solid-js";
import { analyze } from "./core/analyzer";
import { fromModelInfos } from "./core/models";
import type { Analysis, CoachConfig, ModelCandidate } from "./core/types";
import { DEFAULT_CONFIG } from "./core/types";
import { llmRewriteInstruction } from "./core/rewrite";
import { formatPercent, formatReset, formatUsd, usageSummary, type UsageLimits } from "./core/usage";

type Ctx = ReturnType<typeof usePlugin>;

function cfgOf(ctx: Ctx): CoachConfig {
  const o = (ctx.options ?? {}) as Partial<CoachConfig>;
  return { ...DEFAULT_CONFIG, ...o, weights: { ...DEFAULT_CONFIG.weights, ...(o.weights ?? {}) } };
}

function fmtCtx(n: number): string {
  if (!n || !Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  return `${Math.round(n / 1000)}K`;
}

/** Defensive text extraction from a session message (shape may vary). */
function extractText(m: unknown): string {
  if (!m || typeof m !== "object") return "";
  const anyM = m as Record<string, unknown>;
  if (typeof anyM.text === "string") return anyM.text;
  const info = anyM.info as Record<string, unknown> | undefined;
  if (info && typeof info.text === "string") return info.text;
  const parts = (anyM.parts ?? info?.parts) as unknown;
  if (Array.isArray(parts)) {
    return parts
      .map((p) => (p && typeof p === "object" && typeof (p as Record<string, unknown>).text === "string" ? (p as Record<string, unknown>).text : ""))
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function roleOf(m: unknown): string {
  const anyM = m as Record<string, unknown>;
  const info = anyM.info as Record<string, unknown> | undefined;
  return String(anyM.role ?? info?.role ?? "");
}

function lastUserText(ctx: Ctx, sessionID: string): string {
  const list = (ctx.data.session.message.list(sessionID) ?? []) as unknown[];
  for (let i = list.length - 1; i >= 0; i--) {
    if (roleOf(list[i]) === "user") return extractText(list[i]);
  }
  return "";
}

/** Compact live bar above the composer (updates on new messages). */
function CoachBar(props: { sessionID: string }) {
  const ctx = usePlugin();
  const analysis = createMemo<Analysis | null>(() => {
    const text = lastUserText(ctx, props.sessionID);
    if (!text.trim()) return null;
    return analyze(text, cfgOf(ctx));
  });
  return (
    <Show when={analysis()} fallback={<text fg={ctx.theme.text.muted}>Prompt Coach: /coach — analyze · /coach help</text>}>
      {(a) => (
        <text fg={a().score >= 80 ? ctx.theme.text.success : a().score >= 50 ? ctx.theme.text.warning : ctx.theme.text.error}>
          {"Coach " + a().oneLine + "  ·  /coach — improve"}
        </text>
      )}
    </Show>
  );
}

/** Compact Go usage line for the sidebar. */
function UsageBar() {
  const ctx = usePlugin();
  const [usage, setUsage] = createSignal<UsageLimits | null>(null);

  const load = async () => {
    try {
      const client = ctx.client as unknown as {
        usage?: { limits?: (input: { location: unknown }) => Promise<{ data: UsageLimits | null }> };
      };
      if (!client.usage?.limits) return;
      const res = await client.usage.limits({ location: ctx.location });
      setUsage(res.data ?? null);
    } catch {
      // ignore
    }
  };

  void load();
  const timer = setInterval(() => void load(), 60000);
  onCleanup(() => clearInterval(timer));

  return (
    <Show when={usage()?.go} fallback={<text fg={ctx.theme.text.muted}>Go: /usage</text>}>
      {(g) => (
        <text
          fg={
            g().monthly.percent >= 90
              ? ctx.theme.text.error
              : g().monthly.percent >= 70
                ? ctx.theme.text.warning
                : ctx.theme.text.success
          }
        >
          {"Go " +
            formatPercent(g().rolling.percent) + " 5h · " +
            formatPercent(g().weekly.percent) + " wk · " +
            formatPercent(g().monthly.percent) + " mo · /usage"}
        </text>
      )}
    </Show>
  );
}

/** Interactive panel: review, edit, rewrite, send improved prompt. */
function CoachPanel(props: { panel: { sessionID: string; close: () => void } }) {
  const ctx = usePlugin();
  const cfg = cfgOf(ctx);
  const [draft] = ctx.storage.memory("draft", { initial: { text: "" } });
  const [text, setText] = createSignal(draft.text || lastUserText(ctx, props.panel.sessionID));
  const models = createMemo<ModelCandidate[]>(() => {
    try {
      const list = ctx.data.location.model.list(ctx.location) ?? [];
      return fromModelInfos(list as unknown[]);
    } catch {
      return [];
    }
  });
  const analysis = createMemo(() => analyze(text(), cfg, undefined, models()));
  const [llmBusy, setLlmBusy] = createSignal(false);

  ctx.keymap.layer(() => ({
    mode: "global",
    commands: [
      {
        id: "coach.panel.edit",
        title: "Edit prompt",
        bind: "e",
        run: async () => {
          const value = await ctx.ui.dialog.prompt({ title: "Prompt text", placeholder: "Describe your task…" });
          if (typeof value === "string") setText(value);
        },
      },
      {
        id: "coach.panel.apply",
        title: "Use improved prompt",
        bind: "r",
        run: () => setText(analysis().improvedPrompt),
      },
      {
        id: "coach.panel.llm",
        title: "Improve with LLM",
        bind: "l",
        run: async () => {
          if (llmBusy() || !text().trim()) return;
          setLlmBusy(true);
          try {
            const client = ctx.client as unknown as {
              session?: { generate?: (input: { sessionID: string; prompt: string }) => Promise<{ text?: string }> };
            };
            const res = await client.session?.generate?.({
              sessionID: props.panel.sessionID,
              prompt: llmRewriteInstruction(text(), "ru"),
            });
            const out = String(res?.text ?? "").trim();
            if (out) {
              setText(out);
              ctx.ui.toast.show({ message: "LLM improved the prompt", variant: "success" });
            } else {
              ctx.ui.toast.show({ message: "LLM returned an empty prompt", variant: "error" });
            }
          } catch {
            ctx.ui.toast.show({ message: "LLM improve failed", variant: "error" });
          } finally {
            setLlmBusy(false);
          }
        },
      },
      {
        id: "coach.panel.send",
        title: "Send improved prompt",
        bind: "s",
        run: async () => {
          const improved = analysis().improvedPrompt;
          try {
            await ctx.client.session.prompt({ sessionID: props.panel.sessionID, text: improved });
            ctx.ui.toast.show({ message: "Improved prompt sent", variant: "success" });
            props.panel.close();
          } catch {
            ctx.ui.toast.show({ message: "Failed to send. Copy manually.", variant: "error" });
          }
        },
      },
      { id: "coach.panel.close", title: "Close", bind: "escape", run: () => props.panel.close() },
    ],
  }));

  return (
    <box flexDirection="column">
      <text>{"Prompt Coach — " + analysis().score + "/100 · " + analysis().complexity + " · ~" + analysis().tokens + " tok"}</text>
      <text>{"Model: " + analysis().recommendedModel.name + " (quality) / " + analysis().alternativeModel.name + " (budget)"}</text>
      <text>{"Available models (" + (analysis().availableModels?.length ?? 0) + "):"}</text>
      {(analysis().availableModels ?? []).slice(0, 8).map((m) => (
        <text>{"  • " + m.name + " · " + (m.tokenUsage ?? "—") + " tok · " + formatUsd(m.inputPerM) + "/" + formatUsd(m.outputPerM) + " · " + fmtCtx(m.context) + " · " + (m.purpose ?? "")}</text>
      ))}
      {(analysis().availableModels?.length ?? 0) > 8 ? (
        <text>{"  … +" + ((analysis().availableModels?.length ?? 0) - 8) + " more"}</text>
      ) : null}
      <text> </text>
      <Show when={analysis().missing.length > 0}>
        <text>{"Missing:"}</text>
        {analysis().missing.slice(0, 5).map((m) => <text>{"  • " + m}</text>)}
      </Show>
      <Show when={analysis().suggestions.length > 0}>
        <text>{"Tips:"}</text>
        {analysis().suggestions.slice(0, 4).map((m) => <text>{"  • " + m}</text>)}
      </Show>
      <text> </text>
      <text>{"Improved prompt (r = apply, s = send):"}</text>
      <text>{analysis().improvedPrompt.slice(0, 600)}</text>
      <text> </text>
      <text>{llmBusy() ? "LLM improving…" : "[e] edit · [r] apply template · [l] LLM improve · [s] send · [esc] close"}</text>
    </box>
  );
}

const TUTORIAL = [
  "1/5. Score 0–100 shows prompt quality. Green ≥80, yellow 50–79, red <50.",
  "2/5. Good prompt = Role + Task + Context + Constraints + Success criteria.",
  "3/5. Type /coach <your prompt> to analyze before sending. In the panel: [e] edit, [r] apply improved, [s] send.",
  "4/5. Coach suggests a model: simple task → cheap model (DeepSeek Flash), complex → frontier (Opus).",
  "5/5. Save tokens: one task per prompt, narrow context, use /undo instead of regenerating. Try /coach fix the bug",
];

function usageReport(u: UsageLimits | null): string {
  if (!u) return "Нет данных о подписке Go. Войдите в Console или подключите Go.";
  const lines = [`Workspace: ${u.workspace.name ?? u.workspace.id}`];
  if (u.go) {
    lines.push(`5 часов: ${formatPercent(u.go.rolling.percent)} · ${formatReset(u.go.rolling.resetsAt)}`);
    lines.push(`Неделя: ${formatPercent(u.go.weekly.percent)} · ${formatReset(u.go.weekly.resetsAt)}`);
    lines.push(`Месяц: ${formatPercent(u.go.monthly.percent)} · ${formatReset(u.go.monthly.resetsAt)}`);
  } else {
    lines.push("Go: не подключён");
  }
  if (u.budgets.length) {
    lines.push("", "Бюджеты:");
    for (const b of u.budgets) {
      const who = b.models.length ? b.models.map((m) => m.name || m.modelID).join(", ") : b.id;
      lines.push(`• ${who}: ${formatUsd(b.spent)} / ${formatUsd(b.limit)} · ${formatReset(b.resetsAt)}`);
    }
  }
  return lines.join("\n");
}

export default Plugin.define({
  id: "prompt-coach.tui",
  setup(context) {
    // Live bar above composer
    context.ui.slot({
      append: "session.composer.top",
      render: ({ sessionID }) => <CoachBar sessionID={sessionID} />,
    });

    // Go usage in the sidebar.
    context.ui.slot({
      append: "sidebar.footer",
      render: () => <UsageBar />,
    });

    // Panel contribution
    context.ui.slot({
      append: "session.panel",
      render: (panel) => (
        <Show when={panel.name === "prompt.coach"}>
          <CoachPanel panel={panel} />
        </Show>
      ),
    });

    // Commands
    context.keymap.layer(() => ({
      mode: "global",
      priority: 10,
      commands: [
        {
          id: "coach.open",
          title: "Prompt Coach",
          group: "Coach",
          palette: true,
          slash: { name: "coach", arguments: true },
          run: async (input) => {
            const arg = (input ?? "").trim();
            if (arg === "help") {
              await context.ui.dialog.alert({
                title: "Prompt Coach",
                message:
                  "/coach — open panel\n/coach <text> — analyze text\n/coach tutorial — 5-step tutorial\n\nPanel keys: e edit · r apply improved · s send · esc close",
              });
              return;
            }
            if (arg === "tutorial") {
              for (const step of TUTORIAL) await context.ui.dialog.alert({ title: "Coach tutorial", message: step });
              return;
            }
            if (arg) {
              const [, update] = context.storage.memory("draft", { initial: { text: "" } });
              await update((d) => { d.text = arg.replace(/^deep\s+/, ""); });
            }
            const ok = context.ui.panel.open("prompt.coach");
            if (!ok) {
              const a = analyze(arg || "example", cfgOf(context as Ctx));
              await context.ui.dialog.alert({ title: `Score ${a.score}/100`, message: a.oneLine });
            }
          },
        },
        {
          id: "coach.usage",
          title: "Usage & limits",
          group: "Coach",
          palette: true,
          slash: { name: "usage" },
          run: async () => {
            try {
              const client = context.client as unknown as {
                usage?: { limits?: (input: { location: unknown }) => Promise<{ data: UsageLimits | null }> };
              };
              const res = await client.usage?.limits?.({ location: context.location });
              await context.ui.dialog.alert({ title: "Usage & limits", message: usageReport(res?.data ?? null) });
            } catch (e) {
              await context.ui.dialog.alert({ title: "Usage & limits", message: "Не удалось загрузить: " + String(e) });
            }
          },
        },
      ],
      bindings: ["coach.open", "coach.usage"],
    }));

    context.ui.toast.show({ message: "Prompt Coach loaded. /coach tutorial to learn.", variant: "success", duration: 3000 });
  },
});
