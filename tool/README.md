# OpenCode Custom Tools

This directory contains 8 custom tools that the AI can invoke during conversation to perform SDLC operations.

## Tool Overview

### 🔄 Workflow Tools

#### track-phase
Manually track SDLC phase transitions.

**Arguments:**
- `phase` - SDLC phase: plan, design, implement, test, review, release, or operate

**Returns:**
- Confirmation message with phase transition details

**Data Storage:**
- Logs stored in `.opencode/workflow/transitions.jsonl`
- Reports generated in `.opencode/workflow/report.json`

---

#### check-quality-gate
Validate quality gates before phase transitions.

**Arguments:**
- `transition` - Phase transition: design→implement, implement→test, test→review, or review→release

**Quality Gates:**
- `design→implement` - Checks for design files (*.design.md, *.schema.sql, *.openapi.yml)
- `implement→test` - Validates TypeScript compilation and linting
- `test→review` - Ensures tests pass with >80% coverage
- `review→release` - Checks security audit and CHANGELOG.md

**Returns:**
- Pass/fail status with detailed validation message

---

### 📊 Monitoring Tools

#### view-metrics
View collected SDLC metrics and trends.

**Arguments:**
- None

**Metrics Reported:**
- Total deployments and test runs
- Average test coverage (last 10 runs)
- Average build times
- Code complexity metrics

**Returns:**
- JSON report with summary, complexity data, and trend histories

**Data Storage:**
- Metrics stored in `.opencode/metrics/metrics.json`

---

#### send-notification
Send notifications to team communication channels.

**Arguments:**
- `channel` - Channel name (e.g., dev, deployments, incidents)
- `message` - Notification message
- `severity` - Optional: info, warning, error, or critical (default: info)

**Integrations:**
- Slack (via webhook)
- Microsoft Teams (via webhook)
- Discord (via webhook)

**Environment Variables:**
- `SLACK_WEBHOOK_URL`
- `TEAMS_WEBHOOK_URL`
- `DISCORD_WEBHOOK_URL`

**Returns:**
- Confirmation message

---

### 🔧 Context & Documentation Tools

#### enrich-context
Get enriched project context for better decision making.

**Arguments:**
- None

**Context Sources:**
- Recent commits (last 10)
- Current git branch
- Test coverage status

**Note:** File context (AGENTS.md, README.md, CLAUDE.md) is automatically provided by Claude Code/OpenCode TUI.

**Returns:**
- Formatted markdown with all gathered context

---

#### generate-changelog
Generate changelog from conventional commits since last release.

**Arguments:**
- `version` - Version number (e.g., 1.2.0, 2.0.0-beta.1)

**Features:**
- Parses conventional commit format
- Categorizes changes (breaking, feat, fix, perf, docs, refactor, etc.)
- Updates CHANGELOG.md file automatically

**Returns:**
- Formatted changelog with statistics

**Conventional Commit Format:**
```
type(scope): subject

Examples:
feat(auth): add OAuth2 support
fix(api): handle null responses
docs: update README
```

---

### 🔒 Security Tools

#### check-compliance
Run comprehensive compliance checks on the project.

**Arguments:**
- None

**Checks:**
- License compliance (project and dependencies)
- Secret detection (gitleaks)
- .env file tracking in git

**Returns:**
- JSON report with compliance status and detailed issues

---

#### security-scan
Run comprehensive security vulnerability scan.

**Arguments:**
- None

**Scanners:**
- Dependency vulnerabilities (npm audit, Snyk)
- Secret detection (gitleaks)
- Code analysis (ESLint security plugins)

**Returns:**
- JSON report with vulnerability counts by severity

---

## Installation

Tools are automatically loaded from `~/.config/opencode/tool/` by OpenCode.

**Important:** Tools must be placed directly in the `tool/` directory, not in subdirectories.

## Usage

### Invoking Tools

Ask Claude to use tools naturally in conversation:

```
"Use the track-phase tool to transition to implement"
"Check the quality gate for test→review"
"Show me the metrics using view-metrics"
"Generate a changelog for version 1.2.0"
"Run a security scan"
```

The AI will invoke the tool and incorporate the results into its response.

### Configuration

Some tools require environment variables:

```bash
# Notification Tool
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
export TEAMS_WEBHOOK_URL="https://outlook.office.com/webhook/..."
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

## Development

All tools follow the OpenCode custom tool API:

```typescript
import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "What this tool does",
  args: {
    myArg: tool.schema.string().describe("Argument description"),
  },
  async execute(args) {
    const { myArg } = args;

    // Perform operations
    const result = doSomething(myArg);

    // Return all information to the LLM
    return JSON.stringify(result, null, 2);
  },
});
```

## Shared Libraries

Tools use shared utility libraries from `../lib/`:

- `workflow-state.ts` - SDLC phase tracking state management
- `metrics-storage.ts` - Metrics I/O operations
- `compliance-utils.ts` - PII/license detection utilities
- `notification-sender.ts` - Webhook integration
- `context-gatherer.ts` - Project context collection
- `changelog-parser.ts` - Conventional commit parsing
- `security-scanners.ts` - Security scanning utilities

## Integration with Plugins

Tools work alongside plugins in `../plugin/`:

- **Plugins**: Provide automatic background hooks (e.g., auto-track file changes)
- **Tools**: Provide on-demand user-invokable functions (e.g., manual phase transitions)

Example workflow:
1. User invokes `track-phase` tool to transition to "implement"
2. Plugin's `workflow-tracker` automatically tracks file modifications
3. User invokes `check-quality-gate` tool before moving to "test"
4. Plugin's `quality-gate` validates requirements

## Tool Discovery

OpenCode discovers tools from:
- **Global**: `~/.config/opencode/tool/` (these tools)
- **Project**: `.opencode/tool/` (project-specific tools)

**Discovery Rules:**
- Filename becomes tool name (e.g., `track-phase.ts` → `track-phase`)
- Must be directly in `tool/` directory (subdirectories are ignored)
- Must use `export default tool({ ... })` format
- Restart OpenCode after adding new tools

## Troubleshooting

**Tool not recognized:**
- ✅ Ensure file is directly in `tool/` directory (not in subdirectories)
- ✅ Verify filename (e.g., `my-tool.ts` becomes `my-tool`)
- ✅ Check `export default tool({ ... })` format
- ✅ Restart OpenCode

**Tool doesn't return output:**
- ❌ Check if you're using console.log (AI won't see it)
- ✅ Ensure you're returning data as a string
- ✅ Use `JSON.stringify()` for objects
- ✅ Verify execute() has a return statement

**Import errors:**
- Tools use `import { ... } from "../lib/filename"`
- Verify `@opencode-ai/plugin` is installed (`bun install`)
- Check shared libraries exist in `~/.config/opencode/lib/`
