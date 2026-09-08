### Multi-Seed Benchmark Evaluation ($N = 2$ Operational Instances)

| Metric | FCFS Baseline | Greedy Priority | CP-SAT Optimal | Improvement vs FCFS | $p$-value ($t$-test) | Wilcoxon $p$ | Significant? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Tasks Scheduled (Count) | 63.00 ± 0.00 | 63.00 ± 0.00 | 63.00 ± 0.00 | +0.0% | 1.00000 | 1.00000 | No |
| Critical Tasks Scheduled (Count) | 15.50 ± 0.71 | 15.50 ± 0.71 | 15.50 ± 0.71 | +0.0% | 1.00000 | 1.00000 | No |
| Coordination Savings (Hours) | 78.75 ± 0.00 | 72.75 ± 0.00 | 78.75 ± 0.00 | +0.0% | 1.00000 | 1.00000 | No |
| Estimated Train Disruption Score | 0.00 ± 0.00 | 0.00 ± 0.00 | 0.00 ± 0.00 | +0.0% | 1.00000 | 1.00000 | No |
| Asset Availability (%) | 1.00 ± 0.00 | 1.00 ± 0.00 | 0.95 ± 0.00 | -4.7% | 0.00000 | 0.50000 | Yes (p < 0.01) |