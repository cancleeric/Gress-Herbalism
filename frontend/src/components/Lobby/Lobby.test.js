/**
 * Lobby 組件單元測試
 * 工作單 0014
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { createStore } from 'redux';
import Lobby from './Lobby';
import { gameReducer } from '../../store/gameStore';

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
  describe('渲染', () => {
    test('應顯示遊戲標題', () => {
      renderWithProviders(<Lobby />);
      expect(screen.getByText('桌遊網頁版')).toBeInTheDocument();
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
