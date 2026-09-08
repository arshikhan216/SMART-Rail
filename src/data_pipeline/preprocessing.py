"""Data preprocessing, cleaning, imputation, and normalization."""

from __future__ import annotations
import logging
from typing import Dict, List, Optional
import pandas as pd
import numpy as np

from src.schemas import Department, TrainType, DefectStatus

logger = logging.getLogger(__name__)


class DataPreprocessor:
    """Preprocesses raw ingested tabular data into standardized formats."""

    @staticmethod
    def preprocess_assets(df: pd.DataFrame) -> pd.DataFrame:
        """Clean and normalize assets table."""
        df = df.copy()
        # Convert IDs & strings
        df["asset_id"] = df["asset_id"].astype(str).str.strip()
        df["section_id"] = df["section_id"].astype(str).str.strip()
        df["asset_type"] = df["asset_type"].astype(str).str.strip()
        if "location" in df.columns:
            df["location"] = df["location"].astype(str).str.strip()
        else:
            df["location"] = "UNKNOWN"

        # Standardize Department
        df["department"] = df["department"].astype(str).str.upper().str.strip()
        dept_map = {
            "CIVIL": "ENGINEERING",
            "TRACK": "ENGINEERING",
            "ENG": "ENGINEERING",
            "SIGNAL": "S_AND_T",
            "TELECOM": "S_AND_T",
            "ST": "S_AND_T",
            "OHE": "TRACTION",
            "ELECTRICAL": "TRACTION",
            "TRD": "TRACTION",
        }
        df["department"] = df["department"].replace(dept_map)

        # Dates
        df["installation_date"] = pd.to_datetime(df["installation_date"]).dt.date
        if "last_maintenance_date" in df.columns and not df["last_maintenance_date"].isna().all():
            df["last_maintenance_date"] = pd.to_datetime(df["last_maintenance_date"]).dt.date
        else:
            df["last_maintenance_date"] = None

        # Numerical imputation and clipping
        df["age_years"] = pd.to_numeric(df["age_years"], errors="coerce").fillna(0.0).clip(lower=0.0)
        df["criticality"] = pd.to_numeric(df["criticality"], errors="coerce").fillna(3).astype(int).clip(1, 5)
        df["condition_score"] = pd.to_numeric(df["condition_score"], errors="coerce").fillna(75.0).clip(0.0, 100.0)
        df["traffic_load"] = pd.to_numeric(df.get("traffic_load", 0.0), errors="coerce").fillna(0.0).clip(lower=0.0)

        return df

    @staticmethod
    def preprocess_defects(df: pd.DataFrame) -> pd.DataFrame:
        """Clean and normalize defects table."""
        df = df.copy()
        df["defect_id"] = df["defect_id"].astype(str).str.strip()
        df["asset_id"] = df["asset_id"].astype(str).str.strip()
        df["section_id"] = df["section_id"].astype(str).str.strip()
        df["defect_type"] = df["defect_type"].astype(str).str.strip()
        df["severity"] = pd.to_numeric(df["severity"], errors="coerce").fillna(3).astype(int).clip(1, 5)
        df["detected_date"] = pd.to_datetime(df["detected_date"]).dt.date
        df["overdue_days"] = pd.to_numeric(df.get("overdue_days", 0), errors="coerce").fillna(0).astype(int).clip(lower=0)

        # Status standardization
        df["status"] = df.get("status", "OPEN").astype(str).str.upper().str.strip()
        valid_statuses = {s.value for s in DefectStatus}
        df["status"] = df["status"].apply(lambda s: s if s in valid_statuses else "OPEN")

        return df

    @staticmethod
    def preprocess_maintenance_tasks(df: pd.DataFrame) -> pd.DataFrame:
        """Clean and normalize maintenance tasks table."""
        df = df.copy()
        df["task_id"] = df["task_id"].astype(str).str.strip()
        df["asset_id"] = df["asset_id"].astype(str).str.strip()
        df["section_id"] = df["section_id"].astype(str).str.strip()
        df["department"] = df["department"].astype(str).str.upper().str.strip()
        df["maintenance_type"] = df["maintenance_type"].astype(str).str.strip()
        df["duration_hours"] = pd.to_numeric(df["duration_hours"], errors="coerce").fillna(2.0).clip(lower=0.25, upper=24.0)
        df["severity"] = pd.to_numeric(df.get("severity", 3), errors="coerce").fillna(3).astype(int).clip(1, 5)
        df["urgency"] = pd.to_numeric(df.get("urgency", 3), errors="coerce").fillna(3).astype(int).clip(1, 5)
        df["deadline"] = pd.to_datetime(df["deadline"])
        df["required_workers"] = pd.to_numeric(df.get("required_workers", 2), errors="coerce").fillna(2).astype(int).clip(lower=1)
        if "required_machine" not in df.columns:
            df["required_machine"] = None
        else:
            df["required_machine"] = df["required_machine"].replace({np.nan: None, "": None})
        if "is_safety_critical" not in df.columns:
            df["is_safety_critical"] = df["urgency"] >= 5

        return df

    @staticmethod
    def preprocess_trains(df: pd.DataFrame) -> pd.DataFrame:
        """Clean and normalize trains table."""
        df = df.copy()
        df["train_id"] = df["train_id"].astype(str).str.strip()
        df["train_number"] = df["train_number"].astype(str).str.strip()
        df["train_type"] = df["train_type"].astype(str).str.upper().str.strip()
        df["priority"] = pd.to_numeric(df["priority"], errors="coerce").fillna(3).astype(int).clip(1, 5)
        df["source"] = df["source"].astype(str).str.strip()
        df["destination"] = df["destination"].astype(str).str.strip()
        return df

    @staticmethod
    def preprocess_train_movements(df: pd.DataFrame) -> pd.DataFrame:
        """Clean and normalize train movements table."""
        df = df.copy()
        df["movement_id"] = df["movement_id"].astype(str).str.strip()
        df["train_id"] = df["train_id"].astype(str).str.strip()
        df["section_id"] = df["section_id"].astype(str).str.strip()
        df["arrival_time"] = pd.to_datetime(df["arrival_time"])
        df["departure_time"] = pd.to_datetime(df["departure_time"])
        if "direction" in df.columns:
            df["direction"] = df["direction"].astype(str).str.upper().str.strip()
        else:
            df["direction"] = "UP"
        return df

    @staticmethod
    def preprocess_block_windows(df: pd.DataFrame) -> pd.DataFrame:
        """Clean and normalize block windows table."""
        df = df.copy()
        df["block_id"] = df["block_id"].astype(str).str.strip()
        df["section_id"] = df["section_id"].astype(str).str.strip()
        df["date"] = pd.to_datetime(df["date"]).dt.date
        df["start_time"] = pd.to_datetime(df["start_time"])
        df["end_time"] = pd.to_datetime(df["end_time"])
        df["available"] = df.get("available", True).astype(bool)
        return df

    @staticmethod
    def preprocess_resources(df: pd.DataFrame) -> pd.DataFrame:
        """Clean and normalize resources table."""
        df = df.copy()
        df["resource_id"] = df["resource_id"].astype(str).str.strip()
        df["department"] = df["department"].astype(str).str.upper().str.strip()
        df["resource_type"] = df["resource_type"].astype(str).str.upper().str.strip()
        df["capacity"] = pd.to_numeric(df["capacity"], errors="coerce").fillna(1).astype(int).clip(lower=1)
        df["available_from"] = pd.to_datetime(df["available_from"])
        df["available_until"] = pd.to_datetime(df["available_until"])
        if "section_id" in df.columns:
            df["section_id"] = df["section_id"].replace({np.nan: None, "": None})
        else:
            df["section_id"] = None
        return df

    @staticmethod
    def preprocess_maintenance_history(df: pd.DataFrame) -> pd.DataFrame:
        """Clean and normalize maintenance history table."""
        df = df.copy()
        df["history_id"] = df["history_id"].astype(str).str.strip()
        df["asset_id"] = df["asset_id"].astype(str).str.strip()
        df["section_id"] = df["section_id"].astype(str).str.strip()
        df["department"] = df["department"].astype(str).str.upper().str.strip()
        df["maintenance_type"] = df["maintenance_type"].astype(str).str.strip()
        df["completed_date"] = pd.to_datetime(df["completed_date"]).dt.date
        df["duration_hours"] = pd.to_numeric(df["duration_hours"], errors="coerce").fillna(2.0).clip(lower=0.1)
        if "cost" in df.columns:
            df["cost"] = pd.to_numeric(df["cost"], errors="coerce").fillna(0.0)
        else:
            df["cost"] = 0.0
        if "failure_occurred_after_days" in df.columns:
            df["failure_occurred_after_days"] = pd.to_numeric(df["failure_occurred_after_days"], errors="coerce")
        else:
            df["failure_occurred_after_days"] = None
        return df
