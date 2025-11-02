#!/bin/bash

################################################################################
# OpenCode SDLC Installation Script
#
# This script installs the complete OpenCode SDLC system including:
# - 11 specialized agents (7 primary + 4 subagents)
# - 12 custom commands with workflows
# - 8 lifecycle plugins with automation
# - 8 custom tools (LLM-invokable functions)
# - 7 shared libraries (reusable utilities)
# - Configuration and documentation
#
# Usage: ./install.sh [options]
#   --force        Overwrite existing files without backup
#   --uninstall    Remove all installed components
#   --dry-run      Show what would be installed without making changes
#   --help         Show this help message
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${HOME}/.config/opencode"
CONFIG_FILE="${INSTALL_DIR}/opencode.json"
BACKUP_DIR="${INSTALL_DIR}/.backups/$(date +%Y%m%d_%H%M%S)"
DRY_RUN=false
FORCE=false
UNINSTALL=false

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_step() {
    echo -e "${CYAN}→${NC} $1"
}

confirm() {
    local prompt="$1"
    local response

    if [[ "$FORCE" == true ]]; then
        return 0
    fi

    read -p "$prompt [y/N] " response
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

check_prerequisites() {
    print_step "Checking prerequisites..."

    local missing_deps=()

    # Check for required commands
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    fi

    # Check for jq (for JSON manipulation)
    if ! command -v jq &> /dev/null; then
        print_warning "jq not found. MCP server configuration will use fallback method."
        print_info "Install jq for better JSON handling: brew install jq (macOS) or apt install jq (Linux)"
    fi

    # Check for Node.js or Bun (for plugins)
    if ! command -v node &> /dev/null && ! command -v bun &> /dev/null; then
        print_warning "Neither Node.js nor Bun found. Plugins require one of these."
        print_info "Install Node.js: https://nodejs.org/"
        print_info "Install Bun: https://bun.sh/"
    fi

    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        exit 1
    fi

    print_success "All prerequisites satisfied"
}

create_directories() {
    print_step "Creating directory structure..."

    # Note: Project-specific directories (.opencode/workflow, .opencode/metrics)
    # are NOT created here. They will be created automatically by plugins
    # in each project's working directory when first used.

    local dirs=(
        "${INSTALL_DIR}/agent"
        "${INSTALL_DIR}/command"
        "${INSTALL_DIR}/plugin"
        "${INSTALL_DIR}/tool"
        "${INSTALL_DIR}/lib"
    )

    for dir in "${dirs[@]}"; do
        if [[ "$DRY_RUN" == false ]]; then
            mkdir -p "$dir"
        fi
        print_success "Created: $dir"
    done
}

backup_existing() {
    if [[ ! -d "$INSTALL_DIR" ]]; then
        print_info "No existing installation found (fresh install)"
        return 0
    fi

    if [[ "$FORCE" == true ]]; then
        print_warning "Force mode: skipping backup"
        return 0
    fi

    print_step "Backing up existing installation..."

    if [[ "$DRY_RUN" == false ]]; then
        mkdir -p "$BACKUP_DIR"

        # Backup agents, commands, plugins, tools, libs if they exist
        [ -d "${INSTALL_DIR}/agent" ] && cp -r "${INSTALL_DIR}/agent" "${BACKUP_DIR}/"
        [ -d "${INSTALL_DIR}/command" ] && cp -r "${INSTALL_DIR}/command" "${BACKUP_DIR}/"
        [ -d "${INSTALL_DIR}/plugin" ] && cp -r "${INSTALL_DIR}/plugin" "${BACKUP_DIR}/"
        [ -d "${INSTALL_DIR}/tool" ] && cp -r "${INSTALL_DIR}/tool" "${BACKUP_DIR}/"
        [ -d "${INSTALL_DIR}/lib" ] && cp -r "${INSTALL_DIR}/lib" "${BACKUP_DIR}/"
        [ -f "${INSTALL_DIR}/README.md" ] && cp "${INSTALL_DIR}/README.md" "${BACKUP_DIR}/"
        [ -f "${INSTALL_DIR}/GUIDE.md" ] && cp "${INSTALL_DIR}/GUIDE.md" "${BACKUP_DIR}/"
        [ -f "${INSTALL_DIR}/LICENSE.md" ] && cp "${INSTALL_DIR}/LICENSE.md" "${BACKUP_DIR}/"

        print_success "Backup created at: $BACKUP_DIR"
    else
        print_info "Would create backup at: $BACKUP_DIR"
    fi
}

install_agents() {
    print_step "Installing agents..."

    local agent_count=0

    # Install all agents (flat structure - mode determined by frontmatter)
    if [[ -d "${SCRIPT_DIR}/agent" ]]; then
        for agent in "${SCRIPT_DIR}/agent"/*.md; do
            if [[ -f "$agent" ]]; then
                local agent_name=$(basename "$agent")
                if [[ "$DRY_RUN" == false ]]; then
                    cp "$agent" "${INSTALL_DIR}/agent/"
                fi
                print_success "Installed agent: $agent_name"
                ((agent_count++))
            fi
        done
    fi

    print_success "Installed $agent_count agents"
}

install_commands() {
    print_step "Installing commands..."

    local command_count=0

    if [[ -d "${SCRIPT_DIR}/command" ]]; then
        for cmd in "${SCRIPT_DIR}/command"/*.md; do
            if [[ -f "$cmd" ]]; then
                local cmd_name=$(basename "$cmd")
                if [[ "$DRY_RUN" == false ]]; then
                    cp "$cmd" "${INSTALL_DIR}/command/"
                fi
                print_success "Installed command: /${cmd_name%.md}"
                ((command_count++))
            fi
        done
    fi

    print_success "Installed $command_count commands"
}

install_plugins() {
    print_step "Installing plugins..."

    local plugin_count=0

    if [[ -d "${SCRIPT_DIR}/plugin" ]]; then
        for plugin in "${SCRIPT_DIR}/plugin"/*.ts; do
            if [[ -f "$plugin" ]]; then
                local plugin_name=$(basename "$plugin")
                if [[ "$DRY_RUN" == false ]]; then
                    cp "$plugin" "${INSTALL_DIR}/plugin/"
                fi
                print_success "Installed plugin: $plugin_name"
                ((plugin_count++))
            fi
        done

        # Copy plugin README if exists
        if [[ -f "${SCRIPT_DIR}/plugin/README.md" ]]; then
            if [[ "$DRY_RUN" == false ]]; then
                cp "${SCRIPT_DIR}/plugin/README.md" "${INSTALL_DIR}/plugin/"
            fi
            print_success "Installed plugin documentation"
        fi
    fi

    print_success "Installed $plugin_count plugins"
}

install_tools() {
    print_step "Installing custom tools..."

    local tool_count=0

    if [[ -d "${SCRIPT_DIR}/tool" ]]; then
        for tool in "${SCRIPT_DIR}/tool"/*.ts; do
            if [[ -f "$tool" ]]; then
                local tool_name=$(basename "$tool")
                if [[ "$DRY_RUN" == false ]]; then
                    cp "$tool" "${INSTALL_DIR}/tool/"
                fi
                print_success "Installed tool: $tool_name"
                ((tool_count++))
            fi
        done

        # Copy tool README if exists
        if [[ -f "${SCRIPT_DIR}/tool/README.md" ]]; then
            if [[ "$DRY_RUN" == false ]]; then
                cp "${SCRIPT_DIR}/tool/README.md" "${INSTALL_DIR}/tool/"
            fi
            print_success "Installed tool documentation"
        fi
    fi

    print_success "Installed $tool_count custom tools"
}

install_libs() {
    print_step "Installing shared libraries..."

    local lib_count=0

    if [[ -d "${SCRIPT_DIR}/lib" ]]; then
        for lib in "${SCRIPT_DIR}/lib"/*.ts; do
            if [[ -f "$lib" ]]; then
                local lib_name=$(basename "$lib")
                if [[ "$DRY_RUN" == false ]]; then
                    cp "$lib" "${INSTALL_DIR}/lib/"
                fi
                print_success "Installed library: $lib_name"
                ((lib_count++))
            fi
        done
    fi

    print_success "Installed $lib_count shared libraries"
}

install_config() {
    print_step "Installing configuration files..."

    # Install README.md
    if [[ -f "${SCRIPT_DIR}/README.md" ]]; then
        if [[ "$DRY_RUN" == false ]]; then
            cp "${SCRIPT_DIR}/README.md" "${INSTALL_DIR}/"
        fi
        print_success "Installed README.md"
    fi

    # Install GUIDE.md
    if [[ -f "${SCRIPT_DIR}/GUIDE.md" ]]; then
        if [[ "$DRY_RUN" == false ]]; then
            cp "${SCRIPT_DIR}/GUIDE.md" "${INSTALL_DIR}/"
        fi
        print_success "Installed GUIDE.md"
    fi

    # Install LICENSE.md
    if [[ -f "${SCRIPT_DIR}/LICENSE.md" ]]; then
        if [[ "$DRY_RUN" == false ]]; then
            cp "${SCRIPT_DIR}/LICENSE.md" "${INSTALL_DIR}/"
        fi
        print_success "Installed LICENSE.md"
    fi

    # Install opencode.json if exists
    if [[ -f "${SCRIPT_DIR}/opencode.json" ]]; then
        if [[ "$DRY_RUN" == false ]]; then
            cp "${SCRIPT_DIR}/opencode.json" "${INSTALL_DIR}/"
        fi
        print_success "Installed opencode.json"
    fi

    # Install package.json for plugins
    if [[ -f "${SCRIPT_DIR}/package.json" ]]; then
        if [[ "$DRY_RUN" == false ]]; then
            cp "${SCRIPT_DIR}/package.json" "${INSTALL_DIR}/"
        fi
        print_success "Installed package.json"
    fi
}

install_dependencies() {
    print_step "Installing plugin dependencies..."

    if [[ ! -f "${INSTALL_DIR}/package.json" ]]; then
        print_warning "No package.json found, skipping dependency installation"
        return 0
    fi

    if [[ "$DRY_RUN" == true ]]; then
        print_info "Would install dependencies from package.json"
        return 0
    fi

    cd "${INSTALL_DIR}"

    if command -v bun &> /dev/null; then
        print_info "Using Bun to install dependencies..."
        bun install
        print_success "Dependencies installed with Bun"
    elif command -v npm &> /dev/null; then
        print_info "Using npm to install dependencies..."
        npm install
        print_success "Dependencies installed with npm"
    else
        print_warning "No package manager found (bun or npm)"
        print_info "You'll need to manually run: cd ${INSTALL_DIR} && npm install"
    fi
}

configure_mcp_servers() {
    print_step "Configuring MCP servers..."

    if [[ ! -f "$CONFIG_FILE" ]]; then
        print_warning "opencode.json not found, creating new configuration"
        if [[ "$DRY_RUN" == false ]]; then
            echo '{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {}
}' > "$CONFIG_FILE"
        fi
    fi

    if [[ "$DRY_RUN" == true ]]; then
        print_info "Would configure 3 MCP servers: context7, serena, sequential-thinking"
        return 0
    fi

    # Backup config before modifying
    cp "$CONFIG_FILE" "${CONFIG_FILE}.backup"

    # Check if jq is available for JSON manipulation
    if command -v jq &> /dev/null; then
        # Use jq for clean JSON manipulation
        local temp_file=$(mktemp)

        jq '. + {
          "mcp": ((.mcp // {}) + {
            "context7": {
              "type": "local",
              "command": ["npx", "-y", "@upstash/context7-mcp"],
              "enabled": true
            },
            "serena": {
              "type": "local",
              "command": ["uvx", "--from", "git+https://github.com/oraios/serena", "serena", "start-mcp-server", "--context", "ide-assistant"],
              "enabled": true
            },
            "sequential-thinking": {
              "type": "local",
              "command": ["npx", "-y", "@modelcontextprotocol/server-sequential-thinking"],
              "enabled": true
            }
          })
        }' "$CONFIG_FILE" > "$temp_file"

        mv "$temp_file" "$CONFIG_FILE"
        print_success "Configured 3 MCP servers using jq"
    else
        # Fallback: Use Node.js to modify JSON
        if command -v node &> /dev/null; then
            node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
config.mcp = config.mcp || {};
config.mcp['context7'] = {
  type: 'local',
  command: ['npx', '-y', '@context7/mcp-server'],
  enabled: true
};
config.mcp['serena'] = {
  type: 'local',
  command: ['uvx', '--from', 'serena-mcp', 'serena'],
  enabled: true
};
config.mcp['sequential-thinking'] = {
  type: 'local',
  command: ['npx', '-y', '@modelcontextprotocol/server-sequential-thinking'],
  enabled: true
};
fs.writeFileSync('$CONFIG_FILE', JSON.stringify(config, null, 2));
"
            print_success "Configured 3 MCP servers using Node.js"
        else
            print_error "Neither jq nor Node.js found. Cannot configure MCP servers."
            print_info "Install jq: brew install jq (macOS) or apt install jq (Linux)"
            mv "${CONFIG_FILE}.backup" "$CONFIG_FILE"
            return 1
        fi
    fi

    print_info "MCP Servers configured:"
    print_info "  - context7: Library documentation lookup"
    print_info "  - serena: Code analysis and refactoring"
    print_info "  - sequential-thinking: Complex problem solving"
}

remove_mcp_servers() {
    print_step "Removing MCP servers configuration..."

    if [[ ! -f "$CONFIG_FILE" ]]; then
        print_info "No opencode.json found, nothing to remove"
        return 0
    fi

    if [[ "$DRY_RUN" == true ]]; then
        print_info "Would remove MCP servers: context7, serena, sequential-thinking"
        return 0
    fi

    # Backup config before modifying
    cp "$CONFIG_FILE" "${CONFIG_FILE}.backup"

    # Check if jq is available
    if command -v jq &> /dev/null; then
        local temp_file=$(mktemp)

        jq 'if .mcp then
          .mcp |= del(.["context7"], .["serena"], .["sequential-thinking"])
        else . end' "$CONFIG_FILE" > "$temp_file"

        mv "$temp_file" "$CONFIG_FILE"
        print_success "Removed MCP servers using jq"
    elif command -v node &> /dev/null; then
        node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
if (config.mcp) {
  delete config.mcp['context7'];
  delete config.mcp['serena'];
  delete config.mcp['sequential-thinking'];
}
fs.writeFileSync('$CONFIG_FILE', JSON.stringify(config, null, 2));
"
        print_success "Removed MCP servers using Node.js"
    else
        print_warning "Neither jq nor Node.js found. Cannot remove MCP servers."
        mv "${CONFIG_FILE}.backup" "$CONFIG_FILE"
        return 1
    fi
}

validate_installation() {
    print_step "Validating installation..."

    local errors=0

    # Check agents
    local agent_count=$(find "${INSTALL_DIR}/agent" -name "*.md" 2>/dev/null | wc -l)

    if [[ $agent_count -lt 11 ]]; then
        print_error "Expected 11 agents, found $agent_count"
        ((errors++))
    else
        print_success "Agents: $agent_count installed"
    fi

    # Check commands
    local cmd_count=$(find "${INSTALL_DIR}/command" -name "*.md" 2>/dev/null | wc -l)

    if [[ $cmd_count -lt 10 ]]; then
        print_warning "Expected at least 10 commands, found $cmd_count"
    else
        print_success "Commands: $cmd_count available"
    fi

    # Check plugins
    local plugin_count=$(find "${INSTALL_DIR}/plugin" -name "*.ts" 2>/dev/null | wc -l)

    if [[ $plugin_count -lt 8 ]]; then
        print_warning "Expected at least 8 plugins, found $plugin_count"
    else
        print_success "Plugins: $plugin_count installed"
    fi

    # Check tools
    local tool_count=$(find "${INSTALL_DIR}/tool" -name "*.ts" 2>/dev/null | wc -l)

    if [[ $tool_count -lt 8 ]]; then
        print_warning "Expected at least 8 tools, found $tool_count"
    else
        print_success "Tools: $tool_count installed"
    fi

    # Check libs
    local lib_count=$(find "${INSTALL_DIR}/lib" -name "*.ts" 2>/dev/null | wc -l)

    if [[ $lib_count -lt 7 ]]; then
        print_warning "Expected at least 7 libraries, found $lib_count"
    else
        print_success "Libraries: $lib_count installed"
    fi

    # Check README.md
    if [[ -f "${INSTALL_DIR}/README.md" ]]; then
        print_success "Documentation: README.md installed"
    else
        print_error "README.md not found"
        ((errors++))
    fi

    # Check LICENSE.md
    if [[ -f "${INSTALL_DIR}/LICENSE.md" ]]; then
        print_success "Documentation: LICENSE.md installed"
    else
        print_error "LICENSE.md not found"
        ((errors++))
    fi

    # Check GUIDE.md
    if [[ -f "${INSTALL_DIR}/GUIDE.md" ]]; then
        print_success "Documentation: GUIDE.md installed"
    else
        print_error "GUIDE.md not found"
        ((errors++))
    fi

    if [[ $errors -gt 0 ]]; then
        print_error "Validation failed with $errors errors"
        return 1
    fi

    print_success "Installation validated successfully"
}

show_summary() {
    print_header "📦 OpenCode SDLC Installation Complete!"

    echo -e "${GREEN}Installation Directory:${NC} $INSTALL_DIR"
    echo ""

    echo -e "${CYAN}Installed Components:${NC}"
    echo -e "  ${GREEN}✓${NC} 7 Primary Agents (planner, designer, implementer, tester, reviewer, releaser, operator)"
    echo -e "  ${GREEN}✓${NC} 4 Subagents (documenter, researcher, migrator, security-scanner)"
    echo -e "  ${GREEN}✓${NC} 10 Custom Commands (setup, plan-feature, implement-with-tests, etc.)"
    echo -e "  ${GREEN}✓${NC} 8 Lifecycle Plugins (workflow-tracker, quality-gate, metrics-collector, etc.)"
    echo -e "  ${GREEN}✓${NC} 8 Custom Tools (track-phase, check-quality-gate, view-metrics, etc.)"
    echo -e "  ${GREEN}✓${NC} 7 Shared Libraries (workflow-state, metrics-storage, compliance-utils, etc.)"
    echo -e "  ${GREEN}✓${NC} 3 MCP Servers (context7, serena, sequential-thinking)"
    echo -e "  ${GREEN}✓${NC} Configuration and Documentation"
    echo ""

    echo -e "${CYAN}Next Steps:${NC}"
    echo ""
    echo -e "  ${YELLOW}1.${NC} Run OpenCode:"
    echo -e "     ${BLUE}opencode${NC}"
    echo ""
    echo -e "  ${YELLOW}2.${NC} Try your first command:"
    echo -e "     ${BLUE}/plan-feature FEATURE_NAME=\"hello world\"${NC}"
    echo ""
    echo -e "  ${YELLOW}3.${NC} Optional: Install additional security tools:"
    echo -e "     ${BLUE}brew install gitleaks${NC}  # Secret detection"
    echo -e "     ${BLUE}npm install -g snyk${NC}    # Dependency scanning"
    echo ""

    if [[ -d "$BACKUP_DIR" ]]; then
        echo -e "${CYAN}Backup:${NC}"
        echo -e "  Previous installation backed up to:"
        echo -e "  ${BLUE}$BACKUP_DIR${NC}"
        echo ""
    fi

    echo -e "${CYAN}Documentation:${NC}"
    echo -e "  README.md:        ${BLUE}${INSTALL_DIR}/README.md${NC}"
    echo -e "  GUIDE.md:         ${BLUE}${INSTALL_DIR}/GUIDE.md${NC}"
    echo -e "  LICENSE.md:       ${BLUE}${INSTALL_DIR}/LICENSE.md${NC}"
    echo -e "  Plugin Docs:      ${BLUE}${INSTALL_DIR}/plugin/README.md${NC}"
    echo -e "  Tool Docs:        ${BLUE}${INSTALL_DIR}/tool/README.md${NC}"
    echo ""

    echo -e "${GREEN}Happy coding with OpenCode SDLC! 🚀${NC}"
    echo ""
}

uninstall() {
    print_header "🗑️  OpenCode SDLC Uninstallation"

    if [[ ! -d "$INSTALL_DIR" ]]; then
        print_info "No installation found at $INSTALL_DIR"
        exit 0
    fi

    echo -e "${YELLOW}This will remove:${NC}"
    echo -e "  - All agents (${INSTALL_DIR}/agent)"
    echo -e "  - All commands (${INSTALL_DIR}/command)"
    echo -e "  - All plugins (${INSTALL_DIR}/plugin)"
    echo -e "  - All tools (${INSTALL_DIR}/tool)"
    echo -e "  - All libraries (${INSTALL_DIR}/lib)"
    echo -e "  - Configuration & documentation files (README.md, GUIDE.md, LICENSE.md, package.json)"
    echo ""
    echo -e "${YELLOW}Note:${NC} Project-specific data (.opencode/ in your projects) will NOT be removed"
    echo ""

    if ! confirm "Are you sure you want to uninstall?"; then
        print_info "Uninstall cancelled"
        exit 0
    fi

    print_step "Creating backup before uninstall..."
    mkdir -p "${INSTALL_DIR}/.backups/uninstall_$(date +%Y%m%d_%H%M%S)"

    print_step "Removing OpenCode SDLC components..."

    # Remove MCP servers first
    remove_mcp_servers

    if [[ "$DRY_RUN" == false ]]; then
        rm -rf "${INSTALL_DIR}/agent"
        rm -rf "${INSTALL_DIR}/command"
        rm -rf "${INSTALL_DIR}/plugin"
        rm -rf "${INSTALL_DIR}/tool"
        rm -rf "${INSTALL_DIR}/lib"
        rm -f "${INSTALL_DIR}/README.md"
        rm -f "${INSTALL_DIR}/GUIDE.md"
        rm -f "${INSTALL_DIR}/LICENSE.md"
        rm -f "${INSTALL_DIR}/package.json"
        rm -rf "${INSTALL_DIR}/node_modules"

        print_success "OpenCode SDLC uninstalled"
    else
        print_info "Would remove all OpenCode SDLC components"
    fi

    print_info "Note: opencode.json (if exists) was preserved"
    print_info "Backups are still available in: ${INSTALL_DIR}/.backups/"
}

show_help() {
    cat <<EOF
OpenCode SDLC Installation Script

Usage: ./install.sh [options]

Options:
  --force        Overwrite existing files without creating backup
  --uninstall    Remove all installed OpenCode SDLC components
  --dry-run      Show what would be installed without making changes
  --help         Show this help message

Examples:
  ./install.sh                    # Standard installation
  ./install.sh --dry-run          # Preview installation
  ./install.sh --force            # Force install without backup
  ./install.sh --uninstall        # Remove installation

What gets installed:
  - 7 Primary Agents (Tab-switchable SDLC phases)
  - 4 Subagents (@-invokable specialists)
  - 12 Custom Commands (workflows and operations)
  - 8 Lifecycle Plugins (automation and quality gates)
  - 8 Custom Tools (LLM-invokable functions)
  - 7 Shared Libraries (reusable utilities)
  - 3 MCP Servers (in your opencode.json)
  - Configuration files (package.json)
  - Documentation (README.md, GUIDE.md, LICENSE.md, plugin README, tool README)

Installation directory: ~/.config/opencode

For more information, visit the project documentation.
EOF
}

################################################################################
# Main Installation Flow
################################################################################

main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                FORCE=true
                shift
                ;;
            --uninstall)
                UNINSTALL=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Handle uninstall
    if [[ "$UNINSTALL" == true ]]; then
        uninstall
        exit 0
    fi

    # Show header
    print_header "🚀 OpenCode SDLC Installation"

    if [[ "$DRY_RUN" == true ]]; then
        print_warning "DRY RUN MODE - No changes will be made"
        echo ""
    fi

    # Installation steps
    check_prerequisites
    create_directories
    backup_existing
    install_agents
    install_commands
    install_plugins
    install_tools
    install_libs
    install_config
    configure_mcp_servers
    install_dependencies
    validate_installation

    # Show summary
    if [[ "$DRY_RUN" == false ]]; then
        show_summary
    else
        echo ""
        print_info "Dry run completed. Run without --dry-run to install."
    fi
}

# Run main function
main "$@"
