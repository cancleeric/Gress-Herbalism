/**
 * ReplayViewer 測試
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ReplayViewer from '../ReplayViewer';
import * as apiService from '../../../../services/apiService';

// Mock apiService
jest.mock('../../../../services/apiService', () => ({
  getReplay: jest.fn(),
}));

// Mock ReplayPlayer to simplify testing
jest.mock('../../../games/evolution/replay/ReplayPlayer', () => {
  const MockReplayPlayer = ({ events, onEventPlay, onComplete }) => (
    <div data-testid="replay-player">
      <span data-testid="event-count">{events?.length || 0}</span>
      <button
        data-testid="trigger-event"
        onClick={() => onEventPlay && onEventPlay({ type: 'attack', timestamp: 2000, data: { attackerId: 'p1' } }, 1)}
      >
        觸發事件
      </button>
      <button data-testid="trigger-complete" onClick={() => onComplete && onComplete()}>
        完成
      </button>
    </div>
  );
  return MockReplayPlayer;
});

const mockReplayData = {
  gameId: 'test-game-123',
  events: [
    { type: 'game_start', timestamp: 1000, data: { playerCount: 2 } },
    { type: 'attack', timestamp: 2000, data: { attackerId: 'p1' } },
    { type: 'game_end', timestamp: 3000, data: { winner: 'p1' } },
  ],
  createdAt: '2024-01-15T12:00:00Z',
  sizeBytes: 512,
};

function renderWithRouter(gameId = 'test-game-123') {
  return render(
    <MemoryRouter initialEntries={[`/replay/${gameId}`]}>
      <Routes>
        <Route path="/replay/:gameId" element={<ReplayViewer />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ReplayViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
  });

  describe('載入狀態', () => {
    it('should show loading indicator initially', () => {
      apiService.getReplay.mockReturnValue(new Promise(() => {})); // never resolves
      renderWithRouter();
      expect(screen.getByText('載入回放中...')).toBeInTheDocument();
    });

    it('should show error when replay not found', async () => {
      apiService.getReplay.mockResolvedValue({ success: false });
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('找不到回放資料')).toBeInTheDocument();
      });
    });

    it('should show error on network failure', async () => {
      apiService.getReplay.mockRejectedValue(new Error('Network error'));
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('載入回放失敗，請稍後再試')).toBeInTheDocument();
      });
    });
  });

  describe('回放顯示', () => {
    beforeEach(() => {
      apiService.getReplay.mockResolvedValue({ success: true, data: mockReplayData });
    });

    it('should render replay player with events', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByTestId('replay-player')).toBeInTheDocument();
      });
      expect(screen.getByTestId('event-count')).toHaveTextContent('3');
    });

    it('should show game id', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText(/test-game-123/)).toBeInTheDocument();
      });
    });

    it('should show event count', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText(/共 3 個事件/)).toBeInTheDocument();
      });
    });

    it('should show page title', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('🎬 對局回放')).toBeInTheDocument();
      });
    });
  });

  describe('分享功能', () => {
    beforeEach(() => {
      apiService.getReplay.mockResolvedValue({ success: true, data: mockReplayData });
    });

    it('should show share button', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('🔗 分享連結')).toBeInTheDocument();
      });
    });

    it('should copy URL on share click', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('🔗 分享連結')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('🔗 分享連結'));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
    });

    it('should show copied confirmation', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('🔗 分享連結')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('🔗 分享連結'));
      await waitFor(() => {
        expect(screen.getByText('✓ 已複製！')).toBeInTheDocument();
      });
    });
  });

  describe('事件面板', () => {
    beforeEach(() => {
      apiService.getReplay.mockResolvedValue({ success: true, data: mockReplayData });
    });

    it('should show event log section', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('事件紀錄')).toBeInTheDocument();
      });
    });

    it('should show empty log message initially', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('點擊播放開始回放')).toBeInTheDocument();
      });
    });

    it('should update event log when event is played', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByTestId('replay-player')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('trigger-event'));

      await waitFor(() => {
        expect(screen.getAllByText('⚔️ 攻擊').length).toBeGreaterThan(0);
      });
    });
  });
});
