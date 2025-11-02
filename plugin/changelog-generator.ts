import type { Plugin } from "@opencode-ai/plugin";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { notify } from "../lib/opencode-notifications";

/**
 * Changelog Generator Plugin
 *
 * Automatically generates changelogs from commits:
 * - Parses conventional commits
 * - Categorizes changes (feat, fix, breaking)
 * - Generates markdown changelog
 * - Updates CHANGELOG.md
 *
 * Configuration (via environment variables):
 * - ENABLE_CHANGELOG_GENERATOR - Enable/disable plugin (default: true)
 * - CHANGELOG_AUTO_GENERATE - Auto-generate on tag creation (default: false)
 * - CHANGELOG_INCLUDE_SCOPES - Include commit scopes (default: true)
 */
export const ChangelogGenerator: Plugin = async ({ $, directory, client }) => {
  // Create notification helper
  const notifier = notify(client, "changelog-generator");
  // Check if plugin is enabled
  const enabled = process.env.ENABLE_CHANGELOG_GENERATOR !== "false";
  const autoGenerate = process.env.CHANGELOG_AUTO_GENERATE === "true";
  const includeScopes = process.env.CHANGELOG_INCLUDE_SCOPES !== "false";

  if (!enabled) {
    // Plugin disabled - return minimal hooks
    return {};
  }


  interface ConventionalCommit {
    type: string;
    scope?: string;
    breaking: boolean;
    subject: string;
    hash: string;
  }

  const parseConventionalCommit = (commitLine: string): ConventionalCommit | null => {
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
  };

  const wasChangelogIncludedInCommit = async (): Promise<boolean> => {
    try {
      // Check if CHANGELOG.md was in the last commit
      const changedFiles = await $`git diff --name-only HEAD~1 HEAD 2>/dev/null`.text();
      return changedFiles.includes("CHANGELOG.md");
    } catch (error) {
      // Could be first commit or git command failed
      return false;
    }
  };

  const getCommitsSinceLastTag = async (): Promise<string[]> => {
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
  };

  const categorizeCommits = (commits: ConventionalCommit[]) => {
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
  };

  const generateChangelogSection = (
    version: string,
    date: string,
    categories: ReturnType<typeof categorizeCommits>
  ): string => {
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
        const scope = includeScopes && c.scope ? `**${c.scope}**: ` : "";
        sections.push(`- ${scope}${c.subject} (${c.hash})`);
      });
      sections.push("");
    }

    if (categories.fix.length > 0) {
      sections.push("### 🐛 Bug Fixes\n");
      categories.fix.forEach((c) => {
        const scope = includeScopes && c.scope ? `**${c.scope}**: ` : "";
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
  };

  const createInitialChangelog = async () => {
    const changelogPath = join(directory, "CHANGELOG.md");

    const initialContent = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

<!-- Changes will be added here automatically -->
`;

    writeFileSync(changelogPath, initialContent);
    await notifier.success("Created initial CHANGELOG.md file");
  };

  const prependToChangelog = async (newSection: string) => {
    const changelogPath = join(directory, "CHANGELOG.md");
    let existingContent = "";

    if (existsSync(changelogPath)) {
      existingContent = readFileSync(changelogPath, "utf-8");
      // Remove the header if it exists
      existingContent = existingContent.replace(/^# Changelog\n+/, "");
    } else {
      // Create initial changelog if it doesn't exist
      await createInitialChangelog();
      return prependToChangelog(newSection); // Retry after creation
    }

    const newContent = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n${newSection}\n${existingContent}`;

    writeFileSync(changelogPath, newContent);
  };

  const generateChangelog = async (version: string) => {
    const commitLines = await getCommitsSinceLastTag();

    if (commitLines.length === 0) {
      await notifier.info("No commits found since last release");
      return;
    }

    const commits = commitLines
      .map(parseConventionalCommit)
      .filter((c): c is ConventionalCommit => c !== null);

    const categories = categorizeCommits(commits);
    const date = new Date().toISOString().split("T")[0];
    const changelogSection = generateChangelogSection(version, date, categories);

    await prependToChangelog(changelogSection);

    const stats = {
      total: commits.length,
      breaking: categories.breaking.length,
      features: categories.feat.length,
      fixes: categories.fix.length,
    };

    await notifier.success(
      `Changelog generated for version ${version} - Updated CHANGELOG.md with ${stats.total} changes (${stats.features} features, ${stats.fixes} fixes${stats.breaking > 0 ? `, ${stats.breaking} breaking` : ""})`
    );
  };

  const checkChangelogFreshness = async (): Promise<boolean> => {
    // Check if there are unreleased commits since last tag
    const commitLines = await getCommitsSinceLastTag();
    return commitLines.length > 0;
  };

  const extractVersionFromTag = (command: string): string | null => {
    // Extract version from git tag commands
    // Examples: git tag v1.0.0, git tag -a v1.0.0 -m "message"
    const tagMatch = command.match(/git\s+tag\s+(?:-a\s+)?([^\s]+)/);
    if (tagMatch) {
      return tagMatch[1].replace(/^v/, ""); // Remove leading 'v'
    }
    return null;
  };

  const getPackageVersion = (): string | null => {
    try {
      const packagePath = join(directory, "package.json");
      if (existsSync(packagePath)) {
        const packageData = JSON.parse(readFileSync(packagePath, "utf-8"));
        return packageData.version;
      }
    } catch (error) {
      // No package.json or invalid JSON
    }
    return null;
  };

  // Track previous package.json version for change detection
  let previousVersion: string | null = getPackageVersion();

  return {
    "tool.execute.before": async (input, output) => {
      // 1. Git commit - Track that a commit is happening
      if (input.tool === "bash" && output.args?.command?.includes("git commit")) {
        // Store the command for the after hook
        (globalThis as any).__pendingGitCommit = true;
      }

      // 2. Git tag creation - Auto-generate or suggest changelog
      if (input.tool === "bash" && output.args?.command?.includes("git tag")) {
        const version = extractVersionFromTag(output.args.command);

        if (version) {
          const hasUnreleasedCommits = await checkChangelogFreshness();

          if (hasUnreleasedCommits) {
            if (autoGenerate) {
              // Auto-generate changelog
              await generateChangelog(version);
            } else {
              // Suggest changelog generation
              await notifier.info(
                `Creating tag ${version}. Generate changelog with: generate-changelog tool with version "${version}"`
              );
            }
          }
        }
      }

      // 3. Deployment commands - Warn if changelog is outdated
      if (
        input.tool === "bash" &&
        (output.args?.command?.includes("npm publish") ||
          output.args?.command?.includes("deploy") ||
          output.args?.command?.includes("docker push"))
      ) {
        const hasUnreleasedCommits = await checkChangelogFreshness();

        if (hasUnreleasedCommits) {
          await notifier.warning("Unreleased commits detected. Consider updating CHANGELOG.md before deployment.");
        } else {
          const changelogPath = join(directory, "CHANGELOG.md");
          if (existsSync(changelogPath)) {
            await notifier.success("CHANGELOG.md is up to date");
          }
        }
      }

      // 4. Version bump detection in package.json
      if (input.tool === "edit" || input.tool === "write") {
        const filePath = output.args?.file_path || output.args?.path;

        if (filePath?.includes("package.json")) {
          // Check after edit completes
          setTimeout(async () => {
            const newVersion = getPackageVersion();

            if (newVersion && newVersion !== previousVersion) {
              previousVersion = newVersion;

              const hasUnreleasedCommits = await checkChangelogFreshness();

              if (hasUnreleasedCommits) {
                await notifier.info(
                  `Version bumped to ${newVersion}. Generate changelog with: generate-changelog tool with version "${newVersion}"`
                );
              }
            }
          }, 100);
        }
      }

      // 5. Track-phase to release - Suggest changelog check
      if (input.tool === "track-phase" && output.args?.phase === "release") {
        const hasUnreleasedCommits = await checkChangelogFreshness();

        if (hasUnreleasedCommits) {
          const version = getPackageVersion() || "next";
          await notifier.info(
            `Moving to release phase. Generate changelog with: generate-changelog tool with version "${version}"`
          );
        }
      }
    },

    "tool.execute.after": async (input, output) => {
      // Check if a git commit just completed
      if ((globalThis as any).__pendingGitCommit) {
        (globalThis as any).__pendingGitCommit = false;

        // Check if the commit was successful (output doesn't contain error messages)
        if (output.output && !output.output.includes("nothing to commit")) {
          // Create CHANGELOG.md if it doesn't exist
          const changelogPath = join(directory, "CHANGELOG.md");
          if (!existsSync(changelogPath)) {
            await createInitialChangelog();
          }

          const changelogIncluded = await wasChangelogIncludedInCommit();

          if (!changelogIncluded) {
            await notifier.info("Don't forget to update CHANGELOG.md for this commit!");
          }
        }
      }
    },
  };
};
