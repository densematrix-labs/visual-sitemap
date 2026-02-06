import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_root(client: AsyncClient):
    """Test root endpoint."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "version" in data


@pytest.mark.anyio
async def test_health(client: AsyncClient):
    """Test health endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


@pytest.mark.anyio
async def test_crawl_sync_valid_url(client: AsyncClient, mock_crawler):
    """Test sync crawl with valid URL."""
    response = await client.post(
        "/api/v1/sitemap/crawl/sync",
        json={"url": "https://example.com", "max_depth": 2, "max_pages": 50}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["total_pages"] == 3
    assert data["total_links"] == 2
    assert len(data["nodes"]) == 3
    assert len(data["links"]) == 2


@pytest.mark.anyio
async def test_crawl_sync_invalid_url(client: AsyncClient):
    """Test sync crawl with invalid URL."""
    response = await client.post(
        "/api/v1/sitemap/crawl/sync",
        json={"url": "not-a-valid-url"}
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_crawl_sync_missing_url(client: AsyncClient):
    """Test sync crawl without URL."""
    response = await client.post(
        "/api/v1/sitemap/crawl/sync",
        json={}
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_crawl_sync_invalid_depth(client: AsyncClient):
    """Test sync crawl with invalid depth."""
    response = await client.post(
        "/api/v1/sitemap/crawl/sync",
        json={"url": "https://example.com", "max_depth": 10}
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_crawl_sync_invalid_max_pages(client: AsyncClient):
    """Test sync crawl with invalid max_pages."""
    response = await client.post(
        "/api/v1/sitemap/crawl/sync",
        json={"url": "https://example.com", "max_pages": 1000}
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_crawl_async_start(client: AsyncClient, mock_crawler):
    """Test async crawl start."""
    response = await client.post(
        "/api/v1/sitemap/crawl",
        json={"url": "https://example.com"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "crawl_id" in data
    assert data["status"] == "started"


@pytest.mark.anyio
async def test_crawl_progress_not_found(client: AsyncClient):
    """Test progress for non-existent crawl."""
    response = await client.get("/api/v1/sitemap/crawl/nonexistent/progress")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_crawl_result_not_found(client: AsyncClient):
    """Test result for non-existent crawl."""
    response = await client.get("/api/v1/sitemap/crawl/nonexistent/result")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_delete_crawl_not_found(client: AsyncClient):
    """Test delete for non-existent crawl."""
    response = await client.delete("/api/v1/sitemap/crawl/nonexistent")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_crawl_async_flow(client: AsyncClient, mock_crawler, mock_sitemap_result):
    """Test the complete async crawl flow."""
    from app.api.v1 import sitemap
    
    # Start crawl
    response = await client.post(
        "/api/v1/sitemap/crawl",
        json={"url": "https://example.com"}
    )
    assert response.status_code == 200
    data = response.json()
    crawl_id = data["crawl_id"]
    
    # Simulate completed crawl by adding to completed_crawls
    sitemap.completed_crawls[crawl_id] = mock_sitemap_result
    
    # Get progress for completed crawl
    response = await client.get(f"/api/v1/sitemap/crawl/{crawl_id}/progress")
    assert response.status_code == 200
    progress = response.json()
    assert progress["status"] == "completed"
    assert progress["progress_percent"] == 100.0
    
    # Get result
    response = await client.get(f"/api/v1/sitemap/crawl/{crawl_id}/result")
    assert response.status_code == 200
    result = response.json()
    assert result["total_pages"] == 3
    
    # Delete crawl
    response = await client.delete(f"/api/v1/sitemap/crawl/{crawl_id}")
    assert response.status_code == 200
    assert response.json()["status"] == "deleted"
    
    # Verify deleted
    response = await client.get(f"/api/v1/sitemap/crawl/{crawl_id}/result")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_crawl_result_in_progress(client: AsyncClient):
    """Test getting result when crawl is still in progress."""
    from app.api.v1 import sitemap
    from app.services.crawler import SitemapCrawler
    
    # Directly add a crawler to active_crawls
    crawl_id = "inprogress123"
    sitemap.active_crawls[crawl_id] = SitemapCrawler()
    
    # Get result should return 202
    response = await client.get(f"/api/v1/sitemap/crawl/{crawl_id}/result")
    assert response.status_code == 202
    
    # Cleanup
    del sitemap.active_crawls[crawl_id]


@pytest.mark.anyio
async def test_crawl_progress_active(client: AsyncClient, mock_crawler):
    """Test getting progress for active crawl."""
    from app.api.v1 import sitemap
    from app.services.crawler import SitemapCrawler
    
    # Create a crawler and add to active
    crawler = SitemapCrawler()
    crawl_id = "test123"
    sitemap.active_crawls[crawl_id] = crawler
    
    # Get progress
    response = await client.get(f"/api/v1/sitemap/crawl/{crawl_id}/progress")
    assert response.status_code == 200
    progress = response.json()
    assert progress["status"] == "pending"
    assert progress["pages_crawled"] == 0
    
    # Cleanup
    del sitemap.active_crawls[crawl_id]
