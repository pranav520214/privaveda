from pathlib import Path
from sqlalchemy import create_engine, event, URL
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import settings


class Base(DeclarativeBase):
    pass


database_url = settings().database_url
if settings().postgres_password_file:
    database_url = URL.create("postgresql+psycopg", username="pmai", password=Path(settings().postgres_password_file).read_text().strip(), host="db", database="pmai")
is_sqlite = str(database_url).startswith("sqlite")
engine = create_engine(database_url, connect_args={"check_same_thread": False} if is_sqlite else {}, pool_pre_ping=True)
if is_sqlite:
    @event.listens_for(engine, "connect")
    def sqlite_foreign_keys(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")

SessionLocal = sessionmaker(engine, expire_on_commit=False)


def get_db():
    with SessionLocal() as db:
        yield db
