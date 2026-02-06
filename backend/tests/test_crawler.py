import pytest
from app.services.crawler import (
    url_to_id,
    normalize_url,
    is_same_domain,
    is_valid_page_url,
    SitemapCrawler
)
from app.schemas.sitemap import CrawlStatus


class TestUrlHelpers:
    """Tests for URL helper functions."""
    
    def test_url_to_id_consistent(self):
        """Same URL should always produce same ID."""
        url = "https://example.com/page"
        id1 = url_to_id(url)
        id2 = url_to_id(url)
        assert id1 == id2
        assert len(id1) == 12
    
    def test_url_to_id_different(self):
        """Different URLs should produce different IDs."""
        id1 = url_to_id("https://example.com/page1")
        id2 = url_to_id("https://example.com/page2")
        assert id1 != id2
    
    def test_normalize_url_removes_fragment(self):
        """Fragment should be removed."""
        url = "https://example.com/page#section"
        normalized = normalize_url(url)
        assert normalized == "https://example.com/page"
    
    def test_normalize_url_removes_trailing_slash(self):
        """Trailing slash should be removed."""
        url = "https://example.com/page/"
        normalized = normalize_url(url)
        assert normalized == "https://example.com/page"
    
    def test_normalize_url_keeps_query(self):
        """Query parameters should be preserved."""
        url = "https://example.com/page?id=123"
        normalized = normalize_url(url)
        assert normalized == "https://example.com/page?id=123"
    
    def test_is_same_domain_true(self):
        """Same domain should return True."""
        assert is_same_domain(
            "https://example.com/page",
            "https://example.com"
        ) is True
    
    def test_is_same_domain_with_subdomain_false(self):
        """Different subdomains should return False."""
        assert is_same_domain(
            "https://sub.example.com/page",
            "https://example.com"
        ) is False
    
    def test_is_same_domain_different_domain_false(self):
        """Different domains should return False."""
        assert is_same_domain(
            "https://other.com/page",
            "https://example.com"
        ) is False


class TestIsValidPageUrl:
    """Tests for is_valid_page_url function."""
    
    def test_valid_http_url(self):
        """HTTP URLs should be valid."""
        assert is_valid_page_url("http://example.com/page") is True
    
    def test_valid_https_url(self):
        """HTTPS URLs should be valid."""
        assert is_valid_page_url("https://example.com/page") is True
    
    def test_invalid_image_url(self):
        """Image URLs should be invalid."""
        assert is_valid_page_url("https://example.com/image.jpg") is False
        assert is_valid_page_url("https://example.com/image.png") is False
        assert is_valid_page_url("https://example.com/image.gif") is False
    
    def test_invalid_css_url(self):
        """CSS URLs should be invalid."""
        assert is_valid_page_url("https://example.com/style.css") is False
    
    def test_invalid_js_url(self):
        """JavaScript URLs should be invalid."""
        assert is_valid_page_url("https://example.com/script.js") is False
    
    def test_invalid_pdf_url(self):
        """PDF URLs should be invalid."""
        assert is_valid_page_url("https://example.com/doc.pdf") is False
    
    def test_invalid_font_url(self):
        """Font URLs should be invalid."""
        assert is_valid_page_url("https://example.com/font.woff2") is False


class TestSitemapCrawler:
    """Tests for SitemapCrawler class."""
    
    def test_crawler_init(self):
        """Test crawler initialization with defaults."""
        crawler = SitemapCrawler()
        assert crawler.max_pages == 100
        assert crawler.max_depth == 3
        assert crawler.status == CrawlStatus.PENDING
    
    def test_crawler_init_custom(self):
        """Test crawler initialization with custom values."""
        crawler = SitemapCrawler(max_pages=50, max_depth=2)
        assert crawler.max_pages == 50
        assert crawler.max_depth == 2
    
    def test_get_progress_initial(self):
        """Test initial progress state."""
        crawler = SitemapCrawler()
        progress = crawler.get_progress()
        assert progress.status == CrawlStatus.PENDING
        assert progress.pages_crawled == 0
        assert progress.pages_queued == 0
        assert progress.progress_percent == 0.0
    
    def test_get_progress_with_data(self):
        """Test progress with some crawled pages."""
        crawler = SitemapCrawler()
        # Simulate some crawling
        from app.schemas.sitemap import PageNode
        crawler.visited["https://example.com"] = PageNode(
            id="abc", url="https://example.com", title="Home", depth=0,
            outgoing_links=2, incoming_links=0
        )
        crawler.visited["https://example.com/about"] = PageNode(
            id="def", url="https://example.com/about", title="About", depth=1,
            outgoing_links=1, incoming_links=1
        )
        crawler.queue = [("https://example.com/contact", 1)]
        crawler.status = CrawlStatus.CRAWLING
        
        progress = crawler.get_progress()
        assert progress.status == CrawlStatus.CRAWLING
        assert progress.pages_crawled == 2
        assert progress.pages_queued == 1
        # 2 / (2 + 1) = 66.7%
        assert 66 <= progress.progress_percent <= 67
    
    def test_crawler_state_reset(self):
        """Test that crawler state is properly reset between crawls."""
        crawler = SitemapCrawler()
        # Add some fake data
        from app.schemas.sitemap import PageNode
        crawler.visited["test"] = PageNode(
            id="abc", url="test", title="Test", depth=0,
            outgoing_links=0, incoming_links=0
        )
        crawler.links = [("a", "b")]
        crawler.queue = [("url", 1)]
        
        # State should be non-empty
        assert len(crawler.visited) == 1
        assert len(crawler.links) == 1
        assert len(crawler.queue) == 1
