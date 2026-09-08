import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import Depends, HTTPException, Request
from pwdlib import PasswordHash
from sqlalchemy import select
from app.core.db import get_db
from app.core.config import settings
from app.models import User, AuthSession

password_hasher = PasswordHash.recommended()
DUMMY_HASH = password_hasher.hash(secrets.token_urlsafe(32))


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def current_user(request: Request, db=Depends(get_db)) -> User:
    token = request.cookies.get("pmai_session", "")
    session = db.scalar(select(AuthSession).where(AuthSession.token_hash == token_hash(token))) if token else None
    if not session or session.expires_at.replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc):
        raise HTTPException(401, "Sign in to continue")
    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(401, "Session is invalid")
    return user


def roles(*allowed):
    def check(user=Depends(current_user)):
        if user.role not in allowed:
            raise HTTPException(403, "Your role cannot perform this action")
        return user
    return check


def create_session(db, user):
    token = secrets.token_urlsafe(48)
    db.add(AuthSession(user_id=user.id, token_hash=token_hash(token), expires_at=datetime.now(timezone.utc) + timedelta(hours=settings().session_hours)))
    return token
