Implement $FEATURE_NAME following Test-Driven Development (TDD):

## Phase 1: Review Design
Switch to designer agent and review the design for $FEATURE_NAME in docs/design/

## Phase 2: Write Tests First
Switch to tester agent and create:
1. Unit tests for all business logic (target: 100% coverage)
2. Integration tests for API endpoints
3. E2E tests for critical user flows

Tests should be failing initially (red phase).

## Phase 3: Implementation
Switch to implementer agent and:
1. Implement minimal code to pass tests (green phase)
2. Follow existing code patterns from AGENTS.md
3. Handle errors gracefully
4. Add appropriate logging

## Phase 4: Refactor
1. Improve code quality while keeping tests green
2. Remove duplication
3. Add inline comments for complex logic
4. Run linter and fix issues

## Phase 5: Documentation
Switch to documenter agent and:
1. Update API documentation
2. Add inline code documentation
3. Update CHANGELOG.md
4. Create/update README if needed

## Phase 6: Pre-Review
Switch to reviewer agent and perform self-review:
1. Check code quality
2. Verify test coverage >80%
3. Run security scan
4. Generate review report

Finally, switch to implementer and create a pull request with:
- Descriptive title
- Summary of changes
- Testing instructions
- Screenshots/GIFs if UI changes
