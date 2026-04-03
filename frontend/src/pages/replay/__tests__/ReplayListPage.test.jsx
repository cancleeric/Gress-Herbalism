/**
 * ReplayListPage 測試
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock firebase auth
jest.mock('../../../firebase', () => ({
  useAuth: () => ({ user: { uid: 'test-user-123' }, isLoggedIn: true }),
}));

// Mock replayApi
jest.mock('../../../services/replayApi', () => ({
  getEvolutionGameHistory: jest.fn(),
}));

const { getEvolutionGameHistory } = require('../../../services/replayApi');

import ReplayListPage from '../ReplayListPage';

const mockHistory = [
  {
    id: 'record-1',
    game_id: 'game-aabbccdd1122',
    game: {
      id: 'game-aabbccdd1122',
      status: 'finished',
      started_at: '2024-01-15T10:00:00Z',
    },
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'record-2',
    game_id: 'game-eeffeeff3344',
    game: {
      id: 'game-eeffeeff3344',
      status: 'finished',
      started_at: '2024-01-16T12:00:00Z',
    },
    created_at: '2024-01-16T12:00:00Z',
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ReplayListPage />
    </MemoryRouter>
  );
}

describe('ReplayListPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    getEvolutionGameHistory.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('shows game history cards on success', async () => {
    getEvolutionGameHistory.mockResolvedValue({ success: true, data: mockHistory });
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByTestId('game-history-card')).toHaveLength(2);
    });
  });

  it('shows empty state when no history', async () => {
    getEvolutionGameHistory.mockResolvedValue({ success: true, data: [] });
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('shows error message on failure', async () => {
    getEvolutionGameHistory.mockRejectedValue(new Error('Network error'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  it('shows watch replay button for each game', async () => {
    getEvolutionGameHistory.mockResolvedValue({ success: true, data: mockHistory });
    renderPage();

    await waitFor(() => {
      const buttons = screen.getAllByTestId('watch-replay-btn');
      expect(buttons).toHaveLength(2);
    });
  });

  it('renders page title', async () => {
    getEvolutionGameHistory.mockResolvedValue({ success: true, data: [] });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/我的對局歷史/)).toBeInTheDocument();
    });
  });
});
