/**
 * Lobby 組件單元測試
 * 工作單 0014, 0015
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { createStore } from 'redux';
import Lobby from './Lobby';
import { gameReducer } from '../../store/gameStore';
import * as socketService from '../../services/socketService';

// Mock socketService
jest.mock('../../services/socketService');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Socket event callbacks storage
let eventCallbacks = {};

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
    eventCallbacks = {};
    localStorage.clear();

    // Mock socket service functions
    socketService.initSocket.mockReturnValue({});
    socketService.onConnectionChange.mockImplementation((callback) => {
      eventCallbacks.connectionChange = callback;
      // 預設連線成功
      setTimeout(() => callback(true), 0);
      return () => {};
    });
    socketService.onRoomList.mockImplementation((callback) => {
      eventCallbacks.roomList = callback;
      return () => {};
    });
    socketService.onRoomCreated.mockImplementation((callback) => {
      eventCallbacks.roomCreated = callback;
      return () => {};
    });
    socketService.onJoinedRoom.mockImplementation((callback) => {
      eventCallbacks.joinedRoom = callback;
      return () => {};
    });
    socketService.onError.mockImplementation((callback) => {
      eventCallbacks.error = callback;
      return () => {};
    });
    socketService.onPasswordRequired.mockImplementation((callback) => {
      eventCallbacks.passwordRequired = callback;
      return () => {};
    });
    socketService.createRoom.mockImplementation(() => {});
    socketService.joinRoom.mockImplementation(() => {});
  });

  describe('渲染', () => {
    test('應顯示遊戲標題', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByText('本草 Herbalism')).toBeInTheDocument();
      });
    });

    test('應顯示副標題', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByText('3-4 人推理卡牌遊戲')).toBeInTheDocument();
      });
    });

    test('應顯示玩家名稱輸入框', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByLabelText('玩家名稱')).toBeInTheDocument();
      });
    });

    test('應顯示創建房間按鈕', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByText('創建新房間')).toBeInTheDocument();
      });
    });

    test('應顯示房間ID輸入框', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByLabelText('房間ID')).toBeInTheDocument();
      });
    });

    test('應顯示加入房間按鈕', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '加入房間' })).toBeInTheDocument();
      });
    });

    test('應顯示可用房間區域', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByText('可用房間')).toBeInTheDocument();
      });
    });

    test('應顯示無可用房間訊息', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByText('目前沒有可用的房間')).toBeInTheDocument();
      });
    });
  });

  describe('輸入驗證', () => {
    test('未輸入玩家名稱時創建房間應顯示錯誤', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByText('創建新房間')).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText('已連線')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('創建新房間'));
      await waitFor(() => {
        expect(screen.getByText('請輸入暱稱')).toBeInTheDocument();
      });
    });

    test('未輸入玩家名稱時加入房間應顯示錯誤', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByLabelText('房間ID')).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText('已連線')).toBeInTheDocument();
      });
      const roomIdInput = screen.getByLabelText('房間ID');
      fireEvent.change(roomIdInput, { target: { value: 'room_123' } });
      fireEvent.click(screen.getByRole('button', { name: '加入房間' }));
      await waitFor(() => {
        expect(screen.getByText('請輸入暱稱')).toBeInTheDocument();
      });
    });

    test('輸入玩家名稱但未輸入房間ID時加入房間應顯示錯誤', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByLabelText('玩家名稱')).toBeInTheDocument();
      });
      const playerNameInput = screen.getByLabelText('玩家名稱');
      fireEvent.change(playerNameInput, { target: { value: '玩家1' } });
      fireEvent.click(screen.getByRole('button', { name: '加入房間' }));
      expect(screen.getByText('請輸入房間ID')).toBeInTheDocument();
    });
  });

  describe('互動', () => {
    test('輸入玩家名稱應更新輸入值', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByLabelText('玩家名稱')).toBeInTheDocument();
      });
      const input = screen.getByLabelText('玩家名稱');
      fireEvent.change(input, { target: { value: '測試玩家' } });
      expect(input.value).toBe('測試玩家');
    });

    test('輸入房間ID應更新輸入值', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByLabelText('房間ID')).toBeInTheDocument();
      });
      const input = screen.getByLabelText('房間ID');
      fireEvent.change(input, { target: { value: 'room_456' } });
      expect(input.value).toBe('room_456');
    });

    test('輸入後錯誤訊息應消失', async () => {
      renderWithProviders(<Lobby />);

      // 等待連線成功
      await waitFor(() => {
        expect(screen.getByText('創建新房間')).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText('已連線')).toBeInTheDocument();
      });

      // 觸發錯誤
      fireEvent.click(screen.getByText('創建新房間'));

      await waitFor(() => {
        expect(screen.getByText('請輸入暱稱')).toBeInTheDocument();
      });

      // 輸入玩家名稱
      const input = screen.getByLabelText('玩家名稱');
      fireEvent.change(input, { target: { value: '玩家' } });

      // 錯誤訊息應消失
      await waitFor(() => {
        expect(screen.queryByText('請輸入暱稱')).not.toBeInTheDocument();
      });
    });
  });

  describe('樣式', () => {
    test('應包含 lobby 容器類別', async () => {
      const { container } = renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(container.querySelector('.lobby')).toBeInTheDocument();
      });
    });

    test('應包含 lobby-header 類別', async () => {
      const { container } = renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(container.querySelector('.lobby-header')).toBeInTheDocument();
      });
    });

    test('應包含 lobby-content 類別', async () => {
      const { container } = renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(container.querySelector('.lobby-content')).toBeInTheDocument();
      });
    });
  });
});

describe('Lobby - 工作單 0015', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventCallbacks = {};
    localStorage.clear();

    // Mock socket service functions
    socketService.initSocket.mockReturnValue({});
    socketService.onConnectionChange.mockImplementation((callback) => {
      eventCallbacks.connectionChange = callback;
      // Use queueMicrotask for faster callback but still async
      queueMicrotask(() => callback(true));
      return () => {};
    });
    socketService.onRoomList.mockImplementation((callback) => {
      eventCallbacks.roomList = callback;
      return () => {};
    });
    socketService.onRoomCreated.mockImplementation((callback) => {
      eventCallbacks.roomCreated = callback;
      return () => {};
    });
    socketService.onJoinedRoom.mockImplementation((callback) => {
      eventCallbacks.joinedRoom = callback;
      return () => {};
    });
    socketService.onError.mockImplementation((callback) => {
      eventCallbacks.error = callback;
      return () => {};
    });
    socketService.onPasswordRequired.mockImplementation((callback) => {
      eventCallbacks.passwordRequired = callback;
      return () => {};
    });
    socketService.createRoom.mockImplementation(() => {});
    socketService.joinRoom.mockImplementation(() => {});
  });

  describe('玩家數量選擇器', () => {
    test('應顯示玩家數量選擇器', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByLabelText('玩家數量')).toBeInTheDocument();
      });
    });

    test('預設應選擇 3 人', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        const select = screen.getByLabelText('玩家數量');
        expect(select.value).toBe('3');
      });
    });

    test('應可以選擇 4 人', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByLabelText('玩家數量')).toBeInTheDocument();
      });
      const select = screen.getByLabelText('玩家數量');
      fireEvent.change(select, { target: { value: '4' } });
      expect(select.value).toBe('4');
    });

    test('應有 3 人和 4 人選項', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByRole('option', { name: '3 人' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '4 人' })).toBeInTheDocument();
      });
    });
  });

  describe('創建房間功能', () => {
    test('創建房間成功應調用 socketService.createRoom', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByLabelText('玩家名稱')).toBeInTheDocument();
      });

      const playerNameInput = screen.getByLabelText('玩家名稱');
      fireEvent.change(playerNameInput, { target: { value: '玩家1' } });
      fireEvent.click(screen.getByText('創建新房間'));

      expect(socketService.createRoom).toHaveBeenCalled();
    });

    test('創建房間成功後應導航到遊戲房間', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByLabelText('玩家名稱')).toBeInTheDocument();
      });

      const playerNameInput = screen.getByLabelText('玩家名稱');
      fireEvent.change(playerNameInput, { target: { value: '玩家1' } });
      fireEvent.click(screen.getByText('創建新房間'));

      // 模擬後端回應
      eventCallbacks.roomCreated({
        gameId: 'test_game_123',
        gameState: {
          players: [{ id: 'p1', name: '玩家1' }],
          maxPlayers: 3,
          gamePhase: 'waiting'
        }
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/game/test_game_123');
      });
    });

    test('創建房間錯誤應顯示錯誤訊息', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByLabelText('玩家名稱')).toBeInTheDocument();
      });

      const playerNameInput = screen.getByLabelText('玩家名稱');
      fireEvent.change(playerNameInput, { target: { value: '玩家1' } });
      fireEvent.click(screen.getByText('創建新房間'));

      // 模擬後端錯誤回應
      eventCallbacks.error({ message: '創建房間失敗' });

      await waitFor(() => {
        expect(screen.getByText('創建房間失敗')).toBeInTheDocument();
      });
    });
  });

  describe('加入房間功能', () => {
    test('加入房間成功應調用 socketService.joinRoom', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByLabelText('玩家名稱')).toBeInTheDocument();
      });

      const playerNameInput = screen.getByLabelText('玩家名稱');
      const roomIdInput = screen.getByLabelText('房間ID');

      fireEvent.change(playerNameInput, { target: { value: '玩家1' } });
      fireEvent.change(roomIdInput, { target: { value: 'valid_room' } });
      fireEvent.click(screen.getByRole('button', { name: '加入房間' }));

      expect(socketService.joinRoom).toHaveBeenCalledWith('valid_room', expect.objectContaining({
        name: '玩家1'
      }));
    });

    test('加入房間成功應導航到遊戲房間', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByLabelText('玩家名稱')).toBeInTheDocument();
      });

      const playerNameInput = screen.getByLabelText('玩家名稱');
      const roomIdInput = screen.getByLabelText('房間ID');

      fireEvent.change(playerNameInput, { target: { value: '玩家2' } });
      fireEvent.change(roomIdInput, { target: { value: 'valid_room' } });
      fireEvent.click(screen.getByRole('button', { name: '加入房間' }));

      // 模擬後端回應
      eventCallbacks.joinedRoom({
        gameId: 'valid_room',
        gameState: {
          players: [
            { id: 'p1', name: '玩家1' },
            { id: 'p2', name: '玩家2' }
          ],
          maxPlayers: 4,
          gamePhase: 'waiting'
        }
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/game/valid_room');
      });
    });

    test('加入房間錯誤應顯示錯誤訊息', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByLabelText('玩家名稱')).toBeInTheDocument();
      });

      const playerNameInput = screen.getByLabelText('玩家名稱');
      const roomIdInput = screen.getByLabelText('房間ID');

      fireEvent.change(playerNameInput, { target: { value: '玩家1' } });
      fireEvent.change(roomIdInput, { target: { value: 'nonexistent_room' } });
      fireEvent.click(screen.getByRole('button', { name: '加入房間' }));

      // 模擬後端錯誤回應
      eventCallbacks.error({ message: '房間不存在' });

      await waitFor(() => {
        expect(screen.getByText('房間不存在')).toBeInTheDocument();
      });
    });
  });

  describe('房間列表功能', () => {
    test('顯示房間列表', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByText('可用房間')).toBeInTheDocument();
      });

      // 模擬收到房間列表
      eventCallbacks.roomList([
        { id: 'room1', name: '玩家A的房間', playerCount: 1, maxPlayers: 3 },
        { id: 'room2', name: '玩家B的房間', playerCount: 2, maxPlayers: 4 }
      ]);

      await waitFor(() => {
        expect(screen.getByText('玩家A的房間')).toBeInTheDocument();
        expect(screen.getByText('玩家B的房間')).toBeInTheDocument();
      });
    });

    test('點擊房間列表中的加入按鈕應加入該房間', async () => {
      renderWithProviders(<Lobby />);
      await waitFor(() => {
        expect(screen.getByText('可用房間')).toBeInTheDocument();
      });

      // 先輸入玩家名稱
      const playerNameInput = screen.getByLabelText('玩家名稱');
      fireEvent.change(playerNameInput, { target: { value: '玩家X' } });

      // 模擬收到房間列表
      eventCallbacks.roomList([
        { id: 'room1', name: '玩家A的房間', playerCount: 1, maxPlayers: 3 }
      ]);

      await waitFor(() => {
        expect(screen.getByText('玩家A的房間')).toBeInTheDocument();
      });

      // 點擊加入按鈕
      const joinButtons = screen.getAllByText('加入');
      fireEvent.click(joinButtons[0]);

      expect(socketService.joinRoom).toHaveBeenCalledWith('room1', expect.objectContaining({
        name: '玩家X'
      }));
    });
  });

  describe('連線狀態', () => {
    test('未連線時應顯示未連線狀態', async () => {
      socketService.onConnectionChange.mockImplementation((callback) => {
        eventCallbacks.connectionChange = callback;
        setTimeout(() => callback(false), 0);
        return () => {};
      });

      renderWithProviders(<Lobby />);

      await waitFor(() => {
        expect(screen.getByText('未連線')).toBeInTheDocument();
      });
    });

    test('連線後應顯示已連線狀態', async () => {
      renderWithProviders(<Lobby />);

      await waitFor(() => {
        expect(screen.getByText('已連線')).toBeInTheDocument();
      });
    });
  });

  describe('錯誤訊息', () => {
    test('錯誤訊息應有 role="alert"', async () => {
      // Override the connection callback for this specific test to not auto-connect
      socketService.onConnectionChange.mockImplementation((callback) => {
        eventCallbacks.connectionChange = callback;
        // Don't auto-connect, but manually trigger connection once
        Promise.resolve().then(() => callback(true));
        return () => {};
      });

      renderWithProviders(<Lobby />);

      // Wait for connection to be established
      await waitFor(() => {
        expect(screen.getByText('已連線')).toBeInTheDocument();
      });

      // Now click the button - this should trigger validation error
      fireEvent.click(screen.getByText('創建新房間'));

      // The error should appear after state update
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent('請輸入暱稱');
      });
    });
  });
});
