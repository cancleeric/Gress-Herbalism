/**
 * SwipeCardSelector 組件測試
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SwipeCardSelector } from '../SwipeCardSelector';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, ...props }) => (
      <div style={style} {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock useHapticFeedback
jest.mock('../../../../../hooks/useTouch', () => ({
  useHapticFeedback: () => ({
    isSupported: true,
    light: jest.fn(),
    medium: jest.fn(),
  }),
}));

// Mock card component
const MockCard = React.forwardRef(({ card, isSwipeSelected, ...props }, ref) => (
  <div
    ref={ref}
    data-testid={`card-${card.instanceId}`}
    data-swipe-selected={isSwipeSelected}
    {...props}
  >
    {card.name}
  </div>
));
MockCard.displayName = 'MockCard';

describe('SwipeCardSelector', () => {
  const mockItems = [
    { instanceId: '1', name: 'Card 1' },
    { instanceId: '2', name: 'Card 2' },
    { instanceId: '3', name: 'Card 3' },
  ];

  const defaultProps = {
    items: mockItems,
    onSelectionChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render children', () => {
    render(
      <SwipeCardSelector {...defaultProps}>
        {mockItems.map((item) => (
          <MockCard key={item.instanceId} card={item} />
        ))}
      </SwipeCardSelector>
    );

    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
    expect(screen.getByText('Card 3')).toBeInTheDocument();
  });

  it('should render with correct testid', () => {
    render(
      <SwipeCardSelector {...defaultProps}>
        <MockCard card={mockItems[0]} />
      </SwipeCardSelector>
    );

    expect(screen.getByTestId('swipe-card-selector')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <SwipeCardSelector {...defaultProps} className="custom-class">
        <MockCard card={mockItems[0]} />
      </SwipeCardSelector>
    );

    expect(screen.getByTestId('swipe-card-selector')).toHaveClass('custom-class');
  });

  it('should start selection on touch start after delay', () => {
    render(
      <SwipeCardSelector {...defaultProps}>
        <MockCard card={mockItems[0]} />
      </SwipeCardSelector>
    );

    const selector = screen.getByTestId('swipe-card-selector');

    act(() => {
      fireEvent.touchStart(selector, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(selector).toHaveClass('swipe-card-selector--selecting');
  });

  it('should end selection on touch end', () => {
    render(
      <SwipeCardSelector {...defaultProps}>
        <MockCard card={mockItems[0]} />
      </SwipeCardSelector>
    );

    const selector = screen.getByTestId('swipe-card-selector');

    act(() => {
      fireEvent.touchStart(selector, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    act(() => {
      fireEvent.touchEnd(selector);
    });

    expect(selector).not.toHaveClass('swipe-card-selector--selecting');
  });

  it('should not start selection when disabled', () => {
    render(
      <SwipeCardSelector {...defaultProps} enabled={false}>
        <MockCard card={mockItems[0]} />
      </SwipeCardSelector>
    );

    const selector = screen.getByTestId('swipe-card-selector');

    act(() => {
      fireEvent.touchStart(selector, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(selector).not.toHaveClass('swipe-card-selector--selecting');
  });

  it('should handle touch move during selection', () => {
    render(
      <SwipeCardSelector {...defaultProps}>
        <MockCard card={mockItems[0]} />
      </SwipeCardSelector>
    );

    const selector = screen.getByTestId('swipe-card-selector');

    act(() => {
      fireEvent.touchStart(selector, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    act(() => {
      fireEvent.touchMove(selector, {
        touches: [{ clientX: 200, clientY: 200 }],
      });
    });

    expect(selector).toBeInTheDocument();
  });

  it('should handle touch cancel', () => {
    render(
      <SwipeCardSelector {...defaultProps}>
        <MockCard card={mockItems[0]} />
      </SwipeCardSelector>
    );

    const selector = screen.getByTestId('swipe-card-selector');

    act(() => {
      fireEvent.touchStart(selector, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    act(() => {
      fireEvent.touchCancel(selector);
    });

    expect(selector).not.toHaveClass('swipe-card-selector--selecting');
  });

  it('should respect maxSelect limit', () => {
    render(
      <SwipeCardSelector {...defaultProps} maxSelect={2}>
        {mockItems.map((item) => (
          <MockCard key={item.instanceId} card={item} />
        ))}
      </SwipeCardSelector>
    );

    expect(screen.getByTestId('swipe-card-selector')).toBeInTheDocument();
  });
});
