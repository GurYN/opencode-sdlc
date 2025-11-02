import { tool } from "@opencode-ai/plugin";
import { $ } from "bun";
import { enrichContext } from "../lib/context-gatherer";

/**
 * Enrich Context Tool
 *
 * Get enriched project context including:
 * - Recent commits (last 10)
 * - Current git branch
 * - Test coverage status
 *
 * Note: File context (AGENTS.md, README.md, CLAUDE.md) is already
 * provided by Claude Code/OpenCode TUI automatically.
 */
export default tool({
  description: "Get enriched project context (recent commits, current branch, test coverage)",
  args: {},
  async execute() {
    const directory = process.cwd();
    const context = await enrichContext(directory, $);
    return context;
  },
});
