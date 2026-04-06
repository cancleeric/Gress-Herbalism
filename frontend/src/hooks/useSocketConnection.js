/**
 * useSocketConnection Hook
 *
 * Issue #7：統一管理 Socket.io 連線狀態，提供重連處理與記憶體洩漏防護
 *
 * @module hooks/useSocketConnection
 */

import { useState, useEffect, useCallback } from 'react';
import { getSocket, initSocket, onConnectionChange, ConnectionState } from '../services/socketService';

/**
 * Socket 連線 Hook
 *
 * 提供連線狀態、手動重連功能，並在組件卸載時自動清理監聽器防止記憶體洩漏。
 *
 * @param {Object} [options]
 * @param {boolean} [options.autoConnect=true] - 是否在掛載時自動初始化連線
 * @returns {{ isConnected: boolean, connectionState: string, reconnect: Function }}
 */
export function useSocketConnection({ autoConnect = true } = {}) {
  const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED);

  useEffect(() => {
    if (!autoConnect) return;

    // 確保 Socket 已初始化
    initSocket();

    // 訂閱連線狀態變化
    const unsubscribe = onConnectionChange((connected) => {
      setConnectionState(
        connected ? ConnectionState.CONNECTED : ConnectionState.DISCONNECTED
      );
    });

    // 立即同步目前連線狀態
    const socket = getSocket();
    if (socket?.connected) {
      setConnectionState(ConnectionState.CONNECTED);
    }

    return () => {
      // Issue #7：清理監聽器，防止記憶體洩漏
      unsubscribe();
    };
  }, [autoConnect]);

  /**
   * 手動觸發重連
   */
  const reconnect = useCallback(() => {
    const socket = getSocket();
    if (socket && !socket.connected) {
      setConnectionState(ConnectionState.CONNECTING);
      socket.connect();
    }
  }, []);

  return {
    isConnected: connectionState === ConnectionState.CONNECTED,
    connectionState,
    reconnect,
  };
}

export default useSocketConnection;
