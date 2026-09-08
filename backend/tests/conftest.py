"""Isolated synthetic test fixtures; never connect to the demonstration database."""
import json
import os
import sys
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["USE_HF_MODEL"] = "false"
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.db import Base, get_db
from app.core.auth import current_user
from app.main import app, buckets
from app.models import User, Therapy


@pytest.fixture
def cases():
    return json.loads((ROOT / "data/demo_cases/cases.json").read_text(encoding="utf-8"))


@pytest.fixture
def library():
    rows = json.loads((ROOT / "data/demo_therapy_library/therapies.json").read_text(encoding="utf-8"))
    return [{"id": str(i), "name": row["name"], "data": row} for i, row in enumerate(rows)]


@pytest.fixture
def config():
    return {"evidence_threshold": .65, "evidence_max_age_days": 365, "uncertainty_threshold": .8}


@pytest.fixture
def api(library):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    with factory() as db:
        users = {}
        for role in ("CLINICIAN", "ADMIN", "RESEARCHER"):
            user = User(username=role.lower() + "@test.local", password_hash="not-a-login-fixture", role=role)
            db.add(user)
            db.flush()
            users[role] = user
        for row in library:
            db.add(Therapy(name=row["name"], data=row["data"], validation_status=row["data"]["validation_status"]))
        db.commit()
    actor = {"user": users["CLINICIAN"]}

    def isolated_db():
        with factory() as session:
            yield session

    app.dependency_overrides[get_db] = isolated_db
    app.dependency_overrides[current_user] = lambda: actor["user"]
    buckets.clear()
    with TestClient(app) as client:
        yield client, actor, users, factory
    app.dependency_overrides.clear()
    engine.dispose()
