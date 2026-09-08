import os
import subprocess
import sys
from pathlib import Path
from sqlalchemy import create_engine, inspect, text


def test_fresh_migration_seed_and_idempotence(tmp_path):
    backend = Path(__file__).resolve().parents[1]
    database = tmp_path / "migration.db"
    credentials = tmp_path / "credentials.txt"
    env = {**os.environ, "DATABASE_URL": f"sqlite:///{database.as_posix()}", "POSTGRES_PASSWORD_FILE": "", "DEMO_PASSWORD": "", "DEMO_CREDENTIALS_PATH": str(credentials), "USE_HF_MODEL": "false"}
    for args in (("alembic", "upgrade", "head"), ("app.seed",), ("app.seed",)):
        subprocess.run([sys.executable, "-m", *args], cwd=backend, env=env, check=True, capture_output=True, timeout=45)
    engine = create_engine(env["DATABASE_URL"])
    with engine.connect() as conn:
        assert len(inspect(conn).get_table_names()) == 22  # 21 domain tables plus Alembic
        for table, count in {"users": 3, "patient_cases": 10, "therapies": 6, "analysis_runs": 10, "clinician_reviews": 2}.items():
            assert conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar() == count
    assert credentials.exists()
    engine.dispose()
