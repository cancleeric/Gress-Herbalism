/**
 * QuestionFlow 組件測試
 *
 * @module QuestionFlow.test
 * 工單 0074
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

  test('shows player selection as first step', () => {
    render(
      <QuestionFlow
        selectedCard={mockSelectedCard}
        players={mockPlayers}
        currentPlayerId="p1"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('選擇要問牌的對象')).toBeInTheDocument();
    expect(screen.getByText('玩家2')).toBeInTheDocument();
    expect(screen.getByText('玩家3')).toBeInTheDocument();
    // 不應顯示自己
    expect(screen.queryByText('玩家1')).not.toBeInTheDocument();
  });

  test('advances to type selection after selecting player', () => {
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

    expect(screen.getByText('選擇要牌方式')).toBeInTheDocument();
    expect(screen.getByText('各一張')).toBeInTheDocument();
    expect(screen.getByText('其中一種全部')).toBeInTheDocument();
    expect(screen.getByText('給一張要全部')).toBeInTheDocument();
  });

  test('advances to confirm after selecting type', () => {
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
    fireEvent.click(screen.getByText('各一張'));

    // 標題「確認問牌」和按鈕「確認問牌」都會出現
    expect(screen.getAllByText('確認問牌').length).toBe(2);
    expect(screen.getByRole('button', { name: /確認問牌/i })).toBeInTheDocument();
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
    fireEvent.click(screen.getByText('各一張'));
    fireEvent.click(screen.getByRole('button', { name: /確認問牌/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      colors: ['red', 'green'],
      colorCardId: 'red-green',
      targetPlayerId: 'p2',
      questionType: 1
    });
  });

  test('calls onCancel when cancel button clicked on first step', () => {
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

  test('goes back to player selection when back button clicked on type selection', () => {
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
    expect(screen.getByText('選擇要牌方式')).toBeInTheDocument();

    fireEvent.click(screen.getByText('上一步'));
    expect(screen.getByText('選擇要問牌的對象')).toBeInTheDocument();
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
    fireEvent.click(screen.getByText('給一張要全部'));

    expect(screen.getByText('選擇要給哪種顏色的一張')).toBeInTheDocument();
  });

  test('skips give color selection for type 3 when player has only one color', () => {
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
    fireEvent.click(screen.getByText('給一張要全部'));

    // Should go directly to confirm (both heading and button will have "確認問牌")
    expect(screen.getAllByText('確認問牌').length).toBe(2);
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
    fireEvent.click(screen.getByText('給一張要全部'));

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
    fireEvent.click(screen.getByText('給一張要全部'));
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

  test('excludes inactive players from selection', () => {
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

    expect(screen.queryByText('玩家2')).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByText('玩家2'));
    fireEvent.click(screen.getByText('各一張'));

    const confirmButton = screen.getByRole('button', { name: /處理中/i });
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
});
