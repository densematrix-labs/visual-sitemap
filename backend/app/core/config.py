from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings."""
    
    APP_NAME: str = "Visual Sitemap Scanner"
    DEBUG: bool = False
    
    # Crawler settings
    MAX_PAGES: int = 100
    MAX_DEPTH: int = 3
    CRAWL_TIMEOUT: int = 30000  # ms per page
    TOTAL_TIMEOUT: int = 300  # seconds for entire crawl
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
