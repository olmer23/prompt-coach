import type { Rule, RuleContext, RuleResult } from "../types";

const FILE_EXT = /\.(ts|tsx|js|jsx|py|go|rs|java|kt|c|cpp|h|css|scss|html|md|json|yaml|yml|toml|sql)\b/;
const PATH_LIKE = /(src|lib|app|components|pages|tests|spec)\/[A-Za-z0-9_\-./]+/;
const IDENT = /[A-Za-z_][A-Za-z0-9_]*\([A-Za-z0-9_,\s]*\)/;

export const contextRule: Rule = {
  id: "context",
  category: "context",
  run(text, ctx): RuleResult {
    const missing: string[] = [];
    const tips: string[] = [];

    const hasFile = FILE_EXT.test(text) || PATH_LIKE.test(text);
    const hasFunc = IDENT.test(text);
    const hasStack = /react|vue|svelte|node|bun|python|go|rust|typescript|javascript/i.test(text);

    if (!hasFile) { missing.push("no_file"); tips.push("file"); }
    if (!hasFunc) { missing.push("no_function"); tips.push("function"); }
    if (!hasStack) { tips.push("stack"); }

    let score = 0.3;
    if (hasFile) score += 0.35;
    if (hasFunc) score += 0.2;
    if (hasStack) score += 0.15;
    score = Math.max(0, Math.min(1, score));

    return { score, missing, tips };
  },
};
