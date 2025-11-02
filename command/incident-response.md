INCIDENT RESPONSE: Investigate and mitigate production issue

**Severity**: $SEVERITY (P0/P1/P2/P3)
**Time Range**: $TIME_RANGE
**Description**: $DESCRIPTION

Switch to operator agent and follow incident response protocol:

## 1. Detection & Triage (0-5 min)
- [ ] Acknowledge incident
- [ ] Assess severity
- [ ] Identify impacted users/services
- [ ] Notify team via Slack

## 2. Investigation (5-30 min)
- [ ] Check recent deployments in last $TIME_RANGE
- [ ] Query error logs from monitoring (Datadog/CloudWatch)
- [ ] Analyze metrics and traces
- [ ] Review database slow queries
- [ ] Check infrastructure health (Kubernetes pods)

## 3. Hypothesis Formation
Based on investigation, identify likely root cause:
- Application bug?
- Infrastructure issue?
- External dependency failure?
- Database problem?
- Network issue?

## 4. Mitigation
Recommend mitigation strategy:
- Rollback deployment?
- Scale up resources?
- Kill hanging processes?
- Failover to backup?
- Apply hotfix?

## 5. Execute Mitigation
Once approved, execute mitigation steps and verify:
- [ ] Issue resolved
- [ ] Metrics returned to normal
- [ ] No new errors
- [ ] Monitor for 30 minutes

## 6. Communication
- [ ] Update status page
- [ ] Notify stakeholders of resolution
- [ ] Post final incident summary

## 7. Post-Incident
- [ ] Create incident document in docs/incidents/
- [ ] Schedule post-mortem meeting
- [ ] Identify action items

Generate incident report with timeline and root cause analysis.
