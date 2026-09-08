"""Public Indian Railways Dataset Compatibility Layer for NTES, IRCTC, and TMS open datasets."""

from __future__ import annotations
import datetime as dt
import io
import logging
import re
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Union, Any
import numpy as np
import pandas as pd

from src.exceptions import DataValidationError, IncompatibleSchemaError
from src.schemas import (
    Train,
    TrainMovement,
    TrainType,
    TrainDirection,
    Asset,
    Defect,
    DefectStatus,
    Department,
)

logger = logging.getLogger(__name__)


class IndianRailwaysPublicAdapter:
    """
    Ingestion adapter translating public and operational Indian Railways data dumps
    (NTES schedules, OGD train master lists, and TMS/TDMS track inspection sheets)
    into internal typed Pydantic models.
    """

    # Keyword mappings for Indian Railways train classifications
    TRAIN_TYPE_KEYWORDS: Dict[str, TrainType] = {
        "RAJDHANI": TrainType.PREMIUM_PASSENGER,
        "SHATABDI": TrainType.PREMIUM_PASSENGER,
        "VANDE BHARAT": TrainType.PREMIUM_PASSENGER,
        "TEJAS": TrainType.PREMIUM_PASSENGER,
        "DURONTO": TrainType.PREMIUM_PASSENGER,
        "GARIB RATH": TrainType.EXPRESS_PASSENGER,
        "SUPERFAST": TrainType.EXPRESS_PASSENGER,
        "SF": TrainType.EXPRESS_PASSENGER,
        "JAN SHATABDI": TrainType.EXPRESS_PASSENGER,
        "HUMSAFAR": TrainType.EXPRESS_PASSENGER,
        "EXPRESS": TrainType.EXPRESS_PASSENGER,
        "EXP": TrainType.EXPRESS_PASSENGER,
        "MAIL": TrainType.EXPRESS_PASSENGER,
        "PASSENGER": TrainType.ORDINARY_PASSENGER,
        "PASS": TrainType.ORDINARY_PASSENGER,
        "MEMU": TrainType.ORDINARY_PASSENGER,
        "DEMU": TrainType.ORDINARY_PASSENGER,
        "LOCAL": TrainType.ORDINARY_PASSENGER,
        "EMU": TrainType.ORDINARY_PASSENGER,
        "FREIGHT": TrainType.FREIGHT,
        "GOODS": TrainType.FREIGHT,
        "CONTAINER": TrainType.FREIGHT,
        "PARCEL": TrainType.FREIGHT,
        "MILITARY": TrainType.FREIGHT,
        "TOWER WAGON": TrainType.DEPARTMENTAL,
        "INSPECTION": TrainType.DEPARTMENTAL,
        "WORK TRAIN": TrainType.DEPARTMENTAL,
        "DEPARTMENTAL": TrainType.DEPARTMENTAL,
    }

    DEPARTMENT_KEYWORDS: Dict[str, Department] = {
        "TRACK": Department.ENGINEERING,
        "CIVIL": Department.ENGINEERING,
        "ENGINEERING": Department.ENGINEERING,
        "ENGG": Department.ENGINEERING,
        "PWAY": Department.ENGINEERING,
        "P-WAY": Department.ENGINEERING,
        "PERMANENT WAY": Department.ENGINEERING,
        "BRIDGE": Department.ENGINEERING,
        "SIGNAL": Department.S_AND_T,
        "TELECOM": Department.S_AND_T,
        "S&T": Department.S_AND_T,
        "S_AND_T": Department.S_AND_T,
        "POINT": Department.S_AND_T,
        "INTERLOCKING": Department.S_AND_T,
        "ELECTRICAL": Department.TRACTION,
        "TRACTION": Department.TRACTION,
        "TRD": Department.TRACTION,
        "OHE": Department.TRACTION,
        "PSI": Department.TRACTION,
        "POWER": Department.TRACTION,
    }

    @classmethod
    def parse_train_type(cls, raw_type: Optional[str], train_name: Optional[str] = None) -> TrainType:
        """Infer TrainType enum from standard IR type strings or train names."""
        search_text = f"{raw_type or ''} {train_name or ''}".upper()

        for kw, t_type in cls.TRAIN_TYPE_KEYWORDS.items():
            if kw in search_text:
                return t_type

        return TrainType.EXPRESS_PASSENGER

    @classmethod
    def infer_train_priority(cls, train_type: TrainType, train_number: Optional[str] = None) -> int:
        """
        Assign standard operational dispatch priority (1=Highest to 5=Lowest).
        1: Premium Passenger (Rajdhani, Vande Bharat, Shatabdi, Duronto)
        2: Express / Superfast Passenger
        3: Ordinary Passenger / Suburban
        4: Departmental Work Train
        5: Freight / Parcel
        """
        if train_type == TrainType.PREMIUM_PASSENGER:
            return 1
        elif train_type == TrainType.EXPRESS_PASSENGER:
            return 2
        elif train_type == TrainType.ORDINARY_PASSENGER:
            return 3
        elif train_type == TrainType.DEPARTMENTAL:
            return 4
        elif train_type == TrainType.FREIGHT:
            return 5
        return 3

    @classmethod
    def parse_department(cls, raw_dept: Optional[str], asset_type: Optional[str] = None) -> Department:
        """Infer Department enum from raw string or asset type description."""
        search_text = f"{raw_dept or ''} {asset_type or ''}".upper()

        for kw, dept in cls.DEPARTMENT_KEYWORDS.items():
            if kw in search_text:
                return dept

        return Department.ENGINEERING

    @classmethod
    def parse_time_string(
        cls,
        time_val: Any,
        reference_date: Optional[dt.date] = None,
        day_offset: int = 0,
    ) -> Optional[dt.datetime]:
        """
        Robust parser for Indian Railways time formats.
        Handles 'HH:MM:SS', 'HH:MM', 'hh:mm AM/PM', 'None', '-', float minutes, etc.
        """
        if pd.isna(time_val) or time_val is None:
            return None

        ref_date = reference_date or dt.date.today()
        ref_date += dt.timedelta(days=day_offset)

        # If already datetime/time
        if isinstance(time_val, dt.datetime):
            return time_val
        if isinstance(time_val, dt.time):
            return dt.datetime.combine(ref_date, time_val)

        time_str = str(time_val).strip()
        if not time_str or time_str in ("-", "None", "null", "NaN", "0", "00:00:00.000000"):
            if time_str in ("0", "00:00:00.000000"):
                return dt.datetime.combine(ref_date, dt.time(0, 0))
            return None

        # Try multiple standard formats
        for fmt in ("%H:%M:%S", "%H:%M", "%I:%M %p", "%I:%M:%S %p", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
            try:
                parsed = dt.datetime.strptime(time_str, fmt)
                if "%Y" in fmt:
                    return parsed
                return dt.datetime.combine(ref_date, parsed.time())
            except ValueError:
                continue

        # Regex fallback for H:M
        match = re.match(r"^(\d{1,2}):(\d{2})(?::(\d{2}))?$", time_str)
        if match:
            h = int(match.group(1)) % 24
            m = int(match.group(2)) % 60
            s = int(match.group(3) or 0) % 60
            return dt.datetime.combine(ref_date, dt.time(h, m, s))

        return None

    def load_train_master_from_dataframe(self, df: pd.DataFrame) -> List[Train]:
        """Convert a public IR train schedule / master DataFrame to List[Train]."""
        if df.empty:
            return []

        # Standardize column names
        cols_map = {c: c.strip().lower().replace(" ", "_").replace(".", "") for c in df.columns}
        df = df.rename(columns=cols_map)

        trains: List[Train] = []
        seen_train_ids: Set[str] = set()

        for idx, row in df.iterrows():
            t_num = str(row.get("train_no") or row.get("train_number") or row.get("trainno") or f"TR-{idx:04d}").strip()
            t_name = str(row.get("train_name") or row.get("trainname") or f"Train {t_num}").strip()
            raw_type = str(row.get("train_type") or row.get("type") or row.get("category") or "")
            src = str(row.get("source") or row.get("from_station_code") or row.get("from_station") or row.get("source_station_code") or "SRC").strip()
            dst = str(row.get("destination") or row.get("to_station_code") or row.get("to_station") or row.get("destination_station_code") or "DST").strip()

            t_type = self.parse_train_type(raw_type, t_name)
            prio = int(row.get("priority") or self.infer_train_priority(t_type, t_num))
            prio = max(1, min(5, prio))

            train_id = f"TRN-{t_num}"
            if train_id in seen_train_ids:
                continue
            seen_train_ids.add(train_id)

            trains.append(Train(
                train_id=train_id,
                train_number=t_num,
                train_type=t_type,
                priority=prio,
                source=src,
                destination=dst,
            ))

        return trains

    def load_train_master_from_csv(self, filepath_or_buffer: Union[str, Path, io.StringIO]) -> List[Train]:
        """Load and parse public IR Train Master CSV."""
        df = pd.read_csv(filepath_or_buffer)
        return self.load_train_master_from_dataframe(df)

    def load_train_movements_from_dataframe(
        self,
        df: pd.DataFrame,
        default_section: str = "SEC-01",
        base_date: Optional[dt.date] = None,
    ) -> List[TrainMovement]:
        """
        Convert public timetable or NTES schedule records to List[TrainMovement].
        Supports multi-station schedules with day-offsets and passage intervals.
        """
        if df.empty:
            return []

        base_date = base_date or dt.date.today()
        cols_map = {c: c.strip().lower().replace(" ", "_").replace(".", "") for c in df.columns}
        df = df.rename(columns=cols_map)

        movements: List[TrainMovement] = []

        for idx, row in df.iterrows():
            t_num = str(row.get("train_no") or row.get("train_number") or row.get("train_id") or f"{idx:04d}").strip()
            train_id = f"TRN-{t_num}" if not t_num.startswith("TRN-") else t_num
            sec_id = str(row.get("section_id") or row.get("station_code") or row.get("section") or default_section).strip()

            day_offset = int(row.get("day") or row.get("day_of_journey") or row.get("day_offset") or 1) - 1
            day_offset = max(0, day_offset)

            arr_raw = row.get("arrival_time") or row.get("arr_time") or row.get("arrival")
            dep_raw = row.get("departure_time") or row.get("dep_time") or row.get("departure")

            arr_dt = self.parse_time_string(arr_raw, base_date, day_offset)
            dep_dt = self.parse_time_string(dep_raw, base_date, day_offset)

            # Robust timing adjustments
            if arr_dt is None and dep_dt is not None:
                arr_dt = dep_dt - dt.timedelta(minutes=10)
            elif dep_dt is None and arr_dt is not None:
                dep_dt = arr_dt + dt.timedelta(minutes=10)
            elif arr_dt is None and dep_dt is None:
                # Default slot if time is missing
                arr_dt = dt.datetime.combine(base_date + dt.timedelta(days=day_offset), dt.time(8, 0))
                dep_dt = arr_dt + dt.timedelta(minutes=20)

            # Midnight crossing or same arrival/departure handling
            if dep_dt <= arr_dt:
                dep_dt = arr_dt + dt.timedelta(minutes=5)

            # Direction inference
            raw_dir = str(row.get("direction") or "").upper().strip()
            if raw_dir in ("UP", "DOWN", "BIDIRECTIONAL"):
                direction = TrainDirection(raw_dir)
            else:
                try:
                    direction = TrainDirection.UP if int(t_num[-1]) % 2 == 0 else TrainDirection.DOWN
                except (ValueError, IndexError):
                    direction = TrainDirection.UP

            m_id = str(row.get("movement_id") or f"MOV-{train_id}-{sec_id}-{idx:04d}")

            movements.append(TrainMovement(
                movement_id=m_id,
                train_id=train_id,
                section_id=sec_id,
                arrival_time=arr_dt,
                departure_time=dep_dt,
                direction=direction,
            ))

        return movements

    def load_train_movements_from_csv(
        self,
        filepath_or_buffer: Union[str, Path, io.StringIO],
        default_section: str = "SEC-01",
        base_date: Optional[dt.date] = None,
    ) -> List[TrainMovement]:
        """Load and parse train movements / NTES timetable CSV."""
        df = pd.read_csv(filepath_or_buffer)
        return self.load_train_movements_from_dataframe(df, default_section, base_date)

    def load_track_inspections_from_dataframe(
        self,
        df: pd.DataFrame,
        reference_date: Optional[dt.date] = None,
    ) -> Tuple[List[Asset], List[Defect]]:
        """
        Convert Track Management System (TMS) / Open Government Data (OGD)
        infrastructure inspection records into List[Asset] and List[Defect].
        """
        if df.empty:
            return [], []

        ref_date = reference_date or dt.date.today()
        cols_map = {c: c.strip().lower().replace(" ", "_").replace(".", "") for c in df.columns}
        df = df.rename(columns=cols_map)

        assets: List[Asset] = []
        defects: List[Defect] = []
        seen_asset_ids: Set[str] = set()

        for idx, row in df.iterrows():
            ast_id = str(row.get("asset_id") or row.get("asset_code") or f"AST-IR-{idx:04d}").strip()
            ast_type = str(row.get("asset_type") or row.get("equipment_type") or "TrackSegment").strip()
            raw_dept = str(row.get("department") or row.get("dept") or "")
            sec_id = str(row.get("section_id") or row.get("section") or "SEC-01").strip()
            loc = str(row.get("location") or row.get("km_marker") or f"KM-{100 + idx}/0").strip()
            crit = int(row.get("criticality") or 3)
            crit = max(1, min(5, crit))

            age_years = float(row.get("age_years") or row.get("age") or 5.0)
            install_raw = row.get("installation_date") or row.get("commission_date")
            if install_raw and not pd.isna(install_raw):
                try:
                    inst_date = pd.to_datetime(install_raw).date()
                except Exception:
                    inst_date = ref_date - dt.timedelta(days=int(age_years * 365.25))
            else:
                inst_date = ref_date - dt.timedelta(days=int(age_years * 365.25))

            cond_score = float(row.get("condition_score") or row.get("condition_index") or 75.0)
            cond_score = max(0.0, min(100.0, cond_score))

            traffic_gmt = float(row.get("traffic_load") or row.get("gmt") or 25.0)

            last_maint_raw = row.get("last_maintenance_date") or row.get("last_service_date")
            last_maint = None
            if last_maint_raw and not pd.isna(last_maint_raw):
                try:
                    last_maint = pd.to_datetime(last_maint_raw).date()
                except Exception:
                    last_maint = None

            dept = self.parse_department(raw_dept, ast_type)

            if ast_id not in seen_asset_ids:
                seen_asset_ids.add(ast_id)
                assets.append(Asset(
                    asset_id=ast_id,
                    asset_type=ast_type,
                    department=dept,
                    section_id=sec_id,
                    location=loc,
                    criticality=crit,
                    installation_date=inst_date,
                    age_years=age_years,
                    condition_score=cond_score,
                    traffic_load=traffic_gmt,
                    last_maintenance_date=last_maint,
                ))

            defect_type = row.get("defect_type") or row.get("defect_description") or row.get("defect")
            if defect_type and not pd.isna(defect_type) and str(defect_type).strip() not in ("NONE", "None", "-", "NIL", "OK"):
                d_id = str(row.get("defect_id") or f"DEF-{ast_id}-{idx:03d}").strip()
                sev = int(row.get("severity") or row.get("defect_severity") or 3)
                sev = max(1, min(5, sev))

                det_date_raw = row.get("detected_date") or row.get("inspection_date")
                if det_date_raw and not pd.isna(det_date_raw):
                    try:
                        det_date = pd.to_datetime(det_date_raw).date()
                    except Exception:
                        det_date = ref_date
                else:
                    det_date = ref_date

                overdue = int(row.get("overdue_days") or 0)

                defects.append(Defect(
                    defect_id=d_id,
                    asset_id=ast_id,
                    section_id=sec_id,
                    defect_type=str(defect_type).strip(),
                    severity=sev,
                    detected_date=det_date,
                    status=DefectStatus.OPEN,
                    overdue_days=max(0, overdue),
                ))

        return assets, defects

    def load_track_inspections_from_csv(
        self,
        filepath_or_buffer: Union[str, Path, io.StringIO],
        reference_date: Optional[dt.date] = None,
    ) -> Tuple[List[Asset], List[Defect]]:
        """Load and parse TMS/OGD Track Inspection CSV."""
        df = pd.read_csv(filepath_or_buffer)
        return self.load_track_inspections_from_dataframe(df, reference_date)

    def map_station_pairs_to_corridor_sections(
        self,
        movements: List[TrainMovement],
        station_to_section_map: Dict[str, str],
    ) -> List[TrainMovement]:
        """Map raw station codes in train movements to standardized corridor section IDs."""
        updated: List[TrainMovement] = []
        for m in movements:
            sec_id = station_to_section_map.get(m.section_id, m.section_id)
            updated.append(TrainMovement(
                movement_id=m.movement_id,
                train_id=m.train_id,
                section_id=sec_id,
                arrival_time=m.arrival_time,
                departure_time=m.departure_time,
                direction=m.direction,
            ))
        return updated
