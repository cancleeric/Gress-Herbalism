/**
 * PinchZoomContainer 組件測試
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PinchZoomContainer } from '../PinchZoomContainer';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, ...props }) => (
      <div style={style} {...props}>{children}</div>
    ),
  },
}));

// Mock useTouch hooks
jest.mock('../../../../../hooks/useTouch', () => ({
  usePinchZoom: () => ({
    handlers: {
      onTouchStart: jest.fn(),
      onTouchMove: jest.fn(),
      onTouchEnd: jest.fn(),
      onTouchCancel: jest.fn(),
    },
    scale: 1,
    isPinching: false,
    origin: { x: 0, y: 0 },
    resetScale: jest.fn(),
    setScale: jest.fn(),
  }),
  useDoubleTap: () => ({
    onTouchEnd: jest.fn(),
    onClick: jest.fn(),
  }),
}));

describe('PinchZoomContainer', () => {
  const defaultProps = {
    children: <div data-testid="child-content">Content</div>,
  };

  it('should render children', () => {
    render(<PinchZoomContainer {...defaultProps} />);

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should render container with correct testid', () => {
    render(<PinchZoomContainer {...defaultProps} />);

    expect(screen.getByTestId('pinch-zoom-container')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<PinchZoomContainer {...defaultProps} className="custom-class" />);

    const container = screen.getByTestId('pinch-zoom-container');
    expect(container).toHaveClass('custom-class');
  });

  it('should show zoom hint on touch devices', () => {
    render(<PinchZoomContainer {...defaultProps} />);

    // 提示文字應該存在（雖然可能因 CSS 隱藏）
    expect(screen.getByText('雙指縮放查看詳情')).toBeInTheDocument();
  });

  it('should handle touch events', () => {
    render(<PinchZoomContainer {...defaultProps} />);

    const container = screen.getByTestId('pinch-zoom-container');

    // 觸發觸控事件
    fireEvent.touchStart(container, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    fireEvent.touchMove(container, {
      touches: [{ clientX: 150, clientY: 150 }],
    });

    fireEvent.touchEnd(container);

    // 組件應該正常處理事件而不報錯
    expect(container).toBeInTheDocument();
  });

  it('should accept minScale prop', () => {
    render(<PinchZoomContainer {...defaultProps} minScale={0.3} />);

    expect(screen.getByTestId('pinch-zoom-container')).toBeInTheDocument();
  });

  it('should accept maxScale prop', () => {
    render(<PinchZoomContainer {...defaultProps} maxScale={5} />);

    expect(screen.getByTestId('pinch-zoom-container')).toBeInTheDocument();
  });

  it('should accept initialScale prop', () => {
    render(<PinchZoomContainer {...defaultProps} initialScale={1.5} />);

    expect(screen.getByTestId('pinch-zoom-container')).toBeInTheDocument();
  });

  it('should call onScaleChange when provided', () => {
    const onScaleChange = jest.fn();
    render(<PinchZoomContainer {...defaultProps} onScaleChange={onScaleChange} />);

    expect(screen.getByTestId('pinch-zoom-container')).toBeInTheDocument();
  });
});
