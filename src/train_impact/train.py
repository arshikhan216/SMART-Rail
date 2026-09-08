"""Training and evaluation pipeline for optional Train Delay Regression Model."""

from __future__ import annotations
import datetime as dt
import json
import logging
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from src.train_impact.feature_engineering import (
    TrainDelayFeatureExtractor,
    build_delay_preprocessing_pipeline,
    DELAY_FEATURE_COLUMNS,
)

logger = logging.getLogger(__name__)

DISCLAIMER_TEXT = (
    "This train delay model is an advisory proxy trained on synthetic/historical simulation data. "
    "It acts as a soft penalty in the optimizer and must never override deterministic railway safety constraints."
)


def generate_simulated_delay_targets(df_features: pd.DataFrame, rng: Optional[np.random.Generator] = None) -> pd.Series:
    """Simulate realistic train delay minutes based on physical corridor congestion and overlap."""
    if rng is None:
        rng = np.random.default_rng(42)

    # Physical delay formula: base overlap duration + priority friction + weather delay + noise
    overlap = df_features["overlap_minutes"].values
    block_dur = df_features["block_duration_hours"].values
    priority = df_features["train_priority"].values
    rain = df_features["rainfall_mm"].values

    # Higher priority passenger trains get regulated / looped faster, but higher secondary ripple
    base_delay = overlap * 0.85 + (block_dur * 4.0) + (priority * 2.5) + (rain * 0.6)
    noise = rng.normal(0, 3.0, size=len(df_features))

    delay = np.clip(base_delay + noise, 5.0, 180.0)
    return pd.Series(np.round(delay, 1), name="delay_minutes")


class TrainDelayModelTrainer:
    """Trains and benchmarks regression models for train delay estimation."""

    def __init__(self, random_seed: int = 42):
        self.random_seed = random_seed
        self.rng = np.random.default_rng(random_seed)

    def train_and_evaluate(
        self,
        conflicting_movements_df: pd.DataFrame,
        weather_df: Optional[pd.DataFrame] = None,
        sections_df: Optional[pd.DataFrame] = None,
        models_dir: str = "models/train_impact",
    ) -> Dict[str, Any]:
        """Train baseline LinearRegression and champion RandomForestRegressor models."""
        logger.info("Extracting features for train delay regression modeling...")
        df_features = TrainDelayFeatureExtractor.extract_features(
            conflicting_movements_df, weather_df, sections_df
        )

        y = generate_simulated_delay_targets(df_features, self.rng)

        # Train / Test Split
        X_train, X_test, y_train, y_test = train_test_split(
            df_features[DELAY_FEATURE_COLUMNS],
            y,
            test_size=0.20,
            random_state=self.random_seed,
        )

        preprocessor = build_delay_preprocessing_pipeline()
        X_train_trans = preprocessor.fit_transform(X_train)
        X_test_trans = preprocessor.transform(X_test)

        # 1. Baseline Model: Linear Regression
        lr_model = LinearRegression()
        lr_model.fit(X_train_trans, y_train)
        lr_metrics = self._evaluate_model(lr_model, X_test_trans, y_test, "LinearRegression (Baseline)")

        # 2. Champion Model: Random Forest Regressor
        rf_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=6,
            min_samples_split=4,
            random_state=self.random_seed,
        )
        rf_model.fit(X_train_trans, y_train)
        rf_metrics = self._evaluate_model(rf_model, X_test_trans, y_test, "RandomForestRegressor (Ensemble)")

        selected_model = rf_model if rf_metrics["mae"] <= lr_metrics["mae"] else lr_model
        selected_metrics = rf_metrics if selected_model == rf_model else lr_metrics
        model_name = "RandomForestRegressor" if selected_model == rf_model else "LinearRegression"

        out_dir = Path(models_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        joblib.dump(selected_model, out_dir / "model.joblib")
        joblib.dump(preprocessor, out_dir / "pipeline.joblib")

        metadata = {
            "model_name": model_name,
            "model_version": "1.0.0",
            "training_date": dt.datetime.now().isoformat(),
            "random_seed": self.random_seed,
            "disclaimer": DISCLAIMER_TEXT,
            "features": DELAY_FEATURE_COLUMNS,
            "dataset_samples": len(df_features),
            "hyperparameters": selected_model.get_params(),
            "metrics": {
                "champion": rf_metrics,
                "baseline": lr_metrics,
            },
        }

        with open(out_dir / "metadata.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        with open(out_dir / "metrics.json", "w", encoding="utf-8") as f:
            json.dump(selected_metrics, f, indent=2)

        logger.info(f"Train delay model saved to {out_dir}. Champion: {model_name} (MAE: {selected_metrics['mae']:.2f} mins)")
        return metadata

    def _evaluate_model(self, model: Any, X_test: np.ndarray, y_test: pd.Series, model_name: str) -> Dict[str, Any]:
        y_pred = model.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))

        logger.info(f"[{model_name}] MAE: {mae:.2f} mins, RMSE: {rmse:.2f} mins, R2: {r2:.4f}")

        return {
            "model_name": model_name,
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "r2_score": round(r2, 4),
        }
