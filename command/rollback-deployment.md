URGENT: Rollback deployment to previous stable version

**Environment**: $ENVIRONMENT
**Current Version**: $CURRENT_VERSION
**Target Version**: $TARGET_VERSION
**Reason**: $REASON

Switch to releaser agent and execute rollback:

## 1. Verify Rollback Decision
Confirm:
- [ ] Issue cannot be hotfixed quickly
- [ ] Impact is severe
- [ ] Previous version is stable
- [ ] Rollback plan is tested

## 2. Notification
- [ ] Alert team in Slack (#incidents)
- [ ] Update status page
- [ ] Notify stakeholders

## 3. Pre-Rollback Checks
- [ ] Verify target version $TARGET_VERSION exists
- [ ] Check database compatibility
- [ ] Verify configuration compatibility
- [ ] Ensure no data loss risk

## 4. Database Considerations
If database migrations exist:
- [ ] Check if migrations are reversible
- [ ] Plan migration rollback
- [ ] Backup database before rollback

## 5. Execute Rollback

### For Kubernetes:
```bash
kubectl rollout undo deployment/$APP_NAME -n $NAMESPACE
kubectl rollout status deployment/$APP_NAME -n $NAMESPACE
```

### For Docker:
```bash
docker pull $IMAGE:$TARGET_VERSION
docker stop $CONTAINER
docker run $IMAGE:$TARGET_VERSION
```

### For Serverless:
```bash
# Revert to previous deployment
sst deploy --stage $ENVIRONMENT --version $TARGET_VERSION
```

## 6. Verification
Switch to operator agent and verify:
- [ ] All pods/containers healthy
- [ ] Health checks passing
- [ ] Error rate decreased
- [ ] Response times normal
- [ ] No new errors in logs

## 7. Database Rollback (if needed)
If migrations need rollback:
```bash
# Run down migrations
npm run migrate:rollback
```

## 8. Monitor
Monitor for 30 minutes:
- [ ] Error rates
- [ ] Response times
- [ ] Resource utilization
- [ ] User reports

## 9. Post-Rollback
- [ ] Update status page (resolved)
- [ ] Notify team of successful rollback
- [ ] Create incident document
- [ ] Schedule post-mortem

## 10. Root Cause Analysis
Schedule meeting to:
1. Analyze what went wrong
2. Identify why it wasn't caught
3. Create action items to prevent recurrence

Generate rollback report with timeline and impact assessment.
