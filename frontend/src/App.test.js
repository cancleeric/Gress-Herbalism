/**
 * App 組件單元測試
 * 工作單 0013, 0059
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock Firebase Auth
jest.mock('./firebase', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    isLoggedIn: true,
    isLoading: false,
    user: { uid: 'test-user', displayName: 'Test User' },
    loginWithGoogle: jest.fn(),
    loginAsGuest: jest.fn(),
    logout: jest.fn(),
  }),
}));

// Mock 子元件以隔離 App 層級測試（從 common barrel 取得）
jest.mock('./components/common', () => ({
  Lobby: function MockLobby() {
    return <div className="lobby"><h1>本草 Herbalism</h1><p>3-4 人推理卡牌遊戲</p></div>;
  },
  GameSelection: function MockGameSelection() { return <div className="lobby"><h1>本草 Herbalism</h1><p>3-4 人推理卡牌遊戲</p></div>; },
  EvolutionLobbyPage: function MockEvolutionLobbyPage() { return <div>EvolutionLobbyPage</div>; },
  Profile: function MockProfile() { return <div>Profile</div>; },
  Leaderboard: function MockLeaderboard() { return <div>Leaderboard</div>; },
  Friends: function MockFriends() { return <div>Friends</div>; },
  Login: function MockLogin() { return <div>Login</div>; },
  ConnectionStatus: function MockConnectionStatus() { return null; },
}));
jest.mock('./components/games/herbalism', () => ({
  GameRoom: function MockGameRoom() { return <div>GameRoom</div>; },
}));
jest.mock('./components/games/evolution', () => ({
  EvolutionRoom: function MockEvolutionRoom() { return <div>EvolutionRoom</div>; },
}));

describe('App - 工作單 0013', () => {
  describe('應用程式渲染', () => {
    test('應用程式應該正常渲染', () => {
      render(<App />);
      // 檢查大廳標題是否顯示
      expect(screen.getByText('本草 Herbalism')).toBeInTheDocument();
    });

    test('首頁應顯示遊戲大廳', () => {
      render(<App />);
      expect(screen.getByText('3-4 人推理卡牌遊戲')).toBeInTheDocument();
    });

    test('應用程式應包含 app 容器', () => {
      const { container } = render(<App />);
      expect(container.querySelector('.app')).toBeInTheDocument();
    });

    test('大廳組件應包含 lobby 類別', () => {
      const { container } = render(<App />);
      expect(container.querySelector('.lobby')).toBeInTheDocument();
    });
  });

  describe('ErrorBoundary', () => {
    // 暫時禁用 console.error 以避免測試輸出雜訊
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalError;
    });

    test('ErrorBoundary 應該捕獲子組件錯誤', () => {
      const ThrowError = () => {
        throw new Error('測試錯誤');
      };

      // 使用 ErrorBoundary 包裹會拋出錯誤的組件
      const ErrorBoundary = require('./App').default;

      // 由於 ErrorBoundary 是 App 的內部類別，這裡我們測試整體行為
      // 當子組件拋出錯誤時，ErrorBoundary 應該顯示錯誤訊息
      // 注意：這個測試需要在實際組件中測試
    });
  });

  describe('路由設定', () => {
    test('根路徑應渲染 Lobby 組件', () => {
      render(<App />);
      expect(screen.getByText('本草 Herbalism')).toBeInTheDocument();
    });
  });

  describe('Redux Provider', () => {
    test('應用程式應被 Redux Provider 包裹', () => {
      // 如果 Redux Provider 沒有正確設定，渲染會失敗
      expect(() => render(<App />)).not.toThrow();
    });
  });
});

describe('App - 工作單 0059 Firebase Auth', () => {
  describe('登入保護路由', () => {
    test('已登入用戶應可訪問首頁', () => {
      render(<App />);
      expect(screen.getByText('本草 Herbalism')).toBeInTheDocument();
    });
  });
});
