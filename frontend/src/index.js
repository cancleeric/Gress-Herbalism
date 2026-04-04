/**
 * 應用程式入口點
 *
 * @module index
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { register as registerServiceWorker } from './serviceWorkerRegistration';

// 渲染應用程式到 DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Issue #7: 註冊 Service Worker 進行快取優化（僅生產環境）
registerServiceWorker();
