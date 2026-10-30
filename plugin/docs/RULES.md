# How to add a rule (5 steps)

1. Create `src/core/rules/myrule.ts`:
   ```ts
   import type { Rule } from "../types";
   export const myRule: Rule = {
     id: "myrule",
     category: "clarity", // one of 6 categories
     run(text, ctx) {
       const bad = !text.includes("because");
       return { score: bad ? 0.4 : 1, missing: bad ? ["no_reason"] : [], tips: bad ? ["reason"] : [] };
     },
   };
   ```
2. Register it in `src/core/rules/index.ts` → `ALL_RULES`.
3. Add human text to `src/core/i18n.ts` → `STRINGS.no_reason`, `STRINGS.reason` (ru + en).
4. Add a test in `tests/analyzer.test.ts`.
5. `npm test`.

Rules must be pure, synchronous and fast (no I/O, no OpenCode imports).
