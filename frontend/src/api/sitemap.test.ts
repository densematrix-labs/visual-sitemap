import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { crawlSitemap } from './sitemap';

const mockResult = {
  status: 'completed' as const,
  root_url: 'https://example.com',
  total_pages: 3,
  total_links: 2,
  nodes: [],
  links: [],
  crawl_time_seconds: 1.5,
};

describe('sitemap API', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends correct request format', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResult),
    } as Response);

    await crawlSitemap({ url: 'https://example.com' });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/sitemap/crawl/sync',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://example.com' }),
      })
    );
  });

  it('includes optional parameters', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResult),
    } as Response);

    await crawlSitemap({ url: 'https://example.com', max_depth: 2, max_pages: 50 });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/sitemap/crawl/sync',
      expect.objectContaining({
        body: JSON.stringify({ url: 'https://example.com', max_depth: 2, max_pages: 50 }),
      })
    );
  });

  it('returns result on success', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResult),
    } as Response);

    const result = await crawlSitemap({ url: 'https://example.com' });

    expect(result).toEqual(mockResult);
  });

  it('throws error on failure with detail', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: 'Invalid URL' }),
    } as Response);

    await expect(crawlSitemap({ url: 'bad-url' })).rejects.toThrow('Invalid URL');
  });

  it('throws generic error on failure without detail', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error('Parse error')),
    } as Response);

    await expect(crawlSitemap({ url: 'bad-url' })).rejects.toThrow('Unknown error');
  });
});
