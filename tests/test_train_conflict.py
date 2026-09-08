"""Unit tests for Chunk 7: Train Conflict Detector and Impact Analysis."""

import datetime as dt
import pytest
from src.train_impact.conflict_detector import TrainConflictDetector, TrainConflictReport
from src.schemas import Train, TrainMovement, BlockWindow, TrainType, TrainDirection
from src.config import TrainImpactConfig


@pytest.fixture
def sample_trains():
    t_vande = Train(
        train_id="TRN-22436",
        train_number="22436",
        train_type=TrainType.PREMIUM_PASSENGER,
        priority=1,
        source="NDLS",
        destination="BSB",
    )
    t_freight = Train(
        train_id="TRN-9001",
        train_number="9001",
        train_type=TrainType.FREIGHT,
        priority=4,
        source="DDU",
        destination="GZB",
    )
    return {"TRN-22436": t_vande, "TRN-9001": t_freight}


def test_interval_overlap_logic():
    detector = TrainConflictDetector()

    # Block from 02:00 to 05:00
    b_st = dt.datetime(2026, 3, 5, 2, 0)
    b_et = dt.datetime(2026, 3, 5, 5, 0)

    # 1. Train entirely before block (00:30 - 01:30)
    overlap, mins = detector.check_interval_overlap(b_st, b_et, dt.datetime(2026, 3, 5, 0, 30), dt.datetime(2026, 3, 5, 1, 30))
    assert not overlap
    assert mins == 0.0

    # 2. Train entirely after block (05:30 - 06:30)
    overlap, mins = detector.check_interval_overlap(b_st, b_et, dt.datetime(2026, 3, 5, 5, 30), dt.datetime(2026, 3, 5, 6, 30))
    assert not overlap
    assert mins == 0.0

    # 3. Train overlapping start boundary (01:30 - 03:00) -> 60 mins overlap
    overlap, mins = detector.check_interval_overlap(b_st, b_et, dt.datetime(2026, 3, 5, 1, 30), dt.datetime(2026, 3, 5, 3, 0))
    assert overlap
    assert mins == 60.0

    # 4. Train overlapping end boundary (04:00 - 06:00) -> 60 mins overlap
    overlap, mins = detector.check_interval_overlap(b_st, b_et, dt.datetime(2026, 3, 5, 4, 0), dt.datetime(2026, 3, 5, 6, 0))
    assert overlap
    assert mins == 60.0

    # 5. Train entirely within block (02:30 - 03:30) -> 60 mins overlap
    overlap, mins = detector.check_interval_overlap(b_st, b_et, dt.datetime(2026, 3, 5, 2, 30), dt.datetime(2026, 3, 5, 3, 30))
    assert overlap
    assert mins == 60.0


def test_midnight_crossing_conflict(sample_trains):
    detector = TrainConflictDetector()

    # Block crosses midnight: 23:00 March 5 to 03:00 March 6
    block = BlockWindow(
        block_id="BLK-MIDNIGHT-01",
        section_id="SEC-01",
        date=dt.date(2026, 3, 5),
        start_time=dt.datetime(2026, 3, 5, 23, 0),
        end_time=dt.datetime(2026, 3, 6, 3, 0),
        available=True,
    )

    # Train movement at 01:15 to 02:00 March 6
    movement = TrainMovement(
        movement_id="MOV-NIGHT-01",
        train_id="TRN-9001",
        section_id="SEC-01",
        arrival_time=dt.datetime(2026, 3, 6, 1, 15),
        departure_time=dt.datetime(2026, 3, 6, 2, 0),
        direction=TrainDirection.UP,
    )

    report = detector.analyze_block_conflicts(block, [movement], sample_trains)

    assert report.total_conflicting_trains == 1
    assert report.freight_trains_affected == 1
    assert report.passenger_trains_affected == 0
    assert report.impact_score > 0.0
    assert len(report.movements) == 1
    assert report.movements[0].overlap_duration_minutes == 45.0


def test_high_priority_passenger_impact_weighting(sample_trains):
    detector = TrainConflictDetector(
        config=TrainImpactConfig(passenger_weight=1.5, freight_weight=1.0, high_priority_weight=3.0)
    )

    block = BlockWindow(
        block_id="BLK-01",
        section_id="SEC-01",
        date=dt.date(2026, 3, 5),
        start_time=dt.datetime(2026, 3, 5, 6, 0),
        end_time=dt.datetime(2026, 3, 5, 9, 0),
        available=True,
    )

    # Premium passenger movement
    vande_mov = TrainMovement(
        movement_id="MOV-VB-01",
        train_id="TRN-22436",
        section_id="SEC-01",
        arrival_time=dt.datetime(2026, 3, 5, 6, 30),
        departure_time=dt.datetime(2026, 3, 5, 7, 30),
        direction=TrainDirection.DOWN,
    )

    report = detector.analyze_block_conflicts(block, [vande_mov], sample_trains)

    assert report.passenger_trains_affected == 1
    assert report.high_priority_trains_affected == 1
    # passenger (1.5) + high_priority (3.0) + overlap_hours (1.0 * 2.0) = 6.5
    assert pytest.approx(report.impact_score, rel=1e-2) == 6.5


def test_batch_block_analysis(sample_trains):
    detector = TrainConflictDetector()

    b1 = BlockWindow(
        block_id="BLK-01",
        section_id="SEC-01",
        date=dt.date(2026, 3, 5),
        start_time=dt.datetime(2026, 3, 5, 2, 0),
        end_time=dt.datetime(2026, 3, 5, 5, 0),
        available=True,
    )
    b2 = BlockWindow(
        block_id="BLK-02",
        section_id="SEC-02",  # Different section with no movements
        date=dt.date(2026, 3, 5),
        start_time=dt.datetime(2026, 3, 5, 2, 0),
        end_time=dt.datetime(2026, 3, 5, 5, 0),
        available=True,
    )

    mov = TrainMovement(
        movement_id="MOV-01",
        train_id="TRN-9001",
        section_id="SEC-01",
        arrival_time=dt.datetime(2026, 3, 5, 3, 0),
        departure_time=dt.datetime(2026, 3, 5, 4, 0),
        direction=TrainDirection.UP,
    )

    reports = detector.analyze_all_blocks([b1, b2], [mov], list(sample_trains.values()))

    assert reports["BLK-01"].total_conflicting_trains == 1
    assert reports["BLK-02"].total_conflicting_trains == 0
    assert reports["BLK-02"].impact_score == 0.0
