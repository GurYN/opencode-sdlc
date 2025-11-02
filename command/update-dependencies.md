Safely update dependencies for $PACKAGE_MANAGER

Switch to migrator agent and perform dependency updates:

## 1. Audit Current State
- [ ] List all dependencies
- [ ] Check for outdated packages
- [ ] Identify major vs minor updates
- [ ] Check for security vulnerabilities

## 2. Categorize Updates

### Security Updates (Priority 1)
[List packages with security vulnerabilities]

### Major Version Updates (Careful)
[List packages with breaking changes]

### Minor/Patch Updates (Safe)
[List packages with backward-compatible updates]

## 3. Update Strategy
For each category:

**Security Updates**: Update immediately
**Minor/Patch**: Update in batch
**Major**: Update one at a time with testing

## 4. Pre-Update Backup
- [ ] Commit current working state
- [ ] Create branch "deps/update-YYYY-MM-DD"
- [ ] Document current versions

## 5. Execute Updates
For $PACKAGE_MANAGER:

**npm**:
```bash
npm outdated
npm update
npm audit fix
```

**pip**:
```bash
pip list --outdated
pip install -U package==version
```

## 6. Testing
Switch to tester agent and:
- [ ] Run full test suite
- [ ] Check for deprecation warnings
- [ ] Test in local environment
- [ ] Run E2E tests

## 7. Fix Breaking Changes
If tests fail:
1. Review changelog for breaking changes
2. Update code to match new API
3. Update tests if needed
4. Re-run tests

## 8. Documentation
- [ ] Update package.json / requirements.txt
- [ ] Update CHANGELOG.md
- [ ] Document breaking changes
- [ ] Update README if needed

## 9. Review
Switch to reviewer agent and:
- [ ] Review all changes
- [ ] Check for security issues
- [ ] Verify no unexpected changes

Generate dependency update report with changes and testing results.
