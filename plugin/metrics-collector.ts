import type { Plugin } from "@opencode-ai/plugin";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { notify } from "../lib/opencode-notifications";

/**
 * Metrics Collector Plugin
 *
 * Collects and reports SDLC metrics including:
 * - Code complexity
 * - Test coverage trends
 * - Build time trends
 * - Deployment frequency
 * - Lead time and MTTR
 *
 * Configuration (via environment variables):
 * - ENABLE_METRICS_COLLECTOR - Enable/disable metrics collection (default: true)
 */
export const MetricsCollector: Plugin = async ({ $, directory, client }) => {
  // Create notification helper
  const notifier = notify(client, "metrics-collector");

  // Check if plugin is enabled
  const enabled = process.env.ENABLE_METRICS_COLLECTOR !== "false";

  if (!enabled) {
    // Plugin disabled - return minimal hooks
    return {};
  }

  const metricsDir = join(directory, ".opencode", "metrics");
  const metricsFile = join(metricsDir, "metrics.json");

  // Ensure metrics directory exists
  if (!existsSync(metricsDir)) {
    mkdirSync(metricsDir, { recursive: true });
  }

  interface Metrics {
    deployments: number;
    testRuns: number;
    coverageHistory: Array<{ timestamp: string; coverage: number }>;
    buildTimes: Array<{ timestamp: string; duration: number }>;
    complexity: Record<string, number>;
    lastUpdated: string;
  }

  const loadMetrics = (): Metrics => {
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
  };

  const saveMetrics = (metrics: Metrics) => {
    metrics.lastUpdated = new Date().toISOString();
    writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
  };

  const collectCoverage = async () => {
    try {
      const hasCoverage = await $`test -f coverage/coverage-summary.json && echo "true" || echo "false"`.text();
      if (hasCoverage.trim() === "true") {
        const coverageData = await $`cat coverage/coverage-summary.json`.text();
        const coverage = JSON.parse(coverageData);
        return coverage.total?.lines?.pct || 0;
      }
    } catch (error) {
      await notifier.warning("Could not collect coverage data");
    }
    return null;
  };

  const collectComplexity = async (): Promise<{ sourceFiles: number; testFiles: number }> => {
    try {
      // Simple complexity metric: count lines of code by file type
      const jsFiles = await $`find . -name "*.js" -o -name "*.ts" | wc -l`.text();
      const testFiles = await $`find . -name "*.test.*" -o -name "*.spec.*" | wc -l`.text();

      return {
        sourceFiles: parseInt(jsFiles.trim()) - parseInt(testFiles.trim()),
        testFiles: parseInt(testFiles.trim()),
      };
    } catch (error) {
      await notifier.warning("Could not collect complexity data");
      return {
        sourceFiles: 0,
        testFiles: 0,
      };
    }
  };

  return {
    // Track test runs
    "tool.execute.before": async (input, output) => {
      if (input.tool === "bash" && output.args?.command?.includes("test")) {
        const metrics = loadMetrics();
        metrics.testRuns++;

        const startTime = Date.now();

        // This is a simplified version - in production, you'd hook into after
        setTimeout(async () => {
          const duration = Date.now() - startTime;
          const coverage = await collectCoverage();

          if (coverage !== null) {
            metrics.coverageHistory.push({
              timestamp: new Date().toISOString(),
              coverage,
            });
          }

          metrics.buildTimes.push({
            timestamp: new Date().toISOString(),
            duration,
          });

          saveMetrics(metrics);
          // Silent background tracking
        }, 100);
      }

      // Track deployments
      if (
        input.tool === "bash" &&
        (output.args?.command?.includes("deploy") || output.args?.command?.includes("release"))
      ) {
        const metrics = loadMetrics();
        metrics.deployments++;
        saveMetrics(metrics);
        // Silent background tracking
      }
    },

    // Listen for session events
    event: async (evt) => {
      if (evt.event.type === "session.deleted") {
        const metrics = loadMetrics();
        const complexity = await collectComplexity();

        metrics.complexity = {
          ...metrics.complexity,
          ...complexity,
          timestamp: Date.now(),
        };

        saveMetrics(metrics);
        // Silent background tracking
      }
    },
  };
};
