/**
 * 前端設定檔 - 集中管理環境變數
 */

export const config = {
  // API 伺服器 URL
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',

  // Socket.io 伺服器 URL
  socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001',

  // 是否為開發環境
  isDevelopment: process.env.NODE_ENV === 'development',

  // 是否為生產環境
  isProduction: process.env.NODE_ENV === 'production',
};

export default config;
