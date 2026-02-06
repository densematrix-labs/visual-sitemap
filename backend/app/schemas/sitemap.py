from pydantic import BaseModel, HttpUrl, Field
from typing import Optional
from enum import Enum


class CrawlStatus(str, Enum):
    PENDING = "pending"
    CRAWLING = "crawling"
    COMPLETED = "completed"
    FAILED = "failed"


class CrawlRequest(BaseModel):
    """Request to start a sitemap crawl."""
    url: HttpUrl = Field(..., description="Target website URL to crawl")
    max_depth: int = Field(default=3, ge=1, le=5, description="Maximum crawl depth")
    max_pages: int = Field(default=100, ge=1, le=500, description="Maximum pages to crawl")


class PageNode(BaseModel):
    """A single page node in the sitemap."""
    id: str = Field(..., description="Unique node ID (URL hash)")
    url: str = Field(..., description="Full page URL")
    title: Optional[str] = Field(None, description="Page title")
    depth: int = Field(..., description="Crawl depth from root")
    outgoing_links: int = Field(default=0, description="Number of outgoing links")
    incoming_links: int = Field(default=0, description="Number of incoming links")


class PageLink(BaseModel):
    """A link between two pages."""
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")


class SitemapResult(BaseModel):
    """Complete sitemap result with nodes and links."""
    status: CrawlStatus
    root_url: str
    total_pages: int
    total_links: int
    nodes: list[PageNode]
    links: list[PageLink]
    crawl_time_seconds: float
    error: Optional[str] = None


class CrawlProgress(BaseModel):
    """Progress update during crawl."""
    status: CrawlStatus
    pages_crawled: int
    pages_queued: int
    current_url: Optional[str] = None
    progress_percent: float
