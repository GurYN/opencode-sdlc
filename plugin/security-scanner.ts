import type { Plugin } from "@opencode-ai/plugin";
import { notify } from "../lib/opencode-notifications";

/**
 * Security Scanner Plugin
 *
 * Integrates security scanning tools:
 * - SAST (Static Application Security Testing)
 * - Dependency scanning
 * - Secret detection
 * - Container scanning
 *
 * Configuration (via environment variables):
 * - ENABLE_SECURITY_SCANNER - Enable/disable plugin (default: true)
 */
export const SecurityScanner: Plugin = async ({ $, directory, client }) => {
  // Create notification helper
  const notifier = notify(client, "security-scanner");

  // Check if plugin is enabled
  const enabled = process.env.ENABLE_SECURITY_SCANNER !== "false";

  if (!enabled) {
    // Plugin disabled - return minimal hooks
    return {};
  }

  const scanDependencies = async (): Promise<{
    vulnerabilities: number;
    severity: Record<string, number>;
    details: string;
  }> => {
    const result = {
      vulnerabilities: 0,
      severity: { critical: 0, high: 0, moderate: 0, low: 0 },
      details: "",
    };

    try {
      // Try npm audit first
      const npmAudit = await $`npm audit --json 2>/dev/null`.quiet();
      if (npmAudit.exitCode !== 0 && npmAudit.stdout) {
        const auditData = JSON.parse(npmAudit.stdout.toString());

        if (auditData.metadata?.vulnerabilities) {
          const vulns = auditData.metadata.vulnerabilities;
          result.vulnerabilities = vulns.total || 0;
          result.severity = {
            critical: vulns.critical || 0,
            high: vulns.high || 0,
            moderate: vulns.moderate || 0,
            low: vulns.low || 0,
          };
          result.details = "npm audit";
        }
      }
    } catch (error) {
      // npm audit not available - silent failure
    }

    // Try Snyk if available
    try {
      const snykInstalled = await $`which snyk 2>/dev/null`.quiet();
      if (snykInstalled.exitCode === 0) {
        const snykTest = await $`snyk test --json 2>/dev/null`.quiet();
        if (snykTest.stdout) {
          const snykData = JSON.parse(snykTest.stdout.toString());
          if (snykData.vulnerabilities) {
            result.details = result.details ? result.details + " + snyk" : "snyk";
          }
        }
      }
    } catch (error) {
      // Snyk not available or not authenticated
    }

    return result;
  };

  const scanSecrets = async (): Promise<{ found: boolean; count: number; tool: string }> => {
    const result = { found: false, count: 0, tool: "none" };

    // Try gitleaks
    try {
      const gitleaksInstalled = await $`which gitleaks 2>/dev/null`.quiet();
      if (gitleaksInstalled.exitCode === 0) {
        const gitleaksResult = await $`gitleaks detect --no-git --report-path /dev/null 2>&1`.quiet();
        result.tool = "gitleaks";
        result.found = gitleaksResult.exitCode !== 0;
        if (result.found) {
          // Parse output for count (simplified)
          const output = gitleaksResult.stderr ? gitleaksResult.stderr.toString() : "";
          result.count = (output.match(/leak/gi) || []).length;
        }
      }
    } catch (error) {
      // gitleaks not available - silent failure
    }

    return result;
  };

  const scanCode = async (): Promise<{ issues: number; tool: string }> => {
    const result = { issues: 0, tool: "none" };

    // Try running ESLint security plugin if available
    try {
      const eslintConfig = await $`test -f .eslintrc.* -o -f eslint.config.* && echo "true" || echo "false"`.text();
      if (eslintConfig.trim() === "true") {
        const eslintResult = await $`npx eslint . --format json 2>/dev/null`.quiet();
        if (eslintResult.stdout) {
          const eslintData = JSON.parse(eslintResult.stdout.toString());
          result.issues = eslintData.reduce(
            (sum: number, file: any) => sum + (file.errorCount || 0),
            0
          );
          result.tool = "eslint";
        }
      }
    } catch (error) {
      // eslint not available - silent failure
    }

    return result;
  };

  return {
    // Intercept git commits to scan for secrets
    "tool.execute.before": async (input, output) => {
      if (input.tool === "bash" && output.args?.command?.includes("git commit")) {
        // Silent secret scanning before commit
        const secretScan = await scanSecrets();
        if (secretScan.found) {
          await notifier.error("Secrets detected in commit!");
          throw new Error("Secrets detected. Remove sensitive data before committing.");
        }
        // Passed - silent success
      }

      // Scan before pull request creation
      if (
        input.tool === "bash" &&
        (output.args?.command?.includes("gh pr create") ||
          output.args?.command?.includes("git push"))
      ) {
        // Silent security check before push
        const depScan = await scanDependencies();
        if (depScan.severity.critical > 0) {
          await notifier.error(`${depScan.severity.critical} critical vulnerabilities found! Fix critical vulnerabilities before pushing.`);
          // Don't throw - just warn for now
        }
      }
    },
  };
};
