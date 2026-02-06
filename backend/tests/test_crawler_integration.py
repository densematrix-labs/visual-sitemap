"""Integration tests for the crawler that mock Playwright."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.crawler import SitemapCrawler
from app.schemas.sitemap import CrawlStatus


class TestCrawlerIntegration:
    """Tests for the full crawl process with mocked Playwright."""

    @pytest.mark.anyio
    async def test_crawl_success(self):
        """Test successful crawl with mocked Playwright."""
        with patch('app.services.crawler.async_playwright') as mock_playwright:
            # Set up mock browser and page
            mock_page = AsyncMock()
            mock_page.title = AsyncMock(return_value="Test Page")
            mock_page.goto = AsyncMock(return_value=MagicMock(status=200))
            mock_page.query_selector_all = AsyncMock(return_value=[])
            
            mock_context = AsyncMock()
            mock_context.new_page = AsyncMock(return_value=mock_page)
            
            mock_browser = AsyncMock()
            mock_browser.new_context = AsyncMock(return_value=mock_context)
            
            mock_chromium = MagicMock()
            mock_chromium.launch = AsyncMock(return_value=mock_browser)
            
            mock_pw_instance = MagicMock()
            mock_pw_instance.chromium = mock_chromium
            
            mock_playwright.return_value.__aenter__ = AsyncMock(return_value=mock_pw_instance)
            mock_playwright.return_value.__aexit__ = AsyncMock(return_value=None)
            
            crawler = SitemapCrawler(max_pages=5, max_depth=1)
            result = await crawler.crawl("https://example.com")
            
            assert result.status == CrawlStatus.COMPLETED
            assert result.total_pages >= 1
            assert result.root_url == "https://example.com"
            assert result.crawl_time_seconds >= 0

    @pytest.mark.anyio
    async def test_crawl_with_links(self):
        """Test crawl that finds and follows links."""
        with patch('app.services.crawler.async_playwright') as mock_playwright:
            # Create mock anchor elements with hrefs
            mock_link1 = AsyncMock()
            mock_link1.get_attribute = AsyncMock(return_value="/about")
            
            mock_link2 = AsyncMock()
            mock_link2.get_attribute = AsyncMock(return_value="/contact")
            
            mock_link3 = AsyncMock()
            mock_link3.get_attribute = AsyncMock(return_value="https://external.com")  # External link
            
            call_count = [0]
            
            async def mock_query_selector_all(selector):
                call_count[0] += 1
                if call_count[0] == 1:
                    return [mock_link1, mock_link2, mock_link3]
                return []
            
            mock_page = AsyncMock()
            mock_page.title = AsyncMock(return_value="Test Page")
            mock_page.goto = AsyncMock(return_value=MagicMock(status=200))
            mock_page.query_selector_all = mock_query_selector_all
            
            mock_context = AsyncMock()
            mock_context.new_page = AsyncMock(return_value=mock_page)
            
            mock_browser = AsyncMock()
            mock_browser.new_context = AsyncMock(return_value=mock_context)
            
            mock_chromium = MagicMock()
            mock_chromium.launch = AsyncMock(return_value=mock_browser)
            
            mock_pw_instance = MagicMock()
            mock_pw_instance.chromium = mock_chromium
            
            mock_playwright.return_value.__aenter__ = AsyncMock(return_value=mock_pw_instance)
            mock_playwright.return_value.__aexit__ = AsyncMock(return_value=None)
            
            crawler = SitemapCrawler(max_pages=10, max_depth=2)
            result = await crawler.crawl("https://example.com")
            
            assert result.status == CrawlStatus.COMPLETED
            # Should have crawled root + /about + /contact (external is ignored)
            assert result.total_pages == 3
            assert result.total_links >= 1

    @pytest.mark.anyio
    async def test_crawl_respects_max_pages(self):
        """Test that crawl respects max_pages limit."""
        with patch('app.services.crawler.async_playwright') as mock_playwright:
            # Create many mock links
            mock_links = []
            for i in range(10):
                link = AsyncMock()
                link.get_attribute = AsyncMock(return_value=f"/page{i}")
                mock_links.append(link)
            
            mock_page = AsyncMock()
            mock_page.title = AsyncMock(return_value="Test Page")
            mock_page.goto = AsyncMock(return_value=MagicMock(status=200))
            mock_page.query_selector_all = AsyncMock(return_value=mock_links)
            
            mock_context = AsyncMock()
            mock_context.new_page = AsyncMock(return_value=mock_page)
            
            mock_browser = AsyncMock()
            mock_browser.new_context = AsyncMock(return_value=mock_context)
            
            mock_chromium = MagicMock()
            mock_chromium.launch = AsyncMock(return_value=mock_browser)
            
            mock_pw_instance = MagicMock()
            mock_pw_instance.chromium = mock_chromium
            
            mock_playwright.return_value.__aenter__ = AsyncMock(return_value=mock_pw_instance)
            mock_playwright.return_value.__aexit__ = AsyncMock(return_value=None)
            
            crawler = SitemapCrawler(max_pages=3, max_depth=5)
            result = await crawler.crawl("https://example.com")
            
            assert result.status == CrawlStatus.COMPLETED
            assert result.total_pages <= 3

    @pytest.mark.anyio
    async def test_crawl_page_error(self):
        """Test crawl handles page errors gracefully."""
        with patch('app.services.crawler.async_playwright') as mock_playwright:
            mock_page = AsyncMock()
            mock_page.title = AsyncMock(return_value="Test Page")
            mock_page.goto = AsyncMock(return_value=MagicMock(status=404))  # 404 error
            mock_page.query_selector_all = AsyncMock(return_value=[])
            
            mock_context = AsyncMock()
            mock_context.new_page = AsyncMock(return_value=mock_page)
            
            mock_browser = AsyncMock()
            mock_browser.new_context = AsyncMock(return_value=mock_context)
            
            mock_chromium = MagicMock()
            mock_chromium.launch = AsyncMock(return_value=mock_browser)
            
            mock_pw_instance = MagicMock()
            mock_pw_instance.chromium = mock_chromium
            
            mock_playwright.return_value.__aenter__ = AsyncMock(return_value=mock_pw_instance)
            mock_playwright.return_value.__aexit__ = AsyncMock(return_value=None)
            
            crawler = SitemapCrawler()
            result = await crawler.crawl("https://example.com")
            
            # Should complete but with 0 pages (404 pages are skipped)
            assert result.status == CrawlStatus.COMPLETED
            assert result.total_pages == 0

    @pytest.mark.anyio
    async def test_crawl_timeout(self):
        """Test crawl handles timeout gracefully."""
        from playwright.async_api import TimeoutError as PlaywrightTimeout
        
        with patch('app.services.crawler.async_playwright') as mock_playwright:
            mock_page = AsyncMock()
            mock_page.goto = AsyncMock(side_effect=PlaywrightTimeout("Timeout"))
            
            mock_context = AsyncMock()
            mock_context.new_page = AsyncMock(return_value=mock_page)
            
            mock_browser = AsyncMock()
            mock_browser.new_context = AsyncMock(return_value=mock_context)
            
            mock_chromium = MagicMock()
            mock_chromium.launch = AsyncMock(return_value=mock_browser)
            
            mock_pw_instance = MagicMock()
            mock_pw_instance.chromium = mock_chromium
            
            mock_playwright.return_value.__aenter__ = AsyncMock(return_value=mock_pw_instance)
            mock_playwright.return_value.__aexit__ = AsyncMock(return_value=None)
            
            crawler = SitemapCrawler()
            result = await crawler.crawl("https://example.com")
            
            assert result.status == CrawlStatus.COMPLETED
            assert result.total_pages == 0  # Timeout pages are skipped

    @pytest.mark.anyio
    async def test_crawl_browser_crash(self):
        """Test crawl handles browser crash gracefully."""
        with patch('app.services.crawler.async_playwright') as mock_playwright:
            mock_chromium = MagicMock()
            mock_chromium.launch = AsyncMock(side_effect=Exception("Browser crash"))
            
            mock_pw_instance = MagicMock()
            mock_pw_instance.chromium = mock_chromium
            
            mock_playwright.return_value.__aenter__ = AsyncMock(return_value=mock_pw_instance)
            mock_playwright.return_value.__aexit__ = AsyncMock(return_value=None)
            
            crawler = SitemapCrawler()
            result = await crawler.crawl("https://example.com")
            
            assert result.status == CrawlStatus.FAILED
            assert result.error is not None
            assert "Browser crash" in result.error

    @pytest.mark.anyio
    async def test_extract_links_error(self):
        """Test that extract_links handles errors gracefully."""
        with patch('app.services.crawler.async_playwright') as mock_playwright:
            mock_page = AsyncMock()
            mock_page.title = AsyncMock(return_value="Test Page")
            mock_page.goto = AsyncMock(return_value=MagicMock(status=200))
            mock_page.query_selector_all = AsyncMock(side_effect=Exception("Query failed"))
            
            mock_context = AsyncMock()
            mock_context.new_page = AsyncMock(return_value=mock_page)
            
            mock_browser = AsyncMock()
            mock_browser.new_context = AsyncMock(return_value=mock_context)
            
            mock_chromium = MagicMock()
            mock_chromium.launch = AsyncMock(return_value=mock_browser)
            
            mock_pw_instance = MagicMock()
            mock_pw_instance.chromium = mock_chromium
            
            mock_playwright.return_value.__aenter__ = AsyncMock(return_value=mock_pw_instance)
            mock_playwright.return_value.__aexit__ = AsyncMock(return_value=None)
            
            crawler = SitemapCrawler()
            result = await crawler.crawl("https://example.com")
            
            # Should still complete, just with no links
            assert result.status == CrawlStatus.COMPLETED
            assert result.total_pages == 1
            assert result.total_links == 0
