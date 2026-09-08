"""Unit tests for Chunk 1: Domain Schemas, Configuration, and Exceptions."""

from datetime import date, datetime, timedelta
import pytest
from pydantic import ValidationError

from src.schemas import (
    Department,
    TrainType,
    TrainDirection,
    ResourceType,
    DefectStatus,
    Asset,
    Defect,
    MaintenanceTask,
    Train,
    TrainMovement,
    BlockWindow,
    Resource,
    MaintenanceHistory,
    WeatherRecord,
    CandidateAssignment,
    ScheduleAssignment,
    OptimizationResult,
)
from src.config import load_config, AppConfig
from src.exceptions import RailPlannerError, DataValidationError


def test_asset_creation_valid():
    asset = Asset(
        asset_id="AST-001",
        asset_type="TrackSegment",
        department=Department.ENGINEERING,
        section_id="SEC-NDLS-GZB",
        location="KM-12/4",
        criticality=4,
        installation_date=date(2015, 6, 1),
        age_years=9.2,
        condition_score=78.5,
        traffic_load=45.2,
        last_maintenance_date=date(2024, 1, 15),
    )
    assert asset.asset_id == "AST-001"
    assert asset.department == Department.ENGINEERING
    assert asset.condition_score == 78.5


def test_asset_invalid_condition_score():
    with pytest.raises(ValidationError):
        Asset(
            asset_id="AST-002",
            asset_type="TrackSegment",
            department=Department.ENGINEERING,
            section_id="SEC-NDLS-GZB",
            location="KM-12/4",
            criticality=4,
            installation_date=date(2015, 6, 1),
            age_years=9.2,
            condition_score=150.0,  # Invalid: > 100
        )


def test_defect_creation():
    defect = Defect(
        defect_id="DEF-101",
        asset_id="AST-001",
        section_id="SEC-NDLS-GZB",
        defect_type="RailFractureRisk",
        severity=5,
        detected_date=date(2024, 3, 1),
        status=DefectStatus.OPEN,
        overdue_days=3,
    )
    assert defect.defect_id == "DEF-101"
    assert defect.severity == 5


def test_maintenance_task_creation():
    task = MaintenanceTask(
        task_id="TSK-201",
        asset_id="AST-001",
        section_id="SEC-NDLS-GZB",
        department=Department.ENGINEERING,
        maintenance_type="TrackTamping",
        duration_hours=2.5,
        severity=4,
        urgency=5,
        deadline=datetime(2024, 3, 10, 18, 0),
        required_workers=6,
        required_machine="DuomaticTampingMachine",
    )
    assert task.duration_hours == 2.5
    assert task.department == Department.ENGINEERING


def test_train_movement_validation():
    t_start = datetime(2024, 3, 5, 10, 0)
    t_end = datetime(2024, 3, 5, 10, 30)
    
    movement = TrainMovement(
        movement_id="MOV-001",
        train_id="TRN-12951",
        section_id="SEC-NDLS-GZB",
        arrival_time=t_start,
        departure_time=t_end,
        direction=TrainDirection.DOWN,
    )
    assert movement.movement_id == "MOV-001"

    # Inverted timestamps must fail validation
    with pytest.raises(ValidationError):
        TrainMovement(
            movement_id="MOV-002",
            train_id="TRN-12951",
            section_id="SEC-NDLS-GZB",
            arrival_time=t_end,
            departure_time=t_start,
            direction=TrainDirection.DOWN,
        )


def test_block_window_duration_and_validation():
    t_start = datetime(2024, 3, 5, 2, 0)
    t_end = datetime(2024, 3, 5, 5, 0)

    block = BlockWindow(
        block_id="BLK-001",
        section_id="SEC-NDLS-GZB",
        date=date(2024, 3, 5),
        start_time=t_start,
        end_time=t_end,
        available=True,
    )
    assert block.duration_hours == 3.0

    # Inverted timestamps must fail validation
    with pytest.raises(ValidationError):
        BlockWindow(
            block_id="BLK-002",
            section_id="SEC-NDLS-GZB",
            date=date(2024, 3, 5),
            start_time=t_end,
            end_time=t_start,
            available=True,
        )


def test_resource_model():
    res = Resource(
        resource_id="RES-ENG-CREW-1",
        department=Department.ENGINEERING,
        resource_type=ResourceType.CREW,
        capacity=8,
        available_from=datetime(2024, 3, 5, 0, 0),
        available_until=datetime(2024, 3, 5, 23, 59),
        section_id="SEC-NDLS-GZB",
    )
    assert res.capacity == 8
    assert res.resource_type == ResourceType.CREW


def test_config_loader():
    config = load_config()
    assert isinstance(config, AppConfig)
    assert config.priority_weights.risk == 0.40
    assert config.optimization.solver_max_time_seconds == 60


def test_custom_exceptions():
    err = DataValidationError("Invalid CSV schema", details={"column": "condition_score"})
    assert "Invalid CSV schema" in str(err)
    assert "condition_score" in str(err)
    assert isinstance(err, RailPlannerError)
