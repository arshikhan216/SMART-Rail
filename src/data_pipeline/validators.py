"""Validation engine for tabular datasets and entity integrity."""

from __future__ import annotations
import logging
from typing import Dict, List, Set, Any, Tuple, Optional
import pandas as pd
from pydantic import BaseModel, Field

from src.exceptions import DataValidationError

logger = logging.getLogger(__name__)


class ValidationErrorRecord(BaseModel):
    """Specific error or warning recorded during data validation."""
    table_name: str
    row_index: Optional[int] = None
    column_name: Optional[str] = None
    entity_id: Optional[str] = None
    error_type: str
    message: str
    severity: str = "ERROR"  # ERROR or WARNING


class ValidationReport(BaseModel):
    """Comprehensive summary of dataset validation results."""
    is_valid: bool = True
    total_records_checked: int = 0
    total_errors: int = 0
    total_warnings: int = 0
    errors: List[ValidationErrorRecord] = Field(default_factory=list)
    warnings: List[ValidationErrorRecord] = Field(default_factory=list)

    def add_error(self, table: str, error_type: str, message: str, row_idx: Optional[int] = None, col: Optional[str] = None, entity_id: Optional[str] = None):
        rec = ValidationErrorRecord(
            table_name=table,
            row_index=row_idx,
            column_name=col,
            entity_id=entity_id,
            error_type=error_type,
            message=message,
            severity="ERROR",
        )
        self.errors.append(rec)
        self.total_errors += 1
        self.is_valid = False
        logger.error(f"[{table}] Validation Error: {message} (Col: {col}, Row: {row_idx}, Entity: {entity_id})")

    def add_warning(self, table: str, error_type: str, message: str, row_idx: Optional[int] = None, col: Optional[str] = None, entity_id: Optional[str] = None):
        rec = ValidationErrorRecord(
            table_name=table,
            row_index=row_idx,
            column_name=col,
            entity_id=entity_id,
            error_type=error_type,
            message=message,
            severity="WARNING",
        )
        self.warnings.append(rec)
        self.total_warnings += 1
        logger.warning(f"[{table}] Validation Warning: {message} (Col: {col}, Row: {row_idx}, Entity: {entity_id})")


class DataValidator:
    """Validates individual dataframes and relational referential integrity across tables."""

    REQUIRED_COLUMNS: Dict[str, List[str]] = {
        "assets": [
            "asset_id", "asset_type", "department", "section_id",
            "criticality", "installation_date", "age_years", "condition_score"
        ],
        "defects": [
            "defect_id", "asset_id", "section_id", "defect_type",
            "severity", "detected_date", "status"
        ],
        "maintenance_tasks": [
            "task_id", "asset_id", "section_id", "department",
            "maintenance_type", "duration_hours", "severity", "urgency", "deadline"
        ],
        "trains": [
            "train_id", "train_number", "train_type", "priority", "source", "destination"
        ],
        "train_movements": [
            "movement_id", "train_id", "section_id", "arrival_time", "departure_time"
        ],
        "block_windows": [
            "block_id", "section_id", "date", "start_time", "end_time"
        ],
        "resources": [
            "resource_id", "department", "resource_type", "capacity", "available_from", "available_until"
        ],
        "maintenance_history": [
            "history_id", "asset_id", "section_id", "department", "maintenance_type", "completed_date", "duration_hours"
        ],
    }

    PRIMARY_KEYS: Dict[str, str] = {
        "assets": "asset_id",
        "defects": "defect_id",
        "maintenance_tasks": "task_id",
        "trains": "train_id",
        "train_movements": "movement_id",
        "block_windows": "block_id",
        "resources": "resource_id",
        "maintenance_history": "history_id",
    }

    def validate_dataset(self, tables: Dict[str, pd.DataFrame]) -> ValidationReport:
        """Perform comprehensive schema, primary key, and referential integrity checks."""
        report = ValidationReport()

        # 1. Table schema & primary key checks
        for table_name, df in tables.items():
            if df is None or not isinstance(df, pd.DataFrame):
                report.add_error(table_name, "INVALID_DATAFRAME", "Provided table is None or not a DataFrame.")
                continue

            report.total_records_checked += len(df)
            self._validate_schema(table_name, df, report)
            self._validate_primary_keys(table_name, df, report)

        # 2. Relational / Foreign Key checks
        self._validate_referential_integrity(tables, report)
        self._validate_temporal_logic(tables, report)

        return report

    def _validate_schema(self, table_name: str, df: pd.DataFrame, report: ValidationReport):
        required_cols = self.REQUIRED_COLUMNS.get(table_name, [])
        for col in required_cols:
            if col not in df.columns:
                report.add_error(
                    table=table_name,
                    error_type="MISSING_COLUMN",
                    message=f"Required column '{col}' is missing in table '{table_name}'.",
                    col=col,
                )

    def _validate_primary_keys(self, table_name: str, df: pd.DataFrame, report: ValidationReport):
        pk = self.PRIMARY_KEYS.get(table_name)
        if pk and pk in df.columns:
            # Check for nulls in primary key
            null_count = df[pk].isnull().sum()
            if null_count > 0:
                report.add_error(
                    table=table_name,
                    error_type="NULL_PRIMARY_KEY",
                    message=f"Table '{table_name}' has {null_count} rows with null primary key '{pk}'.",
                    col=pk,
                )

            # Check for duplicates
            duplicates = df[df.duplicated(subset=[pk], keep=False)]
            if not duplicates.empty:
                dup_ids = duplicates[pk].unique().tolist()[:5]
                report.add_error(
                    table=table_name,
                    error_type="DUPLICATE_PRIMARY_KEY",
                    message=f"Table '{table_name}' has duplicate primary keys: {dup_ids}...",
                    col=pk,
                )

    def _validate_referential_integrity(self, tables: Dict[str, pd.DataFrame], report: ValidationReport):
        # Asset ID references
        if "assets" in tables and "assets" in self.PRIMARY_KEYS:
            asset_ids: Set[str] = set(tables["assets"]["asset_id"].dropna().astype(str))

            # Check defects -> assets
            if "defects" in tables and "asset_id" in tables["defects"].columns:
                invalid_defects = tables["defects"][~tables["defects"]["asset_id"].astype(str).isin(asset_ids)]
                if not invalid_defects.empty:
                    bad_ids = invalid_defects["asset_id"].unique().tolist()[:5]
                    report.add_error(
                        table="defects",
                        error_type="FOREIGN_KEY_VIOLATION",
                        message=f"Defects reference non-existent asset_ids: {bad_ids}",
                        col="asset_id",
                    )

            # Check maintenance_tasks -> assets
            if "maintenance_tasks" in tables and "asset_id" in tables["maintenance_tasks"].columns:
                invalid_tasks = tables["maintenance_tasks"][~tables["maintenance_tasks"]["asset_id"].astype(str).isin(asset_ids)]
                if not invalid_tasks.empty:
                    bad_ids = invalid_tasks["asset_id"].unique().tolist()[:5]
                    report.add_error(
                        table="maintenance_tasks",
                        error_type="FOREIGN_KEY_VIOLATION",
                        message=f"Maintenance tasks reference non-existent asset_ids: {bad_ids}",
                        col="asset_id",
                    )

        # Train ID references
        if "trains" in tables and "train_id" in tables["trains"].columns:
            train_ids: Set[str] = set(tables["trains"]["train_id"].dropna().astype(str))
            if "train_movements" in tables and "train_id" in tables["train_movements"].columns:
                invalid_movements = tables["train_movements"][~tables["train_movements"]["train_id"].astype(str).isin(train_ids)]
                if not invalid_movements.empty:
                    bad_ids = invalid_movements["train_id"].unique().tolist()[:5]
                    report.add_error(
                        table="train_movements",
                        error_type="FOREIGN_KEY_VIOLATION",
                        message=f"Train movements reference non-existent train_ids: {bad_ids}",
                        col="train_id",
                    )

    def _validate_temporal_logic(self, tables: Dict[str, pd.DataFrame], report: ValidationReport):
        # Check train movements: arrival < departure
        if "train_movements" in tables:
            df = tables["train_movements"]
            if "arrival_time" in df.columns and "departure_time" in df.columns:
                try:
                    arr = pd.to_datetime(df["arrival_time"])
                    dep = pd.to_datetime(df["departure_time"])
                    invalid = df[dep <= arr]
                    if not invalid.empty:
                        report.add_error(
                            table="train_movements",
                            error_type="INVALID_TEMPORAL_ORDER",
                            message=f"Found {len(invalid)} movements where departure_time <= arrival_time.",
                        )
                except Exception as e:
                    report.add_error(
                        table="train_movements",
                        error_type="DATE_PARSE_ERROR",
                        message=f"Failed to parse train movement timestamps: {e}",
                    )

        # Check block windows: start_time < end_time
        if "block_windows" in tables:
            df = tables["block_windows"]
            if "start_time" in df.columns and "end_time" in df.columns:
                try:
                    st = pd.to_datetime(df["start_time"])
                    et = pd.to_datetime(df["end_time"])
                    invalid = df[et <= st]
                    if not invalid.empty:
                        report.add_error(
                            table="block_windows",
                            error_type="INVALID_TEMPORAL_ORDER",
                            message=f"Found {len(invalid)} block windows where end_time <= start_time.",
                        )
                except Exception as e:
                    report.add_error(
                        table="block_windows",
                        error_type="DATE_PARSE_ERROR",
                        message=f"Failed to parse block window timestamps: {e}",
                    )
