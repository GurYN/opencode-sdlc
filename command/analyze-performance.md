What component would you like to analyze? Please specify (e.g., API endpoint, database query, frontend page).

Switch to operator agent and conduct performance analysis:

## 1. Metrics Collection
Gather current performance metrics:
- [ ] Response times (p50, p95, p99)
- [ ] Throughput (requests/second)
- [ ] Error rate
- [ ] CPU utilization
- [ ] Memory usage
- [ ] Database query times

## 2. Profiling
- [ ] Run profiler on the component
- [ ] Identify hot paths (CPU time)
- [ ] Find memory leaks
- [ ] Analyze async operations

## 3. Database Analysis
Query database for slow queries:
- [ ] List queries >100ms
- [ ] Check for N+1 queries
- [ ] Verify indexes exist
- [ ] Check query plans

## 4. Bottleneck Identification
Identify top 3 bottlenecks:
1. [Bottleneck 1]
2. [Bottleneck 2]
3. [Bottleneck 3]

## 5. Optimization Recommendations
For each bottleneck, suggest:
- Quick wins (low effort, high impact)
- Medium-term improvements
- Long-term architectural changes

## 6. Implementation
Switch to implementer agent and:
1. Implement recommended optimizations
2. Add performance tests
3. Measure improvement

## 7. Verification
- [ ] Re-run benchmarks
- [ ] Compare before/after metrics
- [ ] Verify no regressions
- [ ] Document optimizations

Generate performance analysis report with before/after metrics.
