Run comprehensive pre-deployment checklist for $ENVIRONMENT environment:

## 1. Code Quality
Switch to reviewer agent and verify:
- [ ] All tests passing
- [ ] Test coverage >80%
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] Code reviewed and approved

## 2. Security
Switch to security-scanner agent and run:
- [ ] Dependency vulnerability scan (npm audit / snyk)
- [ ] Secret detection (gitleaks)
- [ ] SAST scan (SonarQube)
- [ ] Container image scan (if applicable)

## 3. Performance
Switch to operator agent and check:
- [ ] No N+1 query issues
- [ ] Database indexes optimized
- [ ] Bundle size acceptable
- [ ] Lighthouse score >90 (if web)

## 4. Documentation
Switch to documenter agent and verify:
- [ ] CHANGELOG.md updated
- [ ] API documentation current
- [ ] Migration guide (if breaking changes)
- [ ] Runbooks updated

## 5. Infrastructure
Switch to releaser agent and verify:
- [ ] Database migrations tested
- [ ] Feature flags configured
- [ ] Environment variables set
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented

## 6. Communication
- [ ] Stakeholders notified
- [ ] Maintenance window scheduled (if needed)
- [ ] Status page updated

## Final Decision
Generate deployment checklist report and recommend GO/NO-GO.
