/**
 * Login 組件單元測試
 * 工單 0059
 * 重新設計：配合新版 Stitch UI 設計
 * fix/login-redirect-deeplink：補 from state 導向測試
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

// Mock useNavigate / useLocation（可注入 state）
const mockNavigate = jest.fn();
let mockLocationState = null;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: mockLocationState, pathname: '/login' }),
}));

// Mock useAuth（可注入 isLoggedIn）
const mockLoginWithGoogle = jest.fn();
const mockLoginAsGuest = jest.fn();
let mockIsLoggedIn = false;

jest.mock('../../../firebase', () => ({
  useAuth: () => ({
    loginWithGoogle: mockLoginWithGoogle,
    loginAsGuest: mockLoginAsGuest,
    isLoading: false,
    isLoggedIn: mockIsLoggedIn,
  }),
}));

describe('Login - 工單 0059', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationState = null;
    mockIsLoggedIn = false;
  });

  describe('頁面渲染', () => {
    test('應顯示遊戲標題', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
      expect(screen.getByText('本草 Herbalism')).toBeInTheDocument();
    });

    test('應顯示副標題', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
      expect(screen.getByText('3-4人線上推理桌遊')).toBeInTheDocument();
    });

    test('應顯示 Google 登入按鈕', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
      expect(screen.getByText('使用 Google 帳號登入')).toBeInTheDocument();
    });

    test('應顯示訪客登入按鈕', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
      expect(screen.getByText('訪客登入')).toBeInTheDocument();
    });

    test('應顯示新朋友提示文字', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
      expect(screen.getByText('新朋友？')).toBeInTheDocument();
    });

    test('應顯示遊戲介紹', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
      expect(screen.getByText(/找出神秘藥方.*桌遊/)).toBeInTheDocument();
    });
  });

  describe('Google 登入', () => {
    test('點擊 Google 登入按鈕應呼叫 loginWithGoogle', async () => {
      mockLoginWithGoogle.mockResolvedValue({ success: true });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('使用 Google 帳號登入'));

      await waitFor(() => {
        expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1);
      });
    });

    test('Google 登入成功應導航到首頁（無 from state）', async () => {
      mockLoginWithGoogle.mockResolvedValue({ success: true });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('使用 Google 帳號登入'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });

    test('Google 登入失敗應顯示錯誤訊息', async () => {
      mockLoginWithGoogle.mockResolvedValue({ success: false, error: '登入失敗' });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('使用 Google 帳號登入'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('登入失敗');
      });
    });
  });

  describe('訪客登入', () => {
    test('點擊訪客登入按鈕應呼叫 loginAsGuest', async () => {
      mockLoginAsGuest.mockResolvedValue({ success: true });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('訪客登入'));

      await waitFor(() => {
        expect(mockLoginAsGuest).toHaveBeenCalledTimes(1);
      });
    });

    test('訪客登入成功應導航到首頁（無 from state）', async () => {
      mockLoginAsGuest.mockResolvedValue({ success: true });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('訪客登入'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });

    test('訪客登入失敗應顯示錯誤訊息', async () => {
      mockLoginAsGuest.mockResolvedValue({ success: false, error: '訪客登入失敗' });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('訪客登入'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('訪客登入失敗');
      });
    });
  });

  describe('載入狀態', () => {
    test('處理中應禁用所有按鈕', async () => {
      // 設置一個延遲的 Promise 來模擬處理中狀態
      mockLoginWithGoogle.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ success: true }), 1000);
      }));

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      const googleBtn = screen.getByText('使用 Google 帳號登入').closest('button');
      const guestBtn = screen.getByText('訪客登入').closest('button');

      // 初始狀態按鈕應可用
      expect(googleBtn).not.toBeDisabled();
      expect(guestBtn).not.toBeDisabled();

      // 點擊後按鈕應被禁用
      fireEvent.click(googleBtn);

      await waitFor(() => {
        expect(googleBtn).toBeDisabled();
        expect(guestBtn).toBeDisabled();
      });
    });
  });
});

describe('Login - fix/login-redirect-deeplink deep link 導向', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationState = null;
    mockIsLoggedIn = false;
  });

  describe('ProtectedRoute 帶 from state 時', () => {
    test('訪客登入成功應導向 from pathname（/lobby/herbalism）', async () => {
      mockLocationState = { from: { pathname: '/lobby/herbalism' } };
      mockLoginAsGuest.mockResolvedValue({ success: true });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('訪客登入'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/lobby/herbalism', { replace: true });
      });
    });

    test('訪客登入成功應導向 from pathname（/lobby/evolution）', async () => {
      mockLocationState = { from: { pathname: '/lobby/evolution' } };
      mockLoginAsGuest.mockResolvedValue({ success: true });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('訪客登入'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/lobby/evolution', { replace: true });
      });
    });

    test('無 from state 時 fallback 到 /', async () => {
      mockLocationState = null;
      mockLoginAsGuest.mockResolvedValue({ success: true });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('訪客登入'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });
  });

  describe('已登入用戶訪問 /login', () => {
    test('已登入用戶訪問 /login 應立即跳走（有 from state）', async () => {
      mockIsLoggedIn = true;
      mockLocationState = { from: { pathname: '/lobby/evolution' } };

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/lobby/evolution', { replace: true });
      });
    });

    test('已登入用戶訪問 /login 無 from state 時跳到 /', async () => {
      mockIsLoggedIn = true;
      mockLocationState = null;

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });
  });
});
