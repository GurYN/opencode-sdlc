import { existsSync, mkdirSync, writeFileSync, appendFileSync, readFileSync } from "fs";
import { join } from "path";

/**
 * Workflow State Management
 *
 * Shared utilities for tracking SDLC phase transitions and state.
 */

// Track current phase
let currentPhase: string | null = null;
let phaseStartTime: Date | null = null;
const filesModified: Set<string> = new Set();

export interface WorkflowTransition {
  timestamp: string;
  from: string | null;
  to: string;
  duration: number;
  filesModified: string[];
}

export interface WorkflowReport {
  totalTransitions: number;
  phases: Record<string, { count: number; totalDuration: number }>;
  filesChanged: Set<string>;
}

export function initializeWorkflowState(directory: string) {
  const workflowDir = join(directory, ".opencode", "workflow");
  if (!existsSync(workflowDir)) {
    mkdirSync(workflowDir, { recursive: true });
  }
  return workflowDir;
}

export function logTransition(
  workflowDir: string,
  from: string | null,
  to: string,
  files: string[] = []
) {
  const logFile = join(workflowDir, "transitions.jsonl");

  const transition: WorkflowTransition = {
    timestamp: new Date().toISOString(),
    from,
    to,
    duration: phaseStartTime ? Date.now() - phaseStartTime.getTime() : 0,
    filesModified: files,
  };

  appendFileSync(logFile, JSON.stringify(transition) + "\n");
  // Silent background tracking
}

export async function generateReport(workflowDir: string): Promise<WorkflowReport | string> {
  const logFile = join(workflowDir, "transitions.jsonl");

  if (!existsSync(logFile)) {
    return "No workflow data available yet.";
  }

  const lines = readFileSync(logFile, "utf-8").trim().split("\n");
  const transitions = lines.map((line) => JSON.parse(line));

  const report: WorkflowReport = {
    totalTransitions: transitions.length,
    phases: {},
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
}

export function getCurrentPhase(): string | null {
  return currentPhase;
}

export function setCurrentPhase(phase: string): void {
  currentPhase = phase;
  phaseStartTime = new Date();
}

export function getFilesModified(): string[] {
  return Array.from(filesModified);
}

export function addModifiedFile(filePath: string): void {
  filesModified.add(filePath);
}

export function clearModifiedFiles(): void {
  filesModified.clear();
}
