import React from 'react';
import { render, screen } from '@testing-library/react';
import AIThinkingIndicator from './AIThinkingIndicator';

describe('AIThinkingIndicator', () => {
  test('should not render when isThinking is false', () => {
    const { container } = render(<AIThinkingIndicator isThinking={false} />);
    expect(container.firstChild).toBeNull();
  });

  test('should render when isThinking is true', () => {
    render(<AIThinkingIndicator isThinking={true} />);
    expect(screen.getByText(/思考中/)).toBeInTheDocument();
  });

  test('should display AI name when provided', () => {
    render(<AIThinkingIndicator isThinking={true} aiName="AI-1" />);
    expect(screen.getByText(/AI-1 思考中/)).toBeInTheDocument();
  });

  test('should not display AI name when not provided', () => {
    render(<AIThinkingIndicator isThinking={true} />);
    const text = screen.getByText(/思考中/);
    expect(text.textContent).toBe('思考中');
  });

  test('should apply small size class correctly', () => {
    const { container } = render(
      <AIThinkingIndicator isThinking={true} size="small" />
    );
    expect(container.firstChild).toHaveClass('ai-thinking-indicator');
    expect(container.firstChild).toHaveClass('ai-thinking-small');
  });

  test('should apply medium size class by default', () => {
    const { container } = render(
      <AIThinkingIndicator isThinking={true} />
    );
    expect(container.firstChild).toHaveClass('ai-thinking-indicator');
    expect(container.firstChild).toHaveClass('ai-thinking-medium');
  });

  test('should apply large size class correctly', () => {
    const { container } = render(
      <AIThinkingIndicator isThinking={true} size="large" />
    );
    expect(container.firstChild).toHaveClass('ai-thinking-indicator');
    expect(container.firstChild).toHaveClass('ai-thinking-large');
  });

  test('should render three dots for animation', () => {
    const { container } = render(
      <AIThinkingIndicator isThinking={true} />
    );
    const dots = container.querySelectorAll('.thinking-dots .dot');
    expect(dots).toHaveLength(3);
  });
});
