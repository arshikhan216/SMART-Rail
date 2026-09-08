"""Training, cross-validation, evaluation, and serialization for Asset Risk ML Model."""

from __future__ import annotations
import datetime as dt
import json
import logging
from pathlib import Path
from typing import Dict, Any, Tuple
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    precision_score,
    recall_score,
    f1_score,
    brier_score_loss,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split, StratifiedKFold

from src.config import CONFIG
from src.risk_engine.feature_engineering import (
    AssetRiskFeatureExtractor,
    build_preprocessing_pipeline,
    FEATURE_COLUMNS,
    NUMERICAL_FEATURES,
    CATEGORICAL_FEATURES,
)

logger = logging.getLogger(__name__)

DISCLAIMER_TEXT = (
    "This model is a prototype trained/evaluated on synthetic or proxy data and must be "
    "retrained and validated using authorized operational railway data before real-world deployment."
)


def generate_risk_labels(df_features: pd.DataFrame) -> pd.Series:
    """Generate target binary label: 1 = high failure/deterioration risk, 0 = low/moderate risk."""
    is_critical_cond = df_features["condition_score"] < 50.0
    is_severe_defect = df_features["max_defect_severity"] >= 4
    is_long_overdue = df_features["total_overdue_days"] >= 10
    is_aging_high_traffic = (df_features["age_years"] > 18.0) & (df_features["traffic_load"] > 60.0)

    y = (is_critical_cond | is_severe_defect | is_long_overdue | is_aging_high_traffic).astype(int)
    return y


class AssetRiskModelTrainer:
    """Trains and benchmarks baseline and ensemble models for asset failure risk prediction."""

    def __init__(self, random_seed: int = 42):
        self.random_seed = random_seed

    def train_and_evaluate(
        self,
        df_assets: pd.DataFrame,
        df_defects: Optional[pd.DataFrame] = None,
        df_history: Optional[pd.DataFrame] = None,
        models_dir: str = "models/asset_risk",
    ) -> Dict[str, Any]:
        """End-to-end training, benchmarking, metric computation, and artifact serialization."""
        logger.info("Extracting features for asset risk modeling...")
        df_features = AssetRiskFeatureExtractor.extract_features(df_assets, df_defects, df_history)
        y = generate_risk_labels(df_features)

        positive_rate = float(y.mean())
        logger.info(f"Dataset shape: {df_features.shape}, High-Risk Positive Class Rate: {positive_rate:.2%}")

        # Train / Test split (Stratified 80/20)
        X_train, X_test, y_train, y_test = train_test_split(
            df_features[FEATURE_COLUMNS],
            y,
            test_size=0.20,
            random_state=self.random_seed,
            stratify=y,
        )

        # Preprocessing Pipeline
        preprocessor = build_preprocessing_pipeline()
        X_train_trans = preprocessor.fit_transform(X_train)
        X_test_trans = preprocessor.transform(X_test)

        # 1. Baseline Model: Logistic Regression
        lr_model = LogisticRegression(class_weight="balanced", random_state=self.random_seed, max_iter=1000)
        lr_model.fit(X_train_trans, y_train)
        lr_metrics = self._evaluate_model(lr_model, X_test_trans, y_test, model_name="LogisticRegression (Baseline)")

        # 2. Champion Model: Random Forest Classifier
        rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            min_samples_split=4,
            class_weight="balanced",
            random_state=self.random_seed,
        )
        rf_model.fit(X_train_trans, y_train)
        rf_metrics = self._evaluate_model(rf_model, X_test_trans, y_test, model_name="RandomForestClassifier (Ensemble)")

        # Compare models (Select based on ROC-AUC / PR-AUC)
        selected_model = rf_model if rf_metrics["roc_auc"] >= lr_metrics["roc_auc"] else lr_model
        selected_metrics = rf_metrics if selected_model == rf_model else lr_metrics
        model_name = "RandomForestClassifier" if selected_model == rf_model else "LogisticRegression"

        # Feature Importance
        feature_importance_df = self._compute_feature_importance(selected_model, preprocessor)

        # Save artifacts
        out_dir = Path(models_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        joblib.dump(selected_model, out_dir / "model.joblib")
        joblib.dump(preprocessor, out_dir / "pipeline.joblib")

        feature_importance_df.to_csv(out_dir / "feature_importance.csv", index=False)

        metadata = {
            "model_name": model_name,
            "model_version": "1.0.0",
            "training_date": dt.datetime.now().isoformat(),
            "random_seed": self.random_seed,
            "disclaimer": DISCLAIMER_TEXT,
            "features": FEATURE_COLUMNS,
            "dataset_samples": len(df_features),
            "positive_class_ratio": positive_rate,
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

        logger.info(f"Model saved to {out_dir}. Champion: {model_name} (ROC-AUC: {selected_metrics['roc_auc']:.4f})")
        return metadata

    def _evaluate_model(self, model: Any, X_test: np.ndarray, y_test: pd.Series, model_name: str) -> Dict[str, Any]:
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]

        roc_auc = float(roc_auc_score(y_test, y_prob))
        pr_auc = float(average_precision_score(y_test, y_prob))
        precision = float(precision_score(y_test, y_pred, zero_division=0))
        recall = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        brier = float(brier_score_loss(y_test, y_prob))
        cm = confusion_matrix(y_test, y_pred).tolist()

        logger.info(
            f"[{model_name}] ROC-AUC: {roc_auc:.4f}, PR-AUC: {pr_auc:.4f}, "
            f"F1: {f1:.4f}, Recall: {recall:.4f}, Brier Score: {brier:.4f}"
        )

        return {
            "model_name": model_name,
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "brier_score": round(brier, 4),
            "confusion_matrix": cm,
        }

    def _compute_feature_importance(self, model: Any, preprocessor: ColumnTransformer) -> pd.DataFrame:
        cat_encoder = preprocessor.named_transformers_["cat"].named_steps["encoder"]
        cat_feature_names = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
        all_feature_names = NUMERICAL_FEATURES + cat_feature_names

        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
        elif hasattr(model, "coef_"):
            importances = np.abs(model.coef_[0])
        else:
            importances = np.ones(len(all_feature_names))

        df_fi = pd.DataFrame({
            "feature": all_feature_names,
            "importance": importances,
        }).sort_values(by="importance", ascending=False)

        return df_fi
