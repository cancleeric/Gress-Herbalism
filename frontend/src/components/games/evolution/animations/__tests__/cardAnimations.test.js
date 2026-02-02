/**
 * 卡牌動畫系統測試
 *
 * @module components/games/evolution/animations/__tests__/cardAnimations.test
 */

import {
  cardVariants,
  dealCardAnimation,
  flipCardAnimation,
  drawCardAnimation,
  exitCardAnimation,
  fanLayoutAnimation,
} from '../cardAnimations';

describe('cardAnimations', () => {
  describe('cardVariants', () => {
    it('should define inDeck variant', () => {
      expect(cardVariants.inDeck).toBeDefined();
      expect(cardVariants.inDeck.scale).toBe(0.8);
      expect(cardVariants.inDeck.opacity).toBe(0);
      expect(cardVariants.inDeck.rotateY).toBe(180);
    });

    it('should define inHand variant', () => {
      expect(cardVariants.inHand).toBeDefined();
      expect(cardVariants.inHand.scale).toBe(1);
      expect(cardVariants.inHand.opacity).toBe(1);
      expect(cardVariants.inHand.transition.type).toBe('spring');
    });

    it('should define selected variant', () => {
      expect(cardVariants.selected).toBeDefined();
      expect(cardVariants.selected.scale).toBe(1.1);
      expect(cardVariants.selected.y).toBe(-20);
      expect(cardVariants.selected.zIndex).toBe(100);
    });

    it('should define playing variant', () => {
      expect(cardVariants.playing).toBeDefined();
      expect(cardVariants.playing.scale).toBe(1.2);
      expect(cardVariants.playing.y).toBe(-100);
    });

    it('should define asCreature variant', () => {
      expect(cardVariants.asCreature).toBeDefined();
      expect(cardVariants.asCreature.scale).toBe(1);
      expect(cardVariants.asCreature.opacity).toBe(1);
    });

    it('should define asTrait variant', () => {
      expect(cardVariants.asTrait).toBeDefined();
      expect(cardVariants.asTrait.scale).toBe(0);
      expect(cardVariants.asTrait.opacity).toBe(0);
    });

    it('should define discarded variant', () => {
      expect(cardVariants.discarded).toBeDefined();
      expect(cardVariants.discarded.scale).toBe(0.5);
      expect(cardVariants.discarded.x).toBe(200);
      expect(cardVariants.discarded.rotate).toBe(45);
    });

    it('should define hover variant', () => {
      expect(cardVariants.hover).toBeDefined();
      expect(cardVariants.hover.scale).toBe(1.05);
      expect(cardVariants.hover.y).toBe(-8);
    });

    it('should define dragging variant', () => {
      expect(cardVariants.dragging).toBeDefined();
      expect(cardVariants.dragging.scale).toBe(1.1);
      expect(cardVariants.dragging.opacity).toBe(0.9);
    });
  });

  describe('dealCardAnimation', () => {
    it('should return animation props with correct initial state', () => {
      const animation = dealCardAnimation(0, 5);

      expect(animation.initial).toBeDefined();
      expect(animation.initial.y).toBe(-300);
      expect(animation.initial.scale).toBe(0.5);
      expect(animation.initial.opacity).toBe(0);
      expect(animation.initial.rotateY).toBe(180);
    });

    it('should return animation props with correct animate state', () => {
      const animation = dealCardAnimation(0, 5);

      expect(animation.animate).toBeDefined();
      expect(animation.animate.y).toBe(0);
      expect(animation.animate.scale).toBe(1);
      expect(animation.animate.opacity).toBe(1);
      expect(animation.animate.rotateY).toBe(0);
    });

    it('should calculate correct delay based on index', () => {
      const animation0 = dealCardAnimation(0, 5);
      const animation2 = dealCardAnimation(2, 5);
      const animation4 = dealCardAnimation(4, 5);

      expect(animation0.animate.transition.delay).toBe(0);
      expect(animation2.animate.transition.delay).toBe(0.2);
      expect(animation4.animate.transition.delay).toBe(0.4);
    });

    it('should use spring transition', () => {
      const animation = dealCardAnimation(0, 5);

      expect(animation.animate.transition.type).toBe('spring');
      expect(animation.animate.transition.stiffness).toBe(200);
      expect(animation.animate.transition.damping).toBe(20);
    });
  });

  describe('flipCardAnimation', () => {
    it('should define front state', () => {
      expect(flipCardAnimation.front).toBeDefined();
      expect(flipCardAnimation.front.rotateY).toBe(0);
      expect(flipCardAnimation.front.transition.duration).toBe(0.4);
    });

    it('should define back state', () => {
      expect(flipCardAnimation.back).toBeDefined();
      expect(flipCardAnimation.back.rotateY).toBe(180);
      expect(flipCardAnimation.back.transition.duration).toBe(0.4);
    });

    it('should use easeInOut easing', () => {
      expect(flipCardAnimation.front.transition.ease).toBe('easeInOut');
      expect(flipCardAnimation.back.transition.ease).toBe('easeInOut');
    });
  });

  describe('drawCardAnimation', () => {
    it('should define initial state', () => {
      expect(drawCardAnimation.initial).toBeDefined();
      expect(drawCardAnimation.initial.x).toBe(-100);
      expect(drawCardAnimation.initial.y).toBe(-200);
      expect(drawCardAnimation.initial.scale).toBe(0.5);
      expect(drawCardAnimation.initial.rotate).toBe(-30);
    });

    it('should define animate state', () => {
      expect(drawCardAnimation.animate).toBeDefined();
      expect(drawCardAnimation.animate.x).toBe(0);
      expect(drawCardAnimation.animate.y).toBe(0);
      expect(drawCardAnimation.animate.scale).toBe(1);
      expect(drawCardAnimation.animate.rotate).toBe(0);
    });

    it('should use spring transition', () => {
      expect(drawCardAnimation.animate.transition.type).toBe('spring');
    });
  });

  describe('exitCardAnimation', () => {
    it('should define exit state', () => {
      expect(exitCardAnimation.exit).toBeDefined();
      expect(exitCardAnimation.exit.scale).toBe(0.5);
      expect(exitCardAnimation.exit.opacity).toBe(0);
      expect(exitCardAnimation.exit.y).toBe(100);
    });

    it('should have correct duration', () => {
      expect(exitCardAnimation.exit.transition.duration).toBe(0.3);
    });
  });

  describe('fanLayoutAnimation', () => {
    it('should calculate layout for first card', () => {
      const style = fanLayoutAnimation(0, 5, false);

      expect(style.rotate).toBeDefined();
      expect(style.y).toBeDefined();
      expect(style.scale).toBe(1);
      expect(style.zIndex).toBe(0);
    });

    it('should calculate layout for middle card', () => {
      const style = fanLayoutAnimation(2, 5, false);

      expect(style.zIndex).toBe(2);
    });

    it('should handle selected state', () => {
      const style = fanLayoutAnimation(2, 5, true);

      expect(style.rotate).toBe(0);
      expect(style.y).toBe(-30);
      expect(style.scale).toBe(1.1);
      expect(style.zIndex).toBe(100);
    });

    it('should use spring transition', () => {
      const style = fanLayoutAnimation(0, 5, false);

      expect(style.transition.type).toBe('spring');
      expect(style.transition.stiffness).toBe(300);
      expect(style.transition.damping).toBe(25);
    });

    it('should limit spread angle for many cards', () => {
      const style1 = fanLayoutAnimation(0, 3, false);
      const style2 = fanLayoutAnimation(0, 20, false);

      // Both should have reasonable angles
      expect(Math.abs(style1.rotate)).toBeLessThan(30);
      expect(Math.abs(style2.rotate)).toBeLessThan(60);
    });

    it('should spread cards symmetrically', () => {
      const styleFirst = fanLayoutAnimation(0, 5, false);
      const styleLast = fanLayoutAnimation(4, 5, false);

      // First and last should have opposite angles
      expect(styleFirst.rotate).toBeCloseTo(-styleLast.rotate, 1);
    });
  });
});
