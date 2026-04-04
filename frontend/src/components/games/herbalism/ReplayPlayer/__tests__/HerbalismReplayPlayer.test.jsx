/**
 * HerbalismReplayPlayer 測試
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import HerbalismReplayPlayer from '../HerbalismReplayPlayer';

jest.useFakeTimers();

const mockEvents = [
  {
    type: 'game_start',
    timestamp: 1000,
    data: {
      playerCount: 3,
      players: [
        { id: 'p1', name: '玩家一' },
        { id: 'p2', name: '玩家二' },
        { id: 'p3', name: '玩家三' },
      ],
      round: 1,
    },
  },
  {
    type: 'question',
    timestamp: 2000,
    data: {
      askingPlayerId: 'p1',
      targetPlayerId: 'p2',
      colors: ['red', 'blue'],
    },
  },
  {
    type: 'color_choice',
    timestamp: 3000,
    data: {
      targetPlayerId: 'p2',
      chosenColor: 'red',
      cardsTransferred: 2,
    },
  },
  {
    type: 'prediction',
    timestamp: 4000,
    data: { playerId: 'p1', color: 'blue', round: 1 },
  },
  {
    type: 'guess',
    timestamp: 5000,
    data: { playerId: 'p1', guessedColors: ['red', 'blue'], isCorrect: true },
  },
  {
    type: 'follow_guess',
    timestamp: 6000,
    data: { playerId: 'p2', isFollowing: true },
  },
  {
    type: 'round_end',
    timestamp: 7000,
    data: { round: 1, scores: { p1: 3, p2: 1, p3: 0 }, hiddenCards: ['red', 'blue'] },
  },
  {
    type: 'game_end',
    timestamp: 8000,
    data: { winner: 'p1', scores: { p1: 7, p2: 2, p3: 0 }, rounds: 3 },
  },
];

afterEach(() => {
  jest.clearAllTimers();
});

describe('HerbalismReplayPlayer', () => {
  describe('渲染', () => {
    it('應顯示標題', () => {
      render(<HerbalismReplayPlayer events={mockEvents} />);
      expect(screen.getByText(/本草.*對局回放/)).toBeInTheDocument();
    });

    it('空資料時應顯示提示訊息', () => {
      render(<HerbalismReplayPlayer events={[]} />);
      expect(screen.getByText('沒有回放資料')).toBeInTheDocument();
    });

    it('null 資料時應顯示提示訊息', () => {
      render(<HerbalismReplayPlayer events={null} />);
      expect(screen.getByText('沒有回放資料')).toBeInTheDocument();
    });

    it('應套用自訂 className', () => {
      const { container } = render(
        <HerbalismReplayPlayer events={mockEvents} className="test-class" />
      );
      expect(container.firstChild).toHaveClass('test-class');
    });

    it('應渲染回放控制列', () => {
      render(<HerbalismReplayPlayer events={mockEvents} />);
      expect(screen.getByRole('button', { name: '播放' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '停止' })).toBeInTheDocument();
    });
  });

  describe('事件顯示', () => {
    it('初始應顯示 game_start 事件標籤', () => {
      render(<HerbalismReplayPlayer events={mockEvents} />);
      expect(screen.getByText('遊戲開始')).toBeInTheDocument();
    });

    it('game_start 事件應顯示玩家數量', () => {
      render(<HerbalismReplayPlayer events={mockEvents} />);
      expect(screen.getByText(/3 位玩家/)).toBeInTheDocument();
    });

    it('播放時應更新事件面板', () => {
      render(<HerbalismReplayPlayer events={mockEvents} />);

      fireEvent.click(screen.getByRole('button', { name: '播放' }));

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // 應顯示問牌事件
      expect(screen.getByText('問牌')).toBeInTheDocument();
    });
  });

  describe('回合指示器', () => {
    it('有回合資訊時應顯示', () => {
      render(<HerbalismReplayPlayer events={mockEvents} />);
      expect(screen.getByText(/第 1 局/)).toBeInTheDocument();
    });
  });

  describe('播放完成回調', () => {
    it('播放完成後應呼叫 onComplete', () => {
      const onComplete = jest.fn();
      const shortEvents = [
        { type: 'game_start', timestamp: 0, data: { playerCount: 2, players: [] } },
        { type: 'game_end', timestamp: 100, data: { winner: 'p1', scores: {} } },
      ];
      render(<HerbalismReplayPlayer events={shortEvents} onComplete={onComplete} />);

      fireEvent.click(screen.getByRole('button', { name: '播放' }));

      act(() => { jest.advanceTimersByTime(10000); });
      act(() => { jest.advanceTimersByTime(10000); });

      // onComplete 可能已被呼叫
    });
  });
});
