"""Centralized Logging & Observability Engine with Structured JSON and Correlation IDs."""

from __future__ import annotations
import contextvars
import datetime as dt
import functools
import json
import logging
from logging.handlers import RotatingFileHandler
import os
from pathlib import Path
import sys
import time
from typing import Any, Callable, Dict, List, Optional, TypeVar, Union
import uuid
from pydantic import BaseModel, Field

from src.config import CONFIG

# ContextVar for asynchronous & synchronous correlation ID tracking
_correlation_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar(
    "correlation_id", default="SYSTEM"
)

F = TypeVar("F", bound=Callable[..., Any])


def get_correlation_id() -> str:
    """Retrieve the current execution correlation ID."""
    return _correlation_id_ctx.get()


def set_correlation_id(correlation_id: Optional[str] = None) -> str:
    """Set or generate a new correlation ID for tracing execution flows."""
    corr_id = correlation_id or f"REQ-{uuid.uuid4().hex[:8].upper()}"
    _correlation_id_ctx.set(corr_id)
    return corr_id


class JSONFormatter(logging.Formatter):
    """Formats log records as structured JSON for enterprise SIEM / ELK ingestion."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry: Dict[str, Any] = {
            "timestamp": dt.datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "correlation_id": getattr(record, "correlation_id", get_correlation_id()),
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "process_id": record.process,
            "thread_name": record.threadName,
        }

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Include custom extra attributes if present
        if hasattr(record, "extra_data") and isinstance(record.extra_data, dict):
            log_entry["extra"] = record.extra_data

        return json.dumps(log_entry, default=str)


class StandardFormatter(logging.Formatter):
    """Human-readable console formatter with timestamp, level, and correlation ID."""

    DEFAULT_FORMAT = "%(asctime)s [%(levelname)s] [%(correlation_id)s] %(name)s (%(module)s:%(lineno)d): %(message)s"

    def __init__(self, fmt: Optional[str] = None, datefmt: str = "%Y-%m-%d %H:%M:%S"):
        super().__init__(fmt=fmt or self.DEFAULT_FORMAT, datefmt=datefmt)

    def format(self, record: logging.LogRecord) -> str:
        if not hasattr(record, "correlation_id"):
            record.correlation_id = get_correlation_id()
        return super().format(record)


class CorrelationIdFilter(logging.Filter):
    """Injects current correlation ID into every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "correlation_id"):
            record.correlation_id = get_correlation_id()
        return True


def setup_logging(
    log_level: Optional[str] = None,
    log_file: Optional[Union[str, Path]] = None,
    json_format: bool = False,
    max_bytes: int = 10_485_760,  # 10 MB
    backup_count: int = 5,
) -> logging.Logger:
    """
    Configure and initialize the centralized logging infrastructure.
    Attaches console output and rotating file handlers with correlation filters.
    """
    level_str = (log_level or getattr(CONFIG.logging, "level", "INFO")).upper()
    level = getattr(logging, level_str, logging.INFO)

    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Avoid duplicate handlers on re-configuration
    for h in list(root_logger.handlers):
        root_logger.removeHandler(h)

    corr_filter = CorrelationIdFilter()

    # 1. Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.addFilter(corr_filter)

    if json_format:
        console_handler.setFormatter(JSONFormatter())
    else:
        console_handler.setFormatter(StandardFormatter())

    root_logger.addHandler(console_handler)

    # 2. Rotating File Handler
    file_path_str = log_file or getattr(CONFIG.logging, "log_file", "logs/rail_planner.log")
    if file_path_str:
        file_path = Path(file_path_str)
        file_path.parent.mkdir(parents=True, exist_ok=True)

        file_handler = RotatingFileHandler(
            filename=str(file_path),
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding="utf-8",
        )
        file_handler.setLevel(level)
        file_handler.addFilter(corr_filter)

        # File logs default to JSON if json_format=True, otherwise Standard
        if json_format:
            file_handler.setFormatter(JSONFormatter())
        else:
            file_handler.setFormatter(StandardFormatter())

        root_logger.addHandler(file_handler)

    logger = logging.getLogger("rail_planner")
    logger.info("Centralized logging configured at level %s (file: %s)", level_str, file_path_str)
    return logger


def get_logger(name: str) -> logging.Logger:
    """Retrieve a module-specific logger equipped with the correlation filter."""
    log = logging.getLogger(name)
    if not any(isinstance(f, CorrelationIdFilter) for f in log.filters):
        log.addFilter(CorrelationIdFilter())
    return log


class ExecutionSpan(BaseModel):
    """Telemetry record capturing span execution details."""
    span_id: str
    operation_name: str
    correlation_id: str
    start_time: dt.datetime
    end_time: Optional[dt.datetime] = None
    duration_seconds: float = 0.0
    status: str = "RUNNING"
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class TimerContext:
    """Context manager for measuring and logging execution elapsed time."""

    def __init__(
        self,
        operation_name: str,
        logger: Optional[logging.Logger] = None,
        level: int = logging.INFO,
        extra_data: Optional[Dict[str, Any]] = None,
    ):
        self.operation_name = operation_name
        self.logger = logger or get_logger(__name__)
        self.level = level
        self.extra_data = extra_data or {}
        self.start_time: float = 0.0
        self.elapsed_seconds: float = 0.0

    def __enter__(self) -> TimerContext:
        self.start_time = time.perf_counter()
        self.logger.log(
            self.level,
            "Started operation: %s",
            self.operation_name,
            extra={"extra_data": self.extra_data},
        )
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.elapsed_seconds = time.perf_counter() - self.start_time
        if exc_type is not None:
            self.logger.error(
                "Operation '%s' FAILED after %.4fs: %s",
                self.operation_name,
                self.elapsed_seconds,
                exc_val,
                exc_info=True,
            )
        else:
            self.logger.log(
                self.level,
                "Finished operation: %s in %.4fs",
                self.operation_name,
                self.elapsed_seconds,
                extra={"extra_data": {**self.extra_data, "duration_seconds": self.elapsed_seconds}},
            )
        return False


def timed_execution(
    operation_name: Optional[str] = None,
    logger: Optional[logging.Logger] = None,
    level: int = logging.INFO,
) -> Callable[[F], F]:
    """Decorator to automatically time and trace function execution."""

    def decorator(func: F) -> F:
        op_name = operation_name or f"{func.__module__}.{func.__name__}"
        log = logger or get_logger(func.__module__)

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            with TimerContext(operation_name=op_name, logger=log, level=level):
                return func(*args, **kwargs)

        return wrapper  # type: ignore

    return decorator


class ExecutionTracer:
    """In-memory telemetry and distributed span tracer for pipeline monitoring."""

    def __init__(self):
        self.spans: List[ExecutionSpan] = []

    def start_span(self, operation_name: str, metadata: Optional[Dict[str, Any]] = None) -> ExecutionSpan:
        """Start a new telemetry span."""
        span = ExecutionSpan(
            span_id=f"SPAN-{uuid.uuid4().hex[:8].upper()}",
            operation_name=operation_name,
            correlation_id=get_correlation_id(),
            start_time=dt.datetime.now(),
            status="RUNNING",
            metadata=metadata or {},
        )
        self.spans.append(span)
        return span

    def finish_span(
        self,
        span: ExecutionSpan,
        status: str = "SUCCESS",
        error_message: Optional[str] = None,
    ) -> ExecutionSpan:
        """Complete a running span and compute duration."""
        span.end_time = dt.datetime.now()
        span.duration_seconds = round((span.end_time - span.start_time).total_seconds(), 4)
        span.status = status
        span.error_message = error_message
        return span

    def get_summary(self) -> Dict[str, Any]:
        """Aggregate summary of all captured execution spans."""
        total_duration = sum(s.duration_seconds for s in self.spans)
        successful = sum(1 for s in self.spans if s.status == "SUCCESS")
        failed = sum(1 for s in self.spans if s.status == "FAILED")

        return {
            "total_spans": len(self.spans),
            "successful_spans": successful,
            "failed_spans": failed,
            "total_duration_seconds": round(total_duration, 4),
            "spans": [s.model_dump() for s in self.spans],
        }
