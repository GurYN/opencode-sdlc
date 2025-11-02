import { tool } from "@opencode-ai/plugin";
import { $ } from "bun";
import {
  parseConventionalCommit,
  getCommitsSinceLastTag,
  categorizeCommits,
  generateChangelogSection,
  prependToChangelog,
  type ConventionalCommit,
} from "../lib/changelog-parser";

/**
 * Generate Changelog Tool
 *
 * Generate changelog from conventional commits since last release.
 * Updates CHANGELOG.md with categorized changes.
 */
export default tool({
  description: "Generate changelog from commits since last release, update CHANGELOG.md",
  args: {
    version: tool.schema
      .string()
      .describe("Version number for this release (e.g., 1.2.0, 2.0.0-beta.1)"),
  },
  async execute(args) {
    const { version } = args;
    const directory = process.cwd();

    // Get commits since last tag
    const commitLines = await getCommitsSinceLastTag($);

    if (commitLines.length === 0) {
      return "❌ No commits found since last release";
    }

    // Parse commits
    const commits = commitLines
      .map(parseConventionalCommit)
      .filter((c): c is ConventionalCommit => c !== null);

    // Categorize commits
    const categories = categorizeCommits(commits);

    // Generate changelog section
    const date = new Date().toISOString().split("T")[0];
    const changelogSection = generateChangelogSection(version, date, categories);

    // Update CHANGELOG.md
    prependToChangelog(directory, changelogSection);

    const stats = {
      total: commits.length,
      breaking: categories.breaking.length,
      features: categories.feat.length,
      fixes: categories.fix.length,
    };

    return `✅ Changelog generated for version ${version}\n\nStats: ${stats.total} commits (${stats.breaking} breaking, ${stats.features} features, ${stats.fixes} fixes)\n\n${changelogSection}`;
  },
});
