/**
 * AchievementList 測試
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AchievementList, { AchievementCard } from '../AchievementList';

const mockAchievements = [
  {
    id: 'first_game',
    name: '初試啼聲',
    description: '完成第一場遊戲',
    icon: '🎮',
    points: 10,
    rarity: 'common',
    category: 'milestone',
    condition: { type: 'games_played', value: 1 },
    progress: 100,
    currentValue: 1,
    unlocked: true,
  },
  {
    id: 'champion',
    name: '冠軍',
    description: '贏得 10 場遊戲',
    icon: '👑',
    points: 50,
    rarity: 'rare',
    category: 'milestone',
    condition: { type: 'games_won', value: 10 },
    progress: 70,
    currentValue: 7,
    unlocked: false,
  },
  {
    id: 'carnivore_king',
    name: '肉食之王',
    description: '單場擊殺 5 隻',
    icon: '🦖',
    points: 30,
    rarity: 'rare',
    category: 'gameplay',
    condition: { type: 'kills_in_game', value: 5 },
    progress: 0,
    currentValue: 0,
    unlocked: false,
  },
  {
    id: 'perfect_game',
    name: '完美遊戲',
    description: '贏且所有生物吃飽',
    icon: '✨',
    points: 100,
    rarity: 'legendary',
    category: 'special',
    condition: { type: 'perfect_game', value: true },
    progress: 0,
    unlocked: false,
  },
];

describe('AchievementList', () => {
  it('should render all achievements by default', () => {
    render(<AchievementList achievements={mockAchievements} onSelect={jest.fn()} />);
    expect(screen.getByText('初試啼聲')).toBeInTheDocument();
    expect(screen.getByText('冠軍')).toBeInTheDocument();
    expect(screen.getByText('肉食之王')).toBeInTheDocument();
    expect(screen.getByText('完美遊戲')).toBeInTheDocument();
  });

  it('should render summary with unlocked count', () => {
    render(<AchievementList achievements={mockAchievements} onSelect={jest.fn()} />);
    expect(screen.getByText('1 / 4 已解鎖')).toBeInTheDocument();
  });

  it('should render overall progress bar', () => {
    render(<AchievementList achievements={mockAchievements} onSelect={jest.fn()} />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars.length).toBeGreaterThan(0);
  });

  it('should render category tabs', () => {
    render(<AchievementList achievements={mockAchievements} onSelect={jest.fn()} />);
    expect(screen.getByRole('tab', { name: /全部/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /里程碑/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /遊戲玩法/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /特殊成就/ })).toBeInTheDocument();
  });

  it('should not render tab for empty category', () => {
    render(<AchievementList achievements={mockAchievements} onSelect={jest.fn()} />);
    expect(screen.queryByRole('tab', { name: /收集類/ })).not.toBeInTheDocument();
  });

  it('should filter by category when tab clicked', () => {
    render(<AchievementList achievements={mockAchievements} onSelect={jest.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: /遊戲玩法/ }));
    expect(screen.getByText('肉食之王')).toBeInTheDocument();
    expect(screen.queryByText('冠軍')).not.toBeInTheDocument();
  });

  it('should show all when 全部 tab clicked', () => {
    render(<AchievementList achievements={mockAchievements} onSelect={jest.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: /里程碑/ }));
    fireEvent.click(screen.getByRole('tab', { name: /全部/ }));
    expect(screen.getByText('肉食之王')).toBeInTheDocument();
    expect(screen.getByText('冠軍')).toBeInTheDocument();
  });

  it('should call onSelect when achievement card clicked', () => {
    const onSelect = jest.fn();
    render(<AchievementList achievements={mockAchievements} onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText('初試啼聲 (已解鎖)'));
    expect(onSelect).toHaveBeenCalledWith(mockAchievements[0]);
  });

  it('should show empty message when category has no achievements', () => {
    render(<AchievementList achievements={[]} onSelect={jest.fn()} />);
    expect(screen.getByText('此類別暫無成就')).toBeInTheDocument();
  });

  it('should handle null achievements', () => {
    render(<AchievementList achievements={null} onSelect={jest.fn()} />);
    expect(screen.getByText('0 / 0 已解鎖')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <AchievementList achievements={mockAchievements} onSelect={jest.fn()} className="custom" />
    );
    expect(container.firstChild).toHaveClass('achievement-list');
    expect(container.firstChild).toHaveClass('custom');
  });
});

describe('AchievementCard', () => {
  const unlocked = {
    id: 'first_game',
    name: '初試啼聲',
    description: '完成第一場遊戲',
    icon: '🎮',
    points: 10,
    rarity: 'common',
    category: 'milestone',
    condition: { type: 'games_played', value: 1 },
    progress: 100,
    currentValue: 1,
    unlocked: true,
  };

  const locked = {
    id: 'champion',
    name: '冠軍',
    description: '贏得 10 場遊戲',
    icon: '👑',
    points: 50,
    rarity: 'rare',
    category: 'milestone',
    condition: { type: 'games_won', value: 10 },
    progress: 70,
    currentValue: 7,
    unlocked: false,
  };

  it('should render icon for unlocked achievement', () => {
    render(<AchievementCard achievement={unlocked} onClick={jest.fn()} />);
    expect(screen.getByText('🎮')).toBeInTheDocument();
  });

  it('should render locked icon for locked achievement', () => {
    render(<AchievementCard achievement={locked} onClick={jest.fn()} />);
    expect(screen.getByText('🔒')).toBeInTheDocument();
  });

  it('should show points for unlocked achievement', () => {
    render(<AchievementCard achievement={unlocked} onClick={jest.fn()} />);
    expect(screen.getByText('+10')).toBeInTheDocument();
  });

  it('should show progress for locked achievement with numeric target', () => {
    render(<AchievementCard achievement={locked} onClick={jest.fn()} />);
    expect(screen.getByText('7/10')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should call onClick with achievement when clicked', () => {
    const onClick = jest.fn();
    render(<AchievementCard achievement={unlocked} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(unlocked);
  });

  it('should apply unlocked class', () => {
    const { container } = render(
      <AchievementCard achievement={unlocked} onClick={jest.fn()} />
    );
    expect(container.firstChild).toHaveClass('achievement-card--unlocked');
  });

  it('should apply locked class', () => {
    const { container } = render(
      <AchievementCard achievement={locked} onClick={jest.fn()} />
    );
    expect(container.firstChild).toHaveClass('achievement-card--locked');
  });

  it('should apply rare rarity class', () => {
    const { container } = render(
      <AchievementCard achievement={locked} onClick={jest.fn()} />
    );
    expect(container.firstChild).toHaveClass('achievement-card--rare');
  });
});
