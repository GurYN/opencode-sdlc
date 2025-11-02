import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * Changelog Parser
 *
 * Shared utilities for parsing conventional commits and generating changelogs.
 */

export interface ConventionalCommit {
  type: string;
  scope?: string;
  breaking: boolean;
  subject: string;
  hash: string;
}

export function parseConventionalCommit(commitLine: string): ConventionalCommit | null {
  // Format: hash message
  const [hash, ...messageParts] = commitLine.split(" ");
  const message = messageParts.join(" ");

  // Parse conventional commit format: type(scope)!: subject
  const conventionalRegex = /^(\w+)(?:\(([^)]+)\))?(!)?: (.+)$/;
  const match = message.match(conventionalRegex);

  if (!match) {
    // Not a conventional commit, treat as misc
    return {
      type: "misc",
      breaking: false,
      subject: message,
      hash,
    };
  }

  return {
    type: match[1],
    scope: match[2],
    breaking: !!match[3],
    subject: match[4],
    hash,
  };
}

export async function getCommitsSinceLastTag($: any): Promise<string[]> {
  try {
    // Get last tag
    const lastTag = await $`git describe --tags --abbrev=0 2>/dev/null`.text();

    if (lastTag.trim()) {
      // Get commits since last tag
      const commits = await $`git log ${lastTag.trim()}..HEAD --oneline`.text();
      return commits.trim().split("\n").filter(Boolean);
    }
  } catch (error) {
    // No tags yet
  }

  // If no tags, get all commits
  try {
    const commits = await $`git log --oneline`.text();
    return commits.trim().split("\n").filter(Boolean);
  } catch (error) {
    return [];
  }
}

export function categorizeCommits(commits: ConventionalCommit[]) {
  const categories = {
    breaking: [] as ConventionalCommit[],
    feat: [] as ConventionalCommit[],
    fix: [] as ConventionalCommit[],
    perf: [] as ConventionalCommit[],
    refactor: [] as ConventionalCommit[],
    docs: [] as ConventionalCommit[],
    test: [] as ConventionalCommit[],
    chore: [] as ConventionalCommit[],
    misc: [] as ConventionalCommit[],
  };

  commits.forEach((commit) => {
    if (commit.breaking) {
      categories.breaking.push(commit);
    }

    const category = categories[commit.type as keyof typeof categories];
    if (category) {
      category.push(commit);
    } else {
      categories.misc.push(commit);
    }
  });

  return categories;
}

export function generateChangelogSection(
  version: string,
  date: string,
  categories: ReturnType<typeof categorizeCommits>
): string {
  const sections: string[] = [];

  sections.push(`## [${version}] - ${date}\n`);

  if (categories.breaking.length > 0) {
    sections.push("### 💥 Breaking Changes\n");
    categories.breaking.forEach((c) => {
      sections.push(`- ${c.subject} (${c.hash})`);
    });
    sections.push("");
  }

  if (categories.feat.length > 0) {
    sections.push("### ✨ Features\n");
    categories.feat.forEach((c) => {
      const scope = c.scope ? `**${c.scope}**: ` : "";
      sections.push(`- ${scope}${c.subject} (${c.hash})`);
    });
    sections.push("");
  }

  if (categories.fix.length > 0) {
    sections.push("### 🐛 Bug Fixes\n");
    categories.fix.forEach((c) => {
      const scope = c.scope ? `**${c.scope}**: ` : "";
      sections.push(`- ${scope}${c.subject} (${c.hash})`);
    });
    sections.push("");
  }

  if (categories.perf.length > 0) {
    sections.push("### ⚡ Performance\n");
    categories.perf.forEach((c) => {
      sections.push(`- ${c.subject} (${c.hash})`);
    });
    sections.push("");
  }

  if (categories.docs.length > 0) {
    sections.push("### 📚 Documentation\n");
    categories.docs.forEach((c) => {
      sections.push(`- ${c.subject} (${c.hash})`);
    });
    sections.push("");
  }

  if (categories.refactor.length > 0) {
    sections.push("### 🔧 Refactoring\n");
    categories.refactor.forEach((c) => {
      sections.push(`- ${c.subject} (${c.hash})`);
    });
    sections.push("");
  }

  return sections.join("\n");
}

export function prependToChangelog(directory: string, newSection: string): void {
  const changelogPath = join(directory, "CHANGELOG.md");
  let existingContent = "";

  if (existsSync(changelogPath)) {
    existingContent = readFileSync(changelogPath, "utf-8");
    // Remove the header if it exists
    existingContent = existingContent.replace(/^# Changelog\n+/, "");
  }

  const newContent = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n${newSection}\n${existingContent}`;

  writeFileSync(changelogPath, newContent);
}
