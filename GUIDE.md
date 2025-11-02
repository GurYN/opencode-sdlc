# OpenCode SDLC System - Complete Guide

Welcome to the OpenCode SDLC (Software Development Lifecycle) system! This guide will help you understand and use all available agents, commands, tools, and plugins.

---

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [SDLC Workflow Overview](#sdlc-workflow-overview)
3. [Agents Reference](#agents-reference)
4. [Commands Reference](#commands-reference)
5. [Plugins & Custom Tools](#plugins--custom-tools)
6. [Example Workflows](#example-workflows)
7. [Tips & Best Practices](#tips--best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Environment Setup
See the main `README.md` Configuration section for setting up environment variables for notifications and other features.

### Switch Between Agents
- **Tab key** - Cycle through primary agents (planner → designer → implementer → tester → reviewer → releaser → operator)
- **@agent-name** - Invoke subagents (e.g., `@documenter create API docs`)

### Run Commands
```bash
# Simply run the command - it will ask for required information
/command-name
```

Commands work **interactively** - they ask you for the information they need.

### Use Custom Tools
Ask Agent to invoke tools during conversation:
```
"Use the track-phase tool to move to test phase"
"Can you check the quality gate for test→review?"
"Show me the metrics using view-metrics"
```

---

## 🔄 SDLC Workflow Overview

The typical development workflow follows these phases:

```
1. PLAN     → Use planner agent, /plan-feature command
2. DESIGN   → Use designer agent
3. IMPLEMENT → Use implementer agent, /implement-with-tests command
4. TEST     → Use tester agent
5. REVIEW   → Use reviewer agent
6. RELEASE  → Use releaser agent, /pre-deployment-check command
7. OPERATE  → Use operator agent, /incident-response command
```

Each phase has:
- **Dedicated agent** with appropriate permissions
- **Custom commands** for common workflows
- **Quality gates** (via plugins) to ensure standards
- **Metrics tracking** to measure progress

---

## 🤖 Agents Reference

### Primary Agents (Tab-switchable)

#### 1. 📋 Planner Agent
**Purpose**: Requirements gathering, technical specs, architecture planning

**When to use**:
- Starting a new feature
- Analyzing requirements from tickets
- Creating technical specifications
- Estimating complexity

**Permissions**: Read-only (cannot modify code)

**Example usage**:
```bash
Switch to planner agent (Tab key)
> Analyze requirements for user authentication feature
```

---

#### 2. 🎨 Designer Agent
**Purpose**: UI/UX design, API design, database schema design

**When to use**:
- Creating component specifications
- Designing RESTful or GraphQL APIs
- Creating database schemas
- Design system work

**Permissions**: Can write design files (*.design.md, *.schema.sql, *.openapi.yml, docs/design/**)

**Example usage**:
```bash
Switch to designer agent
> Create an API design for user authentication with OAuth2
> Design a database schema for user profiles with roles
```

---

#### 3. 💻 Implementer Agent
**Purpose**: Feature implementation, code generation, refactoring

**When to use**:
- Writing production code
- Implementing features from specs
- Refactoring existing code
- Fixing bugs

**Permissions**: Full access (read, write, edit, bash)

**Example usage**:
```bash
Switch to implementer agent
> Implement the OAuth2 authentication flow from design/auth.design.md
> Refactor the user service to use dependency injection
```

---

#### 4. 🧪 Tester Agent
**Purpose**: Test creation, execution, quality assurance

**When to use**:
- Writing unit, integration, E2E tests
- Running test suites
- Analyzing coverage
- Fixing failing tests

**Permissions**: Can write/edit test files only

**Example usage**:
```bash
Switch to tester agent
> Write unit tests for the authentication service with >90% coverage
> Run all tests and analyze failures
```

---

#### 5. 👁️ Reviewer Agent
**Purpose**: Code review, security analysis, quality checks

**When to use**:
- Performing code reviews
- Security vulnerability scanning
- Checking code quality
- Pre-merge verification

**Permissions**: Read-only with limited bash (git, linting, auditing)

**Example usage**:
```bash
Switch to reviewer agent
> Review the changes in the authentication module
> Check for security vulnerabilities in the API endpoints
```

---

#### 6. 🚀 Releaser Agent
**Purpose**: Release management, versioning, deployment

**When to use**:
- Managing semantic versioning
- Generating changelogs
- Creating releases
- Triggering deployments

**Permissions**: Can write release files (CHANGELOG.md, version files)

**Example usage**:
```bash
Switch to releaser agent
> Prepare a release for version 1.2.0
> Generate changelog from commits since last tag
```

---

#### 7. 🔧 Operator Agent
**Purpose**: Production operations, incident response, monitoring

**When to use**:
- Responding to incidents
- Debugging production issues
- Performance analysis
- Creating runbooks

**Permissions**: Can write runbooks/incident docs

**Example usage**:
```bash
Switch to operator agent
> Investigate high API response times in the last hour
> Create a runbook for handling database connection failures
```

---

### Subagents (@-invokable)

#### @documenter
**Purpose**: Technical documentation, API docs

**Example**:
```bash
@documenter create comprehensive API documentation for the auth module
@documenter update the README with the new authentication flow
```

---

#### @researcher
**Purpose**: Technology research, library evaluation

**Example**:
```bash
@researcher compare OAuth2 libraries for Node.js
@researcher find best practices for JWT token management
```

---

#### @migrator
**Purpose**: Database migrations, dependency updates

**Example**:
```bash
@migrator create a migration to add email verification to users table
@migrator plan a safe upgrade path for React 17 to React 18
```

---

#### @security-scanner
**Purpose**: Vulnerability scanning, compliance

**Example**:
```bash
@security-scanner scan for secrets in the codebase
@security-scanner check OWASP Top 10 compliance
```

---

## 📋 Commands Reference

### Workflow Commands

#### /plan-feature
**Purpose**: Comprehensive feature planning

**How it works**:
- Switches to planner agent
- Asks you for feature name and ticket ID (optional)
- Creates technical specs
- Defines architecture
- Estimates complexity

**Example**:
```bash
/plan-feature
# Agent asks: "What feature would you like me to plan?"
# You respond: "user authentication from ticket PROJ-123"
```

---

#### /implement-with-tests
**Purpose**: TDD implementation workflow

**How it works**:
- Asks you for the feature name
- Then follows TDD workflow:
1. Reviews design docs
2. Writes failing tests (TDD red phase)
3. Implements code (TDD green phase)
4. Refactors code
5. Generates documentation
6. Performs self-review

**Example**:
```bash
/implement-with-tests
# Agent asks: "What feature would you like me to implement?"
# You respond: "OAuth integration"
```

---

#### /refactor-safely
**Purpose**: Safe refactoring with comprehensive testing

**How it works**:
- Asks you for the refactoring target
- Then follows safe refactoring process:
1. Analyzes current code
2. Ensures test coverage >90%
3. Plans refactoring steps
4. Refactors incrementally
5. Verifies no regressions

**Example**:
```bash
/refactor-safely
# Agent asks: "What would you like to refactor?"
# You respond: "src/services/auth.ts"
```

---

### Deployment Commands

#### /pre-deployment-check
**Purpose**: Comprehensive pre-deployment checklist

**How it works**:
- Asks you for the target environment
- Then runs comprehensive checks:
  - Validates code quality
  - Runs security scans
  - Checks performance
  - Verifies documentation
  - Validates infrastructure
  - Provides GO/NO-GO recommendation

**Example**:
```bash
/pre-deployment-check
# Agent asks: "What environment are you deploying to?"
# You respond: "production"
```

---

#### /rollback-deployment
**Purpose**: Emergency rollback procedure

**How it works**:
- Asks you for environment, current version, target version, and reason
- Then executes rollback:
  - Executes rollback procedures
  - Handles database migrations
  - Verifies rollback success
  - Creates incident documentation

**Example**:
```bash
/rollback-deployment
# Agent asks for:
# - Environment: production
# - Current version: v2.5.0
# - Target version: v2.4.3
# - Reason: Critical auth bug
```

---

### Operations Commands

#### /incident-response
**Purpose**: Structured production incident protocol

**How it works**:
- Asks you for severity, time range, and description
- Then follows incident response protocol:
1. Triages incident
2. Investigates root cause
3. Recommends mitigation
4. Executes fixes
5. Creates incident report

**Example**:
```bash
/incident-response
# Agent asks for:
# - Severity: P1
# - Time range: last 2 hours
# - Description: API response time degraded
```

---

#### /analyze-performance
**Purpose**: Performance analysis and optimization

**How it works**:
- Asks you for the component to analyze
- Then performs analysis:
1. Collects performance metrics
2. Profiles code
3. Analyzes database queries
4. Identifies bottlenecks
5. Recommends optimizations

**Example**:
```bash
/analyze-performance
# Agent asks: "What component would you like to analyze?"
# You respond: "API endpoint /users"
```

---

### Quality Commands

#### /security-audit
**Purpose**: Comprehensive security audit

**Arguments**: None

**What it does**:
1. Scans dependencies for vulnerabilities
2. Detects secrets in code
3. Runs SAST analysis
4. Checks OWASP Top 10
5. Generates remediation plan

**Example**:
```bash
/security-audit
```

---

#### /update-dependencies
**Purpose**: Safe dependency updates

**How it works**:
- Asks you for the package manager
- Then performs safe updates:
1. Audits current dependencies
2. Categorizes updates by risk
3. Updates safely
4. Runs tests
5. Documents changes

**Example**:
```bash
/update-dependencies
# Agent asks: "What package manager are you using?"
# You respond: "npm"
```

---

#### /generate-docs
**Purpose**: Documentation generation

**How it works**:
- Asks you for the documentation target
- Then generates documentation:
1. Generates API documentation
2. Creates architecture diagrams
3. Writes user/developer guides
4. Updates README and CHANGELOG

**Example**:
```bash
/generate-docs
# Claude asks: "What would you like to document?"
# You respond: "src/api"
```

---

## 🔌 Custom Tools & Plugins

### Understanding Custom Tools vs Plugins

**Custom Tools** (in `tool/` directory):
- User/LLM-invokable functions called explicitly during conversations
- Invoked by asking Agent: "Use the [tool-name] tool..."
- Return results that inform the LLM's responses
- Located in `~/.config/opencode/tool/`

**Plugins** (in `plugin/` directory):
- Event-driven background hooks that run automatically
- React to tool executions, session events, and system triggers
- Silent background operations (e.g., metrics tracking, auto-notifications)
- Located in `~/.config/opencode/plugin/`

**How to Use Custom Tools**: Ask Agent to use them, for example:
```
"Use the track-phase tool to transition to implement"
"Can you check the quality gate for test→review?"
"Show me the metrics using view-metrics"
```

All custom tools are automatically discovered and available globally in OpenCode.

### Workflow Tools

#### track-phase
**Location**: `tool/track-phase.ts`

**Purpose**: Manually track SDLC phase transitions

**Usage**: Ask Agent to use the tool
```
"Use the track-phase tool to transition to implement"
"Track that we're moving to the test phase"
```

**Arguments**:
- `phase`: plan, design, implement, test, review, release, or operate

**Features**:
- Logs phase transitions with timestamps
- Tracks files modified in each phase
- Generates workflow reports at `.opencode/workflow/`

---

#### check-quality-gate
**Location**: `tool/check-quality-gate.ts`

**Purpose**: Validate quality gates before phase transitions

**Usage**: Ask Agent to use the tool
```
"Use the check-quality-gate tool for test→review transition"
"Check if we can move from implement to test"
```

**Arguments**:
- `transition`: design→implement, implement→test, test→review, or review→release

**Quality Gates**:
- `design→implement`: Checks for design files
- `implement→test`: Validates compilation and linting
- `test→review`: Ensures tests pass with >80% coverage
- `review→release`: Verifies security and documentation

---

### Monitoring Tools

#### view-metrics
**Location**: `tool/view-metrics.ts`

**Purpose**: View collected SDLC metrics

**Usage**: Ask Agent to use the tool
```
"Use the view-metrics tool to show me our metrics"
"What are our current SDLC metrics?"
```

**Arguments**: None

**Metrics Tracked**:
- Test coverage trends
- Build times
- Deployment frequency
- Code complexity

---

#### send-notification
**Location**: `tool/send-notification.ts`

**Purpose**: Send notifications to team channels

**Usage**: Ask Agent to use the tool
```
"Use the send-notification tool to alert the dev channel about the deployment"
"Send a notification to the team that we're deploying to staging"
```

**Arguments**:
- `channel`: Channel name (dev, deployments, incidents, etc.)
- `message`: Notification message
- `severity`: info (default), warning, error, or critical

**Supported Channels**: Slack, Microsoft Teams, Discord

**Environment Variables Required**:
- `SLACK_WEBHOOK_URL`
- `TEAMS_WEBHOOK_URL`
- `DISCORD_WEBHOOK_URL`

---

### Context Tools

#### enrich-context
**Location**: `tool/enrich-context.ts`

**Purpose**: Get enriched project context

**Usage**: Ask Agent to use the tool
```
"Use the enrich-context tool to understand the project"
"What's the current state of this project?"
```

**Arguments**: None

**Context Sources**:
- Recent git commits (last 10)
- Current branch
- Test coverage status

**Note**: AGENTS.md, README.md, and CLAUDE.md are automatically provided by Claude Code/OpenCode TUI

---

#### generate-changelog
**Location**: `tool/generate-changelog.ts`

**Purpose**: Generate changelog from commits

**Usage**: Ask Agent to use the tool
```
"Use the generate-changelog tool for version 1.2.0"
"Generate a changelog for the next release"
```

**Arguments**:
- `version`: Version number (e.g., 1.2.0, 2.0.0-beta.1)

**Features**:
- Parses conventional commits
- Categorizes changes (feat, fix, breaking, docs, etc.)
- Updates CHANGELOG.md

**Conventional Commit Format**:
```
type(scope): subject

Examples:
feat(auth): add OAuth2 support
fix(api): handle null responses
docs: update README
BREAKING CHANGE: change API endpoint structure
```

---

### Security Tools

#### check-compliance
**Location**: `tool/check-compliance.ts`

**Purpose**: Run compliance checks

**Usage**: Ask Agent to use the tool
```
"Use the check-compliance tool to verify our compliance"
"Check if we meet compliance requirements"
```

**Arguments**: None

**Checks**:
- License compliance
- PII detection in files
- Sensitive keywords
- .env file tracking in git

---

#### security-scan
**Location**: `tool/security-scan.ts`

**Purpose**: Comprehensive security scan

**Usage**: Ask Agent to use the tool
```
"Use the security-scan tool to check for vulnerabilities"
"Run a security scan on the project"
```

**Arguments**: None

**Scanners**:
- Dependency vulnerabilities (npm audit, Snyk)
- Secret detection (gitleaks)
- Code analysis (ESLint)

---

## 🎯 Example Workflows

### Workflow 1: Build a New Feature (Full SDLC)

```bash
# Step 1: Plan
/plan-feature
# Provide: "user profile page" from ticket PROJ-456

# Step 2: Design
# Switch to designer agent (Tab)
> Create UI component specifications for user profile page
> Design API endpoints for profile data

# Step 3: Implement with Tests
/implement-with-tests
# Provide: "user profile page"

# Step 4: Review
# Switch to reviewer agent (Tab)
> Review all changes for the user profile page feature

# Step 5: Pre-deployment Check
/pre-deployment-check
# Provide: "staging"

# Step 6: Release
# Switch to releaser agent (Tab)
> Create a release for version 1.3.0 with the user profile feature
```

---

### Workflow 2: Handle Production Incident

```bash
# Step 1: Respond to incident
/incident-response
# Provide: Severity=P1, Time Range="last hour", Description="API errors 500"

# Step 2: If rollback needed
/rollback-deployment
# Provide: Environment=production, Current=v1.2.0, Target=v1.1.5, Reason="API errors"

# Step 3: Post-incident documentation
# Switch to operator agent
> Create a post-mortem for the API incident
```

---

### Workflow 3: Security & Compliance Check

```bash
# Step 1: Run security audit
/security-audit

# Step 2: Check compliance
check_compliance()

# Step 3: Scan with plugin
security_scan()

# Step 4: Update vulnerable dependencies
/update-dependencies
# Provide: "npm"

# Step 5: Verify fixes
/security-audit
```

---

### Workflow 4: Safe Refactoring

```bash
# Step 1: Analyze and plan
/refactor-safely
# Provide: "src/legacy/auth-service.ts"

# Step 2: Track progress
track_phase({ phase: "refactor" })

# Step 3: Quality gate check
check_quality_gate({ transition: "implement→test" })

# Step 4: Review refactoring
# Switch to reviewer agent
> Review refactoring changes for auth-service.ts
```

---

## 💡 Tips & Best Practices

### Agent Usage

1. **Always start with planner agent** for new features
2. **Use appropriate agent for each phase** - don't implement in planner agent
3. **Invoke subagents** for specialized tasks (@documenter, @researcher)
4. **Let agents guide you** - they have detailed workflows built-in

### Command Usage

1. **Use /setup first** on new projects
2. **Combine commands** - e.g., /plan-feature → /implement-with-tests → /pre-deployment-check
3. **Provide all required arguments** - commands show what's needed
4. **Run /sdlc-help** anytime you need reference

### Plugin Tools

1. **Track phase transitions** to analyze workflow efficiency
2. **Check quality gates** before moving to next phase
3. **View metrics regularly** to track improvements
4. **Use notifications** to keep team informed
5. **Generate changelogs** before every release

### Quality Standards

1. **Maintain >80% test coverage** (quality gate enforces this)
2. **Run security scans** before deployments
3. **Check compliance** regularly
4. **Document as you go** with @documenter
5. **Follow conventional commits** for better changelogs

---

## 🔧 Troubleshooting

### Plugins not working?

**Problem**: Plugin tools not available

**Solution**:
1. Check `~/.config/opencode/plugin/` directory exists
2. Verify TypeScript compilation: `tsc --noEmit` in plugin directory
3. Check environment variables are loaded

---

### Commands not found?

**Problem**: Command not recognized

**Solution**:
1. Check command exists: `ls ~/.config/opencode/command/`
2. Use exact command name: `/command-name` (with slash)
3. Verify command has .md extension
4. Check command file has content

---

### Agent not switching?

**Problem**: Can't switch to desired agent

**Solution**:
1. Use Tab key to cycle through primary agents
2. Use `@agent-name` for subagents
3. Verify agent file exists in `~/.config/opencode/agent/`
4. Check agent YAML frontmatter is valid

---

### Quality gate failing?

**Problem**: Can't pass quality gate

**Solution**:
1. Check what gate is failing: `check_quality_gate({ transition: "X→Y" })`
2. Fix the issues (tests, linting, coverage, etc.)
3. Re-run quality gate check
4. Review quality gate documentation in `plugin/quality-gate.ts`

---

### Notifications not sending?

**Problem**: Team notifications not working

**Solution**:
1. Verify webhook URLs in your environment variables
2. Test webhook manually with curl
3. Check environment variables are loaded
4. Verify network connectivity
5. Check notification-hub plugin is loaded

---

## 📚 Additional Resources

- **Plugin Documentation**: `cat ~/.config/opencode/plugin/README.md`
- **Tool Documentation**: `cat ~/.config/opencode/tool/README.md`
- **Agent Files**: Check individual agent .md files for detailed prompts
- **Command Files**: Check individual command .md files for detailed prompts

---

## 🎓 Learning Path

### Beginner (Week 1)
1. Try `/plan-feature` with a simple feature
2. Switch between agents using Tab
3. Run `view_metrics()` to see tracking

### Intermediate (Week 2-3)
1. Use `/implement-with-tests` for full TDD workflow
2. Try quality gates: `check_quality_gate()`
3. Generate a changelog: `generate_changelog({ version: "0.1.0" })`
4. Run `/security-audit`

### Advanced (Week 4+)
1. Create custom workflows combining multiple commands
2. Configure notifications for your team
3. Track metrics and optimize your SDLC
4. Respond to incidents with `/incident-response`
5. Contribute improvements to agents/commands/plugins

---

**Need more help?**
- Review specific agent: `cat ~/.config/opencode/agent/planner.md`
- Review specific command: `cat ~/.config/opencode/command/plan-feature.md`
- Review specific plugin: `cat ~/.config/opencode/plugin/workflow-tracker.ts`

**Happy coding with OpenCode SDLC! 🚀**
