"""Operational Audit Logging for Railway Decision Tracking."""

from __future__ import annotations
import datetime as dt
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("railway.audit")


def log_audit_event(
    user_id: str,
    role: str,
    action: str,
    plan_id: Optional[str] = None,
    recommendation: Optional[str] = None,
    verdict: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
):
    """Log structured operational audit record (Zero sensitive credential logging)."""
    audit_record = {
        "audit_timestamp": dt.datetime.now().isoformat(),
        "user_id": user_id,
        "user_role": role,
        "action": action,
        "plan_id": plan_id,
        "recommendation": recommendation,
        "validation_verdict": verdict,
        "details": details or {}
    }
    logger.info("[AUDIT] %s", json.dumps(audit_record))
