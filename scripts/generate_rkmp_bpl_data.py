"""Generate authentic, domain-correlated dataset for Rani Kamlapati (RKMP) - Bhopal Junction (BPL) corridor."""

from __future__ import annotations
import datetime as dt
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
import pandas as pd

from src.schemas import Department, TrainType, TrainDirection, ResourceType, DefectStatus


def generate_rkmp_bpl_dataset(out_dir: str = "data/rkmp_bpl", horizon_days: int = 7, seed: int = 42) -> None:
    rng = np.random.default_rng(seed)
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    start_date = dt.date(2026, 3, 1)

    # 1. Sections Master
    df_sections = pd.DataFrame([{
        "section_id": "SEC-RKMP-BPL",
        "name": "Rani Kamlapati (Habibganj) - Bhopal Junction",
        "length_km": 6.2,
        "tracks": 3,
        "traffic_density": "VERY_HIGH",
        "start_latitude": 23.2216,
        "start_longitude": 77.4401,
        "end_latitude": 23.2661,
        "end_longitude": 77.4137,
        "division": "Bhopal (BPL)",
        "zone": "West Central Railway (WCR)",
    }])
    df_sections.to_csv(out_path / "sections.csv", index=False)

    # 2. Realistic Assets along the 6.2 km corridor (Track, S&T, OHE Traction)
    assets = []
    # Engineering Assets (Track segments, Turnouts at RKMP/BPL yards, Crossovers)
    eng_items = [
        ("AST-ENG-RKMP-YD-01", "TurnoutSwitch", "KM-001/04 (RKMP Yard North)", 5, 88.5, 4.2, 58.0),
        ("AST-ENG-TRK-UP-01", "TrackSegment", "KM-002/12 (UP Main Line)", 4, 72.0, 7.5, 65.0),
        ("AST-ENG-TRK-DN-01", "TrackSegment", "KM-002/14 (DOWN Main Line)", 4, 68.5, 9.1, 65.0),
        ("AST-ENG-TRK-3RD-01", "TrackSegment", "KM-003/02 (3rd Line Goods)", 3, 62.0, 11.4, 75.0),
        ("AST-ENG-XING-01", "CrossoverPoint", "KM-003/18 (Subhash Nagar Jn)", 5, 54.0, 12.0, 70.0),
        ("AST-ENG-BRG-EXP-01", "BridgeExpansionJoint", "KM-004/08 (Patra Bridge)", 4, 59.0, 14.5, 60.0),
        ("AST-ENG-TRK-UP-02", "TrackSegment", "KM-005/06 (BPL Approach UP)", 4, 76.0, 6.0, 65.0),
        ("AST-ENG-BPL-YD-01", "TurnoutSwitch", "KM-006/02 (BPL Yard South)", 5, 82.0, 5.0, 62.0),
    ]
    for aid, atype, loc, crit, cond, age, traffic in eng_items:
        assets.append({
            "asset_id": aid, "asset_type": atype, "department": "ENGINEERING",
            "section_id": "SEC-RKMP-BPL", "location": loc, "criticality": crit,
            "installation_date": (start_date - dt.timedelta(days=int(age * 365))).isoformat(),
            "age_years": age, "condition_score": cond, "traffic_load": traffic,
            "last_maintenance_date": (start_date - dt.timedelta(days=int(rng.integers(20, 120)))).isoformat(),
        })

    # Signalling & Telecom Assets (MACLS Signals, Point Machines, Digital Axle Counters)
    snt_items = [
        ("AST-SNT-SIG-RKMP-N", "SignalPost", "KM-001/08 (RKMP Starter DN)", 5, 91.0, 3.5, 55.0),
        ("AST-SNT-PM-RKMP-101", "PointMachine", "KM-001/12 (Point 101A/B)", 5, 66.0, 8.0, 58.0),
        ("AST-SNT-DAC-SEC-01", "AxleCounter", "KM-002/20 (Block DAC Sec 1)", 5, 85.0, 4.0, 60.0),
        ("AST-SNT-TC-MID-01", "TrackCircuit", "KM-003/10 (Mid-Section TC)", 4, 60.0, 10.2, 62.0),
        ("AST-SNT-SIG-SBN-01", "SignalPost", "KM-003/24 (Subhash Nagar Auto Sig)", 4, 74.0, 6.5, 60.0),
        ("AST-SNT-PM-BPL-204", "PointMachine", "KM-005/18 (BPL Entry Point 204)", 5, 58.0, 11.0, 65.0),
        ("AST-SNT-SIG-BPL-S", "SignalPost", "KM-005/28 (BPL Home Signal UP)", 5, 89.0, 3.0, 58.0),
    ]
    for aid, atype, loc, crit, cond, age, traffic in snt_items:
        assets.append({
            "asset_id": aid, "asset_type": atype, "department": "S_AND_T",
            "section_id": "SEC-RKMP-BPL", "location": loc, "criticality": crit,
            "installation_date": (start_date - dt.timedelta(days=int(age * 365))).isoformat(),
            "age_years": age, "condition_score": cond, "traffic_load": traffic,
            "last_maintenance_date": (start_date - dt.timedelta(days=int(rng.integers(15, 90)))).isoformat(),
        })

    # Traction / OHE Assets (25kV Masts, Catenary/Contact wire segments, Section Insulators)
    tra_items = [
        ("AST-TRA-OHE-MST-01", "OHE_Mast", "KM-001/16 (Mast 1/16)", 3, 84.0, 6.0, 50.0),
        ("AST-TRA-CW-UP-01", "ContactWireSegment", "KM-002/00 to 003/50 UP", 5, 52.0, 13.0, 65.0),
        ("AST-TRA-SEC-INS-01", "SectionInsulator", "KM-003/20 (Subhash Nagar Neutral)", 5, 63.0, 7.5, 60.0),
        ("AST-TRA-CW-DN-01", "ContactWireSegment", "KM-003/50 to 005/00 DN", 4, 57.0, 11.5, 65.0),
        ("AST-TRA-TSS-FEED-01", "SubstationTransformer", "KM-004/10 (Habibganj TSS Feeder)", 5, 88.0, 5.0, 50.0),
        ("AST-TRA-OHE-MST-02", "OHE_Mast", "KM-005/22 (Mast 5/22 BPL End)", 3, 79.0, 8.0, 50.0),
    ]
    for aid, atype, loc, crit, cond, age, traffic in tra_items:
        assets.append({
            "asset_id": aid, "asset_type": atype, "department": "TRACTION",
            "section_id": "SEC-RKMP-BPL", "location": loc, "criticality": crit,
            "installation_date": (start_date - dt.timedelta(days=int(age * 365))).isoformat(),
            "age_years": age, "condition_score": cond, "traffic_load": traffic,
            "last_maintenance_date": (start_date - dt.timedelta(days=int(rng.integers(25, 110)))).isoformat(),
        })

    df_assets = pd.DataFrame(assets)
    df_assets.to_csv(out_path / "assets.csv", index=False)

    # 3. Specific Defects identified in Track Recording / Inspection
    defects = [
        {
            "defect_id": "DEF-RKMP-ENG-001", "asset_id": "AST-ENG-XING-01", "section_id": "SEC-RKMP-BPL", "defect_type": "TrackAlignmentDeviation",
            "severity": 4, "detected_date": (start_date - dt.timedelta(days=3)).isoformat(),
            "overdue_days": 2, "status": "OPEN", "location": "KM-003/18"
        },
        {
            "defect_id": "DEF-RKMP-ENG-002", "asset_id": "AST-ENG-TRK-3RD-01", "section_id": "SEC-RKMP-BPL", "defect_type": "BallastDeficiency",
            "severity": 3, "detected_date": (start_date - dt.timedelta(days=8)).isoformat(),
            "overdue_days": 5, "status": "OPEN", "location": "KM-003/02"
        },
        {
            "defect_id": "DEF-RKMP-SNT-001", "asset_id": "AST-SNT-PM-BPL-204", "section_id": "SEC-RKMP-BPL", "defect_type": "PointDetectionFailure",
            "severity": 5, "detected_date": (start_date - dt.timedelta(days=1)).isoformat(),
            "overdue_days": 1, "status": "OPEN", "location": "KM-005/18"
        },
        {
            "defect_id": "DEF-RKMP-TRA-001", "asset_id": "AST-TRA-CW-UP-01", "section_id": "SEC-RKMP-BPL", "defect_type": "ContactWireExcessWear",
            "severity": 4, "detected_date": (start_date - dt.timedelta(days=5)).isoformat(),
            "overdue_days": 3, "status": "OPEN", "location": "KM-002/00"
        },
        {
            "defect_id": "DEF-RKMP-TRA-002", "asset_id": "AST-TRA-SEC-INS-01", "section_id": "SEC-RKMP-BPL", "defect_type": "InsulatorFlashover",
            "severity": 4, "detected_date": (start_date - dt.timedelta(days=4)).isoformat(),
            "overdue_days": 1, "status": "OPEN", "location": "KM-003/20"
        },
    ]
    df_defects = pd.DataFrame(defects)
    df_defects.to_csv(out_path / "defects.csv", index=False)

    # 4. Maintenance Tasks to Schedule (Combining Corrective & Statutory Preventive)
    tasks = [
        # Corrective high-priority
        {"task_id": "TSK-RKMP-01", "asset_id": "AST-ENG-XING-01", "section_id": "SEC-RKMP-BPL", "department": "ENGINEERING",
         "maintenance_type": "TrackTamping", "work_type": "TrackTamping", "severity": 4, "urgency": 5, "duration_hours": 2.5, "deadline": (start_date + dt.timedelta(days=3, hours=12)).isoformat(),
         "required_workers": 6, "required_machine": "DuomaticTampingMachine", "is_safety_critical": True},
        {"task_id": "TSK-RKMP-02", "asset_id": "AST-SNT-PM-BPL-204", "section_id": "SEC-RKMP-BPL", "department": "S_AND_T",
         "maintenance_type": "PointMachineOverhaul", "work_type": "PointMachineOverhaul", "severity": 5, "urgency": 5, "duration_hours": 2.0, "deadline": (start_date + dt.timedelta(days=2, hours=8)).isoformat(),
         "required_workers": 4, "required_machine": None, "is_safety_critical": True},
        {"task_id": "TSK-RKMP-03", "asset_id": "AST-TRA-CW-UP-01", "section_id": "SEC-RKMP-BPL", "department": "TRACTION",
         "maintenance_type": "ContactWireReplacement", "work_type": "ContactWireReplacement", "severity": 4, "urgency": 4, "duration_hours": 3.0, "deadline": (start_date + dt.timedelta(days=4, hours=6)).isoformat(),
         "required_workers": 5, "required_machine": "TowerWagon", "is_safety_critical": True},
        # Preventive bundling candidates
        {"task_id": "TSK-RKMP-04", "asset_id": "AST-ENG-TRK-UP-01", "section_id": "SEC-RKMP-BPL", "department": "ENGINEERING",
         "maintenance_type": "RailGrinding", "work_type": "RailGrinding", "severity": 3, "urgency": 3, "duration_hours": 2.0, "deadline": (start_date + dt.timedelta(days=6, hours=18)).isoformat(),
         "required_workers": 5, "required_machine": "RailGrinderCar", "is_safety_critical": False},
        {"task_id": "TSK-RKMP-05", "asset_id": "AST-SNT-SIG-SBN-01", "section_id": "SEC-RKMP-BPL", "department": "S_AND_T",
         "maintenance_type": "SignalTesting", "work_type": "SignalTesting", "severity": 3, "urgency": 3, "duration_hours": 1.5, "deadline": (start_date + dt.timedelta(days=5, hours=20)).isoformat(),
         "required_workers": 3, "required_machine": None, "is_safety_critical": False},
        {"task_id": "TSK-RKMP-06", "asset_id": "AST-TRA-OHE-MST-01", "section_id": "SEC-RKMP-BPL", "department": "TRACTION",
         "maintenance_type": "OHE_Inspection", "work_type": "OHE_Inspection", "severity": 2, "urgency": 2, "duration_hours": 2.0, "deadline": (start_date + dt.timedelta(days=5, hours=12)).isoformat(),
         "required_workers": 4, "required_machine": "TowerWagon", "is_safety_critical": False},
        {"task_id": "TSK-RKMP-07", "asset_id": "AST-ENG-TRK-3RD-01", "section_id": "SEC-RKMP-BPL", "department": "ENGINEERING",
         "maintenance_type": "BallastCleaning", "work_type": "BallastCleaning", "severity": 3, "urgency": 3, "duration_hours": 3.0, "deadline": (start_date + dt.timedelta(days=7, hours=0)).isoformat(),
         "required_workers": 8, "required_machine": "BallastCleaningMachine", "is_safety_critical": False},
    ]
    df_tasks = pd.DataFrame(tasks)
    df_tasks.to_csv(out_path / "maintenance_tasks.csv", index=False)

    # 5. Real Indian Railways Trains operating on RKMP-BPL Section
    trains_meta = [
        ("TRN-20171", "20171", "Rani Kamlapati - Hazrat Nizamuddin Vande Bharat Exp", "PREMIUM_PASSENGER", 1, "RKMP", "NZM", "15:30", "15:40", "UP"),
        ("TRN-20172", "20172", "Hazrat Nizamuddin - Rani Kamlapati Vande Bharat Exp", "PREMIUM_PASSENGER", 1, "NZM", "RKMP", "22:10", "22:20", "DOWN"),
        ("TRN-20173", "20173", "Rani Kamlapati - Rewa Vande Bharat Exp", "PREMIUM_PASSENGER", 1, "RKMP", "REWA", "05:40", "05:50", "UP"),
        ("TRN-12001", "12001", "Rani Kamlapati - New Delhi Shatabdi Express", "PREMIUM_PASSENGER", 1, "RKMP", "NDLS", "15:15", "15:25", "UP"),
        ("TRN-12002", "12002", "New Delhi - Rani Kamlapati Shatabdi Express", "PREMIUM_PASSENGER", 1, "NDLS", "RKMP", "14:35", "14:45", "DOWN"),
        ("TRN-12615", "12615", "Grand Trunk Express (Chennai - New Delhi)", "EXPRESS_PASSENGER", 2, "MAS", "NDLS", "18:40", "18:55", "UP"),
        ("TRN-12616", "12616", "Grand Trunk Express (New Delhi - Chennai)", "EXPRESS_PASSENGER", 2, "NDLS", "MAS", "05:10", "05:25", "DOWN"),
        ("TRN-12621", "12621", "Tamil Nadu Express (Chennai - New Delhi)", "EXPRESS_PASSENGER", 2, "MAS", "NDLS", "20:10", "20:25", "UP"),
        ("TRN-12919", "12919", "Malwa Express (Indore - SVDK Katra)", "EXPRESS_PASSENGER", 2, "INDB", "SVDK", "17:30", "17:45", "UP"),
        ("TRN-18237", "18237", "Chhattisgarh Express (Bilaspur - Amritsar)", "ORDINARY_PASSENGER", 3, "BSP", "ASR", "06:10", "06:30", "UP"),
        ("TRN-01665", "01665", "Habibganj - Itarsi MEMU Special", "ORDINARY_PASSENGER", 3, "RKMP", "ET", "08:15", "08:35", "DOWN"),
        ("TRN-FRT-BPL-01", "BOXN-901", "NTPC Sarni Coal Rake", "FREIGHT", 4, "DDU", "BPL", "02:15", "02:50", "DOWN"),
        ("TRN-FRT-BPL-02", "CONCOR-402", "Mandideep Container Rake", "FREIGHT", 4, "MDDP", "TKD", "03:45", "04:20", "UP"),
    ]

    trains_list = []
    movements_list = []
    mov_idx = 1

    for tid, tnum, tname, ttype, prio, src, dst, arr_str, dep_str, direc in trains_meta:
        trains_list.append({
            "train_id": tid, "train_number": tnum, "train_type": ttype,
            "priority": prio, "source": src, "destination": dst,
        })
        arr_h, arr_m = map(int, arr_str.split(":"))
        dep_h, dep_m = map(int, dep_str.split(":"))

        for day in range(horizon_days):
            c_day = start_date + dt.timedelta(days=day)
            arr_dt = dt.datetime.combine(c_day, dt.time(arr_h, arr_m))
            dep_dt = dt.datetime.combine(c_day, dt.time(dep_h, dep_m))
            movements_list.append({
                "movement_id": f"MOV-RKMP-{mov_idx:04d}",
                "train_id": tid,
                "section_id": "SEC-RKMP-BPL",
                "arrival_time": arr_dt.isoformat(),
                "departure_time": dep_dt.isoformat(),
                "direction": direc,
            })
            mov_idx += 1

    pd.DataFrame(trains_list).to_csv(out_path / "trains.csv", index=False)
    pd.DataFrame(movements_list).to_csv(out_path / "train_movements.csv", index=False)

    # 6. Operational Block Windows (Standard IR Mega-block 01:00-05:30 & Afternoon slot 11:00-14:30)
    blocks = []
    blk_idx = 1
    for day in range(horizon_days):
        c_day = start_date + dt.timedelta(days=day)
        # Night Mega Block Window (01:00 - 05:30 -> 4.5h)
        blocks.append({
            "block_id": f"BLK-RKMP-{blk_idx:03d}",
            "section_id": "SEC-RKMP-BPL",
            "date": c_day.isoformat(),
            "start_time": dt.datetime.combine(c_day, dt.time(1, 0)).isoformat(),
            "end_time": dt.datetime.combine(c_day, dt.time(5, 30)).isoformat(),
            "available": True,
        })
        blk_idx += 1
        # Afternoon Traffic Shadow Window (11:00 - 14:30 -> 3.5h)
        blocks.append({
            "block_id": f"BLK-RKMP-{blk_idx:03d}",
            "section_id": "SEC-RKMP-BPL",
            "date": c_day.isoformat(),
            "start_time": dt.datetime.combine(c_day, dt.time(11, 0)).isoformat(),
            "end_time": dt.datetime.combine(c_day, dt.time(14, 30)).isoformat(),
            "available": True,
        })
        blk_idx += 1

    pd.DataFrame(blocks).to_csv(out_path / "block_windows.csv", index=False)

    # 7. Resources stationed at Bhopal Division Track Machine Depot & Habibganj Gang
    resources = [
        {"resource_id": "RES-BPL-ENG-CREW-01", "department": "ENGINEERING", "resource_type": "CREW", "resource_name": "Habibganj P-Way Gang 04",
         "capacity": 15, "available_from": dt.datetime.combine(start_date, dt.time(0, 0)).isoformat(), "available_until": dt.datetime.combine(start_date + dt.timedelta(days=horizon_days), dt.time(23, 59)).isoformat(), "section_id": "SEC-RKMP-BPL"},
        {"resource_id": "RES-BPL-SNT-CREW-01", "department": "S_AND_T", "resource_type": "CREW", "resource_name": "Bhopal Jn S&T Section Gang",
         "capacity": 10, "available_from": dt.datetime.combine(start_date, dt.time(0, 0)).isoformat(), "available_until": dt.datetime.combine(start_date + dt.timedelta(days=horizon_days), dt.time(23, 59)).isoformat(), "section_id": "SEC-RKMP-BPL"},
        {"resource_id": "RES-BPL-TRA-CREW-01", "department": "TRACTION", "resource_type": "CREW", "resource_name": "BPL TRD OHE Maintenance Gang",
         "capacity": 12, "available_from": dt.datetime.combine(start_date, dt.time(0, 0)).isoformat(), "available_until": dt.datetime.combine(start_date + dt.timedelta(days=horizon_days), dt.time(23, 59)).isoformat(), "section_id": "SEC-RKMP-BPL"},
        # Specialized Depot Machines at Nishatpura / Bhopal Machine Depot
        {"resource_id": "RES-MACH-DUOMATIC-01", "department": "ENGINEERING", "resource_type": "MACHINE", "resource_name": "DuomaticTampingMachine",
         "capacity": 1, "available_from": dt.datetime.combine(start_date, dt.time(0, 0)).isoformat(), "available_until": dt.datetime.combine(start_date + dt.timedelta(days=horizon_days), dt.time(23, 59)).isoformat(), "section_id": "SEC-RKMP-BPL"},
        {"resource_id": "RES-MACH-GRINDER-01", "department": "ENGINEERING", "resource_type": "MACHINE", "resource_name": "RailGrinderCar",
         "capacity": 1, "available_from": dt.datetime.combine(start_date, dt.time(0, 0)).isoformat(), "available_until": dt.datetime.combine(start_date + dt.timedelta(days=horizon_days), dt.time(23, 59)).isoformat(), "section_id": "SEC-RKMP-BPL"},
        {"resource_id": "RES-MACH-BCM-01", "department": "ENGINEERING", "resource_type": "MACHINE", "resource_name": "BallastCleaningMachine",
         "capacity": 1, "available_from": dt.datetime.combine(start_date, dt.time(0, 0)).isoformat(), "available_until": dt.datetime.combine(start_date + dt.timedelta(days=horizon_days), dt.time(23, 59)).isoformat(), "section_id": "SEC-RKMP-BPL"},
        {"resource_id": "RES-MACH-TOWERWAGON-01", "department": "TRACTION", "resource_type": "MACHINE", "resource_name": "TowerWagon",
         "capacity": 1, "available_from": dt.datetime.combine(start_date, dt.time(0, 0)).isoformat(), "available_until": dt.datetime.combine(start_date + dt.timedelta(days=horizon_days), dt.time(23, 59)).isoformat(), "section_id": "SEC-RKMP-BPL"},
    ]
    pd.DataFrame(resources).to_csv(out_path / "resources.csv", index=False)

    # 8. Maintenance History
    history = [
        {"history_id": f"HIST-BPL-{idx+1:04d}", "asset_id": aid, "section_id": "SEC-RKMP-BPL", "department": df_assets.loc[df_assets["asset_id"] == aid, "department"].values[0],
         "maintenance_type": "RoutineInspection", "completed_date": (start_date - dt.timedelta(days=45)).isoformat(),
         "duration_hours": 2.0, "cost": 45000.0, "failure_occurred_after_days": 180}
        for idx, aid in enumerate(df_assets["asset_id"].tolist())
    ]
    pd.DataFrame(history).to_csv(out_path / "maintenance_history.csv", index=False)

    # 9. Weather (Bhopal semi-arid tropical climate)
    weather = []
    for day in range(horizon_days):
        c_day = start_date + dt.timedelta(days=day)
        weather.append({
            "record_id": f"WTH-BPL-{day+1:03d}",
            "section_id": "SEC-RKMP-BPL",
            "date": c_day.isoformat(),
            "temperature_c": 33.5 + float(rng.normal(0, 2.0)),
            "rainfall_mm": 0.0,
            "humidity_pct": 42.0 + float(rng.normal(0, 5.0)),
            "weather_condition": "NORMAL",
        })
    pd.DataFrame(weather).to_csv(out_path / "weather.csv", index=False)

    print(f"Successfully generated Rani Kamlapati - Bhopal Junction dataset in '{out_path}'!")


if __name__ == "__main__":
    generate_rkmp_bpl_dataset()
