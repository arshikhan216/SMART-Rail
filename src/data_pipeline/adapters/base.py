"""Modular Data Adapter Base Class with Circuit Breaker, Retries, and Freshness Auditing."""

from __future__ import annotations
import abc
import datetime as dt
import logging
import time
from typing import Dict, Any, Optional, List
import pandas as pd

from src.schemas import DataClassification
from src.exceptions import DataValidationError, DataIngestionError

logger = logging.getLogger(__name__)


class CircuitBreakerOpenError(DataIngestionError):
    """Raised when external data interface circuit breaker is tripped open."""
    pass


class StaleDataError(DataValidationError):
    """Raised when source data exceeds the maximum allowed age threshold."""
    pass


class DataSourceAdapter(abc.ABC):
    """Abstract base class for all Railway system adapters and prototype data loaders."""

    def __init__(
        self,
        name: str,
        classification: DataClassification = DataClassification.PROTOTYPE,
        max_stale_hours: float = 24.0,
        timeout_seconds: float = 10.0,
        max_retries: int = 3,
        circuit_breaker_threshold: int = 5
    ):
        self.name = name
        self.classification = classification
        self.max_stale_hours = max_stale_hours
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries
        self.circuit_breaker_threshold = circuit_breaker_threshold
        
        self.failure_count = 0
        self.last_failure_time: Optional[float] = None
        self.is_circuit_open = False
        self.last_sync_timestamp: Optional[dt.datetime] = None

    @abc.abstractmethod
    def fetch_data(self, **kwargs) -> Dict[str, pd.DataFrame]:
        """Fetch raw table DataFrames from source (CSV, Database, or Railway API Gateway)."""
        pass

    def check_freshness(self, df: pd.DataFrame, timestamp_col: str = "detected_date") -> bool:
        """Verify data timestamp does not exceed the allowed stale threshold."""
        if df.empty or timestamp_col not in df.columns:
            return True
        try:
            latest = pd.to_datetime(df[timestamp_col]).max()
            now = pd.Timestamp.now()
            age_hours = (now - latest).total_seconds() / 3600.0
            if age_hours > self.max_stale_hours:
                logger.warning(
                    "[%s] Data freshness warning: Latest record is %.1f hours old (Limit: %.1fh)",
                    self.name, age_hours, self.max_stale_hours
                )
                return False
            return True
        except Exception:
            return True

    def execute_with_resilience(self, func, *args, **kwargs) -> Any:
        """Execute adapter call wrapped with Circuit Breaker and Bounded Exponential Backoff."""
        if self.is_circuit_open:
            if self.last_failure_time and (time.time() - self.last_failure_time > 30.0):
                logger.info("[%s] Circuit breaker entering HALF-OPEN probe state.", self.name)
                self.is_circuit_open = False
            else:
                raise CircuitBreakerOpenError(
                    f"[{self.name}] Circuit breaker is OPEN. Downstream interface is degraded."
                )

        last_err = None
        for attempt in range(1, self.max_retries + 1):
            try:
                result = func(*args, **kwargs)
                self.failure_count = 0
                self.last_sync_timestamp = dt.datetime.now()
                return result
            except Exception as e:
                last_err = e
                self.failure_count += 1
                logger.warning(
                    "[%s] Fetch attempt %d/%d failed: %s",
                    self.name, attempt, self.max_retries, str(e)
                )
                if self.failure_count >= self.circuit_breaker_threshold:
                    self.is_circuit_open = True
                    self.last_failure_time = time.time()
                    logger.error("[%s] Failure threshold exceeded. Circuit breaker TRIPPED OPEN.", self.name)
                    break
                time.sleep(0.5 * (1.5 ** attempt))

        raise DataIngestionError(f"[{self.name}] Failed to fetch data after {self.max_retries} attempts: {last_err}")
