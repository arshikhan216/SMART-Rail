"""Unit and integration tests for FastAPI REST API endpoints."""

from datetime import datetime, date, timedelta
import pytest
from fastapi.testclient import TestClient

from src.api.main import app

client = TestClient(app)


def _sample_asset_dict():
    return {
        "asset_id": "AST-API-01",
        "asset_type": "TrackSegment",
        "department": "ENGINEERING",
        "section_id": "SEC-01",
        "location": "KM 142/10",
        "criticality": 4,
        "installation_date": "2018-05-10",
        "age_years": 8.0,
        "condition_score": 68.5,
        "traffic_load": 25.0,
    }


def _sample_task_dict(task_id: str = "TSK-API-01", dur: float = 2.0):
    now = datetime(2026, 9, 8, 10, 0)
    return {
        "task_id": task_id,
        "asset_id": "AST-API-01",
        "section_id": "SEC-01",
        "department": "ENGINEERING",
        "maintenance_type": "TrackTamping",
        "severity": 4,
        "urgency": 4,
        "duration_hours": dur,
        "deadline": (now + timedelta(hours=48)).isoformat(),
        "required_workers": 4,
    }


def _sample_block_dict(block_id: str = "BLK-API-01"):
    now = datetime(2026, 9, 8, 12, 0)
    return {
        "block_id": block_id,
        "section_id": "SEC-01",
        "date": "2026-09-08",
        "start_time": now.isoformat(),
        "end_time": (now + timedelta(hours=4)).isoformat(),
        "available": True,
    }


def _sample_resource_dict():
    now = datetime(2026, 9, 8, 0, 0)
    return {
        "resource_id": "RES-API-01",
        "department": "ENGINEERING",
        "resource_type": "CREW",
        "capacity": 10,
        "available_from": now.isoformat(),
        "available_until": (now + timedelta(hours=48)).isoformat(),
        "section_id": "SEC-01",
    }


def test_health_and_root_endpoints():
    r_root = client.get("/")
    assert r_root.status_code == 200
    assert r_root.json()["status"] == "OPERATIONAL"

    r_health = client.get("/health")
    assert r_health.status_code == 200
    assert r_health.json()["status"] == "HEALTHY"


def test_risk_predict_api():
    payload = {"assets": [_sample_asset_dict()]}
    res = client.post("/api/v1/risk/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["predictions"]) == 1
    assert len(data["explanations"]) == 1
    assert data["predictions"][0]["asset_id"] == "AST-API-01"


def test_priority_score_api():
    payload = {
        "tasks": [_sample_task_dict()],
        "assets": [_sample_asset_dict()],
    }
    res = client.post("/api/v1/priority/score", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["results"]) == 1
    assert data["results"][0]["priority_score"] >= 0.0


def test_coordination_evaluate_api():
    t1 = _sample_task_dict("TSK-01", 2.0)
    t2 = _sample_task_dict("TSK-02", 1.5)
    t2["department"] = "S_AND_T"
    t2["maintenance_type"] = "SignalInspection"

    payload = {"tasks": [t1, t2]}
    res = client.post("/api/v1/coordination/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["is_compatible"] is True
    assert data["saved_possession_hours"] > 0.0


def test_plan_weekly_api():
    payload = {
        "tasks": [_sample_task_dict()],
        "blocks": [_sample_block_dict()],
        "resources": [_sample_resource_dict()],
        "week_start_date": "2026-09-08",
    }
    res = client.post("/api/v1/plan/weekly", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_tasks_scheduled"] >= 1
    assert len(data["daily_plans"]) == 7


def test_evaluation_benchmark_api():
    payload = {
        "tasks": [_sample_task_dict()],
        "blocks": [_sample_block_dict()],
        "resources": [_sample_resource_dict()],
        "dataset_name": "API-Test-Bench",
    }
    res = client.post("/api/v1/evaluation/benchmark", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["dataset_name"] == "API-Test-Bench"
    assert len(data["records"]) == 3
