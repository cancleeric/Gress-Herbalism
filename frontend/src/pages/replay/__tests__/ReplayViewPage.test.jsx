/**
 * ReplayViewPage 測試
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock firebase auth
jest.mock('../../../firebase', () => ({
  useAuth: () => ({ user: { uid: 'test-user-123' }, isLoggedIn: true }),
}));

// Mock replayApi
jest.mock('../../../services/replayApi', () => ({
  getEvolutionReplay: jest.fn(),
  getHerbalismReplay: jest.fn(),
}));

// Mock ReplayPlayer
jest.mock('../../../components/games/evolution/replay/ReplayPlayer', () => {
  const MockReplayPlayer = ({ events, onEventPlay }) => (
    <div data-testid="replay-player">
      <span data-testid="event-count">{events?.length || 0} events</span>
      <button
        data-testid="trigger-event"
        onClick={() => onEventPlay?.(events?.[0], 0)}
      >
        Trigger Event
      </button>
    </div>
  );
  return MockReplayPlayer;
});

const { getEvolutionReplay, getHerbalismReplay } = require('../../../services/replayApi');

import ReplayViewPage from '../ReplayViewPage';

const mockEvolutionEvents = [
  { type: 'game_start', timestamp: 1000, data: { playerCount: 2 } },
  { type: 'attack', timestamp: 2000, data: { attackerId: 'p1', targetId: 'p2', success: true }, isKeyMoment: true },
  { type: 'game_end', timestamp: 3000, data: {} },
];

const mockHerbalismEvents = [
  { type: 'game_start', timestamp: 1000, data: { playerCount: 3 } },
  { type: 'ask_card', timestamp: 2000, data: { askingPlayerId: 'p1', targetPlayerId: 'p2', round: 1 } },
  { type: 'guess_result', timestamp: 3000, data: { isCorrect: true }, isKeyMoment: true },
  { type: 'game_end', timestamp: 4000, data: { scores: { p1: 10 } } },
];

function renderWithRoute(gameId = 'test-game-id', queryType = 'evolution') {
  return render(
    <MemoryRouter initialEntries={[`/replay/${gameId}?type=${queryType}`]}>
      <Routes>
        <Route path="/replay/:gameId" element={<ReplayViewPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ReplayViewPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    getEvolutionReplay.mockReturnValue(new Promise(() => {}));
    renderWithRoute();
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('shows replay player on success (evolution)', async () => {
    getEvolutionReplay.mockResolvedValue({
      success: true,
      data: { events: mockEvolutionEvents },
    });

    renderWithRoute('test-game-id', 'evolution');

    await waitFor(() => {
      expect(screen.getByTestId('replay-player')).toBeInTheDocument();
    });
  });

  it('shows event count in replay player', async () => {
    getEvolutionReplay.mockResolvedValue({
      success: true,
      data: { events: mockEvolutionEvents },
    });

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByTestId('event-count')).toHaveTextContent('3 events');
    });
  });

  it('shows error message when replay not found', async () => {
    getEvolutionReplay.mockResolvedValue({ success: false });

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  it('shows error message on fetch failure', async () => {
    getEvolutionReplay.mockRejectedValue(new Error('Network error'));

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  it('calls herbalism replay API for herbalism type', async () => {
    getHerbalismReplay.mockResolvedValue({
      success: true,
      data: { events: mockHerbalismEvents },
    });

    renderWithRoute('test-game-id', 'herbalism');

    await waitFor(() => {
      expect(getHerbalismReplay).toHaveBeenCalledWith('test-game-id');
    });
  });

  it('shows event log when events are played', async () => {
    getEvolutionReplay.mockResolvedValue({
      success: true,
      data: { events: mockEvolutionEvents },
    });

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByTestId('replay-player')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('trigger-event'));

    await waitFor(() => {
      expect(screen.getByTestId('current-event')).toBeInTheDocument();
    });
  });

  it('has a share button', async () => {
    getEvolutionReplay.mockResolvedValue({
      success: true,
      data: { events: mockEvolutionEvents },
    });

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByTestId('share-btn')).toBeInTheDocument();
    });
  });

  it('shows page title with game type', async () => {
    getEvolutionReplay.mockResolvedValue({
      success: true,
      data: { events: mockEvolutionEvents },
    });

    renderWithRoute('test-game-id', 'evolution');

    await waitFor(() => {
      expect(screen.getByText(/演化論/)).toBeInTheDocument();
    });
  });

  it('shows herbalism title for herbalism type', async () => {
    getHerbalismReplay.mockResolvedValue({
      success: true,
      data: { events: mockHerbalismEvents },
    });

    renderWithRoute('test-game-id', 'herbalism');

    await waitFor(() => {
      expect(screen.getByText(/本草/)).toBeInTheDocument();
    });
  });
});
