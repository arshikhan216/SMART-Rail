"""Inference engine for Train Delay prediction."""

from __future__ import annotations
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Union, Any
import joblib
import numpy as np
import pandas as pd

from src.exceptions import ModelInferenceError
from src.train_impact.feature_engineering import (
    TrainDelayFeatureExtractor,
    DELAY_FEATURE_COLUMNS,
)

logger = logging.getLogger(__name__)


class TrainDelayPredictor:
    """Loads trained regression artifacts and predicts expected delay minutes."""

    def __init__(self, model_dir: Union[str, Path] = "models/train_impact"):
        self.model_dir = Path(model_dir)
        self.model = None
        self.preprocessor = None
        self.metadata = {}
        self._load_model()

    def _load_model(self):
        model_path = self.model_dir / "model.joblib"
        pipeline_path = self.model_dir / "pipeline.joblib"
        metadata_path = self.model_dir / "metadata.json"

        if not model_path.exists() or not pipeline_path.exists():
            raise ModelInferenceError(
                f"Train delay model artifacts not found at {self.model_dir}. Please run training first."
            )

        try:
            self.model = joblib.load(model_path)
            self.preprocessor = joblib.load(pipeline_path)
            if metadata_path.exists():
                with open(metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            logger.info(f"Loaded train delay model from {self.model_dir} (Version: {self.metadata.get('model_version', 'unknown')})")
        except Exception as e:
            raise ModelInferenceError(f"Failed to load train delay model artifacts: {e}") from e

    def predict_delays(
        self,
        conflicting_movements_df: pd.DataFrame,
        weather_df: Optional[pd.DataFrame] = None,
        sections_df: Optional[pd.DataFrame] = None,
    ) -> pd.DataFrame:
        """Predict expected delay minutes for a DataFrame of conflicting train movements."""
        if self.model is None or self.preprocessor is None:
            raise ModelInferenceError("Model not initialized.")

        try:
            df_features = TrainDelayFeatureExtractor.extract_features(
                conflicting_movements_df, weather_df, sections_df
            )
            X_trans = self.preprocessor.transform(df_features[DELAY_FEATURE_COLUMNS])

            predictions = self.model.predict(X_trans)

            results = conflicting_movements_df.copy()
            results["expected_delay_minutes"] = np.round(np.clip(predictions, 0.0, 360.0), 1)

            return results
        except Exception as e:
            raise ModelInferenceError(f"Error during train delay inference: {e}") from e

    def predict_single(self, movement_dict: Dict[str, Any]) -> float:
        """Predict expected delay in minutes for a single movement dictionary."""
        df_single = pd.DataFrame([movement_dict])
        scored = self.predict_delays(df_single)
        return float(scored["expected_delay_minutes"].iloc[0])
