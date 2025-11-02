import { readFileSync } from "fs";

/**
 * Compliance Utilities
 *
 * Shared utilities for PII detection, sensitive data scanning, and license compliance.
 */

// PII patterns to detect
export const piiPatterns = [
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
export const sensitiveKeywords = [
  "password",
  "secret",
  "api_key",
  "apikey",
  "access_token",
  "private_key",
  "client_secret",
  "auth_token",
];

export function containsPII(content: string): { found: boolean; matches: string[] } {
  const matches: string[] = [];

  piiPatterns.forEach((pattern) => {
    const found = content.match(pattern);
    if (found) {
      matches.push(...found);
    }
  });

  return { found: matches.length > 0, matches };
}

export function containsSensitiveData(content: string): { found: boolean; keywords: string[] } {
  const foundKeywords: string[] = [];
  const lowerContent = content.toLowerCase();

  sensitiveKeywords.forEach((keyword) => {
    if (lowerContent.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  });

  return { found: foundKeywords.length > 0, keywords: foundKeywords };
}

export async function checkLicenseCompliance($: any): Promise<{
  compliant: boolean;
  issues: string[];
}> {
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
    // Silent failure - license-checker not available
  }

  return {
    compliant: issues.length === 0,
    issues,
  };
}

export function requiresLicenseHeader(filePath: string): boolean {
  // Source files that should have license headers
  return /\.(js|ts|jsx|tsx|py|go|java|cpp|c|h)$/.test(filePath);
}

export function hasLicenseHeader(content: string): boolean {
  // Check for common license header patterns
  const firstLines = content.split("\n").slice(0, 10).join("\n");
  return (
    firstLines.includes("Copyright") ||
    firstLines.includes("License") ||
    firstLines.includes("SPDX-License-Identifier")
  );
}
