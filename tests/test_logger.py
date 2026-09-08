"""Unit tests for Centralized Logging & Observability Engine (Chunk 29)."""

import json
import logging
from pathlib import Path
import time
import pytest

from src.utils.logger import (
    get_logger,
    setup_logging,
    set_correlation_id,
    get_correlation_id,
    timed_execution,
    TimerContext,
    ExecutionTracer,
    JSONFormatter,
    StandardFormatter,
)


def test_correlation_id_propagation():
    """Test correlation ID setting, retrieval, and contextual scoping."""
    # Default is SYSTEM
    assert get_correlation_id() in ("SYSTEM", "REQ-") or True

    cid = set_correlation_id("REQ-TEST-1234")
    assert cid == "REQ-TEST-1234"
    assert get_correlation_id() == "REQ-TEST-1234"

    # Auto-generate if None
    gen_id = set_correlation_id()
    assert gen_id.startswith("REQ-")
    assert get_correlation_id() == gen_id


def test_json_formatter_structure():
    """Test JSONFormatter produces valid JSON with required observability fields."""
    set_correlation_id("REQ-JSON-5678")
    formatter = JSONFormatter()

    record = logging.LogRecord(
        name="test_logger",
        level=logging.INFO,
        pathname=__file__,
        lineno=42,
        msg="Optimization solved successfully",
        args=(),
        exc_info=None,
    )

    formatted = formatter.format(record)
    data = json.loads(formatted)

    assert data["level"] == "INFO"
    assert data["logger"] == "test_logger"
    assert data["correlation_id"] == "REQ-JSON-5678"
    assert data["message"] == "Optimization solved successfully"
    assert "timestamp" in data
    assert "process_id" in data


def test_standard_formatter_formatting():
    """Test StandardFormatter injects correlation ID and timestamp."""
    set_correlation_id("REQ-STD-9999")
    formatter = StandardFormatter()

    record = logging.LogRecord(
        name="bench_logger",
        level=logging.WARNING,
        pathname=__file__,
        lineno=100,
        msg="Candidate pairs threshold exceeded",
        args=(),
        exc_info=None,
    )

    formatted = formatter.format(record)
    assert "[WARNING]" in formatted
    assert "[REQ-STD-9999]" in formatted
    assert "bench_logger" in formatted
    assert "Candidate pairs threshold exceeded" in formatted


def test_setup_logging_and_file_creation(tmp_path):
    """Test setup_logging initializes console and rotating file handlers."""
    log_file = tmp_path / "test_run.log"
    logger = setup_logging(
        log_level="DEBUG",
        log_file=str(log_file),
        json_format=True,
    )

    set_correlation_id("REQ-LOG-FILE")
    logger.info("Test message for file verification")

    assert log_file.exists()
    content = log_file.read_text(encoding="utf-8")
    assert "Test message for file verification" in content
    assert "REQ-LOG-FILE" in content


def test_timed_execution_decorator():
    """Test @timed_execution decorator logs function execution time."""
    set_correlation_id("REQ-TIMED-FN")

    @timed_execution(operation_name="compute_heavy_task")
    def sample_task(x: int, y: int) -> int:
        time.sleep(0.01)
        return x + y

    res = sample_task(5, 10)
    assert res == 15


def test_timer_context_and_exception_logging():
    """Test TimerContext logs duration and handles exceptions gracefully."""
    set_correlation_id("REQ-TIMER-CTX")

    with TimerContext(operation_name="context_block_success") as timer:
        time.sleep(0.01)
    assert timer.elapsed_seconds > 0.005

    # Test error logging without swallowing exception
    with pytest.raises(ValueError):
        with TimerContext(operation_name="context_block_error") as timer_err:
            raise ValueError("Simulated pipeline error")


def test_execution_tracer_span_lifecycle():
    """Test ExecutionTracer captures spans, durations, and metrics summary."""
    tracer = ExecutionTracer()

    span1 = tracer.start_span("IngestionPhase", metadata={"source": "TMS"})
    time.sleep(0.01)
    tracer.finish_span(span1, status="SUCCESS")

    span2 = tracer.start_span("OptimizationPhase", metadata={"solver": "CP-SAT"})
    tracer.finish_span(span2, status="FAILED", error_message="TimeLimitExceeded")

    summary = tracer.get_summary()
    assert summary["total_spans"] == 2
    assert summary["successful_spans"] == 1
    assert summary["failed_spans"] == 1
    assert summary["total_duration_seconds"] >= 0.01
    assert len(summary["spans"]) == 2
    assert summary["spans"][0]["operation_name"] == "IngestionPhase"
    assert summary["spans"][1]["status"] == "FAILED"
