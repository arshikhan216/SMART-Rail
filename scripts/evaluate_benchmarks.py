"""CLI Evaluation Script for Research-Grade Benchmarking and Hypothesis Testing."""

import argparse
import datetime as dt
import logging
from pathlib import Path
import sys

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.data_pipeline.synthetic_generator import SyntheticDataGenerator
from src.evaluation.benchmark_suite import ResearchBenchmarkSuite
from src.schemas import MaintenanceTask, BlockWindow, Resource, Department, ResourceType

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def generate_benchmark_scenario(seed: int = 42, num_sections: int = 3, days: int = 7):
    """Generate reproducible randomized multi-department corridor scenario."""
    gen = SyntheticDataGenerator(seed=seed)
    start_date = dt.date(2026, 9, 8)
    base_time = dt.datetime(2026, 9, 8, 0, 0)
    sections = [f"SEC-CORR-{i:02d}" for i in range(num_sections)]
    depts = [Department.ENGINEERING, Department.S_AND_T, Department.TRACTION]
    work_types = {
        Department.ENGINEERING: "TrackTamping",
        Department.S_AND_T: "SignalInspection",
        Department.TRACTION: "OHEInspection",
    }

    blocks: list[BlockWindow] = []
    tasks: list[MaintenanceTask] = []
    resources: list[Resource] = []

    # Resources
    r_id = 1
    for sec in sections:
        for dept in depts:
            resources.append(
                Resource(
                    resource_id=f"RES-BENCH-{r_id:03d}",
                    department=dept,
                    resource_type=ResourceType.CREW,
                    capacity=10,
                    available_from=base_time,
                    available_until=base_time + dt.timedelta(days=days + 2),
                    section_id=sec,
                )
            )
            r_id += 1

    # Blocks (2 per day per section)
    b_id = 1
    for d in range(days):
        curr_date = start_date + dt.timedelta(days=d)
        for sec in sections:
            st1 = dt.datetime.combine(curr_date, dt.time(2, 0))
            blocks.append(
                BlockWindow(
                    block_id=f"BLK-BENCH-{b_id:03d}",
                    section_id=sec,
                    date=curr_date,
                    start_time=st1,
                    end_time=st1 + dt.timedelta(hours=3),
                    available=True,
                )
            )
            b_id += 1

            st2 = dt.datetime.combine(curr_date, dt.time(13, 0))
            blocks.append(
                BlockWindow(
                    block_id=f"BLK-BENCH-{b_id:03d}",
                    section_id=sec,
                    date=curr_date,
                    start_time=st2,
                    end_time=st2 + dt.timedelta(hours=2.5),
                    available=True,
                )
            )
            b_id += 1

    # Tasks
    t_id = 1
    for d in range(days):
        curr_date = start_date + dt.timedelta(days=d)
        for sec in sections:
            for dept in depts:
                prio = 85.0 if (t_id + seed) % 4 == 0 else 60.0
                is_crit = bool((t_id + seed) % 4 == 0)
                tasks.append(
                    MaintenanceTask(
                        task_id=f"TSK-BENCH-{t_id:04d}",
                        asset_id=f"AST-{sec}-{t_id:03d}",
                        section_id=sec,
                        department=dept,
                        maintenance_type=work_types[dept],
                        severity=4 if is_crit else 3,
                        urgency=4 if is_crit else 3,
                        priority_score=prio,
                        duration_hours=2.0,
                        required_workers=4,
                        deadline=dt.datetime.combine(curr_date + dt.timedelta(days=2), dt.time(0, 0)),
                        is_safety_critical=is_crit,
                    )
                )
                t_id += 1

    return start_date, tasks, blocks, resources


def main():
    parser = argparse.ArgumentParser(description="Evaluate block planning benchmarks and statistical hypothesis tests.")
    parser.add_argument("--seeds", type=int, default=5, help="Number of randomized Monte Carlo seeds")
    parser.add_argument("--out-dir", type=str, default="reports/benchmarks", help="Output directory for reports")
    parser.add_argument("--pareto", action="store_true", default=True, help="Compute multi-objective Pareto frontier")

    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    suite = ResearchBenchmarkSuite()

    # 1. Multi-Seed Statistical Benchmark
    logger.info("Running multi-seed comparison across %d seeds...", args.seeds)
    result = suite.run_multi_seed_evaluation(
        scenario_generator_func=generate_benchmark_scenario,
        num_seeds=args.seeds,
        num_sections=3,
        days=7,
    )

    # 2. Export Markdown Table
    md_table = suite.export_markdown_table(result)
    md_file = out_dir / "benchmark_summary.md"
    md_file.write_text(md_table, encoding="utf-8")
    logger.info("Wrote Markdown summary to %s", md_file)
    print("\n" + md_table + "\n")

    # 3. Export LaTeX Table
    latex_table = suite.export_latex_table(result)
    tex_file = out_dir / "benchmark_table.tex"
    tex_file.write_text(latex_table, encoding="utf-8")
    logger.info("Wrote LaTeX table to %s", tex_file)

    # 4. Export CSV
    csv_data = suite.export_csv(result)
    csv_file = out_dir / "statistical_tests.csv"
    csv_file.write_text(csv_data, encoding="utf-8")
    logger.info("Wrote statistical tests CSV to %s", csv_file)

    # 5. Optional Pareto Frontier Exploration
    if args.pareto:
        logger.info("Computing multi-objective Pareto trade-off frontier...")
        _, p_tasks, p_blocks, p_resources = generate_benchmark_scenario(seed=42, num_sections=2, days=5)
        pareto_report = suite.compute_pareto_frontier(
            tasks=p_tasks,
            blocks=p_blocks,
            resources=p_resources,
            train_impact_weights=[0.0, 25.0, 50.0, 100.0],
            priority_weights=[50.0, 100.0, 150.0],
        )

        pareto_file = out_dir / "pareto_frontier.json"
        pareto_file.write_text(pareto_report.model_dump_json(indent=2), encoding="utf-8")
        logger.info("Wrote Pareto frontier analysis (%d configurations, %d Pareto-optimal) to %s",
                    pareto_report.total_configurations_evaluated,
                    pareto_report.pareto_efficient_count,
                    pareto_file)

    logger.info("Evaluation benchmark suite execution complete!")


if __name__ == "__main__":
    main()
