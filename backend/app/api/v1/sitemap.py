from fastapi import APIRouter, HTTPException, BackgroundTasks
import uuid

from app.schemas.sitemap import (
    CrawlRequest, SitemapResult, CrawlProgress, CrawlStatus
)
from app.services.crawler import SitemapCrawler

router = APIRouter(prefix="/sitemap", tags=["sitemap"])

# In-memory storage for active crawls (in production, use Redis)
active_crawls: dict[str, SitemapCrawler] = {}
completed_crawls: dict[str, SitemapResult] = {}


@router.post("/crawl", response_model=dict)
async def start_crawl(request: CrawlRequest, background_tasks: BackgroundTasks):
    """
    Start a new sitemap crawl.
    Returns a crawl_id that can be used to check progress and get results.
    """
    crawl_id = str(uuid.uuid4())[:8]
    
    crawler = SitemapCrawler(
        max_pages=request.max_pages,
        max_depth=request.max_depth
    )
    
    active_crawls[crawl_id] = crawler
    
    async def run_crawl():
        result = await crawler.crawl(str(request.url))
        completed_crawls[crawl_id] = result
        # Clean up active crawl after completion
        if crawl_id in active_crawls:
            del active_crawls[crawl_id]
    
    # Run crawl in background
    background_tasks.add_task(run_crawl)
    
    return {
        "crawl_id": crawl_id,
        "status": "started",
        "message": f"Crawl started for {request.url}"
    }


@router.post("/crawl/sync", response_model=SitemapResult)
async def crawl_sync(request: CrawlRequest):
    """
    Perform a synchronous crawl (waits for completion).
    Use for smaller sites or when you need immediate results.
    """
    crawler = SitemapCrawler(
        max_pages=request.max_pages,
        max_depth=request.max_depth
    )
    
    result = await crawler.crawl(str(request.url))
    
    if result.status == CrawlStatus.FAILED:
        raise HTTPException(status_code=500, detail=result.error or "Crawl failed")
    
    return result


@router.get("/crawl/{crawl_id}/progress", response_model=CrawlProgress)
async def get_progress(crawl_id: str):
    """Get the progress of an active crawl."""
    if crawl_id in active_crawls:
        return active_crawls[crawl_id].get_progress()
    
    if crawl_id in completed_crawls:
        result = completed_crawls[crawl_id]
        return CrawlProgress(
            status=result.status,
            pages_crawled=result.total_pages,
            pages_queued=0,
            current_url=None,
            progress_percent=100.0
        )
    
    raise HTTPException(status_code=404, detail="Crawl not found")


@router.get("/crawl/{crawl_id}/result", response_model=SitemapResult)
async def get_result(crawl_id: str):
    """Get the result of a completed crawl."""
    if crawl_id in completed_crawls:
        return completed_crawls[crawl_id]
    
    if crawl_id in active_crawls:
        raise HTTPException(
            status_code=202,
            detail="Crawl still in progress"
        )
    
    raise HTTPException(status_code=404, detail="Crawl not found")


@router.delete("/crawl/{crawl_id}")
async def delete_crawl(crawl_id: str):
    """Delete a completed crawl result."""
    if crawl_id in completed_crawls:
        del completed_crawls[crawl_id]
        return {"status": "deleted"}
    
    raise HTTPException(status_code=404, detail="Crawl not found")
