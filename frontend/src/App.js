/**
 * 主應用組件
 *
 * @module App
 */

import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import store from './store/gameStore';
import './styles/App.css';

// 臨時佔位組件（將在後續工作單中實作）
function Lobby() {
  return (
    <div className="lobby">
      <h1>桌遊網頁版</h1>
      <p>遊戲大廳 - 待實作</p>
    </div>
  );
}

function GameRoom() {
  return (
    <div className="game-room">
      <h1>遊戲房間</h1>
      <p>遊戲進行中 - 待實作</p>
    </div>
  );
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
 * 主應用組件
 *
 * @returns {JSX.Element} 應用程式根組件
 */
function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <Router>
          <div className="app">
            <Routes>
              <Route path="/" element={<Lobby />} />
              <Route path="/game/:gameId" element={<GameRoom />} />
            </Routes>
          </div>
        </Router>
      </ErrorBoundary>
    </Provider>
  );
}

export default App;
