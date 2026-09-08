from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "sqlite:///./demo.db"
    postgres_password_file: str = ""
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    cookie_secure: bool = False
    use_hf_model: bool = False
    hf_model_id: str = ""
    hf_token: str = ""
    hf_device: str = "cpu"
    demo_password: str = ""
    evidence_threshold: float = Field(default=0.65, ge=0, le=1, allow_inf_nan=False)
    evidence_max_age_days: int = Field(default=365, ge=1, le=3650)
    session_hours: int = Field(default=8, ge=1, le=24)


@lru_cache
def settings() -> Settings:
    return Settings()
