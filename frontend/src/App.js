/**
 * 主應用組件
 *
 * @module App
 * 工單 0059 - 加入 Firebase 登入
 * 工單 0060 - 加入個人資料和排行榜
 * Issue #7  - Code splitting with React.lazy
 */

import React, { lazy, Suspense } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import store, { persistor } from './store/gameStore';
import { AuthProvider, useAuth } from './firebase';
import { ConnectionStatus } from './components/common';
import './styles/App.css';

// Issue #7: Lazy-load heavy route components for code splitting
const Login = lazy(() => import('./components/common/Login'));
const Lobby = lazy(() => import('./components/common/Lobby'));
const Profile = lazy(() => import('./components/common/Profile'));
const Leaderboard = lazy(() => import('./components/common/Leaderboard'));
const Friends = lazy(() => import('./components/common/Friends'));
const GameSelection = lazy(() => import('./components/common/GameSelection'));
const EvolutionLobbyPage = lazy(() => import('./components/common/EvolutionLobbyPage'));
const GameRoom = lazy(() => import('./components/games/herbalism').then(m => ({ default: m.GameRoom })));
const EvolutionRoom = lazy(() => import('./components/games/evolution').then(m => ({ default: m.EvolutionRoom })));

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
 * 懶加載載入中顯示組件（Issue #7）
 */
function SuspenseFallback() {
  return (
    <div className="app-loading">
      <p>載入中...</p>
    </div>
  );
}

/**
 * 應用內容組件 - 包含路由邏輯
 * 工單 0119：新增 ConnectionStatus 組件
 * 工單 0276：新增遊戲選擇頁面和各遊戲大廳路由
 * Issue #7：React.lazy 懶加載路由組件
 */
function AppContent() {
  return (
    <div className="app">
      <ConnectionStatus />
      <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* 工單 0276：遊戲選擇頁面 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <GameSelection />
            </ProtectedRoute>
          }
        />
        {/* 工單 0276：本草大廳 */}
        <Route
          path="/lobby/herbalism"
          element={
            <ProtectedRoute>
              <Lobby />
            </ProtectedRoute>
          }
        />
        {/* 工單 0276：演化論大廳 */}
        <Route
          path="/lobby/evolution"
          element={
            <ProtectedRoute>
              <EvolutionLobbyPage />
            </ProtectedRoute>
          }
        />
        {/* 演化論遊戲路由（必須放在 /game/:gameId 之前）*/}
        <Route
          path="/game/evolution/:roomId"
          element={
            <ProtectedRoute>
              <EvolutionRoom />
            </ProtectedRoute>
          }
        />
        {/* 本草遊戲路由 */}
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
      </Suspense>
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
