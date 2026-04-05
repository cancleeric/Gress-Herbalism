/**
 * 應用程式入口點
 *
 * @module index
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { register as registerSW } from './serviceWorkerRegistration';

// 渲染應用程式到 DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Issue #7：生產環境啟用 Service Worker 快取
registerSW();
