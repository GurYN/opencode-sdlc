/**
 * Security Scanners
 *
 * Shared utilities for security scanning: dependencies, secrets, and code analysis.
 */

export async function scanDependencies($: any): Promise<{
  vulnerabilities: number;
  severity: Record<string, number>;
  details: string;
}> {
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
    // Silent failure - npm audit not available
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
}

export async function scanSecrets($: any): Promise<{ found: boolean; count: number; tool: string }> {
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
    // Silent failure - gitleaks not available
  }

  return result;
}

export async function scanCode($: any): Promise<{ issues: number; tool: string }> {
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
    // Silent failure - eslint not available
  }

  return result;
}
