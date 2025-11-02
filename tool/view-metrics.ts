import { tool } from "@opencode-ai/plugin";
import { initializeMetricsDir, loadMetrics } from "../lib/metrics-storage";

/**
 * View Metrics Tool
 *
 * View collected SDLC metrics and trends including:
 * - Test coverage history
 * - Build time trends
 * - Deployment frequency
 * - Code complexity
 */
export default tool({
  description: "View collected SDLC metrics and trends (coverage, build times, deployments, complexity)",
  args: {},
  async execute() {
    const directory = process.cwd();
    const metricsDir = initializeMetricsDir(directory);
    const metrics = loadMetrics(metricsDir);

    // Calculate trends
    const recentCoverage = metrics.coverageHistory.slice(-10);
    const avgCoverage =
      recentCoverage.reduce((sum, m) => sum + m.coverage, 0) / recentCoverage.length || 0;

    const recentBuilds = metrics.buildTimes.slice(-10);
    const avgBuildTime =
      recentBuilds.reduce((sum, m) => sum + m.duration, 0) / recentBuilds.length || 0;

    const report = {
      summary: {
        totalDeployments: metrics.deployments,
        totalTestRuns: metrics.testRuns,
        averageCoverage: avgCoverage.toFixed(2) + "%",
        averageBuildTime: avgBuildTime.toFixed(0) + "ms",
      },
      complexity: metrics.complexity,
      trends: {
        coverageHistory: recentCoverage,
        buildTimeHistory: recentBuilds,
      },
      lastUpdated: metrics.lastUpdated,
    };

    return JSON.stringify(report, null, 2);
  },
});
