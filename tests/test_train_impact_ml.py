"""Unit tests for Chunk 8: Train Delay Regression ML Model."""

import tempfile
from pathlib import Path
import pytest
import pandas as pd
import numpy as np

from src.train_impact.feature_engineering import (
    TrainDelayFeatureExtractor,
    DELAY_FEATURE_COLUMNS,
)
from src.train_impact.train import TrainDelayModelTrainer
from src.train_impact.predict import TrainDelayPredictor


@pytest.fixture
def sample_conflicts_df():
    return pd.DataFrame([
        {
            "movement_id": "MOV-001",
            "train_id": "TRN-12951",
            "train_type": "PREMIUM_PASSENGER",
            "train_priority": 1,
            "section_id": "SEC-01",
            "arrival_time": "2026-03-05T06:30:00",
            "departure_time": "2026-03-05T07:15:00",
            "overlap_minutes": 45.0,
            "block_duration_hours": 3.5,
            "direction": "UP",
        },
        {
            "movement_id": "MOV-002",
            "train_id": "TRN-9001",
            "train_type": "FREIGHT",
            "train_priority": 4,
            "section_id": "SEC-01",
            "arrival_time": "2026-03-05T02:00:00",
            "departure_time": "2026-03-05T02:30:00",
            "overlap_minutes": 30.0,
            "block_duration_hours": 2.5,
            "direction": "DOWN",
        }
    ])


def test_delay_feature_extractor(sample_conflicts_df):
    extracted = TrainDelayFeatureExtractor.extract_features(sample_conflicts_df)
    for col in DELAY_FEATURE_COLUMNS:
        assert col in extracted.columns, f"Missing feature: {col}"


def test_delay_trainer_and_predictor(sample_conflicts_df):
    # Expand dataframe for small test training
    expanded_df = pd.concat([sample_conflicts_df] * 30, ignore_index=True)

    with tempfile.TemporaryDirectory() as tmp_dir:
        trainer = TrainDelayModelTrainer(random_seed=42)
        meta = trainer.train_and_evaluate(
            conflicting_movements_df=expanded_df,
            models_dir=tmp_dir,
        )

        assert (Path(tmp_dir) / "model.joblib").exists()
        assert (Path(tmp_dir) / "pipeline.joblib").exists()
        assert (Path(tmp_dir) / "metadata.json").exists()

        assert meta["metrics"]["champion"]["mae"] <= 10.0

        predictor = TrainDelayPredictor(model_dir=tmp_dir)
        pred_df = predictor.predict_delays(sample_conflicts_df)

        assert "expected_delay_minutes" in pred_df.columns
        assert (pred_df["expected_delay_minutes"] > 0).all()

        single_delay = predictor.predict_single(sample_conflicts_df.iloc[0].to_dict())
        assert single_delay > 0.0
