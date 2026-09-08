"""Strongly typed Pydantic data models for Indian Railways block planning."""

from __future__ import annotations
import datetime as dt
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator


# ==========================================
# Enums
# ==========================================

class Department(str, Enum):
    ENGINEERING = "ENGINEERING"  # Track / TMS
    S_AND_T = "S_AND_T"          # Signal & Telecom / SMMS
    TRACTION = "TRACTION"        # Overhead Electrical / TDMS


class CriticalityLevel(int, Enum):
    VERY_LOW = 1
    LOW = 2
    MEDIUM = 3
    HIGH = 4
    CRITICAL = 5


class SeverityLevel(int, Enum):
    MINOR = 1
    MODERATE = 2
    SIGNIFICANT = 3
    MAJOR = 4
    CRITICAL = 5


class DefectStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    DEFERRED = "DEFERRED"


class TrainType(str, Enum):
    PREMIUM_PASSENGER = "PREMIUM_PASSENGER"  # Vande Bharat, Rajdhani, Shatabdi
    EXPRESS_PASSENGER = "EXPRESS_PASSENGER"  # Superfast, Mail/Express
    ORDINARY_PASSENGER = "ORDINARY_PASSENGER"# Passenger, Suburban
    FREIGHT = "FREIGHT"                      # Goods, Container, Freight
    DEPARTMENTAL = "DEPARTMENTAL"            # Inspection, Tower Wagon, Work Train


class TrainDirection(str, Enum):
    UP = "UP"
    DOWN = "DOWN"
    BIDIRECTIONAL = "BIDIRECTIONAL"


class ResourceType(str, Enum):
    CREW = "CREW"
    MACHINE = "MACHINE"
    TOWER_WAGON = "TOWER_WAGON"
    TAMPING_MACHINE = "TAMPING_MACHINE"
    TOOL = "TOOL"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    VERY_HIGH = "VERY_HIGH"
    CRITICAL = "CRITICAL"


class PriorityLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    VERY_HIGH = "VERY_HIGH"
    CRITICAL = "CRITICAL"


# ==========================================
# Domain Entities
# ==========================================

class Asset(BaseModel):
    """Railway asset representing track, signal, point machine, or OHE section."""
    asset_id: str = Field(..., description="Unique asset identifier")
    asset_type: str = Field(..., description="Type of asset (e.g. TrackSegment, PointMachine, OHE_Mast)")
    department: Department = Field(..., description="Department responsible for maintenance")
    section_id: str = Field(..., description="Corridor section ID where asset is installed")
    location: str = Field(..., description="Kilometer marker or sub-location (e.g., KM-142/10)")
    criticality: int = Field(default=3, ge=1, le=5, description="Operational criticality (1=Low, 5=Critical)")
    installation_date: dt.date = Field(..., description="Date asset was commissioned")
    age_years: float = Field(..., ge=0.0, description="Asset age in years")
    condition_score: float = Field(..., ge=0.0, le=100.0, description="Measured condition (0=Failing, 100=Pristine)")
    traffic_load: float = Field(default=0.0, ge=0.0, description="Traffic load in Gross Million Tonnes (GMT) or daily train count")
    last_maintenance_date: Optional[dt.date] = Field(default=None, description="Date of last scheduled/corrective maintenance")

    @field_validator("condition_score")
    @classmethod
    def validate_condition_score(cls, v: float) -> float:
        if not (0.0 <= v <= 100.0):
            raise ValueError("Condition score must be between 0.0 and 100.0")
        return round(v, 2)


class Defect(BaseModel):
    """Logged infrastructure defect from TMS/SMMS/TDMS inspection systems."""
    defect_id: str = Field(..., description="Unique defect ticket identifier")
    asset_id: str = Field(..., description="Reference to the affected asset")
    section_id: str = Field(..., description="Section where defect is located")
    defect_type: str = Field(..., description="Defect classification (e.g. RailFractureRisk, PointFailure, OHE_Sag)")
    severity: int = Field(..., ge=1, le=5, description="Severity grade (1=Minor, 5=Immediate Safety Hazard)")
    detected_date: dt.date = Field(..., description="Date defect was identified")
    status: DefectStatus = Field(default=DefectStatus.OPEN, description="Current lifecycle state")
    overdue_days: int = Field(default=0, ge=0, description="Days elapsed past the mandated repair deadline")


class MaintenanceTask(BaseModel):
    """Specific maintenance activity requested or scheduled for an asset."""
    task_id: str = Field(..., description="Unique task identifier")
    asset_id: str = Field(..., description="Target asset ID")
    section_id: str = Field(..., description="Section ID")
    department: Department = Field(..., description="Responsible department")
    maintenance_type: str = Field(..., description="Work type (e.g. TrackTamping, PointOverhaul, OHE_Inspection)")
    duration_hours: float = Field(..., gt=0.0, le=24.0, description="Required block duration in hours")
    severity: int = Field(default=3, ge=1, le=5, description="Associated defect severity or task urgency")
    urgency: int = Field(default=3, ge=1, le=5, description="Operational urgency (1=Routine, 5=Emergency)")
    deadline: dt.datetime = Field(..., description="Mandatory completion deadline")
    required_workers: int = Field(default=1, ge=1, description="Number of personnel needed")
    required_machine: Optional[str] = Field(default=None, description="Special machine required (e.g. BCM, Duomatic, TowerWagon)")
    priority_score: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Calculated 0-100 priority score")
    risk_score: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Predicted failure risk probability")
    is_safety_critical: bool = Field(default=False, description="Whether unexecuted task breaches safety standards")


class Train(BaseModel):
    """Train profile operating across sections."""
    train_id: str = Field(..., description="Unique internal train ID")
    train_number: str = Field(..., description="Indian Railways train number (e.g. 12951)")
    train_type: TrainType = Field(..., description="Train operational category")
    priority: int = Field(default=2, ge=1, le=5, description="Dispatch priority (1=Highest e.g. Rajdhani, 5=Lowest)")
    source: str = Field(..., description="Origin station / yard")
    destination: str = Field(..., description="Destination station / yard")


class TrainMovement(BaseModel):
    """Scheduled traversal of a train through a specific track section."""
    movement_id: str = Field(..., description="Unique movement identifier")
    train_id: str = Field(..., description="Reference train ID")
    section_id: str = Field(..., description="Track section traversed")
    arrival_time: dt.datetime = Field(..., description="Section entry timestamp")
    departure_time: dt.datetime = Field(..., description="Section exit timestamp")
    direction: TrainDirection = Field(default=TrainDirection.UP, description="Movement direction")

    @model_validator(mode="after")
    def validate_times(self) -> TrainMovement:
        if self.departure_time <= self.arrival_time:
            raise ValueError("departure_time must be strictly after arrival_time")
        return self


class BlockWindow(BaseModel):
    """Corridor block availability window for maintenance possessions."""
    block_id: str = Field(..., description="Unique block window identifier")
    section_id: str = Field(..., description="Track section for block possession")
    date: dt.date = Field(..., description="Date of block")
    start_time: dt.datetime = Field(..., description="Block start timestamp")
    end_time: dt.datetime = Field(..., description="Block end timestamp")
    available: bool = Field(default=True, description="Whether window is open for allocation")

    @property
    def duration_hours(self) -> float:
        duration_seconds = (self.end_time - self.start_time).total_seconds()
        return round(duration_seconds / 3600.0, 2)

    @model_validator(mode="after")
    def validate_window(self) -> BlockWindow:
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be strictly after start_time")
        return self


class Resource(BaseModel):
    """Maintenance crew or heavy equipment asset."""
    resource_id: str = Field(..., description="Unique resource identifier")
    department: Department = Field(..., description="Owning department")
    resource_type: ResourceType = Field(..., description="Type of resource (Crew, Machine, Wagon)")
    capacity: int = Field(default=1, ge=1, description="Simultaneous concurrent tasks capability or crew headcount")
    available_from: dt.datetime = Field(..., description="Availability start window")
    available_until: dt.datetime = Field(..., description="Availability end window")
    section_id: Optional[str] = Field(default=None, description="Base station or home section if localized")

    @model_validator(mode="after")
    def validate_resource_window(self) -> Resource:
        if self.available_until <= self.available_from:
            raise ValueError("available_until must be strictly after available_from")
        return self


class MaintenanceHistory(BaseModel):
    """Historical maintenance log for asset degradation analysis."""
    history_id: str = Field(..., description="Unique maintenance history log ID")
    asset_id: str = Field(..., description="Target asset")
    section_id: str = Field(..., description="Section ID")
    department: Department = Field(..., description="Department executing maintenance")
    maintenance_type: str = Field(..., description="Work executed")
    completed_date: dt.date = Field(..., description="Completion date")
    duration_hours: float = Field(..., gt=0.0, description="Possession duration in hours")
    cost: Optional[float] = Field(default=None, ge=0.0, description="Direct maintenance expenditure")
    failure_occurred_after_days: Optional[int] = Field(default=None, ge=0, description="Days until next reported defect/failure")


class WeatherRecord(BaseModel):
    """Microclimate / weather observation for section risk modeling."""
    record_id: str = Field(..., description="Weather record ID")
    section_id: str = Field(..., description="Section identifier")
    date: dt.date = Field(..., description="Observation date")
    temperature_c: float = Field(..., description="Temperature in Celsius")
    rainfall_mm: float = Field(default=0.0, ge=0.0, description="Daily rainfall in mm")
    humidity_pct: float = Field(default=50.0, ge=0.0, le=100.0, description="Relative humidity %")
    weather_condition: str = Field(default="NORMAL", description="Weather tag e.g. HEAVY_RAIN, EXTREME_HEAT, NORMAL")


# ==========================================
# Optimization & Planning Structures
# ==========================================

class CandidateAssignment(BaseModel):
    """Pre-optimization candidate task-block pair with feasibility diagnostics."""
    task_id: str
    block_id: str
    section_id: str
    feasible: bool
    reason_if_infeasible: Optional[str] = None
    train_impact: float = 0.0
    resource_feasible: bool = True
    duration_feasible: bool = True


class ScheduleAssignment(BaseModel):
    """Committed/optimized assignment of maintenance task(s) to a block window."""
    assignment_id: str
    block_id: str
    task_ids: List[str]
    section_id: str
    departments: List[Department]
    scheduled_start: dt.datetime
    scheduled_end: dt.datetime
    duration_hours: float
    expected_train_impact: float = 0.0
    combined_priority_score: float = 0.0
    coordination_savings_hours: float = 0.0
    explanation: str = ""


class OptimizationResult(BaseModel):
    """Comprehensive output produced by CP-SAT solver and planning engine."""
    plan_id: str
    status: str = Field(..., description="OPTIMAL, FEASIBLE, or INFEASIBLE")
    objective_value: float = 0.0
    tasks_considered: int = 0
    tasks_scheduled: int = 0
    critical_tasks_scheduled: int = 0
    blocks_used: int = 0
    train_conflicts: int = 0
    estimated_train_impact: float = 0.0
    coordination_savings_hours: float = 0.0
    asset_availability: float = 1.0
    assignments: List[ScheduleAssignment] = Field(default_factory=list)
    unassigned_tasks: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
