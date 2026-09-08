"""Unit and Integration Tests for Full Pipeline CLI Orchestrator (Chunk 30)."""

from pathlib import Path
import pytest

from scripts.run_pipeline import run_full_pipeline


def test_run_full_pipeline_weekly_mode(tmp_path):
    """Test full end-to-end pipeline execution in 7-day weekly mode."""
    out_dir = tmp_path / "weekly_output"

    res = run_full_pipeline(
        mode="weekly",
        horizon_days=7,
        seed=42,
        out_dir=str(out_dir),
        export_formats=["json", "md"],
        strict_audit=True,
    )

    assert res["status"] in ("OPTIMAL", "FEASIBLE")
    assert res["tasks_scheduled"] > 0
    assert res["asset_availability"] > 0.8
    assert res["telemetry"]["successful_spans"] >= 7
    assert res["telemetry"]["failed_spans"] == 0

    # Verify exported artifacts
    json_files = list(out_dir.glob("*.json"))
    md_files = list(out_dir.glob("*.md"))
    assert len(json_files) >= 1
    assert len(md_files) >= 1


def test_run_full_pipeline_single_mode(tmp_path):
    """Test full end-to-end pipeline execution in single-shot optimization mode."""
    out_dir = tmp_path / "single_output"

    res = run_full_pipeline(
        mode="single",
        horizon_days=5,
        seed=101,
        out_dir=str(out_dir),
        export_formats=["json", "md"],
        strict_audit=True,
    )

    assert res["status"] in ("OPTIMAL", "FEASIBLE")
    assert res["tasks_scheduled"] > 0
    assert "benchmark" in res
    assert res["benchmark"]["total_tasks"] > 0
