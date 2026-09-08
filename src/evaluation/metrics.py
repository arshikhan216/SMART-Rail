"""Asset Availability, Reliability (MTBF/MTTR), and Corridor Operational Metrics Engine."""

from __future__ import annotations
import datetime as dt
import logging
from typing import Dict, List, Optional, Set, Tuple, Any
from pydantic import BaseModel, Field

from src.schemas import (
    Asset,
    MaintenanceTask,
    ScheduleAssignment,
    Department,
    MaintenanceHistory,
)

logger = logging.getLogger(__name__)


class DepartmentMetric(BaseModel):
    """Departmental maintenance and asset uptime metrics."""
    department: Department
    availability_pct: float = 100.0
    tasks_scheduled: int = 0
    total_maintenance_hours: float = 0.0
    mttr_hours: float = 0.0


class SectionMetric(BaseModel):
    """Sectional corridor performance and possession metric."""
    section_id: str
    availability_pct: float = 100.0
    total_possession_hours: float = 0.0
    tasks_scheduled: int = 0
    train_impact_score: float = 0.0


class AssetAvailabilityReport(BaseModel):
    """Comprehensive asset availability, reliability, and schedule efficiency report."""
    corridor_availability_pct: float = 100.0
    inherent_availability_pct: float = 100.0
    mtbf_hours: float = 720.0
    mttr_hours: float = 2.0
    bundling_efficiency_pct: float = 0.0
    on_time_completion_rate_pct: float = 100.0
    critical_defect_clearance_rate_pct: float = 100.0
    total_scheduled_tasks: int = 0
    total_possession_hours: float = 0.0
    coordination_savings_hours: float = 0.0
    department_metrics: Dict[Department, DepartmentMetric] = Field(default_factory=dict)
    section_metrics: Dict[str, SectionMetric] = Field(default_factory=dict)


class AssetAvailabilityMetricsCalculator:
    """Calculates formal railway operational availability, MTBF, MTTR, and bundling efficiency."""

    def calculate_metrics(
        self,
        assignments: List[ScheduleAssignment],
        tasks: List[MaintenanceTask],
        assets: List[Asset],
        horizon_hours: float = 168.0,  # Default 7 days = 168h
        history: Optional[List[MaintenanceHistory]] = None,
    ) -> AssetAvailabilityReport:
        """Compute end-to-end reliability and operational corridor availability metrics."""
        history = history or []
        tasks_lookup = {t.task_id: t for t in tasks}

        # 1. Total possession hours & coordination savings
        total_possession_hours = sum(a.duration_hours for a in assignments)
        total_savings_hours = sum(a.coordination_savings_hours for a in assignments)
        all_scheduled_tids = {tid for a in assignments for tid in a.task_ids}

        # 2. Raw individual task hours
        raw_task_hours = sum(
            tasks_lookup[tid].duration_hours for tid in all_scheduled_tids if tid in tasks_lookup
        )

        # Bundling Efficiency
        bundling_eff = 0.0
        if raw_task_hours > 0:
            bundling_eff = round((total_savings_hours / raw_task_hours) * 100, 2)

        # 3. Critical defect clearance rate
        critical_tasks = [t for t in tasks if t.is_safety_critical or t.urgency >= 4]
        critical_scheduled = [t for t in critical_tasks if t.task_id in all_scheduled_tids]
        critical_clearance_pct = (
            round((len(critical_scheduled) / len(critical_tasks)) * 100, 2) if critical_tasks else 100.0
        )

        # 4. On-time completion rate
        on_time_count = 0
        for asgn in assignments:
            for tid in asgn.task_ids:
                task = tasks_lookup.get(tid)
                if task and asgn.scheduled_end <= task.deadline:
                    on_time_count += 1
        on_time_rate = (
            round((on_time_count / len(all_scheduled_tids)) * 100, 2) if all_scheduled_tids else 100.0
        )

        # 5. Sectional metrics
        distinct_sections = {a.section_id for a in assets} | {asgn.section_id for asgn in assignments}
        section_metrics: Dict[str, SectionMetric] = {}

        for sec in distinct_sections:
            sec_asgns = [a for a in assignments if a.section_id == sec]
            sec_poss_hours = sum(a.duration_hours for a in sec_asgns)
            sec_impact = sum(a.expected_train_impact for a in sec_asgns)
            sec_tasks = sum(len(a.task_ids) for a in sec_asgns)

            # Section Availability = (Horizon - Possession Hours) / Horizon
            sec_avail = max(0.0, min(100.0, round(((horizon_hours - sec_poss_hours) / horizon_hours) * 100, 2)))
            section_metrics[sec] = SectionMetric(
                section_id=sec,
                availability_pct=sec_avail,
                total_possession_hours=round(sec_poss_hours, 2),
                tasks_scheduled=sec_tasks,
                train_impact_score=round(sec_impact, 2),
            )

        # Corridor Availability (Mean across sections)
        corridor_avail = (
            round(sum(sm.availability_pct for sm in section_metrics.values()) / len(section_metrics), 2)
            if section_metrics
            else 100.0
        )

        # 6. Departmental Metrics
        dept_metrics: Dict[Department, DepartmentMetric] = {}
        for dept in Department:
            dept_asgns = [a for a in assignments if dept in a.departments]
            dept_hours = sum(a.duration_hours for a in dept_asgns)
            dept_tasks = sum(
                1 for a in assignments for tid in a.task_ids
                if tid in tasks_lookup and tasks_lookup[tid].department == dept
            )
            dept_avail = max(0.0, min(100.0, round(((horizon_hours - dept_hours) / horizon_hours) * 100, 2)))
            mttr = round(dept_hours / dept_tasks, 2) if dept_tasks > 0 else 0.0

            dept_metrics[dept] = DepartmentMetric(
                department=dept,
                availability_pct=dept_avail,
                tasks_scheduled=dept_tasks,
                total_maintenance_hours=round(dept_hours, 2),
                mttr_hours=mttr,
            )

        # 7. MTBF & MTTR Calculation
        num_failures = len(critical_tasks) if critical_tasks else 1
        mtbf_hours = round(horizon_hours * max(1, len(assets)) / num_failures, 2)
        mttr_hours = round(total_possession_hours / max(1, len(assignments)), 2)

        inherent_avail = round((mtbf_hours / (mtbf_hours + mttr_hours)) * 100, 2)

        return AssetAvailabilityReport(
            corridor_availability_pct=corridor_avail,
            inherent_availability_pct=inherent_avail,
            mtbf_hours=mtbf_hours,
            mttr_hours=mttr_hours,
            bundling_efficiency_pct=bundling_eff,
            on_time_completion_rate_pct=on_time_rate,
            critical_defect_clearance_rate_pct=critical_clearance_pct,
            total_scheduled_tasks=len(all_scheduled_tids),
            total_possession_hours=round(total_possession_hours, 2),
            coordination_savings_hours=round(total_savings_hours, 2),
            department_metrics=dept_metrics,
            section_metrics=section_metrics,
        )
