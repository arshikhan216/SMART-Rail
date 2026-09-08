"""Inference and Explanation engine for Asset Risk prediction."""

from __future__ import annotations
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Union, Any
import joblib
import numpy as np
import pandas as pd

from src.exceptions import ModelInferenceError
from src.schemas import RiskLevel
from src.risk_engine.feature_engineering import (
    AssetRiskFeatureExtractor,
    FEATURE_COLUMNS,
)
from src.risk_engine.explain import RiskExplainer, RiskExplanation

logger = logging.getLogger(__name__)


def classify_risk_level(prob: float) -> RiskLevel:
    """Map continuous risk probability to discrete operational RiskLevel."""
    if prob >= 0.85:
        return RiskLevel.CRITICAL
    elif prob >= 0.70:
        return RiskLevel.VERY_HIGH
    elif prob >= 0.50:
        return RiskLevel.HIGH
    elif prob >= 0.25:
        return RiskLevel.MODERATE
    else:
        return RiskLevel.LOW


class AssetRiskPredictor:
    """Loads trained artifacts and executes real-time/batch risk scoring and explanation."""

    def __init__(self, model_dir: Union[str, Path] = "models/asset_risk"):
        self.model_dir = Path(model_dir)
        self.model = None
        self.preprocessor = None
        self.metadata = {}
        self.explainer = RiskExplainer()
        self._load_model()

    def _load_model(self):
        model_path = self.model_dir / "model.joblib"
        pipeline_path = self.model_dir / "pipeline.joblib"
        metadata_path = self.model_dir / "metadata.json"

        if not model_path.exists() or not pipeline_path.exists():
            raise ModelInferenceError(
                f"Asset risk model artifacts not found at {self.model_dir}. Please run training first."
            )

        try:
            self.model = joblib.load(model_path)
            self.preprocessor = joblib.load(pipeline_path)
            if metadata_path.exists():
                with open(metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            logger.info(f"Loaded asset risk model from {self.model_dir} (Version: {self.metadata.get('model_version', 'unknown')})")
        except Exception as e:
            raise ModelInferenceError(f"Failed to load risk model artifacts: {e}") from e

    def predict_assets(
        self,
        df_assets: pd.DataFrame,
        df_defects: Optional[pd.DataFrame] = None,
        df_history: Optional[pd.DataFrame] = None,
        include_explanations: bool = False,
    ) -> pd.DataFrame:
        """Score assets and append risk_probability, risk_level, and optional explanations."""
        if self.model is None or self.preprocessor is None:
            raise ModelInferenceError("Model not initialized.")

        try:
            df_features = AssetRiskFeatureExtractor.extract_features(df_assets, df_defects, df_history)
            X_trans = self.preprocessor.transform(df_features[FEATURE_COLUMNS])

            probabilities = self.model.predict_proba(X_trans)[:, 1]

            results = df_assets.copy()
            results["risk_probability"] = [round(float(p), 4) for p in probabilities]
            results["risk_level"] = [classify_risk_level(p).value for p in probabilities]

            if include_explanations:
                explanations = []
                for _, row in df_features.iterrows():
                    p = float(results.loc[results["asset_id"] == row["asset_id"], "risk_probability"].values[0])
                    lvl = str(results.loc[results["asset_id"] == row["asset_id"], "risk_level"].values[0])
                    exp = self.explainer.explain_asset(row.to_dict(), p, lvl)
                    explanations.append("; ".join(exp.top_contributing_factors))
                results["explanation"] = explanations

            return results
        except Exception as e:
            raise ModelInferenceError(f"Error during asset risk inference: {e}") from e

    def predict_single(self, asset_dict: Union[Dict[str, Any], Any]) -> Dict[str, Any]:
        """Score a single asset record."""
        raw_dict = asset_dict if isinstance(asset_dict, dict) else (
            asset_dict.model_dump() if hasattr(asset_dict, "model_dump") else asset_dict.__dict__
        )
        df_single = pd.DataFrame([raw_dict])
        scored_df = self.predict_assets(df_single, include_explanations=True)
        return scored_df.iloc[0].to_dict()

    def explain_asset(self, asset_dict: Union[Dict[str, Any], Any]) -> RiskExplanation:
        """Score and generate complete structured explanation for a single asset."""
        raw_dict = asset_dict if isinstance(asset_dict, dict) else (
            asset_dict.model_dump() if hasattr(asset_dict, "model_dump") else asset_dict.__dict__
        )
        scored = self.predict_single(raw_dict)
        return self.explainer.explain_asset(
            asset_record=raw_dict,
            risk_probability=scored["risk_probability"],
            risk_level=scored["risk_level"],
        )

