/**
 * 遊戲大廳組件
 * 重新設計：側邊欄佈局（基於 Google Stitch 設計 - 提示詞 2）
 *
 * @module Lobby
 * @description 顯示遊戲大廳，包含房間列表、創建房間和加入房間功能
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../firebase/AuthContext";
import { updateGameState } from "../../../store/gameStore";
import {
  initSocket,
  onRoomList,
  onRoomCreated,
  onJoinedRoom,
  onError,
  onConnectionChange,
  onPasswordRequired,
  onReconnected,
  onReconnectFailed,
  createRoom,
  joinRoom,
  attemptReconnect,
  emitPlayerRefreshing,
  requestRoomList,
} from "../../../services/socketService";
import { MIN_PLAYERS, AI_DIFFICULTY } from "../../../shared/constants";
import {
  saveNickname,
  getNickname,
  getCurrentRoom,
  clearCurrentRoom,
  saveCurrentRoom,
} from "../../../utils/common/localStorage";
import {
  getPlayerNameError,
  getRoomPasswordError,
} from "../../../utils/common/validation";
import { AIPlayerSelector } from "../../games/herbalism/GameSetup";
import "./Lobby.css";
import BotanicalFan from "../BotanicalFan/BotanicalFan";

/**
 * 遊戲大廳組件
 *
 * @returns {JSX.Element} 大廳組件
 */
function Lobby() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth(); // 從 Auth Context 取得登入資訊

  // 本地狀態
  // 工單 0122：分離玩家名稱與暱稱
  // user.displayName: Google 登入時為帳號名稱，訪客登入時為 null
  // user.isAnonymous: 訪客登入時為 true
  const displayName = user?.isAnonymous ? "訪客" : user?.displayName || "訪客";
  const [nickname, setNickname] = useState(""); // 遊戲暱稱（可編輯）
  const [playerCount, setPlayerCount] = useState(MIN_PLAYERS);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeOnly, setRealtimeOnly] = useState(false);
  const [temporaryReplay, setTemporaryReplay] = useState(false);
  useEffect(() => {
    if (!isConnected || typeof fetch !== 'function') return undefined;
    const controller = new AbortController();
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/health`,
      { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data) { setRealtimeOnly(data.persistence === false); setTemporaryReplay(data.replayStorage === 'memory'); } })
      .catch(() => {});
    return () => controller.abort();
  }, [isConnected]);
  const [playerId] = useState(
    `player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
  );

  // 房間密碼相關狀態
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState(null);
  const [pendingRoomName, setPendingRoomName] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // 創建房間 Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createRoomError, setCreateRoomError] = useState("");

  // 重連相關狀態
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempted, setReconnectAttempted] = useState(false);

  // 用 Room ID 加入
  const [joinRoomId, setJoinRoomId] = useState("");

  // 工單 0382：延遲顯示斷線錯誤的 timer ref
  const disconnectTimerRef = useRef(null);

  // 工單 0276：移除遊戲類型選擇（現在有獨立的遊戲選擇頁面）

  // 工單 202601260048：單人模式相關狀態
  const [showAIModal, setShowAIModal] = useState(false);
  const aiModalRef = useRef(null);
  const aiTriggerRef = useRef(null);

  useEffect(() => {
    if (!showAIModal) return undefined;
    const panel = aiModalRef.current;
    panel?.querySelector('[data-ai-count][aria-pressed="true"]')?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowAIModal(false);
        aiTriggerRef.current?.focus();
      }
      if (event.key === "Tab") {
        const controls = Array.from(
          panel?.querySelectorAll(
            "button:not(:disabled), select:not(:disabled)",
          ) || [],
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showAIModal]);
  const [showHelp, setShowHelp] = useState(false);
  const helpTriggerRef = useRef(null);
  const helpDialogRef = useRef(null);

  useEffect(() => {
    if (!showHelp) return undefined;
    const closeButton = helpDialogRef.current?.querySelector("button");
    closeButton?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Tab") {
        event.preventDefault();
        closeButton?.focus();
      }
      if (event.key === "Escape") {
        setShowHelp(false);
        helpTriggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showHelp]);
  const [aiConfig, setAIConfig] = useState({
    aiCount: 2,
    difficulties: [AI_DIFFICULTY.MEDIUM, AI_DIFFICULTY.MEDIUM],
  });

  // 載入時讀取儲存的暱稱
  useEffect(() => {
    const savedNickname = getNickname();
    if (savedNickname) {
      setNickname(savedNickname);
    }
  }, []);

  // 初始化 Socket 連線
  useEffect(() => {
    initSocket();

    // 工單 0382：延遲顯示斷線錯誤，避免初始化時閃現錯誤訊息
    const unsubConnect = onConnectionChange((connected) => {
      setIsConnected(connected);

      // 清除之前的延遲 timer
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }

      if (!connected) {
        // 延遲 3 秒後才顯示錯誤，給予重連時間
        disconnectTimerRef.current = setTimeout(() => {
          setError("多人連線中斷。你仍可選擇與 AI 練習。");
        }, 3000);
      } else {
        setError("");
      }
    });

    const unsubRooms = onRoomList((updatedRooms) => {
      setRooms(updatedRooms);
    });

    // 工單 0147：訂閱完成後，主動請求房間列表
    requestRoomList();

    const unsubError = onError(({ message }) => {
      setError(message);
      setIsLoading(false);
    });

    const unsubCreated = onRoomCreated(({ gameId, gameState }) => {
      saveCurrentRoom({
        roomId: gameId,
        playerId: playerId,
        playerName: nickname.trim(),
      });

      dispatch(
        updateGameState({
          gameId,
          players: gameState.players,
          maxPlayers: gameState.maxPlayers,
          gamePhase: gameState.gamePhase,
          currentPlayerId: playerId,
        }),
      );
      // 工單 0276：本草大廳只創建本草房間
      navigate(`/game/${gameId}`);
      setIsLoading(false);
      setShowCreateModal(false);
    });

    const unsubJoined = onJoinedRoom(({ gameId, gameState }) => {
      saveCurrentRoom({
        roomId: gameId,
        playerId: playerId,
        playerName: nickname.trim(),
      });

      dispatch(
        updateGameState({
          gameId,
          players: gameState.players,
          maxPlayers: gameState.maxPlayers,
          gamePhase: gameState.gamePhase,
          currentPlayerId: playerId,
        }),
      );
      // 工單 0276：本草大廳只加入本草房間
      navigate(`/game/${gameId}`);
      setIsLoading(false);
    });

    const unsubPassword = onPasswordRequired(({ gameId }) => {
      const room = rooms.find((r) => r.id === gameId);
      setPendingRoomId(gameId);
      setPendingRoomName(room ? room.name : "私人房間");
      setShowPasswordModal(true);
      setInputPassword("");
      setPasswordError("");
      setIsLoading(false);
    });

    const unsubReconnected = onReconnected(
      ({ gameId, playerId: reconnectedPlayerId, gameState }) => {
        console.log("[重連] 重連成功:", gameId);
        setIsReconnecting(false);
        dispatch(
          updateGameState({
            gameId,
            players: gameState.players,
            maxPlayers: gameState.maxPlayers,
            gamePhase: gameState.gamePhase,
            currentPlayerId: reconnectedPlayerId,
          }),
        );
        navigate(`/game/${gameId}`);
      },
    );

    const unsubReconnectFailed = onReconnectFailed(({ reason, message }) => {
      console.log("[重連] 重連失敗:", reason, message);
      setIsReconnecting(false);
      clearCurrentRoom();
      setError(`重連失敗：${message}`);
    });

    return () => {
      // 工單 0382：清理延遲 timer
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
      }
      unsubConnect();
      unsubRooms();
      unsubError();
      unsubCreated();
      unsubJoined();
      unsubPassword();
      unsubReconnected();
      unsubReconnectFailed();
    };
  }, [dispatch, navigate, playerId, rooms, nickname]);

  // 嘗試重連
  useEffect(() => {
    if (isConnected && !reconnectAttempted) {
      setReconnectAttempted(true);

      const savedRoom = getCurrentRoom();
      if (savedRoom && savedRoom.roomId && savedRoom.playerId) {
        console.log("[重連] 發現儲存的房間資訊，嘗試重連:", savedRoom);
        setIsReconnecting(true);
        attemptReconnect(
          savedRoom.roomId,
          savedRoom.playerId,
          savedRoom.playerName,
        );
      }
    }
  }, [isConnected, reconnectAttempted]);

  // 頁面重整前通知後端
  useEffect(() => {
    const handleBeforeUnload = () => {
      const savedRoom = getCurrentRoom();
      if (savedRoom && savedRoom.roomId && savedRoom.playerId) {
        emitPlayerRefreshing(savedRoom.roomId, savedRoom.playerId);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  /**
   * 驗證遊戲暱稱
   */
  const validateNicknameInput = () => {
    const nameError = getPlayerNameError(nickname);
    if (nameError) {
      setError(nameError);
      return false;
    }
    return true;
  };

  /**
   * 創建新房間
   */
  const handleCreateRoom = () => {
    if (!validateNicknameInput()) return;
    if (!isConnected) {
      setError("尚未連線到伺服器");
      return;
    }

    if (isPrivate) {
      const pwdError = getRoomPasswordError(roomPassword);
      if (pwdError) {
        setCreateRoomError(pwdError);
        return;
      }
    }

    saveNickname(nickname.trim());

    setIsLoading(true);
    setCreateRoomError("");

    const player = {
      id: playerId,
      name: nickname.trim(),
      firebaseUid: user?.isAnonymous ? null : user?.uid || null,
      photoURL: user?.photoURL || null,
    };

    createRoom(player, playerCount, isPrivate ? roomPassword : null);
  };

  /**
   * 快速加入房間
   */
  const handleQuickJoin = (
    selectedRoomId,
    roomIsPrivate = false,
    roomName = "",
  ) => {
    if (!validateNicknameInput()) return;
    if (!isConnected) {
      setError("尚未連線到伺服器");
      return;
    }

    if (roomIsPrivate) {
      setPendingRoomId(selectedRoomId);
      setPendingRoomName(roomName);
      setShowPasswordModal(true);
      setInputPassword("");
      setPasswordError("");
      return;
    }

    saveNickname(nickname.trim());

    setIsLoading(true);
    setError("");

    const player = {
      id: playerId,
      name: nickname.trim(),
      firebaseUid: user?.isAnonymous ? null : user?.uid || null,
      photoURL: user?.photoURL || null,
    };

    joinRoom(selectedRoomId, player);
  };

  /**
   * 用 Room ID 加入房間
   */
  const handleJoinByRoomId = () => {
    if (!joinRoomId.trim()) {
      setError("請輸入房間 ID");
      return;
    }
    if (!validateNicknameInput()) return;
    if (!isConnected) {
      setError("尚未連線到伺服器");
      return;
    }

    const room = rooms.find((r) => r.id === joinRoomId.trim());
    if (room && room.isPrivate) {
      setPendingRoomId(joinRoomId.trim());
      setPendingRoomName(room.name);
      setShowPasswordModal(true);
      setInputPassword("");
      setPasswordError("");
      return;
    }

    saveNickname(nickname.trim());

    setIsLoading(true);
    setError("");

    const player = {
      id: playerId,
      name: nickname.trim(),
      firebaseUid: user?.isAnonymous ? null : user?.uid || null,
      photoURL: user?.photoURL || null,
    };

    joinRoom(joinRoomId.trim(), player);
  };

  /**
   * 提交密碼加入私人房間
   */
  const handlePasswordSubmit = () => {
    if (!inputPassword) {
      setPasswordError("請輸入密碼");
      return;
    }

    saveNickname(nickname.trim());

    setIsLoading(true);
    setShowPasswordModal(false);

    const player = {
      id: playerId,
      name: nickname.trim(),
      firebaseUid: user?.isAnonymous ? null : user?.uid || null,
      photoURL: user?.photoURL || null,
    };

    joinRoom(pendingRoomId, player, inputPassword);
  };

  /**
   * 關閉密碼輸入框
   */
  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPendingRoomId(null);
    setPendingRoomName("");
    setInputPassword("");
    setPasswordError("");
  };

  /**
   * 獲取玩家名稱首字母
   */
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  /**
   * 判斷房間是否可加入
   */
  const canJoinRoom = (room) => {
    return room.playerCount < (room.maxPlayers || 4);
  };

  /**
   * 工單 202601260048：打開 AI 設定 Modal
   */
  const handleOpenAIModal = () => {
    if (!validateNicknameInput()) {
      document.getElementById("nickname")?.focus();
      return;
    }
    setShowAIModal(true);
  };

  /**
   * 工單 202601260048：關閉 AI 設定 Modal
   */
  const handleCloseAIModal = () => {
    setShowAIModal(false);
    aiTriggerRef.current?.focus();
  };

  /**
   * 工單 202601260048：處理 AI 配置變更
   */
  const handleAIConfigChange = useCallback((newConfig) => {
    setAIConfig(newConfig);
  }, []);

  /**
   * 工單 202601260048：開始單人遊戲
   */
  const handleStartSinglePlayer = () => {
    if (!nickname.trim()) {
      setError("請輸入遊戲暱稱");
      return;
    }

    console.log("[Lobby] 開始單人遊戲，aiConfig:", aiConfig);

    // 儲存暱稱到 localStorage
    saveNickname(nickname.trim());

    // 使用 URL 參數傳遞 aiConfig（避免 state 在刷新後丟失）
    const params = new URLSearchParams({
      mode: "single",
      aiCount: aiConfig.aiCount.toString(),
      difficulties: aiConfig.difficulties.join(","),
      playerName: nickname.trim(),
      playerId: playerId,
    });

    // 導航到單人模式遊戲（使用 URL 參數 + state）
    navigate(`/game/local-game?${params.toString()}`, {
      state: {
        aiConfig,
        playerName: nickname.trim(),
        playerId,
      },
    });
  };

  return (
    <div className="lobby">
      {/* 重連中覆蓋層 */}
      {isReconnecting && (
        <div className="modal-overlay">
          <div className="modal reconnecting-modal">
            <div className="reconnecting-spinner"></div>
            <p>正在嘗試重新連線...</p>
          </div>
        </div>
      )}

      <header className="herb-lobby-topbar lobby-header">
        <button
          className="herb-lobby-brand"
          title="遊戲大廳"
          onClick={() => navigate("/")}
          aria-label="返回遊戲選擇"
        >
          <span aria-hidden="true">✳</span>
          <span>
            本草<small>遊戲大廳</small>
          </span>
        </button>
        <nav className="lobby-sidebar" aria-label="帳戶導覽">
          <button title="個人資料" onClick={() => navigate("/profile")}>
            個人資料
          </button>
          <button title="好友" onClick={() => navigate("/friends")}>
            好友
          </button>
          <button title="對局記錄與歷史回放" onClick={() => navigate("/history")}>對局記錄</button>
          <button title="排行榜" onClick={() => navigate("/leaderboard")}>
            排行榜
          </button>
        </nav>
        <div className="lobby-user-area">
          <span className="lobby-avatar" aria-hidden="true">
            {getInitial(displayName)}
          </span>
          <span>{displayName}</span>
        </div>
      </header>
      <main className="herb-lobby-content lobby-content">
        <div className="herb-lobby-intro">
          <BotanicalFan /><div className="herb-title-lockup"><small>HERBALISM</small><h1>本草</h1><span>一味草藥，一場心局。</span></div>
        </div>
        <div className="herb-lobby-layout">
          <section className="herb-practice" aria-labelledby="practice-title">
            <div className="herb-practice-heading">
              <h2 id="practice-title">單人模式</h2>
              <span className="herb-mode-tag">與 2–3 位 AI 對局</span>
            </div>
            <div className="nickname-section">
              <label className="nickname-label" htmlFor="nickname">
                遊戲暱稱 <small>2–12 字元</small>
              </label>
              <input
                id="nickname"
                aria-label="遊戲暱稱"
                className="nickname-input"
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError("");
                }}
                placeholder="今天怎麼稱呼你？"
                maxLength={12}
                disabled={isLoading}
                aria-describedby="nickname-help"
              />
              <small id="nickname-help">暱稱會顯示在牌桌上。</small>
            </div>
            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}
            <button
              className="single-player-btn"
              ref={aiTriggerRef}
              onClick={handleOpenAIModal}
            >
              與 AI 練習 <span aria-hidden="true">↗</span>
            </button>
            <p className="herb-practice-foot">不需等待其他玩家 · 可選擇難度</p>
          </section>
          <section className="herb-online" aria-labelledby="online-title">
            <div className="herb-practice-heading">
              <h2 id="online-title">多人模式</h2>
              <span
                className={`herb-network ${isConnected ? "is-online" : ""}`}
              >
                {isConnected ? (
                  "多人已就緒"
                ) : (
                  <>
                    <span>線上模式</span>
                    <span>未連線</span>
                  </>
                )}
              </span>
            </div>
            {!isConnected && (
              <p className="herb-network-note" role="status">
                多人未連線，仍可與 AI 練習。
              </p>
            )}
            <button
              className="create-room-btn"
              onClick={() => {
                setCreateRoomError("");
                setShowCreateModal(true);
              }}
              disabled={!isConnected || isLoading}
            >
              <span aria-hidden="true">＋</span> 創建新房間
            </button>
            <label className="herb-room-label" htmlFor="join-room-id">
              房間 ID
            </label>
            <div className="join-room-section">
              <input
                id="join-room-id"
                className="join-room-input"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="輸入房間 ID"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJoinByRoomId();
                }}
              />
              <button
                className="join-room-btn"
                onClick={handleJoinByRoomId}
                disabled={!isConnected || isLoading || !joinRoomId.trim()}
              >
                加入
              </button>
            </div>
            <div className="herb-room-list-heading">
              <h3>公開牌桌</h3>
              <span>
                {
                  rooms.filter(
                    (room) => !room.gameType || room.gameType === "herbalism",
                  ).length
                }{" "}
                間
              </span>
            </div>
            <div className="room-table-container">
              {rooms.filter(
                (room) => !room.gameType || room.gameType === "herbalism",
              ).length === 0 ? (
                <div className="no-rooms">
                  <span aria-hidden="true">⌑</span>
                  <strong>
                    {isConnected
                      ? "第一桌，就由你開始。"
                      : "等連線好了，再和朋友相聚。"}
                  </strong>
                  <p>
                    {isConnected
                      ? "創建新房間，邀朋友一起來推理。"
                      : "目前沒有可用的房間。"}
                  </p>
                </div>
              ) : (
                <table className="room-table">
                  <thead>
                    <tr>
                      <th>房間</th>
                      <th>玩家</th>
                      <th>狀態</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms
                      .filter(
                        (room) =>
                          !room.gameType || room.gameType === "herbalism",
                      )
                      .map((room) => (
                        <tr key={room.id}>
                          <td>
                            <strong>
                              {room.name}
                              {room.isPrivate && (
                                <span
                                  className="private-icon"
                                  aria-label="私人房間"
                                >
                                  ◇
                                </span>
                              )}
                            </strong>
                            <small>{room.id}</small>
                          </td>
                          <td>
                            {room.playerCount}/{room.maxPlayers || 4}
                          </td>
                          <td>
                            <span
                              className={`room-status ${canJoinRoom(room) ? "waiting" : "full"}`}
                            >
                              {canJoinRoom(room) ? "等待中" : "已滿"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="room-action-btn"
                              onClick={() =>
                                handleQuickJoin(
                                  room.id,
                                  room.isPrivate,
                                  room.name,
                                )
                              }
                              disabled={
                                isLoading || !isConnected || !canJoinRoom(room)
                              }
                            >
                              {canJoinRoom(room) ? "加入" : "已滿"}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </main>
      <footer className="herb-lobby-footer">
        <span>
          {isConnected
            ? realtimeOnly ? temporaryReplay ? "多人連線 · 戰績與重放暫存，重啟清空" : "多人連線 · 不留戰績，重啟清空房間" : "多人服務就緒"
            : "單人模式可用 · 多人未連線"}
        </span>
        <div>
          <button onClick={() => navigate("/")}>← 選遊戲</button>
          <button ref={helpTriggerRef} onClick={() => setShowHelp(true)}>
            ？ 玩法
          </button>
        </div>
      </footer>
      {showHelp && (
        <div className="modal-overlay">
          <section
            className="modal herb-help-dialog"
            ref={helpDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="herb-help-title"
          >
            <header>
              <h2 id="herb-help-title">本草玩法</h2>
              <button
                onClick={() => {
                  setShowHelp(false);
                  helpTriggerRef.current?.focus();
                }}
                aria-label="關閉玩法"
              >
                關閉 ×
              </button>
            </header>
            <ol>
              <li>
                <strong>看手牌</strong>
                <p>你只知道自己的牌，目標是推理桌中央兩張蓋牌的顏色。</p>
              </li>
              <li>
                <strong>問牌找線索</strong>
                <p>輪到你時選擇兩種顏色，再選玩家問牌，從回答排除可能性。</p>
              </li>
              <li>
                <strong>猜牌或繼續觀察</strong>
                <p>
                  掌握線索後再猜牌。猜錯會退出本輪；別人的猜測也可選擇跟猜。
                </p>
              </li>
            </ol>
            <p>按 Esc 或「關閉」回到主選單。</p>
          </section>
        </div>
      )}

      {/* 創建房間 Modal（工單 0128 重新設計）*/}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="create-room-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 裝飾圖示 */}
            <span aria-hidden="true">✳</span>
            <span aria-hidden="true">✳</span>

            {/* 頂部區域 */}
            <div className="crm-header">
              <span aria-hidden="true">＋</span>
              <h2 className="crm-title">創建新房間</h2>
              <p className="crm-subtitle">設定房間參數後開始遊戲</p>
            </div>

            {/* 表單區域 */}
            <div className="crm-form">
              {/* 玩家數量 */}
              <div className="crm-input-group">
                <label htmlFor="createPlayerCount">玩家數量</label>
                <select
                  id="createPlayerCount"
                  className="crm-select"
                  value={playerCount}
                  onChange={(e) => setPlayerCount(parseInt(e.target.value, 10))}
                  disabled={isLoading}
                >
                  <option value={3}>3人</option>
                  <option value={4}>4人</option>
                </select>
              </div>

              {/* 設為私人房間 */}
              <div className="crm-checkbox-row">
                <div className="crm-checkbox-left">
                  <input
                    type="checkbox"
                    id="privateToggle"
                    className="crm-checkbox"
                    checked={isPrivate}
                    onChange={(e) => {
                      setIsPrivate(e.target.checked);
                      if (!e.target.checked) {
                        setRoomPassword("");
                      }
                    }}
                    disabled={isLoading}
                  />
                  <label htmlFor="privateToggle" className="crm-checkbox-label">
                    設為私人房間
                  </label>
                </div>
                <span aria-hidden="true">◇</span>
              </div>

              {/* 房間密碼（條件顯示）*/}
              {isPrivate && (
                <div className="crm-password-group">
                  <label htmlFor="createRoomPassword">房間密碼</label>
                  <div className="crm-password-wrapper">
                    <input
                      id="createRoomPassword"
                      type="password"
                      className="crm-password-input"
                      value={roomPassword}
                      onChange={(e) => {
                        setRoomPassword(e.target.value);
                        setCreateRoomError("");
                      }}
                      placeholder="請輸入密碼"
                      maxLength={16}
                      disabled={isLoading}
                    />
                    <span aria-hidden="true">⌑</span>
                  </div>
                </div>
              )}

              {/* 錯誤訊息 */}
              {createRoomError && (
                <div className="crm-error" role="alert">
                  {createRoomError}
                </div>
              )}
            </div>

            {/* 按鈕區域 */}
            <div className="crm-actions">
              <button
                type="button"
                className="crm-btn crm-btn-cancel"
                onClick={() => setShowCreateModal(false)}
                disabled={isLoading}
              >
                取消
              </button>
              <button
                type="button"
                className="crm-btn crm-btn-confirm"
                onClick={handleCreateRoom}
                disabled={isLoading || !isConnected}
              >
                <span aria-hidden="true">✓</span>
                {isLoading ? "創建中..." : "創建房間"}
              </button>
            </div>

            {/* 底部金色橫條 */}
            <div className="crm-bottom-accent"></div>
          </div>
        </div>
      )}

      {/* 密碼輸入 Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal password-modal">
            <h3>
              <span aria-hidden="true">◇</span>
              私人房間
            </h3>
            <p>「{pendingRoomName}」需要密碼才能加入</p>

            <div className="input-group">
              <input
                type="password"
                value={inputPassword}
                onChange={(e) => {
                  setInputPassword(e.target.value);
                  setPasswordError("");
                }}
                placeholder="請輸入房間密碼"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handlePasswordSubmit();
                  }
                }}
              />
            </div>

            {passwordError && <p className="modal-error">{passwordError}</p>}

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={handlePasswordCancel}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePasswordSubmit}
                disabled={isLoading}
              >
                {isLoading ? "加入中..." : "加入"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 工單 202601260048：AI 設定 Modal */}
      {showAIModal && (
        <div className="modal-overlay">
          <div
            className="modal ai-modal"
            ref={aiModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-modal-title"
          >
            <header className="ai-modal-header">
              <div>
                <span className="ai-salon-eyebrow">HERBALISM · 私人牌局</span>
                <h3 id="ai-modal-title">單人模式設定</h3>
                <p className="modal-description">
                  {nickname} · 選擇對手，準備開局
                </p>
              </div>
              <button
                type="button"
                className="ai-modal-close"
                onClick={handleCloseAIModal}
                aria-label="關閉單人模式設定"
              >
                ×
              </button>
            </header>
            <div className="ai-modal-body">
              <AIPlayerSelector onConfigChange={handleAIConfigChange} />
              {error && (
                <p className="ai-modal-error" role="alert">
                  {error}
                </p>
              )}
            </div>
            <footer className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={handleCloseAIModal}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleStartSinglePlayer}
              >
                開始遊戲
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

export default Lobby;
