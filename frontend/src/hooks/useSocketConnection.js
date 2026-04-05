/**
 * useSocketConnection - Socket.io 連線管理 Hook
 *
 * Issue #7：統一管理 Socket 連線生命週期，確保組件卸載時自動清理
 * 監聽器，防止記憶體洩漏。提供連線狀態、重連計數等資訊。
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  initSocket,
  getSocket,
  onConnectionChange,
  disconnect,
} from '../services/socketService';

/**
 * Socket 連線狀態常數
 */
export const SocketStatus = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
};

/**
 * useSocketConnection
 *
 * @param {Object} [options]
 * @param {boolean} [options.autoConnect=true]  - 是否在 mount 時自動建立連線
 * @param {boolean} [options.autoDisconnect=false] - 是否在 unmount 時斷線（預設保持連線）
 * @returns {{ status, isConnected, reconnectCount, connect, disconnectSocket }}
 */
export function useSocketConnection({
  autoConnect = true,
  autoDisconnect = false,
} = {}) {
  const [status, setStatus] = useState(SocketStatus.DISCONNECTED);
  const [reconnectCount, setReconnectCount] = useState(0);
  const isMounted = useRef(true);
  const cleanupRef = useRef(null);

  const handleConnectionChange = useCallback((connected) => {
    if (!isMounted.current) return;
    if (connected) {
      setStatus(SocketStatus.CONNECTED);
    } else {
      setStatus(prev =>
        prev === SocketStatus.CONNECTED
          ? SocketStatus.RECONNECTING
          : SocketStatus.DISCONNECTED
      );
      setReconnectCount(c => c + 1);
    }
  }, []);

  const connect = useCallback(() => {
    setStatus(SocketStatus.CONNECTING);
    const s = initSocket();

    // 取消上一次訂閱後再重新訂閱，避免重複回調
    if (cleanupRef.current) cleanupRef.current();
    cleanupRef.current = onConnectionChange(handleConnectionChange);

    // 如果已連線，直接更新狀態
    if (s && s.connected) {
      setStatus(SocketStatus.CONNECTED);
    }

    return s;
  }, [handleConnectionChange]);

  const disconnectSocket = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    disconnect();
    setStatus(SocketStatus.DISCONNECTED);
  }, []);

  useEffect(() => {
    isMounted.current = true;

    if (autoConnect) {
      setStatus(SocketStatus.CONNECTING);
      const s = initSocket();
      if (cleanupRef.current) cleanupRef.current();
      cleanupRef.current = onConnectionChange(handleConnectionChange);
      if (s && s.connected) {
        setStatus(SocketStatus.CONNECTED);
      }
    } else {
      // 即使不自動連線，也要監聽現有連線狀態
      const s = getSocket();
      if (s) {
        cleanupRef.current = onConnectionChange(handleConnectionChange);
      }
    }

    return () => {
      isMounted.current = false;
      // 清理連線狀態監聽器
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      // 僅在明確要求時才斷線（例如頁面完全卸載）
      if (autoDisconnect) {
        disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, autoDisconnect]);

  return {
    status,
    isConnected: status === SocketStatus.CONNECTED,
    reconnectCount,
    connect,
    disconnectSocket,
  };
}

export default useSocketConnection;
