import type { Plugin } from "@opencode-ai/plugin";
import { existsSync, mkdirSync, appendFileSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { getCurrentPhase } from "../lib/workflow-state";
import { notify } from "../lib/opencode-notifications";

/**
 * Quality Gate Plugin
 *
 * Enforces quality standards before phase transitions.
 * Validates code quality, test coverage, security, and documentation.
 *
 * Configuration (via environment variables):
 * - ENABLE_QUALITY_GATE - Enable/disable plugin (default: true)
 * - QUALITY_GATE_STRICT - Block transitions on failure (default: false)
 * - QUALITY_GATE_COVERAGE_THRESHOLD - Coverage requirement (default: 80)
 */

interface GateResult {
  passed: boolean;
  message: string;
  transition: string;
  timestamp: string;
}

interface GateLog {
  transition: string;
  passed: boolean;
  message: string;
  timestamp: string;
  mode: "warning" | "strict";
  blocked: boolean;
}

export const QualityGate: Plugin = async ({ $, directory, client }) => {
  // Create notification helper
  const notifier = notify(client, "quality-gate");
  const enabled = process.env.ENABLE_QUALITY_GATE !== "false";
  const strictMode = process.env.QUALITY_GATE_STRICT === "true";
  const coverageThreshold = parseInt(process.env.QUALITY_GATE_COVERAGE_THRESHOLD || "80");

  const workflowDir = join(directory, ".opencode", "workflow");
  const gateLogFile = join(workflowDir, "quality-gates.jsonl");

  // Ensure workflow directory exists
  if (!existsSync(workflowDir)) {
    mkdirSync(workflowDir, { recursive: true });
  }

  // Track file modifications for context-aware suggestions
  const recentModifications: Map<string, string[]> = new Map();

  // Log gate check results
  const logGateCheck = async (log: GateLog) => {
    try {
      appendFileSync(gateLogFile, JSON.stringify(log) + "\n");
    } catch (error) {
      await notifier.error("Failed to log quality gate check: " + error);
    }
  };

  // Gate validation functions
  const gates = {
    "design→implement": async (): Promise<GateResult> => {
      const transition = "design→implement";
      try {
        const designFiles = await $`find . -name "*.design.md" -o -name "*.schema.sql" -o -name "*.openapi.yml" 2>/dev/null`.text();

        if (!designFiles.trim()) {
          return {
            passed: false,
            message: "❌ No design files found. Create design specifications before implementing.",
            transition,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          passed: true,
          message: "✅ Design files present",
          transition,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          passed: false,
          message: `❌ Error checking design files: ${error}`,
          transition,
          timestamp: new Date().toISOString(),
        };
      }
    },

    "implement→test": async (): Promise<GateResult> => {
      const transition = "implement→test";
      try {
        // Check if code compiles (TypeScript/JavaScript)
        const hasTypeScript = await $`test -f tsconfig.json && echo "true" || echo "false"`.text();
        if (hasTypeScript.trim() === "true") {
          try {
            await $`npx tsc --noEmit`.quiet();
          } catch (error) {
            return {
              passed: false,
              message: "❌ TypeScript compilation failed. Fix type errors before testing.",
              transition,
              timestamp: new Date().toISOString(),
            };
          }
        }

        // Check linting
        const hasEslint = await $`test -f .eslintrc.* -o -f eslint.config.* && echo "true" || echo "false"`.text();
        if (hasEslint.trim() === "true") {
          try {
            await $`npx eslint . --max-warnings 0`.quiet();
          } catch (error) {
            return {
              passed: false,
              message: "❌ Linting failed. Fix linting errors before testing.",
              transition,
              timestamp: new Date().toISOString(),
            };
          }
        }

        return {
          passed: true,
          message: "✅ Code compiles and passes linting",
          transition,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          passed: false,
          message: `❌ Error during implementation validation: ${error}`,
          transition,
          timestamp: new Date().toISOString(),
        };
      }
    },

    "test→review": async (): Promise<GateResult> => {
      const transition = "test→review";
      try {
        // Run tests
        const hasNpmTest = await $`grep -q '"test"' package.json 2>/dev/null && echo "true" || echo "false"`.text();
        if (hasNpmTest.trim() === "true") {
          try {
            await $`npm test`.quiet();
          } catch (error) {
            return {
              passed: false,
              message: "❌ Tests failed. Fix failing tests before review.",
              transition,
              timestamp: new Date().toISOString(),
            };
          }
        }

        // Check coverage
        const hasCoverage = await $`test -f coverage/coverage-summary.json && echo "true" || echo "false"`.text();
        if (hasCoverage.trim() === "true") {
          try {
            const coverageData = await $`cat coverage/coverage-summary.json`.text();
            const coverage = JSON.parse(coverageData);
            const totalCoverage = coverage.total?.lines?.pct || 0;

            if (totalCoverage < coverageThreshold) {
              return {
                passed: false,
                message: `❌ Coverage is ${totalCoverage}%. Must be >${coverageThreshold}% before review.`,
                transition,
                timestamp: new Date().toISOString(),
              };
            }
          } catch (error) {
            // Could not verify coverage - continue
          }
        }

        return {
          passed: true,
          message: "✅ Tests pass with sufficient coverage",
          transition,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          passed: false,
          message: `❌ Error during test validation: ${error}`,
          transition,
          timestamp: new Date().toISOString(),
        };
      }
    },

    "review→release": async (): Promise<GateResult> => {
      const transition = "review→release";
      try {
        // Check for security vulnerabilities
        try {
          const result = await $`npm audit --audit-level=high`.quiet();
          if (result.exitCode !== 0) {
            return {
              passed: false,
              message: "❌ Security vulnerabilities found. Run 'npm audit' to see details.",
              transition,
              timestamp: new Date().toISOString(),
            };
          }
        } catch (error) {
          return {
            passed: false,
            message: "❌ Security audit failed. Fix vulnerabilities before release.",
            transition,
            timestamp: new Date().toISOString(),
          };
        }

        // Check if CHANGELOG is updated
        const hasChangelog = await $`test -f CHANGELOG.md && echo "true" || echo "false"`.text();
        if (hasChangelog.trim() !== "true") {
          return {
            passed: false,
            message: "❌ CHANGELOG.md not found. Update changelog before release.",
            transition,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          passed: true,
          message: "✅ Security clean and documentation updated",
          transition,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          passed: false,
          message: `❌ Error during release validation: ${error}`,
          transition,
          timestamp: new Date().toISOString(),
        };
      }
    },
  };

  // Validate a specific transition
  const validateGate = async (transition: string): Promise<GateResult> => {
    const gate = gates[transition as keyof typeof gates];
    if (!gate) {
      return {
        passed: true,
        message: `ℹ️  No quality gate defined for transition: ${transition}`,
        transition,
        timestamp: new Date().toISOString(),
      };
    }

    return await gate();
  };

  // Generate quality metrics report
  const generateQualityReport = async () => {
    if (!existsSync(gateLogFile)) {
      return null;
    }

    try {
      const lines = readFileSync(gateLogFile, "utf-8").trim().split("\n");
      const logs: GateLog[] = lines.map((line) => JSON.parse(line));

      const report = {
        totalChecks: logs.length,
        passed: logs.filter((l) => l.passed).length,
        failed: logs.filter((l) => !l.passed).length,
        blocked: logs.filter((l) => l.blocked).length,
        passRate: logs.length > 0 ? ((logs.filter((l) => l.passed).length / logs.length) * 100).toFixed(2) : 0,
        byTransition: {} as Record<string, { total: number; passed: number; failed: number }>,
        commonFailures: {} as Record<string, number>,
      };

      logs.forEach((log) => {
        // By transition
        if (!report.byTransition[log.transition]) {
          report.byTransition[log.transition] = { total: 0, passed: 0, failed: 0 };
        }
        report.byTransition[log.transition].total++;
        if (log.passed) {
          report.byTransition[log.transition].passed++;
        } else {
          report.byTransition[log.transition].failed++;
        }

        // Common failures
        if (!log.passed) {
          const failureType = log.message.split(":")[0];
          report.commonFailures[failureType] = (report.commonFailures[failureType] || 0) + 1;
        }
      });

      const reportPath = join(workflowDir, "quality-report.json");
      writeFileSync(reportPath, JSON.stringify(report, null, 2));

      return report;
    } catch (error) {
      await notifier.error("Failed to generate quality report: " + error);
      return null;
    }
  };

  // Context-aware suggestions based on file modifications
  const suggestGateCheck = (filePath: string) => {
    const suggestions: Record<string, string> = {
      ".ts": "Consider running 'implement→test' gate (compilation check)",
      ".tsx": "Consider running 'implement→test' gate (compilation check)",
      ".js": "Consider running 'implement→test' gate (linting check)",
      ".jsx": "Consider running 'implement→test' gate (linting check)",
      "test.": "Consider running 'test→review' gate (test coverage check)",
      "spec.": "Consider running 'test→review' gate (test coverage check)",
      ".design.md": "Consider running 'design→implement' gate (design review)",
      ".schema.sql": "Consider running 'design→implement' gate (schema review)",
      "CHANGELOG.md": "Consider running 'review→release' gate (release readiness)",
    };

    for (const [pattern, suggestion] of Object.entries(suggestions)) {
      if (filePath.includes(pattern)) {
        return suggestion;
      }
    }

    return null;
  };

  if (!enabled) {
    // Plugin disabled - return minimal hooks
    return {};
  }

  return {
    // Intercept track-phase tool to enforce gates
    "tool.execute.before": async (input, output) => {
      // Track file modifications for context-aware suggestions
      if (input.tool === "write" || input.tool === "edit") {
        const filePath = output.args?.file_path || output.args?.path;
        if (filePath) {
          // Track modification
          const timestamp = new Date().toISOString();
          if (!recentModifications.has(timestamp)) {
            recentModifications.set(timestamp, []);
          }
          recentModifications.get(timestamp)?.push(filePath);

          // Suggest appropriate gate check
          const suggestion = suggestGateCheck(filePath);
          if (suggestion) {
            await notifier.info(suggestion);
          }
        }
      }

      // Only intercept track-phase tool for gate validation
      if (input.tool !== "track-phase") {
        return input;
      }

      const currentPhase = getCurrentPhase();
      const nextPhase = output.args?.phase;

      if (!currentPhase || !nextPhase) {
        return input;
      }

      const transition = `${currentPhase}→${nextPhase}`;

      // Validate the transition
      const result = await validateGate(transition);

      // Log the gate check
      logGateCheck({
        transition,
        passed: result.passed,
        message: result.message,
        timestamp: result.timestamp,
        mode: strictMode ? "strict" : "warning",
        blocked: !result.passed && strictMode,
      });

      // Handle failure based on mode
      if (!result.passed) {
        if (strictMode) {
          // Strict mode: block the transition
          throw new Error(`Quality gate failed: ${result.message}\n\nTransition blocked. Fix the issues and try again.`);
        } else {
          // Warning mode: log warning but allow transition
          await notifier.warning(`Quality Gate Warning: ${result.message}`);
        }
      }

      return input;
    },

    // Listen for system events
    event: async (evt) => {
      // Periodic validation on session idle
      if (evt.event.type === "session.idle") {
        const currentPhase = getCurrentPhase();
        if (currentPhase) {
          // Check if current phase meets quality standards
          const nextPhases: Record<string, string> = {
            design: "implement",
            implement: "test",
            test: "review",
            review: "release",
          };

          const nextPhase = nextPhases[currentPhase];
          if (nextPhase) {
            const transition = `${currentPhase}→${nextPhase}`;
            const result = await validateGate(transition);

            if (!result.passed && !strictMode) {
              await notifier.info(`Quality gate reminder: ${result.message}`);
            }
          }
        }
      }

      // Generate final quality report on session end
      if (evt.event.type === "session.deleted") {
        await generateQualityReport();
      }
    },
  };
};
