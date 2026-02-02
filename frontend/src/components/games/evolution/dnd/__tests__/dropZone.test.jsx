/**
 * 拖放目標區域組件測試
 *
 * @module components/games/evolution/dnd/__tests__/dropZone.test
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock react-dnd
const mockUseDrop = jest.fn();
jest.mock('react-dnd', () => ({
  useDrop: (...args) => mockUseDrop(...args),
  DndProvider: ({ children }) => <div data-testid="dnd-provider">{children}</div>,
}));

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }, ref) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
    },
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

// Import after mocks
const { DropZone } = require('../DropZone');
const { NewCreatureZone } = require('../NewCreatureZone');
const { DRAG_TYPES } = require('../dragTypes');

describe('DropZone', () => {
  beforeEach(() => {
    mockUseDrop.mockReturnValue([
      { isOver: false, canDrop: false, draggedItem: null },
      jest.fn(),
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default state', () => {
    render(<DropZone accept="TEST_TYPE" />);

    const zone = screen.getByTestId('drop-zone');
    expect(zone).toBeInTheDocument();
    expect(zone).toHaveClass('drop-zone');
  });

  it('should render children', () => {
    render(
      <DropZone accept="TEST_TYPE">
        <div data-testid="child">Child content</div>
      </DropZone>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render placeholder when no children', () => {
    render(
      <DropZone accept="TEST_TYPE" placeholder={<span>Drop here</span>} />
    );

    expect(screen.getByTestId('drop-zone-placeholder')).toBeInTheDocument();
    expect(screen.getByText('Drop here')).toBeInTheDocument();
  });

  it('should not render placeholder when has children', () => {
    render(
      <DropZone accept="TEST_TYPE" placeholder={<span>Drop here</span>}>
        <div>Child</div>
      </DropZone>
    );

    expect(screen.queryByTestId('drop-zone-placeholder')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<DropZone accept="TEST_TYPE" className="custom-class" />);

    expect(screen.getByTestId('drop-zone')).toHaveClass('custom-class');
  });

  it('should apply disabled class when disabled', () => {
    render(<DropZone accept="TEST_TYPE" disabled />);

    expect(screen.getByTestId('drop-zone')).toHaveClass('drop-zone--disabled');
  });

  it('should show active state when isOver and canDrop', () => {
    mockUseDrop.mockReturnValue([
      { isOver: true, canDrop: true, draggedItem: { id: 'test' } },
      jest.fn(),
    ]);

    render(<DropZone accept="TEST_TYPE" activeLabel="Release to drop" />);

    expect(screen.getByTestId('drop-zone')).toHaveClass('drop-zone--active');
    expect(screen.getByTestId('drop-zone-active-label')).toHaveTextContent('Release to drop');
  });

  it('should show invalid state when isOver but cannot drop', () => {
    mockUseDrop.mockReturnValue([
      { isOver: true, canDrop: false, draggedItem: { id: 'test' } },
      jest.fn(),
    ]);

    render(<DropZone accept="TEST_TYPE" invalidLabel="Cannot drop here" />);

    expect(screen.getByTestId('drop-zone')).toHaveClass('drop-zone--invalid');
    expect(screen.getByTestId('drop-zone-invalid-label')).toHaveTextContent('Cannot drop here');
  });

  it('should not show label without activeLabel prop', () => {
    mockUseDrop.mockReturnValue([
      { isOver: true, canDrop: true, draggedItem: { id: 'test' } },
      jest.fn(),
    ]);

    render(<DropZone accept="TEST_TYPE" />);

    expect(screen.queryByTestId('drop-zone-active-label')).not.toBeInTheDocument();
  });

  it('should not show invalid label without invalidLabel prop', () => {
    mockUseDrop.mockReturnValue([
      { isOver: true, canDrop: false, draggedItem: { id: 'test' } },
      jest.fn(),
    ]);

    render(<DropZone accept="TEST_TYPE" />);

    expect(screen.queryByTestId('drop-zone-invalid-label')).not.toBeInTheDocument();
  });

  it('should call useDrop with correct accept type', () => {
    render(<DropZone accept="TEST_TYPE" />);

    expect(mockUseDrop).toHaveBeenCalled();
    const config = mockUseDrop.mock.calls[0][0];
    expect(config.accept).toBe('TEST_TYPE');
  });

  it('should call useDrop with array of accept types', () => {
    render(<DropZone accept={['TYPE_A', 'TYPE_B']} />);

    const config = mockUseDrop.mock.calls[0][0];
    expect(config.accept).toEqual(['TYPE_A', 'TYPE_B']);
  });

  it('should handle canDrop callback', () => {
    const canDropCallback = jest.fn().mockReturnValue(true);
    render(<DropZone accept="TEST_TYPE" canDrop={canDropCallback} />);

    const config = mockUseDrop.mock.calls[0][0];
    const item = { id: 'test' };
    const monitor = {};

    config.canDrop(item, monitor);
    expect(canDropCallback).toHaveBeenCalledWith(item, monitor);
  });

  it('should return false from canDrop when disabled', () => {
    render(<DropZone accept="TEST_TYPE" disabled />);

    const config = mockUseDrop.mock.calls[0][0];
    expect(config.canDrop({}, {})).toBe(false);
  });

  it('should call onDrop when item is dropped', () => {
    const onDrop = jest.fn();
    render(<DropZone accept="TEST_TYPE" onDrop={onDrop} />);

    const config = mockUseDrop.mock.calls[0][0];
    const item = { id: 'test' };
    const monitor = { didDrop: () => false };

    config.drop(item, monitor);
    expect(onDrop).toHaveBeenCalledWith(item);
  });

  it('should not call onDrop when already dropped', () => {
    const onDrop = jest.fn();
    render(<DropZone accept="TEST_TYPE" onDrop={onDrop} />);

    const config = mockUseDrop.mock.calls[0][0];
    const item = { id: 'test' };
    const monitor = { didDrop: () => true };

    config.drop(item, monitor);
    expect(onDrop).not.toHaveBeenCalled();
  });
});

describe('NewCreatureZone', () => {
  beforeEach(() => {
    mockUseDrop.mockReturnValue([
      { isOver: false, canDrop: false, draggedItem: null },
      jest.fn(),
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible', () => {
    render(<NewCreatureZone />);

    expect(screen.getByTestId('new-creature-zone')).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    render(<NewCreatureZone visible={false} />);

    expect(screen.queryByTestId('new-creature-zone')).not.toBeInTheDocument();
  });

  it('should render placeholder content', () => {
    render(<NewCreatureZone />);

    expect(screen.getByText('🦎')).toBeInTheDocument();
    expect(screen.getByText('拖放卡牌創建新生物')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<NewCreatureZone className="custom-class" />);

    expect(screen.getByTestId('new-creature-zone')).toHaveClass('custom-class');
  });

  it('should accept HAND_CARD type', () => {
    render(<NewCreatureZone />);

    const config = mockUseDrop.mock.calls[0][0];
    expect(config.accept).toBe(DRAG_TYPES.HAND_CARD);
  });

  it('should call onCreateCreature when card is dropped', () => {
    const onCreateCreature = jest.fn();
    render(<NewCreatureZone onCreateCreature={onCreateCreature} />);

    const config = mockUseDrop.mock.calls[0][0];
    const item = { cardId: 'card-1' };
    const monitor = { didDrop: () => false };

    config.drop(item, monitor);
    expect(onCreateCreature).toHaveBeenCalledWith('card-1');
  });

  it('should not call onCreateCreature when item has no cardId', () => {
    const onCreateCreature = jest.fn();
    render(<NewCreatureZone onCreateCreature={onCreateCreature} />);

    const config = mockUseDrop.mock.calls[0][0];
    const item = { id: 'test' };
    const monitor = { didDrop: () => false };

    config.drop(item, monitor);
    expect(onCreateCreature).not.toHaveBeenCalled();
  });

  it('should pass disabled state to DropZone', () => {
    render(<NewCreatureZone disabled />);

    const config = mockUseDrop.mock.calls[0][0];
    expect(config.canDrop({}, {})).toBe(false);
  });

  it('should render with default visibility', () => {
    render(<NewCreatureZone />);

    expect(screen.getByTestId('new-creature-zone')).toBeInTheDocument();
  });
});
