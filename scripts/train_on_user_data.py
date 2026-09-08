"""Ingest and partition the user-provided RKMP-BPL dataset, generate companion tables, and train ML models."""

from __future__ import annotations
import datetime as dt
import io
from pathlib import Path
import sys
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.risk_engine.train import AssetRiskModelTrainer
from src.train_impact.train import TrainDelayModelTrainer
from src.risk_engine.registry import ModelRegistry


def process_user_data_and_train():
    data_dir = Path("data/rkmp_bpl")
    data_dir.mkdir(parents=True, exist_ok=True)

    # Let's inspect what assets, tasks, blocks, and movements we have
    df_tasks = pd.read_csv(data_dir / "maintenance_tasks.csv")
    df_blocks = pd.read_csv(data_dir / "block_windows.csv")
    df_assets = pd.read_csv(data_dir / "assets.csv")
    df_movements = pd.read_csv(data_dir / "train_movements.csv")

    print(f"Loaded {len(df_assets)} assets, {len(df_tasks)} tasks, {len(df_blocks)} blocks, {len(df_movements)} movements.")

    # 1. Generate Trains Master from train_movements
    unique_train_ids = df_movements["train_id"].unique()
    train_types = ["PREMIUM_PASSENGER", "EXPRESS_PASSENGER", "ORDINARY_PASSENGER", "FREIGHT"]
    trains_list = []
    for tid in unique_train_ids:
        tnum = str(tid).replace("TRN-", "")
        # Vande Bharat / Shatabdi numbers or express
        if tnum in ["12001", "12002", "20171", "20172", "20173", "20174"]:
            ttype = "PREMIUM_PASSENGER"
            prio = 1
        elif tnum.startswith("12") or tnum.startswith("22"):
            ttype = "EXPRESS_PASSENGER"
            prio = 2
        elif tnum.startswith("FRT") or "BOXN" in tnum or "CONCOR" in tnum:
            ttype = "FREIGHT"
            prio = 4
        else:
            ttype = "ORDINARY_PASSENGER"
            prio = 3

        trains_list.append({
            "train_id": str(tid),
            "train_number": tnum,
            "train_type": ttype,
            "priority": prio,
            "source": "RKMP" if prio <= 2 else "NDLS",
            "destination": "BPL" if prio <= 2 else "HWH",
        })
    df_trains = pd.DataFrame(trains_list)
    df_trains.to_csv(data_dir / "trains.csv", index=False)

    # 2. Generate Linked Defects for Maintenance Tasks
    defects_list = []
    for idx, row in df_tasks.iterrows():
        defects_list.append({
            "defect_id": f"DEF-{row['task_id']}",
            "asset_id": row["asset_id"],
            "section_id": row["section_id"],
            "defect_type": f"{row['work_type']}Defect",
            "severity": int(row.get("severity", 3) if pd.notna(row.get("severity")) else 3),
            "urgency": int(row.get("urgency", 3) if pd.notna(row.get("urgency")) else 3),
            "detected_date": (pd.to_datetime(row["deadline"]) - dt.timedelta(days=7)).strftime("%Y-%m-%d"),
            "overdue_days": 2 if row.get("is_safety_critical", False) else 0,
            "status": "OPEN",
            "location": "KM-RKMP-BPL",
        })
    df_defects = pd.DataFrame(defects_list)
    df_defects.to_csv(data_dir / "defects.csv", index=False)

    # 3. Generate Maintenance History for Training
    history_list = []
    rng = np.random.default_rng(42)
    for idx, row in df_assets.iterrows():
        num_past_maints = int(rng.integers(1, 6))
        for m in range(num_past_maints):
            days_ago = int(rng.integers(30, 700))
            comp_dt = dt.date(2026, 3, 1) - dt.timedelta(days=days_ago)
            fail_days = int(rng.integers(30, 365))
            history_list.append({
                "history_id": f"HIST-{row['asset_id']}-{m+1:02d}",
                "asset_id": row["asset_id"],
                "section_id": row["section_id"],
                "department": row["department"],
                "maintenance_type": "PeriodicInspection",
                "completed_date": comp_dt.isoformat(),
                "duration_hours": float(rng.choice([1.5, 2.0, 3.0, 4.0])),
                "cost": float(rng.integers(15000, 95000)),
                "failure_occurred_after_days": fail_days,
            })
    df_history = pd.DataFrame(history_list)
    df_history.to_csv(data_dir / "maintenance_history.csv", index=False)

    # 4. Resources
    resources_list = [
        {"resource_id": "RES-BPL-ENG-CREW-01", "department": "ENGINEERING", "resource_type": "CREW", "resource_name": "Habibganj P-Way Gang 04",
         "capacity": 30, "available_from": "2026-09-01T00:00:00", "available_until": "2026-12-31T23:59:00", "section_id": "SEC-RKMP-BPL"},
        {"resource_id": "RES-BPL-SNT-CREW-01", "department": "S_AND_T", "resource_type": "CREW", "resource_name": "Bhopal Jn S&T Gang",
         "capacity": 25, "available_from": "2026-09-01T00:00:00", "available_until": "2026-12-31T23:59:00", "section_id": "SEC-RKMP-BPL"},
        {"resource_id": "RES-BPL-TRA-CREW-01", "department": "TRACTION", "resource_type": "CREW", "resource_name": "TRD OHE Maintenance Gang",
         "capacity": 25, "available_from": "2026-09-01T00:00:00", "available_until": "2026-12-31T23:59:00", "section_id": "SEC-RKMP-BPL"},
        {"resource_id": "RES-MACH-DUOMATIC-01", "department": "ENGINEERING", "resource_type": "MACHINE", "resource_name": "DuomaticTampingMachine",
         "capacity": 1, "available_from": "2026-09-01T00:00:00", "available_until": "2026-12-31T23:59:00", "section_id": "SEC-RKMP-BPL"},
        {"resource_id": "RES-MACH-GRINDER-01", "department": "ENGINEERING", "resource_type": "MACHINE", "resource_name": "RailGrindingMachine",
         "capacity": 1, "available_from": "2026-09-01T00:00:00", "available_until": "2026-12-31T23:59:00", "section_id": "SEC-RKMP-BPL"},
        {"resource_id": "RES-MACH-BCM-01", "department": "ENGINEERING", "resource_type": "MACHINE", "resource_name": "BallastCleaningMachine",
         "capacity": 1, "available_from": "2026-09-01T00:00:00", "available_until": "2026-12-31T23:59:00", "section_id": "SEC-RKMP-BPL"},
        {"resource_id": "RES-MACH-TRT-01", "department": "ENGINEERING", "resource_type": "MACHINE", "resource_name": "TrackRelayingTrain",
         "capacity": 1, "available_from": "2026-09-01T00:00:00", "available_until": "2026-12-31T23:59:00", "section_id": "SEC-RKMP-BPL"},
        {"resource_id": "RES-MACH-WELD-01", "department": "ENGINEERING", "resource_type": "MACHINE", "resource_name": "MobileFlashButtWeldingPlant",
         "capacity": 1, "available_from": "2026-09-01T00:00:00", "available_until": "2026-12-31T23:59:00", "section_id": "SEC-RKMP-BPL"},
        {"resource_id": "RES-MACH-TOWERWAGON-01", "department": "TRACTION", "resource_type": "MACHINE", "resource_name": "TowerWagon",
         "capacity": 2, "available_from": "2026-09-01T00:00:00", "available_until": "2026-12-31T23:59:00", "section_id": "SEC-RKMP-BPL"},
        {"resource_id": "RES-MACH-CABLEVAN-01", "department": "S_AND_T", "resource_type": "MACHINE", "resource_name": "CableTestingVan",
         "capacity": 1, "available_from": "2026-09-01T00:00:00", "available_until": "2026-12-31T23:59:00", "section_id": "SEC-RKMP-BPL"},
        {"resource_id": "RES-MACH-SIGKIT-01", "department": "S_AND_T", "resource_type": "MACHINE", "resource_name": "SignalTestingKit",
         "capacity": 2, "available_from": "2026-09-01T00:00:00", "available_until": "2026-12-31T23:59:00", "section_id": "SEC-RKMP-BPL"},
    ]
    pd.DataFrame(resources_list).to_csv(data_dir / "resources.csv", index=False)

    print("All dataset tables generated & harmonized!")

    # 5. Train Asset Risk Machine Learning Model
    print("\n--- Training Asset Risk Prediction Model on User Dataset ---")
    risk_trainer = AssetRiskModelTrainer()
    risk_metrics = risk_trainer.train_and_evaluate(
        df_assets=df_assets,
        df_defects=df_defects,
        df_history=df_history,
        output_dir="models/asset_risk",
    )
    print(f"Asset Risk Model Trained: ROC-AUC = {risk_metrics.get('roc_auc', 'N/A')}, F1 = {risk_metrics.get('f1_score', 'N/A')}")

    # Register in Model Registry
    registry = ModelRegistry()
    registry.register_model(
        model_name="asset_risk_model",
        version="1.1.0",
        artifact_path="models/asset_risk",
        metrics=risk_metrics,
        tags={"dataset": "RKMP-BPL-1000Tasks", "author": "User Ingestion"},
    )
    registry.promote_to_production("asset_risk_model", "1.1.0")

    # 6. Train Train Delay Prediction Machine Learning Model
    print("\n--- Training Train Delay Prediction Model on User Dataset ---")
    delay_trainer = TrainDelayModelTrainer()
    delay_metrics = delay_trainer.train_and_evaluate(
        df_movements=df_movements,
        df_trains=df_trains,
        df_blocks=df_blocks,
        output_dir="models/train_delay",
    )
    print(f"Train Delay Model Trained: RMSE = {delay_metrics.get('rmse', 'N/A')}, R2 = {delay_metrics.get('r2_score', 'N/A')}")

    print("\n>>> ALL MODELS SUCCESSFULLY RETRAINED ON USER DATASET <<<")


if __name__ == "__main__":
    process_user_data_and_train()
