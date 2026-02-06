import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NodeDetails } from './NodeDetails';
import '../i18n';

const mockNode = {
  id: 'abc123',
  url: 'https://example.com/page',
  title: 'Example Page',
  depth: 1,
  outgoing_links: 5,
  incoming_links: 3,
};

describe('NodeDetails', () => {
  it('renders nothing when node is null', () => {
    const { container } = render(<NodeDetails node={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders node details when node is provided', () => {
    render(<NodeDetails node={mockNode} onClose={() => {}} />);
    
    expect(screen.getByText('Example Page')).toBeInTheDocument();
    expect(screen.getByText('https://example.com/page')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // depth
    expect(screen.getByText('5')).toBeInTheDocument(); // outgoing
    expect(screen.getByText('3')).toBeInTheDocument(); // incoming
  });

  it('shows dash when title is null', () => {
    const nodeWithoutTitle = { ...mockNode, title: null };
    render(<NodeDetails node={nodeWithoutTitle} onClose={() => {}} />);
    
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<NodeDetails node={mockNode} onClose={onClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders external link to the URL', () => {
    render(<NodeDetails node={mockNode} onClose={() => {}} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/page');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders header with correct title', () => {
    render(<NodeDetails node={mockNode} onClose={() => {}} />);
    
    expect(screen.getByText('NODE_INFO')).toBeInTheDocument();
  });
});
