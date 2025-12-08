import { render, screen, fireEvent } from '@testing-library/react';

import { PaperButton } from './paper-button';

describe('PaperButton Component', () => {
  it('should render button with text', () => {
    render(<PaperButton>Click Me</PaperButton>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<PaperButton onClick={onClick}>Click Me</PaperButton>);
    fireEvent.click(screen.getByText('Click Me'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should render with primary variant by default', () => {
    render(<PaperButton>Primary Button</PaperButton>);
    const button = screen.getByText('Primary Button');
    expect(button).toHaveClass('bg-paper-primary');
  });

  it('should render with secondary variant', () => {
    render(<PaperButton variant="secondary">Secondary Button</PaperButton>);
    const button = screen.getByText('Secondary Button');
    expect(button).toHaveClass('bg-paper-background');
  });

  it('should render with medium size by default', () => {
    render(<PaperButton>Medium Button</PaperButton>);
    const button = screen.getByText('Medium Button');
    expect(button).toHaveClass('px-4 py-2 text-base');
  });

  it('should render with large size', () => {
    render(<PaperButton size="large">Large Button</PaperButton>);
    const button = screen.getByText('Large Button');
    expect(button).toHaveClass('px-6 py-3 text-lg');
  });
});
