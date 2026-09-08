"""CLI script to generate realistic domain-correlated railway datasets."""

import argparse
import logging
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.config import CONFIG
from src.data_pipeline.synthetic_generator import SyntheticDataGenerator
from src.data_pipeline.integration import IntegratedDataPipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic railway maintenance planning datasets.")
    parser.add_argument("--assets", type=int, default=300, help="Number of infrastructure assets to generate")
    parser.add_argument("--horizon", type=int, default=14, help="Planning horizon in days")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--out-dir", type=str, default="data/synthetic", help="Output directory for generated CSVs")
    parser.add_argument("--copy-to-raw", action="store_true", default=True, help="Also copy generated data to data/raw/")

    args = parser.parse_args()

    generator = SyntheticDataGenerator(seed=args.seed)
    datasets = generator.generate_all(num_assets=args.assets, horizon_days=args.horizon)

    out_path = Path(args.out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    # Save to synthetic directory
    for name, df in datasets.items():
        file_path = out_path / f"{name}.csv"
        df.to_csv(file_path, index=False)
        logger.info(f"Wrote {len(df)} records to {file_path}")

    # Optionally copy to data/raw
    if args.copy_to_raw:
        raw_path = Path(CONFIG.paths.raw_data_dir)
        raw_path.mkdir(parents=True, exist_ok=True)
        for name, df in datasets.items():
            df.to_csv(raw_path / f"{name}.csv", index=False)
        logger.info(f"Copied all datasets to raw data directory: {raw_path}")

    # Validate through end-to-end integration pipeline
    pipeline = IntegratedDataPipeline()
    store, report = pipeline.process(datasets, strict_validation=True)
    logger.info(f"Validation successful! {report.total_records_checked} records checked, 0 errors.")


if __name__ == "__main__":
    main()
