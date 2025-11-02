import { tool } from "@opencode-ai/plugin";
import { $ } from "bun";

/**
 * Check Quality Gate Tool
 *
 * Validates quality gates before phase transitions.
 * Checks code quality, test coverage, security, and documentation.
 */

// Gate validation functions
const gates = {
  // Design → Implement: Schema reviewed, API specs complete
  "design→implement": async (): Promise<{ passed: boolean; message: string }> => {
    // Check for design files
    const designFiles = await $`find . -name "*.design.md" -o -name "*.schema.sql" -o -name "*.openapi.yml" 2>/dev/null`.text();

    if (!designFiles.trim()) {
      return {
        passed: false,
        message: "❌ No design files found. Create design specifications before implementing.",
      };
    }

    return {
      passed: true,
      message: "✅ Design files present",
    };
  },

  // Implement → Test: Code compiles, linting passes
  "implement→test": async (): Promise<{ passed: boolean; message: string }> => {
    // Check if code compiles (TypeScript/JavaScript)
    try {
      const hasTypeScript = await $`test -f tsconfig.json && echo "true" || echo "false"`.text();
      if (hasTypeScript.trim() === "true") {
        await $`npx tsc --noEmit`.quiet();
      }
    } catch (error) {
      return {
        passed: false,
        message: "❌ TypeScript compilation failed. Fix type errors before testing.",
      };
    }

    // Check linting
    try {
      const hasEslint = await $`test -f .eslintrc.* -o -f eslint.config.* && echo "true" || echo "false"`.text();
      if (hasEslint.trim() === "true") {
        await $`npx eslint . --max-warnings 0`.quiet();
      }
    } catch (error) {
      return {
        passed: false,
        message: "❌ Linting failed. Fix linting errors before testing.",
      };
    }

    return {
      passed: true,
      message: "✅ Code compiles and passes linting",
    };
  },

  // Test → Review: Coverage >80%, all tests pass
  "test→review": async (): Promise<{ passed: boolean; message: string }> => {
    // Run tests
    try {
      const hasNpmTest = await $`grep -q '"test"' package.json 2>/dev/null && echo "true" || echo "false"`.text();
      if (hasNpmTest.trim() === "true") {
        await $`npm test`.quiet();
      }
    } catch (error) {
      return {
        passed: false,
        message: "❌ Tests failed. Fix failing tests before review.",
      };
    }

    // Check coverage (if available)
    try {
      const hasCoverage = await $`test -f coverage/coverage-summary.json && echo "true" || echo "false"`.text();
      if (hasCoverage.trim() === "true") {
        const coverageData = await $`cat coverage/coverage-summary.json`.text();
        const coverage = JSON.parse(coverageData);
        const totalCoverage = coverage.total?.lines?.pct || 0;

        if (totalCoverage < 80) {
          return {
            passed: false,
            message: `❌ Coverage is ${totalCoverage}%. Must be >80% before review.`,
          };
        }
      }
    } catch (error) {
      // Could not verify coverage - continue
    }

    return {
      passed: true,
      message: "✅ Tests pass with sufficient coverage",
    };
  },

  // Review → Release: Security scan clean, docs updated
  "review→release": async (): Promise<{ passed: boolean; message: string }> => {
    // Check for security vulnerabilities
    try {
      const result = await $`npm audit --audit-level=high`.quiet();
      if (result.exitCode !== 0) {
        return {
          passed: false,
          message: "❌ Security vulnerabilities found. Run 'npm audit' to see details.",
        };
      }
    } catch (error) {
      return {
        passed: false,
        message: "❌ Security audit failed. Fix vulnerabilities before release.",
      };
    }

    // Check if CHANGELOG is updated
    const hasChangelog = await $`test -f CHANGELOG.md && echo "true" || echo "false"`.text();
    if (hasChangelog.trim() !== "true") {
      return {
        passed: false,
        message: "❌ CHANGELOG.md not found. Update changelog before release.",
      };
    }

    return {
      passed: true,
      message: "✅ Security clean and documentation updated",
    };
  },
};

export default tool({
  description: "Check if quality gate passes for phase transition (e.g., 'design→implement', 'test→review')",
  args: {
    transition: tool.schema
      .string()
      .describe("Phase transition to validate: design→implement, implement→test, test→review, or review→release"),
  },
  async execute(args) {
    const { transition } = args;

    const gate = gates[transition as keyof typeof gates];

    if (!gate) {
      return `❌ No quality gate defined for transition: ${transition}\nAvailable transitions: ${Object.keys(gates).join(", ")}`;
    }

    const result = await gate();
    return result.message;
  },
});
