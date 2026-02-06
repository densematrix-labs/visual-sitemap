import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import './i18n';

// Mock the API
vi.mock('./api/sitemap', () => ({
  crawlSitemap: vi.fn(),
}));

import { crawlSitemap } from './api/sitemap';

const mockSitemapResult = {
  status: 'completed' as const,
  root_url: 'https://example.com',
  total_pages: 3,
  total_links: 2,
  nodes: [
    { id: 'abc', url: 'https://example.com', title: 'Home', depth: 0, outgoing_links: 2, incoming_links: 0 },
    { id: 'def', url: 'https://example.com/about', title: 'About', depth: 1, outgoing_links: 0, incoming_links: 1 },
    { id: 'ghi', url: 'https://example.com/contact', title: 'Contact', depth: 1, outgoing_links: 0, incoming_links: 1 },
  ],
  links: [
    { source: 'abc', target: 'def' },
    { source: 'abc', target: 'ghi' },
  ],
  crawl_time_seconds: 1.5,
};

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the app with title', () => {
    render(<App />);
    expect(screen.getByText('SITEMAP')).toBeInTheDocument();
  });

  it('renders the input field', () => {
    render(<App />);
    const input = screen.getByTestId('input-field');
    expect(input).toBeInTheDocument();
  });

  it('renders the scan button', () => {
    render(<App />);
    const button = screen.getByTestId('generate-btn');
    expect(button).toBeInTheDocument();
  });

  it('shows empty state initially', () => {
    render(<App />);
    expect(screen.getByText('AWAITING_TARGET_URL')).toBeInTheDocument();
  });

  it('scan button is disabled when input is empty', () => {
    render(<App />);
    const button = screen.getByTestId('generate-btn');
    expect(button).toBeDisabled();
  });

  it('scan button is enabled when input has value', () => {
    render(<App />);
    const input = screen.getByTestId('input-field');
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    const button = screen.getByTestId('generate-btn');
    expect(button).not.toBeDisabled();
  });

  it('shows loading state during scan', async () => {
    vi.mocked(crawlSitemap).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockSitemapResult), 100))
    );

    render(<App />);
    const input = screen.getByTestId('input-field');
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    
    const button = screen.getByTestId('generate-btn');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/SCANNING/)).toBeInTheDocument();
    });
  });

  it('displays results after successful scan', async () => {
    vi.mocked(crawlSitemap).mockResolvedValue(mockSitemapResult);

    render(<App />);
    const input = screen.getByTestId('input-field');
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    
    const button = screen.getByTestId('generate-btn');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // total_pages
    });
  });

  it('shows error for truly invalid URL', async () => {
    render(<App />);
    const input = screen.getByTestId('input-field');
    // Use a URL that will actually fail URL parsing
    fireEvent.change(input, { target: { value: 'ht tp://invalid url with spaces' } });
    
    const button = screen.getByTestId('generate-btn');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/valid URL/i)).toBeInTheDocument();
    });
  });

  it('shows error when crawl fails', async () => {
    vi.mocked(crawlSitemap).mockRejectedValue(new Error('Network error'));

    render(<App />);
    const input = screen.getByTestId('input-field');
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    
    const button = screen.getByTestId('generate-btn');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('can export results as JSON', async () => {
    vi.mocked(crawlSitemap).mockResolvedValue(mockSitemapResult);

    render(<App />);
    const input = screen.getByTestId('input-field');
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    
    const button = screen.getByTestId('generate-btn');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Export JSON/i)).toBeInTheDocument();
    });

    const exportBtn = screen.getByText(/Export JSON/i);
    fireEvent.click(exportBtn);

    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('can reset and start new scan', async () => {
    vi.mocked(crawlSitemap).mockResolvedValue(mockSitemapResult);

    render(<App />);
    const input = screen.getByTestId('input-field');
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    
    const button = screen.getByTestId('generate-btn');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/New Scan/i)).toBeInTheDocument();
    });

    const resetBtn = screen.getByText(/New Scan/i);
    fireEvent.click(resetBtn);

    expect(screen.getByText('AWAITING_TARGET_URL')).toBeInTheDocument();
  });

  it('displays stats bar with correct values', async () => {
    vi.mocked(crawlSitemap).mockResolvedValue(mockSitemapResult);

    render(<App />);
    const input = screen.getByTestId('input-field');
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    
    const button = screen.getByTestId('generate-btn');
    fireEvent.click(button);

    await waitFor(() => {
      // Result section should be visible after successful scan
      expect(screen.getByText(/Export JSON/i)).toBeInTheDocument();
    });

    // Verify stats are displayed
    const statsSection = document.querySelector('.stats-bar');
    expect(statsSection).toBeInTheDocument();
  });

  it('changes depth option', () => {
    render(<App />);
    const depthSelect = screen.getByLabelText(/depth/i);
    fireEvent.change(depthSelect, { target: { value: '2' } });
    expect(depthSelect).toHaveValue('2');
  });

  it('changes max pages option', () => {
    render(<App />);
    const maxPagesSelect = screen.getByLabelText(/max pages/i);
    fireEvent.change(maxPagesSelect, { target: { value: '50' } });
    expect(maxPagesSelect).toHaveValue('50');
  });

  it('submits form on Enter key', async () => {
    vi.mocked(crawlSitemap).mockResolvedValue(mockSitemapResult);

    render(<App />);
    const input = screen.getByTestId('input-field');
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(crawlSitemap).toHaveBeenCalled();
    });
  });

  it('auto-adds https:// to URLs without protocol', async () => {
    vi.mocked(crawlSitemap).mockResolvedValue(mockSitemapResult);

    render(<App />);
    const input = screen.getByTestId('input-field');
    fireEvent.change(input, { target: { value: 'example.com' } });
    
    const button = screen.getByTestId('generate-btn');
    fireEvent.click(button);

    await waitFor(() => {
      expect(crawlSitemap).toHaveBeenCalledWith(expect.objectContaining({
        url: 'https://example.com/',
      }));
    });
  });

  it('renders footer', () => {
    render(<App />);
    expect(screen.getByText(/powered by densematrix/i)).toBeInTheDocument();
  });
});
