/**
 * 演化論遊戲房間組件
 *
 * @module components/games/evolution/EvolutionRoom
 */

import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
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
  const { gameId } = useParams();
  const { user } = useAuth();

  // Redux 狀態
  const evolutionState = useSelector(selectEvolutionState);
  const phase = useSelector(selectPhase);
  const myHand = useSelector(selectMyHand);
  const myCreatures = useSelector(selectMyCreatures);
  const foodPool = useSelector(selectFoodPool);
  const isMyTurn = useSelector(selectIsMyTurn);
  const players = useSelector(selectPlayers);
  const pendingResponse = useSelector(selectPendingResponse);

  // 設定玩家 ID
  useEffect(() => {
    if (user?.uid) {
      dispatch(evolutionActions.setMyPlayerId(user.uid));
    }
  }, [user, dispatch]);

  // Socket 事件處理（待實作）
  useEffect(() => {
    // TODO: 連接 Socket.io 事件
    // socketService.on('evo:gameState', handleGameState);
    // socketService.on('evo:phaseChange', handlePhaseChange);
    // ...

    return () => {
      // 清理事件監聽
    };
  }, []);

  // 處理卡牌選擇
  const handleCardSelect = useCallback((card) => {
    dispatch(evolutionActions.setSelectedCard(card));
  }, [dispatch]);

  // 處理生物選擇
  const handleCreatureSelect = useCallback((creature) => {
    dispatch(evolutionActions.setSelectedCreature(creature));
  }, [dispatch]);

  // 處理出牌為生物
  const handlePlayAsCreature = useCallback((cardId) => {
    // TODO: 發送 Socket 事件
    console.log('Play as creature:', cardId);
    dispatch(evolutionActions.clearSelections());
  }, [dispatch]);

  // 處理出牌為性狀
  const handlePlayAsTrait = useCallback((cardId, creatureId, linkedCreatureId) => {
    // TODO: 發送 Socket 事件
    console.log('Play as trait:', cardId, creatureId, linkedCreatureId);
    dispatch(evolutionActions.clearSelections());
  }, [dispatch]);

  // 處理進食
  const handleFeed = useCallback((creatureId) => {
    // TODO: 發送 Socket 事件
    console.log('Feed creature:', creatureId);
  }, []);

  // 處理攻擊
  const handleAttack = useCallback((attackerId, defenderId) => {
    // TODO: 發送 Socket 事件
    console.log('Attack:', attackerId, defenderId);
  }, []);

  // 處理跳過
  const handlePass = useCallback(() => {
    // TODO: 發送 Socket 事件
    console.log('Pass turn');
  }, []);

  // 取得對手列表
  const opponents = Object.values(players).filter(
    p => p.id !== evolutionState.myPlayerId
  );

  return (
    <div className="evolution-room">
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
                    className="creature-card opponent-creature"
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
                  onClick={() => {
                    // TODO: 處理防禦選擇
                    console.log('Defense choice:', option.type);
                  }}
                >
                  {option.description}
                </button>
              ))}
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
                  <span className="score">{score.total} 分</span>
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
            <button onClick={() => navigate('/lobby')}>返回大廳</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvolutionRoom;
