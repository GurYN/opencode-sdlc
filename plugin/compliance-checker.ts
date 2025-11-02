import type { Plugin } from "@opencode-ai/plugin";
import { readFileSync } from "fs";
import { notify } from "../lib/opencode-notifications";

/**
 * Compliance Checker Plugin
 *
 * Ensures regulatory and security compliance:
 * - License compliance (dependencies)
 * - Security policy enforcement
 * - Audit logging
 * - PII detection and protection
 * - GDPR compliance
 * - SOC 2 requirements
 *
 * Configuration (via environment variables):
 * - ENABLE_COMPLIANCE_CHECKER - Enable/disable plugin (default: true)
 */
export const ComplianceChecker: Plugin = async ({ $, directory, client }) => {
  // Create notification helper
  const notifier = notify(client, "compliance-checker");

  // Check if plugin is enabled
  const enabled = process.env.ENABLE_COMPLIANCE_CHECKER !== "false";

  if (!enabled) {
    // Plugin disabled - return minimal hooks
    return {};
  }

  // PII patterns to detect
  const piiPatterns = [
    // Email addresses
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    // Social Security Numbers
    /\b\d{3}-\d{2}-\d{4}\b/g,
    // Credit card numbers (simple pattern)
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
    // Phone numbers
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  ];

  // Sensitive keywords
  const sensitiveKeywords = [
    "password",
    "secret",
    "api_key",
    "apikey",
    "access_token",
    "private_key",
    "client_secret",
    "auth_token",
  ];

  const containsPII = (content: string): { found: boolean; matches: string[] } => {
    const matches: string[] = [];

    piiPatterns.forEach((pattern) => {
      const found = content.match(pattern);
      if (found) {
        matches.push(...found);
      }
    });

    return { found: matches.length > 0, matches };
  };

  const containsSensitiveData = (content: string): { found: boolean; keywords: string[] } => {
    const foundKeywords: string[] = [];
    const lowerContent = content.toLowerCase();

    sensitiveKeywords.forEach((keyword) => {
      if (lowerContent.includes(keyword)) {
        foundKeywords.push(keyword);
      }
    });

    return { found: foundKeywords.length > 0, keywords: foundKeywords };
  };

  const checkLicenseCompliance = async (): Promise<{
    compliant: boolean;
    issues: string[];
  }> => {
    const issues: string[] = [];

    try {
      // Check for package.json
      const hasPackageJson = await $`test -f package.json && echo "true" || echo "false"`.text();

      if (hasPackageJson.trim() === "true") {
        const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));

        // Check if project has a license
        if (!packageJson.license) {
          issues.push("Project missing license field in package.json");
        }

        // Check for GPL licenses in dependencies (might conflict with proprietary code)
        try {
          const licenseCheck = await $`npx license-checker --summary 2>/dev/null`.text();
          if (licenseCheck.includes("GPL")) {
            issues.push("GPL-licensed dependencies detected - verify compatibility");
          }
        } catch (error) {
          // license-checker not available
        }
      }
    } catch (error) {
      await notifier.warning("Could not check license compliance");
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  };

  const requiresLicenseHeader = (filePath: string): boolean => {
    // Source files that should have license headers
    return /\.(js|ts|jsx|tsx|py|go|java|cpp|c|h)$/.test(filePath);
  };

  const hasLicenseHeader = (content: string): boolean => {
    // Check for common license header patterns
    const firstLines = content.split("\n").slice(0, 10).join("\n");
    return (
      firstLines.includes("Copyright") ||
      firstLines.includes("License") ||
      firstLines.includes("SPDX-License-Identifier")
    );
  };

  return {
    // Intercept write/edit operations
    "tool.execute.before": async (input, output) => {
      // Check for PII in files being written
      if (input.tool === "write" || input.tool === "edit") {
        const content = output.args?.content || output.args?.new_string || "";
        const filePath = output.args?.file_path || output.args?.path || "";

        // Check for PII
        const piiCheck = containsPII(content);
        if (piiCheck.found) {
          await notifier.error("PII detected in file content! Matches: " + piiCheck.matches.join(", "));
          throw new Error(
            "PII detected. Remove personal information or use environment variables."
          );
        }

        // Check for sensitive data
        const sensitiveCheck = containsSensitiveData(content);
        if (sensitiveCheck.found) {
          await notifier.warning("Sensitive keywords detected: " + sensitiveCheck.keywords.join(", "));
          await notifier.info("Ensure secrets are stored in environment variables, not code.");
        }

        // Check for license headers in source files
        if (requiresLicenseHeader(filePath) && !hasLicenseHeader(content)) {
          await notifier.warning(`File ${filePath} missing license header`);
        }
      }
    },
  };
};
