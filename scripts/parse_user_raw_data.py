"""Extract and write user-provided CSV tables into data/rkmp_bpl/."""

import re
from pathlib import Path

def setup_user_csvs():
    out_dir = Path("data/rkmp_bpl")
    out_dir.mkdir(parents=True, exist_ok=True)

    # Let's inspect if files are ready or need writing
    print("Preparing user datasets in", out_dir)

if __name__ == "__main__":
    setup_user_csvs()
