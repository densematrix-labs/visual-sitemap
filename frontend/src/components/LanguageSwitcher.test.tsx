import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageSwitcher } from './LanguageSwitcher';
import '../i18n';

describe('LanguageSwitcher', () => {
  it('renders the language switcher button', () => {
    render(<LanguageSwitcher />);
    const switcher = screen.getByTestId('lang-switcher');
    expect(switcher).toBeInTheDocument();
  });

  it('shows current language', () => {
    render(<LanguageSwitcher />);
    // Default is English
    expect(screen.getByText(/EN/)).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<LanguageSwitcher />);
    const button = screen.getByRole('button', { name: /change language/i });
    fireEvent.click(button);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
    expect(screen.getByText('日本語')).toBeInTheDocument();
    expect(screen.getByText('Deutsch')).toBeInTheDocument();
    expect(screen.getByText('Français')).toBeInTheDocument();
    expect(screen.getByText('한국어')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
  });

  it('changes language when option is selected', async () => {
    render(<LanguageSwitcher />);
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /change language/i });
    fireEvent.click(button);

    // Select Chinese
    const zhOption = screen.getByText('中文');
    fireEvent.click(zhOption);

    // Should show ZH now
    await waitFor(() => {
      expect(screen.getByText(/ZH/)).toBeInTheDocument();
    });
  });

  it('closes dropdown after selection', async () => {
    render(<LanguageSwitcher />);
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /change language/i });
    fireEvent.click(button);

    // Select an option
    const frOption = screen.getByText('Français');
    fireEvent.click(frOption);

    // Dropdown should be closed
    await waitFor(() => {
      expect(screen.queryByText('English')).not.toBeInTheDocument();
    });
  });

  it('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <LanguageSwitcher />
        <div data-testid="outside">Outside</div>
      </div>
    );
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /change language/i });
    fireEvent.click(button);

    expect(screen.getByText('English')).toBeInTheDocument();

    // Click outside
    const outside = screen.getByTestId('outside');
    fireEvent.mouseDown(outside);

    await waitFor(() => {
      expect(screen.queryByText('English')).not.toBeInTheDocument();
    });
  });
});
