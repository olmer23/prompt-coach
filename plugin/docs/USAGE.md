# Usage & limits

Visual Go/Console limits inside OpenCode. Data comes from the local OpenCode API:

```
GET /api/experimental/usage/limits
```

No tokens are spent.

## What is shown
- **5 hours / week / month** — Go allowance meters (`percent`, `limited`, `resetsAt`).
- **Budgets** — Console budgets and per-model budgets (`spent / limit`, reset time).
- **Current model** — context window, max output, input/output price, Go monthly allowance.
- **Workspace** — name and plan (`go` / `plus`).

If the workspace is not signed in, the API returns `null`; the plugin shows a hint and still
shows model limits.

## Desktop
- **Header badge**: `● Go 42%` in the session header.
- **Composer pill**: `Go 42% 5h · 31% mo` next to the Prompt Coach pill.
- **Panel**: `/usage` or click a badge/pill.
  - 3 meters with reset countdown
  - budgets
  - current model limits
  - Refresh button

## TUI
- Sidebar footer: `Go 42% 5h · 68% wk · 31% mo · /usage`.
- `/usage` opens a dialog with meters and budgets.

## Config
```jsonc
"options": {
  "usage": {
    "enabled": true,
    "pollSeconds": 60,
    "goPlan": "go",          // "go" | "plus"
    "showPill": true,
    "showHeaderBadge": true
  }
}
```

## Refresh
- On startup, every `pollSeconds` (default 60), and on Refresh/`/usage`.
- One lightweight GET per cycle; no model calls.

## Add a model allowance
Edit `src/core/usage.ts` → `GO_MONTHLY`:
```ts
"model-id": { go: 60, plus: 180 },
```
Values are monthly USD allowances from the official Go pricing table.
