/**
 * Prediction 組件測試
 *
 * @module Prediction.test
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Prediction from './Prediction';
import PredictionList from './PredictionList';
import PredictionResult from './PredictionResult';

describe('Prediction Component', () => {
  const mockOnEndTurn = jest.fn();

  beforeEach(() => {
    mockOnEndTurn.mockClear();
  });

  test('renders prediction card with all color buttons', () => {
    render(<Prediction onEndTurn={mockOnEndTurn} isLoading={false} />);

    expect(screen.getByText('問牌完成！')).toBeInTheDocument();
    expect(screen.getByText('是否要預測蓋牌中有哪個顏色？')).toBeInTheDocument();
    expect(screen.getByText('紅色')).toBeInTheDocument();
    expect(screen.getByText('黃色')).toBeInTheDocument();
    expect(screen.getByText('綠色')).toBeInTheDocument();
    expect(screen.getByText('藍色')).toBeInTheDocument();
    expect(screen.getByText('結束回合')).toBeInTheDocument();
  });

  test('selecting a color updates the selected state', () => {
    render(<Prediction onEndTurn={mockOnEndTurn} isLoading={false} />);

    const redButton = screen.getByText('紅色');
    fireEvent.click(redButton);

    expect(screen.getByText('已選擇：紅色 ✓')).toBeInTheDocument();
  });

  test('clicking same color again deselects it', () => {
    render(<Prediction onEndTurn={mockOnEndTurn} isLoading={false} />);

    const redButton = screen.getByText('紅色');
    fireEvent.click(redButton);
    expect(screen.getByText('已選擇：紅色 ✓')).toBeInTheDocument();

    fireEvent.click(redButton);
    expect(screen.getByText('（點擊選擇，可不選）')).toBeInTheDocument();
  });

  test('clicking different color changes selection', () => {
    render(<Prediction onEndTurn={mockOnEndTurn} isLoading={false} />);

    const redButton = screen.getByText('紅色');
    const blueButton = screen.getByText('藍色');

    fireEvent.click(redButton);
    expect(screen.getByText('已選擇：紅色 ✓')).toBeInTheDocument();

    fireEvent.click(blueButton);
    expect(screen.getByText('已選擇：藍色 ✓')).toBeInTheDocument();
  });

  test('end turn button calls onEndTurn with selected color', () => {
    render(<Prediction onEndTurn={mockOnEndTurn} isLoading={false} />);

    const redButton = screen.getByText('紅色');
    const endTurnButton = screen.getByText('結束回合');

    fireEvent.click(redButton);
    fireEvent.click(endTurnButton);

    expect(mockOnEndTurn).toHaveBeenCalledWith('red');
  });

  test('end turn button calls onEndTurn with null when no color selected', () => {
    render(<Prediction onEndTurn={mockOnEndTurn} isLoading={false} />);

    const endTurnButton = screen.getByText('結束回合');
    fireEvent.click(endTurnButton);

    expect(mockOnEndTurn).toHaveBeenCalledWith(null);
  });

  test('buttons are disabled when loading', () => {
    render(<Prediction onEndTurn={mockOnEndTurn} isLoading={true} />);

    const redButton = screen.getByText('紅色');
    const endTurnButton = screen.getByText('處理中...');

    expect(redButton).toBeDisabled();
    expect(endTurnButton).toBeDisabled();
  });

  test('displays prediction rules', () => {
    render(<Prediction onEndTurn={mockOnEndTurn} isLoading={false} />);

    expect(screen.getByText(/預測規則/)).toBeInTheDocument();
    expect(screen.getByText(/預測對 \+1 分/)).toBeInTheDocument();
  });
});

describe('PredictionList Component', () => {
  const mockPlayers = [
    { id: 'p1', name: '小明' },
    { id: 'p2', name: '小華' },
    { id: 'p3', name: '小王' }
  ];

  test('renders nothing when predictions is empty', () => {
    const { container } = render(<PredictionList predictions={[]} players={mockPlayers} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing when predictions is null', () => {
    const { container } = render(<PredictionList predictions={null} players={mockPlayers} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders prediction list with player predictions', () => {
    const predictions = [
      { playerId: 'p1', color: 'red' },
      { playerId: 'p2', color: 'blue' }
    ];

    render(<PredictionList predictions={predictions} players={mockPlayers} />);

    expect(screen.getByText('本局預測')).toBeInTheDocument();
    expect(screen.getByText('小明')).toBeInTheDocument();
    expect(screen.getByText('紅')).toBeInTheDocument();
    expect(screen.getByText('小華')).toBeInTheDocument();
    expect(screen.getByText('藍')).toBeInTheDocument();
  });

  test('renders "未預測" for player without color', () => {
    const predictions = [
      { playerId: 'p1', color: null }
    ];

    render(<PredictionList predictions={predictions} players={mockPlayers} />);

    expect(screen.getByText('未預測')).toBeInTheDocument();
  });

  test('shows unknown player for missing player', () => {
    const predictions = [
      { playerId: 'unknown', color: 'red' }
    ];

    render(<PredictionList predictions={predictions} players={mockPlayers} />);

    expect(screen.getByText('未知玩家')).toBeInTheDocument();
  });
});

describe('PredictionResult Component', () => {
  const mockPlayers = [
    { id: 'p1', name: '小明' },
    { id: 'p2', name: '小華' }
  ];

  const mockHiddenCards = [
    { color: 'red' },
    { color: 'blue' }
  ];

  test('renders nothing when predictionResults is empty', () => {
    const { container } = render(
      <PredictionResult
        predictionResults={[]}
        players={mockPlayers}
        hiddenCards={mockHiddenCards}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing when predictionResults is null', () => {
    const { container } = render(
      <PredictionResult
        predictionResults={null}
        players={mockPlayers}
        hiddenCards={mockHiddenCards}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders prediction results with correct/wrong icons', () => {
    const predictionResults = [
      { playerId: 'p1', playerName: '小明', color: 'red', isCorrect: true, scoreChange: 1 },
      { playerId: 'p2', playerName: '小華', color: 'green', isCorrect: false, scoreChange: -1 }
    ];

    render(
      <PredictionResult
        predictionResults={predictionResults}
        players={mockPlayers}
        hiddenCards={mockHiddenCards}
      />
    );

    expect(screen.getByText('預測結算')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('✗')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByText('-1')).toBeInTheDocument();
  });

  test('displays hidden cards info', () => {
    const predictionResults = [
      { playerId: 'p1', playerName: '小明', color: 'red', isCorrect: true, scoreChange: 1 }
    ];

    render(
      <PredictionResult
        predictionResults={predictionResults}
        players={mockPlayers}
        hiddenCards={mockHiddenCards}
      />
    );

    // 使用 getAllByText 因為「紅色」可能出現多次（蓋牌和預測）
    expect(screen.getByText(/蓋牌為/)).toBeInTheDocument();
    expect(screen.getAllByText(/紅色/).length).toBeGreaterThan(0);
    expect(screen.getByText(/藍色/)).toBeInTheDocument();
  });
});
