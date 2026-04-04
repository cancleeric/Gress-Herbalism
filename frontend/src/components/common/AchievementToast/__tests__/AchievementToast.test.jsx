/**
 * AchievementToast 測試
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AchievementToast, { AchievementToastItem } from '../AchievementToast';

describe('AchievementToastItem', () => {
  const mockDismiss = jest.fn();

  const achievement = {
    id: 'first_win',
    name: '初嚐勝果',
    icon: '🏆',
    points: 10,
  };

  beforeEach(() => {
    mockDismiss.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders achievement icon and name', () => {
    render(<AchievementToastItem achievement={achievement} onDismiss={mockDismiss} />);
    expect(screen.getByText('🏆')).toBeInTheDocument();
    expect(screen.getByText('初嚐勝果')).toBeInTheDocument();
  });

  it('renders "成就解鎖！" title', () => {
    render(<AchievementToastItem achievement={achievement} onDismiss={mockDismiss} />);
    expect(screen.getByText('🏅 成就解鎖！')).toBeInTheDocument();
  });

  it('renders points when provided', () => {
    render(<AchievementToastItem achievement={achievement} onDismiss={mockDismiss} />);
    expect(screen.getByText('+10 點')).toBeInTheDocument();
  });

  it('does not render points when not provided', () => {
    const noPoints = { id: 'a', name: '測試', icon: '🎯' };
    render(<AchievementToastItem achievement={noPoints} onDismiss={mockDismiss} />);
    expect(screen.queryByText(/點/)).not.toBeInTheDocument();
  });

  it('calls onDismiss when close button clicked', () => {
    render(<AchievementToastItem achievement={achievement} onDismiss={mockDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: '關閉通知' }));
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when toast is clicked', () => {
    render(<AchievementToastItem achievement={achievement} onDismiss={mockDismiss} />);
    fireEvent.click(screen.getByRole('alert'));
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after default duration (4000ms)', () => {
    render(<AchievementToastItem achievement={achievement} onDismiss={mockDismiss} />);
    expect(mockDismiss).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(4000));
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after custom duration', () => {
    render(
      <AchievementToastItem achievement={achievement} onDismiss={mockDismiss} duration={2000} />
    );
    act(() => jest.advanceTimersByTime(1999));
    expect(mockDismiss).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1));
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('has role="alert" for accessibility', () => {
    render(<AchievementToastItem achievement={achievement} onDismiss={mockDismiss} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('AchievementToast (container)', () => {
  const mockDismiss = jest.fn();

  beforeEach(() => {
    mockDismiss.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const toasts = [
    { id: 'toast-1', name: '初嚐勝果', icon: '🏆', points: 10 },
    { id: 'toast-2', name: '老手', icon: '🎮', points: 20 },
  ];

  it('renders nothing when toasts is empty', () => {
    const { container } = render(<AchievementToast toasts={[]} onDismiss={mockDismiss} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when toasts is null', () => {
    const { container } = render(<AchievementToast toasts={null} onDismiss={mockDismiss} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders multiple toasts', () => {
    render(<AchievementToast toasts={toasts} onDismiss={mockDismiss} />);
    expect(screen.getByText('初嚐勝果')).toBeInTheDocument();
    expect(screen.getByText('老手')).toBeInTheDocument();
  });

  it('calls onDismiss with correct toast id', () => {
    render(<AchievementToast toasts={toasts} onDismiss={mockDismiss} />);
    const closeButtons = screen.getAllByRole('button', { name: '關閉通知' });
    fireEvent.click(closeButtons[0]);
    expect(mockDismiss).toHaveBeenCalledWith('toast-1');
  });

  it('renders container with aria-label', () => {
    render(<AchievementToast toasts={toasts} onDismiss={mockDismiss} />);
    expect(screen.getByLabelText('成就通知')).toBeInTheDocument();
  });
});
