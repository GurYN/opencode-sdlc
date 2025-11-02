import type { Plugin } from "@opencode-ai/plugin";
import { existsSync, mkdirSync, writeFileSync, appendFileSync, readFileSync } from "fs";
import { join } from "path";

/**
 * Workflow Tracker Plugin
 *
 * Tracks SDLC phase transitions and maintains workflow state.
 * Generates workflow reports and visualizes development flow.
 *
 * Configuration (via environment variables):
 * - ENABLE_WORKFLOW_TRACKER - Enable/disable workflow tracking (default: true)
 */
export const WorkflowTracker: Plugin = async ({ project, directory, $ }) => {
  // Check if plugin is enabled
  const enabled = process.env.ENABLE_WORKFLOW_TRACKER !== "false";

  if (!enabled) {
    // Plugin disabled - return minimal hooks
    return {};
  }

  const workflowDir = join(directory, ".opencode", "workflow");
  const logFile = join(workflowDir, "transitions.jsonl");

  // Ensure workflow directory exists
  if (!existsSync(workflowDir)) {
    mkdirSync(workflowDir, { recursive: true });
  }

  // Track current phase
  let currentPhase: string | null = null;
  let phaseStartTime: Date | null = null;
  const filesModified: Set<string> = new Set();

  const logTransition = (from: string | null, to: string, files: string[] = []) => {
    const duration = phaseStartTime ? Date.now() - (phaseStartTime as Date).getTime() : 0;
    const transition = {
      timestamp: new Date().toISOString(),
      from,
      to,
      duration,
      filesModified: files,
    };

    appendFileSync(logFile, JSON.stringify(transition) + "\n");
    // Silent background tracking
  };

  const generateReport = async () => {
    if (!existsSync(logFile)) {
      return "No workflow data available yet.";
    }

    const lines = readFileSync(logFile, "utf-8").trim().split("\n");
    const transitions = lines.map((line) => JSON.parse(line));

    const report = {
      totalTransitions: transitions.length,
      phases: {} as Record<string, { count: number; totalDuration: number }>,
      filesChanged: new Set<string>(),
    };

    transitions.forEach((t) => {
      if (t.to) {
        if (!report.phases[t.to]) {
          report.phases[t.to] = { count: 0, totalDuration: 0 };
        }
        report.phases[t.to].count++;
        report.phases[t.to].totalDuration += t.duration;
      }
      t.filesModified?.forEach((f: string) => report.filesChanged.add(f));
    });

    const reportPath = join(workflowDir, "report.json");
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Silent background tracking - report saved to file
    return report;
  };

  return {
    // Track tool executions to detect file modifications
    "tool.execute.before": async (input, output) => {
      if (input.tool === "write" || input.tool === "edit") {
        const filePath = output.args?.file_path || output.args?.path;
        if (filePath) {
          filesModified.add(filePath);
        }
      }
    },

    // Listen for system events
    event: async (evt) => {
      // Track session idle as potential phase transition
      if (evt.event.type === "session.idle") {
        if (currentPhase && filesModified.size > 0) {
          logTransition(currentPhase, currentPhase, Array.from(filesModified));
          filesModified.clear();
        }
      }

      // Track session completion
      if (evt.event.type === "session.deleted") {
        if (currentPhase) {
          logTransition(currentPhase, "complete", Array.from(filesModified));
        }
        await generateReport();
      }
    },
  };
};
