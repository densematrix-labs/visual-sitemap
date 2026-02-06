from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
import json


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
    
    # Creem Payment
    CREEM_API_KEY: str = ""
    CREEM_WEBHOOK_SECRET: str = ""
    CREEM_PRODUCT_IDS: dict = {}
    
    # Product pricing for Visual Sitemap
    PRODUCTS: dict = {
        "pack_5": {"price": 499, "generations": 5},      # $4.99 - 5 scans
        "pack_20": {"price": 1499, "generations": 20},   # $14.99 - 20 scans
    }
    
    @field_validator("CREEM_PRODUCT_IDS", mode="before")
    @classmethod
    def parse_creem_product_ids(cls, v):
        if isinstance(v, str) and v:
            return json.loads(v)
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
