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
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import store, { persistor } from './store/gameStore';
import { AuthProvider, useAuth } from './firebase';
import { Login, Lobby, Profile, Leaderboard, Friends, ConnectionStatus, GameSelection, EvolutionLobbyPage } from './components/common';
import MatchHistory from './components/common/MatchHistory';
import LidsCallback from './components/common/LidsCallback';
import useConsoleViewport from './hooks/useConsoleViewport';
import { GameRoom } from './components/games/herbalism';
import { EvolutionRoom } from './components/games/evolution';
import './styles/App.css';
import './styles/apothecary.css';
import './components/games/herbalism/GameSetup/AIPlayerSalon.css';
import './components/games/herbalism/GameRoom/TabletopLuxe.css';
import './components/games/herbalism/Prediction/PredictionSalon.css';
import './components/games/herbalism/QuestionFlow/QuestionFlowMobile.css';

const TabletopPreview = process.env.NODE_ENV === 'development'
  ? React.lazy(() => import('./dev/HerbalismTabletopPreview')) : null;

/**
 * 受保護路由組件 - 需要登入才能訪問
 * 工單 fix/login-redirect-deeplink：redirect 時帶原始位置 state
 */
function ProtectedRoute({ children }) {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="app-loading">
        <p>載入中...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
 * 工單 0276：新增遊戲選擇頁面和各遊戲大廳路由
 */
function AppContent() {
  const viewportStyle = useConsoleViewport();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isPreview = process.env.NODE_ENV === 'development' && location.pathname === '/dev/tabletop';
  const isHerbalismGame = location.pathname.startsWith('/game/') &&
    !location.pathname.startsWith('/game/evolution/');
  const isLocalGame = isHerbalismGame && Boolean(location.state?.aiConfig ||
    (params.get('mode') === 'single' && params.get('aiCount') && params.get('difficulties')));
  const isHistory = location.pathname === '/history' || location.pathname.startsWith('/history/');
  const isConsole = (process.env.NODE_ENV === 'development' && location.pathname === '/dev/tabletop') || location.pathname.startsWith('/game/') || location.pathname === '/' ||
    ['/lobby/herbalism', '/lobby/evolution', '/login', '/profile', '/friends', '/leaderboard'].includes(location.pathname) || isHistory;
  return (
    <div className={`app${isConsole ? ' app--console' : ''}${isHistory ? ' app--history' : ''}${location.pathname.includes('evolution') || location.state?.from?.pathname?.includes('evolution') ? '' : ' apothecary'}`} style={{...viewportStyle, '--apothecary-surface': `url(${process.env.PUBLIC_URL}/images/tabletop/apothecary-table.webp)`}}>
      {!isLocalGame && !isPreview && <ConnectionStatus />}
      <Routes>
        {process.env.NODE_ENV === 'development' && <Route path="/dev/tabletop" element={<React.Suspense fallback={<p>載入牌桌</p>}><TabletopPreview /></React.Suspense>}/>}
        <Route path="/history" element={<ProtectedRoute><MatchHistory /></ProtectedRoute>} />
        <Route path="/history/:matchId" element={<ProtectedRoute><MatchHistory /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        {/* Phase 2a LIDS callback 路由（basename="/herbalism" 已做前綴，此處只需相對 path） */}
        {/* ⚠️ path="/callback" → 實際 URL = /herbalism/callback（與 LIDS client 白名單一致） */}
        {/* ❌ 舊寫法 path="/herbalism/callback" 會造成 /herbalism/herbalism/callback 雙前綴 bug */}
        <Route path="/callback" element={<LidsCallback />} />
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
            <Router basename="/herbalism">
              <AppContent />
            </Router>
          </AuthProvider>
        </ErrorBoundary>
      </PersistGate>
    </Provider>
  );
}

export default App;
