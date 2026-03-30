/**
 * ReplayList 測試
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReplayList from '../ReplayList';
import * as apiService from '../../../../services/apiService';
import { useAuth } from '../../../../firebase';

// Mock apiService
jest.mock('../../../../services/apiService', () => ({
  getPlayerHistory: jest.fn(),
}));

// Mock firebase auth
jest.mock('../../../../firebase', () => ({
  useAuth: jest.fn(),
}));

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockHistory = [
  {
    game_id: 'game-001',
    game_type: 'evolution',
    is_winner: true,
    score: 15,
    created_at: '2024-01-15T12:00:00Z',
  },
  {
    game_id: 'game-002',
    game_type: 'herbalism',
    is_winner: false,
    score: 5,
    created_at: '2024-01-14T10:00:00Z',
  },
  {
    game_id: null, // no replay
    game_type: 'evolution',
    is_winner: false,
    score: 3,
    created_at: '2024-01-13T09:00:00Z',
  },
];

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <ReplayList />
    </MemoryRouter>
  );
}

describe('ReplayList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: { uid: 'test-uid' } });
  });

  describe('載入狀態', () => {
    it('should show loading indicator initially', () => {
      apiService.getPlayerHistory.mockReturnValue(new Promise(() => {}));
      renderWithRouter();
      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    it('should show error on failure', async () => {
      apiService.getPlayerHistory.mockRejectedValue(new Error('Network error'));
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('載入歷史記錄失敗，請稍後再試')).toBeInTheDocument();
      });
    });
  });

  describe('空狀態', () => {
    it('should show empty message when no history', async () => {
      apiService.getPlayerHistory.mockResolvedValue({ success: true, data: [] });
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('尚無對局記錄')).toBeInTheDocument();
      });
    });

    it('should show play button in empty state', async () => {
      apiService.getPlayerHistory.mockResolvedValue({ success: true, data: [] });
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('開始遊戲')).toBeInTheDocument();
      });
    });
  });

  describe('歷史記錄顯示', () => {
    beforeEach(() => {
      apiService.getPlayerHistory.mockResolvedValue({ success: true, data: mockHistory });
    });

    it('should show page title', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('🎬 我的對局記錄')).toBeInTheDocument();
      });
    });

    it('should show record count', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText(/共 3 筆對局記錄/)).toBeInTheDocument();
      });
    });

    it('should show win/loss indicators', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('🏆 勝利')).toBeInTheDocument();
        expect(screen.getAllByText('😔 落敗')).toHaveLength(2);
      });
    });

    it('should show game type badges', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getAllByText('演化論').length).toBeGreaterThan(0);
        expect(screen.getByText('本草')).toBeInTheDocument();
      });
    });

    it('should show replay buttons for games with game_id', async () => {
      renderWithRouter();
      await waitFor(() => {
        const replayBtns = screen.getAllByText('🎬 回放');
        expect(replayBtns).toHaveLength(2); // 2 records have game_id
      });
    });

    it('should show no-replay label when game_id is null', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('無回放')).toBeInTheDocument();
      });
    });
  });

  describe('導航', () => {
    beforeEach(() => {
      apiService.getPlayerHistory.mockResolvedValue({ success: true, data: mockHistory });
    });

    it('should navigate to replay viewer on replay click', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getAllByText('🎬 回放')[0]).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('🎬 回放')[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/replay/game-001');
    });

    it('should navigate back on back button click', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('← 返回')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('← 返回'));
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('API 呼叫', () => {
    it('should fetch history with correct uid', async () => {
      apiService.getPlayerHistory.mockResolvedValue({ success: true, data: [] });
      renderWithRouter();
      await waitFor(() => {
        expect(apiService.getPlayerHistory).toHaveBeenCalledWith('test-uid', 20);
      });
    });
  });
});
