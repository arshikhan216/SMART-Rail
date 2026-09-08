"""Deterministic train-block conflict detection and impact analysis engine."""

from __future__ import annotations
import datetime as dt
import logging
from typing import Dict, List, Optional, Set, Tuple, Any, Union
import pandas as pd
from pydantic import BaseModel, Field

from src.config import CONFIG, TrainImpactConfig
from src.schemas import Train, TrainMovement, BlockWindow, TrainType, TrainDirection

logger = logging.getLogger(__name__)


class ConflictingMovementDetail(BaseModel):
    """Detailed record of a conflicting train movement."""
    movement_id: str
    train_id: str
    train_number: str
    train_type: str
    priority: int
    arrival_time: dt.datetime
    departure_time: dt.datetime
    overlap_duration_minutes: float
    direction: str


class TrainConflictReport(BaseModel):
    """Diagnostic report detailing train traffic conflicts with a proposed block window."""
    block_id: str
    section_id: str
    block_start: dt.datetime
    block_end: dt.datetime
    duration_hours: float
    total_conflicting_trains: int = 0
    total_conflicting_movements: int = 0
    passenger_trains_affected: int = 0
    freight_trains_affected: int = 0
    high_priority_trains_affected: int = 0
    conflicting_train_ids: List[str] = Field(default_factory=list)
    conflicting_movement_ids: List[str] = Field(default_factory=list)
    impact_score: float = 0.0
    movements: List[ConflictingMovementDetail] = Field(default_factory=list)


class TrainConflictDetector:
    """Detects deterministic timetable-block interval overlaps and computes disruption impact."""

    def __init__(self, config: Optional[TrainImpactConfig] = None):
        self.config = config or CONFIG.train_impact

    @staticmethod
    def check_interval_overlap(
        start_a: dt.datetime,
        end_a: dt.datetime,
        start_b: dt.datetime,
        end_b: dt.datetime,
    ) -> Tuple[bool, float]:
        """Check if [start_a, end_a] overlaps with [start_b, end_b] and return overlap minutes."""
        overlap_start = max(start_a, start_b)
        overlap_end = min(end_a, end_b)
        if overlap_start < overlap_end:
            overlap_minutes = (overlap_end - overlap_start).total_seconds() / 60.0
            return True, round(overlap_minutes, 2)
        return False, 0.0

    def analyze_block_conflicts(
        self,
        block: BlockWindow,
        movements: List[TrainMovement],
        trains_lookup: Dict[str, Train],
    ) -> TrainConflictReport:
        """Analyze conflicts for a single BlockWindow against relevant train movements."""
        conflicting_movements: List[ConflictingMovementDetail] = []
        conflicting_train_ids: Set[str] = set()

        pax_count = 0
        freight_count = 0
        high_prio_count = 0

        # Filter movements in the same section
        section_movements = [m for m in movements if m.section_id == block.section_id]

        for mov in section_movements:
            is_overlap, overlap_mins = self.check_interval_overlap(
                block.start_time, block.end_time,
                mov.arrival_time, mov.departure_time,
            )

            if is_overlap:
                train_info = trains_lookup.get(mov.train_id)
                t_type = train_info.train_type.value if train_info else "ORDINARY_PASSENGER"
                priority = train_info.priority if train_info else 3
                t_num = train_info.train_number if train_info else mov.train_id

                detail = ConflictingMovementDetail(
                    movement_id=mov.movement_id,
                    train_id=mov.train_id,
                    train_number=t_num,
                    train_type=t_type,
                    priority=priority,
                    arrival_time=mov.arrival_time,
                    departure_time=mov.departure_time,
                    overlap_duration_minutes=overlap_mins,
                    direction=mov.direction.value,
                )
                conflicting_movements.append(detail)

                if mov.train_id not in conflicting_train_ids:
                    conflicting_train_ids.add(mov.train_id)
                    if "PASSENGER" in t_type:
                        pax_count += 1
                    elif "FREIGHT" in t_type:
                        freight_count += 1

                    if priority <= 2:  # Priority 1 (Vande Bharat/Rajdhani) or 2 (Express)
                        high_prio_count += 1

        # Calculate impact score
        total_overlap_hours = sum(m.overlap_duration_minutes for m in conflicting_movements) / 60.0
        impact = (
            self.config.passenger_weight * pax_count
            + self.config.freight_weight * freight_count
            + self.config.high_priority_weight * high_prio_count
            + total_overlap_hours * 2.0
        )
        impact = round(float(impact), 2)

        return TrainConflictReport(
            block_id=block.block_id,
            section_id=block.section_id,
            block_start=block.start_time,
            block_end=block.end_time,
            duration_hours=block.duration_hours,
            total_conflicting_trains=len(conflicting_train_ids),
            total_conflicting_movements=len(conflicting_movements),
            passenger_trains_affected=pax_count,
            freight_trains_affected=freight_count,
            high_priority_trains_affected=high_prio_count,
            conflicting_train_ids=list(conflicting_train_ids),
            conflicting_movement_ids=[m.movement_id for m in conflicting_movements],
            impact_score=impact,
            movements=conflicting_movements,
        )

    def analyze_all_blocks(
        self,
        blocks: List[BlockWindow],
        movements: List[TrainMovement],
        trains: List[Train],
    ) -> Dict[str, TrainConflictReport]:
        """Perform indexed section-wise conflict detection across all block windows."""
        trains_map = {t.train_id: t for t in trains}
        
        # Group movements by section_id for indexed fast filtering
        movements_by_section: Dict[str, List[TrainMovement]] = {}
        for m in movements:
            movements_by_section.setdefault(m.section_id, []).append(m)

        reports: Dict[str, TrainConflictReport] = {}
        for b in blocks:
            sec_movs = movements_by_section.get(b.section_id, [])
            rep = self.analyze_block_conflicts(b, sec_movs, trains_map)
            reports[b.block_id] = rep

        logger.info(f"Analyzed train conflicts for {len(blocks)} block windows across {len(movements)} movements.")
        return reports

    def batch_detect_conflicts(
        self,
        blocks: List[BlockWindow],
        movements: List[TrainMovement],
        trains: Union[List[Train], Dict[str, Train]],
    ) -> Dict[str, TrainConflictReport]:
        """Alias for analyze_all_blocks accepting either list or dict of trains."""
        train_list = list(trains.values()) if isinstance(trains, dict) else trains
        return self.analyze_all_blocks(blocks, movements, train_list)

