/**
 * 遊戲事件動畫測試
 *
 * @module components/games/evolution/animations/__tests__/gameEventAnimations.test
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
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
    AnimatePresence: ({ children, onExitComplete }) => <>{children}</>,
  };
});

// Import animations
import {
  attackAnimation,
  feedAnimation,
  deathAnimation,
  phaseTransitionAnimation,
  traitActivationAnimation,
} from '../gameEventAnimations';

// Import components
import {
  AttackAnimation,
  FeedAnimation,
  DeathAnimation,
  PhaseTransition,
  SatisfiedAnimation,
} from '../AnimatedEvent';

describe('gameEventAnimations', () => {
  describe('attackAnimation', () => {
    it('should define attacker animation', () => {
      expect(attackAnimation.attacker).toBeDefined();
      expect(attackAnimation.attacker.initial).toEqual({ x: 0, y: 0 });
      expect(attackAnimation.attacker.attack).toBeDefined();
    });

    it('should define defender animation', () => {
      expect(attackAnimation.defender).toBeDefined();
      expect(attackAnimation.defender.initial).toEqual({ x: 0, rotate: 0 });
      expect(attackAnimation.defender.hit).toBeDefined();
    });

    it('should define effect animation', () => {
      expect(attackAnimation.effect).toBeDefined();
      expect(attackAnimation.effect.initial).toEqual({ scale: 0, opacity: 0 });
      expect(attackAnimation.effect.animate).toBeDefined();
    });

    it('should have correct timing for attacker', () => {
      expect(attackAnimation.attacker.attack.transition.duration).toBe(0.5);
      expect(attackAnimation.attacker.attack.transition.times).toEqual([0, 0.5, 1]);
    });
  });

  describe('feedAnimation', () => {
    it('should define food animation', () => {
      expect(feedAnimation.food).toBeDefined();
      expect(feedAnimation.food.initial).toEqual({ scale: 1, opacity: 1 });
    });

    it('should define creature eating animation', () => {
      expect(feedAnimation.creature).toBeDefined();
      expect(feedAnimation.creature.initial).toEqual({ scale: 1 });
      expect(feedAnimation.creature.eating.scale).toEqual([1, 1.1, 1]);
    });

    it('should define satisfied animation', () => {
      expect(feedAnimation.satisfied).toBeDefined();
      expect(feedAnimation.satisfied.initial).toEqual({ scale: 0, opacity: 0, y: 0 });
      expect(feedAnimation.satisfied.animate.y).toBe(-30);
    });

    it('should have consume function', () => {
      const targetPos = { x: 100, y: 200 };
      const result = feedAnimation.food.consume(targetPos);
      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
      expect(result.scale).toBe(0);
      expect(result.opacity).toBe(0);
    });
  });

  describe('deathAnimation', () => {
    it('should define creature dying animation', () => {
      expect(deathAnimation.creature).toBeDefined();
      expect(deathAnimation.creature.initial).toEqual({ scale: 1, opacity: 1, rotate: 0 });
      expect(deathAnimation.creature.dying).toBeDefined();
    });

    it('should define skull animation', () => {
      expect(deathAnimation.skull).toBeDefined();
      expect(deathAnimation.skull.initial).toEqual({ scale: 0, opacity: 0, y: 20 });
      expect(deathAnimation.skull.appear).toBeDefined();
    });

    it('should have correct timing for dying', () => {
      expect(deathAnimation.creature.dying.transition.duration).toBe(0.8);
      expect(deathAnimation.creature.dying.transition.times).toEqual([0, 0.3, 1]);
    });
  });

  describe('phaseTransitionAnimation', () => {
    it('should define exit animation', () => {
      expect(phaseTransitionAnimation.exit).toBeDefined();
      expect(phaseTransitionAnimation.exit.opacity).toBe(0);
      expect(phaseTransitionAnimation.exit.scale).toBe(0.9);
    });

    it('should define enter animation', () => {
      expect(phaseTransitionAnimation.enter).toBeDefined();
      expect(phaseTransitionAnimation.enter.opacity).toEqual([0, 1]);
    });

    it('should define title animation', () => {
      expect(phaseTransitionAnimation.title).toBeDefined();
      expect(phaseTransitionAnimation.title.initial).toEqual({ opacity: 0, y: -50, scale: 1.5 });
      expect(phaseTransitionAnimation.title.animate.transition.duration).toBe(2);
    });
  });

  describe('traitActivationAnimation', () => {
    it('should define badge animation', () => {
      expect(traitActivationAnimation.badge).toBeDefined();
      expect(traitActivationAnimation.badge.initial).toEqual({ scale: 1 });
      expect(traitActivationAnimation.badge.activate).toBeDefined();
    });

    it('should have pulse effect', () => {
      expect(traitActivationAnimation.badge.activate.scale).toEqual([1, 1.3, 1]);
      expect(traitActivationAnimation.badge.activate.transition.duration).toBe(0.6);
    });
  });
});

describe('AnimatedEvent components', () => {
  describe('AttackAnimation', () => {
    it('should render when show is true', () => {
      render(<AttackAnimation show={true} />);
      expect(screen.getByTestId('attack-animation')).toBeInTheDocument();
      expect(screen.getByText('⚔️')).toBeInTheDocument();
    });

    it('should not render when show is false', () => {
      render(<AttackAnimation show={false} />);
      expect(screen.queryByTestId('attack-animation')).not.toBeInTheDocument();
    });

    it('should accept onComplete callback', () => {
      const onComplete = jest.fn();
      render(<AttackAnimation show={true} onComplete={onComplete} />);
      expect(screen.getByTestId('attack-animation')).toBeInTheDocument();
    });
  });

  describe('FeedAnimation', () => {
    it('should render when show is true', () => {
      render(<FeedAnimation show={true} />);
      expect(screen.getByTestId('feed-animation')).toBeInTheDocument();
      expect(screen.getByText('🍖')).toBeInTheDocument();
    });

    it('should not render when show is false', () => {
      render(<FeedAnimation show={false} />);
      expect(screen.queryByTestId('feed-animation')).not.toBeInTheDocument();
    });

    it('should accept position props', () => {
      render(
        <FeedAnimation
          show={true}
          fromPosition={{ x: 0, y: 0 }}
          toPosition={{ x: 100, y: 100 }}
        />
      );
      expect(screen.getByTestId('feed-animation')).toBeInTheDocument();
    });

    it('should handle undefined positions', () => {
      render(<FeedAnimation show={true} />);
      expect(screen.getByTestId('feed-animation')).toBeInTheDocument();
    });
  });

  describe('DeathAnimation', () => {
    it('should render when show is true', () => {
      render(<DeathAnimation show={true} />);
      expect(screen.getByTestId('death-animation')).toBeInTheDocument();
      expect(screen.getByText('💀')).toBeInTheDocument();
    });

    it('should not render when show is false', () => {
      render(<DeathAnimation show={false} />);
      expect(screen.queryByTestId('death-animation')).not.toBeInTheDocument();
    });
  });

  describe('PhaseTransition', () => {
    it('should render evolution phase', () => {
      render(<PhaseTransition phase="evolution" show={true} />);
      expect(screen.getByTestId('phase-transition')).toBeInTheDocument();
      expect(screen.getByText('🧬')).toBeInTheDocument();
      expect(screen.getByText('演化階段')).toBeInTheDocument();
    });

    it('should render food_supply phase', () => {
      render(<PhaseTransition phase="food_supply" show={true} />);
      expect(screen.getByText('🎲')).toBeInTheDocument();
      expect(screen.getByText('食物供給')).toBeInTheDocument();
    });

    it('should render feeding phase', () => {
      render(<PhaseTransition phase="feeding" show={true} />);
      expect(screen.getByText('🍖')).toBeInTheDocument();
      expect(screen.getByText('進食階段')).toBeInTheDocument();
    });

    it('should render extinction phase', () => {
      render(<PhaseTransition phase="extinction" show={true} />);
      expect(screen.getByText('💀')).toBeInTheDocument();
      expect(screen.getByText('滅絕階段')).toBeInTheDocument();
    });

    it('should handle unknown phase', () => {
      render(<PhaseTransition phase="unknown" show={true} />);
      expect(screen.getByTestId('phase-transition')).toBeInTheDocument();
      expect(screen.getByText('unknown')).toBeInTheDocument();
    });

    it('should not render when show is false', () => {
      render(<PhaseTransition phase="evolution" show={false} />);
      expect(screen.queryByTestId('phase-transition')).not.toBeInTheDocument();
    });
  });

  describe('SatisfiedAnimation', () => {
    it('should render when show is true', () => {
      render(<SatisfiedAnimation show={true} />);
      expect(screen.getByTestId('satisfied-animation')).toBeInTheDocument();
      expect(screen.getByText('✅ 飽')).toBeInTheDocument();
    });

    it('should not render when show is false', () => {
      render(<SatisfiedAnimation show={false} />);
      expect(screen.queryByTestId('satisfied-animation')).not.toBeInTheDocument();
    });
  });
});
