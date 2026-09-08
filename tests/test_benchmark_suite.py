"""Unit and Integration Tests for Research Benchmark Suite (Chunk 28)."""

import pytest
import numpy as np

from src.evaluation.benchmark_suite import (
    ResearchBenchmarkSuite,
    StatisticalSignificanceResult,
    ParetoFrontierReport,
    MultiSeedBenchmarkResult,
)
from scripts.evaluate_benchmarks import generate_benchmark_scenario


@pytest.fixture
def benchmark_suite():
    return ResearchBenchmarkSuite()


def test_compute_statistical_tests_significant(benchmark_suite):
    """Test paired t-test and Wilcoxon signed rank test on significant improvement."""
    cpsat_vals = [90.0, 92.0, 88.0, 95.0, 91.0, 94.0, 89.0, 93.0]
    fcfs_vals = [70.0, 72.0, 68.0, 74.0, 71.0, 73.0, 69.0, 72.0]

    res: StatisticalSignificanceResult = benchmark_suite.compute_statistical_tests(
        target_values=cpsat_vals,
        baseline_values=fcfs_vals,
        metric_name="Tasks Scheduled",
        baseline_name="FCFS Baseline",
        target_name="CP-SAT Optimal",
    )

    assert res.sample_size == 8
    assert res.mean_difference > 15.0
    assert res.relative_improvement_pct > 20.0
    assert res.t_test_p_value < 0.01
    assert res.wilcoxon_p_value < 0.05
    assert res.is_significant_at_p01 is True
    assert res.is_significant_at_p05 is True


def test_compute_statistical_tests_identical(benchmark_suite):
    """Test statistical test stability when metrics are identical."""
    vals = [50.0, 50.0, 50.0, 50.0]
    res = benchmark_suite.compute_statistical_tests(
        target_values=vals,
        baseline_values=vals,
        metric_name="Constant Metric",
    )

    assert res.mean_difference == 0.0
    assert res.t_test_p_value == 1.0
    assert res.is_significant_at_p05 is False


def test_pareto_frontier_generation(benchmark_suite):
    """Test multi-objective Pareto trade-off curve generation and non-dominated sorting."""
    _, tasks, blocks, resources = generate_benchmark_scenario(seed=42, num_sections=2, days=4)

    report: ParetoFrontierReport = benchmark_suite.compute_pareto_frontier(
        tasks=tasks,
        blocks=blocks,
        resources=resources,
        train_impact_weights=[0.0, 50.0],
        priority_weights=[50.0, 100.0],
    )

    assert report.total_configurations_evaluated == 4
    assert len(report.points) == 4
    assert report.pareto_efficient_count >= 1
    assert len(report.pareto_efficient_points) >= 1
    assert "Pareto-efficient" in report.summary_narrative


def test_multi_seed_benchmark_execution(benchmark_suite):
    """Test multi-seed Monte Carlo evaluation run across 2 seeds."""
    result: MultiSeedBenchmarkResult = benchmark_suite.run_multi_seed_evaluation(
        scenario_generator_func=generate_benchmark_scenario,
        num_seeds=2,
        num_sections=2,
        days=4,
    )

    assert result.num_seeds == 2
    assert len(result.fcfs_records) == 2
    assert len(result.greedy_records) == 2
    assert len(result.cpsat_records) == 2
    assert len(result.statistical_tests) >= 5

    # Verify summary table contains all planners
    assert "FCFS" in result.summary_table
    assert "Greedy Priority" in result.summary_table
    assert "CP-SAT Optimal" in result.summary_table


def test_export_latex_and_csv_and_markdown(benchmark_suite):
    """Test formatting and exporting publication-grade reports."""
    result: MultiSeedBenchmarkResult = benchmark_suite.run_multi_seed_evaluation(
        scenario_generator_func=generate_benchmark_scenario,
        num_seeds=2,
        num_sections=2,
        days=3,
    )

    # LaTeX Table
    latex = benchmark_suite.export_latex_table(result)
    assert r"\begin{table}" in latex
    assert r"\begin{tabular}" in latex
    assert r"\end{table}" in latex

    # CSV Export
    csv_str = benchmark_suite.export_csv(result)
    assert "metric_name" in csv_str
    assert "t_test_p_value" in csv_str

    # Markdown Table
    md_str = benchmark_suite.export_markdown_table(result)
    assert "| Metric | FCFS Baseline |" in md_str
    assert "CP-SAT Optimal" in md_str
