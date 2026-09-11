"""Railway Departmental System Adapters (TMS, TDMS, SMMS, BDMS, COA)."""

from __future__ import annotations
import datetime as dt
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd

from src.schemas import DataClassification
from src.data_pipeline.adapters.base import DataSourceAdapter
from src.data_pipeline.loaders import CSVDataSource
from src.data_pipeline.synthetic_generator import SyntheticDataGenerator

logger = logging.getLogger(__name__)


class SyntheticDataAdapter(DataSourceAdapter):
    """Prototype Demonstration Adapter generating realistic quad-track corridor telemetry."""
    
    def __init__(self, seed: int = 42):
        super().__init__(name="SyntheticDataAdapter", classification=DataClassification.SYNTHETIC)
        self.generator = SyntheticDataGenerator(seed=seed)

    def fetch_data(self, **kwargs) -> Dict[str, pd.DataFrame]:
        logger.info("[SyntheticDataAdapter] Generating high-fidelity demonstration dataset.")
        raw_tables = self.generator.generate_all()
        return raw_tables


class CSVAdapter(DataSourceAdapter):
    """File-based CSV Adapter for verified corridor benchmarks (e.g. RKMP-BPL)."""

    def __init__(self, data_dir: str = "data/rkmp_bpl", classification: DataClassification = DataClassification.PROTOTYPE):
        super().__init__(name="CSVAdapter", classification=classification)
        self.data_dir = Path(data_dir)
        self.loader = CSVDataSource()

    def fetch_data(self, **kwargs) -> Dict[str, pd.DataFrame]:
        logger.info("[CSVAdapter] Loading verified corridor tables from %s", self.data_dir)
        tables = {
            "assets": self.loader.read(self.data_dir / "assets.csv"),
            "defects": self.loader.read(self.data_dir / "defects.csv") if (self.data_dir / "defects.csv").exists() else pd.DataFrame(),
            "maintenance_tasks": self.loader.read(self.data_dir / "maintenance_tasks.csv") if (self.data_dir / "maintenance_tasks.csv").exists() else pd.DataFrame(),
            "trains": self.loader.read(self.data_dir / "trains.csv") if (self.data_dir / "trains.csv").exists() else pd.DataFrame(),
            "train_movements": self.loader.read(self.data_dir / "train_movements.csv") if (self.data_dir / "train_movements.csv").exists() else pd.DataFrame(),
            "block_windows": self.loader.read(self.data_dir / "block_windows.csv") if (self.data_dir / "block_windows.csv").exists() else pd.DataFrame(),
            "resources": self.loader.read(self.data_dir / "resources.csv") if (self.data_dir / "resources.csv").exists() else pd.DataFrame(),
            "maintenance_history": self.loader.read(self.data_dir / "maintenance_history.csv") if (self.data_dir / "maintenance_history.csv").exists() else pd.DataFrame(),
        }
        return tables


# ============================================================================
# Production Railway Adapters (Design-Ready for Railway / CRIS Gateway)
# ============================================================================

class TMSAdapter(DataSourceAdapter):
    """Track Management System (TMS) Adapter for Civil / P-Way Engineering."""

    def __init__(self, api_base_url: Optional[str] = None, fallback_dir: str = "data/rkmp_bpl"):
        super().__init__(name="TMSAdapter", classification=DataClassification.RAILWAY_PRODUCTION)
        self.api_base_url = api_base_url
        self.fallback_adapter = CSVAdapter(data_dir=fallback_dir, classification=DataClassification.PROTOTYPE)

    def fetch_data(self, **kwargs) -> Dict[str, pd.DataFrame]:
        if not self.api_base_url:
            logger.info("[TMSAdapter] No live CRIS TMS endpoint supplied. Engaging verified canonical fallback.")
            return self.fallback_adapter.fetch_data(**kwargs)
        # Production network request to authorized Railway internal gateway
        return self.execute_with_resilience(self._fetch_remote_tms)

    def _fetch_remote_tms(self) -> Dict[str, pd.DataFrame]:
        # Production REST / SOAP / DB connector
        raise NotImplementedError("Live TMS endpoint requires Railway internal network authorization.")


class TDMSAdapter(DataSourceAdapter):
    """Traction Distribution Management System (TDMS) Adapter for Electrical OHE."""

    def __init__(self, api_base_url: Optional[str] = None, fallback_dir: str = "data/rkmp_bpl"):
        super().__init__(name="TDMSAdapter", classification=DataClassification.RAILWAY_PRODUCTION)
        self.api_base_url = api_base_url
        self.fallback_adapter = CSVAdapter(data_dir=fallback_dir, classification=DataClassification.PROTOTYPE)

    def fetch_data(self, **kwargs) -> Dict[str, pd.DataFrame]:
        if not self.api_base_url:
            return self.fallback_adapter.fetch_data(**kwargs)
        return self.execute_with_resilience(self._fetch_remote_tdms)

    def _fetch_remote_tdms(self) -> Dict[str, pd.DataFrame]:
        raise NotImplementedError("Live TDMS endpoint requires Railway internal network authorization.")


class SMMSAdapter(DataSourceAdapter):
    """Signal Maintenance Management System (SMMS) Adapter for S&T Department."""

    def __init__(self, api_base_url: Optional[str] = None, fallback_dir: str = "data/rkmp_bpl"):
        super().__init__(name="SMMSAdapter", classification=DataClassification.RAILWAY_PRODUCTION)
        self.api_base_url = api_base_url
        self.fallback_adapter = CSVAdapter(data_dir=fallback_dir, classification=DataClassification.PROTOTYPE)

    def fetch_data(self, **kwargs) -> Dict[str, pd.DataFrame]:
        if not self.api_base_url:
            return self.fallback_adapter.fetch_data(**kwargs)
        return self.execute_with_resilience(self._fetch_remote_smms)

    def _fetch_remote_smms(self) -> Dict[str, pd.DataFrame]:
        raise NotImplementedError("Live SMMS endpoint requires Railway internal network authorization.")


class BDMSAdapter(DataSourceAdapter):
    """Block Demand & Disconnection Management System (BDMS) Adapter."""

    def __init__(self, api_base_url: Optional[str] = None, fallback_dir: str = "data/rkmp_bpl"):
        super().__init__(name="BDMSAdapter", classification=DataClassification.RAILWAY_PRODUCTION)
        self.api_base_url = api_base_url
        self.fallback_adapter = CSVAdapter(data_dir=fallback_dir, classification=DataClassification.PROTOTYPE)

    def fetch_data(self, **kwargs) -> Dict[str, pd.DataFrame]:
        if not self.api_base_url:
            return self.fallback_adapter.fetch_data(**kwargs)
        return self.execute_with_resilience(self._fetch_remote_bdms)

    def _fetch_remote_bdms(self) -> Dict[str, pd.DataFrame]:
        raise NotImplementedError("Live BDMS endpoint requires Railway internal network authorization.")


class COAAdapter(DataSourceAdapter):
    """Control Office Application (COA) Adapter for Train Movements and Timetables."""

    def __init__(self, api_base_url: Optional[str] = None, fallback_dir: str = "data/rkmp_bpl"):
        super().__init__(name="COAAdapter", classification=DataClassification.RAILWAY_PRODUCTION)
        self.api_base_url = api_base_url
        self.fallback_adapter = CSVAdapter(data_dir=fallback_dir, classification=DataClassification.PROTOTYPE)

    def fetch_data(self, **kwargs) -> Dict[str, pd.DataFrame]:
        if not self.api_base_url:
            return self.fallback_adapter.fetch_data(**kwargs)
        return self.execute_with_resilience(self._fetch_remote_coa)

    def _fetch_remote_coa(self) -> Dict[str, pd.DataFrame]:
        raise NotImplementedError("Live COA endpoint requires Railway internal network authorization.")
