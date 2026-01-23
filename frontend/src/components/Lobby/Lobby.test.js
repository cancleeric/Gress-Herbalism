/**
 * Lobby 組件單元測試
 * 工作單 0014, 0015
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { createStore } from 'redux';
import Lobby from './Lobby';
import { gameReducer } from '../../store/gameStore';
import * as gameService from '../../services/gameService';

// Mock gameService
jest.mock('../../services/gameService');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// 測試用 wrapper
const renderWithProviders = (component) => {
  const store = createStore(gameReducer);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('Lobby - 工作單 0014', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('渲染', () => {
    test('應顯示遊戲標題', () => {
      renderWithProviders(<Lobby />);
      expect(screen.getByText('本草 Herbalism')).toBeInTheDocument();
    });

    test('應顯示副標題', () => {
      renderWithProviders(<Lobby />);
      expect(screen.getByText('3-4 人推理卡牌遊戲')).toBeInTheDocument();
    });

    test('應顯示玩家名稱輸入框', () => {
      renderWithProviders(<Lobby />);
      expect(screen.getByLabelText('玩家名稱')).toBeInTheDocument();
    });

    test('應顯示創建房間按鈕', () => {
      renderWithProviders(<Lobby />);
      expect(screen.getByText('創建新房間')).toBeInTheDocument();
    });

    test('應顯示房間ID輸入框', () => {
      renderWithProviders(<Lobby />);
      expect(screen.getByLabelText('房間ID')).toBeInTheDocument();
    });

    test('應顯示加入房間按鈕', () => {
      renderWithProviders(<Lobby />);
      expect(screen.getByRole('button', { name: '加入房間' })).toBeInTheDocument();
    });

    test('應顯示可用房間區域', () => {
      renderWithProviders(<Lobby />);
      expect(screen.getByText('可用房間')).toBeInTheDocument();
    });

    test('應顯示無可用房間訊息', () => {
      renderWithProviders(<Lobby />);
      expect(screen.getByText('目前沒有可用的房間')).toBeInTheDocument();
    });
  });

  describe('輸入驗證', () => {
    test('未輸入玩家名稱時創建房間應顯示錯誤', () => {
      renderWithProviders(<Lobby />);
      fireEvent.click(screen.getByText('創建新房間'));
      expect(screen.getByText('請輸入玩家名稱')).toBeInTheDocument();
    });

    test('未輸入玩家名稱時加入房間應顯示錯誤', () => {
      renderWithProviders(<Lobby />);
      const roomIdInput = screen.getByLabelText('房間ID');
      fireEvent.change(roomIdInput, { target: { value: 'room_123' } });
      fireEvent.click(screen.getByRole('button', { name: '加入房間' }));
      expect(screen.getByText('請輸入玩家名稱')).toBeInTheDocument();
    });

    test('輸入玩家名稱但未輸入房間ID時加入房間應顯示錯誤', () => {
      renderWithProviders(<Lobby />);
      const playerNameInput = screen.getByLabelText('玩家名稱');
      fireEvent.change(playerNameInput, { target: { value: '玩家1' } });
      fireEvent.click(screen.getByRole('button', { name: '加入房間' }));
      expect(screen.getByText('請輸入房間ID')).toBeInTheDocument();
    });
  });

  describe('互動', () => {
    test('輸入玩家名稱應更新輸入值', () => {
      renderWithProviders(<Lobby />);
      const input = screen.getByLabelText('玩家名稱');
      fireEvent.change(input, { target: { value: '測試玩家' } });
      expect(input.value).toBe('測試玩家');
    });

    test('輸入房間ID應更新輸入值', () => {
      renderWithProviders(<Lobby />);
      const input = screen.getByLabelText('房間ID');
      fireEvent.change(input, { target: { value: 'room_456' } });
      expect(input.value).toBe('room_456');
    });

    test('輸入後錯誤訊息應消失', () => {
      renderWithProviders(<Lobby />);

      // 觸發錯誤
      fireEvent.click(screen.getByText('創建新房間'));
      expect(screen.getByText('請輸入玩家名稱')).toBeInTheDocument();

      // 輸入玩家名稱
      const input = screen.getByLabelText('玩家名稱');
      fireEvent.change(input, { target: { value: '玩家' } });

      // 錯誤訊息應消失
      expect(screen.queryByText('請輸入玩家名稱')).not.toBeInTheDocument();
    });
  });

  describe('樣式', () => {
    test('應包含 lobby 容器類別', () => {
      const { container } = renderWithProviders(<Lobby />);
      expect(container.querySelector('.lobby')).toBeInTheDocument();
    });

    test('應包含 lobby-header 類別', () => {
      const { container } = renderWithProviders(<Lobby />);
      expect(container.querySelector('.lobby-header')).toBeInTheDocument();
    });

    test('應包含 lobby-content 類別', () => {
      const { container } = renderWithProviders(<Lobby />);
      expect(container.querySelector('.lobby-content')).toBeInTheDocument();
    });
  });
});

describe('Lobby - 工作單 0015', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('玩家數量選擇器', () => {
    test('應顯示玩家數量選擇器', () => {
      renderWithProviders(<Lobby />);
      expect(screen.getByLabelText('玩家數量')).toBeInTheDocument();
    });

    test('預設應選擇 3 人', () => {
      renderWithProviders(<Lobby />);
      const select = screen.getByLabelText('玩家數量');
      expect(select.value).toBe('3');
    });

    test('應可以選擇 4 人', () => {
      renderWithProviders(<Lobby />);
      const select = screen.getByLabelText('玩家數量');
      fireEvent.change(select, { target: { value: '4' } });
      expect(select.value).toBe('4');
    });

    test('應有 3 人和 4 人選項', () => {
      renderWithProviders(<Lobby />);
      expect(screen.getByRole('option', { name: '3 人' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '4 人' })).toBeInTheDocument();
    });
  });

  describe('創建房間功能', () => {
    test('創建房間成功應調用 gameService.createGameRoom', () => {
      gameService.createGameRoom.mockReturnValue({
        gameId: 'test_game_123',
        players: []
      });

      renderWithProviders(<Lobby />);

      const playerNameInput = screen.getByLabelText('玩家名稱');
      fireEvent.change(playerNameInput, { target: { value: '玩家1' } });

      fireEvent.click(screen.getByText('創建新房間'));

      expect(gameService.createGameRoom).toHaveBeenCalled();
    });

    test('創建房間成功應導航到遊戲房間', () => {
      gameService.createGameRoom.mockReturnValue({
        gameId: 'test_game_123',
        players: []
      });

      renderWithProviders(<Lobby />);

      const playerNameInput = screen.getByLabelText('玩家名稱');
      fireEvent.change(playerNameInput, { target: { value: '玩家1' } });

      fireEvent.click(screen.getByText('創建新房間'));

      expect(mockNavigate).toHaveBeenCalledWith('/game/test_game_123');
    });

    test('創建房間失敗應顯示錯誤', () => {
      gameService.createGameRoom.mockReturnValue(null);

      renderWithProviders(<Lobby />);

      const playerNameInput = screen.getByLabelText('玩家名稱');
      fireEvent.change(playerNameInput, { target: { value: '玩家1' } });

      fireEvent.click(screen.getByText('創建新房間'));

      expect(screen.getByText('創建房間失敗，請重試')).toBeInTheDocument();
    });

    test('選擇 3 人時創建房間應成功', () => {
      gameService.createGameRoom.mockReturnValue({
        gameId: 'test_game_3p',
        players: [],
        maxPlayers: 3
      });

      renderWithProviders(<Lobby />);

      const playerNameInput = screen.getByLabelText('玩家名稱');
      const playerCountSelect = screen.getByLabelText('玩家數量');

      fireEvent.change(playerNameInput, { target: { value: '玩家1' } });
      fireEvent.change(playerCountSelect, { target: { value: '3' } });
      fireEvent.click(screen.getByText('創建新房間'));

      expect(gameService.createGameRoom).toHaveBeenCalledWith(
        expect.objectContaining({ name: '玩家1' }),
        3
      );
      expect(mockNavigate).toHaveBeenCalledWith('/game/test_game_3p');
    });

    test('選擇 4 人時創建房間應成功', () => {
      gameService.createGameRoom.mockReturnValue({
        gameId: 'test_game_4p',
        players: [],
        maxPlayers: 4
      });

      renderWithProviders(<Lobby />);

      const playerNameInput = screen.getByLabelText('玩家名稱');
      const playerCountSelect = screen.getByLabelText('玩家數量');

      fireEvent.change(playerNameInput, { target: { value: '玩家1' } });
      fireEvent.change(playerCountSelect, { target: { value: '4' } });
      fireEvent.click(screen.getByText('創建新房間'));

      expect(gameService.createGameRoom).toHaveBeenCalledWith(
        expect.objectContaining({ name: '玩家1' }),
        4
      );
      expect(mockNavigate).toHaveBeenCalledWith('/game/test_game_4p');
    });
  });

  describe('加入房間功能', () => {
    test('房間不存在應顯示錯誤', () => {
      gameService.getGameState.mockReturnValue(null);

      renderWithProviders(<Lobby />);

      const playerNameInput = screen.getByLabelText('玩家名稱');
      const roomIdInput = screen.getByLabelText('房間ID');

      fireEvent.change(playerNameInput, { target: { value: '玩家1' } });
      fireEvent.change(roomIdInput, { target: { value: 'nonexistent_room' } });

      fireEvent.click(screen.getByRole('button', { name: '加入房間' }));

      expect(screen.getByText('房間不存在，請確認房間ID是否正確')).toBeInTheDocument();
    });

    test('房間已滿應顯示錯誤', () => {
      gameService.getGameState.mockReturnValue({
        gamePhase: 'waiting',
        players: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
        maxPlayers: 3
      });

      renderWithProviders(<Lobby />);

      const playerNameInput = screen.getByLabelText('玩家名稱');
      const roomIdInput = screen.getByLabelText('房間ID');

      fireEvent.change(playerNameInput, { target: { value: '玩家4' } });
      fireEvent.change(roomIdInput, { target: { value: 'full_room' } });

      fireEvent.click(screen.getByRole('button', { name: '加入房間' }));

      expect(screen.getByText('房間已滿，無法加入')).toBeInTheDocument();
    });

    test('遊戲已開始應顯示錯誤', () => {
      gameService.getGameState.mockReturnValue({
        gamePhase: 'playing',
        players: [{ id: 'p1' }, { id: 'p2' }],
        maxPlayers: 4
      });

      renderWithProviders(<Lobby />);

      const playerNameInput = screen.getByLabelText('玩家名稱');
      const roomIdInput = screen.getByLabelText('房間ID');

      fireEvent.change(playerNameInput, { target: { value: '玩家1' } });
      fireEvent.change(roomIdInput, { target: { value: 'playing_room' } });

      fireEvent.click(screen.getByRole('button', { name: '加入房間' }));

      expect(screen.getByText('遊戲已開始，無法加入')).toBeInTheDocument();
    });

    test('加入房間成功應導航到遊戲房間', () => {
      gameService.getGameState.mockReturnValue({
        gamePhase: 'waiting',
        players: [{ id: 'p1' }],
        maxPlayers: 4
      });

      renderWithProviders(<Lobby />);

      const playerNameInput = screen.getByLabelText('玩家名稱');
      const roomIdInput = screen.getByLabelText('房間ID');

      fireEvent.change(playerNameInput, { target: { value: '玩家2' } });
      fireEvent.change(roomIdInput, { target: { value: 'valid_room' } });

      fireEvent.click(screen.getByRole('button', { name: '加入房間' }));

      expect(mockNavigate).toHaveBeenCalledWith('/game/valid_room');
    });

    test('房間ID格式不正確應顯示錯誤', () => {
      renderWithProviders(<Lobby />);

      const playerNameInput = screen.getByLabelText('玩家名稱');
      const roomIdInput = screen.getByLabelText('房間ID');

      fireEvent.change(playerNameInput, { target: { value: '玩家1' } });
      fireEvent.change(roomIdInput, { target: { value: 'invalid room!' } });

      fireEvent.click(screen.getByRole('button', { name: '加入房間' }));

      expect(screen.getByText('房間ID格式不正確，只允許英數字和底線')).toBeInTheDocument();
    });
  });

  describe('錯誤訊息', () => {
    test('錯誤訊息應有 role="alert"', () => {
      renderWithProviders(<Lobby />);

      fireEvent.click(screen.getByText('創建新房間'));

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('請輸入玩家名稱');
    });
  });
});
