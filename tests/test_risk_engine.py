"""Unit and integration tests for Chunk 4: Asset Risk ML Model."""

import tempfile
from pathlib import Path
import pytest
import pandas as pd
import numpy as np

from src.risk_engine.feature_engineering import (
    AssetRiskFeatureExtractor,
    build_preprocessing_pipeline,
    FEATURE_COLUMNS,
)
from src.risk_engine.train import AssetRiskModelTrainer, generate_risk_labels
from src.risk_engine.predict import AssetRiskPredictor, classify_risk_level
from src.schemas import RiskLevel
from src.data_pipeline.synthetic_generator import SyntheticDataGenerator


@pytest.fixture
def synthetic_risk_data():
    gen = SyntheticDataGenerator(seed=42)
    return gen.generate_all(num_assets=150, horizon_days=7)


def test_feature_extraction(synthetic_risk_data):
    df_assets = synthetic_risk_data["assets"]
    df_defects = synthetic_risk_data["defects"]
    df_history = synthetic_risk_data["maintenance_history"]

    features_df = AssetRiskFeatureExtractor.extract_features(df_assets, df_defects, df_history)

    assert len(features_df) == len(df_assets)
    for col in FEATURE_COLUMNS:
        assert col in features_df.columns, f"Missing feature: {col}"


def test_label_generation(synthetic_risk_data):
    df_assets = synthetic_risk_data["assets"]
    df_defects = synthetic_risk_data["defects"]
    features_df = AssetRiskFeatureExtractor.extract_features(df_assets, df_defects)

    y = generate_risk_labels(features_df)
    assert len(y) == len(df_assets)
    assert set(y.unique()).issubset({0, 1})
    assert y.sum() > 0, "Expected at least some positive high-risk samples"


def test_model_training_and_serialization(synthetic_risk_data):
    with tempfile.TemporaryDirectory() as tmp_dir:
        trainer = AssetRiskModelTrainer(random_seed=42)
        meta = trainer.train_and_evaluate(
            df_assets=synthetic_risk_data["assets"],
            df_defects=synthetic_risk_data["defects"],
            df_history=synthetic_risk_data["maintenance_history"],
            models_dir=tmp_dir,
        )

        assert (Path(tmp_dir) / "model.joblib").exists()
        assert (Path(tmp_dir) / "pipeline.joblib").exists()
        assert (Path(tmp_dir) / "metadata.json").exists()
        assert (Path(tmp_dir) / "feature_importance.csv").exists()

        assert meta["metrics"]["champion"]["roc_auc"] >= 0.70
        assert meta["metrics"]["champion"]["pr_auc"] >= 0.50

        # Test predictor using the saved temporary artifacts
        predictor = AssetRiskPredictor(model_dir=tmp_dir)
        scored_assets = predictor.predict_assets(
            df_assets=synthetic_risk_data["assets"],
            df_defects=synthetic_risk_data["defects"],
        )

        assert "risk_probability" in scored_assets.columns
        assert "risk_level" in scored_assets.columns
        assert scored_assets["risk_probability"].between(0.0, 1.0).all()


def test_risk_predictor_sensitivity(synthetic_risk_data):
    with tempfile.TemporaryDirectory() as tmp_dir:
        trainer = AssetRiskModelTrainer(random_seed=42)
        trainer.train_and_evaluate(
            df_assets=synthetic_risk_data["assets"],
            df_defects=synthetic_risk_data["defects"],
            df_history=synthetic_risk_data["maintenance_history"],
            models_dir=tmp_dir,
        )

        predictor = AssetRiskPredictor(model_dir=tmp_dir)

        # High risk asset profile
        high_risk_asset = {
            "asset_id": "AST-TEST-HIGH",
            "asset_type": "TrackSegment",
            "department": "ENGINEERING",
            "section_id": "SEC-01",
            "location": "KM-10/1",
            "criticality": 5,
            "installation_date": "2005-01-01",
            "age_years": 21.0,
            "condition_score": 32.0,  # Critical condition
            "traffic_load": 85.0,
            "last_maintenance_date": "2023-01-01",
        }

        # Low risk asset profile
        low_risk_asset = {
            "asset_id": "AST-TEST-LOW",
            "asset_type": "TrackSegment",
            "department": "ENGINEERING",
            "section_id": "SEC-01",
            "location": "KM-10/2",
            "criticality": 2,
            "installation_date": "2024-01-01",
            "age_years": 1.0,
            "condition_score": 96.0,  # Pristine condition
            "traffic_load": 20.0,
            "last_maintenance_date": "2026-02-01",
        }

        scored_high = predictor.predict_single(high_risk_asset)
        scored_low = predictor.predict_single(low_risk_asset)

        assert scored_high["risk_probability"] > scored_low["risk_probability"]
        assert scored_high["risk_level"] in [RiskLevel.HIGH.value, RiskLevel.VERY_HIGH.value, RiskLevel.CRITICAL.value]
