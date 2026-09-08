"""CLI script to train and persist all ML models (Asset Risk & Train Impact)."""

import argparse
import logging
import sys
from pathlib import Path
import pandas as pd

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.config import CONFIG
from src.data_pipeline.loaders import CSVDataSource
from src.data_pipeline.integration import IntegratedDataPipeline
from src.risk_engine.train import AssetRiskModelTrainer
from src.train_impact.train import TrainDelayModelTrainer
from src.train_impact.conflict_detector import TrainConflictDetector

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Train and evaluate AI Rail Block Planner ML models.")
    parser.add_argument("--data-dir", type=str, default="data/raw", help="Directory containing raw/synthetic CSV data")
    parser.add_argument("--models-dir", type=str, default="models", help="Target directory for model artifacts")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")

    args = parser.parse_args()
    data_path = Path(args.data_dir)
    models_path = Path(args.models_dir)

    loader = CSVDataSource()

    logger.info(f"Loading and integrating datasets from {data_path}...")
    tables = {
        "assets": loader.read(data_path / "assets.csv"),
        "defects": loader.read(data_path / "defects.csv") if (data_path / "defects.csv").exists() else None,
        "maintenance_tasks": loader.read(data_path / "maintenance_tasks.csv") if (data_path / "maintenance_tasks.csv").exists() else None,
        "trains": loader.read(data_path / "trains.csv") if (data_path / "trains.csv").exists() else None,
        "train_movements": loader.read(data_path / "train_movements.csv") if (data_path / "train_movements.csv").exists() else None,
        "block_windows": loader.read(data_path / "block_windows.csv") if (data_path / "block_windows.csv").exists() else None,
        "resources": loader.read(data_path / "resources.csv") if (data_path / "resources.csv").exists() else None,
        "maintenance_history": loader.read(data_path / "maintenance_history.csv") if (data_path / "maintenance_history.csv").exists() else None,
    }

    pipeline = IntegratedDataPipeline()
    store, report = pipeline.process(tables, strict_validation=True)
    logger.info(f"Dataset integration verified: {report.total_records_checked} records checked.")

    weather_df = loader.read(data_path / "weather.csv") if (data_path / "weather.csv").exists() else None
    sections_df = loader.read(data_path / "sections.csv") if (data_path / "sections.csv").exists() else None

    # 1. Train Asset Risk Model
    logger.info("=== 1. Training Asset Risk Model ===")
    risk_trainer = AssetRiskModelTrainer(random_seed=args.seed)
    risk_meta = risk_trainer.train_and_evaluate(
        df_assets=store.tables["assets"],
        df_defects=store.tables.get("defects"),
        df_history=store.tables.get("maintenance_history"),
        models_dir=str(models_path / "asset_risk"),
    )
    logger.info(f"Asset Risk Champion Model: {risk_meta['model_name']} (ROC-AUC: {risk_meta['metrics']['champion']['roc_auc']})")

    # 2. Train Train Delay Model (using conflicting movement instances)
    logger.info("=== 2. Training Train Delay Regression Model ===")
    detector = TrainConflictDetector()
    conflict_reports = detector.analyze_all_blocks(store.block_windows, store.train_movements, store.trains)

    all_conflicts = []
    for blk_id, rep in conflict_reports.items():
        for m in rep.movements:
            all_conflicts.append({
                "movement_id": m.movement_id,
                "train_id": m.train_id,
                "train_type": m.train_type,
                "train_priority": m.priority,
                "section_id": rep.section_id,
                "arrival_time": m.arrival_time,
                "departure_time": m.departure_time,
                "overlap_minutes": m.overlap_duration_minutes,
                "block_duration_hours": rep.duration_hours,
                "direction": m.direction,
            })

    conflicts_df = pd.DataFrame(all_conflicts)
    if len(conflicts_df) < 50:
        sample_movs = store.tables["train_movements"].sample(n=min(len(store.tables["train_movements"]), 100), random_state=args.seed).copy()
        sample_movs["overlap_minutes"] = 30.0
        sample_movs["block_duration_hours"] = 3.5
        conflicts_df = pd.concat([conflicts_df, sample_movs], ignore_index=True)

    delay_trainer = TrainDelayModelTrainer(random_seed=args.seed)
    delay_meta = delay_trainer.train_and_evaluate(
        conflicting_movements_df=conflicts_df,
        weather_df=weather_df,
        sections_df=sections_df,
        models_dir=str(models_path / "train_impact"),
    )
    logger.info(f"Train Delay Champion Model: {delay_meta['model_name']} (MAE: {delay_meta['metrics']['champion']['mae']} mins, R2: {delay_meta['metrics']['champion']['r2_score']})")

    logger.info("All ML Model training workflows completed successfully.")


if __name__ == "__main__":
    main()
