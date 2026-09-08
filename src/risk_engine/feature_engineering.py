"""Feature engineering pipeline for Asset Risk ML Model."""

from __future__ import annotations
import datetime as dt
import logging
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

logger = logging.getLogger(__name__)

NUMERICAL_FEATURES = [
    "condition_score",
    "age_years",
    "traffic_load",
    "criticality",
    "defect_count",
    "max_defect_severity",
    "total_overdue_days",
    "days_since_maintenance",
    "historical_failures_count",
]

CATEGORICAL_FEATURES = [
    "department",
]

FEATURE_COLUMNS = NUMERICAL_FEATURES + CATEGORICAL_FEATURES


class AssetRiskFeatureExtractor:
    """Transforms raw relational datasets into ML-ready tabular features."""

    @staticmethod
    def extract_features(
        df_assets: pd.DataFrame,
        df_defects: Optional[pd.DataFrame] = None,
        df_history: Optional[pd.DataFrame] = None,
        reference_date: Optional[dt.date] = None,
    ) -> pd.DataFrame:
        """Join assets with defects and maintenance history to build feature table."""
        if reference_date is None:
            reference_date = dt.date(2026, 3, 1)

        df = df_assets.copy()

        # 1. Defect aggregations per asset
        if df_defects is not None and not df_defects.empty:
            open_defects = df_defects[df_defects["status"].isin(["OPEN", "IN_PROGRESS"])].copy()
            defect_aggs = open_defects.groupby("asset_id").agg(
                defect_count=("defect_id", "count"),
                max_defect_severity=("severity", "max"),
                total_overdue_days=("overdue_days", "sum"),
            ).reset_index()
            df = df.merge(defect_aggs, on="asset_id", how="left")
        else:
            if "defect_count" not in df.columns:
                df["defect_count"] = 0
            if "max_defect_severity" not in df.columns:
                df["max_defect_severity"] = 0
            if "total_overdue_days" not in df.columns:
                df["total_overdue_days"] = 0

        df["defect_count"] = df["defect_count"].fillna(0).astype(int)
        df["max_defect_severity"] = df["max_defect_severity"].fillna(0).astype(int)
        df["total_overdue_days"] = df["total_overdue_days"].fillna(0).astype(int)

        # 2. Maintenance History aggregations per asset
        if df_history is not None and not df_history.empty:
            hist_aggs = df_history.groupby("asset_id").agg(
                historical_failures_count=("history_id", "count"),
            ).reset_index()
            df = df.merge(hist_aggs, on="asset_id", how="left")
        else:
            if "historical_failures_count" not in df.columns:
                df["historical_failures_count"] = 0

        df["historical_failures_count"] = df["historical_failures_count"].fillna(0).astype(int)

        # 3. Days since last maintenance
        if "last_maintenance_date" in df.columns:
            maint_dates = pd.to_datetime(df["last_maintenance_date"], errors="coerce")
            ref_ts = pd.to_datetime(reference_date)
            df["days_since_maintenance"] = (ref_ts - maint_dates).dt.days.fillna(180).clip(lower=0)
        else:
            df["days_since_maintenance"] = 180


        # Ensure base columns exist as Series
        if "condition_score" not in df.columns:
            df["condition_score"] = 75.0
        df["condition_score"] = pd.to_numeric(df["condition_score"], errors="coerce").fillna(75.0)

        if "age_years" not in df.columns:
            df["age_years"] = 5.0
        df["age_years"] = pd.to_numeric(df["age_years"], errors="coerce").fillna(5.0)

        if "traffic_load" not in df.columns:
            df["traffic_load"] = 35.0
        df["traffic_load"] = pd.to_numeric(df["traffic_load"], errors="coerce").fillna(35.0)

        if "criticality" not in df.columns:
            df["criticality"] = 3
        df["criticality"] = pd.to_numeric(df["criticality"], errors="coerce").fillna(3).astype(int)

        if "department" not in df.columns:
            df["department"] = "ENGINEERING"
        df["department"] = df["department"].astype(str).str.upper()

        return df


def build_preprocessing_pipeline() -> ColumnTransformer:
    """Build Scikit-Learn ColumnTransformer for numerical scaling and one-hot encoding."""
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
            ("num", num_pipeline, NUMERICAL_FEATURES),
            ("cat", cat_pipeline, CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )

    return preprocessor
