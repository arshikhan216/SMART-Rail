"""Unified data integration and storage orchestrator."""

from __future__ import annotations
import logging
from pathlib import Path
from typing import Dict, List, Optional, Union, Tuple
import pandas as pd
from pydantic import BaseModel

from src.config import CONFIG
from src.exceptions import DataValidationError
from src.schemas import (
    Asset,
    Defect,
    MaintenanceTask,
    Train,
    TrainMovement,
    BlockWindow,
    Resource,
    MaintenanceHistory,
)
from src.data_pipeline.loaders import (
    CSVDataSource,
    JSONDataSource,
    ParquetDataSource,
    TMSAdapter,
    SMMSAdapter,
    TDMSAdapter,
    COAAdapter,
    TimetableAdapter,
)
from src.data_pipeline.preprocessing import DataPreprocessor
from src.data_pipeline.validators import DataValidator, ValidationReport

logger = logging.getLogger(__name__)


class UnifiedDataStore:
    """In-memory data store holding standardized, validated relational tables and Pydantic entities."""

    def __init__(self, tables: Dict[str, pd.DataFrame]):
        self.tables = tables

        # Lazily or eagerly parsed Pydantic entity collections
        self._assets: Optional[List[Asset]] = None
        self._defects: Optional[List[Defect]] = None
        self._maintenance_tasks: Optional[List[MaintenanceTask]] = None
        self._trains: Optional[List[Train]] = None
        self._train_movements: Optional[List[TrainMovement]] = None
        self._block_windows: Optional[List[BlockWindow]] = None
        self._resources: Optional[List[Resource]] = None
        self._maintenance_history: Optional[List[MaintenanceHistory]] = None

    @property
    def assets(self) -> List[Asset]:
        if self._assets is None and "assets" in self.tables:
            self._assets = [Asset(**row) for row in self.tables["assets"].to_dict(orient="records")]
        return self._assets or []

    @property
    def defects(self) -> List[Defect]:
        if self._defects is None and "defects" in self.tables:
            self._defects = [Defect(**row) for row in self.tables["defects"].to_dict(orient="records")]
        return self._defects or []

    @property
    def maintenance_tasks(self) -> List[MaintenanceTask]:
        if self._maintenance_tasks is None and "maintenance_tasks" in self.tables:
            self._maintenance_tasks = [MaintenanceTask(**row) for row in self.tables["maintenance_tasks"].to_dict(orient="records")]
        return self._maintenance_tasks or []

    @property
    def trains(self) -> List[Train]:
        if self._trains is None and "trains" in self.tables:
            self._trains = [Train(**row) for row in self.tables["trains"].to_dict(orient="records")]
        return self._trains or []

    @property
    def train_movements(self) -> List[TrainMovement]:
        if self._train_movements is None and "train_movements" in self.tables:
            self._train_movements = [TrainMovement(**row) for row in self.tables["train_movements"].to_dict(orient="records")]
        return self._train_movements or []

    @property
    def block_windows(self) -> List[BlockWindow]:
        if self._block_windows is None and "block_windows" in self.tables:
            self._block_windows = [BlockWindow(**row) for row in self.tables["block_windows"].to_dict(orient="records")]
        return self._block_windows or []

    @property
    def resources(self) -> List[Resource]:
        if self._resources is None and "resources" in self.tables:
            self._resources = [Resource(**row) for row in self.tables["resources"].to_dict(orient="records")]
        return self._resources or []

    @property
    def maintenance_history(self) -> List[MaintenanceHistory]:
        if self._maintenance_history is None and "maintenance_history" in self.tables:
            self._maintenance_history = [MaintenanceHistory(**row) for row in self.tables["maintenance_history"].to_dict(orient="records")]
        return self._maintenance_history or []

    def export_processed(self, output_dir: Union[str, Path], format: str = "csv") -> None:
        """Export all standardized tables to directory in CSV or Parquet format."""
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        for name, df in self.tables.items():
            if df is not None:
                if format.lower() == "parquet":
                    df.to_parquet(out_path / f"{name}.parquet", index=False)
                else:
                    df.to_csv(out_path / f"{name}.csv", index=False)
        logger.info(f"Exported {len(self.tables)} processed tables to {out_path} ({format})")


class IntegratedDataPipeline:
    """Orchestrates end-to-end ingestion, adapter normalization, preprocessing, and validation."""

    def __init__(self, validator: Optional[DataValidator] = None):
        self.validator = validator or DataValidator()
        self.preprocessor = DataPreprocessor()

    def process(
        self,
        raw_tables: Dict[str, Union[str, Path, pd.DataFrame]],
        strict_validation: bool = True,
    ) -> Tuple[UnifiedDataStore, ValidationReport]:
        """Ingest, preprocess, validate, and wrap into a UnifiedDataStore."""
        cleaned_tables: Dict[str, pd.DataFrame] = {}

        # 1. Ingest and Preprocess
        for table_name, raw_source in raw_tables.items():
            raw_df = self._load_source(raw_source)

            if table_name == "assets":
                cleaned_tables[table_name] = self.preprocessor.preprocess_assets(raw_df)
            elif table_name == "defects":
                cleaned_tables[table_name] = self.preprocessor.preprocess_defects(raw_df)
            elif table_name == "maintenance_tasks":
                cleaned_tables[table_name] = self.preprocessor.preprocess_maintenance_tasks(raw_df)
            elif table_name == "trains":
                cleaned_tables[table_name] = self.preprocessor.preprocess_trains(raw_df)
            elif table_name == "train_movements":
                cleaned_tables[table_name] = self.preprocessor.preprocess_train_movements(raw_df)
            elif table_name == "block_windows":
                cleaned_tables[table_name] = self.preprocessor.preprocess_block_windows(raw_df)
            elif table_name == "resources":
                cleaned_tables[table_name] = self.preprocessor.preprocess_resources(raw_df)
            elif table_name == "maintenance_history":
                cleaned_tables[table_name] = self.preprocessor.preprocess_maintenance_history(raw_df)
            else:
                cleaned_tables[table_name] = raw_df

        # 2. Validate
        report = self.validator.validate_dataset(cleaned_tables)
        if strict_validation and not report.is_valid:
            error_summary = [f"[{e.table_name}] {e.error_type}: {e.message}" for e in report.errors[:5]]
            raise DataValidationError(
                f"Data validation failed with {report.total_errors} errors: {error_summary}",
                details={"errors": [e.model_dump() for e in report.errors]},
            )

        store = UnifiedDataStore(cleaned_tables)
        return store, report

    def _load_source(self, source: Union[str, Path, pd.DataFrame]) -> pd.DataFrame:
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
            return CSVDataSource().read(path)
