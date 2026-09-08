"""Unit and integration tests for Chunk 2: Data Ingestion and Integration Pipeline."""

import datetime as dt
import json
import tempfile
from pathlib import Path
import pytest
import pandas as pd

from src.exceptions import DataValidationError
from src.data_pipeline.loaders import (
    CSVDataSource,
    JSONDataSource,
    TMSAdapter,
    SMMSAdapter,
    TDMSAdapter,
    COAAdapter,
    TimetableAdapter,
)
from src.data_pipeline.preprocessing import DataPreprocessor
from src.data_pipeline.validators import DataValidator, ValidationReport
from src.data_pipeline.integration import IntegratedDataPipeline, UnifiedDataStore


@pytest.fixture
def sample_raw_data():
    """Returns valid raw dataframe dictionaries."""
    assets = pd.DataFrame([
        {
            "asset_id": "AST-101",
            "asset_type": "TrackSegment",
            "department": "ENG",
            "section_id": "SEC-01",
            "location": "KM-10/2",
            "criticality": 4,
            "installation_date": "2018-05-12",
            "age_years": 6.0,
            "condition_score": 82.0,
            "traffic_load": 35.5,
        },
        {
            "asset_id": "AST-102",
            "asset_type": "SignalPost",
            "department": "SIGNAL",
            "section_id": "SEC-01",
            "location": "KM-11/0",
            "criticality": 5,
            "installation_date": "2020-01-10",
            "age_years": 4.0,
            "condition_score": 68.0,
            "traffic_load": 35.5,
        }
    ])

    defects = pd.DataFrame([
        {
            "defect_id": "DEF-001",
            "asset_id": "AST-101",
            "section_id": "SEC-01",
            "defect_type": "RailWear",
            "severity": 4,
            "detected_date": "2024-03-01",
            "status": "OPEN",
            "overdue_days": 5,
        }
    ])

    maintenance_tasks = pd.DataFrame([
        {
            "task_id": "TSK-001",
            "asset_id": "AST-101",
            "section_id": "SEC-01",
            "department": "ENGINEERING",
            "maintenance_type": "TrackTamping",
            "duration_hours": 2.5,
            "severity": 4,
            "urgency": 4,
            "deadline": "2024-03-10T18:00:00",
            "required_workers": 4,
        }
    ])

    trains = pd.DataFrame([
        {
            "train_id": "TRN-12951",
            "train_number": "12951",
            "train_type": "PREMIUM_PASSENGER",
            "priority": 1,
            "source": "MUMBAI",
            "destination": "DELHI",
        }
    ])

    train_movements = pd.DataFrame([
        {
            "movement_id": "MOV-001",
            "train_id": "TRN-12951",
            "section_id": "SEC-01",
            "arrival_time": "2024-03-05T02:00:00",
            "departure_time": "2024-03-05T02:40:00",
            "direction": "UP",
        }
    ])

    block_windows = pd.DataFrame([
        {
            "block_id": "BLK-001",
            "section_id": "SEC-01",
            "date": "2024-03-05",
            "start_time": "2024-03-05T01:00:00",
            "end_time": "2024-03-05T04:30:00",
            "available": True,
        }
    ])

    resources = pd.DataFrame([
        {
            "resource_id": "RES-ENG-1",
            "department": "ENGINEERING",
            "resource_type": "CREW",
            "capacity": 6,
            "available_from": "2024-03-05T00:00:00",
            "available_until": "2024-03-05T23:59:00",
        }
    ])

    return {
        "assets": assets,
        "defects": defects,
        "maintenance_tasks": maintenance_tasks,
        "trains": trains,
        "train_movements": train_movements,
        "block_windows": block_windows,
        "resources": resources,
    }


def test_tms_adapter():
    raw_tms = pd.DataFrame([
        {
            "track_id": "AST-ENG-01",
            "sec_code": "SEC-01",
            "km_location": "KM-15/2",
            "track_condition": 74.5,
            "install_dt": "2019-01-01",
            "age_years": 5.0,
            "criticality": 3,
            "asset_type": "TrackSegment",
        }
    ])
    adapter = TMSAdapter()
    harmonized = adapter.load(raw_tms)
    assert "asset_id" in harmonized.columns
    assert "section_id" in harmonized.columns
    assert harmonized["department"].iloc[0] == "ENGINEERING"


def test_smms_and_tdms_adapters():
    raw_smms = pd.DataFrame([{"signal_id": "AST-SIG-1", "sec_id": "SEC-01", "health_index": 80.0, "gear_type": "Signal"}])
    smms = SMMSAdapter().load(raw_smms)
    assert smms["department"].iloc[0] == "S_AND_T"
    assert smms["asset_id"].iloc[0] == "AST-SIG-1"

    raw_tdms = pd.DataFrame([{"ohe_mast_id": "AST-OHE-1", "sec_code": "SEC-01", "contact_wire_wear": 90.0, "ohe_type": "OHE_Mast"}])
    tdms = TDMSAdapter().load(raw_tdms)
    assert tdms["department"].iloc[0] == "TRACTION"
    assert tdms["asset_id"].iloc[0] == "AST-OHE-1"


def test_preprocessor_department_normalization(sample_raw_data):
    preprocessor = DataPreprocessor()
    df_assets = preprocessor.preprocess_assets(sample_raw_data["assets"])
    assert df_assets["department"].iloc[0] == "ENGINEERING"
    assert df_assets["department"].iloc[1] == "S_AND_T"


def test_validator_detects_foreign_key_violation(sample_raw_data):
    # Introduce an orphaned defect referencing a nonexistent asset
    bad_defects = pd.DataFrame([
        {
            "defect_id": "DEF-999",
            "asset_id": "NON_EXISTENT_ASSET",
            "section_id": "SEC-01",
            "defect_type": "Crack",
            "severity": 5,
            "detected_date": "2024-03-01",
            "status": "OPEN",
        }
    ])
    tables = {**sample_raw_data, "defects": bad_defects}
    
    validator = DataValidator()
    report = validator.validate_dataset(tables)
    assert not report.is_valid
    assert any(e.error_type == "FOREIGN_KEY_VIOLATION" for e in report.errors)


def test_validator_detects_invalid_temporal_order(sample_raw_data):
    bad_movements = pd.DataFrame([
        {
            "movement_id": "MOV-001",
            "train_id": "TRN-12951",
            "section_id": "SEC-01",
            "arrival_time": "2024-03-05T03:00:00",
            "departure_time": "2024-03-05T02:00:00",  # departure before arrival
            "direction": "UP",
        }
    ])
    tables = {**sample_raw_data, "train_movements": bad_movements}
    
    validator = DataValidator()
    report = validator.validate_dataset(tables)
    assert not report.is_valid
    assert any(e.error_type == "INVALID_TEMPORAL_ORDER" for e in report.errors)


def test_integrated_pipeline_end_to_end(sample_raw_data):
    pipeline = IntegratedDataPipeline()
    store, report = pipeline.process(sample_raw_data, strict_validation=True)

    assert report.is_valid
    assert len(store.assets) == 2
    assert len(store.defects) == 1
    assert len(store.maintenance_tasks) == 1
    assert len(store.trains) == 1
    assert len(store.train_movements) == 1
    assert len(store.block_windows) == 1

    # Verify Pydantic entities are accessible and typed
    assert store.assets[0].asset_id == "AST-101"
    assert store.assets[0].condition_score == 82.0
    assert store.block_windows[0].duration_hours == 3.5
