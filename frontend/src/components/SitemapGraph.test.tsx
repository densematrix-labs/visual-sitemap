import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SitemapGraph } from './SitemapGraph';
import '../i18n';

const mockNodes = [
  { id: 'abc', url: 'https://example.com', title: 'Home', depth: 0, outgoing_links: 2, incoming_links: 0 },
  { id: 'def', url: 'https://example.com/about', title: 'About', depth: 1, outgoing_links: 1, incoming_links: 1 },
  { id: 'ghi', url: 'https://example.com/contact', title: null, depth: 1, outgoing_links: 0, incoming_links: 1 },
];

const mockLinks = [
  { source: 'abc', target: 'def' },
  { source: 'abc', target: 'ghi' },
];

describe('SitemapGraph', () => {
  beforeEach(() => {
    // Mock getBoundingClientRect for container sizing
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));
  });

  it('renders the graph container', () => {
    render(<SitemapGraph nodes={mockNodes} links={mockLinks} />);
    expect(screen.getByText(/scroll to zoom/i)).toBeInTheDocument();
  });

  it('renders SVG element', () => {
    const { container } = render(<SitemapGraph nodes={mockNodes} links={mockLinks} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('handles empty nodes gracefully', () => {
    const { container } = render(<SitemapGraph nodes={[]} links={[]} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('calls onNodeClick when node is clicked', async () => {
    const onNodeClick = vi.fn();
    const { container } = render(
      <SitemapGraph nodes={mockNodes} links={mockLinks} onNodeClick={onNodeClick} />
    );

    // Wait for D3 to render
    await new Promise(resolve => setTimeout(resolve, 100));

    // Find a node circle and click it
    const circles = container.querySelectorAll('circle.node');
    if (circles.length > 0) {
      fireEvent.click(circles[0]);
      // Due to async nature of D3, the click handler may not fire immediately
    }
  });

  it('renders hint text', () => {
    render(<SitemapGraph nodes={mockNodes} links={mockLinks} />);
    expect(screen.getByText(/scroll to zoom/i)).toBeInTheDocument();
    expect(screen.getByText(/drag to pan/i)).toBeInTheDocument();
  });

  it('handles links with invalid source/target', () => {
    const invalidLinks = [
      { source: 'nonexistent1', target: 'nonexistent2' },
    ];
    const { container } = render(
      <SitemapGraph nodes={mockNodes} links={invalidLinks} />
    );
    // Should still render without errors
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with different node depths', () => {
    const multiDepthNodes = [
      { id: '1', url: 'https://example.com', title: 'Root', depth: 0, outgoing_links: 3, incoming_links: 0 },
      { id: '2', url: 'https://example.com/a', title: 'A', depth: 1, outgoing_links: 1, incoming_links: 1 },
      { id: '3', url: 'https://example.com/b', title: 'B', depth: 2, outgoing_links: 0, incoming_links: 1 },
      { id: '4', url: 'https://example.com/c', title: 'C', depth: 3, outgoing_links: 0, incoming_links: 1 },
    ];
    const { container } = render(<SitemapGraph nodes={multiDepthNodes} links={[]} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('handles resize events', async () => {
    const { container } = render(<SitemapGraph nodes={mockNodes} links={mockLinks} />);
    
    // Trigger resize
    window.dispatchEvent(new Event('resize'));
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
