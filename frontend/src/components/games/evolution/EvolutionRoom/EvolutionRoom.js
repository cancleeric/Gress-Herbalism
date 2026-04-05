/**
 * 演化論遊戲房間組件
 *
 * @module components/games/evolution/EvolutionRoom
 * 工單 0274：連接 Socket.io
 */

import React, { useEffect, useCallback, useState, useMemo } from 'react';
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
  onEvoError,
  onEvoGameEnded,
} from '../../../../services/socketService';
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

  // 工單 0280：從 location state 取得房間資料
  const initialRoomData = location.state?.room;
  const isCreator = location.state?.isCreator;

  // 本地狀態
  // 工單 0280：使用 location state 中的房間資料初始化
  const [room, setRoom] = useState(initialRoomData || null);
  const [isJoined, setIsJoined] = useState(!!initialRoomData);
  const [error, setError] = useState(null);
  const [replayId, setReplayId] = useState(null);
  // 工單 0284：生成穩定的玩家 ID
  const [myPlayerId] = useState(() => `player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);

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

  // 加入房間
  // 工單 0280, 0284：避免房主重複加入，使用 firebaseUid 識別
  useEffect(() => {
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
  }, [roomId, user, isJoined, isCreator, room, myPlayerId]);

  // Socket 事件監聽
  useEffect(() => {
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

    // 監聽遊戲結束（含回放 ID）
    const unsubGameEnded = onEvoGameEnded((data) => {
      console.log('[EvolutionRoom] 遊戲結束，回放 ID:', data.replayId);
      if (data.replayId) {
        setReplayId(data.replayId);
      }
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
      unsubGameEnded();
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
    if (!cardId || !roomId || !currentPlayerId) return;
    console.log('[EvolutionRoom] 創造生物:', cardId);
    evoCreateCreature(roomId, currentPlayerId, cardId);
    dispatch(evolutionActions.clearSelections());
  }, [roomId, currentPlayerId, dispatch]);

  // 處理出牌為性狀
  const handlePlayAsTrait = useCallback((cardId, creatureId, linkedCreatureId = null) => {
    if (!cardId || !creatureId || !roomId || !currentPlayerId) return;
    console.log('[EvolutionRoom] 賦予性狀:', cardId, creatureId, linkedCreatureId);
    evoAddTrait(roomId, currentPlayerId, cardId, creatureId, linkedCreatureId);
    dispatch(evolutionActions.clearSelections());
  }, [roomId, currentPlayerId, dispatch]);

  // 處理進食
  const handleFeed = useCallback((creatureId) => {
    if (!creatureId || !roomId || !currentPlayerId) return;
    console.log('[EvolutionRoom] 進食:', creatureId);
    evoFeedCreature(roomId, currentPlayerId, creatureId);
  }, [roomId, currentPlayerId]);

  // 處理攻擊
  const handleAttack = useCallback((attackerId, defenderId) => {
    if (!attackerId || !defenderId || !roomId || !currentPlayerId) return;
    console.log('[EvolutionRoom] 攻擊:', attackerId, defenderId);
    evoAttack(roomId, currentPlayerId, attackerId, defenderId);
  }, [roomId, currentPlayerId]);

  // 處理跳過
  const handlePass = useCallback(() => {
    if (!roomId || !currentPlayerId) return;
    console.log('[EvolutionRoom] 跳過');
    evoPassEvolution(roomId, currentPlayerId);
  }, [roomId, currentPlayerId]);

  // 處理防禦回應
  const handleDefenseResponse = useCallback((responseType, traitId = null, targetId = null) => {
    if (!roomId || !currentPlayerId) return;
    console.log('[EvolutionRoom] 防禦回應:', responseType, traitId, targetId);
    evoRespondAttack(roomId, currentPlayerId, {
      type: responseType,
      traitId,
      targetId
    });
  }, [roomId, currentPlayerId]);

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

  // 等待中 - 顯示房間等待介面
  if (phase === 'waiting') {
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
      {phase === 'gameEnd' && evolutionState.scores && (
        <div className="game-result-modal">
          <div className="modal-content">
            <h2>遊戲結束</h2>
            <div className="scores">
              {Object.entries(evolutionState.scores).map(([playerId, score]) => (
                <div key={playerId} className="score-row">
                  <span className="player-name">{players[playerId]?.name}</span>
                  <span className="score">{typeof score === 'object' ? score.total : score} 分</span>
                </div>
              ))}
            </div>
            {evolutionState.gameResult && (
              <div className="winner">
                {evolutionState.gameResult.tied
                  ? '平手！'
                  : `獲勝者: ${players[evolutionState.gameResult.winnerId]?.name}`}
              </div>
            )}
            <div className="game-result-actions">
              {replayId && (
                <button onClick={() => navigate(`/evolution/replay/${replayId}`)}>
                  查看回放
                </button>
              )}
              <button onClick={() => navigate('/lobby/evolution')}>返回大廳</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvolutionRoom;
