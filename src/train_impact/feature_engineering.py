"""Feature engineering pipeline for Train Delay ML Regressor."""

from __future__ import annotations
import datetime as dt
import logging
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

logger = logging.getLogger(__name__)

NUMERICAL_DELAY_FEATURES = [
    "block_duration_hours",
    "overlap_minutes",
    "train_priority",
    "hour_of_day",
    "day_of_week",
    "rainfall_mm",
    "temperature_c",
    "section_length_km",
]

CATEGORICAL_DELAY_FEATURES = [
    "train_type",
    "direction",
    "weather_condition",
]

DELAY_FEATURE_COLUMNS = NUMERICAL_DELAY_FEATURES + CATEGORICAL_DELAY_FEATURES


class TrainDelayFeatureExtractor:
    """Extracts features from train movements, conflicting block windows, and weather."""

    @staticmethod
    def extract_features(
        conflicting_movements_df: pd.DataFrame,
        weather_df: Optional[pd.DataFrame] = None,
        sections_df: Optional[pd.DataFrame] = None,
    ) -> pd.DataFrame:
        df = conflicting_movements_df.copy()

        # Parse datetime features
        if "arrival_time" in df.columns:
            arr = pd.to_datetime(df["arrival_time"])
            df["hour_of_day"] = arr.dt.hour
            df["day_of_week"] = arr.dt.dayofweek
            df["date_str"] = arr.dt.date.astype(str)
        else:
            df["hour_of_day"] = 12
            df["day_of_week"] = 2
            df["date_str"] = "2026-03-01"

        # Numerical bounds
        if "block_duration_hours" in df.columns:
            df["block_duration_hours"] = pd.to_numeric(df["block_duration_hours"], errors="coerce").fillna(3.0)
        else:
            df["block_duration_hours"] = 3.0

        if "overlap_minutes" in df.columns:
            df["overlap_minutes"] = pd.to_numeric(df["overlap_minutes"], errors="coerce").fillna(30.0)
        else:
            df["overlap_minutes"] = 30.0

        prio_col = "priority" if "priority" in df.columns else "train_priority"
        if prio_col in df.columns:
            df["train_priority"] = pd.to_numeric(df[prio_col], errors="coerce").fillna(3).astype(int)
        else:
            df["train_priority"] = 3

        # Merge sections length if available
        if sections_df is not None and not sections_df.empty:
            sec_lookup = sections_df.set_index("section_id")["length_km"].to_dict()
            df["section_length_km"] = df["section_id"].map(sec_lookup).fillna(150.0)
        else:
            df["section_length_km"] = 150.0

        # Merge weather if available
        if weather_df is not None and not weather_df.empty:
            w_df = weather_df.copy()
            w_df["date_str"] = pd.to_datetime(w_df["date"]).dt.date.astype(str)
            df = df.merge(
                w_df[["section_id", "date_str", "rainfall_mm", "temperature_c", "weather_condition"]],
                on=["section_id", "date_str"],
                how="left",
            )
        
        if "rainfall_mm" in df.columns:
            df["rainfall_mm"] = pd.to_numeric(df["rainfall_mm"], errors="coerce").fillna(0.0)
        else:
            df["rainfall_mm"] = 0.0

        if "temperature_c" in df.columns:
            df["temperature_c"] = pd.to_numeric(df["temperature_c"], errors="coerce").fillna(30.0)
        else:
            df["temperature_c"] = 30.0

        if "weather_condition" in df.columns:
            df["weather_condition"] = df["weather_condition"].fillna("NORMAL").astype(str).str.upper()
        else:
            df["weather_condition"] = "NORMAL"

        if "train_type" in df.columns:
            df["train_type"] = df["train_type"].astype(str).str.upper()
        else:
            df["train_type"] = "ORDINARY_PASSENGER"

        if "direction" in df.columns:
            df["direction"] = df["direction"].astype(str).str.upper()
        else:
            df["direction"] = "UP"

        return df


def build_delay_preprocessing_pipeline() -> ColumnTransformer:
    """Build preprocessing pipeline for regression model."""
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="constant", fill_value="UNKNOWN")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, NUMERICAL_DELAY_FEATURES),
            ("cat", cat_pipeline, CATEGORICAL_DELAY_FEATURES),
        ],
        remainder="drop",
    )

    return preprocessor
