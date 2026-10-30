export { clarityRule } from "./clarity";
export { contextRule } from "./context";
export { successRule } from "./success";
export { constraintsRule } from "./constraints";
export { scopeRule } from "./scope";
export { tokensRule } from "./tokens";

import { clarityRule } from "./clarity";
import { contextRule } from "./context";
import { successRule } from "./success";
import { constraintsRule } from "./constraints";
import { scopeRule } from "./scope";
import { tokensRule } from "./tokens";

export const ALL_RULES = [
  clarityRule,
  contextRule,
  successRule,
  constraintsRule,
  scopeRule,
  tokensRule,
];
