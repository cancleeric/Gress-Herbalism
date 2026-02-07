/**
 * GestureOverlay 組件測試
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GestureOverlay } from '../GestureOverlay';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock useTouch hooks
jest.mock('../../../../../hooks/useTouch', () => ({
  useSwipe: () => ({
    handlers: {
      onTouchStart: jest.fn(),
      onTouchMove: jest.fn(),
      onTouchEnd: jest.fn(),
      onTouchCancel: jest.fn(),
    },
    swiping: false,
    swipeOffset: { x: 0, y: 0 },
  }),
  useHapticFeedback: () => ({
    isSupported: true,
    light: jest.fn(),
    medium: jest.fn(),
  }),
  SWIPE_DIRECTION: {
    LEFT: 'left',
    RIGHT: 'right',
    UP: 'up',
    DOWN: 'down',
  },
}));

describe('GestureOverlay', () => {
  const defaultProps = {
    children: <div data-testid="child-content">Content</div>,
    onPass: jest.fn(),
    onUndo: jest.fn(),
    onOpenMenu: jest.fn(),
    onOpenLog: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children', () => {
    render(<GestureOverlay {...defaultProps} />);

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should render overlay with correct testid', () => {
    render(<GestureOverlay {...defaultProps} />);

    expect(screen.getByTestId('gesture-overlay')).toBeInTheDocument();
  });

  it('should render edge indicators', () => {
    const { container } = render(<GestureOverlay {...defaultProps} />);

    expect(container.querySelector('.gesture-overlay__edge--left')).toBeInTheDocument();
    expect(container.querySelector('.gesture-overlay__edge--right')).toBeInTheDocument();
  });

  it('should not wrap content when disabled', () => {
    render(<GestureOverlay {...defaultProps} enabled={false} />);

    expect(screen.queryByTestId('gesture-overlay')).not.toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('should handle touch events', () => {
    render(<GestureOverlay {...defaultProps} />);

    const overlay = screen.getByTestId('gesture-overlay');

    fireEvent.touchStart(overlay, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    fireEvent.touchMove(overlay, {
      touches: [{ clientX: 50, clientY: 100 }],
    });

    fireEvent.touchEnd(overlay);

    expect(overlay).toBeInTheDocument();
  });

  it('should accept custom swipeThreshold', () => {
    render(<GestureOverlay {...defaultProps} swipeThreshold={150} />);

    expect(screen.getByTestId('gesture-overlay')).toBeInTheDocument();
  });

  it('should accept custom edgeWidth', () => {
    render(<GestureOverlay {...defaultProps} edgeWidth={80} />);

    expect(screen.getByTestId('gesture-overlay')).toBeInTheDocument();
  });
});
