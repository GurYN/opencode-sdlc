# OpenCode SDLC Plugins

This directory contains 7 core plugins that enhance OpenCode with SDLC workflow automation, quality gates, and monitoring.

## Plugin Overview

### 🔄 Workflow Plugins

#### workflow-tracker.ts
Tracks SDLC phase transitions and maintains workflow state.

**Features:**
- Logs phase transitions with timestamps
- Tracks files modified in each phase
- Generates workflow reports
- Visualizes development flow

**Custom Tools:**
- `track_phase` - Manually log phase transitions

---

#### quality-gate.ts
Enforces quality standards before phase transitions.

**Quality Gates:**
- `design→implement` - Checks for design files
- `implement→test` - Validates code compilation and linting
- `test→review` - Ensures tests pass with >80% coverage
- `review→release` - Verifies security scans and documentation

**Custom Tools:**
- `check_quality_gate` - Run quality gate validation

---

### 📊 Monitoring Plugins

#### metrics-collector.ts
Collects and reports SDLC metrics.

**Metrics Tracked:**
- Code complexity
- Test coverage trends
- Build time trends
- Deployment frequency
- Test run counts

**Custom Tools:**
- `view_metrics` - View collected metrics and trends

---

#### notification-hub.ts
Sends notifications to team communication channels.

**Integrations:**
- Slack (via webhook)
- Microsoft Teams (via webhook)
- Discord (via webhook)

**Environment Variables:**
- `SLACK_WEBHOOK_URL`
- `TEAMS_WEBHOOK_URL`
- `DISCORD_WEBHOOK_URL`

**Custom Tools:**
- `send_notification` - Send manual notifications

---

### 🔧 Enhancement Plugins

#### changelog-generator.ts
Generates changelogs from conventional commits.

**Features:**
- Parses conventional commit format
- Categorizes changes (feat, fix, breaking, docs, etc.)
- Generates markdown changelog
- Updates CHANGELOG.md

**Custom Tools:**
- `generate_changelog` - Generate changelog for version

**Conventional Commit Format:**
```
type(scope): subject

Examples:
feat(auth): add OAuth2 support
fix(api): handle null responses
docs: update README
```

---

### 🔒 Security Plugins

#### compliance-checker.ts
Ensures regulatory and security compliance.

**Checks:**
- License compliance
- PII detection in files
- Sensitive keyword detection
- Environment file tracking
- License headers in source files

**Custom Tools:**
- `check_compliance` - Run compliance checks

**Features:**
- Blocks writes containing PII
- Warns about sensitive keywords
- Validates license headers

---

#### security-scanner.ts
Integrates security scanning tools.

**Scanners:**
- Dependency scanning (npm audit, Snyk)
- Secret detection (gitleaks)
- Code analysis (ESLint)

**Custom Tools:**
- `security_scan` - Run comprehensive security scan

**Features:**
- Scans before git commits
- Warns before pushes with vulnerabilities
- Categorizes issues by severity

---

## Installation

Plugins are automatically loaded from `~/.config/opencode/plugin/` by OpenCode.

## Usage

### Configuration

Some plugins require environment variables:

```bash
# Notification Hub
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
export TEAMS_WEBHOOK_URL="https://outlook.office.com/webhook/..."
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

## Development

All plugins follow the OpenCode plugin API:

```typescript
import type { Plugin } from "@opencode-ai/plugin";

export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  return {
    // Event hooks
    event: async (evt) => { /* ... */ },

    // Tool execution hooks
    // input contains tool name (input.tool)
    // output contains tool arguments (output.args)
    "tool.execute.before": async (input, output) => {
      if (input.tool === "bash" && output.args?.command?.includes("deploy")) {
        // Handle deployment
      }
    }
  };
};
```

## Integration with Commands

Plugins work seamlessly with custom commands:

- `/pre-deployment-check` uses `quality-gate` and `security-scanner`
- `/implement-with-tests` can use `track_phase` and `metrics-collector`
- `/rollback-deployment` can use `notification-hub`
