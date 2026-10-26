/**
 * 演化論遊戲房間組件
 *
 * @module components/games/evolution/EvolutionRoom
 * 工單 0274：連接 Socket.io
 */

import React, { useEffect, useCallback, useState, useMemo, useLayoutEffect, useRef } from 'react';
import { useSelector, useDispatch, useStore } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  evolutionActions,
  selectEvolutionForContext
} from '../../../../store/evolution/evolutionStore';
import { useAuth } from '../../../../firebase/AuthContext';
import { EvolutionLobby } from '../EvolutionLobby';
import {
  evoJoinRoom,
  evoLeaveRoom,
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
  const store = useStore();
  const instanceAlive = useRef(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId } = useParams();
  const { user } = useAuth();

  // 工單 0280：從 location state 取得房間資料
  const initialRoomData = location.state?.room;

  // 本地狀態
  // 工單 0280：使用 location state 中的房間資料初始化
  const uid = user?.uid || null;
  const [roomSnapshot, setRoomSnapshot] = useState(() => ({
    ownerUid: location.state?.roomOwnerUid || null,
    roomId: initialRoomData?.id || null,
    room: initialRoomData || null,
  }));
  // A seed carries the identity of its acquisition; membership is not provenance.
  const seedSnapshot = {
    ownerUid: location.state?.roomOwnerUid || null,
    roomId: initialRoomData?.id || null,
    room: initialRoomData || null,
  };
  const matchesContext = snapshot => Boolean(uid && snapshot.ownerUid === uid && snapshot.roomId === roomId);
  const acceptedSnapshot = matchesContext(roomSnapshot) ? roomSnapshot
    : matchesContext(seedSnapshot) ? seedSnapshot : null;
  const room = acceptedSnapshot?.room?.players?.some(p => p.firebaseUid === uid)
    ? acceptedSnapshot.room : null;
  const isJoined = Boolean(room);
  const [errorSnapshot, setErrorSnapshot] = useState(null);
  const error = errorSnapshot?.uid === uid && errorSnapshot?.roomId === roomId
    ? errorSnapshot.message : null;
  // 工單 0284：生成穩定的玩家 ID
  const fallbackSeat = useMemo(() => ({ uid, roomId, id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}` }), [uid, roomId]);
  const myPlayerId = fallbackSeat.id;

  // Redux 狀態
  const evolutionState = useSelector(state => selectEvolutionForContext(state, uid, roomId));
  const { phase, myHand, myCreatures, foodPool, isMyTurn, players, pendingResponse } = evolutionState;

  // Guard event callbacks at dispatch time as auth changes can precede React cleanup.
  const dispatchOwned = useCallback(action => {
    const current = store.getState().evolution;
    if (instanceAlive.current && uid && current.ownerUid === uid && current.roomId === roomId) dispatch(action);
  }, [store, dispatch, uid, roomId]);

  // 工單 0284：計算當前玩家的實際 ID（用於遊戲動作）
  const currentPlayerId = useMemo(() => {
    if (!user?.uid) return null;
    const myPlayer = room?.players?.find(p => p.firebaseUid === user.uid);
    return myPlayer?.id || evolutionState.myPlayerId || myPlayerId;
  }, [user?.uid, room, myPlayerId, evolutionState.myPlayerId]);

  useLayoutEffect(() => {
    instanceAlive.current = true;
    setErrorSnapshot(null);
    if (!uid || !roomId) return undefined;
    dispatch(evolutionActions.bindRoomContext({ uid, roomId }));
    return () => {
      instanceAlive.current = false;
      dispatch(evolutionActions.clearRoomContext({ uid, roomId }));
    };
  }, [dispatch, uid, roomId]);

  useLayoutEffect(() => {
    if (uid && currentPlayerId) dispatchOwned(evolutionActions.setMyPlayerId(currentPlayerId));
  }, [uid, currentPlayerId, dispatchOwned]);

  // 加入房間
  // 工單 0280, 0284：避免房主重複加入，使用 firebaseUid 識別
  useEffect(() => {
    if (!roomId || !user?.uid || isJoined) return;

    // 工單 0284：發送完整的玩家物件，包含 firebaseUid
    evoJoinRoom(roomId, {
      id: myPlayerId,
      name: user.displayName || user.email?.split('@')[0] || '玩家',
      firebaseUid: user.uid,
      photoURL: user?.photoURL || null
    });
  }, [roomId, user, isJoined, myPlayerId]);

  // Socket 事件監聽
  useEffect(() => {
    let alive = true;
    let errorTimer = null;
    const scoped = callback => data => {
      const current = store.getState().evolution;
      // Array events retain their wire shape and identify every item individually.
      const matchesRoom = Array.isArray(data)
        ? data.length > 0 && data.every(event => event?.gameId === roomId)
        : (data?.gameId ?? data?.roomId) === roomId;
      if (!alive || !matchesRoom || current.ownerUid !== uid || current.roomId !== roomId) return;
      callback(data);
    };
    // 監聽加入房間成功
    const unsubJoinedRoom = onEvoJoinedRoom(scoped(({ roomId: joinedRoomId, room: joinedRoom }) => {
      if (joinedRoomId === roomId && joinedRoom?.players?.some(p => p.firebaseUid === uid)) {
        setRoomSnapshot({ ownerUid: uid, roomId: joinedRoomId, room: joinedRoom });
      }
    }));

    // 監聽遊戲開始
    const unsubGameStarted = onEvoGameStarted(scoped((gameState) => {
      dispatchOwned(evolutionActions.setOwnedGameState({ uid, roomId, gameState }));
    }));

    // 監聽遊戲狀態更新
    const unsubGameState = onEvoGameState(scoped((gameState) => {
      dispatchOwned(evolutionActions.setOwnedGameState({ uid, roomId, gameState }));
    }));

    // 監聽生物創建
    const unsubCreatureCreated = onEvoCreatureCreated(scoped((data) => {
      dispatchOwned(evolutionActions.addLog({
        type: 'creatureCreated',
        ...data
      }));
    }));

    // 監聽性狀添加
    const unsubTraitAdded = onEvoTraitAdded(scoped((data) => {
      dispatchOwned(evolutionActions.addLog({
        type: 'traitAdded',
        ...data
      }));
    }));

    // 監聽玩家跳過
    const unsubPlayerPassed = onEvoPlayerPassed(scoped((data) => {
      dispatchOwned(evolutionActions.addLog({
        type: 'playerPassed',
        ...data
      }));
    }));

    // 監聽生物進食
    const unsubCreatureFed = onEvoCreatureFed(scoped((data) => {
      dispatchOwned(evolutionActions.addLog({
        type: 'creatureFed',
        ...data
      }));
    }));

    // 監聽連鎖效應
    const unsubChainTriggered = onEvoChainTriggered(scoped((chainEffects) => {
    }));

    // 監聽攻擊待處理
    const unsubAttackPending = onEvoAttackPending(scoped((pendingData) => {
      dispatchOwned(evolutionActions.setPendingResponse(pendingData));
    }));

    // 監聽攻擊結果
    const unsubAttackResolved = onEvoAttackResolved(scoped((data) => {
      dispatchOwned(evolutionActions.clearPendingResponse());
      dispatchOwned(evolutionActions.addLog({
        type: 'attackResolved',
        ...data
      }));
    }));

    // 監聽性狀使用
    const unsubTraitUsed = onEvoTraitUsed(scoped((data) => {
      dispatchOwned(evolutionActions.addLog({
        type: 'traitUsed',
        ...data
      }));
    }));

    // 監聽錯誤
    const unsubError = onEvoError(scoped(({ message }) => {
      console.error('[EvolutionRoom] 發生錯誤');
      setErrorSnapshot({ uid, roomId, message: typeof message === 'string' ? message : '操作失敗，請稍後再試' });
      if (errorTimer !== null) clearTimeout(errorTimer);
      errorTimer = setTimeout(() => { if (alive) setErrorSnapshot(null); }, 3000);
    }));

    return () => {
      alive = false;
      if (errorTimer !== null) clearTimeout(errorTimer);
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
  }, [dispatchOwned, uid, roomId, store]);

  // 處理卡牌選擇
  const handleCardSelect = useCallback((card) => {
    dispatchOwned(evolutionActions.setSelectedCard(card));
  }, [dispatchOwned]);

  // 處理生物選擇
  const handleCreatureSelect = useCallback((creature) => {
    dispatchOwned(evolutionActions.setSelectedCreature(creature));
  }, [dispatchOwned]);

  // 工單 0284：所有遊戲動作使用 currentPlayerId 而非 user?.uid

  // 處理出牌為生物
  const handlePlayAsCreature = useCallback((cardId) => {
    if (!cardId || !roomId || !currentPlayerId) return;
    evoCreateCreature(roomId, currentPlayerId, cardId);
    dispatchOwned(evolutionActions.clearSelections());
  }, [roomId, currentPlayerId, dispatchOwned]);

  // 處理出牌為性狀
  const handlePlayAsTrait = useCallback((cardId, creatureId, linkedCreatureId = null) => {
    if (!cardId || !creatureId || !roomId || !currentPlayerId) return;
    evoAddTrait(roomId, currentPlayerId, cardId, creatureId, linkedCreatureId);
    dispatchOwned(evolutionActions.clearSelections());
  }, [roomId, currentPlayerId, dispatchOwned]);

  // 處理進食
  const handleFeed = useCallback((creatureId) => {
    if (!creatureId || !roomId || !currentPlayerId) return;
    evoFeedCreature(roomId, currentPlayerId, creatureId);
  }, [roomId, currentPlayerId]);

  // 處理攻擊
  const handleAttack = useCallback((attackerId, defenderId) => {
    if (!attackerId || !defenderId || !roomId || !currentPlayerId) return;
    evoAttack(roomId, currentPlayerId, attackerId, defenderId);
  }, [roomId, currentPlayerId]);

  // 處理跳過
  const handlePass = useCallback(() => {
    if (!roomId || !currentPlayerId) return;
    evoPassEvolution(roomId, currentPlayerId);
  }, [roomId, currentPlayerId]);

  // 處理防禦回應
  const handleDefenseResponse = useCallback((responseType, traitId = null, targetId = null) => {
    if (!roomId || !currentPlayerId) return;
    evoRespondAttack(roomId, currentPlayerId, {
      type: responseType,
      traitId,
      targetId
    });
  }, [roomId, currentPlayerId]);

  // 處理使用性狀能力
  const handleUseTrait = useCallback((creatureId, traitType, targetId = null) => {
    if (!creatureId || !traitType || !roomId || !currentPlayerId) return;
    evoUseTrait(roomId, currentPlayerId, creatureId, traitType, targetId);
  }, [roomId, currentPlayerId]);

  // 遊戲開始回調
  const handleGameStart = useCallback((gameState) => {
    dispatchOwned(evolutionActions.setOwnedGameState({ uid, roomId, gameState }));
  }, [dispatchOwned, uid, roomId]);

  // 離開房間回調
  const handleLeaveRoom = useCallback(() => {
    if (roomId && currentPlayerId) evoLeaveRoom(roomId, currentPlayerId);
    dispatch(evolutionActions.clearRoomContext({ uid, roomId }));
    navigate('/lobby/evolution');
  }, [navigate, dispatch, uid, roomId, currentPlayerId]);

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
        initialRoomOwnerUid={acceptedSnapshot?.ownerUid || null}
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
            <button onClick={() => navigate('/lobby/evolution')}>返回大廳</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvolutionRoom;
