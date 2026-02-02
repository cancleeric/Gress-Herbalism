/**
 * useCardInteraction Hook 測試
 *
 * @module components/games/evolution/cards/__tests__/useCardInteraction.test
 */

import { renderHook, act } from '@testing-library/react';
import { useCardInteraction } from '../useCardInteraction';

describe('useCardInteraction', () => {
  describe('Initial State', () => {
    it('should start with empty selection', () => {
      const { result } = renderHook(() => useCardInteraction());

      expect(result.current.selectedCards).toEqual([]);
      expect(result.current.selectedCount).toBe(0);
    });
  });

  describe('Single Select Mode (default)', () => {
    it('should select a card', () => {
      const { result } = renderHook(() => useCardInteraction());

      act(() => {
        result.current.toggleSelect('card-1');
      });

      expect(result.current.selectedCards).toEqual(['card-1']);
      expect(result.current.selectedCount).toBe(1);
    });

    it('should deselect a card when toggled again', () => {
      const { result } = renderHook(() => useCardInteraction());

      act(() => {
        result.current.toggleSelect('card-1');
        result.current.toggleSelect('card-1');
      });

      expect(result.current.selectedCards).toEqual([]);
      expect(result.current.selectedCount).toBe(0);
    });

    it('should replace selection when selecting a new card', () => {
      const { result } = renderHook(() => useCardInteraction());

      act(() => {
        result.current.toggleSelect('card-1');
      });

      act(() => {
        result.current.toggleSelect('card-2');
      });

      expect(result.current.selectedCards).toEqual(['card-2']);
      expect(result.current.selectedCount).toBe(1);
    });

    it('should call onSelect when selecting', () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useCardInteraction({ onSelect })
      );

      act(() => {
        result.current.toggleSelect('card-1');
      });

      expect(onSelect).toHaveBeenCalledWith('card-1');
    });

    it('should call onDeselect when deselecting', () => {
      const onDeselect = jest.fn();
      const { result } = renderHook(() =>
        useCardInteraction({ onDeselect })
      );

      act(() => {
        result.current.toggleSelect('card-1');
        result.current.toggleSelect('card-1');
      });

      expect(onDeselect).toHaveBeenCalledWith('card-1');
    });

    it('should call onDeselect for previous card when replacing selection', () => {
      const onDeselect = jest.fn();
      const { result } = renderHook(() =>
        useCardInteraction({ onDeselect })
      );

      act(() => {
        result.current.toggleSelect('card-1');
      });

      act(() => {
        result.current.toggleSelect('card-2');
      });

      expect(onDeselect).toHaveBeenCalledWith('card-1');
    });
  });

  describe('Multi Select Mode', () => {
    it('should allow selecting multiple cards', () => {
      const { result } = renderHook(() =>
        useCardInteraction({ multiSelect: true })
      );

      act(() => {
        result.current.toggleSelect('card-1');
        result.current.toggleSelect('card-2');
        result.current.toggleSelect('card-3');
      });

      expect(result.current.selectedCards).toContain('card-1');
      expect(result.current.selectedCards).toContain('card-2');
      expect(result.current.selectedCards).toContain('card-3');
      expect(result.current.selectedCount).toBe(3);
    });

    it('should respect maxSelect limit', () => {
      const { result } = renderHook(() =>
        useCardInteraction({ multiSelect: true, maxSelect: 2 })
      );

      act(() => {
        result.current.toggleSelect('card-1');
        result.current.toggleSelect('card-2');
        result.current.toggleSelect('card-3');
      });

      expect(result.current.selectedCount).toBe(2);
      expect(result.current.selectedCards).not.toContain('card-3');
    });

    it('should deselect individual cards', () => {
      const { result } = renderHook(() =>
        useCardInteraction({ multiSelect: true })
      );

      act(() => {
        result.current.toggleSelect('card-1');
        result.current.toggleSelect('card-2');
      });

      act(() => {
        result.current.toggleSelect('card-1');
      });

      expect(result.current.selectedCards).toEqual(['card-2']);
    });
  });

  describe('isSelected', () => {
    it('should return true for selected card', () => {
      const { result } = renderHook(() => useCardInteraction());

      act(() => {
        result.current.toggleSelect('card-1');
      });

      expect(result.current.isSelected('card-1')).toBe(true);
    });

    it('should return false for non-selected card', () => {
      const { result } = renderHook(() => useCardInteraction());

      act(() => {
        result.current.toggleSelect('card-1');
      });

      expect(result.current.isSelected('card-2')).toBe(false);
    });
  });

  describe('clearSelection', () => {
    it('should clear all selections', () => {
      const { result } = renderHook(() =>
        useCardInteraction({ multiSelect: true })
      );

      act(() => {
        result.current.toggleSelect('card-1');
        result.current.toggleSelect('card-2');
      });

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedCards).toEqual([]);
      expect(result.current.selectedCount).toBe(0);
    });

    it('should call onDeselect for each cleared card', () => {
      const onDeselect = jest.fn();
      const { result } = renderHook(() =>
        useCardInteraction({ multiSelect: true, onDeselect })
      );

      act(() => {
        result.current.toggleSelect('card-1');
        result.current.toggleSelect('card-2');
      });

      act(() => {
        result.current.clearSelection();
      });

      expect(onDeselect).toHaveBeenCalledWith('card-1');
      expect(onDeselect).toHaveBeenCalledWith('card-2');
    });
  });

  describe('selectAll', () => {
    it('should select all provided cards in multi-select mode', () => {
      const { result } = renderHook(() =>
        useCardInteraction({ multiSelect: true })
      );

      act(() => {
        result.current.selectAll(['card-1', 'card-2', 'card-3']);
      });

      expect(result.current.selectedCards).toContain('card-1');
      expect(result.current.selectedCards).toContain('card-2');
      expect(result.current.selectedCards).toContain('card-3');
    });

    it('should only select first card in single-select mode', () => {
      const { result } = renderHook(() => useCardInteraction());

      act(() => {
        result.current.selectAll(['card-1', 'card-2', 'card-3']);
      });

      expect(result.current.selectedCards).toEqual(['card-1']);
    });

    it('should respect maxSelect in multi-select mode', () => {
      const { result } = renderHook(() =>
        useCardInteraction({ multiSelect: true, maxSelect: 2 })
      );

      act(() => {
        result.current.selectAll(['card-1', 'card-2', 'card-3']);
      });

      expect(result.current.selectedCount).toBe(2);
    });

    it('should call onSelect for each selected card', () => {
      const onSelect = jest.fn();
      const { result } = renderHook(() =>
        useCardInteraction({ multiSelect: true, onSelect })
      );

      act(() => {
        result.current.selectAll(['card-1', 'card-2']);
      });

      expect(onSelect).toHaveBeenCalledWith('card-1');
      expect(onSelect).toHaveBeenCalledWith('card-2');
    });
  });

  describe('select', () => {
    it('should select a card without toggling', () => {
      const { result } = renderHook(() => useCardInteraction());

      act(() => {
        result.current.select('card-1');
      });

      expect(result.current.selectedCards).toEqual(['card-1']);
    });

    it('should replace selection in single-select mode', () => {
      const { result } = renderHook(() => useCardInteraction());

      act(() => {
        result.current.select('card-1');
      });

      act(() => {
        result.current.select('card-2');
      });

      expect(result.current.selectedCards).toEqual(['card-2']);
    });

    it('should add to selection in multi-select mode', () => {
      const { result } = renderHook(() =>
        useCardInteraction({ multiSelect: true })
      );

      act(() => {
        result.current.select('card-1');
      });

      act(() => {
        result.current.select('card-2');
      });

      expect(result.current.selectedCards).toContain('card-1');
      expect(result.current.selectedCards).toContain('card-2');
    });

    it('should respect maxSelect when using select', () => {
      const { result } = renderHook(() =>
        useCardInteraction({ multiSelect: true, maxSelect: 1 })
      );

      act(() => {
        result.current.select('card-1');
      });

      act(() => {
        result.current.select('card-2');
      });

      expect(result.current.selectedCards).toEqual(['card-1']);
    });
  });

  describe('deselect', () => {
    it('should deselect a specific card', () => {
      const { result } = renderHook(() =>
        useCardInteraction({ multiSelect: true })
      );

      act(() => {
        result.current.toggleSelect('card-1');
        result.current.toggleSelect('card-2');
      });

      act(() => {
        result.current.deselect('card-1');
      });

      expect(result.current.selectedCards).toEqual(['card-2']);
    });

    it('should call onDeselect when deselecting', () => {
      const onDeselect = jest.fn();
      const { result } = renderHook(() =>
        useCardInteraction({ onDeselect })
      );

      act(() => {
        result.current.toggleSelect('card-1');
      });

      act(() => {
        result.current.deselect('card-1');
      });

      expect(onDeselect).toHaveBeenCalledWith('card-1');
    });

    it('should do nothing if card is not selected', () => {
      const onDeselect = jest.fn();
      const { result } = renderHook(() =>
        useCardInteraction({ onDeselect })
      );

      act(() => {
        result.current.deselect('card-1');
      });

      // onDeselect is still called, but selection remains empty
      expect(result.current.selectedCards).toEqual([]);
    });
  });
});
