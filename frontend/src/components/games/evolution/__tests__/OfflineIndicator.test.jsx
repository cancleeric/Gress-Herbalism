/**
 * OfflineIndicator 測試
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  OfflineIndicator,
  PlayerOfflineTag,
  OfflinePlayerList,
  OfflineBanner,
  OFFLINE_STATUS,
  formatTime,
} from '../OfflineIndicator';

describe('formatTime', () => {
  it('should format seconds only', () => {
    expect(formatTime(5000)).toBe('5s');
    expect(formatTime(1000)).toBe('1s');
    expect(formatTime(500)).toBe('1s'); // Rounds up
  });

  it('should format minutes and seconds', () => {
    expect(formatTime(60000)).toBe('1:00');
    expect(formatTime(90000)).toBe('1:30');
    expect(formatTime(125000)).toBe('2:05');
  });
});

describe('PlayerOfflineTag', () => {
  const onlinePlayer = {
    playerId: 'p1',
    status: OFFLINE_STATUS.ONLINE,
  };

  const offlinePlayer = {
    playerId: 'p2',
    status: OFFLINE_STATUS.TEMPORARILY_OFFLINE,
    disconnectedAt: Date.now(),
    timeout: 30000,
  };

  const forfeitedPlayer = {
    playerId: 'p3',
    status: OFFLINE_STATUS.FORFEITED,
  };

  it('should return null for online player', () => {
    const { container } = render(<PlayerOfflineTag player={onlinePlayer} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render offline tag', () => {
    render(<PlayerOfflineTag player={offlinePlayer} />);
    expect(screen.getByText(/離線/)).toBeInTheDocument();
  });

  it('should render forfeited tag', () => {
    render(<PlayerOfflineTag player={forfeitedPlayer} />);
    expect(screen.getByText(/已離開/)).toBeInTheDocument();
  });

  it('should render compact mode', () => {
    const { container } = render(
      <PlayerOfflineTag player={offlinePlayer} compact />
    );
    expect(container.querySelector('.offline-tag--compact')).toBeInTheDocument();
  });

  it('should show countdown', () => {
    jest.useFakeTimers();
    render(<PlayerOfflineTag player={offlinePlayer} />);

    expect(screen.getByText(/\(\d+s\)/)).toBeInTheDocument();
    jest.useRealTimers();
  });
});

describe('OfflinePlayerList', () => {
  const players = [
    { playerId: 'p1', playerName: 'Player 1', status: OFFLINE_STATUS.ONLINE },
    { playerId: 'p2', playerName: 'Player 2', status: OFFLINE_STATUS.TEMPORARILY_OFFLINE },
    { playerId: 'p3', playerName: 'Player 3', status: OFFLINE_STATUS.FORFEITED },
  ];

  it('should return null when no offline players', () => {
    const { container } = render(
      <OfflinePlayerList players={[players[0]]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render offline players only', () => {
    render(<OfflinePlayerList players={players} />);

    expect(screen.queryByText('Player 1')).not.toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
    expect(screen.getByText('Player 3')).toBeInTheDocument();
  });

  it('should render dismiss button', () => {
    const onDismiss = jest.fn();
    render(<OfflinePlayerList players={players} onDismiss={onDismiss} />);

    const dismissBtn = screen.getByLabelText('關閉');
    fireEvent.click(dismissBtn);

    expect(onDismiss).toHaveBeenCalled();
  });

  it('should not render dismiss button without callback', () => {
    render(<OfflinePlayerList players={players} />);
    expect(screen.queryByLabelText('關閉')).not.toBeInTheDocument();
  });

  it('should use playerId slice when no playerName', () => {
    const playersNoName = [
      { playerId: 'abcdefghijklmnop', status: OFFLINE_STATUS.TEMPORARILY_OFFLINE },
    ];
    render(<OfflinePlayerList players={playersNoName} />);
    expect(screen.getByText('abcdefgh')).toBeInTheDocument();
  });
});

describe('OfflineBanner', () => {
  const offlinePlayer = {
    status: OFFLINE_STATUS.TEMPORARILY_OFFLINE,
    disconnectedAt: Date.now(),
    timeout: 30000,
  };

  const forfeitedPlayer = {
    status: OFFLINE_STATUS.FORFEITED,
  };

  it('should return null for online player', () => {
    const { container } = render(
      <OfflineBanner player={{ status: OFFLINE_STATUS.ONLINE }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should return null when no player', () => {
    const { container } = render(<OfflineBanner player={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render offline banner', () => {
    render(<OfflineBanner player={offlinePlayer} />);
    expect(screen.getByText('連線中斷')).toBeInTheDocument();
  });

  it('should render forfeited banner', () => {
    render(<OfflineBanner player={forfeitedPlayer} />);
    expect(screen.getByText('你已被判定離開遊戲')).toBeInTheDocument();
  });

  it('should render retry button for offline', () => {
    const onRetry = jest.fn();
    render(<OfflineBanner player={offlinePlayer} onRetry={onRetry} />);

    const retryBtn = screen.getByText('重新連線');
    fireEvent.click(retryBtn);

    expect(onRetry).toHaveBeenCalled();
  });

  it('should not render retry button for forfeited', () => {
    const onRetry = jest.fn();
    render(<OfflineBanner player={forfeitedPlayer} onRetry={onRetry} />);
    expect(screen.queryByText('重新連線')).not.toBeInTheDocument();
  });

  it('should show countdown', () => {
    jest.useFakeTimers();
    render(<OfflineBanner player={offlinePlayer} />);

    expect(screen.getByText(/剩餘時間/)).toBeInTheDocument();
    jest.useRealTimers();
  });
});

describe('OfflineIndicator', () => {
  const players = [
    { playerId: 'p1', playerName: 'Player 1', status: OFFLINE_STATUS.ONLINE },
    { playerId: 'p2', playerName: 'Player 2', status: OFFLINE_STATUS.TEMPORARILY_OFFLINE },
  ];

  const currentOfflinePlayer = {
    status: OFFLINE_STATUS.TEMPORARILY_OFFLINE,
    disconnectedAt: Date.now(),
    timeout: 30000,
  };

  it('should render with default props', () => {
    const { container } = render(
      <OfflineIndicator
        players={players}
        currentPlayer={currentOfflinePlayer}
      />
    );
    expect(container.firstChild).toHaveClass('offline-indicator');
  });

  it('should render banner when showBanner is true', () => {
    render(
      <OfflineIndicator
        players={players}
        currentPlayer={currentOfflinePlayer}
        showBanner={true}
      />
    );
    expect(screen.getByText('連線中斷')).toBeInTheDocument();
  });

  it('should not render banner when showBanner is false', () => {
    render(
      <OfflineIndicator
        players={players}
        currentPlayer={currentOfflinePlayer}
        showBanner={false}
      />
    );
    expect(screen.queryByText('連線中斷')).not.toBeInTheDocument();
  });

  it('should render list when showList is true', () => {
    render(
      <OfflineIndicator
        players={players}
        showList={true}
      />
    );
    expect(screen.getByText('離線玩家')).toBeInTheDocument();
  });

  it('should not render list when showList is false', () => {
    render(
      <OfflineIndicator
        players={players}
        showList={false}
      />
    );
    expect(screen.queryByText('離線玩家')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <OfflineIndicator className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should pass onRetry to banner', () => {
    const onRetry = jest.fn();
    render(
      <OfflineIndicator
        currentPlayer={currentOfflinePlayer}
        onRetry={onRetry}
      />
    );

    fireEvent.click(screen.getByText('重新連線'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('should pass onDismissList to list', () => {
    const onDismiss = jest.fn();
    render(
      <OfflineIndicator
        players={players}
        onDismissList={onDismiss}
      />
    );

    fireEvent.click(screen.getByLabelText('關閉'));
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe('OFFLINE_STATUS constant', () => {
  it('should have all statuses', () => {
    expect(OFFLINE_STATUS.ONLINE).toBe('online');
    expect(OFFLINE_STATUS.TEMPORARILY_OFFLINE).toBe('temporarily_offline');
    expect(OFFLINE_STATUS.FORFEITED).toBe('forfeited');
  });
});
