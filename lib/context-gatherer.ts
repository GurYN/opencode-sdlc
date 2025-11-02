import { existsSync, readFileSync } from "fs";

/**
 * Context Gatherer
 *
 * Shared utilities for gathering project context information.
 * Note: AGENTS.md/README.md/CLAUDE.md are already handled by Claude Code/OpenCode TUI,
 * so we only gather git info and test status here.
 */

export async function getRecentCommits($: any): Promise<string> {
  try {
    const commits = await $`git log -10 --oneline --no-decorate 2>/dev/null`.text();
    if (commits.trim()) {
      return "## Recent Commits\n\n" + commits.trim();
    }
  } catch (error) {
    // Git not available or not a git repo
  }
  return "";
}

export async function getCurrentBranch($: any): Promise<string> {
  try {
    const branch = await $`git branch --show-current 2>/dev/null`.text();
    if (branch.trim()) {
      return `Current branch: ${branch.trim()}`;
    }
  } catch (error) {
    // Git not available
  }
  return "";
}

export async function getTestStatus($: any): Promise<string> {
  try {
    // Check if tests passed recently
    const hasCoverage = await $`test -f coverage/coverage-summary.json && echo "true" || echo "false"`.text();
    if (hasCoverage.trim() === "true") {
      const coverageData = await $`cat coverage/coverage-summary.json`.text();
      const coverage = JSON.parse(coverageData);
      const totalCoverage = coverage.total?.lines?.pct || 0;
      return `## Test Status\n\nCoverage: ${totalCoverage}%`;
    }
  } catch (error) {
    // Coverage not available
  }
  return "";
}

export async function enrichContext(directory: string, $: any): Promise<string> {
  const contextParts: string[] = [];

  // Gather git and test context (file context already handled by TUI)
  const branch = await getCurrentBranch($);
  if (branch) contextParts.push(branch);

  const commits = await getRecentCommits($);
  if (commits) contextParts.push(commits);

  const testStatus = await getTestStatus($);
  if (testStatus) contextParts.push(testStatus);

  return contextParts.join("\n\n---\n\n");
}
