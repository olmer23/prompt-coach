# Prompt Coach — index for AI agents

Read this file first. It tells you exactly where to make a change with minimal reading.

## What this is
OpenCode plugin that scores prompts (0–100), shows what is missing, suggests a model,
and builds an improved prompt. Two parts: `server` (tools + prompt hook) and `tui` (panel + live bar).
Core analysis is pure, synchronous, no LLM, no deps.

## Map: task → file → symbol
| Change… | File | Symbol |
|---|---|---|
| Category weight | `src/core/types.ts` | `DEFAULT_CONFIG.weights` |
| Add/edit a rule | `src/core/rules/<category>.ts` | `*Rule.run()` |
| Register new rule | `src/core/rules/index.ts` | `ALL_RULES` |
| Complexity keywords | `src/core/scoring.ts` | `HIGH_*`, `LOW_*` |
| Task detection | `src/core/task.ts` | `SIGNALS`, `detectTask()` |
| Task labels/advice | `src/core/i18n.ts` | `task.*`, `advice.*` |
| Model catalog/prices | `src/core/models.ts` | `MODEL_CATALOG` (verified 35) |
| Task → model plan | `src/core/models.ts` | `TASK_PLAN`, `pickForTask()` |
| Capability/value estimate | `src/core/models.ts` | `ModelEntry.intelligence`, `efficiencyFor()` |
| Go monthly allowance | `src/core/models.ts` + `src/core/usage.ts` | `monthlyLimitFor()`, `GO_MONTHLY` |
| Model token usage/purpose | `src/core/models.ts` | `ModelEntry.tokenUsage`, `ModelEntry.purpose` |
| Live model normalization | `src/core/models.ts` | `fromModelInfos()` |
| Model pick logic | `src/core/models.ts` | `pickModels()`, `pickFromCandidates()` |
| Available model list in Analysis | `src/core/types.ts` | `Analysis.availableModels` |
| Hint/missing text | `src/core/i18n.ts` | `STRINGS` |
| Improved-prompt template | `src/core/rewrite.ts` | `improvePrompt()` |
| Token tips | `src/core/rewrite.ts` | `tokenTips()` |
| Token estimation | `src/core/tokens.ts` | `estimateTokens()` |
| Score pipeline | `src/core/analyzer.ts` | `analyze()` |
| Agent tools | `src/index.ts` | `ctx.tool.transform` |
| Prompt hook | `src/index.ts` | `ctx.session.hook("prompt")` |
| Slash command (all clients) | `src/index.ts` | `ctx.command.transform` |
| Desktop live pill | `src/gui.tsx` | `ctx.add(ComposerPill, …)` |
| One-click LLM improve | `src/gui.tsx` | `CoachView.improveWithLlm` |
| LLM rewrite instruction | `src/core/rewrite.ts` | `llmRewriteInstruction()` |
| Desktop usage badge/pill/panel | `src/gui.tsx` | `UsageBadge`, `UsageView` |
| Usage data helpers / Go allowances | `src/core/usage.ts` | `GO_MONTHLY`, `formatReset` |
| TUI usage line | `src/tui.tsx` | `UsageBar` |
| TUI `/usage` | `src/tui.tsx` | `coach.usage` |
| Desktop panel | `src/gui.tsx` | `CoachView` + `ctx.add(Panel, …)` |
| Desktop slash command | `src/gui.tsx` | `ctx.add(Command, …)` |
| GUI bundle | `npm run build:gui` | `dist/gui-experimental.cjs` |
| TUI panel | `src/tui.tsx` | `CoachPanel` |
| TUI live bar | `src/tui.tsx` | `CoachBar` |
| TUI slash command | `src/tui.tsx` | `coach.open` |

## Data flow
`text → analyze() → rules[] → categories → overallScore → pickModels → Analysis`.
Cache: in-memory `Map` keyed by text+weights hash (`analyzer.ts`).

## Install / runtime
- Desktop loads `./gui-experimental` + server. The TUI part is ignored by Desktop.
- Cyrillic paths break local plugin loading on Windows: install the plugin into an ASCII path
  (e.g. `C:\OpenCodePlugins\prompt-coach`) — `installer\install.cmd` does this automatically.
- GUI must be built: `npm run build:gui`. Rebuild after editing `src/gui.tsx`.

## Conventions
- Rules return `score 0..1` + `missing`/`tips` keys; human text lives ONLY in `i18n.ts`.
- Never import OpenCode APIs inside `src/core/*` (keeps core testable & reusable in trainer).
- Types in `src/core/types.ts`. Keep `Analysis` shape stable (TUI + tools + trainer depend on it).

## Tests
`npm test` (node:test + tsx). Fixtures in `tests/analyzer.test.ts`.

## Config
Plugin options via `opencode.jsonc` → `ctx.options`; see `docs/CONFIG.md`.
