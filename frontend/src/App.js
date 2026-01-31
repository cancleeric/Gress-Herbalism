/**
 * 主應用組件
 *
 * @module App
 * 工單 0059 - 加入 Firebase 登入
 * 工單 0060 - 加入個人資料和排行榜
 */

import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import store, { persistor } from './store/gameStore';
import { AuthProvider, useAuth } from './firebase';
import { Login, Lobby, Profile, Leaderboard, Friends, ConnectionStatus } from './components/common';
import { GameRoom } from './components/games/herbalism';
import './styles/App.css';

/**
 * 受保護路由組件 - 需要登入才能訪問
 */
function ProtectedRoute({ children }) {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="app-loading">
        <p>載入中...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * 錯誤邊界組件
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('應用程式錯誤:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>發生錯誤</h1>
          <p>應用程式遇到問題，請重新整理頁面。</p>
          <button onClick={() => window.location.reload()}>
            重新整理
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 應用內容組件 - 包含路由邏輯
 * 工單 0119：新增 ConnectionStatus 組件
 */
function AppContent() {
  return (
    <div className="app">
      <ConnectionStatus />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Lobby />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:gameId"
          element={
            <ProtectedRoute>
              <GameRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

/**
 * 載入中顯示組件（工單 0117）
 */
function LoadingView() {
  return (
    <div className="app-loading">
      <p>載入中...</p>
    </div>
  );
}

/**
 * 主應用組件
 * 工單 0117：新增 PersistGate 進行狀態恢復
 *
 * @returns {JSX.Element} 應用程式根組件
 */
function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingView />} persistor={persistor}>
        <ErrorBoundary>
          <AuthProvider>
            <Router>
              <AppContent />
            </Router>
          </AuthProvider>
        </ErrorBoundary>
      </PersistGate>
    </Provider>
  );
}

export default App;
