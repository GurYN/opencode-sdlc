Safely refactor $TARGET with comprehensive testing

## Phase 1: Understand Current State
Switch to implementer agent and analyze:
1. Read and understand $TARGET
2. Identify dependencies (imports/exports)
3. Find all usages across codebase
4. Document current behavior

## Phase 2: Ensure Test Coverage
Switch to tester agent and:
1. Check current test coverage for $TARGET
2. If coverage <90%, add tests for:
   - All public methods/functions
   - Edge cases
   - Error conditions
3. Run tests to establish baseline (all green)

## Phase 3: Plan Refactoring
Switch to implementer agent and create refactoring plan:
1. Identify code smells to fix
2. Determine refactoring strategy (extract method, rename, etc.)
3. Break into small, safe steps
4. Identify potential risks

## Phase 4: Incremental Refactoring
For each refactoring step:
1. Make small change
2. Run tests (must stay green)
3. Commit change
4. Repeat

## Phase 5: Verification
Switch to reviewer agent and verify:
- [ ] All tests still pass
- [ ] No behavior changes
- [ ] Code quality improved
- [ ] No new vulnerabilities
- [ ] Documentation updated

## Phase 6: Performance Check
Switch to operator agent and:
- [ ] Run performance benchmarks
- [ ] Compare with baseline
- [ ] Ensure no regression

Generate refactoring summary report.
