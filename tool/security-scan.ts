import { tool } from "@opencode-ai/plugin";
import { $ } from "bun";
import { scanDependencies, scanSecrets, scanCode } from "../lib/security-scanners";

/**
 * Security Scan Tool
 *
 * Run comprehensive security scan including:
 * - Dependency vulnerabilities (npm audit, Snyk)
 * - Secret detection (gitleaks)
 * - Code analysis (ESLint security plugins)
 */
export default tool({
  description: "Run comprehensive security scan on the project (dependencies, secrets, code)",
  args: {},
  async execute() {
    const results = {
      timestamp: new Date().toISOString(),
      scans: {} as Record<string, any>,
      criticalIssues: 0,
      highIssues: 0,
    };

    // Scan dependencies
    const depScan = await scanDependencies($);
    results.scans.dependencies = depScan;
    results.criticalIssues += depScan.severity.critical;
    results.highIssues += depScan.severity.high;

    // Scan for secrets
    const secretScan = await scanSecrets($);
    results.scans.secrets = secretScan;
    if (secretScan.found) {
      results.criticalIssues += secretScan.count;
    }

    // Scan code
    const codeScan = await scanCode($);
    results.scans.code = codeScan;

    return JSON.stringify(results, null, 2);
  },
});
