/**
 * 演化論本地遊戲房間組件
 *
 * 用於單人模式（vs AI）的演化論遊戲介面。
 * 使用 LocalEvolutionGameController 在本地執行遊戲邏輯，不需後端連線。
 *
 * @module components/games/evolution/LocalEvolutionRoom
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { createEvolutionAIPlayer } from '../../../../ai/evolution';
import LocalEvolutionGameController from '../../../../controllers/evolution/LocalEvolutionGameController';
import {
  GAME_PHASES,
  TRAIT_TYPES,
  getTraitName
} from '../../../../shared/evolutionConstants';
import { AI_THINK_DELAY } from '../../../../shared/constants';
import './LocalEvolutionRoom.css';

// 階段中文名稱
const PHASE_NAMES = {
  [GAME_PHASES.WAITING]: '等待開始',
  [GAME_PHASES.EVOLUTION]: '演化階段',
  [GAME_PHASES.FOOD_SUPPLY]: '食物供給',
  [GAME_PHASES.FEEDING]: '進食階段',
  [GAME_PHASES.EXTINCTION]: '滅絕階段',
  [GAME_PHASES.GAME_END]: '遊戲結束'
};

/**
 * 演化論本地遊戲房間
 */
function LocalEvolutionRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId } = useParams();

  // 從 URL 參數或 location state 取得配置
  const getConfig = () => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    if (mode !== 'single') return null;

    const aiCount = parseInt(params.get('aiCount') || '1', 10);
    const diffStr = params.get('difficulties') || 'medium';
    const difficulties = diffStr.split(',');
    const playerName = params.get('playerName') || '玩家';
    const playerId = params.get('playerId') || `human_${Date.now()}`;

    return { aiCount, difficulties, playerName, playerId };
  };

  const config = location.state?.aiConfig ? {
    aiCount: location.state.aiConfig.aiCount,
    difficulties: location.state.aiConfig.difficulties,
    playerName: location.state.playerName || '玩家',
    playerId: location.state.playerId || `human_${Date.now()}`
  } : getConfig();

  // 遊戲狀態
  const [gameState, setGameState] = useState(null);
  const [eventLog, setEventLog] = useState([]);
  const [aiThinking, setAIThinking] = useState(false);
  const [currentAIName, setCurrentAIName] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCreature, setSelectedCreature] = useState(null);
  const [error, setError] = useState('');
  const [isWaitingForDefense, setIsWaitingForDefense] = useState(false);

  const controllerRef = useRef(null);
  const aiPlayersRef = useRef([]);
  const humanPlayerIdRef = useRef(config?.playerId || 'human_1');

  // 初始化遊戲
  useEffect(() => {
    if (!config) {
      setError('無效的遊戲配置，請返回大廳重新設定');
      return;
    }

    if (controllerRef.current) return; // 已初始化

    // 建立人類玩家
    const humanPlayer = {
      id: config.playerId,
      name: config.playerName,
      isAI: false
    };
    humanPlayerIdRef.current = config.playerId;

    // 建立 AI 玩家
    const aiPlayers = [];
    for (let i = 0; i < config.aiCount; i++) {
      const difficulty = config.difficulties[i] || 'medium';
      const ai = createEvolutionAIPlayer(
        `evo-ai-${i + 1}`,
        null, // 使用預設名稱
        difficulty
      );
      aiPlayers.push(ai);
    }
    aiPlayersRef.current = aiPlayers;

    // 建立控制器
    const allPlayers = [humanPlayer, ...aiPlayers];
    const controller = new LocalEvolutionGameController({
      players: allPlayers,
      onStateChange: (newState) => {
        setGameState({ ...newState });
      },
      onEvent: (event) => {
        handleGameEvent(event);
      }
    });

    controllerRef.current = controller;
    controller.startGame();
    console.log('[LocalEvolutionRoom] 遊戲初始化完成');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 處理遊戲事件
  const handleGameEvent = useCallback((event) => {
    setEventLog(prev => {
      const message = getEventMessage(event);
      if (!message) return prev;
      return [...prev.slice(-19), { id: Date.now(), message }];
    });

    if (event.type === 'attackPending') {
      setIsWaitingForDefense(true);
    } else if (event.type === 'attackResolved') {
      setIsWaitingForDefense(false);
    }
  }, []);

  // 取得事件訊息
  const getEventMessage = (event) => {
    switch (event.type) {
      case 'phaseChanged':
        return `📢 進入${PHASE_NAMES[event.phase] || event.phase}${event.round ? `（第 ${event.round} 回合）` : ''}`;
      case 'creatureCreated':
        return `🦎 ${gameState?.players?.[event.playerId]?.name || event.playerId} 創造了新生物`;
      case 'traitAdded':
        return `✨ 賦予 ${getTraitName(event.traitType)} 性狀`;
      case 'creatureFed':
        return `🍖 生物進食（食物池剩 ${event.foodPool}）`;
      case 'attackPending':
        return `⚔️ 攻擊中...`;
      case 'attackResolved':
        return event.result === 'success' ? `💀 攻擊成功！生物滅絕` :
               event.result === 'tailLoss' ? `🦎 斷尾！攻擊取消` :
               event.result === 'agileEscape' ? `💨 敏捷逃脫！` : `攻擊結束`;
      case 'gameEnded':
        return `🏆 遊戲結束！`;
      default:
        return null;
    }
  };

  // 自動觸發 AI 回合
  useEffect(() => {
    if (!gameState || !controllerRef.current) return;
    if (gameState.phase === GAME_PHASES.WAITING || gameState.phase === GAME_PHASES.GAME_END) return;
    if (gameState.phase === GAME_PHASES.FOOD_SUPPLY || gameState.phase === GAME_PHASES.EXTINCTION) return;
    if (isWaitingForDefense) return;
    if (aiThinking) return;

    const currentPlayerId = gameState.currentPlayerId;
    if (!currentPlayerId) return;

    const currentPlayerState = gameState.players?.[currentPlayerId];
    if (!currentPlayerState) return;

    // 檢查是否是 AI 回合
    const aiInstance = aiPlayersRef.current.find(ai => ai.id === currentPlayerId);
    if (!aiInstance) return; // 人類玩家回合

    // 防止重複觸發
    const timerId = setTimeout(async () => {
      setAIThinking(true);
      setCurrentAIName(aiInstance.name);

      try {
        let action;
        if (gameState.phase === GAME_PHASES.EVOLUTION) {
          action = await aiInstance.takeTurn(gameState);
        } else if (gameState.phase === GAME_PHASES.FEEDING) {
          action = await aiInstance.takeFeedingTurn(gameState);
        }

        if (action && controllerRef.current) {
          await controllerRef.current.handleAction(action);
        }
      } catch (e) {
        console.error('[LocalEvolutionRoom] AI 動作失敗:', e);
        // 讓 AI 跳過
        if (controllerRef.current) {
          await controllerRef.current.handleAction({ type: 'pass', playerId: currentPlayerId });
        }
      } finally {
        setAIThinking(false);
        setCurrentAIName('');
      }
    }, 400);

    return () => clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.currentPlayerId, gameState?.phase, aiThinking, isWaitingForDefense]);

  // 人類玩家動作
  const handleHumanAction = useCallback(async (action) => {
    if (!controllerRef.current) return;
    if (aiThinking) return;

    const humanId = humanPlayerIdRef.current;
    if (gameState?.currentPlayerId !== humanId && action.type !== 'defenseResponse') return;

    try {
      await controllerRef.current.handleAction({ ...action, playerId: humanId });
      setSelectedCard(null);
      setSelectedCreature(null);
    } catch (e) {
      console.error('[LocalEvolutionRoom] 人類動作失敗:', e);
    }
  }, [gameState?.currentPlayerId, aiThinking]);

  // 傳遞卡牌到生物
  const handlePlayCard = useCallback((cardId, creatureId, traitType, targetPlayerId) => {
    if (creatureId) {
      handleHumanAction({
        type: 'addTrait',
        cardId,
        creatureId,
        traitType,
        targetPlayerId
      });
    } else {
      handleHumanAction({ type: 'createCreature', cardId });
    }
  }, [handleHumanAction]);

  const handlePass = useCallback(() => {
    handleHumanAction({ type: 'pass' });
  }, [handleHumanAction]);

  const handleFeed = useCallback((creatureId) => {
    handleHumanAction({ type: 'feed', creatureId });
  }, [handleHumanAction]);

  const handleAttack = useCallback((attackerCreatureId, defenderCreatureId, defenderPlayerId) => {
    handleHumanAction({ type: 'attack', attackerCreatureId, defenderCreatureId, defenderPlayerId });
  }, [handleHumanAction]);

  const handleHibernate = useCallback((creatureId) => {
    handleHumanAction({ type: 'hibernate', creatureId });
  }, [handleHumanAction]);

  if (error) {
    return (
      <div className="local-evo-room local-evo-error">
        <p>{error}</p>
        <button onClick={() => navigate('/lobby/evolution')}>返回大廳</button>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="local-evo-room local-evo-loading">
        <div className="loading-spinner">🦎</div>
        <p>初始化遊戲中...</p>
      </div>
    );
  }

  const myId = humanPlayerIdRef.current;
  const myPlayer = gameState.players?.[myId];
  const currentPhase = gameState.phase;
  const isMyTurn = gameState.currentPlayerId === myId;
  const canAct = isMyTurn && !aiThinking && !isWaitingForDefense &&
    currentPhase !== GAME_PHASES.FOOD_SUPPLY &&
    currentPhase !== GAME_PHASES.EXTINCTION &&
    currentPhase !== GAME_PHASES.GAME_END;

  return (
    <div className="local-evo-room">
      {/* 頂部：階段資訊 */}
      <header className="local-evo-header">
        <div className="phase-info">
          <span className="phase-badge">{PHASE_NAMES[currentPhase] || currentPhase}</span>
          <span className="round-info">第 {gameState.round} 回合</span>
          {currentPhase === GAME_PHASES.FEEDING && (
            <span className="food-pool">食物池: 🍖 {gameState.foodPool}</span>
          )}
        </div>

        {aiThinking && (
          <div className="ai-thinking">
            <span className="thinking-icon">🤖</span>
            <span>{currentAIName} 思考中</span>
            <span className="dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </div>
        )}

        <div className="header-actions">
          {isMyTurn && !aiThinking && currentPhase !== GAME_PHASES.GAME_END && (
            <span className="my-turn-indicator">✨ 你的回合</span>
          )}
          <button className="btn-back" onClick={() => navigate('/lobby/evolution')}>
            ← 離開
          </button>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="local-evo-main">
        {/* 遊戲結束畫面 */}
        {currentPhase === GAME_PHASES.GAME_END && (
          <div className="game-end-overlay">
            <div className="game-end-modal">
              <h2>🏆 遊戲結束！</h2>
              <div className="final-scores">
                {Object.entries(gameState.scores || {}).sort((a, b) => b[1] - a[1]).map(([pid, score]) => (
                  <div key={pid} className={`score-row ${pid === gameState.winner ? 'winner' : ''}`}>
                    <span className="player-name">{gameState.players?.[pid]?.name || pid}</span>
                    <span className="score">{score} 分</span>
                    {pid === gameState.winner && <span className="winner-badge">🏆</span>}
                  </div>
                ))}
              </div>
              <button className="btn-primary" onClick={() => navigate('/lobby/evolution')}>
                返回大廳
              </button>
            </div>
          </div>
        )}

        {/* 玩家板面 */}
        <div className="players-grid">
          {Object.values(gameState.players || {}).map(player => {
            const isCurrentTurn = gameState.currentPlayerId === player.id;
            const isMe = player.id === myId;
            const isAI = !isMe;

            return (
              <div
                key={player.id}
                className={`player-board ${isCurrentTurn ? 'current-turn' : ''} ${isMe ? 'my-board' : ''}`}
              >
                <div className="player-board-header">
                  <span className="player-name">
                    {isAI ? '🤖 ' : '👤 '}
                    {player.name}
                  </span>
                  <span className="player-stats">
                    手牌: {player.hand?.length || 0}
                    {gameState.scores?.[player.id] !== undefined && (
                      <span className="player-score"> | 分: {gameState.scores[player.id]}</span>
                    )}
                  </span>
                  {isCurrentTurn && <span className="turn-indicator">▶</span>}
                </div>

                {/* 生物區 */}
                <div className="creatures-area">
                  {(player.creatures || []).length === 0 && (
                    <div className="no-creatures">（無生物）</div>
                  )}
                  {(player.creatures || []).map(creature => (
                    <CreatureCard
                      key={creature.id}
                      creature={creature}
                      isOwn={isMe}
                      phase={currentPhase}
                      canAttack={
                        isMe && canAct && currentPhase === GAME_PHASES.FEEDING &&
                        creature.traits?.some(t => t.traitType === TRAIT_TYPES.CARNIVORE) &&
                        !creature.isFed
                      }
                      canFeed={
                        isMe && canAct && currentPhase === GAME_PHASES.FEEDING &&
                        !creature.traits?.some(t => t.traitType === TRAIT_TYPES.CARNIVORE) &&
                        !creature.isFed && gameState.foodPool > 0
                      }
                      canHibernate={
                        isMe && canAct && currentPhase === GAME_PHASES.FEEDING &&
                        creature.traits?.some(t => t.traitType === TRAIT_TYPES.HIBERNATION) &&
                        !creature.isFed && !creature.hibernated
                      }
                      canReceiveTrait={
                        isMe && canAct && currentPhase === GAME_PHASES.EVOLUTION && selectedCard
                      }
                      selectedCard={selectedCard}
                      onFeed={() => handleFeed(creature.id)}
                      onHibernate={() => handleHibernate(creature.id)}
                      onSelectAsTarget={(attackerCreatureId, attackerPlayerId) =>
                        handleAttack(attackerCreatureId, creature.id, player.id)
                      }
                      onAddTrait={() => {
                        if (selectedCard) {
                          handlePlayCard(selectedCard.id, creature.id, selectedCard.traitType);
                        }
                      }}
                      allPlayers={gameState.players}
                      myId={myId}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 我的手牌（演化階段）*/}
        {currentPhase === GAME_PHASES.EVOLUTION && isMyTurn && !aiThinking && (
          <div className="my-hand-section">
            <h3>我的手牌</h3>
            <div className="hand-cards">
              {(myPlayer?.hand || []).map(card => (
                <HandCard
                  key={card.id}
                  card={card}
                  isSelected={selectedCard?.id === card.id}
                  onClick={() => setSelectedCard(selectedCard?.id === card.id ? null : card)}
                />
              ))}
            </div>
            <div className="hand-actions">
              {selectedCard && (
                <button
                  className="btn-create-creature"
                  onClick={() => handlePlayCard(selectedCard.id, null, selectedCard.traitType)}
                >
                  🦎 用選中的牌創造生物
                </button>
              )}
              <button className="btn-pass" onClick={handlePass}>
                ⏭️ 跳過
              </button>
            </div>
            {selectedCard && (
              <p className="selected-hint">
                已選: {getTraitName(selectedCard.traitType)} — 點選生物賦予性狀，或創造新生物
              </p>
            )}
          </div>
        )}

        {/* 食物供給階段 */}
        {currentPhase === GAME_PHASES.FOOD_SUPPLY && (
          <div className="food-phase-overlay">
            <h3>食物供給</h3>
            <div className="dice-result">
              {(gameState.diceResult || []).map((d, i) => (
                <span key={i} className="die">🎲 {d}</span>
              ))}
            </div>
            <p>食物池: <strong>{gameState.foodPool}</strong> 個食物</p>
          </div>
        )}

        {/* 滅絕階段 */}
        {currentPhase === GAME_PHASES.EXTINCTION && (
          <div className="extinction-overlay">
            <h3>滅絕階段</h3>
            <p>未吃飽的生物已滅絕，正在計分並抽牌...</p>
          </div>
        )}

        {/* 進食階段：提示 */}
        {currentPhase === GAME_PHASES.FEEDING && isMyTurn && !aiThinking && !isWaitingForDefense && (
          <div className="feeding-hint">
            <p>進食階段 - 選擇生物進食或攻擊，或<button className="btn-pass-sm" onClick={handlePass}>跳過</button></p>
          </div>
        )}
      </main>

      {/* 事件日誌 */}
      <aside className="event-log">
        <h4>遊戲紀錄</h4>
        <ul>
          {eventLog.map(e => (
            <li key={e.id}>{e.message}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

// ==================== 子組件 ====================

function HandCard({ card, isSelected, onClick }) {
  return (
    <div
      className={`hand-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      title={getTraitName(card.traitType)}
    >
      <div className="card-trait">{getTraitName(card.traitType)}</div>
    </div>
  );
}

function CreatureCard({
  creature, isOwn, phase, canFeed, canAttack, canHibernate, canReceiveTrait,
  selectedCard, onFeed, onHibernate, onSelectAsTarget, onAddTrait, allPlayers, myId
}) {
  const [showAttackTargets, setShowAttackTargets] = useState(false);

  const foodTotal = (creature.food?.red || 0) + (creature.food?.blue || 0);
  const foodNeeded = creature.foodNeeded || 1;
  const isFed = creature.isFed || foodTotal >= foodNeeded;

  return (
    <div className={`creature-card ${isFed ? 'fed' : ''} ${creature.hibernating ? 'hibernating' : ''}`}>
      <div className="creature-header">
        <span className="creature-id">🦎</span>
        {isFed && <span className="fed-badge">✔</span>}
        {creature.hibernating && <span className="hibernate-badge">❄️</span>}
      </div>

      <div className="creature-traits">
        {(creature.traits || []).map(trait => (
          <span key={trait.id} className="trait-chip" title={getTraitName(trait.traitType)}>
            {getTraitName(trait.traitType)}
          </span>
        ))}
        {(creature.traits || []).length === 0 && <span className="no-traits">（無性狀）</span>}
      </div>

      <div className="creature-food">
        🍖 {foodTotal}/{foodNeeded}
      </div>

      <div className="creature-actions">
        {canFeed && (
          <button className="btn-feed" onClick={onFeed}>進食</button>
        )}
        {canHibernate && (
          <button className="btn-hibernate" onClick={onHibernate}>冬眠</button>
        )}
        {canAttack && !showAttackTargets && (
          <button className="btn-attack" onClick={() => setShowAttackTargets(true)}>攻擊</button>
        )}
        {canReceiveTrait && (
          <button className="btn-trait" onClick={onAddTrait}>賦予性狀</button>
        )}
        {showAttackTargets && (
          <AttackTargetSelector
            allPlayers={allPlayers}
            myId={myId}
            attackerCreatureId={creature.id}
            onSelect={(defId, defPlayerId) => {
              setShowAttackTargets(false);
              onSelectAsTarget(creature.id, defId, defPlayerId);
            }}
            onCancel={() => setShowAttackTargets(false)}
          />
        )}
      </div>
    </div>
  );
}

function AttackTargetSelector({ allPlayers, myId, attackerCreatureId, onSelect, onCancel }) {
  const targets = [];
  for (const [pid, player] of Object.entries(allPlayers || {})) {
    if (pid === myId) continue;
    for (const creature of (player.creatures || [])) {
      targets.push({ creature, playerId: pid, playerName: player.name });
    }
  }

  if (targets.length === 0) {
    return (
      <div className="attack-targets">
        <span>無可攻擊目標</span>
        <button onClick={onCancel}>取消</button>
      </div>
    );
  }

  return (
    <div className="attack-targets">
      <span>選擇攻擊目標：</span>
      {targets.map(({ creature, playerId, playerName }) => (
        <button
          key={creature.id}
          className="btn-target"
          onClick={() => onSelect(creature.id, playerId)}
        >
          {playerName} 的 🦎（{(creature.traits || []).map(t => getTraitName(t.traitType)).join(', ') || '無性狀'}）
        </button>
      ))}
      <button className="btn-cancel" onClick={onCancel}>取消</button>
    </div>
  );
}

export default LocalEvolutionRoom;
