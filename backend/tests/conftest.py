import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch

from app.main import app
from app.schemas.sitemap import PageNode, PageLink, SitemapResult, CrawlStatus


@pytest.fixture
def anyio_backend():
    return 'asyncio'


@pytest.fixture
async def client():
    """Async test client."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_sitemap_result():
    """Sample sitemap result for testing."""
    return SitemapResult(
        status=CrawlStatus.COMPLETED,
        root_url="https://example.com",
        total_pages=3,
        total_links=2,
        nodes=[
            PageNode(
                id="abc123",
                url="https://example.com",
                title="Example Home",
                depth=0,
                outgoing_links=2,
                incoming_links=0
            ),
            PageNode(
                id="def456",
                url="https://example.com/about",
                title="About Us",
                depth=1,
                outgoing_links=1,
                incoming_links=1
            ),
            PageNode(
                id="ghi789",
                url="https://example.com/contact",
                title="Contact",
                depth=1,
                outgoing_links=0,
                incoming_links=1
            ),
        ],
        links=[
            PageLink(source="abc123", target="def456"),
            PageLink(source="abc123", target="ghi789"),
        ],
        crawl_time_seconds=1.5
    )


@pytest.fixture
def mock_crawler(mock_sitemap_result):
    """Mock crawler that returns a predefined result."""
    async def mock_crawl(*args, **kwargs):
        return mock_sitemap_result
    
    with patch('app.api.v1.sitemap.SitemapCrawler') as MockCrawler:
        instance = MockCrawler.return_value
        instance.crawl = AsyncMock(side_effect=mock_crawl)
        instance.get_progress = lambda: {
            "status": "completed",
            "pages_crawled": 3,
            "pages_queued": 0,
            "current_url": None,
            "progress_percent": 100.0
        }
        yield MockCrawler
