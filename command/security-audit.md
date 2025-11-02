Comprehensive security audit for the entire project

Switch to security-scanner agent and perform full security audit:

## 1. Dependency Scanning
- [ ] Run npm audit / pip audit
- [ ] Check with Snyk
- [ ] Identify all vulnerabilities (Critical/High/Medium/Low)
- [ ] Generate upgrade plan

## 2. Secret Detection
- [ ] Scan all files with gitleaks
- [ ] Check for hardcoded credentials
- [ ] Verify .env files not committed
- [ ] Check for exposed API keys

## 3. Code Security Analysis (SAST)
Run static analysis with SonarQube for:
- [ ] SQL injection vulnerabilities
- [ ] XSS vulnerabilities
- [ ] Command injection risks
- [ ] Path traversal issues
- [ ] Insecure deserialization

## 4. Authentication & Authorization
Review all endpoints:
- [ ] Authentication required where needed
- [ ] Authorization checks present
- [ ] JWT tokens validated properly
- [ ] Session management secure
- [ ] Password policies enforced

## 5. OWASP Top 10 Check
Verify protection against:
1. [ ] Broken Access Control
2. [ ] Cryptographic Failures
3. [ ] Injection
4. [ ] Insecure Design
5. [ ] Security Misconfiguration
6. [ ] Vulnerable Components
7. [ ] Authentication Failures
8. [ ] Software and Data Integrity Failures
9. [ ] Security Logging Failures
10. [ ] Server-Side Request Forgery

## 6. Infrastructure Security
- [ ] Secrets stored in vault (not code)
- [ ] TLS/SSL configured correctly
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Security headers set (CSP, HSTS, etc.)

## 7. Compliance
Check compliance with:
- [ ] GDPR (if applicable)
- [ ] SOC 2 (if applicable)
- [ ] License compliance

## 8. Remediation Plan
For all findings, create prioritized action items:

### Critical (Fix Immediately)
1. [Issue] - [Remediation]

### High (Fix This Sprint)
1. [Issue] - [Remediation]

### Medium (Fix Next Sprint)
1. [Issue] - [Remediation]

Generate comprehensive security audit report.
