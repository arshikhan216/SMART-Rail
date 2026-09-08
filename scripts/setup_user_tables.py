"""Script to write the user's maintenance tasks (TSK-00001 to TSK-01000) and block windows (BLK-00001 to BLK-00180)."""

from pathlib import Path
import pandas as pd

out_dir = Path("data/rkmp_bpl")
out_dir.mkdir(parents=True, exist_ok=True)
print("Directory data/rkmp_bpl is ready.")
