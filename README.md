# OpenCode SDLC - Complete Software Development Lifecycle System

A comprehensive SDLC management system for [OpenCode](https://opencode.ai/) featuring specialized agents, workflow automation commands, and intelligent lifecycle plugins.

## 🚧 Project status

This project is currently in development stage. Some bugs can be encountered. Please report any issues you encounter at [GitHub Issues](https://github.com/GurYN/opencode-sdlc/issues).

A lot of work is still to be done. New features will be added on a regular basis.

You are also welcome to contribute to this project by submitting pull requests or submitting new feature requests.

## 💡 Why This Project?

OpenCode SDLC is designed to streamline the software development lifecycle, offering a comprehensive solution that includes specialized agents, workflow automation commands, and intelligent lifecycle plugins. By leveraging these components, developers can efficiently manage their projects, automate workflows, and enhance collaboration within teams.

Why OpenCode as the TUI coding agent instead of Claude Code or Codex? Because this project is designed for enterprise environments, OpenCode provides a large choice of LLM providers that can fit any restriction or requirement guided by enterprise rules.

## 🚀 Quick Start

### Installation

```bash
# Clone or download this repository
git clone https://github.com/GurYN/opencode-sdlc.git
cd opencode-sdlc

# Run installation script
chmod +x install.sh
./install.sh
```

### First Steps

```bash
# 1. Read the guide
# See GUIDE.md for comprehensive documentation

# 2. Start OpenCode
opencode

# 3. Try your first feature
/plan-feature FEATURE_NAME="hello world"

# 4. Configure notifications (optional - see Environment Variables below)
```

## 🏗️ Architecture: Global vs Project Scope

### Global Installation (`~/.config/opencode/`)
These components are installed **once** and shared across all projects:
- ✅ **Agents** - 11 specialized agents (7 primary + 4 subagents)
- ✅ **Commands** - 10 workflow command templates
- ✅ **Plugins** - 7 lifecycle plugins (code only)
- ✅ **MCP Servers** - 3 integrated MCP servers (context7, serena, sequential-thinking)
- ✅ **Documentation** - README.md, GUIDE.md

### Project-Specific Data (working directory)
These are created **automatically** by plugins when you work in each project:
- `.opencode/workflow/` - Workflow tracking for THIS project
- `.opencode/metrics/` - Metrics and stats for THIS project

**Important**: Add `.opencode/` to your project's `.gitignore`!

```bash
echo ".opencode/" >> .gitignore
```

## 📦 What's Included

### 🤖 11 Specialized Agents

**Primary Agents (7)** - Tab-switchable SDLC phases:
- **planner** - Requirements gathering and technical specifications
- **designer** - UI/UX, API, and database design
- **implementer** - Feature implementation and code generation
- **tester** - Test creation and quality assurance
- **reviewer** - Code review and security analysis
- **releaser** - Release management and deployment
- **operator** - Production operations and incident response

**Subagents (4)** - @-invokable specialists:
- **@documenter** - Technical documentation and API docs
- **@researcher** - Technology research and best practices
- **@migrator** - Database migrations and dependency updates
- **@security-scanner** - Vulnerability scanning and compliance

**Model Configuration:**
All agents are configured to use **Claude Sonnet 4.5** (`anthropic/claude-sonnet-4.5`) by default. To use a different model:
1. Edit the agent file in `~/.config/opencode/agent/`
2. Change the `model:` field in the YAML frontmatter

### 📋 10 Custom Commands

**Workflow:**
- `/plan-feature` - Feature planning with technical specs
- `/implement-with-tests` - TDD implementation workflow
- `/refactor-safely` - Safe refactoring with testing

**Deployment:**
- `/pre-deployment-check` - Pre-deployment validation
- `/rollback-deployment` - Emergency rollback procedure

**Operations:**
- `/incident-response` - Production incident protocol
- `/analyze-performance` - Performance analysis

**Quality:**
- `/security-audit` - Security vulnerability scanning
- `/update-dependencies` - Safe dependency updates
- `/generate-docs` - Documentation generation

### 🛠️ 8 Custom Tools (LLM-Invokable)

Custom tools are functions that the AI can invoke during conversation to perform specific operations. All return data directly to the AI (no console.log).

#### Workflow Tools

**`track-phase`** - Manually track SDLC phase transitions
- **Args**: `phase` (plan, design, implement, test, review, release, operate)
- **Usage**: "Use the track-phase tool to transition to implement"
- **Returns**: Confirmation message with phase transition details

**`check-quality-gate`** - Validate quality gates before phase transitions
- **Args**: `transition` (design→implement, implement→test, test→review, review→release)
- **Usage**: "Check the quality gate for test→review"
- **Validates**: Design files, compilation, linting, tests, coverage, security, changelog
- **Returns**: Pass/fail status with detailed message

#### Monitoring Tools

**`view-metrics`** - View collected SDLC metrics and trends
- **Args**: None
- **Usage**: "Show me the current metrics"
- **Returns**: JSON report with deployments, test runs, coverage trends, build times, complexity

**`send-notification`** - Send notifications to team channels (Slack/Teams/Discord)
- **Args**: `channel`, `message`, `severity` (optional: info/warning/error/critical)
- **Usage**: "Notify the dev team that deployment is complete"
- **Requires**: Webhook URLs in environment variables
- **Returns**: Confirmation of notification sent

#### Context & Documentation Tools

**`enrich-context`** - Get enriched project context
- **Args**: None
- **Usage**: "What's the current state of this project?"
- **Returns**: AGENTS.md, README.md, recent commits, current branch, test status

**`generate-changelog`** - Generate changelog from conventional commits
- **Args**: `version` (e.g., 1.2.0)
- **Usage**: "Generate changelog for version 1.2.0"
- **Returns**: Formatted changelog with stats, updates CHANGELOG.md file

#### Security Tools

**`check-compliance`** - Run comprehensive compliance checks
- **Args**: None
- **Usage**: "Check if we're compliant"
- **Checks**: License compliance, secret detection (gitleaks), PII scanning, .env in git
- **Returns**: JSON report with compliance status and issues

**`security-scan`** - Run comprehensive security vulnerability scan
- **Args**: None
- **Usage**: "Run a security scan"
- **Scans**: Dependencies (npm audit, Snyk), secrets (gitleaks), code (ESLint)
- **Returns**: JSON report with vulnerability counts by severity

---

**💡 How to use tools**: Ask Claude to invoke them naturally in conversation:
- "Use the track-phase tool to move to test phase"
- "Can you check the quality gate for test→review?"
- "Show me the metrics using view-metrics"

**📖 Full documentation**: See `tool/README.md` for detailed usage, examples, and best practices

### 🔌 7 Background Plugins (Event-Driven)

**Workflow Plugins** (`plugin/`):
- **workflow-tracker** - Auto-tracks file changes and phase transitions (data: `.opencode/workflow/`)
- **quality-gate** - Auto-enforces quality standards between phases

**Monitoring Plugins**:
- **metrics-collector** - Auto-collects SDLC metrics (data: `.opencode/metrics/`)
- **notification-hub** - Auto-sends notifications on deploys/tests/sessions

**Enhancement Plugins**:
- **changelog-generator** - Provides changelog generation utilities

**Security Plugins**:
- **compliance-checker** - Auto-blocks PII and sensitive data in writes
- **security-scanner** - Auto-scans for secrets before commits

**Note**: Tools are user/LLM-invokable functions, Plugins run automatically in background.

### 🔗 3 MCP Servers (Globally Configured)

**Integrated MCP Servers:**
- **context7** - Official library documentation and code examples lookup
- **serena** - Advanced code analysis, refactoring, and semantic understanding
- **sequential-thinking** - Complex multi-step problem solving and reasoning

These are automatically configured in `~/.config/opencode/opencode.json` during installation and work across all your projects.

## 🛠️ Installation Options

### Standard Installation
```bash
./install.sh
```

### Preview Without Installing
```bash
./install.sh --dry-run
```

### Force Install (No Backup)
```bash
./install.sh --force
```

### Uninstall
```bash
./install.sh --uninstall
# Note: Only removes global components.
# Project-specific data (.opencode/ in your projects) is preserved.
```

## 📚 Documentation

After installation, documentation is available at:

- **README.md** - Project presentation and quick reference
- **GUIDE.md** - Guide to using OpenCode SDLC
- **plugin/README.md** - Plugin documentation and API

## 🔧 Configuration

### Environment Variables

**⚠️ Important**: OpenCode does not automatically load `.env` files from your project directory due to how it's compiled with Bun. You must pass environment variables when starting OpenCode.

#### Method 1: Set Variables at Startup (Recommended)

```bash
# Navigate to your project
cd ~/Projects/your-project

# Start OpenCode with environment variables
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..." \
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." \
opencode
```

#### Method 2: Create a Startup Script

Create a file `start-opencode.sh` in your project:

```bash
#!/bin/bash
# start-opencode.sh

# Notification webhooks
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

opencode
```

Then run:
```bash
chmod +x start-opencode.sh
./start-opencode.sh
```

#### Method 3: Add to Shell Profile (Global)

Add to `~/.zshrc` or `~/.bashrc` for all projects:

```bash
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

Then reload and start:
```bash
source ~/.zshrc  # or ~/.bashrc
opencode
```

#### Available Environment Variables

**Notification Integrations:**
- `DISCORD_WEBHOOK_URL` - Discord webhook for notifications
- `SLACK_WEBHOOK_URL` - Slack webhook for notifications
- `TEAMS_WEBHOOK_URL` - Microsoft Teams webhook for notifications

**Plugin Controls (Optional):**

All plugins are enabled by default. Set to `"false"` to disable:
- `ENABLE_WORKFLOW_TRACKER` - Enable/disable workflow tracking (default: true)
- `ENABLE_QUALITY_GATE` - Enable/disable quality gates (default: true)
- `ENABLE_METRICS_COLLECTOR` - Enable/disable metrics collection (default: true)
- `ENABLE_COMPLIANCE_CHECKER` - Enable/disable compliance checking (default: true)
- `ENABLE_NOTIFICATION_HUB` - Enable/disable notifications (default: true)
- `ENABLE_CHANGELOG_GENERATOR` - Enable/disable changelog generation (default: true)
- `ENABLE_SECURITY_SCANNER` - Enable/disable security scanning (default: true)

Example - Disable workflow tracking:
```bash
export ENABLE_WORKFLOW_TRACKER="false"
opencode
```

**Quality Gate Configuration:**
- `QUALITY_GATE_STRICT` - Block phase transitions on gate failure (default: false)
- `QUALITY_GATE_COVERAGE_THRESHOLD` - Required test coverage percentage (default: 80)

**Changelog Generator Configuration:**
- `CHANGELOG_AUTO_GENERATE` - Auto-generate on git tag creation (default: false)
- `CHANGELOG_INCLUDE_SCOPES` - Include commit scopes in changelog (default: true)

## 🎯 Example Workflows

### Build a New Feature

```bash
# 1. Plan
/plan-feature FEATURE_NAME="user authentication" TICKET_ID="PROJ-123"

# 2. Design
# Switch to designer agent (Tab)
> Create API design for authentication

# 3. Implement with tests
/implement-with-tests FEATURE_NAME="user authentication"

# 4. Review
# Switch to reviewer agent (Tab)
> Review authentication implementation

# 5. Deploy
/pre-deployment-check ENVIRONMENT="production"
```

### Handle Production Incident

```bash
# Respond to incident
/incident-response SEVERITY="P1" TIME_RANGE="last hour" DESCRIPTION="API errors"

# If rollback needed
/rollback-deployment ENVIRONMENT="production" CURRENT_VERSION="v2.0" TARGET_VERSION="v1.9" REASON="Critical bug"
```

### Security Audit

```bash
# Run comprehensive audit
/security-audit

# Check compliance
check_compliance()

# Update vulnerable dependencies
/update-dependencies PACKAGE_MANAGER="npm"
```

### Quality Gate Workflow

Quality gates automatically enforce standards during phase transitions:

```bash
# Warning Mode (default) - Shows warnings but allows transitions
# Use the track-phase tool to transition from design to implement
> Use the track-phase tool to transition to implement phase

# Quality gate automatically validates:
# ✅ Design files present (*.design.md, *.schema.sql, *.openapi.yml)
# ⚠️  Quality Gate Warning: If validation fails, you'll see a warning

# Strict Mode - Blocks transitions on failure
export QUALITY_GATE_STRICT="true"
opencode

# Now transitions will be blocked if quality standards aren't met
> Use the track-phase tool to transition to test phase
# ❌ Error: Quality gate failed - transition blocked

# Manual quality gate checks
> Use the check-quality-gate tool with transition "implement→test"
# Returns: ✅ Code compiles and passes linting

# Context-aware suggestions
# When you edit files, the plugin suggests relevant gate checks:
# 💡 Consider running 'implement→test' gate (compilation check)
```

### Changelog Generation Workflow

The changelog generator automatically suggests updates and can auto-generate changelogs:

```bash
# Suggestion Mode (default) - Plugin reminds you to update changelog

# 1. Make commits using conventional commit format
> git commit -m "feat(auth): add OAuth2 support"
> git commit -m "fix(api): handle null responses"
> git commit -m "docs: update README"

# 2. Bump version in package.json
> Edit package.json to version 1.2.0
# 💡 Version bumped to 1.2.0. Generate changelog with: generate-changelog tool with version "1.2.0"

# 3. Generate changelog manually
> Use the generate-changelog tool with version "1.2.0"
# ✅ Changelog generated for version 1.2.0
# 📝 Updated CHANGELOG.md with 12 changes (3 features, 5 fixes)

# 4. Create git tag
> git tag v1.2.0
# 💡 Creating tag v1.2.0. Generate changelog with: generate-changelog tool with version "1.2.0"

# 5. Before deployment - Plugin checks if changelog is current
> npm publish
# ✅ CHANGELOG.md is up to date

# Auto-Generate Mode - Plugin generates changelog automatically on git tag
export CHANGELOG_AUTO_GENERATE="true"
opencode

> git tag v1.3.0
# ✅ Changelog generated for version 1.3.0
# 📝 Updated CHANGELOG.md with 8 changes (2 features, 4 fixes, 1 breaking)

# Disable scope prefixes in changelog
export CHANGELOG_INCLUDE_SCOPES="false"
opencode
```

## 📊 System Requirements

- **OpenCode** - Latest version
- **Node.js** >= 18.0 or **Bun** (for plugins and MCP servers)
- **Python with uv** - Required for serena MCP server (`pip install uv`)
- **Git** (for version control features)
- **jq** - Recommended for JSON manipulation (`brew install jq` on macOS)
- **Optional**: gitleaks, snyk, eslint (for enhanced security)

## 🤝 Contributing

Contributions are welcome! Areas to contribute:

- Additional agents for specialized workflows
- New commands for common patterns
- Plugin enhancements and new plugins
- Tools for automation and efficiency
- Documentation improvements
- Bug fixes and optimizations

## 📝 License

MIT License - See [LICENSE](LICENSE.md) file for details

## 🆘 Support

- **Get Help**: Check `/~/.config/opencode/GUIDE.md`
- **Documentation**: Check `~/.config/opencode/README.md`
- **Issues**: Report at [GitHub Issues](https://github.com/GurYN/opencode-sdlc/issues)

## 🎓 Learning Resources

### Beginner
1. Install and run `/setup` in your project
2. Try `/plan-feature` for a simple task
3. Explore agents with Tab key
4. Run `view_metrics()` to see tracking

### Intermediate
1. Use `/implement-with-tests` for TDD workflow
2. Check quality gates: `check_quality_gate()`
3. Generate changelog: `generate_changelog({ version: "0.1.0" })`
4. Run `/security-audit`

### Advanced
1. Create custom workflows combining commands
2. Configure team notifications
3. Track and optimize SDLC metrics
4. Handle incidents with `/incident-response`

---

**Built for OpenCode - Empowering development teams with intelligent SDLC automation** 🚀
