import type { Analysis } from "./core/types";

/** RPC contract shared by server and TUI */
export interface PromptCoachRpc {
  analyze(text: string): Promise<Analysis>;
  rewrite(text: string, deep?: boolean): Promise<string>;
  events: {
    warning: { score: number; oneLine: string };
  };
}
