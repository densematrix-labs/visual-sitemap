const API_BASE = import.meta.env.VITE_API_URL || '';

export interface PageNode {
  id: string;
  url: string;
  title: string | null;
  depth: number;
  outgoing_links: number;
  incoming_links: number;
}

export interface PageLink {
  source: string;
  target: string;
}

export interface SitemapResult {
  status: 'pending' | 'crawling' | 'completed' | 'failed';
  root_url: string;
  total_pages: number;
  total_links: number;
  nodes: PageNode[];
  links: PageLink[];
  crawl_time_seconds: number;
  error?: string;
}

export interface CrawlRequest {
  url: string;
  max_depth?: number;
  max_pages?: number;
}

export async function crawlSitemap(request: CrawlRequest): Promise<SitemapResult> {
  const response = await fetch(`${API_BASE}/api/v1/sitemap/crawl/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Crawl failed');
  }

  return response.json();
}
