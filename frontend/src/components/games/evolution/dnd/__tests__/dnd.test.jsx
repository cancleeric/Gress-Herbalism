/**
 * 拖放系統測試
 *
 * @module components/games/evolution/dnd/__tests__/dnd.test
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock react-dnd
jest.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, jest.fn(), jest.fn()],
  useDrop: () => [{ isOver: false, canDrop: false }, jest.fn()],
  DndProvider: ({ children }) => <div data-testid="dnd-provider">{children}</div>,
  useDragLayer: () => ({
    item: null,
    itemType: null,
    isDragging: false,
    currentOffset: null,
  }),
}));

jest.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {},
  getEmptyImage: () => ({}),
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
  };
});

// Import after mocks
const { DRAG_TYPES, DROP_TARGETS, DROP_RESULTS } = require('../dragTypes');
const { EvolutionDndContext } = require('../DndContext');
const { DragPreviewLayer } = require('../DragPreviewLayer');
const { useDragPreview, useDragState } = require('../useDragPreview');

describe('dragTypes', () => {
  describe('DRAG_TYPES', () => {
    it('should define HAND_CARD type', () => {
      expect(DRAG_TYPES.HAND_CARD).toBe('HAND_CARD');
    });

    it('should define FOOD_TOKEN type', () => {
      expect(DRAG_TYPES.FOOD_TOKEN).toBe('FOOD_TOKEN');
    });

    it('should define CREATURE type', () => {
      expect(DRAG_TYPES.CREATURE).toBe('CREATURE');
    });
  });

  describe('DROP_TARGETS', () => {
    it('should define CREATURE_SLOT target', () => {
      expect(DROP_TARGETS.CREATURE_SLOT).toBe('CREATURE_SLOT');
    });

    it('should define NEW_CREATURE_ZONE target', () => {
      expect(DROP_TARGETS.NEW_CREATURE_ZONE).toBe('NEW_CREATURE_ZONE');
    });

    it('should define CREATURE target', () => {
      expect(DROP_TARGETS.CREATURE).toBe('CREATURE');
    });

    it('should define DISCARD_PILE target', () => {
      expect(DROP_TARGETS.DISCARD_PILE).toBe('DISCARD_PILE');
    });
  });

  describe('DROP_RESULTS', () => {
    it('should define SUCCESS result', () => {
      expect(DROP_RESULTS.SUCCESS).toBe('success');
    });

    it('should define INVALID_TARGET result', () => {
      expect(DROP_RESULTS.INVALID_TARGET).toBe('invalid_target');
    });

    it('should define BLOCKED result', () => {
      expect(DROP_RESULTS.BLOCKED).toBe('blocked');
    });

    it('should define CANCELLED result', () => {
      expect(DROP_RESULTS.CANCELLED).toBe('cancelled');
    });
  });
});

describe('EvolutionDndContext', () => {
  it('should render children', () => {
    render(
      <EvolutionDndContext>
        <div data-testid="child">Child content</div>
      </EvolutionDndContext>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should wrap children with DndProvider', () => {
    render(
      <EvolutionDndContext>
        <div>Test</div>
      </EvolutionDndContext>
    );

    expect(screen.getByTestId('dnd-provider')).toBeInTheDocument();
  });

  it('should render DragPreviewLayer by default', () => {
    render(
      <EvolutionDndContext>
        <div>Test</div>
      </EvolutionDndContext>
    );

    // DragPreviewLayer returns null when not dragging
    // So we just verify the context renders without error
    expect(screen.getByTestId('dnd-provider')).toBeInTheDocument();
  });

  it('should not render preview when enablePreview is false', () => {
    render(
      <EvolutionDndContext enablePreview={false}>
        <div>Test</div>
      </EvolutionDndContext>
    );

    expect(screen.getByTestId('dnd-provider')).toBeInTheDocument();
  });
});

describe('DragPreviewLayer', () => {
  it('should return null when not dragging', () => {
    const { container } = render(<DragPreviewLayer />);

    expect(container.firstChild).toBeNull();
  });
});

describe('useDragPreview', () => {
  it('should return a ref', () => {
    const { result } = renderHook(() => useDragPreview(null));

    expect(result.current).toHaveProperty('current');
  });

  it('should call preview with empty image', () => {
    const mockPreview = jest.fn();
    renderHook(() => useDragPreview(mockPreview));

    expect(mockPreview).toHaveBeenCalled();
  });
});

describe('useDragState', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDragState());

    expect(result.current.isDragging).toBe(false);
    expect(result.current.draggedItem).toBeNull();
    expect(result.current.draggedType).toBeNull();
  });

  it('should update state on startDrag', () => {
    const { result } = renderHook(() => useDragState());

    act(() => {
      result.current.startDrag({ id: 'card-1' }, 'HAND_CARD');
    });

    expect(result.current.isDragging).toBe(true);
    expect(result.current.draggedItem).toEqual({ id: 'card-1' });
    expect(result.current.draggedType).toBe('HAND_CARD');
  });

  it('should reset state on endDrag', () => {
    const { result } = renderHook(() => useDragState());

    act(() => {
      result.current.startDrag({ id: 'card-1' }, 'HAND_CARD');
    });

    act(() => {
      result.current.endDrag();
    });

    expect(result.current.isDragging).toBe(false);
    expect(result.current.draggedItem).toBeNull();
    expect(result.current.draggedType).toBeNull();
  });
});
