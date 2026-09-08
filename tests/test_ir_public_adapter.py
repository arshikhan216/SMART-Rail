"""Unit tests for Public Indian Railways Dataset Compatibility Layer (Chunk 27)."""

import datetime as dt
import io
import pytest
import pandas as pd

from src.data_pipeline.ir_public_adapter import IndianRailwaysPublicAdapter
from src.schemas import TrainType, TrainDirection, TrainMovement, Department, DefectStatus


@pytest.fixture
def adapter():
    return IndianRailwaysPublicAdapter()


def test_parse_train_type_and_priority(adapter):
    """Test train classification and priority inference from real Indian Railways designations."""
    # Premium Trains
    assert adapter.parse_train_type("RAJDHANI", "MUMBAI RAJDHANI") == TrainType.PREMIUM_PASSENGER
    assert adapter.infer_train_priority(TrainType.PREMIUM_PASSENGER) == 1

    assert adapter.parse_train_type("SHATABDI", "HOWRAH SHATABDI") == TrainType.PREMIUM_PASSENGER
    assert adapter.infer_train_priority(TrainType.PREMIUM_PASSENGER) == 1

    assert adapter.parse_train_type("EXP", "NEW DELHI VANDE BHARAT EXP") == TrainType.PREMIUM_PASSENGER
    assert adapter.infer_train_priority(TrainType.PREMIUM_PASSENGER) == 1

    # Superfast & Express
    assert adapter.parse_train_type("SF", "PRAYAGRAJ SF EXP") == TrainType.EXPRESS_PASSENGER
    assert adapter.infer_train_priority(TrainType.EXPRESS_PASSENGER) == 2

    assert adapter.parse_train_type("MAIL", "KALKA MAIL") == TrainType.EXPRESS_PASSENGER
    assert adapter.infer_train_priority(TrainType.EXPRESS_PASSENGER) == 2

    # Passenger & Freight
    assert adapter.parse_train_type("MEMU", "GHAZIABAD MEMU SPECIAL") == TrainType.ORDINARY_PASSENGER
    assert adapter.infer_train_priority(TrainType.ORDINARY_PASSENGER) == 3

    assert adapter.parse_train_type("GOODS", "CONTAINER FREIGHT CORRIDOR") == TrainType.FREIGHT
    assert adapter.infer_train_priority(TrainType.FREIGHT) == 5


def test_parse_time_string(adapter):
    """Test robust time parser against diverse timetable time representations."""
    ref_date = dt.date(2026, 9, 8)

    # Standard 24h
    t1 = adapter.parse_time_string("14:30:00", ref_date)
    assert t1 == dt.datetime(2026, 9, 8, 14, 30, 0)

    # 12h AM/PM
    t2 = adapter.parse_time_string("02:45 PM", ref_date)
    assert t2 == dt.datetime(2026, 9, 8, 14, 45, 0)

    # With Day offset (Day 2 of journey)
    t3 = adapter.parse_time_string("06:15", ref_date, day_offset=1)
    assert t3 == dt.datetime(2026, 9, 9, 6, 15, 0)

    # Missing / None / Dash
    assert adapter.parse_time_string("-", ref_date) is None
    assert adapter.parse_time_string("None", ref_date) is None
    assert adapter.parse_time_string(None, ref_date) is None


def test_load_train_master(adapter):
    """Test parsing IR train master datasets (e.g. OGD India train master)."""
    csv_content = """Train No.,Train Name,Type,From Station Code,To Station Code
12951,MUMBAI RAJDHANI,RAJDHANI,MMCT,NDLS
12004,LUCKNOW SHATABDI,SHATABDI,NDLS,LKO
22436,VANDE BHARAT EXP,SF,NDLS,BSB
12417,PRAYAGRAJ EXP,SUPERFAST,PRYJ,NDLS
54321,DELHI ALIGARH PASS,PASSENGER,DLI,ALJN
BOXN01,COAL FREIGHT,GOODS,DHN,TKD
"""
    trains = adapter.load_train_master_from_csv(io.StringIO(csv_content))
    assert len(trains) == 6

    # Verify attributes
    rajdhani = next(t for t in trains if t.train_number == "12951")
    assert rajdhani.train_type == TrainType.PREMIUM_PASSENGER
    assert rajdhani.priority == 1
    assert rajdhani.source == "MMCT"
    assert rajdhani.destination == "NDLS"

    vande = next(t for t in trains if t.train_number == "22436")
    assert vande.train_type == TrainType.PREMIUM_PASSENGER
    assert vande.priority == 1

    freight = next(t for t in trains if t.train_number == "BOXN01")
    assert freight.train_type == TrainType.FREIGHT
    assert freight.priority == 5


def test_load_train_movements_timetable(adapter):
    """Test converting NTES timetable dumps with day-offsets to TrainMovement objects."""
    csv_content = """train_no,station_code,arrival_time,departure_time,day,direction
12951,NDLS,None,16:55,1,UP
12951,KOTA,21:45,21:55,1,UP
12951,RTM,01:50,01:53,2,UP
12951,MMCT,08:35,None,2,UP
"""
    base_date = dt.date(2026, 9, 8)
    movements = adapter.load_train_movements_from_csv(
        io.StringIO(csv_content), default_section="SEC-01", base_date=base_date
    )

    assert len(movements) == 4
    # First station (origin: arrival was None -> should adjust 10 mins before departure)
    m0 = movements[0]
    assert m0.section_id == "NDLS"
    assert m0.departure_time == dt.datetime(2026, 9, 8, 16, 55)
    assert m0.arrival_time < m0.departure_time
    assert m0.direction == TrainDirection.UP

    # Day 2 station
    m2 = movements[2]
    assert m2.section_id == "RTM"
    assert m2.arrival_time == dt.datetime(2026, 9, 9, 1, 50)
    assert m2.departure_time == dt.datetime(2026, 9, 9, 1, 53)


def test_load_track_inspections(adapter):
    """Test converting TMS/SMMS/TDMS track inspection logs into Assets and Defects."""
    csv_content = """asset_id,equipment_type,department,section,km_marker,condition_score,gmt,defect_type,defect_severity,overdue_days
AST-TRK-01,TrackSegment,P-WAY,SEC-NORTH,KM-142/5,58.5,35.0,RailFlawUSFD,4,12
AST-SIG-02,PointMachine,SIGNAL,SEC-NORTH,KM-143/0,82.0,0.0,None,0,0
AST-OHE-03,OHE_Mast,TRD,SEC-NORTH,KM-144/2,64.0,0.0,CantileverCorrosion,3,0
"""
    ref_date = dt.date(2026, 9, 8)
    assets, defects = adapter.load_track_inspections_from_csv(io.StringIO(csv_content), reference_date=ref_date)

    assert len(assets) == 3
    assert len(defects) == 2  # AST-SIG-02 had no defect

    # Check asset properties & department inference
    a1 = next(a for a in assets if a.asset_id == "AST-TRK-01")
    assert a1.department == Department.ENGINEERING
    assert a1.condition_score == 58.5
    assert a1.traffic_load == 35.0

    a2 = next(a for a in assets if a.asset_id == "AST-SIG-02")
    assert a2.department == Department.S_AND_T

    a3 = next(a for a in assets if a.asset_id == "AST-OHE-03")
    assert a3.department == Department.TRACTION

    # Check defect properties
    d1 = next(d for d in defects if d.asset_id == "AST-TRK-01")
    assert d1.defect_type == "RailFlawUSFD"
    assert d1.severity == 4
    assert d1.overdue_days == 12
    assert d1.status == DefectStatus.OPEN


def test_map_station_pairs_to_corridor_sections(adapter):
    """Test mapping raw station codes to corridor block sections."""
    movements = [
        TrainMovement(
            movement_id="M1",
            train_id="TRN-12951",
            section_id="NDLS",
            arrival_time=dt.datetime(2026, 9, 8, 10, 0),
            departure_time=dt.datetime(2026, 9, 8, 10, 15),
            direction=TrainDirection.UP,
        ),
        TrainMovement(
            movement_id="M2",
            train_id="TRN-12951",
            section_id="GZB",
            arrival_time=dt.datetime(2026, 9, 8, 10, 30),
            departure_time=dt.datetime(2026, 9, 8, 10, 45),
            direction=TrainDirection.UP,
        ),
    ]

    station_map = {"NDLS": "SEC-DELHI-GZB-01", "GZB": "SEC-DELHI-GZB-02"}
    mapped = adapter.map_station_pairs_to_corridor_sections(movements, station_map)

    assert mapped[0].section_id == "SEC-DELHI-GZB-01"
    assert mapped[1].section_id == "SEC-DELHI-GZB-02"
