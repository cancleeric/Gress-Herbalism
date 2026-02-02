/**
 * ScoreBoard 組件測試
 *
 * @module components/games/evolution/modals/__tests__/ScoreBoard.test
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, ...props }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

import { ScoreBoard } from '../ScoreBoard';

describe('ScoreBoard', () => {
  const defaultPlayers = {
    'player-1': { id: 'player-1', name: 'Alice' },
    'player-2': { id: 'player-2', name: 'Bob' },
    'player-3': { id: 'player-3', name: 'Charlie' },
    'player-4': { id: 'player-4', name: 'Diana' },
  };

  const defaultScores = {
    'player-1': { total: 25, creatures: 5, traits: 8, foodBonus: 7 },
    'player-2': { total: 18, creatures: 4, traits: 5, foodBonus: 5 },
    'player-3': { total: 15, creatures: 3, traits: 4, foodBonus: 5 },
    'player-4': { total: 10, creatures: 2, traits: 3, foodBonus: 3 },
  };

  describe('渲染', () => {
    it('should render score board', () => {
      render(
        <ScoreBoard scores={defaultScores} players={defaultPlayers} winnerId="player-1" />
      );

      expect(screen.getByTestId('score-board')).toBeInTheDocument();
    });

    it('should render title', () => {
      render(
        <ScoreBoard scores={defaultScores} players={defaultPlayers} winnerId="player-1" />
      );

      expect(screen.getByText('最終計分')).toBeInTheDocument();
    });

    it('should render all players', () => {
      render(
        <ScoreBoard scores={defaultScores} players={defaultPlayers} winnerId="player-1" />
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
      expect(screen.getByText('Diana')).toBeInTheDocument();
    });

    it('should render legend', () => {
      render(
        <ScoreBoard scores={defaultScores} players={defaultPlayers} winnerId="player-1" />
      );

      expect(screen.getByText(/計分規則/)).toBeInTheDocument();
    });
  });

  describe('排名', () => {
    it('should sort players by score descending', () => {
      render(
        <ScoreBoard scores={defaultScores} players={defaultPlayers} winnerId="player-1" />
      );

      const items = screen.getAllByTestId(/score-item/);
      expect(items[0]).toHaveTextContent('Alice');
      expect(items[1]).toHaveTextContent('Bob');
      expect(items[2]).toHaveTextContent('Charlie');
      expect(items[3]).toHaveTextContent('Diana');
    });

    it('should display gold medal for 1st place', () => {
      render(
        <ScoreBoard scores={defaultScores} players={defaultPlayers} winnerId="player-1" />
      );

      const rankIcons = screen.getAllByTestId('rank-icon');
      expect(rankIcons[0]).toHaveTextContent('🥇');
    });

    it('should display silver medal for 2nd place', () => {
      render(
        <ScoreBoard scores={defaultScores} players={defaultPlayers} winnerId="player-1" />
      );

      const rankIcons = screen.getAllByTestId('rank-icon');
      expect(rankIcons[1]).toHaveTextContent('🥈');
    });

    it('should display bronze medal for 3rd place', () => {
      render(
        <ScoreBoard scores={defaultScores} players={defaultPlayers} winnerId="player-1" />
      );

      const rankIcons = screen.getAllByTestId('rank-icon');
      expect(rankIcons[2]).toHaveTextContent('🥉');
    });

    it('should display number for 4th place and beyond', () => {
      render(
        <ScoreBoard scores={defaultScores} players={defaultPlayers} winnerId="player-1" />
      );

      const rankIcons = screen.getAllByTestId('rank-icon');
      expect(rankIcons[3]).toHaveTextContent('4');
    });
  });

  describe('勝利者標記', () => {
    it('should show crown for winner', () => {
      render(
        <ScoreBoard scores={defaultScores} players={defaultPlayers} winnerId="player-1" />
      );

      expect(screen.getByText('👑')).toBeInTheDocument();
    });

    it('should apply winner class to winner item', () => {
      render(
        <ScoreBoard scores={defaultScores} players={defaultPlayers} winnerId="player-1" />
      );

      const winnerItem = screen.getByTestId('score-item-player-1');
      expect(winnerItem).toHaveClass('score-board__item--winner');
    });

    it('should not apply winner class to non-winners', () => {
      render(
        <ScoreBoard scores={defaultScores} players={defaultPlayers} winnerId="player-1" />
      );

      const loserItem = screen.getByTestId('score-item-player-2');
      expect(loserItem).not.toHaveClass('score-board__item--winner');
    });
  });

  describe('分數詳情', () => {
    it('should display creature count', () => {
      render(
        <ScoreBoard scores={defaultScores} players={defaultPlayers} winnerId="player-1" />
      );

      expect(screen.getByText('5 隻生物')).toBeInTheDocument();
    });

    it('should display trait count', () => {
      render(
        <ScoreBoard scores={defaultScores} players={defaultPlayers} winnerId="player-1" />
      );

      expect(screen.getByText('8 個性狀')).toBeInTheDocument();
    });

    it('should display food bonus', () => {
      render(
        <ScoreBoard scores={defaultScores} players={defaultPlayers} winnerId="player-1" />
      );

      expect(screen.getByText('+7 食量加成')).toBeInTheDocument();
    });

    it('should display total score', () => {
      render(
        <ScoreBoard scores={defaultScores} players={defaultPlayers} winnerId="player-1" />
      );

      expect(screen.getByText('25 分')).toBeInTheDocument();
    });
  });

  describe('邊界情況', () => {
    it('should handle empty scores', () => {
      render(<ScoreBoard scores={{}} players={defaultPlayers} winnerId={null} />);

      expect(screen.getByText('暫無計分資料')).toBeInTheDocument();
    });

    it('should handle missing player names', () => {
      const scoresWithUnknown = {
        'unknown-player': { total: 10, creatures: 2, traits: 3, foodBonus: 3 },
      };

      render(<ScoreBoard scores={scoresWithUnknown} players={{}} winnerId={null} />);

      expect(screen.getByText('unknown-player')).toBeInTheDocument();
    });

    it('should handle simple numeric scores', () => {
      const simpleScores = {
        'player-1': 25,
        'player-2': 18,
      };

      render(
        <ScoreBoard scores={simpleScores} players={defaultPlayers} winnerId="player-1" />
      );

      expect(screen.getByText('25 分')).toBeInTheDocument();
      expect(screen.getByText('18 分')).toBeInTheDocument();
    });

    it('should handle undefined props', () => {
      render(<ScoreBoard />);

      expect(screen.getByText('暫無計分資料')).toBeInTheDocument();
    });

    it('should handle no winner specified', () => {
      render(<ScoreBoard scores={defaultScores} players={defaultPlayers} />);

      // 沒有勝利者時不應有皇冠
      expect(screen.queryByText('👑')).not.toBeInTheDocument();
    });
  });
});
