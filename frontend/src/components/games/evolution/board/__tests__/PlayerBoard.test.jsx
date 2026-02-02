/**
 * PlayerBoard 組件測試
 *
 * @module components/games/evolution/board/__tests__/PlayerBoard.test
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock react-dnd
jest.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, jest.fn()],
  useDrop: () => [{ isOver: false, canDrop: false }, jest.fn()],
  DndProvider: ({ children }) => children,
}));

jest.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {},
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
      button: React.forwardRef(({ children, ...props }, ref) => (
        <button ref={ref} {...props}>
          {children}
        </button>
      )),
    },
    AnimatePresence: ({ children }) => children,
  };
});

// Import after mocks
const { PlayerBoard } = require('../PlayerBoard');

// Mock player data
const createMockPlayer = (overrides = {}) => ({
  id: 'player-1',
  name: 'TestPlayer',
  hand: [],
  creatures: [],
  passed: false,
  connected: true,
  score: 0,
  ...overrides,
});

const createMockCreature = (id, traits = []) => ({
  id,
  ownerId: 'player-1',
  traits,
  food: 0,
  maxFood: 1,
  fat: 0,
});

const createMockCard = (id) => ({
  id: `CARD_${id}`,
  instanceId: `base_CARD_${id}_0`,
  frontTrait: 'carnivore',
  backTrait: 'fatTissue',
  expansion: 'base',
});

describe('PlayerBoard', () => {
  describe('Rendering', () => {
    it('should render player board', () => {
      const player = createMockPlayer();
      render(<PlayerBoard player={player} />);

      expect(screen.getByTestId('player-board')).toBeInTheDocument();
    });

    it('should render player header with name', () => {
      const player = createMockPlayer({ name: 'Alice' });
      render(<PlayerBoard player={player} />);

      expect(screen.getByTestId('player-header')).toBeInTheDocument();
      expect(screen.getByTestId('player-name')).toHaveTextContent('Alice');
    });

    it('should render player avatar with first letter', () => {
      const player = createMockPlayer({ name: 'Bob' });
      render(<PlayerBoard player={player} />);

      expect(screen.getByTestId('player-avatar')).toHaveTextContent('B');
    });

    it('should render player score when provided', () => {
      const player = createMockPlayer({ score: 15 });
      render(<PlayerBoard player={player} />);

      expect(screen.getByTestId('player-score')).toHaveTextContent('15 分');
    });

    it('should not render score when undefined', () => {
      const player = createMockPlayer({ score: undefined });
      render(<PlayerBoard player={player} />);

      expect(screen.queryByTestId('player-score')).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const player = createMockPlayer();
      render(<PlayerBoard player={player} className="custom-class" />);

      expect(screen.getByTestId('player-board')).toHaveClass('custom-class');
    });
  });

  describe('Status Tags', () => {
    it('should show current turn tag when isCurrentPlayer', () => {
      const player = createMockPlayer();
      render(<PlayerBoard player={player} isCurrentPlayer />);

      expect(screen.getByTestId('tag-turn')).toBeInTheDocument();
      expect(screen.getByTestId('tag-turn')).toHaveTextContent('當前回合');
    });

    it('should not show turn tag when not current player', () => {
      const player = createMockPlayer();
      render(<PlayerBoard player={player} isCurrentPlayer={false} />);

      expect(screen.queryByTestId('tag-turn')).not.toBeInTheDocument();
    });

    it('should show passed tag when player has passed', () => {
      const player = createMockPlayer({ passed: true });
      render(<PlayerBoard player={player} />);

      expect(screen.getByTestId('tag-passed')).toBeInTheDocument();
      expect(screen.getByTestId('tag-passed')).toHaveTextContent('已跳過');
    });

    it('should show offline tag when player is disconnected', () => {
      const player = createMockPlayer({ connected: false });
      render(<PlayerBoard player={player} />);

      expect(screen.getByTestId('tag-offline')).toBeInTheDocument();
      expect(screen.getByTestId('tag-offline')).toHaveTextContent('離線');
    });
  });

  describe('State Classes', () => {
    it('should apply current class when isCurrentPlayer', () => {
      const player = createMockPlayer();
      render(<PlayerBoard player={player} isCurrentPlayer />);

      expect(screen.getByTestId('player-board')).toHaveClass(
        'player-board--current'
      );
    });

    it('should apply self class when isSelf', () => {
      const player = createMockPlayer();
      render(<PlayerBoard player={player} isSelf />);

      expect(screen.getByTestId('player-board')).toHaveClass(
        'player-board--self'
      );
    });

    it('should apply passed class when player has passed', () => {
      const player = createMockPlayer({ passed: true });
      render(<PlayerBoard player={player} />);

      expect(screen.getByTestId('player-board')).toHaveClass(
        'player-board--passed'
      );
    });

    it('should apply disconnected class when player is offline', () => {
      const player = createMockPlayer({ connected: false });
      render(<PlayerBoard player={player} />);

      expect(screen.getByTestId('player-board')).toHaveClass(
        'player-board--disconnected'
      );
    });

    it('should apply compact class when compact is true', () => {
      const player = createMockPlayer();
      render(<PlayerBoard player={player} compact />);

      expect(screen.getByTestId('player-board')).toHaveClass(
        'player-board--compact'
      );
    });
  });

  describe('Hand Count (Opponent)', () => {
    it('should show hand count for opponent', () => {
      const player = createMockPlayer({
        hand: [createMockCard(1), createMockCard(2), createMockCard(3)],
      });
      render(<PlayerBoard player={player} isSelf={false} />);

      expect(screen.getByTestId('opponent-hand-count')).toBeInTheDocument();
      expect(screen.getByTestId('opponent-hand-count-number')).toHaveTextContent('3');
    });

    it('should not show hand count for self', () => {
      const player = createMockPlayer({
        hand: [createMockCard(1)],
      });
      render(<PlayerBoard player={player} isSelf />);

      expect(screen.queryByTestId('opponent-hand-count')).not.toBeInTheDocument();
    });
  });

  describe('Creatures Area', () => {
    it('should show empty message when no creatures', () => {
      const player = createMockPlayer({ creatures: [] });
      render(<PlayerBoard player={player} />);

      expect(screen.getByTestId('empty-creatures')).toBeInTheDocument();
      expect(screen.getByText('尚無生物')).toBeInTheDocument();
    });

    it('should render creatures', () => {
      const player = createMockPlayer({
        creatures: [createMockCreature('c1'), createMockCreature('c2')],
      });
      render(<PlayerBoard player={player} />);

      expect(screen.getByTestId('creature-wrapper-c1')).toBeInTheDocument();
      expect(screen.getByTestId('creature-wrapper-c2')).toBeInTheDocument();
    });

    it('should render creatures area', () => {
      const player = createMockPlayer();
      render(<PlayerBoard player={player} />);

      expect(screen.getByTestId('creatures-area')).toBeInTheDocument();
    });
  });

  describe('Hand Area (Self)', () => {
    it('should show hand area for self', () => {
      const player = createMockPlayer({
        hand: [createMockCard(1)],
      });
      render(<PlayerBoard player={player} isSelf />);

      expect(screen.getByTestId('hand-area')).toBeInTheDocument();
    });

    it('should not show hand area for opponent', () => {
      const player = createMockPlayer({
        hand: [createMockCard(1)],
      });
      render(<PlayerBoard player={player} isSelf={false} />);

      expect(screen.queryByTestId('hand-area')).not.toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('should pass onPlayAsCreature to Hand', () => {
      const handlePlayAsCreature = jest.fn();
      const player = createMockPlayer({
        hand: [createMockCard(1)],
      });
      render(
        <PlayerBoard
          player={player}
          isSelf
          onPlayAsCreature={handlePlayAsCreature}
        />
      );

      // Hand component should be rendered with the callback
      expect(screen.getByTestId('hand-area')).toBeInTheDocument();
    });

    it('should pass onPlayAsTrait to Hand', () => {
      const handlePlayAsTrait = jest.fn();
      const player = createMockPlayer({
        hand: [createMockCard(1)],
      });
      render(
        <PlayerBoard
          player={player}
          isSelf
          onPlayAsTrait={handlePlayAsTrait}
        />
      );

      expect(screen.getByTestId('hand-area')).toBeInTheDocument();
    });
  });

  describe('Attackable Creatures', () => {
    it('should not mark own creatures as attackable', () => {
      const player = createMockPlayer({
        creatures: [createMockCreature('c1')],
      });
      render(
        <PlayerBoard
          player={player}
          isSelf
          attackingCreature="attacker-1"
        />
      );

      // Own creatures should not be attackable
      expect(screen.getByTestId('creature-wrapper-c1')).toBeInTheDocument();
    });

    it('should mark opponent creatures as attackable when attacking', () => {
      const player = createMockPlayer({
        creatures: [createMockCreature('c1')],
      });
      render(
        <PlayerBoard
          player={player}
          isSelf={false}
          attackingCreature="attacker-1"
        />
      );

      expect(screen.getByTestId('creature-wrapper-c1')).toBeInTheDocument();
    });
  });

  describe('Trait Links', () => {
    it('should render trait links SVG', () => {
      const player = createMockPlayer();
      render(<PlayerBoard player={player} />);

      expect(screen.getByTestId('trait-links')).toBeInTheDocument();
    });
  });
});
