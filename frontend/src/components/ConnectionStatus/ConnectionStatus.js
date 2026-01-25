/**
 * 連線狀態提示組件
 * 工單 0119 - 顯示斷線與重連狀態
 */

import React, { useState, useEffect } from 'react';
import { onConnectionChange, getSocket } from '../../services/socketService';
import './ConnectionStatus.css';

/**
 * 連線狀態提示組件
 * 顯示斷線警告和重連進度
 */
function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onConnectionChange((connected) => {
      const wasDisconnected = !isConnected;
      setIsConnected(connected);
      if (connected) {
        setIsReconnecting(false);
        setReconnectAttempt(0);
        // 如果是從斷線狀態恢復，顯示成功提示
        if (wasDisconnected) {
          setShowSuccess(true);
        }
      }
    });

    // 監聽重連嘗試
    const socket = getSocket();

    const handleReconnectAttempt = (attempt) => {
      setIsReconnecting(true);
      setReconnectAttempt(attempt);
    };

    const handleReconnect = () => {
      setIsReconnecting(false);
      setReconnectAttempt(0);
      setShowSuccess(true);
    };

    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect', handleReconnect);

    return () => {
      unsubscribe();
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect', handleReconnect);
    };
  }, [isConnected]);

  // 成功提示自動消失
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // 顯示成功提示
  if (showSuccess) {
    return (
      <div className="connection-status connected" role="status" aria-live="polite">
        <div className="connection-status-content">
          <span className="success-icon">&#10003;</span>
          <span>重連成功！</span>
        </div>
      </div>
    );
  }

  // 連線正常時不顯示
  if (isConnected && !isReconnecting) {
    return null;
  }

  return (
    <div
      className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="connection-status-content">
        {isReconnecting ? (
          <>
            <div className="spinner" aria-hidden="true"></div>
            <span>重新連線中... (第 {reconnectAttempt} 次嘗試)</span>
          </>
        ) : (
          <>
            <div className="warning-icon" aria-hidden="true">!</div>
            <span>連線已中斷</span>
          </>
        )}
      </div>
    </div>
  );
}

export default ConnectionStatus;
