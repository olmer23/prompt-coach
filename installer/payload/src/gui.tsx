/** @jsxImportSource solid-js */
import {
  Command,
  ComposerPill,
  MenuItem,
  Panel,
  Plugin,
  Slot,
  Style,
  TitlebarItem,
  usePlugin,
  type PanelProps,
  type PanelTab,
} from "@opencode/plugin/gui";
import { createEffect, createMemo, createSignal, onMount, Show } from "solid-js";
import { analyze } from "./core/analyzer";
import { improvePrompt, llmRewriteInstruction } from "./core/rewrite";
import { efficiencyFor, findCatalogEntry, fromModelInfos } from "./core/models";
import type { Analysis, CoachConfig, ModelCandidate, ModelSuggestion } from "./core/types";
import { DEFAULT_CONFIG } from "./core/types";
import {
  formatPercent,
  formatReset,
  formatUsd,
  goLimitFor,
  meterColor,
  percentTone,
  usageSummary,
  type GoPlan,
  type UsageLimits,
  type UsageMeter,
} from "./core/usage";

const CSS = `
.pc-root{display:flex;flex-direction:column;gap:14px;padding:16px;font-size:13px;line-height:1.5;color:var(--text-primary,#1d1d1f)}
.pc-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.pc-score{font-size:34px;font-weight:700;letter-spacing:-.02em}
.pc-badge{font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px}
.pc-badge.ok{background:rgba(52,199,89,.15);color:#248a3d}
.pc-badge.warn{background:rgba(255,159,10,.15);color:#a05a00}
.pc-badge.bad{background:rgba(255,59,48,.15);color:#c0392b}
.pc-cat{display:flex;align-items:center;gap:8px}
.pc-cat-label{flex:0 0 120px;color:var(--text-secondary,#6e6e73)}
.pc-bar{flex:1;height:6px;border-radius:3px;background:rgba(127,127,127,.2);overflow:hidden}
.pc-bar>i{display:block;height:100%;border-radius:3px}
.pc-cat-val{flex:0 0 34px;text-align:right;font-variant-numeric:tabular-nums}
.pc-h{font-weight:600;margin:4px 0 2px}
.pc-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.pc-list li{display:flex;gap:8px;align-items:flex-start;color:var(--text-secondary,#6e6e73)}
.pc-models{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.pc-model{border:1px solid rgba(127,127,127,.22);border-radius:10px;padding:8px 10px}
.pc-model.primary{border-color:rgba(0,113,227,.45);background:rgba(0,113,227,.06)}
.pc-model b{display:block;font-size:12px}
.pc-model small{color:var(--text-secondary,#6e6e73)}
.pc-model .pc-cost{font-weight:600;margin-top:2px}
.pc-purpose{display:block;font-size:10.5px;color:var(--text-secondary,#6e6e73);margin-top:2px;white-space:normal;line-height:1.35}
.pc-task{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.pc-task-name{font-size:15px;font-weight:700}
.pc-conf{font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:999px;background:rgba(0,113,227,.12);color:#0071e3}
.pc-advice{font-size:11px;color:var(--text-secondary,#6e6e73);background:rgba(127,127,127,.08);border-radius:8px;padding:7px 9px}
.pc-stats{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;margin-top:6px}
.pc-stat{display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--text-secondary,#6e6e73)}
.pc-stat b{font-variant-numeric:tabular-nums;color:var(--text-primary,#1d1d1f)}
.pc-stat .pc-bar{height:4px}
.pc-price{font-size:11px;font-weight:600;font-variant-numeric:tabular-nums}
.pc-limit{font-size:10.5px;font-variant-numeric:tabular-nums;color:var(--text-secondary,#6e6e73)}
.pc-model-list{max-height:240px;overflow:auto;border:1px solid rgba(127,127,127,.16);border-radius:10px}
.pc-model-row{display:flex;gap:10px;align-items:flex-start;justify-content:space-between;padding:7px 9px;border-bottom:1px solid rgba(127,127,127,.1)}
.pc-model-row:last-child{border-bottom:none}
.pc-model-main{min-width:0}
.pc-model-main b{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pc-model-main small{color:var(--text-secondary,#6e6e73);font-size:10.5px}
.pc-model-meta{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;font-size:10.5px;color:var(--text-secondary,#6e6e73);font-variant-numeric:tabular-nums}
.pc-tag{font-size:9.5px;font-weight:700;padding:1px 6px;border-radius:999px;text-transform:uppercase;letter-spacing:.04em}
.pc-tag.q{background:rgba(255,159,10,.18);color:#a05a00}
.pc-tag.b{background:rgba(52,199,89,.18);color:#248a3d}
.pc-actions{display:flex;gap:8px;flex-wrap:wrap}
.pc-btn{border:1px solid rgba(127,127,127,.3);background:transparent;color:inherit;border-radius:999px;padding:7px 14px;font:inherit;cursor:pointer}
.pc-btn.primary{background:#0071e3;border-color:transparent;color:#fff}
.pc-btn:hover{filter:brightness(1.05)}
.pc-pre{white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px;background:rgba(127,127,127,.08);border-radius:10px;padding:10px;max-height:260px;overflow:auto}
.pu-root{display:flex;flex-direction:column;gap:14px;padding:16px;font-size:13px;line-height:1.5;color:var(--text-primary,#1d1d1f)}
.pu-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.pu-title{font-size:16px;font-weight:700}
.pu-sub{color:var(--text-secondary,#6e6e73);font-size:11.5px}
.pu-h{font-weight:600;margin:2px 0}
.pu-meter{display:flex;flex-direction:column;gap:3px}
.pu-meter-row{display:flex;justify-content:space-between;gap:8px;font-size:12px}
.pu-meter-row b{font-variant-numeric:tabular-nums}
.pu-track{height:8px;border-radius:4px;background:rgba(127,127,127,.2);overflow:hidden}
.pu-track>i{display:block;height:100%;border-radius:4px}
.pu-reset{color:var(--text-secondary,#6e6e73);font-size:11px}
.pu-card{border:1px solid rgba(127,127,127,.22);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:6px}
.pu-row{display:flex;justify-content:space-between;gap:12px}
.pu-row small{color:var(--text-secondary,#6e6e73)}
.pu-badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;background:rgba(127,127,127,.12);cursor:pointer}
.pu-dot{width:7px;height:7px;border-radius:50%;display:inline-block}
.pu-empty{color:var(--text-secondary,#6e6e73);font-size:12px}
.pu-btn{border:1px solid rgba(127,127,127,.3);background:transparent;color:inherit;border-radius:999px;padding:5px 12px;font:inherit;cursor:pointer}
.pc-toolbar{display:flex;flex-wrap:wrap;gap:6px}
.pc-toolbar .pc-btn{font-size:11.5px;padding:6px 11px}
.pc-btn.glow{background:linear-gradient(135deg,#0a84ff,#5e5ce6);border-color:transparent;color:#fff;font-weight:600}
.pc-btn:disabled{opacity:.45;cursor:default}
.pc-note{font-size:11px;color:var(--text-secondary,#6e6e73)}
.pc-error{font-size:11.5px;color:#c0392b;background:rgba(255,59,48,.1);border-radius:8px;padding:6px 8px}
.pc-help{font-size:12px;background:rgba(127,127,127,.07);border-radius:10px;padding:10px 12px}
.pc-help b{display:block;margin-bottom:4px}
.pc-help ul{margin:0;padding-left:16px;color:var(--text-secondary,#6e6e73)}
.pc-spin{display:inline-block;width:10px;height:10px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:pcspin .8s linear infinite;vertical-align:-1px;margin-right:5px}
@keyframes pcspin{to{transform:rotate(360deg)}}
`;

function cfgOf(ctx: { options?: unknown }): CoachConfig {
  const o = (ctx.options ?? {}) as Partial<CoachConfig>;
  return { ...DEFAULT_CONFIG, ...o, weights: { ...DEFAULT_CONFIG.weights, ...(o.weights ?? {}) } };
}

function tone(score: number): "ok" | "warn" | "bad" {
  return score >= 80 ? "ok" : score >= 50 ? "warn" : "bad";
}

function barColor(score: number): string {
  return score >= 80 ? "#34c759" : score >= 50 ? "#ff9f0a" : "#ff3b30";
}

interface UsageConfig {
  enabled: boolean;
  pollSeconds: number;
  goPlan: GoPlan;
  showPill: boolean;
  showHeaderBadge: boolean;
}

function usageCfg(ctx: { options?: unknown }): UsageConfig {
  const o = ((ctx.options as { usage?: Partial<UsageConfig> } | undefined)?.usage ?? {}) as Partial<UsageConfig>;
  return {
    enabled: true,
    pollSeconds: 60,
    goPlan: "go",
    showPill: true,
    showHeaderBadge: true,
    ...o,
  };
}

function fmtK(n: number | undefined): string {
  if (!n || !Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

/** Price per 1M tokens: keep cents, unlike the budget formatter. */
function fmtPrice(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  if (n === 0) return "$0";
  if (n >= 1) return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
  return `$${n.toFixed(n < 0.1 ? 3 : 2)}`;
}

function fmtLimit(n: number | undefined): string {
  if (n === undefined) return "нет в Go";
  if (!Number.isFinite(n)) return "∞";
  return `$${Math.round(n)}/мес`;
}

function fmtInt(n: number | undefined): string {
  return n === undefined ? "—" : `${n}/100`;
}

function altLabel(primary: ModelSuggestion, alt: ModelSuggestion): string {
  const cheaper = alt.costPerRequestUsd < primary.costPerRequestUsd;
  const smarter = (alt.intelligence ?? 0) > (primary.intelligence ?? 0);
  if (cheaper && smarter) return "Дешевле и умнее";
  if (smarter) return "Резерв: умнее";
  if (cheaper) return "Дешевле / резерв";
  return "Резерв";
}

function ModelCard(props: { label: string; model: ModelSuggestion; accent?: boolean }) {
  const m = props.model;
  return (
    <div class={"pc-model" + (props.accent ? " primary" : "")}>
      <small>{props.label}</small>
      <b>{m.name}</b>
      <div class="pc-price">{fmtPrice(m.inputPerM)} in · {fmtPrice(m.outputPerM)} out за 1M</div>
      <div class="pc-cost">~${m.costPerRequestUsd}/запрос · лимит {fmtLimit(m.monthlyLimit)}</div>
      <div class="pc-stats">
        <span class="pc-stat">
          Ум
          <span class="pc-bar"><i style={{ width: (m.intelligence ?? 0) + "%", background: barColor(m.intelligence ?? 0) }} /></span>
          <b>{fmtInt(m.intelligence)}</b>
        </span>
        <span class="pc-stat">
          Выгода
          <span class="pc-bar"><i style={{ width: (m.efficiency ?? 0) + "%", background: barColor(m.efficiency ?? 0) }} /></span>
          <b>{fmtInt(m.efficiency)}</b>
        </span>
      </div>
      <span class="pc-purpose">{m.purpose ?? ""}</span>
    </div>
  );
}

function UsageMeterRow(props: { label: string; meter: UsageMeter; lang: "ru" | "en" }) {
  return (
    <div class="pu-meter">
      <div class="pu-meter-row">
        <span>{props.label}</span>
        <b style={{ color: meterColor(props.meter.percent) }}>{formatPercent(props.meter.percent)}</b>
      </div>
      <span class="pu-track">
        <i style={{ width: formatPercent(props.meter.percent), background: meterColor(props.meter.percent) }} />
      </span>
      <span class="pu-reset">
        {props.meter.limited ? "⛔ limit reached · " : ""}
        reset {formatReset(props.meter.resetsAt, props.lang)}
      </span>
    </div>
  );
}

function UsageBadge(props: { usage: UsageLimits | null; onClick: () => void }) {
  const percent = () => props.usage?.go?.rolling.percent;
  return (
    <Show when={percent() !== undefined}>
      <span class="pu-badge" onClick={props.onClick} title={usageSummary(props.usage, "ru")}>
        <span class="pu-dot" style={{ background: meterColor(percent()!) }} />
        Go {formatPercent(percent()!)}
      </span>
    </Show>
  );
}

function UsageView(props: PanelProps & { usage: () => UsageLimits | null; refresh: () => void; plan: GoPlan }) {
  const ctx = usePlugin();
  const [model, setModel] = createSignal<Record<string, any> | null>(null);
  const lang = "ru" as const;
  const current = () => props.screen.composer.model();

  createEffect(() => {
    const cm = current();
    const dir = props.session.directory;
    if (!cm) return;
    void (async () => {
      try {
        const res = await ctx.client.model.list({ location: { directory: dir } });
        const found = (res.data as Record<string, any>[]).find(
          (m) => m.providerID === cm.providerID && (m.id === cm.modelID || m.modelID === cm.modelID),
        );
        setModel(found ?? null);
      } catch {
        setModel(null);
      }
    })();
  });

  const go = () => props.usage()?.go;
  const modelGo = () => {
    const m = model();
    return m ? goLimitFor(String(m.modelID ?? m.id), props.plan) : undefined;
  };
  const meta = () => {
    const m = model();
    return m ? findCatalogEntry(String(m.providerID ?? ""), String(m.modelID ?? m.id ?? "")) : undefined;
  };

  return (
    <div class="pu-root">
      <div class="pu-head">
        <div>
          <div class="pu-title">Usage & limits</div>
          <div class="pu-sub">
            {props.usage()?.workspace?.name ?? "OpenCode"} · plan {props.plan === "plus" ? "Go Plus" : "Go"}
          </div>
        </div>
        <button class="pu-btn" onClick={props.refresh}>Refresh</button>
      </div>

      <Show when={go()} fallback={<div class="pu-empty">Нет данных Go. Войдите в Console или подключите Go.</div>}>
        {(g) => (
          <div class="pu-card">
            <div class="pu-h">OpenCode Go</div>
            <UsageMeterRow label="5 часов" meter={g().rolling} lang={lang} />
            <UsageMeterRow label="Неделя" meter={g().weekly} lang={lang} />
            <UsageMeterRow label="Месяц" meter={g().monthly} lang={lang} />
          </div>
        )}
      </Show>

      <div class="pu-card">
        <div class="pu-h">Current model</div>
        <Show when={model()} fallback={<div class="pu-empty">{current() ? `${current()!.providerID}/${current()!.modelID}` : "Модель не выбрана"}</div>}>
          {(m) => (
            <>
              <div class="pu-row">
                <b>{m().name ?? m().id}</b>
                <small>{m().providerID}/{m().modelID}</small>
              </div>
              <div class="pu-row"><small>Context</small><b>{fmtK(m().limit?.context)}</b></div>
              <div class="pu-row"><small>Max output</small><b>{fmtK(m().limit?.output)}</b></div>
              <div class="pu-row"><small>Price / 1M</small><b>{formatUsd(m().cost?.[0]?.input ?? 0)} in · {formatUsd(m().cost?.[0]?.output ?? 0)} out</b></div>
              <Show when={meta()}>
                {(e) => (
                  <div class="pu-row"><small>Capability</small><b>{e().intelligence}/100 · value {efficiencyFor(e())}/100</b></div>
                )}
              </Show>
              <div class="pu-row">
                <small>Go monthly</small>
                <b>{modelGo() === Infinity ? "∞" : modelGo() !== undefined ? `${formatUsd(modelGo()!)}/mo` : "—"}</b>
              </div>
            </>
          )}
        </Show>
      </div>

      <Show when={(props.usage()?.budgets?.length ?? 0) > 0}>
        <div class="pu-card">
          <div class="pu-h">Budgets</div>
          {props.usage()!.budgets.map((b) => {
            const pct = b.limit > 0 ? Math.min(100, (b.spent / b.limit) * 100) : 0;
            return (
              <div class="pu-meter">
                <div class="pu-meter-row">
                  <span>{b.models.length ? b.models.map((m) => m.name || m.modelID).join(", ") : b.id}</span>
                  <b>{formatUsd(b.spent)} / {formatUsd(b.limit)}</b>
                </div>
                <span class="pu-track"><i style={{ width: pct + "%", background: meterColor(pct) }} /></span>
                <span class="pu-reset">reset {formatReset(b.resetsAt, lang)}</span>
              </div>
            );
          })}
        </div>
      </Show>
    </div>
  );
}

function CoachView(props: PanelProps) {
  const ctx = usePlugin();
  const cfg = cfgOf(ctx);
  // Reactive: composer text updates as the user types.
  const text = () => props.screen.composer.text() ?? "";
  const [catalog, setCatalog] = createSignal<ModelCandidate[]>([]);
  createEffect(() => {
    const directory = props.session.directory;
    void (async () => {
      try {
        const res = await ctx.client.model.list({ location: { directory } });
        setCatalog(fromModelInfos(res.data as unknown[]));
      } catch {
        setCatalog([]);
      }
    })();
  });
  const analysis = createMemo<Analysis>(() => analyze(text(), cfg, undefined, catalog()));
  const modelList = createMemo(() => {
    const list = analysis().availableModels ?? [];
    const q = analysis().recommendedModel.id;
    const b = analysis().alternativeModel.id;
    const task = analysis().task.kind;
    const rank = (m: ModelCandidate) => {
      const id = `${m.providerID}/${m.modelID}`;
      if (id === q) return 0;
      if (id === b) return 1;
      return m.tasks?.includes(task) ? 2 : 3;
    };
    return [...list].sort(
      (x, y) =>
        rank(x) - rank(y) ||
        (y.intelligence ?? 0) - (x.intelligence ?? 0) ||
        x.inputPerM + x.outputPerM - (y.inputPerM + y.outputPerM),
    );
  });
  const [llmBusy, setLlmBusy] = createSignal(false);
  const [llmText, setLlmText] = createSignal("");
  const [llmError, setLlmError] = createSignal("");
  const [showHelp, setShowHelp] = createSignal(false);

  const improved = () => llmText() || analysis().improvedPrompt;

  const applyImproved = () => {
    if (!text().trim()) return;
    props.screen.composer.setText(improved());
  };
  const applyTemplate = () => {
    if (!text().trim()) return;
    setLlmText("");
    props.screen.composer.setText(analysis().improvedPrompt);
  };
  const copy = () => {
    void ctx.system.copy(text());
  };
  const improveWithLlm = async () => {
    if (!text().trim() || llmBusy()) return;
    setLlmBusy(true);
    setLlmError("");
    setLlmText("");
    const note = ctx.toast.show({ title: "Improving with LLM…", description: "Uses the current model and tokens", variant: "loading", persistent: true });
    try {
      const res = await ctx.client.session.generate({
        sessionID: props.session.id,
        prompt: llmRewriteInstruction(text(), "ru"),
      });
      const out = String((res as unknown as { text?: string }).text ?? "").trim();
      if (!out) throw new Error("empty response");
      setLlmText(out);
      props.screen.composer.setText(out);
      note.dismiss();
      ctx.toast.show({ title: "Improved and applied", description: "Review before sending.", variant: "success" });
    } catch (e) {
      note.dismiss();
      setLlmError("LLM improve failed: " + String(e));
    } finally {
      setLlmBusy(false);
    }
  };

  return (
    <div class="pc-root">
      <div class="pc-toolbar">
        <button class="pc-btn glow" onClick={() => void improveWithLlm()} disabled={!text().trim() || llmBusy()}>
          {llmBusy() ? <><span class="pc-spin" />Improving…</> : "✨ Improve with LLM → Apply"}
        </button>
        <button class="pc-btn" onClick={applyTemplate} disabled={!text().trim()}>Apply template</button>
        <button class="pc-btn" onClick={applyImproved} disabled={!text().trim()}>Apply improved</button>
        <button class="pc-btn" onClick={copy} disabled={!text().trim()}>Copy</button>
        <button class="pc-btn" onClick={() => ctx.layout.open(`${ctx.id}:usage`, props.session)}>Usage</button>
        <button class="pc-btn" onClick={() => setShowHelp((v) => !v)}>Help</button>
      </div>
      <div class="pc-note">LLM improve uses your current model and spends tokens. Template is free and instant.</div>

      <Show when={showHelp()}>
        <div class="pc-help">
          <b>Prompt Coach — all functions in the panel</b>
          <ul>
            <li>Live score + categories update as you type.</li>
            <li>Task detection picks a model for architecture, coding, debugging, UI, quick edits and long output.</li>
            <li>Prices are per 1M tokens; Ум and Выгода are 0–100 estimates (capability and capability-per-dollar).</li>
            <li><b>Improve with LLM → Apply</b>: one click, writes the result into the composer.</li>
            <li><b>Apply template</b>: free structured prompt with placeholders.</li>
            <li><b>Apply improved</b>: apply the current preview (LLM or template).</li>
            <li><b>Copy</b>: copy the original prompt.</li>
            <li><b>Usage</b>: Go 5h/week/month limits, budgets, model limits.</li>
            <li>Slash commands still work, but are optional.</li>
          </ul>
        </div>
      </Show>

      <Show when={llmError()}>
        <div class="pc-error">{llmError()}</div>
      </Show>

      <div class="pc-head">
        <div>
          <div class="pc-score">{analysis().score}<span style={{ "font-size": "14px", "font-weight": "400" }}>/100</span></div>
          <div style={{ color: "var(--text-secondary,#6e6e73)" }}>
            {analysis().complexity} · {analysis().task.label} · ~{analysis().tokens} tok · ${analysis().recommendedModel.costPerRequestUsd}/req
          </div>
        </div>
        <span class={"pc-badge " + tone(analysis().score)}>
          {analysis().score >= 80 ? "Ready" : analysis().score >= 50 ? "Fair" : "Weak"}
        </span>
      </div>

      <div>
        <div class="pc-task">
          <span class="pc-task-name">{analysis().task.label}</span>
          <span class="pc-conf">уверенность {Math.round(analysis().task.confidence * 100)}%</span>
        </div>
        <div class="pc-advice" style={{ "margin-top": "6px" }}>{analysis().task.advice}</div>
      </div>

      <div>
        {analysis().categories.map((c) => (
          <div class="pc-cat">
            <span class="pc-cat-label">{c.key}</span>
            <span class="pc-bar"><i style={{ width: c.score + "%", background: barColor(c.score) }} /></span>
            <span class="pc-cat-val">{c.score}</span>
          </div>
        ))}
      </div>

      <div>
        <div class="pc-h">Missing</div>
        <ul class="pc-list">
          {analysis().missing.length
            ? analysis().missing.slice(0, 6).map((m) => <li>• {m}</li>)
            : <li>✓ Nothing critical</li>}
        </ul>
      </div>

      <div>
        <div class="pc-h">Модель под задачу</div>
        <div class="pc-models">
          <ModelCard label={`Подходит: ${analysis().task.short}`} model={analysis().recommendedModel} accent />
          <ModelCard label={altLabel(analysis().recommendedModel, analysis().alternativeModel)} model={analysis().alternativeModel} />
        </div>
      </div>

      <div>
        <div class="pc-h">Available models ({modelList().length})</div>
        <div class="pc-model-list">
          {modelList().map((m) => {
            const id = `${m.providerID}/${m.modelID}`;
            const isQuality = id === analysis().recommendedModel.id;
            const isBudget = id === analysis().alternativeModel.id;
            const fitsTask = m.tasks?.includes(analysis().task.kind);
            return (
              <div class="pc-model-row">
                <div class="pc-model-main">
                  <b>{m.name}</b>
                  <small>{m.providerID}/{m.modelID}</small>
                  <span class="pc-purpose">{m.purpose ?? ""}</span>
                </div>
                <div class="pc-model-meta">
                  <span class="pc-price">{fmtPrice(m.inputPerM)} in · {fmtPrice(m.outputPerM)} out за 1M</span>
                  <span>ум {m.intelligence} · выгода {m.efficiency ?? "—"}</span>
                  <span>{fmtK(m.context)} ctx · {fmtLimit(m.monthlyLimit)}</span>
                  {fitsTask ? <span class="pc-tag q">для задачи</span> : null}
                  {isQuality ? <span class="pc-tag q">подходит</span> : null}
                  {isBudget ? <span class="pc-tag b">дешевле</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div class="pc-h">Token tips</div>
        <ul class="pc-list">
          {analysis().tokenTips.slice(0, 4).map((t) => <li>• {t}</li>)}
        </ul>
      </div>

      <div>
        <div class="pc-h">{llmText() ? "Improved prompt (LLM)" : "Improved prompt (template)"}</div>
        <pre class="pc-pre">{improved()}</pre>
      </div>
    </div>
  );
}

export default Plugin.define({
  i18n: {
    en: {
      "coach.title": "Prompt Coach",
      "coach.command": "Analyze and improve the current prompt",
      "coach.group": "Coach",
    },
    ru: {
      "coach.title": "Prompt Coach",
      "coach.command": "Разобрать и улучшить текущий промпт",
      "coach.group": "Коуч",
    },
  },
  setup(ctx) {
    const cfg = cfgOf(ctx);
    const ucfg = usageCfg(ctx);
    const [usage, setUsage] = createSignal<UsageLimits | null>(null);

    const refreshUsage = async () => {
      if (!ucfg.enabled) return;
      const session = ctx.sessions.current();
      if (!session) return;
      try {
        const res = await ctx.client.usage.limits({ location: { directory: session.directory } });
        setUsage(res.data ?? null);
      } catch {
        // Keep the last known values; the panel still shows model limits.
      }
    };
    void refreshUsage();
    const usageWarmup = setTimeout(() => void refreshUsage(), 2000);
    const usageTimer = setInterval(() => void refreshUsage(), Math.max(15, ucfg.pollSeconds) * 1000);

    ctx.add(Style, CSS);

    // Header badge: Go 5h usage.
    if (ucfg.enabled && ucfg.showHeaderBadge) {
      ctx.add(Slot, {
        at: "session.header",
        order: 10,
        render: (input) => (
          <UsageBadge usage={usage()} onClick={() => ctx.layout.open(`${ctx.id}:usage`, input.session)} />
        ),
      });
    }

    // Composer pill: Go rolling + monthly usage.
    if (ucfg.enabled && ucfg.showPill) {
      ctx.add(ComposerPill, {
        id: "usage",
        order: 6,
        show: (input) => {
          const g = usage()?.go;
          if (!g) return undefined;
          const max = Math.max(g.rolling.percent, g.weekly.percent, g.monthly.percent);
          return {
            label: `Go ${formatPercent(g.rolling.percent)} 5h · ${formatPercent(g.monthly.percent)} mo`,
            tone: percentTone(max),
            title: usageSummary(usage(), "ru"),
            run: () => ctx.layout.open(`${ctx.id}:usage`, input.session),
          };
        },
      });
    }

    // Composer pill: real-time score as you type.
    ctx.add(ComposerPill, {
      id: "coach",
      order: 5,
      show: (input) => {
        const value = input.screen.composer.text() ?? "";
        if (value.trim().startsWith("/")) return undefined;
        const a = value.trim() ? analyze(value, cfg) : null;
        return {
          label: a ? `Coach ${a.score} · ${a.task.short} → ${a.recommendedModel.name}` : "Coach",
          tone: a ? (a.score >= 80 ? "success" : a.score >= 50 ? "warning" : "danger") : undefined,
          title: a ? `${a.oneLine}\n${a.task.advice}\n${a.recommendedModel.reason}` : "Open Prompt Coach: analyze, improve with LLM, usage",
          run: () => ctx.layout.open(`${ctx.id}:coach`, input.session),
        };
      },
    });

    // Side panel with live analysis + Apply to composer.
    const tab: PanelTab = {
      id: "coach",
      get title() {
        return ctx.t("coach.title");
      },
      closable: "compact",
    };
    ctx.add(Panel, {
      id: "coach",
      region: "side",
      mobile: {
        get title() {
          return ctx.t("coach.title");
        },
        order: 40,
        kind: "menu",
      },
      list: (input) => (input.open.includes("coach") ? [tab] : []),
      render: (props) => <CoachView {...props} />,
    });

    // Slash command + palette entry.
    ctx.add(
      Command,
      (): Command => ({
        id: "coach",
        get title() {
          return ctx.t("coach.title");
        },
        description: ctx.t("coach.command"),
        group: ctx.t("coach.group"),
        section: "prompt",
        slash: { name: "coach", arguments: true },
        run: (input) => {
          const session = ctx.sessions.current();
          if (!session) return;
          const arg = (input ?? "").trim();
          if (/^improve\s+/i.test(arg)) {
            const src = arg.replace(/^improve\s+/i, "");
            const a = analyze(src, cfg);
            ctx.screen.current()?.composer.setText(a.improvedPrompt);
            ctx.layout.open(`${ctx.id}:coach`, session);
            return;
          }
          if (arg) {
            ctx.screen.current()?.composer.setText(arg);
            ctx.layout.open(`${ctx.id}:coach`, session);
            return;
          }
          ctx.layout.open(`${ctx.id}:coach`, session);
        },
      }),
    );

    // Usage panel: Go 5h/week/month, budgets, current model limits.
    const usageTab: PanelTab = {
      id: "usage",
      get title() {
        return "Usage & limits";
      },
      closable: "compact",
    };
    ctx.add(Panel, {
      id: "usage",
      region: "side",
      mobile: {
        get title() {
          return "Usage";
        },
        order: 41,
        kind: "menu",
      },
      list: (input) => (input.open.includes("usage") ? [usageTab] : []),
      render: (props) => <UsageView {...props} usage={usage} refresh={() => void refreshUsage()} plan={ucfg.goPlan} />,
    });

    ctx.add(
      Command,
      (): Command => ({
        id: "usage",
        title: "Usage & limits",
        description: "OpenCode Go 5h/week/month limits, budgets and model limits",
        group: "Coach",
        section: "session",
        slash: { name: "usage" },
        run: () => {
          const session = ctx.sessions.current();
          if (!session) return;
          void refreshUsage();
          ctx.layout.open(`${ctx.id}:usage`, session);
        },
      }),
    );

    // Visible launchers in the session "+" menu.
    ctx.add(
      MenuItem,
      (): MenuItem => ({
        menu: "session.panel",
        id: "coach",
        title: "Prompt Coach",
        description: "Analyze & improve prompt",
        opened: (() => {
          const s = ctx.sessions.current();
          return s ? ctx.layout.state(`${ctx.id}:coach`, s) !== "closed" : false;
        })(),
        run: () => {
          const s = ctx.sessions.current();
          if (s) ctx.layout.open(`${ctx.id}:coach`, s);
        },
      }),
    );
    ctx.add(
      MenuItem,
      (): MenuItem => ({
        menu: "session.panel",
        id: "usage",
        title: "Usage & limits",
        description: "Go 5h/week/month",
        opened: (() => {
          const s = ctx.sessions.current();
          return s ? ctx.layout.state(`${ctx.id}:usage`, s) !== "closed" : false;
        })(),
        run: () => {
          const s = ctx.sessions.current();
          if (!s) return;
          void refreshUsage();
          ctx.layout.open(`${ctx.id}:usage`, s);
        },
      }),
    );

    // Titlebar shortcut: no slash needed.
    ctx.add(
      TitlebarItem,
      (): TitlebarItem | undefined => ({
        id: "coach",
        label: "Coach",
        title: "Prompt Coach — analyze & improve",
        run: () => {
          const s = ctx.sessions.current();
          if (s) ctx.layout.open(`${ctx.id}:coach`, s);
        },
      }),
    );

    return () => {
      clearTimeout(usageWarmup);
      clearInterval(usageTimer);
    };
  },
});
