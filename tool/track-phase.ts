import { tool } from "@opencode-ai/plugin";
import {
  initializeWorkflowState,
  logTransition,
  getCurrentPhase,
  setCurrentPhase,
  getFilesModified,
  clearModifiedFiles,
} from "../lib/workflow-state";

/**
 * Track Phase Tool
 *
 * Manually track SDLC phase transitions.
 * Logs phase changes and maintains workflow state.
 */
export default tool({
  description: "Manually track SDLC phase transitions (plan/design/implement/test/review/release/operate)",
  args: {
    phase: tool.schema
      .string()
      .describe("Current SDLC phase: plan, design, implement, test, review, release, or operate"),
  },
  async execute(args, context) {
    const { phase } = args;

    // Validate phase
    const validPhases = ["plan", "design", "implement", "test", "review", "release", "operate"];
    if (!validPhases.includes(phase.toLowerCase())) {
      return `❌ Invalid phase: ${phase}. Must be one of: ${validPhases.join(", ")}`;
    }

    // Get current directory (assuming context provides access to project directory)
    // In OpenCode, we might need to use process.cwd() or similar
    const directory = process.cwd();

    // Initialize workflow state
    const workflowDir = initializeWorkflowState(directory);

    // Log the transition
    const previousPhase = getCurrentPhase();
    const modifiedFiles = getFilesModified();

    logTransition(workflowDir, previousPhase, phase, modifiedFiles);

    // Update current phase
    setCurrentPhase(phase);
    clearModifiedFiles();

    return `✅ Transitioned to ${phase} phase${previousPhase ? ` from ${previousPhase}` : ""}`;
  },
});
