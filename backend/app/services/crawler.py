import asyncio
import hashlib
import time
from urllib.parse import urljoin, urlparse
from typing import Optional
from collections import defaultdict

from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeout

from app.core.config import settings
from app.schemas.sitemap import (
    PageNode, PageLink, SitemapResult, CrawlStatus, CrawlProgress
)


def url_to_id(url: str) -> str:
    """Generate a short unique ID for a URL."""
    return hashlib.md5(url.encode()).hexdigest()[:12]


def normalize_url(url: str) -> str:
    """Normalize URL by removing fragments and trailing slashes."""
    parsed = urlparse(url)
    # Remove fragment, keep query
    normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
    if parsed.query:
        normalized += f"?{parsed.query}"
    return normalized.rstrip("/")


def is_same_domain(url: str, base_url: str) -> bool:
    """Check if URL belongs to the same domain as base URL."""
    parsed = urlparse(url)
    base_parsed = urlparse(base_url)
    return parsed.netloc == base_parsed.netloc


def is_valid_page_url(url: str) -> bool:
    """Check if URL is a valid page URL (not an asset)."""
    parsed = urlparse(url)
    path = parsed.path.lower()
    
    # Skip common non-page extensions
    skip_extensions = {
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
        '.css', '.js', '.json', '.xml', '.txt', '.pdf', '.doc', '.docx',
        '.zip', '.tar', '.gz', '.mp3', '.mp4', '.webm', '.woff', '.woff2',
        '.ttf', '.eot', '.otf'
    }
    
    for ext in skip_extensions:
        if path.endswith(ext):
            return False
    
    # Must be http/https
    return parsed.scheme in ('http', 'https')


class SitemapCrawler:
    """Async web crawler using Playwright."""
    
    def __init__(
        self,
        max_pages: int = settings.MAX_PAGES,
        max_depth: int = settings.MAX_DEPTH,
        timeout_per_page: int = settings.CRAWL_TIMEOUT
    ):
        self.max_pages = max_pages
        self.max_depth = max_depth
        self.timeout_per_page = timeout_per_page
        self.browser: Optional[Browser] = None
        
        # Crawl state
        self.visited: dict[str, PageNode] = {}
        self.links: list[tuple[str, str]] = []
        self.queue: list[tuple[str, int]] = []  # (url, depth)
        self.incoming_count: dict[str, int] = defaultdict(int)
        self.base_url: str = ""
        
        # Progress tracking
        self.status = CrawlStatus.PENDING
        self.current_url: Optional[str] = None
    
    def get_progress(self) -> CrawlProgress:
        """Get current crawl progress."""
        total = len(self.visited) + len(self.queue)
        progress = (len(self.visited) / max(total, 1)) * 100
        return CrawlProgress(
            status=self.status,
            pages_crawled=len(self.visited),
            pages_queued=len(self.queue),
            current_url=self.current_url,
            progress_percent=round(progress, 1)
        )
    
    async def extract_links(self, page: Page, current_url: str) -> list[str]:
        """Extract all valid links from a page."""
        links = []
        try:
            elements = await page.query_selector_all("a[href]")
            for element in elements:
                href = await element.get_attribute("href")
                if not href:
                    continue
                
                # Resolve relative URLs
                absolute_url = urljoin(current_url, href)
                normalized = normalize_url(absolute_url)
                
                # Filter: same domain and valid page URL
                if is_same_domain(normalized, self.base_url) and is_valid_page_url(normalized):
                    links.append(normalized)
        except Exception:
            pass
        
        return list(set(links))  # Dedupe
    
    async def crawl_page(self, page: Page, url: str, depth: int) -> Optional[PageNode]:
        """Crawl a single page and extract info."""
        if url in self.visited:
            return None
        
        self.current_url = url
        
        try:
            response = await page.goto(url, wait_until="domcontentloaded", timeout=self.timeout_per_page)
            
            if not response or response.status >= 400:
                return None
            
            # Get page title
            title = await page.title()
            
            # Extract links
            links = await self.extract_links(page, url)
            
            # Create node
            node = PageNode(
                id=url_to_id(url),
                url=url,
                title=title[:200] if title else None,
                depth=depth,
                outgoing_links=len(links),
                incoming_links=0  # Will be updated later
            )
            
            self.visited[url] = node
            
            # Add links to queue and track
            for link_url in links:
                # Track link
                self.links.append((url, link_url))
                self.incoming_count[link_url] += 1
                
                # Add to queue if not visited and within depth
                if link_url not in self.visited and depth + 1 <= self.max_depth:
                    if not any(q[0] == link_url for q in self.queue):
                        self.queue.append((link_url, depth + 1))
            
            return node
            
        except PlaywrightTimeout:
            return None
        except Exception:
            return None
    
    async def crawl(self, start_url: str) -> SitemapResult:
        """Perform the complete crawl starting from start_url."""
        start_time = time.time()
        self.base_url = normalize_url(start_url)
        self.status = CrawlStatus.CRAWLING
        
        # Reset state
        self.visited.clear()
        self.links.clear()
        self.queue.clear()
        self.incoming_count.clear()
        
        # Add start URL to queue
        self.queue.append((self.base_url, 0))
        
        try:
            async with async_playwright() as p:
                self.browser = await p.chromium.launch(headless=True)
                context = await self.browser.new_context(
                    user_agent="Mozilla/5.0 (compatible; VisualSitemapBot/1.0)"
                )
                page = await context.new_page()
                
                while self.queue and len(self.visited) < self.max_pages:
                    url, depth = self.queue.pop(0)
                    
                    if url in self.visited:
                        continue
                    
                    await self.crawl_page(page, url, depth)
                    
                    # Small delay to be polite
                    await asyncio.sleep(0.1)
                
                await self.browser.close()
            
            # Update incoming link counts
            for url, node in self.visited.items():
                node.incoming_links = self.incoming_count.get(url, 0)
            
            # Build result
            nodes = list(self.visited.values())
            page_links = []
            
            for source_url, target_url in self.links:
                if source_url in self.visited and target_url in self.visited:
                    page_links.append(PageLink(
                        source=url_to_id(source_url),
                        target=url_to_id(target_url)
                    ))
            
            # Dedupe links
            seen_links = set()
            unique_links = []
            for link in page_links:
                key = (link.source, link.target)
                if key not in seen_links:
                    seen_links.add(key)
                    unique_links.append(link)
            
            self.status = CrawlStatus.COMPLETED
            
            return SitemapResult(
                status=CrawlStatus.COMPLETED,
                root_url=self.base_url,
                total_pages=len(nodes),
                total_links=len(unique_links),
                nodes=nodes,
                links=unique_links,
                crawl_time_seconds=round(time.time() - start_time, 2)
            )
            
        except Exception as e:
            self.status = CrawlStatus.FAILED
            return SitemapResult(
                status=CrawlStatus.FAILED,
                root_url=self.base_url,
                total_pages=len(self.visited),
                total_links=0,
                nodes=list(self.visited.values()),
                links=[],
                crawl_time_seconds=round(time.time() - start_time, 2),
                error=str(e)
            )
