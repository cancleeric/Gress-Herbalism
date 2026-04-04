/**
 * Socket 連線管理 Hook
 *
 * 提供統一的 Socket 連線生命周期管理，防止記憶體洩漏
 *
 * Issue #7 - 效能優化：Socket.io 連線管理
 *
 * @module hooks/useSocketConnection
 */

import { useEffect, useRef, useCallback } from 'react';
import { onConnectionChange } from '../services/socketService';

/**
 * 管理 Socket 連線狀態與事件監聽清理
 *
 * @param {Function} onConnect - 連線成功回調
 * @param {Function} onDisconnect - 斷線回調
 * @returns {Object} - { addListener, removeAllListeners }
 */
export function useSocketConnection(onConnect, onDisconnect) {
  const listenersRef = useRef([]);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);

  // 每次渲染更新 ref，不觸發 effect
  useEffect(() => {
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
  });

  useEffect(() => {
    const unsubscribe = onConnectionChange((connected) => {
      if (connected) {
        onConnectRef.current?.();
      } else {
        onDisconnectRef.current?.();
      }
    });

    listenersRef.current.push(unsubscribe);

    return () => {
      listenersRef.current.forEach((unsub) => {
        if (typeof unsub === 'function') unsub();
      });
      listenersRef.current = [];
    };
  }, []); // 只在 mount/unmount 執行

  /**
   * 登記額外的監聽器，確保在 unmount 時自動清理
   */
  const addListener = useCallback((unsubscribeFn) => {
    if (typeof unsubscribeFn === 'function') {
      listenersRef.current.push(unsubscribeFn);
    }
    return unsubscribeFn;
  }, []);

  /**
   * 手動移除所有監聽器
   */
  const removeAllListeners = useCallback(() => {
    listenersRef.current.forEach((unsub) => {
      if (typeof unsub === 'function') unsub();
    });
    listenersRef.current = [];
  }, []);

  return { addListener, removeAllListeners };
}

export default useSocketConnection;
