# Prompt Coach for OpenCode

Real-time prompt quality coach: score 0–100, what's missing, model suggestion, token-saving tips,
and an improved prompt — before you hit send.

Works in **OpenCode Desktop** (live composer pill + side panel) and in the terminal TUI.
Also exposes agent tools `coach_analyze`, `coach_score`, `coach_rewrite`.

## Install (Desktop, permanent)

**Windows, автоматически:** запустите `installer\install.cmd` из корня репозитория —
установщик сам выберет ASCII-путь, поставит зависимости и прописывает плагин в глобальный конфиг.

**Вручную:** OpenCode Desktop не загружает плагины из путей с кириллицей, поэтому папку
плагина нужно положить по ASCII-пути, например `C:\OpenCodePlugins\prompt-coach`:

```powershell
New-Item -ItemType Directory "C:\OpenCodePlugins" -Force
Copy-Item -Recurse plugin "C:\OpenCodePlugins\prompt-coach"
```

Глобальный `~/.config/opencode/opencode.jsonc`:
```jsonc
{
  "plugins": [{
    "package": "C:\\OpenCodePlugins\\prompt-coach",
    "options": { "lang": "ru", "threshold": 50, "live": true }
  }]
}
```

Then restart OpenCode Desktop (or run `/reload`). Verify:
```powershell
opencode plugin list
opencode api get /api/plugin   # must show "prompt-coach" with server/tui/gui: true
opencode api get /api/command  # must list "coach"
```

> TUI-only install: place the folder under `.opencode/plugins/` and use the terminal client.

## Build the GUI part
The Desktop UI is a prebuilt CJS bundle:
```bash
npm install
npm run build:gui   # -> dist/gui-experimental.cjs
```
Rebuild after editing `src/gui.tsx`.

## Use
| Command | What it does |
|---|---|
| `/coach` | Open the coach panel |
| `/coach <your prompt>` | Analyze text in the panel |
| `/coach improve <your prompt>` | Rewrite and put it into the composer |
| `/usage` | OpenCode Go limits, budgets, model limits |
| `/coach tutorial` | 5-step tutorial |
| `/coach help` | Quick help |

**Desktop has buttons — no slash commands required.** Click the **Coach** pill, titlebar item, or
**+ → Prompt Coach** in the session panel. The panel toolbar has:

- **✨ Improve with LLM → Apply** — one click; uses your current model (spends tokens) and writes the result into the composer.
- **Apply template** — free instant structured prompt.
- **Apply improved** — apply the current preview.
- **Copy** — copy the original prompt.
- **Usage** — Go 5h/week/month, budgets, model limits.
- **Help** — all functions and the 5-step tutorial inside the panel.

The **live pill** above the composer always shows `Coach` or `Coach 72 · Code → Kimi K2.7 Code`.
The **Go pill** shows `Go 42% 5h · 31% mo`.

The panel detects the task type (architecture, code, debugging, UI/screenshots, quick edit,
large output, fallback) and picks the best-fitting model plus a cheaper/backup option.
For each model it shows **price per 1M tokens**, **ум** (capability, 0–100) and **выгода**
(capability per dollar, 0–100), the Go monthly allowance, context window and purpose.

The panel lists **all models actually available in OpenCode** from a curated set of
**35 verified models** (7 Zen + 23 Go + 5 OpenRouter Free). If the catalog is empty, the same
static catalog is used as a fallback. Models outside the curated set are filtered out.

## Learn
- `docs/GUIDE.md` — beginner tutorial
- `docs/CHEATSHEET.md` — one-page cheat sheet
- `docs/USAGE.md` — Go limits, budgets, model limits
- `../../trainer.html` — offline browser trainer (real-time, char by char)

## Develop
- `AGENTS.md` — map for AI agents (where to change what)
- `docs/ARCHITECTURE.md`, `docs/RULES.md`
- `npm test && npm run typecheck && npm run build:gui`

