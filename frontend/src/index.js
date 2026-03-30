/**
 * 應用程式入口點
 *
 * @module index
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { register as registerServiceWorker } from './serviceWorkerRegistration';
import './styles/index.css';

// 渲染應用程式到 DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 生產環境啟用 Service Worker 快取策略
registerServiceWorker();

// 效能指標回報（開發模式下輸出到 console，生產環境可替換為分析服務）
reportWebVitals(process.env.NODE_ENV === 'development' ? console.log : undefined);
