/**
 * ReplayList 測試
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReplayList, { GAME_TYPE_FILTER } from '../ReplayList';

// Mock useAuth
let mockUser = { uid: 'test-uid-123' };
jest.mock('../../../../firebase/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock apiService
jest.mock('../../../../services/apiService', () => ({
  getPlayerHistory: jest.fn(),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const { getPlayerHistory } = require('../../../../services/apiService');

const mockHistory = [
  {
    game_id: 'game_herb_001',
    game_type: 'herbalism',
    played_at: '2026-01-15T10:00:00Z',
  },
  {
    game_id: 'game_evo_001',
    game_type: 'evolution',
    played_at: '2026-01-16T12:00:00Z',
  },
  {
    game_id: 'game_herb_002',
    game_type: 'herbalism',
    played_at: '2026-01-17T09:00:00Z',
  },
];

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ReplayList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { uid: 'test-uid-123' };
    getPlayerHistory.mockResolvedValue({ data: mockHistory });
  });

  describe('渲染', () => {
    it('應顯示標題', async () => {
      renderWithRouter(<ReplayList />);
      expect(screen.getByText('我的對局回放')).toBeInTheDocument();
    });

    it('初始應顯示載入中', () => {
      getPlayerHistory.mockReturnValue(new Promise(() => {})); // 永不 resolve
      renderWithRouter(<ReplayList />);
      expect(screen.getByText('載入中…')).toBeInTheDocument();
    });

    it('載入後應顯示對局列表', async () => {
      renderWithRouter(<ReplayList />);
      await waitFor(() => {
        expect(screen.getByText('game_herb_001')).toBeInTheDocument();
      });
    });

    it('API 錯誤時應顯示錯誤訊息', async () => {
      getPlayerHistory.mockRejectedValue(new Error('Network error'));
      renderWithRouter(<ReplayList />);
      await waitFor(() => {
        expect(screen.getByText(/無法載入對局歷史/)).toBeInTheDocument();
      });
    });

    it('無對局時應顯示空狀態', async () => {
      getPlayerHistory.mockResolvedValue({ data: [] });
      renderWithRouter(<ReplayList />);
      await waitFor(() => {
        expect(screen.getByText('尚無對局紀錄')).toBeInTheDocument();
      });
    });
  });

  describe('篩選標籤', () => {
    it('應顯示所有篩選標籤', async () => {
      renderWithRouter(<ReplayList />);
      await waitFor(() => screen.getByText('game_herb_001'));

      expect(screen.getByRole('tab', { name: '全部' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /本草/ })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /演化論/ })).toBeInTheDocument();
    });

    it('「全部」標籤預設為啟用', async () => {
      renderWithRouter(<ReplayList />);
      await waitFor(() => screen.getByText('game_herb_001'));

      expect(screen.getByRole('tab', { name: '全部' })).toHaveClass('replay-list__tab--active');
    });

    it('點擊本草標籤應只顯示本草對局', async () => {
      renderWithRouter(<ReplayList />);
      await waitFor(() => screen.getByText('game_herb_001'));

      fireEvent.click(screen.getByRole('tab', { name: /本草/ }));

      expect(screen.getByText('game_herb_001')).toBeInTheDocument();
      expect(screen.queryByText('game_evo_001')).not.toBeInTheDocument();
    });

    it('點擊演化論標籤應只顯示演化論對局', async () => {
      renderWithRouter(<ReplayList />);
      await waitFor(() => screen.getByText('game_herb_001'));

      fireEvent.click(screen.getByRole('tab', { name: /演化論/ }));

      expect(screen.getByText('game_evo_001')).toBeInTheDocument();
      expect(screen.queryByText('game_herb_001')).not.toBeInTheDocument();
    });
  });

  describe('觀看按鈕', () => {
    it('應有觀看按鈕', async () => {
      renderWithRouter(<ReplayList />);
      await waitFor(() => screen.getByText('game_herb_001'));

      const watchBtns = screen.getAllByText(/▶ 觀看/);
      expect(watchBtns.length).toBeGreaterThan(0);
    });

    it('點擊觀看應導向回放頁面', async () => {
      renderWithRouter(<ReplayList />);
      await waitFor(() => screen.getByText('game_herb_001'));

      const watchBtns = screen.getAllByText(/▶ 觀看/);
      fireEvent.click(watchBtns[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/replay/herbalism/game_herb_001');
    });
  });

  describe('分享按鈕', () => {
    it('應有分享按鈕', async () => {
      renderWithRouter(<ReplayList />);
      await waitFor(() => screen.getByText('game_herb_001'));

      const shareBtns = screen.getAllByText(/🔗 分享/);
      expect(shareBtns.length).toBeGreaterThan(0);
    });

    it('點擊分享應複製連結', async () => {
      Object.assign(navigator, {
        clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
      });
      Object.defineProperty(window, 'isSecureContext', { value: true, writable: true });

      renderWithRouter(<ReplayList />);
      await waitFor(() => screen.getByText('game_herb_001'));

      const shareBtns = screen.getAllByText(/🔗 分享/);
      fireEvent.click(shareBtns[0]);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('game_herb_001')
        );
      });
    });
  });

  describe('GAME_TYPE_FILTER 常數', () => {
    it('應匯出正確的篩選常數', () => {
      expect(GAME_TYPE_FILTER.ALL).toBe('all');
      expect(GAME_TYPE_FILTER.HERBALISM).toBe('herbalism');
      expect(GAME_TYPE_FILTER.EVOLUTION).toBe('evolution');
    });
  });

  describe('未登入', () => {
    it('未登入時不應呼叫 API', async () => {
      mockUser = null;
      renderWithRouter(<ReplayList />);

      await waitFor(() => {
        expect(screen.queryByText('載入中…')).not.toBeInTheDocument();
      });

      expect(getPlayerHistory).not.toHaveBeenCalled();
    });
  });
});

