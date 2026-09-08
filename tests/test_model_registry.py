"""Unit tests for the Model Versioning and Artifact Registry Engine."""

from pathlib import Path
import pytest
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

from src.exceptions import ModelInferenceError
from src.risk_engine.registry import ModelRegistry, ModelVersionMetadata


def test_model_registration_and_retrieval(tmp_path: Path):
    registry = ModelRegistry(registry_root=tmp_path / "test_models")

    # 1. Create dummy model & pipeline
    model = RandomForestClassifier(n_estimators=5, random_state=42)
    scaler = StandardScaler()

    # 2. Register version 1.0.0
    meta1 = registry.register_model(
        model_name="AssetRiskModel",
        version="1.0.0",
        model_obj=model,
        pipeline_obj=scaler,
        algorithm="RandomForestClassifier",
        metrics={"roc_auc": 0.985, "pr_auc": 0.942},
        feature_names=["condition_score", "age_years"],
        hyperparameters={"n_estimators": 5},
        description="Initial baseline model",
        set_as_active=True,
    )

    assert meta1.model_id == "AssetRiskModel_v1.0.0"
    assert meta1.is_active is True
    assert "model.joblib" in meta1.artifact_checksums

    # 3. Retrieve champion
    loaded_model, loaded_scaler, loaded_meta = registry.get_model("AssetRiskModel")
    assert loaded_meta.version == "1.0.0"
    assert loaded_meta.is_active is True
    assert registry.verify_integrity("AssetRiskModel", "1.0.0") is True


def test_model_promotion_and_rollback(tmp_path: Path):
    registry = ModelRegistry(registry_root=tmp_path / "test_models")
    model = RandomForestClassifier(n_estimators=5, random_state=42)
    scaler = StandardScaler()

    # Register v1.0.0
    registry.register_model(
        model_name="AssetRiskModel",
        version="1.0.0",
        model_obj=model,
        pipeline_obj=scaler,
        algorithm="RandomForestClassifier",
        metrics={"roc_auc": 0.95},
        feature_names=["condition_score"],
        hyperparameters={"n_estimators": 5},
        set_as_active=True,
    )

    # Register v2.0.0
    registry.register_model(
        model_name="AssetRiskModel",
        version="2.0.0",
        model_obj=model,
        pipeline_obj=scaler,
        algorithm="RandomForestClassifier",
        metrics={"roc_auc": 0.99},
        feature_names=["condition_score"],
        hyperparameters={"n_estimators": 10},
        set_as_active=True,
    )

    # Active should now be v2.0.0
    _, _, active_meta = registry.get_model("AssetRiskModel")
    assert active_meta.version == "2.0.0"

    # Rollback to v1.0.0
    success = registry.rollback_model("AssetRiskModel", "1.0.0")
    assert success is True

    _, _, rolled_back_meta = registry.get_model("AssetRiskModel")
    assert rolled_back_meta.version == "1.0.0"


def test_integrity_check_failure_on_tampering(tmp_path: Path):
    registry = ModelRegistry(registry_root=tmp_path / "test_models")
    model = RandomForestClassifier(n_estimators=5, random_state=42)
    scaler = StandardScaler()

    meta = registry.register_model(
        model_name="AssetRiskModel",
        version="1.0.0",
        model_obj=model,
        pipeline_obj=scaler,
        algorithm="RandomForestClassifier",
        metrics={"roc_auc": 0.95},
        feature_names=["condition_score"],
        hyperparameters={},
        set_as_active=True,
    )

    # Tamper with file
    model_file = Path(meta.artifact_paths["model.joblib"])
    with open(model_file, "ab") as f:
        f.write(b"TAMPERED_BYTES")

    # Integrity verification must fail
    assert registry.verify_integrity("AssetRiskModel", "1.0.0") is False

    with pytest.raises(ModelInferenceError):
        registry.get_model("AssetRiskModel", "1.0.0")
