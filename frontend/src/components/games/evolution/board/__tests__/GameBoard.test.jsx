/**
 * GameBoard 組件測試
 *
 * @module components/games/evolution/board/__tests__/GameBoard.test
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
const { GameBoard } = require('../GameBoard');

// Mock game state
const createMockGameState = (playerCount = 2) => {
  const players = {};
  const turnOrder = [];

  for (let i = 0; i < playerCount; i++) {
    const id = `player-${i + 1}`;
    players[id] = {
      id,
      name: `Player ${i + 1}`,
      hand: [],
      creatures: [],
      passed: false,
      connected: true,
      score: 0,
    };
    turnOrder.push(id);
  }

  return {
    players,
    turnOrder,
    foodPool: 10,
    deck: Array(50).fill({}),
    round: 1,
    lastFoodRoll: null,
  };
};

describe('GameBoard', () => {
  describe('Rendering', () => {
    it('should render game board', () => {
      const gameState = createMockGameState(2);
      render(<GameBoard gameState={gameState} myPlayerId="player-1" />);

      expect(screen.getByTestId('game-board')).toBeInTheDocument();
    });

    it('should render phase area', () => {
      const gameState = createMockGameState(2);
      render(<GameBoard gameState={gameState} myPlayerId="player-1" />);

      expect(screen.getByTestId('phase-area')).toBeInTheDocument();
    });

    it('should render opponents area', () => {
      const gameState = createMockGameState(2);
      render(<GameBoard gameState={gameState} myPlayerId="player-1" />);

      expect(screen.getByTestId('opponents-area')).toBeInTheDocument();
    });

    it('should render center area with food pool', () => {
      const gameState = createMockGameState(2);
      render(<GameBoard gameState={gameState} myPlayerId="player-1" />);

      expect(screen.getByTestId('center-area')).toBeInTheDocument();
      expect(screen.getByTestId('food-pool')).toBeInTheDocument();
    });

    it('should render self area', () => {
      const gameState = createMockGameState(2);
      render(<GameBoard gameState={gameState} myPlayerId="player-1" />);

      expect(screen.getByTestId('self-area')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const gameState = createMockGameState(2);
      render(
        <GameBoard
          gameState={gameState}
          myPlayerId="player-1"
          className="custom-class"
        />
      );

      expect(screen.getByTestId('game-board')).toHaveClass('custom-class');
    });
  });

  describe('Layout Classes', () => {
    it('should apply 2p layout class for 2 players', () => {
      const gameState = createMockGameState(2);
      render(<GameBoard gameState={gameState} myPlayerId="player-1" />);

      expect(screen.getByTestId('game-board')).toHaveClass('game-board--2p');
    });

    it('should apply 3p layout class for 3 players', () => {
      const gameState = createMockGameState(3);
      render(<GameBoard gameState={gameState} myPlayerId="player-1" />);

      expect(screen.getByTestId('game-board')).toHaveClass('game-board--3p');
    });

    it('should apply 4p layout class for 4 players', () => {
      const gameState = createMockGameState(4);
      render(<GameBoard gameState={gameState} myPlayerId="player-1" />);

      expect(screen.getByTestId('game-board')).toHaveClass('game-board--4p');
    });
  });

  describe('Phase Display', () => {
    it('should display round number', () => {
      const gameState = createMockGameState(2);
      gameState.round = 3;
      render(<GameBoard gameState={gameState} myPlayerId="player-1" />);

      expect(screen.getByTestId('round-display')).toHaveTextContent('第 3 回合');
    });

    it('should display phase name', () => {
      const gameState = createMockGameState(2);
      render(
        <GameBoard
          gameState={gameState}
          myPlayerId="player-1"
          currentPhase="evolution"
        />
      );

      expect(screen.getByTestId('phase-display')).toHaveTextContent('演化階段');
    });

    it('should display feeding phase name', () => {
      const gameState = createMockGameState(2);
      render(
        <GameBoard
          gameState={gameState}
          myPlayerId="player-1"
          currentPhase="feeding"
        />
      );

      expect(screen.getByTestId('phase-display')).toHaveTextContent('進食階段');
    });

    it('should show my turn indicator when it is my turn', () => {
      const gameState = createMockGameState(2);
      render(
        <GameBoard
          gameState={gameState}
          myPlayerId="player-1"
          currentPlayerIndex={0}
        />
      );

      expect(screen.getByTestId('my-turn-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('my-turn-indicator')).toHaveTextContent(
        '輪到你了'
      );
    });

    it('should not show my turn indicator when it is not my turn', () => {
      const gameState = createMockGameState(2);
      render(
        <GameBoard
          gameState={gameState}
          myPlayerId="player-1"
          currentPlayerIndex={1}
        />
      );

      expect(screen.queryByTestId('my-turn-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Deck Info', () => {
    it('should display deck count', () => {
      const gameState = createMockGameState(2);
      gameState.deck = Array(42).fill({});
      render(<GameBoard gameState={gameState} myPlayerId="player-1" />);

      expect(screen.getByTestId('deck-count')).toHaveTextContent('42');
    });

    it('should display 0 for empty deck', () => {
      const gameState = createMockGameState(2);
      gameState.deck = [];
      render(<GameBoard gameState={gameState} myPlayerId="player-1" />);

      expect(screen.getByTestId('deck-count')).toHaveTextContent('0');
    });
  });

  describe('Player Ordering', () => {
    it('should render opponents before self', () => {
      const gameState = createMockGameState(3);
      render(<GameBoard gameState={gameState} myPlayerId="player-2" />);

      // Opponent 1 and 2 should be in opponents area
      expect(screen.getByTestId('opponent-1')).toBeInTheDocument();
      expect(screen.getByTestId('opponent-2')).toBeInTheDocument();
    });

    it('should render correct number of opponents', () => {
      const gameState = createMockGameState(4);
      render(<GameBoard gameState={gameState} myPlayerId="player-1" />);

      expect(screen.getByTestId('opponent-1')).toBeInTheDocument();
      expect(screen.getByTestId('opponent-2')).toBeInTheDocument();
      expect(screen.getByTestId('opponent-3')).toBeInTheDocument();
      expect(screen.queryByTestId('opponent-4')).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should call onAction with correct params for takeFood', () => {
      const handleAction = jest.fn();
      const gameState = createMockGameState(2);
      gameState.foodPool = 5;
      render(
        <GameBoard
          gameState={gameState}
          myPlayerId="player-1"
          currentPhase="feeding"
          currentPlayerIndex={0}
          onAction={handleAction}
        />
      );

      // Click food token
      fireEvent.click(screen.getByTestId('food-token-0'));

      expect(handleAction).toHaveBeenCalledWith('takeFood', {});
    });

    it('should call onAction with correct params for rollFood', () => {
      const handleAction = jest.fn();
      const gameState = createMockGameState(2);
      render(
        <GameBoard
          gameState={gameState}
          myPlayerId="player-1"
          currentPhase="food_supply"
          currentPlayerIndex={0}
          onAction={handleAction}
        />
      );

      // Click roll button
      fireEvent.click(screen.getByTestId('roll-button'));

      expect(handleAction).toHaveBeenCalledWith('rollFood', {});
    });
  });

  describe('Food Pool Integration', () => {
    it('should show roll button during food supply phase for first player', () => {
      const gameState = createMockGameState(2);
      render(
        <GameBoard
          gameState={gameState}
          myPlayerId="player-1"
          currentPhase="food_supply"
          currentPlayerIndex={0}
        />
      );

      expect(screen.getByTestId('roll-button')).toBeInTheDocument();
    });

    it('should not show roll button when not first player', () => {
      const gameState = createMockGameState(2);
      render(
        <GameBoard
          gameState={gameState}
          myPlayerId="player-1"
          currentPhase="food_supply"
          currentPlayerIndex={1}
        />
      );

      expect(screen.queryByTestId('roll-button')).not.toBeInTheDocument();
    });

    it('should allow taking food during feeding phase when my turn', () => {
      const gameState = createMockGameState(2);
      gameState.foodPool = 5;
      render(
        <GameBoard
          gameState={gameState}
          myPlayerId="player-1"
          currentPhase="feeding"
          currentPlayerIndex={0}
        />
      );

      expect(screen.getByTestId('food-hint')).toBeInTheDocument();
    });
  });
});
