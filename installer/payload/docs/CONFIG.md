# Configuration

Pass options in `opencode.jsonc`:
```jsonc
{
  "plugins": [{
    "package": "./.opencode/plugins/prompt-coach",
    "options": {
      "lang": "ru",
      "threshold": 50,
      "live": true,
      "blockOnLowScore": false,
      "debounceMs": 200,
      "weights": { "clarity": 0.2, "context": 0.25, "success": 0.2, "constraints": 0.1, "scope": 0.1, "tokens": 0.15 }
    }
  }]
}
```

| Option | Default | Meaning |
|---|---|---|
| `lang` | `"ru"` | Hint language: `ru` / `en` |
| `threshold` | `50` | Score below this is considered weak |
| `live` | `true` | Live bar above composer |
| `blockOnLowScore` | `false` | Reserved: warn before sending weak prompts |
| `debounceMs` | `200` | Reserved for live keystroke analysis |
| `weights` | see above | Category weights (sum ~1) |
| `modelOverrides` | — | Force model per complexity: `{ "low": "deepseek/..." }` |
| `usage.enabled` | `true` | Show usage widgets |
| `usage.pollSeconds` | `60` | Limit refresh interval |
| `usage.goPlan` | `"go"` | `"go"` / `"plus"` for monthly allowances |
| `usage.showPill` | `true` | Composer pill with Go % |
| `usage.showHeaderBadge` | `true` | Session header badge |

Changes apply after `/reload`.
