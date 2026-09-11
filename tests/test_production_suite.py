"""Comprehensive Production Test Suite for SMART-Rail Multi-Engine Architecture."""

import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.api.main import app
from src.schemas import (
    Asset, MaintenanceTask, BlockWindow, Resource, Department, Train, TrainMovement,
    DataClassification, ValidationVerdict
)
from src.data_pipeline.adapters.railway_adapters import CSVAdapter, SyntheticDataAdapter
from src.validation.deterministic_validator import DeterministicScheduleValidator

client = TestClient(app)


def test_system_health():
    """Verify API health check and readiness."""
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert "SMART-Rail" in data["service"]


def test_model_registry():
    """Verify active model registry endpoint."""
    res = client.get("/api/v1/models")
    assert res.status_code == 200
    data = res.json()
    assert len(data["models"]) >= 3


def test_csv_and_synthetic_adapters():
    """Verify modular data adapters ingest canonical schemas without errors."""
    synth_adapter = SyntheticDataAdapter(seed=42)
    synth_tables = synth_adapter.fetch_data()
    assert "assets" in synth_tables
    assert len(synth_tables["assets"]) > 0

    csv_adapter = CSVAdapter(data_dir="data/rkmp_bpl")
    csv_tables = csv_adapter.fetch_data()
    assert "assets" in csv_tables
    assert len(csv_tables["assets"]) == 1137


def test_deterministic_validator_detects_impossible_duration():
    """Verify deterministic validator catches task durations exceeding block windows."""
    from src.schemas import OptimizationResult, ScheduleAssignment
    import datetime as dt

    validator = DeterministicScheduleValidator()
    
    mock_block = BlockWindow(
        block_id="BLK-TEST-01",
        section_id="SEC-RKMP-BPL",
        date=dt.date(2026, 9, 15),
        start_time=dt.datetime(2026, 9, 15, 14, 0),
        end_time=dt.datetime(2026, 9, 15, 16, 0)  # 2.0 hours
    )

    mock_task = MaintenanceTask(
        task_id="TSK-TEST-OVER",
        asset_id="AST-ENG-0001",
        section_id="SEC-RKMP-BPL",
        department=Department.ENGINEERING,
        maintenance_type="TrackTamping",
        duration_hours=4.5,  # 4.5 hours > 2.0 hours
        severity=3,
        urgency=3,
        deadline=dt.datetime(2026, 9, 16, 18, 0)
    )

    mock_assignment = ScheduleAssignment(
        assignment_id="ASGN-01",
        block_id="BLK-TEST-01",
        task_ids=["TSK-TEST-OVER"],
        section_id="SEC-RKMP-BPL",
        departments=[Department.ENGINEERING],
        scheduled_start=mock_block.start_time,
        scheduled_end=mock_block.end_time,
        duration_hours=2.0
    )

    mock_opt = OptimizationResult(
        plan_id="PLAN-TEST-FAIL",
        status="FEASIBLE",
        assignments=[mock_assignment]
    )

    report = validator.validate_plan(
        opt_result=mock_opt,
        all_tasks=[mock_task],
        all_blocks=[mock_block],
        all_resources=[]
    )

    assert report.overall_verdict == ValidationVerdict.BLOCKED
    assert report.checks_failed >= 1


def test_end_to_end_optimization_with_validation():
    """Verify end-to-end optimization pipeline with deterministic validation report."""
    csv_adapter = CSVAdapter(data_dir="data/rkmp_bpl")
    tables = csv_adapter.fetch_data()
    
    # Slice a small operational batch for swift testing
    sample_assets = tables["assets"].head(10).to_dict(orient="records")
    sample_tasks = tables["maintenance_tasks"].head(10).to_dict(orient="records")
    sample_blocks = tables["block_windows"].head(5).to_dict(orient="records")
    sample_resources = tables["resources"].head(5).to_dict(orient="records")

    payload = {
        "tasks": sample_tasks,
        "blocks": sample_blocks,
        "resources": sample_resources,
        "plan_id": "TEST-OPT-PLAN-01"
    }

    res = client.post("/api/v1/plan/optimize", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "plan_id" in data
    assert "validation" in data
    assert data["validation"]["overall_verdict"] in ["VALID", "REQUIRES_REVIEW", "BLOCKED"]
