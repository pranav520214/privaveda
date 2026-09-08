from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.core.auth import current_user, password_hasher, token_hash
from app.main import app
from app.models import AuthSession, User


def enable_login(api):
    client, _, users, factory = api
    secret = "synthetic-test-password-only-42"
    with factory() as db:
        db.get(User, users["CLINICIAN"].id).password_hash = password_hasher.hash(secret)
        db.commit()
    app.dependency_overrides.pop(current_user)
    return client, factory, {"username": "clinician@test.local", "password": secret}


def test_real_login_hashed_sessions_and_logout(api):
    client, factory, body = enable_login(api)
    assert client.get("/api/v1/cases").status_code == 401
    assert client.post("/api/v1/auth/login", json={**body, "password": "wrong"}).status_code == 401
    response = client.post("/api/v1/auth/login", json=body)
    assert response.status_code == 200
    assert "password_hash" not in response.json()
    assert "HttpOnly" in response.headers["set-cookie"]
    assert "SameSite=strict" in response.headers["set-cookie"]
    token = client.cookies.get("pmai_session")
    with factory() as db:
        session = db.scalar(select(AuthSession))
        assert session.token_hash == token_hash(token)
        assert session.token_hash != token
    assert client.get("/api/v1/auth/me").status_code == 200
    assert client.post("/api/v1/auth/logout").status_code == 200
    assert client.get("/api/v1/cases").status_code == 401


def test_expired_session_and_login_rate_limit(api):
    client, factory, body = enable_login(api)
    assert client.post("/api/v1/auth/login", json=body).status_code == 200
    with factory() as db:
        db.scalar(select(AuthSession)).expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        db.commit()
    assert client.get("/api/v1/auth/me").status_code == 401
    for _ in range(14):
        assert client.post("/api/v1/auth/login", json={**body, "password": "wrong"}).status_code == 401
    response = client.post("/api/v1/auth/login", json=body)
    assert response.status_code == 429
    assert response.headers["retry-after"] == "60"
