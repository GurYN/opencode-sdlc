import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

/**
 * Metrics Storage Utilities
 *
 * Shared utilities for collecting and storing SDLC metrics.
 */

export interface Metrics {
  deployments: number;
  testRuns: number;
  coverageHistory: Array<{ timestamp: string; coverage: number }>;
  buildTimes: Array<{ timestamp: string; duration: number }>;
  complexity: Record<string, any>;
  lastUpdated: string;
}

export function initializeMetricsDir(directory: string): string {
  const metricsDir = join(directory, ".opencode", "metrics");
  if (!existsSync(metricsDir)) {
    mkdirSync(metricsDir, { recursive: true });
  }
  return metricsDir;
}

export function loadMetrics(metricsDir: string): Metrics {
  const metricsFile = join(metricsDir, "metrics.json");

  if (existsSync(metricsFile)) {
    return JSON.parse(readFileSync(metricsFile, "utf-8"));
  }

  return {
    deployments: 0,
    testRuns: 0,
    coverageHistory: [],
    buildTimes: [],
    complexity: {},
    lastUpdated: new Date().toISOString(),
  };
}

export function saveMetrics(metricsDir: string, metrics: Metrics): void {
  const metricsFile = join(metricsDir, "metrics.json");
  metrics.lastUpdated = new Date().toISOString();
  writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
}

export async function collectCoverage($: any): Promise<number | null> {
  try {
    const hasCoverage = await $`test -f coverage/coverage-summary.json && echo "true" || echo "false"`.text();
    if (hasCoverage.trim() === "true") {
      const coverageData = await $`cat coverage/coverage-summary.json`.text();
      const coverage = JSON.parse(coverageData);
      return coverage.total?.lines?.pct || 0;
    }
  } catch (error) {
    // Silent failure - coverage data not available
  }
  return null;
}

export async function collectComplexity($: any): Promise<{ sourceFiles: number; testFiles: number }> {
  try {
    // Simple complexity metric: count lines of code by file type
    const jsFiles = await $`find . -name "*.js" -o -name "*.ts" | wc -l`.text();
    const testFiles = await $`find . -name "*.test.*" -o -name "*.spec.*" | wc -l`.text();

    return {
      sourceFiles: parseInt(jsFiles.trim()) - parseInt(testFiles.trim()),
      testFiles: parseInt(testFiles.trim()),
    };
  } catch (error) {
    // Silent failure - complexity data not available
    return {
      sourceFiles: 0,
      testFiles: 0,
    };
  }
}
