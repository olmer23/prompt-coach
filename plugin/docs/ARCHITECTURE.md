# Architecture

```
            ┌──────────────────────────────┐
            │          src/core            │
            │  rules → analyzer → Analysis │
            │  scoring / models / rewrite  │
            └───────┬──────────┬───────────┘
                    │          │
        ┌───────────▼───┐  ┌───▼────────────┐
        │ src/index.ts  │  │ src/tui.tsx    │
        │ tools, hook,  │  │ TUI panel/bar  │
        │ slash command │  └────────────────┘
        └───────────────┘  ┌────────────────┐
                           │ src/gui.tsx    │
                           │ Desktop pill,  │
                           │ panel, command │
                           └────────────────┘
```

- **Core** is pure TypeScript. No OpenCode imports. Reused by server, TUI, GUI and tests.
- **Server** registers agent tools, a `prompt` hook and a `/coach` command (all clients).
- **TUI** is terminal-only (`@opencode/plugin/tui`): slots, keymap, `/coach`.
- **GUI** is Desktop-only (`@opencode/plugin/gui`): ComposerPill (live), Panel, Command.
  Built by `npm run build:gui` into `dist/gui-experimental.cjs`.
- **Desktop does not load `./tui`.** That is why `/coach` was invisible before the GUI/server
  command existed.
- **Cache**: `Map<hash, Analysis>` (100 entries) in `analyzer.ts`.

## Message lifecycle
1. User types a prompt in OpenCode.
2. On send, the server `prompt` hook analyzes and stores the result.
3. TUI `CoachBar` reads the last user message and shows live analysis.
4. `/coach` opens `CoachPanel`: edit → analyze → apply improved → send.

## Extension points
- New rule: `docs/RULES.md`.
- New model: `MODEL_CATALOG` in `core/models.ts`.
- New language: add strings in `core/i18n.ts` and labels in `types.ts`.
