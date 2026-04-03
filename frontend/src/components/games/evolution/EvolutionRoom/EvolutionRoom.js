/**
 * 演化論遊戲房間組件
 *
 * @module components/games/evolution/EvolutionRoom
 * 工單 0274：連接 Socket.io
 */

import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  evolutionActions,
  selectEvolutionState,
  selectPhase,
  selectMyHand,
  selectMyCreatures,
  selectFoodPool,
  selectIsMyTurn,
  selectPlayers,
  selectPendingResponse
} from '../../../../store/evolution/evolutionStore';
import { useAuth } from '../../../../firebase/AuthContext';
import { EvolutionLobby } from '../EvolutionLobby';
import {
  evoJoinRoom,
  evoCreateCreature,
  evoAddTrait,
  evoPassEvolution,
  evoFeedCreature,
  evoAttack,
  evoRespondAttack,
  evoUseTrait,
  onEvoJoinedRoom,
  onEvoGameStarted,
  onEvoGameState,
  onEvoCreatureCreated,
  onEvoTraitAdded,
  onEvoPlayerPassed,
  onEvoCreatureFed,
  onEvoChainTriggered,
  onEvoAttackPending,
  onEvoAttackResolved,
  onEvoTraitUsed,
  onEvoError
} from '../../../../services/socketService';
import LocalEvolutionGameController from '../../../../controllers/evolution/LocalEvolutionGameController';
import { createEvolutionAIPlayer } from '../../../../ai/evolution';
import AIThinkingIndicator from '../../herbalism/AIThinkingIndicator/AIThinkingIndicator';
import './EvolutionRoom.css';

// 階段名稱對照
const PHASE_NAMES = {
  waiting: '等待開始',
  evolution: '演化階段',
  foodSupply: '食物供給',
  feeding: '進食階段',
  extinction: '滅絕階段',
  gameEnd: '遊戲結束'
};

/**
 * 演化論遊戲房間組件
 */
function EvolutionRoom() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId } = useParams();
  const { user } = useAuth();

  // ==================== 本地模式檢測 ====================
  const isLocalMode = roomId === 'local-game';

  // 從 location state 或 URL params 取得 AI 設定
  const getLocalConfig = () => {
    if (!isLocalMode) return null;
    const params = new URLSearchParams(location.search);
    const state = location.state;
    return {
      aiCount: state?.aiConfig?.aiCount || parseInt(params.get('aiCount') || '1', 10),
      difficulty: state?.aiConfig?.difficulty || params.get('difficulty') || 'medium',
      playerName: state?.playerName || params.get('playerName') || '玩家',
      playerId: state?.playerId || params.get('playerId') || `player_${Date.now()}`
    };
  };
  const localConfig = getLocalConfig();

  // 本地遊戲控制器（單人模式）
  const localControllerRef = useRef(null);

  // AI 玩家實例
  const aiPlayersRef = useRef([]);
  const [aiThinking, setAIThinking] = useState(false);
  const [thinkingAIName, setThinkingAIName] = useState('');

  // ==================== 工單 0280：從 location state 取得房間資料 ====================
  const initialRoomData = location.state?.room;
  const isCreator = location.state?.isCreator;

  // 本地狀態
  // 工單 0280：使用 location state 中的房間資料初始化
  const [room, setRoom] = useState(initialRoomData || null);
  const [isJoined, setIsJoined] = useState(!!initialRoomData || isLocalMode);
  const [error, setError] = useState(null);
  // 工單 0284：生成穩定的玩家 ID
  const [myPlayerId] = useState(() => {
    if (isLocalMode && localConfig) return localConfig.playerId;
    return `player_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  });

  // Redux 狀態
  const evolutionState = useSelector(selectEvolutionState);
  const phase = useSelector(selectPhase);
  const myHand = useSelector(selectMyHand);
  const myCreatures = useSelector(selectMyCreatures);
  const foodPool = useSelector(selectFoodPool);
  const isMyTurn = useSelector(selectIsMyTurn);
  const players = useSelector(selectPlayers);
  const pendingResponse = useSelector(selectPendingResponse);

  // 工單 0284：計算當前玩家的實際 ID（用於遊戲動作）
  const currentPlayerId = useMemo(() => {
    if (!user?.uid) return null;
    const myPlayer = room?.players?.find(p => p.firebaseUid === user.uid);
    return myPlayer?.id || myPlayerId;
  }, [user?.uid, room, myPlayerId]);

  // 工單 0284：設定玩家 ID，優先使用房間中的實際 player.id
  useEffect(() => {
    if (!user?.uid) return;
    // 如果房間資料可用，使用房間中的實際 player.id
    const myPlayer = room?.players?.find(p => p.firebaseUid === user.uid);
    const playerId = myPlayer?.id || myPlayerId;
    dispatch(evolutionActions.setMyPlayerId(playerId));
  }, [user, room, myPlayerId, dispatch]);

  // ==================== 本地模式初始化 ====================
  useEffect(() => {
    if (!isLocalMode || !localConfig) return;
    if (localControllerRef.current) return;

    console.log('[EvolutionRoom] 初始化本地遊戲，設定:', localConfig);

    // 設定自己的 ID
    dispatch(evolutionActions.setMyPlayerId(localConfig.playerId));

    // 建立 AI 玩家實例
    const aiPlayers = [];
    for (let i = 0; i < localConfig.aiCount; i++) {
      const ai = createEvolutionAIPlayer(
        `ai-${i + 1}`,
        null,
        localConfig.difficulty
      );
      aiPlayers.push(ai);
    }
    aiPlayersRef.current = aiPlayers;

    // 人類玩家定義
    const humanPlayerDef = {
      id: localConfig.playerId,
      name: localConfig.playerName,
      isAI: false
    };

    // 所有玩家（人 + AI）
    const allPlayerDefs = [
      humanPlayerDef,
      ...aiPlayers.map(ai => ({ id: ai.id, name: ai.name, isAI: true }))
    ];

    // 建立本地遊戲控制器
    const controller = new LocalEvolutionGameController({
      players: allPlayerDefs,
      onStateChange: (newState) => {
        // 將本地遊戲狀態映射到 Redux store 格式
        dispatch(evolutionActions.setGameState({
          ...newState,
          myPlayerId: localConfig.playerId
        }));
      },
      onEvent: (event) => {
        console.log('[EvolutionRoom] 本地事件:', event.type);
        // 記錄到 action log
        dispatch(evolutionActions.addLog({ ...event }));
      }
    });

    localControllerRef.current = controller;
    controller.startGame();
    console.log('[EvolutionRoom] 本地遊戲已開始');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocalMode]);

  // ==================== 自動觸發 AI 回合（本地模式） ====================

  useEffect(() => {
    if (!isLocalMode || !localControllerRef.current) return;

    const currentPlayerId = evolutionState.currentPlayerId;
    if (!currentPlayerId) return;

    const isAITurn = currentPlayerId.startsWith('ai-');
    if (!isAITurn) return;

    const phase = evolutionState.phase;
    if (phase !== 'evolution' && phase !== 'feeding') return;

    // 檢查 AI 是否已 pass
    const currentPlayer = evolutionState.players?.[currentPlayerId];
    if (!currentPlayer) return;
    if (phase === 'evolution' && currentPlayer.hasPassedEvolution) return;
    if (phase === 'feeding' && currentPlayer.hasPassedFeeding) return;

    const aiInstance = aiPlayersRef.current.find(ai => ai.id === currentPlayerId);
    if (!aiInstance || aiInstance.isThinking) return;

    setAIThinking(true);
    setThinkingAIName(aiInstance.name);

    const aiTurnDelayTimer = setTimeout(async () => {
      try {
        const action = await aiInstance.takeTurn(evolutionState);
        console.log(`[EvolutionRoom] AI ${aiInstance.name} 動作:`, action);

        if (localControllerRef.current) {
          await localControllerRef.current.handleAction(action, currentPlayerId);
        }
      } catch (err) {
        console.error('[EvolutionRoom] AI 回合錯誤:', err);
      } finally {
        setAIThinking(false);
        setThinkingAIName('');
      }
    }, 300);

    return () => clearTimeout(aiTurnDelayTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocalMode, evolutionState.currentPlayerId, evolutionState.phase]);

  // 加入房間
  // 工單 0280, 0284：避免房主重複加入，使用 firebaseUid 識別
  useEffect(() => {
    // 本地模式不需要加入房間
    if (isLocalMode) return;
    if (!roomId || !user?.uid || isJoined) return;

    // 工單 0284：使用 firebaseUid 判斷是否已在房間中
    if (isCreator || (room && room.players?.some(p => p.firebaseUid === user.uid))) {
      console.log('[EvolutionRoom] 已是房間成員，跳過加入請求');
      setIsJoined(true);
      return;
    }

    console.log('[EvolutionRoom] 嘗試加入房間:', roomId);
    // 工單 0284：發送完整的玩家物件，包含 firebaseUid
    evoJoinRoom(roomId, {
      id: myPlayerId,
      name: user.displayName || user.email?.split('@')[0] || '玩家',
      firebaseUid: user.uid,
      photoURL: user?.photoURL || null
    });
  }, [roomId, user, isJoined, isCreator, room, myPlayerId, isLocalMode]);

  // Socket 事件監聽（多人模式）
  useEffect(() => {
    // 本地模式不需要 Socket 事件
    if (isLocalMode) return;
    // 監聽加入房間成功
    const unsubJoinedRoom = onEvoJoinedRoom(({ roomId: joinedRoomId, room: joinedRoom }) => {
      console.log('[EvolutionRoom] 已加入房間:', joinedRoomId);
      setRoom(joinedRoom);
      setIsJoined(true);
    });

    // 監聽遊戲開始
    const unsubGameStarted = onEvoGameStarted((gameState) => {
      console.log('[EvolutionRoom] 遊戲開始:', gameState);
      dispatch(evolutionActions.setGameState(gameState));
    });

    // 監聽遊戲狀態更新
    const unsubGameState = onEvoGameState((gameState) => {
      console.log('[EvolutionRoom] 遊戲狀態更新:', gameState);
      dispatch(evolutionActions.setGameState(gameState));
    });

    // 監聽生物創建
    const unsubCreatureCreated = onEvoCreatureCreated((data) => {
      dispatch(evolutionActions.addLog({
        type: 'creatureCreated',
        ...data
      }));
    });

    // 監聽性狀添加
    const unsubTraitAdded = onEvoTraitAdded((data) => {
      dispatch(evolutionActions.addLog({
        type: 'traitAdded',
        ...data
      }));
    });

    // 監聽玩家跳過
    const unsubPlayerPassed = onEvoPlayerPassed((data) => {
      dispatch(evolutionActions.addLog({
        type: 'playerPassed',
        ...data
      }));
    });

    // 監聽生物進食
    const unsubCreatureFed = onEvoCreatureFed((data) => {
      dispatch(evolutionActions.addLog({
        type: 'creatureFed',
        ...data
      }));
    });

    // 監聽連鎖效應
    const unsubChainTriggered = onEvoChainTriggered((chainEffects) => {
      console.log('[EvolutionRoom] 連鎖效應:', chainEffects);
    });

    // 監聽攻擊待處理
    const unsubAttackPending = onEvoAttackPending((pendingData) => {
      console.log('[EvolutionRoom] 攻擊待處理:', pendingData);
      dispatch(evolutionActions.setPendingResponse(pendingData));
    });

    // 監聽攻擊結果
    const unsubAttackResolved = onEvoAttackResolved((data) => {
      console.log('[EvolutionRoom] 攻擊結果:', data);
      dispatch(evolutionActions.clearPendingResponse());
      dispatch(evolutionActions.addLog({
        type: 'attackResolved',
        ...data
      }));
    });

    // 監聽性狀使用
    const unsubTraitUsed = onEvoTraitUsed((data) => {
      dispatch(evolutionActions.addLog({
        type: 'traitUsed',
        ...data
      }));
    });

    // 監聽錯誤
    const unsubError = onEvoError(({ message }) => {
      console.error('[EvolutionRoom] 錯誤:', message);
      setError(message);
      setTimeout(() => setError(null), 3000);
    });

    return () => {
      unsubJoinedRoom();
      unsubGameStarted();
      unsubGameState();
      unsubCreatureCreated();
      unsubTraitAdded();
      unsubPlayerPassed();
      unsubCreatureFed();
      unsubChainTriggered();
      unsubAttackPending();
      unsubAttackResolved();
      unsubTraitUsed();
      unsubError();
    };
  }, [dispatch]);

  // 處理卡牌選擇
  const handleCardSelect = useCallback((card) => {
    dispatch(evolutionActions.setSelectedCard(card));
  }, [dispatch]);

  // 處理生物選擇
  const handleCreatureSelect = useCallback((creature) => {
    dispatch(evolutionActions.setSelectedCreature(creature));
  }, [dispatch]);

  // 工單 0284：所有遊戲動作使用 currentPlayerId 而非 user?.uid

  // 處理出牌為生物
  const handlePlayAsCreature = useCallback((cardId) => {
    if (!cardId || !currentPlayerId) return;
    console.log('[EvolutionRoom] 創造生物:', cardId);
    if (isLocalMode && localControllerRef.current) {
      localControllerRef.current.handleAction({ type: 'createCreature', cardId }, currentPlayerId);
    } else {
      evoCreateCreature(roomId, currentPlayerId, cardId);
    }
    dispatch(evolutionActions.clearSelections());
  }, [roomId, currentPlayerId, isLocalMode, dispatch]);

  // 處理出牌為性狀
  const handlePlayAsTrait = useCallback((cardId, creatureId, linkedCreatureId = null) => {
    if (!cardId || !creatureId || !currentPlayerId) return;
    console.log('[EvolutionRoom] 賦予性狀:', cardId, creatureId, linkedCreatureId);
    if (isLocalMode && localControllerRef.current) {
      localControllerRef.current.handleAction({ type: 'addTrait', cardId, creatureId }, currentPlayerId);
    } else {
      evoAddTrait(roomId, currentPlayerId, cardId, creatureId, linkedCreatureId);
    }
    dispatch(evolutionActions.clearSelections());
  }, [roomId, currentPlayerId, isLocalMode, dispatch]);

  // 處理進食
  const handleFeed = useCallback((creatureId) => {
    if (!creatureId || !currentPlayerId) return;
    console.log('[EvolutionRoom] 進食:', creatureId);
    if (isLocalMode && localControllerRef.current) {
      localControllerRef.current.handleAction({ type: 'feed', creatureId }, currentPlayerId);
    } else {
      evoFeedCreature(roomId, currentPlayerId, creatureId);
    }
  }, [roomId, currentPlayerId, isLocalMode]);

  // 處理攻擊
  const handleAttack = useCallback((attackerCreatureId, targetCreatureId, targetPlayerId) => {
    if (!attackerCreatureId || !targetCreatureId || !currentPlayerId) return;
    console.log('[EvolutionRoom] 攻擊:', attackerCreatureId, targetCreatureId);
    if (isLocalMode && localControllerRef.current) {
      localControllerRef.current.handleAction({
        type: 'attack',
        attackerCreatureId,
        targetCreatureId,
        targetPlayerId: targetPlayerId || evolutionState.currentPlayerId
      }, currentPlayerId);
    } else {
      evoAttack(roomId, currentPlayerId, attackerCreatureId, targetCreatureId);
    }
  }, [roomId, currentPlayerId, isLocalMode, evolutionState.currentPlayerId]);

  // 處理跳過
  const handlePass = useCallback(() => {
    if (!currentPlayerId) return;
    console.log('[EvolutionRoom] 跳過');
    if (isLocalMode && localControllerRef.current) {
      localControllerRef.current.handleAction({ type: 'pass' }, currentPlayerId);
    } else {
      evoPassEvolution(roomId, currentPlayerId);
    }
  }, [roomId, currentPlayerId, isLocalMode]);

  // 處理防禦回應
  const handleDefenseResponse = useCallback((responseType, traitId = null, targetId = null) => {
    if (!currentPlayerId) return;
    console.log('[EvolutionRoom] 防禦回應:', responseType, traitId, targetId);
    if (!isLocalMode) {
      evoRespondAttack(roomId, currentPlayerId, {
        type: responseType,
        traitId,
        targetId
      });
    }
  }, [roomId, currentPlayerId, isLocalMode]);

  // 處理使用性狀能力
  const handleUseTrait = useCallback((creatureId, traitType, targetId = null) => {
    if (!creatureId || !traitType || !roomId || !currentPlayerId) return;
    console.log('[EvolutionRoom] 使用性狀:', creatureId, traitType, targetId);
    evoUseTrait(roomId, currentPlayerId, creatureId, traitType, targetId);
  }, [roomId, currentPlayerId]);

  // 遊戲開始回調
  const handleGameStart = useCallback((gameState) => {
    console.log('[EvolutionRoom] 遊戲開始回調:', gameState);
    dispatch(evolutionActions.setGameState(gameState));
  }, [dispatch]);

  // 離開房間回調
  const handleLeaveRoom = useCallback(() => {
    // 工單 0276：返回演化論大廳
    navigate('/lobby/evolution');
  }, [navigate]);

  // 取得對手列表
  const opponents = Object.values(players || {}).filter(
    p => p.id !== evolutionState.myPlayerId
  );

  // 等待中 - 顯示房間等待介面（多人模式才需要等待）
  if (phase === 'waiting' && !isLocalMode) {
    return (
      <EvolutionLobby
        roomId={roomId}
        initialRoom={room}
        onGameStart={handleGameStart}
        onLeave={handleLeaveRoom}
      />
    );
  }

  return (
    <div className="evolution-room">
      {/* 錯誤訊息 */}
      {error && (
        <div className="error-toast">
          {error}
        </div>
      )}

      {/* AI 思考指示器 */}
      {isLocalMode && aiThinking && (
        <div className="ai-thinking-banner">
          <AIThinkingIndicator isThinking={aiThinking} aiName={thinkingAIName} size="medium" />
        </div>
      )}

      {/* 階段指示器 */}
      <div className="phase-indicator">
        <span className="phase-name">{PHASE_NAMES[phase] || phase}</span>
        <span className="round-number">第 {evolutionState.round} 回合</span>
        {isMyTurn && <span className="turn-indicator">輪到你了！</span>}
      </div>

      {/* 遊戲區域 */}
      <div className="game-area">
        {/* 對手區域 */}
        <div className="opponents-area">
          {opponents.map(opponent => (
            <div key={opponent.id} className="opponent-section">
              <div className="opponent-info">
                <span className="opponent-name">{opponent.name}</span>
                <span className="hand-count">手牌: {
                  typeof opponent.hand === 'number' ? opponent.hand : opponent.hand?.length || 0
                }</span>
              </div>
              <div className="opponent-creatures">
                {(opponent.creatures || []).map(creature => (
                  <div
                    key={creature.id}
                    className={`creature-card opponent-creature ${
                      evolutionState.selectedCreature?.id === creature.id ? 'selected' : ''
                    }`}
                    onClick={() => handleCreatureSelect(creature)}
                  >
                    <div className="creature-body">🦎</div>
                    <div className="creature-traits">
                      {(creature.traits || []).map(trait => (
                        <span key={trait.id} className="trait-badge">{trait.type}</span>
                      ))}
                    </div>
                    <div className="creature-food">
                      🔴{creature.food?.red || 0} 🔵{creature.food?.blue || 0}
                      {creature.isFed && ' ✓'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 中央食物池 */}
        <div className="food-pool-area">
          <div className="food-pool">
            <span className="food-icon">🍖</span>
            <span className="food-count">{foodPool}</span>
          </div>
          <div className="deck-count">
            牌庫: {evolutionState.deckCount}
          </div>
          {evolutionState.diceResult?.length > 0 && (
            <div className="dice-result">
              骰子: {evolutionState.diceResult.join(' + ')}
            </div>
          )}
        </div>

        {/* 我的區域 */}
        <div className="my-area">
          {/* 我的生物 */}
          <div className="my-creatures">
            {myCreatures.map(creature => (
              <div
                key={creature.id}
                className={`creature-card my-creature ${
                  evolutionState.selectedCreature?.id === creature.id ? 'selected' : ''
                }`}
                onClick={() => handleCreatureSelect(creature)}
              >
                <div className="creature-body">🦎</div>
                <div className="creature-traits">
                  {(creature.traits || []).map(trait => (
                    <span key={trait.id} className="trait-badge">{trait.type}</span>
                  ))}
                </div>
                <div className="creature-food">
                  🔴{creature.food?.red || 0} 🔵{creature.food?.blue || 0}
                  {creature.food?.yellow > 0 && ` 🟡${creature.food.yellow}`}
                  {creature.isFed && ' ✓'}
                </div>
                <div className="creature-need">
                  需求: {creature.foodNeeded}
                </div>
              </div>
            ))}
            {myCreatures.length === 0 && (
              <div className="no-creatures">尚無生物</div>
            )}
          </div>

          {/* 我的手牌 */}
          <div className="my-hand">
            {myHand.map(card => (
              <div
                key={card.id}
                className={`hand-card ${
                  evolutionState.selectedCard?.id === card.id ? 'selected' : ''
                }`}
                onClick={() => handleCardSelect(card)}
              >
                <div className="card-type">{card.traitType}</div>
                <div className="card-info">
                  {card.foodBonus > 0 && <span>+{card.foodBonus} 食量</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="action-buttons">
        {phase === 'evolution' && isMyTurn && (
          <>
            <button
              className="action-btn"
              disabled={!evolutionState.selectedCard}
              onClick={() => handlePlayAsCreature(evolutionState.selectedCard?.id)}
            >
              創造生物
            </button>
            <button
              className="action-btn"
              disabled={!evolutionState.selectedCard || !evolutionState.selectedCreature}
              onClick={() => handlePlayAsTrait(
                evolutionState.selectedCard?.id,
                evolutionState.selectedCreature?.id
              )}
            >
              賦予性狀
            </button>
            <button className="action-btn pass-btn" onClick={handlePass}>
              跳過
            </button>
          </>
        )}

        {phase === 'feeding' && isMyTurn && (
          <>
            <button
              className="action-btn"
              disabled={!evolutionState.selectedCreature}
              onClick={() => handleFeed(evolutionState.selectedCreature?.id)}
            >
              進食
            </button>
            {/* 肉食攻擊按鈕 - 如果選中的是肉食生物且選中了對手生物 */}
            {evolutionState.selectedCreature?.traits?.some(t => t.type === '肉食') && (
              <button
                className="action-btn attack-btn"
                disabled={!evolutionState.selectedTarget}
                onClick={() => handleAttack(
                  evolutionState.selectedCreature?.id,
                  evolutionState.selectedTarget?.id
                )}
              >
                攻擊
              </button>
            )}
            <button className="action-btn pass-btn" onClick={handlePass}>
              跳過
            </button>
          </>
        )}
      </div>

      {/* 待處理的攻擊回應 */}
      {pendingResponse && (
        <div className="pending-response-modal">
          <div className="modal-content">
            <h3>防禦選擇</h3>
            <p>你的生物受到攻擊！</p>
            <div className="defense-options">
              {pendingResponse.options?.map(option => (
                <button
                  key={option.type}
                  className="defense-btn"
                  onClick={() => handleDefenseResponse(option.type, option.traitId, option.targetId)}
                >
                  {option.description || option.type}
                </button>
              ))}
              <button
                className="defense-btn accept-btn"
                onClick={() => handleDefenseResponse('accept')}
              >
                接受攻擊
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 遊戲結束 */}
      {(phase === 'gameEnd' || phase === 'game_end') && (evolutionState.scores || evolutionState.winnerId) && (
        <div className="game-result-modal">
          <div className="modal-content">
            <h2>遊戲結束</h2>
            <div className="scores">
              {evolutionState.scores && Object.entries(evolutionState.scores).map(([pid, score]) => (
                <div key={pid} className="score-row">
                  <span className="player-name">
                    {evolutionState.players?.[pid]?.name || players[pid]?.name || pid}
                    {evolutionState.players?.[pid]?.isAI ? ' 🤖' : ''}
                  </span>
                  <span className="score">{typeof score === 'object' ? score.total : score} 分</span>
                </div>
              ))}
            </div>
            {(evolutionState.winnerId || evolutionState.gameResult) && (
              <div className="winner">
                {evolutionState.gameResult?.tied
                  ? '平手！'
                  : `獲勝者: ${
                    evolutionState.players?.[evolutionState.winnerId]?.name ||
                    players[evolutionState.winnerId]?.name ||
                    evolutionState.winnerId
                  }`}
              </div>
            )}
            <button onClick={() => navigate('/lobby/evolution')}>返回大廳</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvolutionRoom;
