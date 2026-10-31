/**
 * QuestionFlow 組件測試
 *
 * @module QuestionFlow.test
 * 工單 0074, 0127（重新設計）
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionFlow from './QuestionFlow';

describe('QuestionFlow Component', () => {
  const mockSelectedCard = {
    id: 'red-green',
    colors: ['red', 'green'],
    name: '紅綠'
  };

  const mockPlayers = [
    { id: 'p1', name: '玩家1', isActive: true },
    { id: 'p2', name: '玩家2', isActive: true },
    { id: 'p3', name: '玩家3', isActive: true }
  ];

  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  test('changing card or acting player resets selections, but equivalent prop refresh preserves them', () => {
    const props = { selectedCard: mockSelectedCard, players: mockPlayers, currentPlayerId: 'p1', onSubmit: mockOnSubmit };
    const { rerender } = render(<QuestionFlow {...props} />);
    fireEvent.click(screen.getByText('玩家2'));
    fireEvent.click(screen.getByText(/各一張/));
    expect(screen.getByRole('button', { name: /確認問牌/i })).toBeEnabled();
    rerender(<QuestionFlow {...props} selectedCard={{ ...mockSelectedCard, colors: [...mockSelectedCard.colors] }} players={[...mockPlayers]} />);
    expect(screen.getByRole('button', { name: /確認問牌/i })).toBeEnabled();
    rerender(<QuestionFlow {...props} selectedCard={{ id: 'yellow-blue', colors: ['yellow', 'blue'] }} />);
    expect(screen.getByRole('button', { name: /確認問牌/i })).toBeDisabled();
    fireEvent.click(screen.getByText('玩家2'));
    fireEvent.click(screen.getByText(/各一張/));
    rerender(<QuestionFlow {...props} selectedCard={{ id: 'yellow-blue', colors: ['yellow', 'blue'] }} currentPlayerId="p3" />);
    expect(screen.getByRole('button', { name: /確認問牌/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /確認問牌/i }));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('removing the selected target disables submit and asks for a new target', () => {
    const props = { selectedCard: mockSelectedCard, players: mockPlayers, currentPlayerId: 'p1', onSubmit: mockOnSubmit };
    const { rerender } = render(<QuestionFlow {...props} />);
    fireEvent.click(screen.getByText('玩家2'));
    fireEvent.click(screen.getByText(/各一張/));
    rerender(<QuestionFlow {...props} players={mockPlayers.filter(player => player.id !== 'p2')} />);
    expect(screen.getByRole('button', { name: /確認問牌/i })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('目標玩家已離開');
    fireEvent.click(screen.getByRole('button', { name: /確認問牌/i }));
    expect(mockOnSubmit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('玩家3'));
    fireEvent.click(screen.getByRole('button', { name: /確認問牌/i }));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({ targetPlayerId: 'p3', questionType: 1 }));
  });

  test('loading freezes target/type/give-color choices until the request finishes', () => {
    const props = { selectedCard: mockSelectedCard, players: mockPlayers, currentPlayerId: 'p1',
      currentPlayerHand: [{ color: 'red' }, { color: 'green' }], onSubmit: mockOnSubmit };
    const { rerender } = render(<QuestionFlow {...props} />);
    fireEvent.click(screen.getByText('玩家2'));
    fireEvent.click(screen.getByText(/給一張要全部/));
    fireEvent.click(screen.getByText(/給 紅色 一張/));
    rerender(<QuestionFlow {...props} isLoading />);
    expect(screen.getAllByRole('radio').every(input => input.disabled)).toBe(true);
    expect(screen.getByRole('button', { name: /各一張/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /給 綠色 一張/ })).toBeDisabled();
    fireEvent.click(screen.getByText('玩家3'));
    fireEvent.click(screen.getByText(/各一張/));
    fireEvent.click(screen.getByText(/給 綠色 一張/));
    rerender(<QuestionFlow {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /確認問牌/i }));
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({ targetPlayerId: 'p2', questionType: 3, giveColor: 'red' }));
  });

  test('renders nothing when selectedCard is null', () => {
    const { container } = render(
      <QuestionFlow
        selectedCard={null}
        players={mockPlayers}
        currentPlayerId="p1"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders question flow modal with selected colors', () => {
    render(
      <QuestionFlow
        selectedCard={mockSelectedCard}
        players={mockPlayers}
        currentPlayerId="p1"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('問牌')).toBeInTheDocument();
    expect(screen.getByText(/紅色/)).toBeInTheDocument();
    expect(screen.getByText(/綠色/)).toBeInTheDocument();
  });

  test('shows all three steps in the new three-column layout（工單 0127）', () => {
    render(
      <QuestionFlow
        selectedCard={mockSelectedCard}
        players={mockPlayers}
        currentPlayerId="p1"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // 三欄式佈局同時顯示所有步驟
    expect(screen.getByText('選擇目標玩家')).toBeInTheDocument();
    expect(screen.getByText('選擇要牌方式')).toBeInTheDocument();
    expect(screen.getByText('確認問牌內容')).toBeInTheDocument();
  });

  test('shows player selection with other players excluding self', () => {
    render(
      <QuestionFlow
        selectedCard={mockSelectedCard}
        players={mockPlayers}
        currentPlayerId="p1"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('玩家2')).toBeInTheDocument();
    expect(screen.getByText('玩家3')).toBeInTheDocument();
    // 不應顯示自己
    expect(screen.queryByText('玩家1')).not.toBeInTheDocument();
  });

  test('shows question types in the new format（工單 0127）', () => {
    render(
      <QuestionFlow
        selectedCard={mockSelectedCard}
        players={mockPlayers}
        currentPlayerId="p1"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/各一張/)).toBeInTheDocument();
    expect(screen.getByText(/其中一種全部/)).toBeInTheDocument();
    expect(screen.getByText(/給一張要全部/)).toBeInTheDocument();
  });

  test('enables confirm button only when all selections made', () => {
    render(
      <QuestionFlow
        selectedCard={mockSelectedCard}
        players={mockPlayers}
        currentPlayerId="p1"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // 初始狀態確認按鈕應該禁用
    const confirmButton = screen.getByRole('button', { name: /確認問牌/i });
    expect(confirmButton).toBeDisabled();

    // 選擇玩家
    fireEvent.click(screen.getByText('玩家2'));
    expect(confirmButton).toBeDisabled();

    // 選擇問牌方式
    fireEvent.click(screen.getByText(/各一張/));
    expect(confirmButton).not.toBeDisabled();
  });

  test('calls onSubmit with correct data on confirm', () => {
    render(
      <QuestionFlow
        selectedCard={mockSelectedCard}
        players={mockPlayers}
        currentPlayerId="p1"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('玩家2'));
    fireEvent.click(screen.getByText(/各一張/));
    fireEvent.click(screen.getByRole('button', { name: /確認問牌/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      colors: ['red', 'green'],
      colorCardId: 'red-green',
      targetPlayerId: 'p2',
      questionType: 1
    });
  });

  test('calls onCancel when cancel button clicked', () => {
    render(
      <QuestionFlow
        selectedCard={mockSelectedCard}
        players={mockPlayers}
        currentPlayerId="p1"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('取消'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('shows give color selection for type 3 when player has both colors', () => {
    const mockHand = [
      { color: 'red', id: 'r1' },
      { color: 'green', id: 'g1' }
    ];

    render(
      <QuestionFlow
        selectedCard={mockSelectedCard}
        players={mockPlayers}
        currentPlayerId="p1"
        currentPlayerHand={mockHand}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('玩家2'));
    fireEvent.click(screen.getByText(/給一張要全部/));

    expect(screen.getByText('選擇要給出的顏色：')).toBeInTheDocument();
  });

  test('does not show give color selection for type 3 when player has only one color', () => {
    const mockHand = [
      { color: 'red', id: 'r1' }
    ];

    render(
      <QuestionFlow
        selectedCard={mockSelectedCard}
        players={mockPlayers}
        currentPlayerId="p1"
        currentPlayerHand={mockHand}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('玩家2'));
    fireEvent.click(screen.getByText(/給一張要全部/));

    // 不應顯示顏色選擇區
    expect(screen.queryByText('選擇要給出的顏色：')).not.toBeInTheDocument();
    // 確認按鈕應可用
    expect(screen.getByRole('button', { name: /確認問牌/i })).not.toBeDisabled();
  });

  test('shows error when type 3 selected but player has neither color', () => {
    const mockHand = [
      { color: 'blue', id: 'b1' }
    ];

    render(
      <QuestionFlow
        selectedCard={mockSelectedCard}
        players={mockPlayers}
        currentPlayerId="p1"
        currentPlayerHand={mockHand}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('玩家2'));
    fireEvent.click(screen.getByText(/給一張要全部/));

    expect(screen.getByRole('alert')).toHaveTextContent('你沒有這兩種顏色的牌');
  });

  test('includes giveColor in submit data for type 3', () => {
    const mockHand = [
      { color: 'red', id: 'r1' },
      { color: 'green', id: 'g1' }
    ];

    render(
      <QuestionFlow
        selectedCard={mockSelectedCard}
        players={mockPlayers}
        currentPlayerId="p1"
        currentPlayerHand={mockHand}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('玩家2'));
    fireEvent.click(screen.getByText(/給一張要全部/));
    // 選擇給紅色
    fireEvent.click(screen.getByText(/給 紅色 一張/));
    fireEvent.click(screen.getByRole('button', { name: /確認問牌/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      colors: ['red', 'green'],
      colorCardId: 'red-green',
      targetPlayerId: 'p2',
      questionType: 3,
      giveColor: 'red',
      getColor: 'green'
    });
  });

  test('keeps players without guessing rights selectable for questions', () => {
    const playersWithInactive = [
      { id: 'p1', name: '玩家1', isActive: true },
      { id: 'p2', name: '玩家2', isActive: false },
      { id: 'p3', name: '玩家3', isActive: true }
    ];

    render(
      <QuestionFlow
        selectedCard={mockSelectedCard}
        players={playersWithInactive}
        currentPlayerId="p1"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // 遊戲規則：已退出的玩家仍可被問牌，因此不過濾 isActive
    expect(screen.getByText('玩家2')).toBeInTheDocument();
    expect(screen.getByText('玩家3')).toBeInTheDocument();
  });

  test('disables buttons when loading', () => {
    render(
      <QuestionFlow
        selectedCard={mockSelectedCard}
        players={mockPlayers}
        currentPlayerId="p1"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /取消/i });
    const confirmButton = screen.getByRole('button', { name: /確認問牌/i });
    expect(cancelButton).toBeDisabled();
    expect(confirmButton).toBeDisabled();
  });

  test('shows loading spinner when loading', () => {
    render(
      <QuestionFlow
        selectedCard={mockSelectedCard}
        players={mockPlayers}
        currentPlayerId="p1"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    expect(screen.getByText('處理中...')).toBeInTheDocument();
  });

  test('updates confirm card when selections change（工單 0127）', () => {
    render(
      <QuestionFlow
        selectedCard={mockSelectedCard}
        players={mockPlayers}
        currentPlayerId="p1"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // 初始狀態顯示 —
    expect(screen.getByText('先選擇一位對手')).toBeInTheDocument();

    // 選擇玩家後顯示玩家名稱（會出現在兩個位置：選項和確認卡片）
    fireEvent.click(screen.getByText('玩家2'));
    expect(screen.getAllByText('玩家2').length).toBe(2);

    // 選擇類型後顯示行動
    fireEvent.click(screen.getByText(/各一張/));
    expect(screen.getByText(/向目標索取.*紅色.*和.*綠色.*各一張/)).toBeInTheDocument();
  });
});
