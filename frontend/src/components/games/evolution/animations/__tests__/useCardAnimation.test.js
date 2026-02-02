/**
 * 卡牌動畫 Hooks 測試
 *
 * @module components/games/evolution/animations/__tests__/useCardAnimation.test
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  useAnimation: () => ({
    start: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Import after mock
const {
  useCardAnimation,
  useDealAnimation,
  useHandLayoutAnimation,
  useFlipAnimation,
} = require('../useCardAnimation');
const { cardVariants } = require('../cardAnimations');

describe('useCardAnimation', () => {
  it('should start with inHand state', () => {
    const { result } = renderHook(() => useCardAnimation('card-1'));

    expect(result.current.state).toBe('inHand');
    expect(result.current.controls).toBeDefined();
    expect(result.current.variants).toBe(cardVariants);
  });

  it('should animate to new state', async () => {
    const { result } = renderHook(() => useCardAnimation('card-1'));

    await act(async () => {
      await result.current.animate('selected');
    });

    expect(result.current.state).toBe('selected');
  });

  it('should animate to playing state', async () => {
    const { result } = renderHook(() => useCardAnimation('card-1'));

    await act(async () => {
      await result.current.animate('playing');
    });

    expect(result.current.state).toBe('playing');
  });

  it('should reset to inHand', async () => {
    const { result } = renderHook(() => useCardAnimation('card-1'));

    await act(async () => {
      await result.current.animate('selected');
    });

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.state).toBe('inHand');
  });

  it('should handle unknown state gracefully', async () => {
    const { result } = renderHook(() => useCardAnimation('card-1'));

    await act(async () => {
      await result.current.animate('unknownState');
    });

    expect(result.current.state).toBe('unknownState');
  });
});

describe('useDealAnimation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start with empty dealt cards', () => {
    const cards = [{ id: 'card-1' }, { id: 'card-2' }];
    const { result } = renderHook(() => useDealAnimation(cards));

    expect(result.current.dealtCards).toEqual([]);
    expect(result.current.isDealing).toBe(false);
  });

  it('should deal cards progressively', async () => {
    const cards = [{ id: 'card-1' }, { id: 'card-2' }, { id: 'card-3' }];
    const { result } = renderHook(() => useDealAnimation(cards));

    act(() => {
      result.current.deal();
    });

    expect(result.current.isDealing).toBe(true);

    // Advance through each card deal
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current.dealtCards.length).toBe(1);

    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current.dealtCards.length).toBe(2);

    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current.dealtCards.length).toBe(3);
    expect(result.current.isDealing).toBe(false);
  });

  it('should provide animation props', () => {
    const cards = [{ id: 'card-1' }, { id: 'card-2' }];
    const { result } = renderHook(() => useDealAnimation(cards));

    const animProps = result.current.getAnimationProps(0);

    expect(animProps.initial).toBeDefined();
    expect(animProps.animate).toBeDefined();
    expect(animProps.animate.transition.delay).toBe(0);
  });

  it('should calculate delay based on index', () => {
    const cards = [{ id: 'card-1' }, { id: 'card-2' }, { id: 'card-3' }];
    const { result } = renderHook(() => useDealAnimation(cards));

    const props0 = result.current.getAnimationProps(0);
    const props1 = result.current.getAnimationProps(1);
    const props2 = result.current.getAnimationProps(2);

    expect(props0.animate.transition.delay).toBe(0);
    expect(props1.animate.transition.delay).toBe(0.1);
    expect(props2.animate.transition.delay).toBe(0.2);
  });
});

describe('useHandLayoutAnimation', () => {
  it('should return getCardStyle function', () => {
    const cards = [
      { instanceId: 'card-1' },
      { instanceId: 'card-2' },
      { instanceId: 'card-3' },
    ];
    const { result } = renderHook(() => useHandLayoutAnimation(cards, null));

    expect(result.current.getCardStyle).toBeDefined();
    expect(typeof result.current.getCardStyle).toBe('function');
  });

  it('should calculate style for unselected card', () => {
    const cards = [
      { instanceId: 'card-1' },
      { instanceId: 'card-2' },
      { instanceId: 'card-3' },
    ];
    const { result } = renderHook(() => useHandLayoutAnimation(cards, null));

    const style = result.current.getCardStyle(1);

    expect(style.scale).toBe(1);
    expect(style.zIndex).toBe(1);
  });

  it('should calculate style for selected card', () => {
    const cards = [
      { instanceId: 'card-1' },
      { instanceId: 'card-2' },
      { instanceId: 'card-3' },
    ];
    const { result } = renderHook(() => useHandLayoutAnimation(cards, 'card-2'));

    const style = result.current.getCardStyle(1);

    expect(style.scale).toBe(1.1);
    expect(style.zIndex).toBe(100);
    expect(style.rotate).toBe(0);
    expect(style.y).toBe(-30);
  });

  it('should update when selectedCardId changes', () => {
    const cards = [
      { instanceId: 'card-1' },
      { instanceId: 'card-2' },
    ];
    const { result, rerender } = renderHook(
      ({ selectedId }) => useHandLayoutAnimation(cards, selectedId),
      { initialProps: { selectedId: null } }
    );

    const initialStyle = result.current.getCardStyle(0);
    expect(initialStyle.scale).toBe(1);

    rerender({ selectedId: 'card-1' });

    const selectedStyle = result.current.getCardStyle(0);
    expect(selectedStyle.scale).toBe(1.1);
  });
});

describe('useFlipAnimation', () => {
  it('should start with front side', () => {
    const { result } = renderHook(() => useFlipAnimation());

    expect(result.current.isFlipped).toBe(false);
    expect(result.current.controls).toBeDefined();
  });

  it('should flip to back', async () => {
    const { result } = renderHook(() => useFlipAnimation());

    await act(async () => {
      await result.current.flip();
    });

    expect(result.current.isFlipped).toBe(true);
  });

  it('should flip back to front', async () => {
    const { result } = renderHook(() => useFlipAnimation());

    await act(async () => {
      await result.current.flip();
    });
    expect(result.current.isFlipped).toBe(true);

    await act(async () => {
      await result.current.flip();
    });
    expect(result.current.isFlipped).toBe(false);
  });

  it('should flip to specific state', async () => {
    const { result } = renderHook(() => useFlipAnimation());

    await act(async () => {
      await result.current.flipTo(true);
    });
    expect(result.current.isFlipped).toBe(true);

    await act(async () => {
      await result.current.flipTo(false);
    });
    expect(result.current.isFlipped).toBe(false);
  });

  it('should provide variants', () => {
    const { result } = renderHook(() => useFlipAnimation());

    expect(result.current.variants).toBeDefined();
    expect(result.current.variants.front).toBeDefined();
    expect(result.current.variants.back).toBeDefined();
  });
});
