/**
 * 大廳聊天室組件
 * Issue #4：遊戲大廳改版
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  sendLobbyChatMessage,
  requestLobbyChat,
  onLobbyChatMessage,
  onLobbyChatHistory,
} from '../../../services/socketService';
import './LobbyChat.css';

/**
 * 大廳聊天室
 * @param {Object} props
 * @param {Object} props.player - 目前玩家 { name, photoURL }
 * @param {boolean} props.isConnected - Socket 是否已連線
 */
function LobbyChat({ player, isConnected }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const messageIdsRef = useRef(new Set());

  useEffect(() => {
    if (!isConnected) return;

    requestLobbyChat();

    const unsubHistory = onLobbyChatHistory((history) => {
      const msgs = history || [];
      messageIdsRef.current = new Set(msgs.map(m => m.id));
      setMessages(msgs);
    });

    const unsubMessage = onLobbyChatMessage((msg) => {
      if (messageIdsRef.current.has(msg.id)) return;
      messageIdsRef.current.add(msg.id);
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      unsubHistory();
      unsubMessage();
    };
  }, [isConnected]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || !isConnected) return;
    sendLobbyChatMessage(text, player);
    setInputText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="lobby-chat">
      <div className="lobby-chat-header">
        <span className="material-symbols-outlined">forum</span>
        <span>大廳聊天</span>
      </div>

      <div className="lobby-chat-messages">
        {messages.length === 0 ? (
          <div className="lobby-chat-empty">還沒有訊息，來打個招呼吧！</div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.player?.name === player?.name;
            return (
              <div
                key={msg.id}
                className={`chat-message ${isSelf ? 'chat-message-self' : ''}`}
              >
                {!isSelf && (
                  <div className="chat-avatar">
                    {msg.player?.photoURL ? (
                      <img src={msg.player.photoURL} alt={msg.player.name} referrerPolicy="no-referrer" />
                    ) : (
                      <div className="chat-avatar-placeholder">
                        {getInitial(msg.player?.name)}
                      </div>
                    )}
                  </div>
                )}
                <div className="chat-bubble-wrap">
                  {!isSelf && (
                    <span className="chat-sender">{msg.player?.name}</span>
                  )}
                  <div className="chat-bubble">{msg.message}</div>
                  <span className="chat-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="lobby-chat-input-area">
        <input
          ref={inputRef}
          className="lobby-chat-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? '輸入訊息...' : '連線中...'}
          disabled={!isConnected}
          maxLength={200}
        />
        <button
          className="lobby-chat-send-btn"
          onClick={handleSend}
          disabled={!isConnected || !inputText.trim()}
          title="發送"
        >
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>
    </div>
  );
}

export default LobbyChat;
