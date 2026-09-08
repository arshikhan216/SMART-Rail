"""Unit and statistical tests for Chunk 3: Synthetic Data Generator."""

import pytest
import numpy as np
import pandas as pd
from src.data_pipeline.synthetic_generator import SyntheticDataGenerator
from src.data_pipeline.integration import IntegratedDataPipeline


def test_seed_reproducibility():
    gen1 = SyntheticDataGenerator(seed=123)
    data1 = gen1.generate_all(num_assets=50, horizon_days=3)

    gen2 = SyntheticDataGenerator(seed=123)
    data2 = gen2.generate_all(num_assets=50, horizon_days=3)

    pd.testing.assert_frame_equal(data1["assets"], data2["assets"])
    pd.testing.assert_frame_equal(data1["defects"], data2["defects"])
    pd.testing.assert_frame_equal(data1["maintenance_tasks"], data2["maintenance_tasks"])


def test_domain_correlations():
    gen = SyntheticDataGenerator(seed=42)
    data = gen.generate_all(num_assets=200, horizon_days=7)

    df_assets = data["assets"]
    # Correlation between age and condition score should be strongly negative
    corr_age_cond = df_assets["age_years"].corr(df_assets["condition_score"])
    assert corr_age_cond < -0.3, f"Expected negative correlation between age and condition, got {corr_age_cond}"

    df_tasks = data["maintenance_tasks"]
    # Correlation between severity and urgency should be strongly positive
    corr_sev_urg = df_tasks["severity"].corr(df_tasks["urgency"])
    assert corr_sev_urg > 0.5, f"Expected positive correlation between severity and urgency, got {corr_sev_urg}"


def test_pipeline_integration_with_generated_data():
    gen = SyntheticDataGenerator(seed=42)
    raw_data = gen.generate_all(num_assets=100, horizon_days=7)

    pipeline = IntegratedDataPipeline()
    store, report = pipeline.process(raw_data, strict_validation=True)

    assert report.is_valid
    assert report.total_errors == 0
    assert len(store.assets) == 100
    assert len(store.defects) > 0
    assert len(store.maintenance_tasks) > 0
    assert len(store.trains) > 0
    assert len(store.train_movements) > 0
    assert len(store.block_windows) > 0
    assert len(store.resources) > 0
