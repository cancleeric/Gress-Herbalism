/**
 * AnimationManager 測試
 *
 * @module components/games/evolution/animations/__tests__/animationManager.test
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';

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
const { AnimationManager } = require('../AnimationManager');
const { useAnimationQueue, useAnimationControl } = require('../useAnimation');

describe('AnimationManager', () => {
  it('should render container', () => {
    render(<AnimationManager />);
    expect(screen.getByTestId('animation-manager')).toBeInTheDocument();
  });

  it('should not render animation when no currentAnimation', () => {
    render(<AnimationManager />);
    expect(screen.queryByTestId('attack-animation')).not.toBeInTheDocument();
  });

  it('should render attack animation', () => {
    const animation = { id: 'anim1', type: 'attack', data: {} };
    render(<AnimationManager currentAnimation={animation} isPlaying={true} />);
    expect(screen.getByTestId('attack-animation')).toBeInTheDocument();
  });

  it('should render feed animation', () => {
    const animation = {
      id: 'anim1',
      type: 'feed',
      data: { fromPosition: { x: 0, y: 0 }, toPosition: { x: 100, y: 100 } },
    };
    render(<AnimationManager currentAnimation={animation} isPlaying={true} />);
    expect(screen.getByTestId('feed-animation')).toBeInTheDocument();
  });

  it('should render death animation', () => {
    const animation = { id: 'anim1', type: 'death', data: {} };
    render(<AnimationManager currentAnimation={animation} isPlaying={true} />);
    expect(screen.getByTestId('death-animation')).toBeInTheDocument();
  });

  it('should render phase transition', () => {
    const animation = { id: 'anim1', type: 'phase', data: { phase: 'evolution' } };
    render(<AnimationManager currentAnimation={animation} isPlaying={true} />);
    expect(screen.getByTestId('phase-transition')).toBeInTheDocument();
  });

  it('should render satisfied animation', () => {
    const animation = { id: 'anim1', type: 'satisfied', data: {} };
    render(<AnimationManager currentAnimation={animation} isPlaying={true} />);
    expect(screen.getByTestId('satisfied-animation')).toBeInTheDocument();
  });

  it('should not render when disabled', () => {
    const animation = { id: 'anim1', type: 'attack', data: {} };
    const settings = { enabled: false, speed: 1, reducedMotion: false };
    render(<AnimationManager currentAnimation={animation} isPlaying={true} settings={settings} />);
    expect(screen.queryByTestId('attack-animation')).not.toBeInTheDocument();
  });

  it('should apply reduced motion class', () => {
    const settings = { enabled: true, speed: 1, reducedMotion: true };
    render(<AnimationManager settings={settings} />);
    expect(screen.getByTestId('animation-manager')).toHaveClass('animation-manager--reduced');
  });

  it('should call onPlayNext when not playing', () => {
    const onPlayNext = jest.fn();
    render(<AnimationManager isPlaying={false} onPlayNext={onPlayNext} />);
    expect(onPlayNext).toHaveBeenCalled();
  });

  it('should call onComplete for unknown animation type', () => {
    const onComplete = jest.fn();
    const animation = { id: 'anim1', type: 'unknown', data: {} };
    render(<AnimationManager currentAnimation={animation} isPlaying={true} onComplete={onComplete} />);
    expect(onComplete).toHaveBeenCalled();
  });
});

describe('useAnimationQueue', () => {
  it('should initialize with empty queue', () => {
    const { result } = renderHook(() => useAnimationQueue());

    expect(result.current.queue).toEqual([]);
    expect(result.current.currentAnimation).toBeNull();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.queueLength).toBe(0);
  });

  it('should enqueue animation', () => {
    const { result } = renderHook(() => useAnimationQueue());

    act(() => {
      result.current.enqueue({ type: 'attack', priority: 10 });
    });

    expect(result.current.queue.length).toBe(1);
    expect(result.current.queue[0].type).toBe('attack');
  });

  it('should sort by priority', () => {
    const { result } = renderHook(() => useAnimationQueue());

    act(() => {
      result.current.enqueue({ type: 'feed', priority: 5 });
      result.current.enqueue({ type: 'phase', priority: 15 });
    });

    expect(result.current.queue[0].type).toBe('phase');
    expect(result.current.queue[1].type).toBe('feed');
  });

  it('should enqueueBatch animations', () => {
    const { result } = renderHook(() => useAnimationQueue());

    act(() => {
      result.current.enqueueBatch([
        { type: 'attack', priority: 10 },
        { type: 'feed', priority: 5 },
      ]);
    });

    expect(result.current.queue.length).toBe(2);
  });

  it('should playNext animation', () => {
    const { result } = renderHook(() => useAnimationQueue());

    act(() => {
      result.current.enqueue({ type: 'attack' });
    });

    act(() => {
      result.current.playNext();
    });

    expect(result.current.currentAnimation).not.toBeNull();
    expect(result.current.currentAnimation.type).toBe('attack');
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.queue.length).toBe(0);
  });

  it('should complete animation', () => {
    const { result } = renderHook(() => useAnimationQueue());

    act(() => {
      result.current.enqueue({ type: 'attack' });
    });

    act(() => {
      result.current.playNext();
    });

    act(() => {
      result.current.complete();
    });

    expect(result.current.currentAnimation).toBeNull();
    expect(result.current.isPlaying).toBe(false);
  });

  it('should cancel animation', () => {
    const { result } = renderHook(() => useAnimationQueue());

    act(() => {
      result.current.enqueue({ type: 'attack' });
      result.current.playNext();
    });

    act(() => {
      result.current.cancel();
    });

    expect(result.current.currentAnimation).toBeNull();
    expect(result.current.isPlaying).toBe(false);
  });

  it('should clearQueue', () => {
    const { result } = renderHook(() => useAnimationQueue());

    act(() => {
      result.current.enqueue({ type: 'attack' });
      result.current.enqueue({ type: 'feed' });
    });

    act(() => {
      result.current.clearQueue();
    });

    expect(result.current.queue.length).toBe(0);
  });

  it('should skipAll', () => {
    const { result } = renderHook(() => useAnimationQueue());

    act(() => {
      result.current.enqueue({ type: 'attack' });
      result.current.playNext();
      result.current.enqueue({ type: 'feed' });
    });

    act(() => {
      result.current.skipAll();
    });

    expect(result.current.queue.length).toBe(0);
    expect(result.current.currentAnimation).toBeNull();
    expect(result.current.isPlaying).toBe(false);
  });

  it('should updateSettings', () => {
    const { result } = renderHook(() => useAnimationQueue());

    act(() => {
      result.current.updateSettings({ speed: 2 });
    });

    expect(result.current.settings.speed).toBe(2);
    expect(result.current.settings.enabled).toBe(true);
  });
});

describe('useAnimationControl', () => {
  it('should provide animation control methods', () => {
    const { result: queueResult } = renderHook(() => useAnimationQueue());
    const { result } = renderHook(() => useAnimationControl(queueResult.current));

    expect(result.current.playAttack).toBeDefined();
    expect(result.current.playFeed).toBeDefined();
    expect(result.current.playDeath).toBeDefined();
    expect(result.current.playPhaseTransition).toBeDefined();
    expect(result.current.playSatisfied).toBeDefined();
    expect(result.current.playBatch).toBeDefined();
    expect(result.current.skip).toBeDefined();
    expect(result.current.setSettings).toBeDefined();
  });

  it('should playAttack', () => {
    const { result: queueResult } = renderHook(() => useAnimationQueue());
    const { result } = renderHook(() => useAnimationControl(queueResult.current));

    act(() => {
      result.current.playAttack('attacker1', 'defender1');
    });

    expect(queueResult.current.queue.length).toBe(1);
    expect(queueResult.current.queue[0].type).toBe('attack');
    expect(queueResult.current.queue[0].priority).toBe(10);
  });

  it('should playFeed', () => {
    const { result: queueResult } = renderHook(() => useAnimationQueue());
    const { result } = renderHook(() => useAnimationControl(queueResult.current));

    act(() => {
      result.current.playFeed('creature1', { x: 0, y: 0 }, { x: 100, y: 100 });
    });

    expect(queueResult.current.queue[0].type).toBe('feed');
    expect(queueResult.current.queue[0].priority).toBe(5);
  });

  it('should playDeath', () => {
    const { result: queueResult } = renderHook(() => useAnimationQueue());
    const { result } = renderHook(() => useAnimationControl(queueResult.current));

    act(() => {
      result.current.playDeath('creature1');
    });

    expect(queueResult.current.queue[0].type).toBe('death');
    expect(queueResult.current.queue[0].priority).toBe(8);
  });

  it('should playPhaseTransition', () => {
    const { result: queueResult } = renderHook(() => useAnimationQueue());
    const { result } = renderHook(() => useAnimationControl(queueResult.current));

    act(() => {
      result.current.playPhaseTransition('evolution');
    });

    expect(queueResult.current.queue[0].type).toBe('phase');
    expect(queueResult.current.queue[0].priority).toBe(15);
  });

  it('should playSatisfied', () => {
    const { result: queueResult } = renderHook(() => useAnimationQueue());
    const { result } = renderHook(() => useAnimationControl(queueResult.current));

    act(() => {
      result.current.playSatisfied('creature1');
    });

    expect(queueResult.current.queue[0].type).toBe('satisfied');
    expect(queueResult.current.queue[0].priority).toBe(3);
  });
});
