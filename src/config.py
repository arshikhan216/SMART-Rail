"""Configuration loader and strongly-typed settings models for SMART-Rail."""

from __future__ import annotations
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
from enum import Enum
import yaml
from pydantic import BaseModel, Field


class DeploymentEnvironment(str, Enum):
    LOCAL_PROTOTYPE = "LOCAL_PROTOTYPE"
    RAILWAY_ON_PREM = "RAILWAY_ON_PREM"
    RAILWAY_PRIVATE_CLOUD = "RAILWAY_PRIVATE_CLOUD"
    CRIS_CONTROLLED = "CRIS_CONTROLLED"


class DataSourceType(str, Enum):
    SYNTHETIC = "SYNTHETIC"
    CSV = "CSV"
    JSON = "JSON"
    TMS_ADAPTER = "TMS_ADAPTER"
    TDMS_ADAPTER = "TDMS_ADAPTER"
    SMMS_ADAPTER = "SMMS_ADAPTER"
    BDMS_ADAPTER = "BDMS_ADAPTER"
    COA_ADAPTER = "COA_ADAPTER"


class PriorityWeightsConfig(BaseModel):
    risk: float = 0.40
    criticality: float = 0.25
    severity: float = 0.20
    urgency: float = 0.15


class OptimizationWeightsConfig(BaseModel):
    priority_gain: float = 100.0
    coordination_bonus: float = 50.0
    asset_availability_bonus: float = 30.0
    train_impact_penalty: float = 25.0
    downtime_penalty: float = 10.0
    resource_penalty: float = 5.0
    deferral_penalty: float = 60.0
    unserved_critical_penalty: float = 1500.0


class OptimizationConfig(BaseModel):
    solver_max_time_seconds: int = 60
    num_workers: int = 8
    relative_gap_limit: float = 0.01
    log_search_progress: bool = False
    scaling_factor: int = 10
    weights: OptimizationWeightsConfig = Field(default_factory=OptimizationWeightsConfig)


class TrainImpactConfig(BaseModel):
    passenger_weight: float = 1.5
    freight_weight: float = 1.0
    high_priority_weight: float = 3.0


class CoordinationConfig(BaseModel):
    max_tasks_per_block: int = 3
    safety_buffer_minutes: int = 15
    compatible_departments: List[List[str]] = Field(
        default_factory=lambda: [
            ["ENGINEERING", "S_AND_T"],
            ["ENGINEERING", "TRACTION"],
            ["S_AND_T", "TRACTION"],
            ["ENGINEERING", "S_AND_T", "TRACTION"],
        ]
    )


class SecurityConfig(BaseModel):
    rbac_enabled: bool = False
    jwt_secret_key: str = os.getenv("SMARTRAIL_SECRET_KEY", "smartrail_development_secret_key_change_in_production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    allowed_hosts: List[str] = Field(default_factory=lambda: ["*"])
    cors_origins: List[str] = Field(default_factory=lambda: ["*"])


class DataFreshnessConfig(BaseModel):
    max_stale_hours: float = 24.0
    max_timetable_stale_hours: float = 6.0
    strict_freshness_enforcement: bool = False


class ResilienceConfig(BaseModel):
    api_timeout_seconds: float = 10.0
    max_retries: int = 3
    retry_backoff_factor: float = 1.5
    circuit_breaker_failure_threshold: int = 5
    circuit_breaker_recovery_timeout_seconds: float = 30.0


class PathsConfig(BaseModel):
    raw_data_dir: str = "data/raw"
    processed_data_dir: str = "data/processed"
    synthetic_data_dir: str = "data/synthetic"
    models_dir: str = "models"
    reports_dir: str = "reports/output"


class ApiConfig(BaseModel):
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4
    reload: bool = False


class LoggingConfig(BaseModel):
    level: str = "INFO"
    log_file: str = "logs/rail_planner.log"


class AppConfig(BaseModel):
    environment: str = "production"
    deployment_mode: DeploymentEnvironment = DeploymentEnvironment.LOCAL_PROTOTYPE
    data_source: DataSourceType = DataSourceType.SYNTHETIC
    random_seed: int = 42
    priority_weights: PriorityWeightsConfig = Field(default_factory=PriorityWeightsConfig)
    optimization: OptimizationConfig = Field(default_factory=OptimizationConfig)
    train_impact: TrainImpactConfig = Field(default_factory=TrainImpactConfig)
    coordination: CoordinationConfig = Field(default_factory=CoordinationConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)
    data_freshness: DataFreshnessConfig = Field(default_factory=DataFreshnessConfig)
    resilience: ResilienceConfig = Field(default_factory=ResilienceConfig)
    paths: PathsConfig = Field(default_factory=PathsConfig)
    api: ApiConfig = Field(default_factory=ApiConfig)
    logging: LoggingConfig = Field(default_factory=LoggingConfig)


CONFIG = AppConfig()


def load_config(config_path: str | Path | None = None) -> AppConfig:
    """Load configuration from YAML file and environment variables."""
    global CONFIG
    if config_path is None:
        config_path = os.getenv("CONFIG_PATH", "config.yaml")

    path = Path(config_path)
    if not path.exists():
        CONFIG = AppConfig()
        return CONFIG

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        CONFIG = AppConfig(**data)
        return CONFIG
    except Exception as e:
        CONFIG = AppConfig()
        return CONFIG
