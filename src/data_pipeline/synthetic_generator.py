"""Realistic domain-correlated synthetic data generator for Indian Railways block planning."""

from __future__ import annotations
import datetime as dt
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd

from src.schemas import (
    Department,
    TrainType,
    TrainDirection,
    ResourceType,
    DefectStatus,
)

logger = logging.getLogger(__name__)


class SyntheticDataGenerator:
    """Generates correlated railway datasets reflecting operational distributions."""

    SECTIONS_MASTER = [
        {"section_id": "SEC-NDLS-GZB", "name": "New Delhi - Ghaziabad", "length_km": 28.0, "tracks": 4, "traffic_density": "VERY_HIGH"},
        {"section_id": "SEC-GZB-CNB", "name": "Ghaziabad - Kanpur Central", "length_km": 412.0, "tracks": 3, "traffic_density": "HIGH"},
        {"section_id": "SEC-CNB-PRYJ", "name": "Kanpur Central - Prayagraj", "length_km": 194.0, "tracks": 3, "traffic_density": "HIGH"},
        {"section_id": "SEC-PRYJ-DDU", "name": "Prayagraj - Pt DD Upadhyaya", "length_km": 153.0, "tracks": 3, "traffic_density": "VERY_HIGH"},
        {"section_id": "SEC-DDU-PNBE", "name": "Pt DD Upadhyaya - Patna", "length_km": 212.0, "tracks": 2, "traffic_density": "HIGH"},
        {"section_id": "SEC-BCT-ST", "name": "Mumbai Central - Surat", "length_km": 263.0, "tracks": 3, "traffic_density": "VERY_HIGH"},
        {"section_id": "SEC-ST-BRC", "name": "Surat - Vadodara", "length_km": 129.0, "tracks": 3, "traffic_density": "HIGH"},
        {"section_id": "SEC-BRC-ADI", "name": "Vadodara - Ahmedabad", "length_km": 100.0, "tracks": 2, "traffic_density": "HIGH"},
        {"section_id": "SEC-MAS-RU", "name": "Chennai Central - Renigunta", "length_km": 137.0, "tracks": 2, "traffic_density": "MEDIUM"},
        {"section_id": "SEC-HWH-KGP", "name": "Howrah - Kharagpur", "length_km": 115.0, "tracks": 3, "traffic_density": "VERY_HIGH"},
    ]

    DEPT_ASSET_TYPES = {
        "ENGINEERING": ["TrackSegment", "TurnoutSwitch", "CrossoverPoint", "BridgeExpansionJoint", "FishplatedJoint"],
        "S_AND_T": ["SignalPost", "PointMachine", "AxleCounter", "TrackCircuit", "InterlockingRelayRack"],
        "TRACTION": ["OHE_Mast", "ContactWireSegment", "SubstationTransformer", "SectionInsulator", "PantographCatenaryBond"],
    }

    DEPT_DEFECT_TYPES = {
        "ENGINEERING": ["RailFractureRisk", "TrackAlignmentDeviation", "SleeperCrack", "BallastDeficiency", "GaugeWideness"],
        "S_AND_T": ["PointDetectionFailure", "SignalLampBurnout", "AxleCounterResetFault", "TrackCircuitFalseOccupancy", "RelayContactWear"],
        "TRACTION": ["OHE_Sag", "ContactWireExcessWear", "InsulatorFlashover", "MastCorrosion", "CantileverMisalignment"],
    }

    DEPT_MAINT_TYPES = {
        "ENGINEERING": ["TrackTamping", "RailGrinding", "BallastCleaning", "SwitchOverhaul", "JointWelding"],
        "S_AND_T": ["SignalTesting", "PointMachineOverhaul", "AxleCounterCalibration", "RelayInterlockingInspection", "CableMeggering"],
        "TRACTION": ["OHE_Inspection", "ContactWireReplacement", "TransformerOilFiltration", "SectionInsulatorAdjust", "CatenaryRetensioning"],
    }

    DEPT_MACHINES = {
        "ENGINEERING": ["DuomaticTampingMachine", "BallastCleaningMachine", "RailGrinderCar", "UtilityTrackVehicle"],
        "S_AND_T": ["S&T_DiagnosticVehicle", "SignalTowerVan"],
        "TRACTION": ["TowerWagon", "WiringTrain", "OHE_InspectionCar"],
    }

    def __init__(self, seed: int = 42):
        self.seed = seed
        self.rng = np.random.default_rng(seed)

    def generate_all(
        self,
        num_assets: int = 300,
        horizon_days: int = 14,
        start_date: Optional[dt.date] = None,
    ) -> Dict[str, pd.DataFrame]:
        """Generate complete correlated relational datasets."""
        if start_date is None:
            start_date = dt.date(2026, 3, 1)

        logger.info(f"Generating synthetic railway data: {num_assets} assets, {horizon_days} days horizon (Seed: {self.seed})")

        # 1. Sections
        df_sections = pd.DataFrame(self.SECTIONS_MASTER)
        section_ids = df_sections["section_id"].tolist()

        # 2. Assets
        df_assets = self._generate_assets(num_assets, section_ids, start_date)

        # 3. Defects (Correlated with asset condition and traffic)
        df_defects = self._generate_defects(df_assets, start_date)

        # 4. Maintenance Tasks (Generated from defects and preventive cycles)
        df_tasks = self._generate_maintenance_tasks(df_assets, df_defects, start_date, horizon_days)

        # 5. Trains & Timetable Movements
        df_trains, df_movements = self._generate_trains_and_movements(section_ids, start_date, horizon_days)

        # 6. Block Windows (COA corridor windows)
        df_blocks = self._generate_block_windows(section_ids, start_date, horizon_days)

        # 7. Resources (Departmental crews and specialized machines)
        df_resources = self._generate_resources(section_ids, start_date, horizon_days)

        # 8. Maintenance History
        df_history = self._generate_maintenance_history(df_assets, start_date)

        # 9. Weather Records
        df_weather = self._generate_weather_records(section_ids, start_date, horizon_days)

        return {
            "sections": df_sections,
            "assets": df_assets,
            "defects": df_defects,
            "maintenance_tasks": df_tasks,
            "trains": df_trains,
            "train_movements": df_movements,
            "block_windows": df_blocks,
            "resources": df_resources,
            "maintenance_history": df_history,
            "weather": df_weather,
        }

    def _generate_assets(self, num_assets: int, section_ids: List[str], current_date: dt.date) -> pd.DataFrame:
        records = []
        departments = ["ENGINEERING", "S_AND_T", "TRACTION"]
        dept_probs = [0.45, 0.30, 0.25]

        for i in range(1, num_assets + 1):
            dept_str = str(self.rng.choice(departments, p=dept_probs))
            asset_type = str(self.rng.choice(self.DEPT_ASSET_TYPES[dept_str]))
            sec_id = str(self.rng.choice(section_ids))

            # Location marker e.g., KM-124/15
            km_post = int(self.rng.integers(1, 400))
            tele_pole = int(self.rng.integers(1, 30))
            location = f"KM-{km_post}/{tele_pole}"

            # Operational criticality (1 to 5)
            criticality = int(self.rng.choice([1, 2, 3, 4, 5], p=[0.10, 0.20, 0.35, 0.25, 0.10]))

            # Asset age: Gamma distributed (avg ~ 8-12 years)
            age_years = round(float(self.rng.gamma(shape=3.0, scale=3.5)), 1)
            age_years = max(0.5, min(age_years, 35.0))

            # Commissioning date
            install_days_ago = int(age_years * 365.25)
            install_date = current_date - dt.timedelta(days=install_days_ago)

            # Traffic load in GMT (Gross Million Tonnes per annum) or high train density
            traffic_load = round(float(self.rng.lognormal(mean=3.5, sigma=0.5)), 1)
            traffic_load = max(10.0, min(traffic_load, 120.0))

            # Asset condition score: Negatively correlated with age and traffic load
            age_penalty = age_years * float(self.rng.uniform(1.2, 2.0))
            traffic_penalty = (traffic_load / 50.0) * float(self.rng.uniform(5.0, 12.0))
            base_condition = 100.0 - age_penalty - traffic_penalty + float(self.rng.normal(0, 4))
            condition_score = round(float(np.clip(base_condition, 15.0, 98.0)), 1)

            # Days since last maintenance
            days_since_maint = int(self.rng.integers(15, 300))
            last_maint_date = current_date - dt.timedelta(days=days_since_maint)

            records.append({
                "asset_id": f"AST-{dept_str[:3]}-{i:04d}",
                "asset_type": asset_type,
                "department": dept_str,
                "section_id": sec_id,
                "location": location,
                "criticality": criticality,
                "installation_date": install_date.isoformat(),
                "age_years": age_years,
                "condition_score": condition_score,
                "traffic_load": traffic_load,
                "last_maintenance_date": last_maint_date.isoformat(),
            })

        return pd.DataFrame(records)

    def _generate_defects(self, df_assets: pd.DataFrame, current_date: dt.date) -> pd.DataFrame:
        records = []
        defect_idx = 1

        for _, asset in df_assets.iterrows():
            cond = float(asset["condition_score"])
            dept_str = str(asset["department"])

            # Probability of defect rises sharply as condition deteriorates
            defect_prob = 0.05 + 0.85 * ((100.0 - cond) / 100.0) ** 2.2
            if float(self.rng.random()) < defect_prob:
                num_defects_on_asset = int(self.rng.choice([1, 2, 3], p=[0.75, 0.20, 0.05]))
                for _ in range(num_defects_on_asset):
                    defect_type = str(self.rng.choice(self.DEPT_DEFECT_TYPES[dept_str]))

                    # Defect severity is inversely related to condition score
                    if cond < 40.0:
                        severity = int(self.rng.choice([3, 4, 5], p=[0.15, 0.45, 0.40]))
                    elif cond < 65.0:
                        severity = int(self.rng.choice([2, 3, 4, 5], p=[0.20, 0.45, 0.25, 0.10]))
                    else:
                        severity = int(self.rng.choice([1, 2, 3], p=[0.50, 0.35, 0.15]))

                    days_detected_ago = int(self.rng.integers(1, 45))
                    detected_date = current_date - dt.timedelta(days=days_detected_ago)

                    # Mandated repair window based on severity
                    mandated_window = {5: 3, 4: 7, 3: 14, 2: 30, 1: 60}[severity]
                    overdue = max(0, days_detected_ago - mandated_window)

                    status = DefectStatus.OPEN.value if overdue > 0 or float(self.rng.random()) < 0.8 else DefectStatus.IN_PROGRESS.value

                    records.append({
                        "defect_id": f"DEF-{defect_idx:05d}",
                        "asset_id": asset["asset_id"],
                        "section_id": asset["section_id"],
                        "defect_type": defect_type,
                        "severity": severity,
                        "detected_date": detected_date.isoformat(),
                        "status": status,
                        "overdue_days": overdue,
                    })
                    defect_idx += 1

        return pd.DataFrame(records)

    def _generate_maintenance_tasks(
        self,
        df_assets: pd.DataFrame,
        df_defects: pd.DataFrame,
        current_date: dt.date,
        horizon_days: int,
    ) -> pd.DataFrame:
        records = []
        task_idx = 1

        # 1. Corrective Tasks from Open Defects
        if not df_defects.empty:
            open_defects = df_defects[df_defects["status"].isin([DefectStatus.OPEN.value, DefectStatus.IN_PROGRESS.value])]
            asset_lookup = df_assets.set_index("asset_id").to_dict(orient="index")

            for _, defect in open_defects.iterrows():
                asset_info = asset_lookup.get(defect["asset_id"])
                if not asset_info:
                    continue
                dept_str = str(asset_info["department"])
                maint_type = str(self.rng.choice(self.DEPT_MAINT_TYPES[dept_str]))

                severity = int(defect["severity"])
                urgency = min(5, severity + (1 if int(defect["overdue_days"]) > 5 else 0))

                # Duration in hours (1.5 to 4.0 hours)
                duration = round(float(self.rng.choice([1.5, 2.0, 2.5, 3.0, 3.5, 4.0], p=[0.2, 0.3, 0.25, 0.15, 0.05, 0.05])), 1)

                # Deadline: urgent tasks have tighter deadlines within the horizon
                days_to_deadline = max(1, int(15 - urgency * 2.5 + self.rng.integers(-1, 2)))
                days_to_deadline = min(days_to_deadline, horizon_days + 3)
                deadline_dt = dt.datetime.combine(current_date + dt.timedelta(days=days_to_deadline), dt.time(23, 59))

                required_workers = int(self.rng.integers(3, 10))
                needs_machine = (dept_str == "ENGINEERING" and duration >= 2.5) or (dept_str == "TRACTION" and severity >= 4)
                required_machine = str(self.rng.choice(self.DEPT_MACHINES[dept_str])) if needs_machine else None

                is_safety_critical = bool((urgency == 5) or (int(asset_info["criticality"]) == 5 and severity >= 4))

                records.append({
                    "task_id": f"TSK-CORR-{task_idx:05d}",
                    "asset_id": defect["asset_id"],
                    "section_id": defect["section_id"],
                    "department": dept_str,
                    "maintenance_type": maint_type,
                    "duration_hours": duration,
                    "severity": severity,
                    "urgency": urgency,
                    "deadline": deadline_dt.isoformat(),
                    "required_workers": required_workers,
                    "required_machine": required_machine,
                    "is_safety_critical": is_safety_critical,
                })
                task_idx += 1

        # 2. Routine / Preventive Tasks
        sample_size = min(len(df_assets), max(10, int(len(df_assets) * 0.25)))
        sampled_assets = df_assets.sample(n=sample_size, random_state=self.seed)
        for _, asset in sampled_assets.iterrows():
            dept_str = str(asset["department"])
            maint_type = str(self.rng.choice(self.DEPT_MAINT_TYPES[dept_str]))
            duration = round(float(self.rng.choice([1.0, 1.5, 2.0, 2.5], p=[0.3, 0.4, 0.2, 0.1])), 1)
            days_to_deadline = int(self.rng.integers(3, horizon_days + 7))
            deadline_dt = dt.datetime.combine(current_date + dt.timedelta(days=days_to_deadline), dt.time(23, 59))

            records.append({
                "task_id": f"TSK-PREV-{task_idx:05d}",
                "asset_id": asset["asset_id"],
                "section_id": asset["section_id"],
                "department": dept_str,
                "maintenance_type": maint_type,
                "duration_hours": duration,
                "severity": 2,
                "urgency": 2,
                "deadline": deadline_dt.isoformat(),
                "required_workers": int(self.rng.integers(2, 6)),
                "required_machine": None,
                "is_safety_critical": False,
            })
            task_idx += 1

        return pd.DataFrame(records)

    def _generate_trains_and_movements(
        self,
        section_ids: List[str],
        start_date: dt.date,
        horizon_days: int,
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        train_types = ["PREMIUM_PASSENGER", "EXPRESS_PASSENGER", "ORDINARY_PASSENGER", "FREIGHT"]
        type_probs = [0.15, 0.40, 0.25, 0.20]
        type_priorities = {
            "PREMIUM_PASSENGER": 1,
            "EXPRESS_PASSENGER": 2,
            "ORDINARY_PASSENGER": 3,
            "FREIGHT": 4,
        }

        trains = []
        movements = []
        mov_idx = 1
        num_trains = 60

        for t_idx in range(1, num_trains + 1):
            t_type = str(self.rng.choice(train_types, p=type_probs))
            priority = type_priorities[t_type]
            train_num = f"{12000 + t_idx}"
            train_id = f"TRN-{train_num}"

            trains.append({
                "train_id": train_id,
                "train_number": train_num,
                "train_type": t_type,
                "priority": priority,
                "source": "NDLS" if t_idx % 2 == 0 else "HWH",
                "destination": "BCT" if t_idx % 2 == 0 else "MAS",
            })

            for day_offset in range(horizon_days):
                current_day = start_date + dt.timedelta(days=day_offset)
                if t_type == "FREIGHT":
                    base_hour = int(self.rng.choice([0, 1, 2, 3, 22, 23]))
                elif t_type == "PREMIUM_PASSENGER":
                    base_hour = int(self.rng.choice([6, 7, 8, 16, 17, 18]))
                else:
                    base_hour = int(self.rng.integers(5, 22))

                minute = int(self.rng.choice([0, 15, 30, 45]))
                arr_time = dt.datetime.combine(current_day, dt.time(base_hour, minute))
                
                num_secs_traversed = int(self.rng.integers(1, 4))
                traversed_secs = self.rng.choice(section_ids, size=num_secs_traversed, replace=False)

                for sec in traversed_secs:
                    transit_mins = int(self.rng.integers(25, 55))
                    dep_time = arr_time + dt.timedelta(minutes=transit_mins)
                    direction = "UP" if t_idx % 2 == 0 else "DOWN"

                    movements.append({
                        "movement_id": f"MOV-{mov_idx:06d}",
                        "train_id": train_id,
                        "section_id": str(sec),
                        "arrival_time": arr_time.isoformat(),
                        "departure_time": dep_time.isoformat(),
                        "direction": direction,
                    })
                    mov_idx += 1
                    arr_time = dep_time + dt.timedelta(minutes=int(self.rng.integers(10, 30)))

        return pd.DataFrame(trains), pd.DataFrame(movements)

    def _generate_block_windows(
        self,
        section_ids: List[str],
        start_date: dt.date,
        horizon_days: int,
    ) -> pd.DataFrame:
        records = []
        blk_idx = 1

        for day_offset in range(horizon_days):
            current_day = start_date + dt.timedelta(days=day_offset)
            for sec in section_ids:
                # Night slot (01:30 - 05:00)
                st_night = dt.datetime.combine(current_day, dt.time(1, 30))
                et_night = dt.datetime.combine(current_day, dt.time(5, 0))
                records.append({
                    "block_id": f"BLK-{blk_idx:05d}",
                    "section_id": sec,
                    "date": current_day.isoformat(),
                    "start_time": st_night.isoformat(),
                    "end_time": et_night.isoformat(),
                    "available": True,
                })
                blk_idx += 1

                # Midday slot (11:30 - 14:00)
                st_day = dt.datetime.combine(current_day, dt.time(11, 30))
                et_day = dt.datetime.combine(current_day, dt.time(14, 0))
                records.append({
                    "block_id": f"BLK-{blk_idx:05d}",
                    "section_id": sec,
                    "date": current_day.isoformat(),
                    "start_time": st_day.isoformat(),
                    "end_time": et_day.isoformat(),
                    "available": True,
                })
                blk_idx += 1

        return pd.DataFrame(records)

    def _generate_resources(
        self,
        section_ids: List[str],
        start_date: dt.date,
        horizon_days: int,
    ) -> pd.DataFrame:
        records = []
        res_idx = 1
        departments = ["ENGINEERING", "S_AND_T", "TRACTION"]

        for dept_str in departments:
            # Crews
            for c_idx in range(1, 6):
                sec = str(self.rng.choice(section_ids))
                records.append({
                    "resource_id": f"RES-CREW-{dept_str[:3]}-{c_idx:02d}",
                    "department": dept_str,
                    "resource_type": "CREW",
                    "capacity": int(self.rng.integers(6, 16)),
                    "available_from": dt.datetime.combine(start_date, dt.time(0, 0)).isoformat(),
                    "available_until": dt.datetime.combine(start_date + dt.timedelta(days=horizon_days + 1), dt.time(23, 59)).isoformat(),
                    "section_id": sec,
                })
                res_idx += 1

            # Machines
            machines = self.DEPT_MACHINES[dept_str]
            for m_name in machines:
                records.append({
                    "resource_id": f"RES-MACH-{dept_str[:3]}-{res_idx:02d}",
                    "department": dept_str,
                    "resource_type": "MACHINE",
                    "capacity": 1,
                    "available_from": dt.datetime.combine(start_date, dt.time(0, 0)).isoformat(),
                    "available_until": dt.datetime.combine(start_date + dt.timedelta(days=horizon_days + 1), dt.time(23, 59)).isoformat(),
                    "section_id": str(self.rng.choice(section_ids)),
                })
                res_idx += 1

        return pd.DataFrame(records)

    def _generate_maintenance_history(self, df_assets: pd.DataFrame, current_date: dt.date) -> pd.DataFrame:
        records = []
        hist_idx = 1

        for _, asset in df_assets.iterrows():
            dept_str = str(asset["department"])
            num_past_events = int(self.rng.integers(1, 5))
            for _ in range(num_past_events):
                days_ago = int(self.rng.integers(30, 700))
                completed_date = current_date - dt.timedelta(days=days_ago)
                maint_type = str(self.rng.choice(self.DEPT_MAINT_TYPES[dept_str]))
                duration = round(float(self.rng.uniform(1.5, 4.5)), 1)
                cost = round(float(self.rng.uniform(15000, 150000)), 2)
                fail_days = int(self.rng.integers(45, 365))

                records.append({
                    "history_id": f"HIST-{hist_idx:06d}",
                    "asset_id": asset["asset_id"],
                    "section_id": asset["section_id"],
                    "department": dept_str,
                    "maintenance_type": maint_type,
                    "completed_date": completed_date.isoformat(),
                    "duration_hours": duration,
                    "cost": cost,
                    "failure_occurred_after_days": fail_days,
                })
                hist_idx += 1

        return pd.DataFrame(records)

    def _generate_weather_records(
        self,
        section_ids: List[str],
        start_date: dt.date,
        horizon_days: int,
    ) -> pd.DataFrame:
        records = []
        rec_idx = 1

        for day_offset in range(horizon_days):
            current_day = start_date + dt.timedelta(days=day_offset)
            for sec in section_ids:
                temp = round(float(self.rng.normal(32.0, 4.5)), 1)
                rain = round(float(max(0.0, self.rng.exponential(scale=3.0) - 2.0)), 1)
                humidity = round(float(np.clip(self.rng.normal(60.0, 15.0), 20.0, 95.0)), 1)

                if rain > 25.0:
                    cond = "HEAVY_RAIN"
                elif temp > 42.0:
                    cond = "EXTREME_HEAT"
                else:
                    cond = "NORMAL"

                records.append({
                    "record_id": f"WTH-{rec_idx:06d}",
                    "section_id": sec,
                    "date": current_day.isoformat(),
                    "temperature_c": temp,
                    "rainfall_mm": rain,
                    "humidity_pct": humidity,
                    "weather_condition": cond,
                })
                rec_idx += 1

        return pd.DataFrame(records)
