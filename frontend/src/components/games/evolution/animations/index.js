/**
 * 演化論遊戲動畫系統模組
 *
 * @module components/games/evolution/animations
 */

export {
  cardVariants,
  dealCardAnimation,
  flipCardAnimation,
  drawCardAnimation,
  exitCardAnimation,
  fanLayoutAnimation,
} from './cardAnimations';

export {
  useCardAnimation,
  useDealAnimation,
  useHandLayoutAnimation,
  useFlipAnimation,
} from './useCardAnimation';

export {
  attackAnimation,
  feedAnimation,
  deathAnimation,
  phaseTransitionAnimation,
  traitActivationAnimation,
} from './gameEventAnimations';

export {
  AttackAnimation,
  FeedAnimation,
  DeathAnimation,
  PhaseTransition,
  SatisfiedAnimation,
} from './AnimatedEvent';

export { AnimationManager } from './AnimationManager';

export {
  useAnimationQueue,
  useAnimationControl,
} from './useAnimation';
