"""Configuration loader and strongly-typed settings models."""

from __future__ import annotations
import os
from pathlib import Path
from typing import Dict, List, Any
import yaml
from pydantic import BaseModel, Field
from src.exceptions import ConfigurationError


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
    solver_max_time_seconds: int = 30
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


class PathsConfig(BaseModel):
    raw_data_dir: str = "data/raw"
    processed_data_dir: str = "data/processed"
    synthetic_data_dir: str = "data/synthetic"
    models_dir: str = "models"


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
    random_seed: int = 42
    priority_weights: PriorityWeightsConfig = Field(default_factory=PriorityWeightsConfig)
    optimization: OptimizationConfig = Field(default_factory=OptimizationConfig)
    train_impact: TrainImpactConfig = Field(default_factory=TrainImpactConfig)
    coordination: CoordinationConfig = Field(default_factory=CoordinationConfig)
    paths: PathsConfig = Field(default_factory=PathsConfig)
    api: ApiConfig = Field(default_factory=ApiConfig)
    logging: LoggingConfig = Field(default_factory=LoggingConfig)


def load_config(config_path: str | Path | None = None) -> AppConfig:
    """Load configuration from YAML file and environment variables."""
    if config_path is None:
        config_path = os.getenv("CONFIG_PATH", "config.yaml")

    path = Path(config_path)
    if not path.exists():
        return AppConfig()

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        return AppConfig(**data)
    except Exception as e:
        raise ConfigurationError(f"Failed to load configuration from {path}: {e}") from e


# Global configuration instance
CONFIG = load_config()
