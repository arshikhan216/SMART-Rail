"""Data loaders and adapters for TMS, SMMS, TDMS, COA, and Timetable data sources."""

from __future__ import annotations
import abc
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import pandas as pd

from src.exceptions import DataValidationError

logger = logging.getLogger(__name__)


class BaseDataSource(abc.ABC):
    """Abstract interface for all raw data sources (File-based, API-based, or DB-based)."""

    @abc.abstractmethod
    def read(self, source_path_or_uri: Union[str, Path]) -> pd.DataFrame:
        """Read raw data and return a pandas DataFrame."""
        pass


class CSVDataSource(BaseDataSource):
    """Generic CSV data loader."""

    def read(self, source_path_or_uri: Union[str, Path]) -> pd.DataFrame:
        path = Path(source_path_or_uri)
        if not path.exists():
            raise FileNotFoundError(f"CSV source file not found: {path}")
        try:
            return pd.read_csv(path)
        except Exception as e:
            raise DataValidationError(f"Error reading CSV file at {path}: {e}") from e


class JSONDataSource(BaseDataSource):
    """Generic JSON data loader supporting lines or standard array format."""

    def read(self, source_path_or_uri: Union[str, Path]) -> pd.DataFrame:
        path = Path(source_path_or_uri)
        if not path.exists():
            raise FileNotFoundError(f"JSON source file not found: {path}")
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                return pd.DataFrame(data)
            elif isinstance(data, dict):
                # Check for wrapped list e.g. {"records": [...]}
                for key in ["data", "records", "items"]:
                    if key in data and isinstance(data[key], list):
                        return pd.DataFrame(data[key])
                return pd.DataFrame([data])
            else:
                raise ValueError("JSON content is neither a list nor an object")
        except Exception as e:
            raise DataValidationError(f"Error reading JSON file at {path}: {e}") from e


class ParquetDataSource(BaseDataSource):
    """Generic Parquet data loader."""

    def read(self, source_path_or_uri: Union[str, Path]) -> pd.DataFrame:
        path = Path(source_path_or_uri)
        if not path.exists():
            raise FileNotFoundError(f"Parquet source file not found: {path}")
        try:
            return pd.read_parquet(path)
        except Exception as e:
            raise DataValidationError(f"Error reading Parquet file at {path}: {e}") from e


# =========================================================================
# Domain Specific Adapters (TMS, SMMS, TDMS, COA, Timetable, Resources)
# =========================================================================

class BaseDepartmentAdapter(abc.ABC):
    """Base adapter to normalize department-specific column schemas."""

    def __init__(self, loader: Optional[BaseDataSource] = None):
        self.loader = loader or CSVDataSource()

    @abc.abstractmethod
    def load(self, source: Union[str, Path, pd.DataFrame]) -> pd.DataFrame:
        """Load and harmonize departmental data into canonical schema."""
        pass

    def _get_raw_df(self, source: Union[str, Path, pd.DataFrame]) -> pd.DataFrame:
        if isinstance(source, pd.DataFrame):
            return source.copy()
        path = Path(source)
        suffix = path.suffix.lower()
        if suffix == ".csv":
            return CSVDataSource().read(path)
        elif suffix == ".json":
            return JSONDataSource().read(path)
        elif suffix in [".parquet", ".pq"]:
            return ParquetDataSource().read(path)
        else:
            return self.loader.read(path)


class TMSAdapter(BaseDepartmentAdapter):
    """Adapter for Track Management System (TMS) - Civil & Track assets and defects."""

    COLUMN_MAP = {
        "track_id": "asset_id",
        "asset_code": "asset_id",
        "sec_code": "section_id",
        "km_location": "location",
        "gmt_load": "traffic_load",
        "track_condition": "condition_score",
        "install_dt": "installation_date",
        "last_maint": "last_maintenance_date",
    }

    def load(self, source: Union[str, Path, pd.DataFrame]) -> pd.DataFrame:
        df = self._get_raw_df(source)
        # Harmonize column names
        df = df.rename(columns={k: v for k, v in self.COLUMN_MAP.items() if k in df.columns})
        if "department" not in df.columns:
            df["department"] = "ENGINEERING"
        return df


class SMMSAdapter(BaseDepartmentAdapter):
    """Adapter for Signalling & Telecom Maintenance Management System (SMMS)."""

    COLUMN_MAP = {
        "signal_id": "asset_id",
        "point_machine_id": "asset_id",
        "sec_id": "section_id",
        "station_sec": "section_id",
        "health_index": "condition_score",
        "gear_type": "asset_type",
    }

    def load(self, source: Union[str, Path, pd.DataFrame]) -> pd.DataFrame:
        df = self._get_raw_df(source)
        df = df.rename(columns={k: v for k, v in self.COLUMN_MAP.items() if k in df.columns})
        if "department" not in df.columns:
            df["department"] = "S_AND_T"
        return df


class TDMSAdapter(BaseDepartmentAdapter):
    """Adapter for Traction Distribution Management System (TDMS) - OHE/Substations."""

    COLUMN_MAP = {
        "ohe_mast_id": "asset_id",
        "substation_id": "asset_id",
        "sec_code": "section_id",
        "contact_wire_wear": "condition_score",
        "ohe_type": "asset_type",
    }

    def load(self, source: Union[str, Path, pd.DataFrame]) -> pd.DataFrame:
        df = self._get_raw_df(source)
        df = df.rename(columns={k: v for k, v in self.COLUMN_MAP.items() if k in df.columns})
        if "department" not in df.columns:
            df["department"] = "TRACTION"
        return df


class COAAdapter(BaseDepartmentAdapter):
    """Adapter for Control Office Application (COA) - Corridor block availability."""

    COLUMN_MAP = {
        "block_slot_id": "block_id",
        "sec_id": "section_id",
        "window_date": "date",
        "start_timestamp": "start_time",
        "end_timestamp": "end_time",
        "is_available": "available",
    }

    def load(self, source: Union[str, Path, pd.DataFrame]) -> pd.DataFrame:
        df = self._get_raw_df(source)
        df = df.rename(columns={k: v for k, v in self.COLUMN_MAP.items() if k in df.columns})
        return df


class TimetableAdapter(BaseDepartmentAdapter):
    """Adapter for Train timetables and goods train schedules."""

    COLUMN_MAP = {
        "train_no": "train_number",
        "service_type": "train_type",
        "orig_station": "source",
        "dest_station": "destination",
    }

    def load(self, source: Union[str, Path, pd.DataFrame]) -> pd.DataFrame:
        df = self._get_raw_df(source)
        df = df.rename(columns={k: v for k, v in self.COLUMN_MAP.items() if k in df.columns})
        return df
