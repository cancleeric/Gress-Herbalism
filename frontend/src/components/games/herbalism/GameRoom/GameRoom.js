import TabletopHeader from './TabletopHeader';
import { colorCombinations } from './tabletopConfig';
/**
 * 遊戲房間組件
 *
 * @module GameRoom
 * @description 遊戲進行時的主要介面，整合 GameBoard、PlayerHand、QuestionCard、GuessCard、GameStatus 等子組件
 */

import HerbArt from './HerbArt';
import { herbForCard, HERB_GROUPS } from './herbSpecies';
import Tabletop3D from './Tabletop3D';
import LocalQuestionTransfer from './LocalQuestionTransfer';
import PublicTransferFlight from './PublicTransferFlight';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  updateGameState,
  resetGame,
  clearPersistedState
} from '../../../../store/gameStore';
import { selectGameRoomState } from '../../../../store/selectors';
import useAIPlayers from '../../../../hooks/herbalism/useAIPlayers';
import LocalGameController from '../../../../controllers/herbalism/LocalGameController';
import { createPracticeReplayRecorder } from '../../../../services/practiceReplayStore';
import {
  onGameState,
  onError,
  onHiddenCardsRevealed,
  onColorChoiceRequired,
  onWaitingForColorChoice,
  onColorChoiceResult,
  onFollowGuessStarted,
  onFollowGuessUpdate,
  onGuessResult,
  onRoundStarted,
  onPostQuestionPhase,
  onTurnEnded,
  onCardGiveNotification,
  onPlayerLeft,
  onReconnectFailed,
  startGame as socketStartGame,
  sendGameAction,
  leaveRoom,
  submitColorChoice,
  submitFollowGuessResponse,
  startNextRound,
  endTurn,
  emitPlayerRefreshing,  // 工單 0118
  dismissGuessResult as socketDismissGuessResult,  // 工單 0172
  onGuessResultDismissed,  // 工單 0172
  confirmGuessResult as socketConfirmGuessResult,  // 工單 0207
  onConnectionChange,  // 工單 0196
  attemptReconnect,  // 工單 0196
  onReconnected  // 工單 0196
} from '../../../../services/socketService';
import {
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  GAME_PHASE_FINISHED,
  GAME_PHASE_FOLLOW_GUESSING,
  GAME_PHASE_POST_QUESTION,
  GAME_PHASE_ROUND_END
} from '../../../../shared/constants';
import GameBoard from '../GameBoard/GameBoard';
import PlayerHand from '../PlayerHand/PlayerHand';
import QuestionCard from '../QuestionCard/QuestionCard';
import GuessCard from '../GuessCard/GuessCard';
import TreasureGuessDialog from './TreasureGuessDialog';
import { GameStatusContainer } from '../GameStatus/GameStatus';
import Prediction from '../Prediction/Prediction';
import { PredictionResult } from '../Prediction';
import CardGiveNotification from '../CardGiveNotification/CardGiveNotification';
import QuestionFlow from '../QuestionFlow/QuestionFlow';
import { clearCurrentRoom, getCurrentRoom } from '../../../../utils/common/localStorage';
import { useAuth } from '../../../../firebase/AuthContext';
import VersionInfo from '../../../common/VersionInfo';
import AIThinkingIndicator from '../AIThinkingIndicator/AIThinkingIndicator';
import './GameRoom.css';
import './TabletopTheme.css';
import './RoundResultLedger.css';
import './FollowGuessStage.css';

/**
 * 遊戲房間組件
 *
 * @returns {JSX.Element} 遊戲房間組件
 */
function GameRoom() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { gameId } = useParams();
  const location = useLocation();

  // 檢查是否為本地模式（單人 + AI）
  // 優先從 location.state 讀取，如果沒有則從 URL 參數讀取
  const getAIConfigFromURL = () => {
    console.log('[GameRoom] getAIConfigFromURL 被調用');
    console.log('[GameRoom] location.search:', location.search);

    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    const aiCount = params.get('aiCount');
    const difficulties = params.get('difficulties');

    console.log('[GameRoom] URL 參數 - mode:', mode);
    console.log('[GameRoom] URL 參數 - aiCount:', aiCount);
    console.log('[GameRoom] URL 參數 - difficulties:', difficulties);

    if (mode === 'single' && aiCount && difficulties) {
      const config = {
        aiCount: parseInt(aiCount, 10),
        difficulties: difficulties.split(',')
      };
      console.log('[GameRoom] ✅ 從 URL 解析成功:', config);
      return config;
    }

    console.log('[GameRoom] ❌ URL 解析失敗，返回 null');
    return null;
  };

  const aiConfig = location.state?.aiConfig || getAIConfigFromURL();
  const isLocalMode = aiConfig !== null;

  console.log('[GameRoom] ========== 單人模式檢測 ==========');
  console.log('[GameRoom] location.state:', location.state);
  console.log('[GameRoom] location.search:', location.search);
  console.log('[GameRoom] aiConfig:', aiConfig);
  console.log('[GameRoom] isLocalMode:', isLocalMode);
  console.log('[GameRoom] ========================================');

  // 從 Redux store 取得遊戲狀態（工單 0162：使用記憶化 selector）
  const gameState = useSelector(selectGameRoomState);

  // 本地遊戲控制器（單人模式專用）
  const localControllerRef = useRef(null);
  const practiceRecorderRef = useRef(null);
  const aiTurnEpochRef = useRef(0);


  // AI 玩家管理（本地模式專用）
  const {
    aiPlayers,
    aiThinking,
    currentAIId,
    isAIPlayer,
    getAIInstance,
    handleAITurn,
    handleAIFollowGuess,
    handleGameEvent,
    resetAIPlayers
  } = useAIPlayers({
    aiConfig: isLocalMode ? aiConfig : null,
    gameState,
    onAIAction: useCallback(async (action, _aiInstance, turnToken) => {
      const controller = localControllerRef.current;
      if (!controller) return;

      // The result panel can open while a delayed AI decision is already in
      // flight; its cleanup cannot cancel that promise. A stale token must not
      // mutate the next round or consume its first turn.
      if (turnToken !== undefined && turnToken !== aiTurnEpochRef.current) return;
      if (controller.getState().gamePhase !== GAME_PHASE_PLAYING) return;

      await controller.handleAction(action);
      if (controller.pendingLocalQuestion) return;

      // A question leaves the local controller in POST_QUESTION; only the
      // human UI has a manual end-turn control. AI turns must advance
      // deterministically or the game stays on the AI player forever.
      // Only advance when the question actually mutated the phase: an invalid
      // target early-returns without changing state and must not burn the turn.
      if (
        action?.type === 'question' &&
        controller.getState().gamePhase === GAME_PHASE_POST_QUESTION
      ) {
        controller.endTurn({ playerId: action.playerId, prediction: null });
      }
    }, [])
  });

  // 本地狀態
  const [localQuestionRequest, setLocalQuestionRequest] = useState(null);
  const [publicTransfer, setPublicTransfer] = useState(null);
  const playerIdentityRef = useRef(gameState.currentPlayerId);
  playerIdentityRef.current = gameState.currentPlayerId;
  const [consolePanel, setConsolePanel] = useState(null);
  const [threeReady, setThreeReady] = useState(false);
  const consolePanelRef = useRef(null);
  const consoleOpenerRef = useRef(null);
  useEffect(() => {
    if (!consolePanel) return undefined;
    consoleOpenerRef.current = document.activeElement;
    const panel = consolePanelRef.current;
    panel?.querySelector('button')?.focus();
    const handlePanelKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); setConsolePanel(null); }
      if (event.key === 'Tab' && panel) {
        const items = [...panel.querySelectorAll('button, [href], [tabindex="0"]')].filter(el => !el.hidden && !el.disabled);
        const first = items[0]; const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handlePanelKey);
    return () => { document.removeEventListener('keydown', handlePanelKey); consoleOpenerRef.current?.focus(); };
  }, [consolePanel]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQuestionCard, setShowQuestionCard] = useState(false);
  const [showGuessCard, setShowGuessCard] = useState(false);
  const [isGuessing, setIsGuessing] = useState(false);
  const [hiddenCardsForGuess, setHiddenCardsForGuess] = useState([]);
  const [questionResult, setQuestionResult] = useState(null);
  const [guessResult, setGuessResult] = useState(null);
  // 顏色選擇相關狀態
  const [showColorChoice, setShowColorChoice] = useState(false);
  const [colorChoiceData, setColorChoiceData] = useState(null);
  const [waitingForColorChoice, setWaitingForColorChoice] = useState(false);
  const [colorChoiceInfo, setColorChoiceInfo] = useState(null);
  // 跟猜相關狀態
  const [followGuessData, setFollowGuessData] = useState(null);
  const [showFollowGuessPanel, setShowFollowGuessPanel] = useState(false);
  const [guessResultData, setGuessResultData] = useState(null);
  const [showRoundEnd, setShowRoundEnd] = useState(false);
  // 預測相關狀態（工單 0071）
  const [showPrediction, setShowPrediction] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  // 給牌通知相關狀態（工單 0072）
  const [cardGiveNotification, setCardGiveNotification] = useState(null);
  // 新版問牌流程狀態（工單 0074）
  const [selectedColorCard, setSelectedColorCard] = useState(null);
  const [showQuestionFlow, setShowQuestionFlow] = useState(false);
  // 顏色牌選擇記錄（工單 0075）
  const [myLastColorCardId, setMyLastColorCardId] = useState(null);
  const [colorCardMarkers, setColorCardMarkers] = useState({});
  const [disabledCardWarning, setDisabledCardWarning] = useState(null);
  // 複製連結提示（工單 0123）
  const [showCopyToast, setShowCopyToast] = useState(false);
  // 遊戲不存在錯誤處理（工單 0150）
  const [gameNotExist, setGameNotExist] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  // 工單 0210：重連狀態
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // Firebase Auth（工單 0123）
  const { user: authUser } = useAuth();
  useEffect(() => () => practiceRecorderRef.current?.close(), [authUser?.uid]);

  /**
   * 取得當前回合的玩家
   */
  const getCurrentPlayer = useCallback(() => {
    if (gameState.players && gameState.players.length > 0) {
      return gameState.players[gameState.currentPlayerIndex] || null;
    }
    return null;
  }, [gameState.players, gameState.currentPlayerIndex]);

  /**
   * 取得自己的玩家資訊
   */
  const getMyPlayer = useCallback(() => {
    if (gameState.currentPlayerId) {
      return gameState.players.find(p => p.id === gameState.currentPlayerId) || null;
    }
    return gameState.players[0] || null;
  }, [gameState.players, gameState.currentPlayerId]);

  /**
   * 檢查是否是自己的回合
   */
  const isMyTurn = useCallback(() => {
    const currentPlayer = getCurrentPlayer();
    const myPlayer = getMyPlayer();
    if (!currentPlayer || !myPlayer) return false;
    return currentPlayer.id === myPlayer.id;
  }, [getCurrentPlayer, getMyPlayer]);

  /**
   * 計算活躍玩家數量
   */
  const getActivePlayerCount = useCallback(() => {
    return gameState.players.filter(p => p.isActive !== false).length;
  }, [gameState.players]);

  /**
   * 檢查是否只剩一個活躍玩家（必須猜牌）
   */
  const mustGuess = useCallback(() => {
    return getActivePlayerCount() <= 1;
  }, [getActivePlayerCount]);

  /**
   * 初始化本地遊戲控制器（單人模式）
   */
  useEffect(() => {
    // 只在本地模式且尚未初始化時執行
    if (!isLocalMode) return;
    if (localControllerRef.current) return;
    if (aiPlayers.length === 0) return; // 等待 AI 玩家初始化完成

    console.log('[GameRoom] 初始化本地遊戲控制器');

    // 創建人類玩家（從 state 或 URL 參數讀取）
    const params = new URLSearchParams(location.search);
    const humanPlayer = {
      id: location.state?.playerId || params.get('playerId') || 'human-1',
      name: location.state?.playerName || params.get('playerName') || '玩家1',
      isAI: false,
      isHost: true
    };

    // 創建 AI 玩家實例（使用 aiPlayers 中的實例）
    const allPlayers = [humanPlayer, ...aiPlayers];
    const practiceRecorder = createPracticeReplayRecorder(authUser?.uid, humanPlayer.id,
      () => setError('AI 練習記錄容量已滿，本場僅保留先前片段'));
    practiceRecorderRef.current = practiceRecorder;

    // 創建本地控制器
    const controller = new LocalGameController({
      players: allPlayers,
      onStateChange: (newState) => {
        practiceRecorder?.capture(newState);
        console.log('[GameRoom] 本地狀態變更:', newState.gamePhase);
        dispatch(updateGameState({
          ...newState,
          currentPlayerId: humanPlayer.id
        }));
      },
      onEvent: (event) => {
        practiceRecorder?.capture(controller.getState(), event.type, event);
        console.log('[GameRoom] 本地事件:', event.type);

        if (event.type === 'localQuestionRequested') {
          setLocalQuestionRequest(event.request);
          return; // This proposal includes only the human's private hand, never send it to AI.
        }
        // 傳遞事件給 AI 玩家
        handleGameEvent(event);

        // 更新 UI 狀態
        if (event.type === 'followGuessStarted') {
          setFollowGuessData({
            guessingPlayerId: event.guessingPlayerId,
            guessedColors: event.guessedColors,
            decisionOrder: event.decisionOrder || [],
            currentDeciderId: event.currentDeciderId,
            decisions: event.decisions || {},
            followingPlayers: [],
            declinedPlayers: []
          });
          setShowFollowGuessPanel(true);
        } else if (event.type === 'followGuessUpdate') {
          setFollowGuessData(prev => ({
            ...prev,
            currentDeciderId: event.currentDeciderId,
            decisions: event.decisions || prev.decisions,
            followingPlayers: event.followingPlayers,
            declinedPlayers: event.declinedPlayers
          }));
        } else if (event.type === 'guessResult') {
          // Invalidate any delayed AI decision before the result panel is
          // shown; its promise cannot be cancelled by the effect cleanup alone.
          aiTurnEpochRef.current += 1;
          setShowFollowGuessPanel(false);
          setGuessResultData({
            isCorrect: event.isCorrect,
            scoreChanges: event.scoreChanges,
            hiddenCards: event.hiddenCards,
            guessingPlayerId: event.guessingPlayerId,
            followingPlayers: event.followingPlayers,
            predictionResults: event.predictionResults || [],
            continueGame: event.continueGame
          });
          // 工單 0172：統一顯示完整結果面板
          setShowRoundEnd(true);
        } else if (event.type === 'roundStarted') {
          setShowRoundEnd(false);
          setGuessResultData(null);
          setShowPrediction(false);
          setColorCardMarkers({});
          setMyLastColorCardId(null);
        } else if (event.type === 'turnEnded') {
          setShowPrediction(false);
          setPredictionLoading(false);
        }
      }
    });

    localControllerRef.current = controller;
    console.log('[GameRoom] 本地控制器創建完成，玩家數:', allPlayers.length);

    // 立即開始遊戲
    controller.startGame();
    console.log('[GameRoom] 遊戲已自動開始');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocalMode, aiPlayers.length]);

  /**
   * 自動觸發 AI 回合（本地模式）
   */
  useEffect(() => {
    if (!isLocalMode || !localControllerRef.current) return;

    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer || !isAIPlayer(currentPlayer)) return;

    // 檢查遊戲階段
    if (gameState.gamePhase !== GAME_PHASE_PLAYING) return;
    if (showRoundEnd) return;

    // 延遲執行 AI 決策（避免立即執行）
    const turnToken = aiTurnEpochRef.current + 1;
    aiTurnEpochRef.current = turnToken;
    const timerId = setTimeout(() => {
      console.log('[GameRoom] 觸發 AI 回合:', currentPlayer.name);
      handleAITurn(currentPlayer, turnToken);
    }, 500);

    return () => {
      clearTimeout(timerId);
      aiTurnEpochRef.current += 1;
    };
  }, [isLocalMode, gameState.currentPlayerIndex, gameState.gamePhase, showRoundEnd, getCurrentPlayer, isAIPlayer, handleAITurn]);

  /**
   * 自動處理 AI 跟猜決策（本地模式）
   */
  useEffect(() => {
    if (!isLocalMode || !localControllerRef.current) return;
    if (gameState.gamePhase !== GAME_PHASE_FOLLOW_GUESSING) return;
    if (!followGuessData) return;

    const currentDeciderId = followGuessData.currentDeciderId;
    if (!currentDeciderId) return;

    const decidingPlayer = gameState.players.find(p => p.id === currentDeciderId);
    if (!decidingPlayer || !isAIPlayer(decidingPlayer)) return;

    // 延遲執行 AI 跟猜決策
    const timerId = setTimeout(async () => {
      console.log('[GameRoom] 觸發 AI 跟猜決策:', decidingPlayer.name);
      const decision = await handleAIFollowGuess(decidingPlayer, followGuessData.guessedColors);

      if (decision !== null && localControllerRef.current) {
        localControllerRef.current.handleFollowGuessResponse({
          playerId: decidingPlayer.id,
          isFollowing: decision
        });
      }
    }, 800);

    return () => clearTimeout(timerId);
  }, [isLocalMode, gameState.gamePhase, followGuessData, gameState.players, isAIPlayer, handleAIFollowGuess]);

  /**
   * 工單 0150：遊戲不存在時的倒數計時與自動導航
   */
  useEffect(() => {
    if (!gameNotExist) return;

    // 倒數計時
    const countdownTimer = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 3 秒後自動導航
    const redirectTimer = setTimeout(() => {
      dispatch(resetGame());
      navigate('/');
    }, 3000);

    return () => {
      clearInterval(countdownTimer);
      clearTimeout(redirectTimer);
    };
  }, [gameNotExist, dispatch, navigate]);

  /**
   * 訂閱 Socket 事件（多人模式）
   */
  useEffect(() => {
    // 本地模式不需要 Socket 事件
    if (isLocalMode) return;
    // 監聽遊戲狀態更新
    const unsubGameState = onGameState((newState) => {
      dispatch(updateGameState({
        gameId: newState.gameId,
        players: newState.players,
        currentPlayerIndex: newState.currentPlayerIndex,
        gamePhase: newState.gamePhase,
        winner: newState.winner,
        hiddenCards: newState.hiddenCards,
        gameHistory: newState.gameHistory,
        maxPlayers: newState.maxPlayers
      }));
      setIsLoading(false);
      // A departure may cancel a pending action without a normal result event.
      // Always reconcile transient panels with the authoritative server phase.
      if (newState.gamePhase !== GAME_PHASE_FOLLOW_GUESSING) {
        setShowFollowGuessPanel(false);
        setFollowGuessData(null);
      }
      if (newState.gamePhase !== GAME_PHASE_PLAYING) {
        setShowColorChoice(false);
        setColorChoiceData(null);
        setWaitingForColorChoice(false);
        setColorChoiceInfo(null);
      }
    });

    // 監聽錯誤（工單 0150 改善）
    const unsubError = onError(({ message }) => {
      setError(message);
      setIsLoading(false);

      // 重置所有 Modal 狀態，避免卡在「處理中」
      setShowQuestionFlow(false);
      setShowQuestionCard(false);
      setShowGuessCard(false);
      setShowColorChoice(false);
      setColorChoiceData(null);
      setShowFollowGuessPanel(false);
      setShowPrediction(false);
      setSelectedColorCard(null);

      // 特殊處理「遊戲不存在」錯誤
      if (message === '遊戲不存在') {
        setGameNotExist(true);
        clearCurrentRoom();
        localStorage.removeItem('lastRoomId');
        localStorage.removeItem('lastPlayerId');
        localStorage.removeItem('lastPlayerName');
      }
    });

    // 工單 0148：監聽玩家離開
    const unsubPlayerLeft = onPlayerLeft(({ playerId, playerName }) => {
      console.log(`[房間] 玩家 ${playerName} 離開了房間`);
    });

    // 監聽蓋牌揭示
    const unsubHidden = onHiddenCardsRevealed(({ cards }) => {
      setHiddenCardsForGuess(cards);
    });

    // 監聽顏色選擇請求（被要牌玩家）
    const unsubColorChoice = onColorChoiceRequired(({ askingPlayerId, colors, availableColors, message }) => {
      setColorChoiceData({ askingPlayerId, colors, availableColors, message });
      setShowColorChoice(true);
      setWaitingForColorChoice(false);
    });

    // 監聽等待顏色選擇（其他玩家，不包含顏色資訊避免洩漏）
    const unsubWaiting = onWaitingForColorChoice(({ targetPlayerId, askingPlayerId, transferFlight }) => {
      if (transferFlight && transferFlight.from !== playerIdentityRef.current) setPublicTransfer(transferFlight);
      setWaitingForColorChoice(!transferFlight && targetPlayerId !== playerIdentityRef.current);
      setColorChoiceInfo({ targetPlayerId, askingPlayerId });
    });

    // Both normal completion and server cancellation dismiss pending UI only.
    const unsubColorResult = onColorChoiceResult(({ targetPlayerId, chosenColor, cardsTransferred }) => {
      setLocalQuestionRequest(null);
      setShowColorChoice(false);
      setColorChoiceData(null);
      setWaitingForColorChoice(false);
      setColorChoiceInfo(null);
    });

    // 監聽跟猜開始
    const unsubFollowGuess = onFollowGuessStarted(({ guessingPlayerId, guessedColors, decisionOrder, currentDeciderId, decisions }) => {
      setFollowGuessData({
        guessingPlayerId,
        guessedColors,
        decisionOrder: decisionOrder || [],
        currentDeciderId,
        decisions: decisions || {},
        followingPlayers: [],
        declinedPlayers: []
      });
      setShowFollowGuessPanel(true);
    });

    // 監聽跟猜更新
    const unsubFollowUpdate = onFollowGuessUpdate(({ playerId, isFollowing, currentDeciderId, decisions, followingPlayers, declinedPlayers }) => {
      setFollowGuessData(prev => ({
        ...prev,
        currentDeciderId,
        decisions: decisions || prev.decisions,
        followingPlayers,
        declinedPlayers
      }));
    });

    // 監聽猜牌結果
    const unsubGuessResult = onGuessResult(({ isCorrect, scoreChanges, hiddenCards, guessingPlayerId, followingPlayers, predictionResults, continueGame }) => {
      setShowFollowGuessPanel(false);
      setGuessResultData({ isCorrect, scoreChanges, hiddenCards, guessingPlayerId, followingPlayers, predictionResults, continueGame });
      // 工單 0172：統一顯示完整結果面板
      setShowRoundEnd(true);
    });

    // 監聽局開始
    const unsubRoundStart = onRoundStarted(({ round, startPlayerIndex }) => {
      setShowRoundEnd(false);
      setGuessResultData(null);
      setShowPrediction(false);
      // 新局開始時清除顏色牌標記（工單 0075）
      setColorCardMarkers({});
      setMyLastColorCardId(null);
    });

    // 監聽進入問牌後階段（工單 0071）
    const unsubPostQuestion = onPostQuestionPhase(({ playerId, message }) => {
      console.log('[工單 0076] 收到 postQuestionPhase 事件:', { playerId, message });
      setShowPrediction(true);
      setPredictionLoading(false);
    });

    // 監聽回合結束（工單 0071）
    const unsubTurnEnded = onTurnEnded(({ playerId, prediction, playerName }) => {
      setShowPrediction(false);
      setPredictionLoading(false);
    });

    // 監聽給牌通知（工單 0072）
    const unsubCardGive = onCardGiveNotification((notification) => {
      if (notification.isTransferProposal) { setLocalQuestionRequest(notification); return; }
      setCardGiveNotification(notification);
    });

    // 工單 0150/0210：監聽重連失敗
    const unsubReconnectFailed = onReconnectFailed(({ message }) => {
      console.log('[工單 0210] 重連失敗:', message);
      setGameNotExist(true);
      clearCurrentRoom();
      localStorage.removeItem('lastRoomId');
      localStorage.removeItem('lastPlayerId');
      localStorage.removeItem('lastPlayerName');
      // 工單 0210：清除重連狀態
      setIsReconnecting(false);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    });

    // 工單 0172：監聽猜牌結果面板關閉
    const unsubDismiss = onGuessResultDismissed(() => {
      setShowRoundEnd(false);
      setGuessResultData(null);
    });

    // 工單 0196/0210：監聽重連成功
    const unsubReconnected = onReconnected(({ gameId: reconnGameId, playerId: reconnPlayerId, gameState: reconnState }) => {
      console.log('[工單 0210] 重連成功，更新遊戲狀態');
      dispatch(updateGameState({
        gameId: reconnGameId,
        players: reconnState.players,
        maxPlayers: reconnState.maxPlayers,
        gamePhase: reconnState.gamePhase,
        currentPlayerIndex: reconnState.currentPlayerIndex,
        currentPlayerId: reconnPlayerId,
        hiddenCards: reconnState.hiddenCards,
        gameHistory: reconnState.gameHistory,
        winner: reconnState.winner,
        // 工單 0210：補齊缺失欄位
        scores: reconnState.scores,
        currentRound: reconnState.currentRound,
        predictions: reconnState.predictions,
      }));
      setIsLoading(false);
      // 工單 0210：清除重連狀態
      setIsReconnecting(false);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    });

    return () => {
      unsubGameState();
      unsubError();
      unsubPlayerLeft();
      unsubHidden();
      unsubColorChoice();
      unsubWaiting();
      unsubColorResult();
      unsubFollowGuess();
      unsubFollowUpdate();
      unsubGuessResult();
      unsubRoundStart();
      unsubPostQuestion();
      unsubTurnEnded();
      unsubCardGive();
      unsubReconnectFailed();
      unsubDismiss();
      unsubReconnected();
    };
  }, [dispatch, isLocalMode]);

  /**
   * 工單 0196/0210：多人模式重連（含重試機制）
   * 頁面重整後 socket 重新連線時，主動發起 reconnect 請求
   */
  useEffect(() => {
    if (isLocalMode) return;

    const MAX_RETRIES = 3;
    const RETRY_INTERVAL = 5000;

    const doReconnect = (savedRoom) => {
      console.log(`[工單 0210] 嘗試重連 (第 ${reconnectAttemptsRef.current + 1} 次):`, savedRoom.roomId);
      attemptReconnect(savedRoom.roomId, savedRoom.playerId, savedRoom.playerName);

      // 設定重試 timer
      reconnectTimerRef.current = setTimeout(() => {
        reconnectAttemptsRef.current++;
        if (reconnectAttemptsRef.current < MAX_RETRIES) {
          console.log(`[工單 0210] 重連未回應，第 ${reconnectAttemptsRef.current + 1} 次重試`);
          doReconnect(savedRoom);
        } else {
          console.log('[工單 0210] 重連重試次數已用盡');
          setIsReconnecting(false);
        }
      }, RETRY_INTERVAL);
    };

    const unsubConnect = onConnectionChange((connected) => {
      if (connected) {
        const savedRoom = getCurrentRoom();
        if (savedRoom && savedRoom.roomId === gameId && savedRoom.playerId) {
          setIsReconnecting(true);
          reconnectAttemptsRef.current = 0;
          doReconnect(savedRoom);
        }
      }
    });

    return () => {
      unsubConnect();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [gameId, isLocalMode]);

  /**
   * 工單 0093：重連時恢復預測 UI 狀態
   * 當 gamePhase 變為 postQuestion 且是自己的回合時，顯示預測介面
   */
  useEffect(() => {
    if (gameState.gamePhase === GAME_PHASE_POST_QUESTION && isMyTurn()) {
      setShowPrediction(true);
      setPredictionLoading(false);
    } else {
      setShowPrediction(false);
      setPredictionLoading(false);
    }
  }, [gameState.gamePhase, isMyTurn]);

  /**
   * 工單 0118：頁面重整前通知後端
   * 使用 beforeunload 事件通知後端這是預期的重整，給予更長的寬限期
   */
  useEffect(() => {
    const myPlayer = getMyPlayer();
    const currentGameId = gameState.storeGameId || gameId;
    const currentPlayerId = myPlayer?.id;

    const handleBeforeUnload = () => {
      if (currentGameId && currentPlayerId) {
        // 通知後端玩家正在重整
        emitPlayerRefreshing(currentGameId, currentPlayerId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [gameState.storeGameId, gameId, getMyPlayer]);

  /**
   * 離開房間
   */
  const handleLeaveRoom = () => {
    const myPlayer = getMyPlayer();
    if (myPlayer && gameId) {
      leaveRoom(gameId, myPlayer.id);
    }
    // 工單 0079：清除房間資訊（正常離開不需要重連）
    clearCurrentRoom();
    // 工單 0198：清除持久化狀態，避免重新載入時恢復舊狀態
    clearPersistedState();
    dispatch(resetGame());
    // 工單 0276：返回本草大廳
    navigate('/lobby/herbalism');
  };

  /**
   * 開始遊戲
   */
  const handleStartGame = () => {
    if (isLocalMode) {
      // 本地模式
      if (localControllerRef.current) {
        console.log('[GameRoom] 本地模式開始遊戲');
        setIsLoading(true);
        localControllerRef.current.startGame();
        setIsLoading(false);
      }
    } else {
      // 多人模式
      if (gameState.players.length >= 3 && gameId) {
        setIsLoading(true);
        socketStartGame(gameId);
      } else {
        setError('需要至少 3 位玩家才能開始遊戲');
      }
    }
  };

  /**
   * 打開問牌介面
   */
  const handleOpenQuestion = () => {
    setShowQuestionCard(true);
    setIsGuessing(false);
    setQuestionResult(null);
  };

  /**
   * 關閉問牌介面
   */
  const handleCloseQuestion = () => {
    setShowQuestionCard(false);
    setQuestionResult(null);
  };

  /**
   * 打開猜牌介面
   */
  const handleOpenGuess = () => {
    setShowGuessCard(true);
    setIsGuessing(true);
    setGuessResult(null);

    if (isLocalMode && localControllerRef.current) {
      // 本地模式：直接顯示蓋牌
      const state = localControllerRef.current.getState();
      setHiddenCardsForGuess(state.hiddenCards);
    } else {
      // Multiplayer guesses must be made without obtaining the answer.
      // The server reveals cards only after the round is settled.
      setHiddenCardsForGuess([]);
    }
  };

  /**
   * 關閉猜牌介面
   */
  const handleCloseGuess = () => {
    setShowGuessCard(false);
    setIsGuessing(false);
    setGuessResult(null);
    setHiddenCardsForGuess([]);
  };

  /**
   * 處理問牌提交
   */
  const handleQuestionSubmit = (questionData) => {
    const myPlayer = getMyPlayer();
    if (!myPlayer) return;

    setIsLoading(true);

    const action = {
      type: 'question',
      playerId: myPlayer.id,
      targetPlayerId: questionData.targetPlayerId,
      colors: questionData.colors,
      questionType: questionData.questionType,
      selectedColor: questionData.colors[0], // 用於類型2
      giveColor: questionData.giveColor || questionData.colors[0], // 用於類型3（使用選擇的或預設第一個）
      getColor: questionData.getColor || questionData.colors[1]  // 用於類型3
    };

    if (isLocalMode && localControllerRef.current) {
      // 本地模式
      localControllerRef.current.handleAction(action);
      setIsLoading(false);
    } else if (gameId) {
      // 多人模式
      sendGameAction(gameId, action);
    }

    setShowQuestionCard(false);
  };

  /**
   * 處理猜牌提交
   */
  const handleGuessSubmit = (guessData) => {
    const myPlayer = getMyPlayer();
    if (!myPlayer) return;

    setIsLoading(true);

    const action = {
      type: 'guess',
      playerId: myPlayer.id,
      guessedColors: guessData.guessedColors
    };

    if (isLocalMode && localControllerRef.current) {
      // 本地模式
      localControllerRef.current.handleAction(action);
      setIsLoading(false);
    } else if (gameId) {
      // 多人模式
      sendGameAction(gameId, action);
    }

    setShowGuessCard(false);
  };

  /**
   * 處理顏色選擇（被要牌玩家選擇給哪種顏色）
   */
  const handleColorChoice = (chosenColor) => {
    if (!gameId) return;

    submitColorChoice(gameId, chosenColor);
    setShowColorChoice(false);
    setColorChoiceData(null);
  };

  /**
   * 處理跟猜決定
   */
  const handleFollowGuess = (isFollowing) => {
    const myPlayer = getMyPlayer();
    if (!myPlayer) return;

    if (isLocalMode && localControllerRef.current) {
      // 本地模式
      localControllerRef.current.handleFollowGuessResponse({
        playerId: myPlayer.id,
        isFollowing
      });
    } else if (gameId) {
      // 多人模式
      submitFollowGuessResponse(gameId, myPlayer.id, isFollowing);
    }
  };

  /**
   * 處理開始下一局
   */
  const handleStartNextRound = () => {
    if (isLocalMode && localControllerRef.current) {
      // 本地模式
      localControllerRef.current.startNextRound();
      setShowRoundEnd(false);
      setGuessResultData(null);
    } else if (gameId) {
      // 多人模式
      startNextRound(gameId);
      setShowRoundEnd(false);
      setGuessResultData(null);
    }
  };

  /**
   * 工單 0172：處理關閉猜牌結果面板（猜錯但遊戲繼續時）
   */
  const handleDismissGuessResult = () => {
    if (isLocalMode) {
      // 本地模式直接關閉
      setShowRoundEnd(false);
      setGuessResultData(null);
    } else if (gameId) {
      // 多人模式：通知所有玩家關閉面板
      socketDismissGuessResult(gameId);
    }
  };

  /**
   * 工單 0207：處理確認猜牌結果（全員確認機制）
   */
  const handleConfirmGuessResult = () => {
    const myPlayer = getMyPlayer();
    if (!myPlayer) return;

    if (isLocalMode) {
      const continueGame = guessResultData?.continueGame === true;
      setShowRoundEnd(false);
      setGuessResultData(null);

      // A wrong guess that leaves active players already switched the local
      // controller to PLAYING/next player (LocalGameController.resolveGuess).
      // Starting another round here discards that turn and double-advances.
      if (!continueGame && localControllerRef.current) {
        localControllerRef.current.startNextRound();
      }
    } else if (gameId) {
      // 多人模式：發送確認，後端會通知關閉面板並在全員確認後自動處理
      socketConfirmGuessResult(gameId, myPlayer.id);
    }
  };

  /**
   * 處理結束回合（工單 0071：可附帶預測）
   */
  const handleEndTurn = (prediction) => {
    const myPlayer = getMyPlayer();
    if (!myPlayer) return;

    setPredictionLoading(true);

    if (isLocalMode && localControllerRef.current) {
      // 本地模式
      localControllerRef.current.endTurn({
        playerId: myPlayer.id,
        prediction
      });
      setPredictionLoading(false);
    } else if (gameId) {
      // 多人模式
      endTurn(gameId, myPlayer.id, prediction);
    }
  };

  /**
   * 處理關閉給牌通知（工單 0072）
   */
  const handleCloseCardGiveNotification = () => {
    setCardGiveNotification(null);

  };

  /**
   * 處理選擇顏色組合牌（工單 0074）
   */
  const handleColorCardSelect = (card) => {
    setSelectedColorCard(card);
    setShowQuestionFlow(true);
  };

  /**
   * 處理新版問牌提交（工單 0074）
   */
  const handleQuestionFlowSubmit = (questionData) => {
    const myPlayer = getMyPlayer();
    if (!myPlayer) return;

    setIsLoading(true);

    const action = {
      type: 'question',
      playerId: myPlayer.id,
      targetPlayerId: questionData.targetPlayerId,
      colors: questionData.colors,
      questionType: questionData.questionType,
      colorCardId: questionData.colorCardId,
      selectedColor: questionData.colors[0],
      giveColor: questionData.giveColor || questionData.colors[0],
      getColor: questionData.getColor || questionData.colors[1]
    };

    if (isLocalMode && localControllerRef.current) {
      // 本地模式
      localControllerRef.current.handleAction(action);
      setIsLoading(false);
    } else if (gameId) {
      // 多人模式
      sendGameAction(gameId, action);
    }

    setShowQuestionFlow(false);
    setSelectedColorCard(null);
    // 記錄使用的顏色牌（下回合禁用）（工單 0075）
    setMyLastColorCardId(questionData.colorCardId);
    // 更新標記（工單 0075）
    setColorCardMarkers(prev => ({
      ...prev,
      [questionData.colorCardId]: {
        playerId: myPlayer.id,
        playerName: myPlayer.name
      }
    }));
  };

  /**
   * 處理取消新版問牌流程（工單 0074）
   */
  const handleQuestionFlowCancel = () => {
    setShowQuestionFlow(false);
    setSelectedColorCard(null);
  };

  /**
   * 處理點擊禁用的顏色牌（工單 0075）
   */
  const handleDisabledCardClick = () => {
    setDisabledCardWarning('你上回合已選過這張牌，請選擇其他顏色組合');
    // 3秒後自動關閉警告
    setTimeout(() => setDisabledCardWarning(null), 3000);
  };

  /**
   * 格式化遊戲紀錄顯示（工單 0126）
   * 將後端的紀錄格式轉換為前端顯示格式
   */
  const formatHistoryRecord = useCallback((record) => {
    const player = gameState.players.find(p => p.id === record.playerId);
    const playerName = record.playerName || player?.name || '玩家';

    // 如果已經有 action 或 message 欄位，直接使用
    if (record.action || record.message) {
      return {
        playerName,
        action: record.action || record.message
      };
    }

    // 根據 type 欄位生成顯示文字
    const colorNames = {
      red: '紅',
      yellow: '黃',
      green: '綠',
      blue: '藍'
    };

    switch (record.type) {
      case 'question': {
        const targetPlayer = gameState.players.find(p => p.id === record.targetPlayerId);
        const colors = record.colors?.map(c => colorNames[c] || c).join('') || '';
        const questionTypes = {
          1: '各一張',
          2: '其中一種全部',
          3: '給一張要全部'
        };
        const typeText = questionTypes[record.questionType] || '';
        const cardsCount = record.cardsTransferred || 0;
        return {
          playerName,
          action: `向 ${targetPlayer?.name || '玩家'} 問了 ${colors} 牌（${typeText}），獲得 ${cardsCount} 張`
        };
      }
      case 'prediction': {
        const colorName = colorNames[record.color] || record.color;
        return {
          playerName,
          action: `預測蓋牌有 ${colorName} 色`
        };
      }
      case 'guess': {
        return {
          playerName,
          action: record.isCorrect ? '猜牌成功！' : '猜牌失敗'
        };
      }
      default:
        return {
          playerName,
          action: '進行了操作'
        };
    }
  }, [gameState.players]);

  /**
   * 取得遊戲階段顯示文字
   */
  const getGamePhaseText = () => {
    switch (gameState.gamePhase) {
      case GAME_PHASE_WAITING:
        return '等待玩家加入...';
      case GAME_PHASE_PLAYING:
        return '遊戲進行中';
      case GAME_PHASE_POST_QUESTION:
        return '問牌後階段';
      case GAME_PHASE_FOLLOW_GUESSING:
        return '跟猜階段';
      case GAME_PHASE_ROUND_END:
        return '局結束';
      case GAME_PHASE_FINISHED:
        return '遊戲結束';
      default:
        return '未知狀態';
    }
  };

  /**
   * 複製房間連結（工單 0123）
   */
  const handleCopyRoomLink = async () => {
    const roomLink = `${window.location.origin}${process.env.PUBLIC_URL || ''}/game/${encodeURIComponent(gameId)}`;
    try {
      await navigator.clipboard.writeText(roomLink);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = roomLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
    }
  };

  /**
   * 取得玩家頭像首字（工單 0123）
   */
  const getPlayerInitial = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const myPlayer = getMyPlayer();
  const currentPlayer = getCurrentPlayer();
  const canAct = isMyTurn() && gameState.gamePhase === GAME_PHASE_PLAYING && myPlayer?.isActive !== false;
  const onlyGuess = mustGuess();
  const maxPlayers = gameState.maxPlayers || 4;

  // 等待階段：渲染新的三欄式 UI（工單 0123）
  if (gameState.gamePhase === GAME_PHASE_WAITING) {
    const emptySlots = maxPlayers - gameState.players.length;

    return (
      <div className={`game-room waiting-stage ${threeReady ? 'three-enabled' : ''}`}>
        {/* 等待階段 Header */}
        <header className="waiting-header">
          <div className="waiting-header-left">
            <div className="waiting-brand">
              <div className="waiting-brand-icon">
                <span aria-hidden="true">本</span>
              </div>
              <span className="waiting-brand-text">本草 Herbalism</span>
            </div>
            <div className="waiting-status-badge">
              等待房主開始
            </div>
          </div>
          <div className="waiting-header-right">
            <span className="waiting-room-id">房間 ID: {gameId}</span>
            <button className="waiting-leave-btn" onClick={handleLeaveRoom}>

              離開房間
            </button>
          </div>
        </header>

        <div className="console-turn-strip" role="status">房間 {gameId} · {gameState.players.length}/{maxPlayers} 人就座</div>
        <Tabletop3D key="waiting-table" players={gameState.players} hand={[]} myId={myPlayer?.id}
          currentIndex={-1} combos={[]} canAsk={false} canGuess={false} onReady={setThreeReady}
          waitingAction={<><button onClick={handleCopyRoomLink}>邀請好友</button>{myPlayer?.isHost ? <button onClick={handleStartGame} disabled={gameState.players.length < 3 || isLoading}>{isLoading ? '啟動中...' : `開始遊戲 (${gameState.players.length}/${maxPlayers})`}</button> : <span>等待房主開始遊戲...</span>}</>} />
        {/* 主內容 - 三欄佈局 */}
        <main className="waiting-main">
          {/* 左欄 - 自己的 Hero Card */}
          <div className="waiting-left-column">
            <div className="waiting-hero-card">
              {authUser?.photoURL ? (
                <img
                  className="waiting-hero-avatar-img"
                  src={authUser.photoURL}
                  alt={myPlayer?.name || '玩家'}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="waiting-hero-avatar">
                  {getPlayerInitial(myPlayer?.name)}
                </div>
              )}
              <h3 className="waiting-hero-name">
                {myPlayer?.name || '載入中...'}
                <span className="waiting-hero-me-badge">我</span>
                {myPlayer?.isHost && <span className="waiting-hero-host-badge">房主</span>}
              </h3>
              <div className="waiting-hero-stats">
                <div className="waiting-hero-stat">
                  <div className="waiting-hero-stat-value">{myPlayer?.score || 0}</div>
                  <div className="waiting-hero-stat-label">分數</div>
                </div>
                <div className="waiting-hero-stat">
                  <div className="waiting-hero-stat-value">{myPlayer?.hand?.length || 0}</div>
                  <div className="waiting-hero-stat-label">張牌</div>
                </div>
              </div>
            </div>

            {/* 開始遊戲按鈕（僅房主可見） */}
            {myPlayer?.isHost ? (
              <button
                className="waiting-start-btn"
                onClick={handleStartGame}
                disabled={gameState.players.length < 3 || isLoading}
              >

                {isLoading ? '啟動中...' : `開始遊戲 (${gameState.players.length}/${maxPlayers})`}
              </button>
            ) : (
              <p className="waiting-not-host-text">
                等待房主開始遊戲...
              </p>
            )}
          </div>

          {/* 中央 - 蓋牌展示 */}
          <div className="waiting-center-column">
            <div className="waiting-hidden-cards-area">
              <h3 className="waiting-hidden-title">
                等待開局
              </h3>
              <div className="waiting-hidden-cards">
                <div className="waiting-hidden-card"></div>
                <div className="waiting-hidden-card"></div>
              </div>
              <p className="waiting-hidden-hint">遊戲開始後將隨機抽取兩張蓋牌</p>
            </div>
          </div>

          {/* 右欄 - 玩家列表 */}
          <div className="waiting-right-column">
            <div className="waiting-players-header">
              <h3 className="waiting-players-title">

                玩家
              </h3>
              <span className="waiting-players-count">{gameState.players.length}/{maxPlayers}</span>
            </div>

            <div className="waiting-players-list">
              {gameState.players.map((player) => (
                <div
                  key={player.id}
                  className={`waiting-player-card ${player.id === myPlayer?.id ? 'is-me' : ''}`}
                >
                  {(player.id === myPlayer?.id ? authUser?.photoURL : player.photoURL) ? (
                    <img
                      className="waiting-player-avatar-img"
                      src={player.id === myPlayer?.id ? authUser.photoURL : player.photoURL}
                      alt={player.name}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="waiting-player-avatar">
                      {getPlayerInitial(player.name)}
                    </div>
                  )}
                  <div className="waiting-player-info">
                    <p className="waiting-player-name">
                      <span className="waiting-player-display-name" title={player.name}>{player.name}</span>
                      {player.id === myPlayer?.id && <span className="me-tag">我</span>}
                      {player.isHost && <span className="host-tag">房主</span>}
                    </p>
                    <div className="waiting-player-stats">
                      <span>{player.score || 0} 分</span>
                      <span>{player.hand?.length || 0} 張牌</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* 空位 */}
              {Array.from({ length: emptySlots }).map((_, index) => (
                <div key={`empty-${index}`} className="waiting-empty-slot">
                  <span aria-hidden="true">＋</span>
                  等待中...
                </div>
              ))}
            </div>

            {/* 邀請好友按鈕 */}
            <button className="waiting-invite-btn" onClick={handleCopyRoomLink}>

              邀請好友
            </button>
          </div>
        </main>

        {/* 複製成功提示 */}
        {showCopyToast && (
          <div className="waiting-copy-toast">
            已複製房間連結到剪貼簿
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <div className="error-message" role="alert">
            {error}
            <button onClick={() => setError('')} className="close-error">×</button>
          </div>
        )}

        {/* 版本資訊 */}
        <VersionInfo />
      </div>
    );
  }

  // 顏色組合牌定義（工單 0124，工單 0217：改用圖片）


  // 遊戲進行中/結束階段：渲染新的三欄式 UI（工單 0124, 0132）
  if (gameState.gamePhase === GAME_PHASE_PLAYING ||
      gameState.gamePhase === GAME_PHASE_POST_QUESTION ||
      gameState.gamePhase === GAME_PHASE_FOLLOW_GUESSING ||
      gameState.gamePhase === GAME_PHASE_ROUND_END ||
      gameState.gamePhase === GAME_PHASE_FINISHED) {
    return (
      <div className={`game-room playing-stage ${threeReady ? 'three-enabled' : ''}`}>
        <TabletopHeader mode={isLocalMode ? '單人' : '連線'} isYourTurn={canAct}
          guide={gameState.gamePhase === GAME_PHASE_FINISHED ? '本局結束' : gameState.gamePhase === GAME_PHASE_FOLLOW_GUESSING ? '跟猜階段' : gameState.gamePhase === GAME_PHASE_ROUND_END ? '本輪結算' : gameState.gamePhase === GAME_PHASE_POST_QUESTION ? '問牌完成 · 決定預測或結束回合' : myPlayer?.isActive === false ? '本局停止主動行動 · 仍須回應問牌與交牌' : canAct ? (onlyGuess ? '僅剩你可猜牌 · 請立即猜測藥方' : '輪到你 · 選擇問牌組合或猜牌') : `輪到 ${currentPlayer?.name || '其他玩家'} 行動`}
          actions={<>
            <button type="button" className="console-hud-button" aria-label="開啟遊戲規則" onClick={() => setConsolePanel('rules')}>規則</button>
            <button type="button" className="console-hud-button" aria-label="開啟遊戲紀錄" onClick={() => setConsolePanel('history')}>紀錄</button>
            <button className="playing-leave-btn" onClick={handleLeaveRoom}>
              離開
            </button>
          </>} />

        <Tabletop3D key={`playing-${gameId}-${gameState.round ?? gameState.currentRound ?? 0}`} players={gameState.players} hand={myPlayer?.hand || []} myId={myPlayer?.id}
          currentIndex={gameState.currentPlayerIndex} combos={colorCombinations} lastCombo={myLastColorCardId}
          canAsk={canAct && !onlyGuess} canGuess={canAct} onReady={setThreeReady}
          result={gameState.gamePhase === GAME_PHASE_FINISHED ? (gameState.winner ? `獲勝者：${gameState.players.find(p => p.id === gameState.winner)?.name || '玩家'}` : '本局結束') : null}
          onAsk={combo => handleColorCardSelect({id: combo.id, colors: combo.colors})} onGuess={handleOpenGuess} />
        {/* 主內容 - 三欄佈局 */}
        <main className="playing-main">
          {/* 右欄 - 玩家列表 */}
          <aside className="playing-right-column">
            <h3 className="playing-players-title">玩家</h3>
            {gameState.players.map((player, index) => (
              <div
                key={player.id}
                className={`playing-player-card ${index === gameState.currentPlayerIndex ? 'is-current-turn' : ''} ${player.isActive === false ? 'is-eliminated' : ''}`}
              >
                {index === gameState.currentPlayerIndex && player.isActive !== false && (
                  <span className="playing-turn-badge">回合</span>
                )}
                {player.isActive === false && (
                  <span className="playing-eliminated-badge">停止主動行動</span>
                )}
                {(player.id === myPlayer?.id ? authUser?.photoURL : player.photoURL) ? (
                  <img
                    className="playing-player-avatar-img"
                    src={player.id === myPlayer?.id ? authUser.photoURL : player.photoURL}
                    alt={player.name}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="playing-player-avatar">
                    {getPlayerInitial(player.name)}
                  </div>
                )}
                <div className="playing-player-info">
                  <h4>
                    {player.name}
                    {player.id === myPlayer?.id && ' (我)'}
                    {player.difficulty && <small className="table-ai-level"> · {{easy: '簡單', medium: '中等', hard: '困難'}[player.difficulty]}</small>}
                  </h4>
                  <p>分數: {player.score || 0} | 手牌: {player.hand?.length || 0}</p>
                </div>
              </div>
            ))}

          </aside>
          {/* 中央區域 */}
          <section className="playing-center-column">
            {/* 蓋牌區 */}
            <div className="playing-hidden-area">
              <h2 className="playing-hidden-title">
                蓋牌
              </h2>
              <div className="playing-hidden-cards">
                <div className="playing-hidden-card" aria-label="未揭曉的蓋牌"><span aria-hidden="true">本<br />草</span></div>
                <div className="playing-hidden-card" aria-label="未揭曉的蓋牌"><span aria-hidden="true">本<br />草</span></div>
              </div>

            </div>

            {/* 顏色組合牌 */}
            <div className="playing-inquiry-area">
              <h3 className="playing-inquiry-title">
                問牌選擇
              </h3>

              <div className="playing-inquiry-grid">
                {colorCombinations.map((combo) => {
                  const isDisabledBySelf = combo.id === myLastColorCardId;
                  const marker = colorCardMarkers[combo.id];
                  const isDisabled = !canAct || onlyGuess || isDisabledBySelf;

                  return (
                    <button
                      type="button"
                      key={combo.id}
                      disabled={!canAct || onlyGuess}
                      aria-label={`問牌：${combo.name}${isDisabledBySelf ? '，上一輪已使用' : ''}`}
                      aria-disabled={isDisabled}
                      className={`playing-inquiry-card ${isDisabled ? 'disabled' : ''} ${isDisabledBySelf ? 'disabled-by-self' : ''}`}
                      onClick={() => {
                        if (isDisabledBySelf) {
                          handleDisabledCardClick();
                        } else if (canAct && !onlyGuess) {
                          handleColorCardSelect({ id: combo.id, colors: combo.colors });
                        }
                      }}
                    >
                      <span className="table-combination-swatches" aria-hidden="true">{combo.colors.map(color => <span key={color} className={`table-herb-pair ${color}`}><HerbArt color={color} /></span>)}</span>
                      <span className="table-combination-name">{combo.name}</span>

                      {isDisabledBySelf && (
                        <div className="playing-inquiry-card-disabled-overlay">
                          <span>上次已使用</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 遊戲結束資訊 - 工單 0132 */}
            {gameState.gamePhase === GAME_PHASE_FINISHED && (
              <div className="playing-game-over-info">
                {gameState.winner ? (
                  <p className="playing-winner-message">
                    獲勝者: {gameState.players.find(p => p.id === gameState.winner)?.name || '未知'}
                  </p>
                ) : (
                  <p className="playing-no-winner-message">遊戲結束，沒有獲勝者</p>
                )}
              </div>
            )}
          </section>

        </main>

        {/* 底部手牌區 */}
        <footer className="playing-footer">
          <div className="playing-footer-content">
            <div className="playing-hand-label">
              <h4>我的手牌</h4>
              <div className="playing-hand-count">
                <span>{myPlayer?.hand?.length || 0} 張</span>
              </div>
            </div>

            <div className="playing-hand-cards">
              {(myPlayer?.hand || []).map((card, index) => (
                <div
                  key={card.id || index}
                  className={`playing-hand-card color-${card.color}`}
                  role="img"
                  aria-label={`${HERB_GROUPS[card.color].name} ${herbForCard(card)?.name || ''}`}
                >
                  <div className="playing-hand-card-inner">
                    <span className="table-card-color">{herbForCard(card)?.name}</span>
                    <HerbArt color={card.color} card={card} />
                    <span className="table-card-label">{HERB_GROUPS[card.color].symbol} {HERB_GROUPS[card.color].name}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="playing-action-buttons">
              <button
                className="playing-action-btn"
                disabled={!canAct}
                onClick={handleOpenGuess}
              >
                <span>猜牌</span>
                <small>猜錯將退出本輪</small>
              </button>
            </div>
          </div>
        </footer>

        <div className="console-panel-backdrop" hidden={!consolePanel} onClick={() => setConsolePanel(null)}>
          <section className="console-panel" ref={consolePanelRef} role="dialog" aria-modal="true" aria-labelledby="console-panel-title" onClick={event => event.stopPropagation()}>
            <header><h2 id="console-panel-title">{consolePanel === 'rules' ? '遊戲規則' : '遊戲紀錄'}</h2><button type="button" aria-label="關閉面板" onClick={() => setConsolePanel(null)}>關閉 ×</button></header>
            <div className="console-panel-scroll">
              <div hidden={consolePanel === 'rules'}>              <div className="playing-history-list">
                {gameState.gameHistory && gameState.gameHistory.slice(-10).reverse().map((record, index) => {
                  const formatted = formatHistoryRecord(record);
                  return (
                    <div
                      key={index}
                      className={`playing-history-item ${record.playerId === myPlayer?.id ? 'is-me' : ''}`}
                    >
                      <p className="playing-history-item-player">
                        {formatted.playerName}
                        {record.playerId === myPlayer?.id && ' (我)'}
                      </p>
                      <p className="playing-history-item-action">{formatted.action}</p>
                    </div>
                  );
                })}
                {(!gameState.gameHistory || gameState.gameHistory.length === 0) && (
                  <p style={{ color: '#7f786c', fontSize: '12px', textAlign: 'center' }}>暫無紀錄</p>
                )}
              </div>
</div>
              <div hidden={consolePanel !== 'rules'} className="console-rules">
                <h3>當下任務</h3><p>{canAct ? '從六種顏色組合選一組，向其他玩家問牌；有把握時可猜中央兩張蓋牌。' : '等待目前玩家完成行動，並利用遊戲紀錄整理線索。'}</p>
                <h3>一個回合</h3><ol><li>選顏色組合，再選問牌對象與方式。</li><li>依回覆取得線索；問牌後可預測或結束回合。</li><li>猜牌時選兩個顏色（可重複），其他玩家依序決定跟猜。</li></ol>
                <h3>猜錯後不是離開房間</h3>
                <p>猜錯或跟錯後，本局不能再主動問牌、猜牌或跟猜，自己的回合會被跳過；但其他玩家仍可向你問牌，你仍須照問法收牌、交牌或回答張數。</p>
                <p>剩餘手牌保留並維持保密，不公開、不封存、不交給旁人、不放回牌堆。看過的藥方答案也不能洩漏。</p>
                <h3>只剩一人可猜牌</h3><p>最後一位有猜牌資格的玩家必須立即猜測藥方，不能繼續問牌。有人猜對或所有人都用完猜牌資格，本局才結束；下一局重新洗牌並恢復行動資格。</p>
                <p>依據：EmperorS4《本草》英文規則 Curing（第 10 頁）。本版本仍有數位改編差異，並非所有流程皆已完成原規則一致性驗收。</p>
              </div>
            </div>
          </section>
        </div>

        {/* 新版問牌流程 Modal */}
        {showQuestionFlow && selectedColorCard && (
          <QuestionFlow
            selectedCard={selectedColorCard}
            players={gameState.players}
            currentPlayerId={myPlayer?.id}
            currentPlayerHand={myPlayer?.hand || []}
            onSubmit={handleQuestionFlowSubmit}
            onCancel={handleQuestionFlowCancel}
            isLoading={isLoading}
          />
        )}

        {/* 猜牌介面 Modal */}
        {showGuessCard && (
          <TreasureGuessDialog onClose={handleCloseGuess} busy={isLoading}>
              <GuessCard
                onSubmit={handleGuessSubmit}
                onCancel={handleCloseGuess}
                isOpen={showGuessCard}
                isLoading={isLoading}
                guessResult={guessResult}
                onResultClose={handleCloseGuess}
                hiddenCards={hiddenCardsForGuess}
                canViewAnswer={true}
              />
          </TreasureGuessDialog>
        )}

        {publicTransfer && publicTransfer.from !== myPlayer?.id && <PublicTransferFlight transfer={publicTransfer} onComplete={() => setPublicTransfer(null)} />}
        {localQuestionRequest && <LocalQuestionTransfer key={localQuestionRequest.requestId || 'local'} request={localQuestionRequest}
          onStart={chosenColor => { if (!isLocalMode) submitColorChoice(gameId, chosenColor || 'none', {requestId: localQuestionRequest.requestId, stage:'start'}); }}
          onComplete={async chosenColor => {
          if (!isLocalMode) {
            submitColorChoice(gameId, chosenColor || 'none', {requestId: localQuestionRequest.requestId, stage:'complete'});
            return; // Wait for the authoritative completion/cancellation to dismiss.
          }
          const controller = localControllerRef.current;
          if (!controller) return;
          const committed = await controller.confirmLocalQuestion(chosenColor);
          if (committed) {
            setLocalQuestionRequest(null);
            controller.endTurn({ playerId: localQuestionRequest.playerId, prediction: null });
          }
        }} />}
        {/* 預測介面 Modal */}
        {showPrediction && isMyTurn() && (
          <div className="modal-overlay">
            <div className="modal-content prediction-modal" onClick={(e) => e.stopPropagation()}>
              <Prediction
                onEndTurn={handleEndTurn}
                isLoading={predictionLoading}
              />
            </div>
          </div>
        )}

        {/* 等待問牌玩家結束回合 */}
        {gameState.gamePhase === GAME_PHASE_POST_QUESTION && !isMyTurn() && !cardGiveNotification && !localQuestionRequest && !publicTransfer && (
          <div className="waiting-overlay">
            <div className="waiting-message">
              <p>等待 {getCurrentPlayer()?.name || '對方'} 結束回合...</p>
            </div>
          </div>
        )}

        {/* 給牌通知 Modal */}
        {cardGiveNotification && (
          <div className="modal-overlay">
            <div className="modal-content card-give-notification-modal" onClick={(e) => e.stopPropagation()}>
              <CardGiveNotification
                notification={cardGiveNotification}
                onConfirm={handleCloseCardGiveNotification}
              />
            </div>
          </div>
        )}

        {/* 顏色選擇介面 Modal */}
        {showColorChoice && colorChoiceData && (
          <div className="modal-overlay">
            <div className="modal-content color-choice-modal" onClick={(e) => e.stopPropagation()}>
              <div className="color-choice-card">
                <h3>選擇要給的顏色</h3>
                <p className="color-choice-message">
                  {gameState.players.find(p => p.id === colorChoiceData.askingPlayerId)?.name || '對方'}
                  使用「其中一種顏色全部」方式向你要牌
                </p>
                {colorChoiceData.availableColors?.length === 0 ? (
                  <>
                    <p>你沒有這兩種顏色的牌。</p>
                    <div className="color-choice-buttons">
                      <button className="btn btn-secondary" onClick={() => handleColorChoice('none')}>
                        確認（無牌可給）
                      </button>
                    </div>
                  </>
                ) : colorChoiceData.availableColors?.length === 1 ? (
                  <>
                    <p>請確認給出你有的顏色：</p>
                    <div className="color-choice-buttons">
                      {colorChoiceData.colors.map(color => {
                        const isAvailable = colorChoiceData.availableColors?.includes(color);
                        return (
                          <button
                            key={color}
                            className={`btn btn-color color-${color} ${!isAvailable ? 'disabled' : ''}`}
                            onClick={() => isAvailable && handleColorChoice(color)}
                            disabled={!isAvailable}
                          >
                            {color === 'red' ? '紅色' : color === 'yellow' ? '黃色' : color === 'green' ? '綠色' : '藍色'}
                            {!isAvailable && ' (無)'}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <p>請選擇要給哪種顏色的全部牌：</p>
                    <div className="color-choice-buttons">
                      {colorChoiceData.colors.map(color => (
                        <button
                          key={color}
                          className={`btn btn-color color-${color}`}
                          onClick={() => handleColorChoice(color)}
                        >
                          {color === 'red' ? '紅色' : color === 'yellow' ? '黃色' : color === 'green' ? '綠色' : '藍色'}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 等待顏色選擇提示 */}
        {waitingForColorChoice && colorChoiceInfo && colorChoiceInfo.targetPlayerId !== myPlayer?.id && !publicTransfer && (
          <div className="waiting-overlay">
            <div className="waiting-message">
              <p>等待 {gameState.players.find(p => p.id === colorChoiceInfo.targetPlayerId)?.name || '對方'} 選擇要給哪種顏色...</p>
            </div>
          </div>
        )}

        {/* 跟猜面板 Modal - 工單 0131 */}
        {showFollowGuessPanel && followGuessData && (
          <div className="modal-overlay">
            <div className="modal-content fg-modal fg-stage" role="dialog" aria-modal="true" aria-labelledby="fg-stage-title" onClick={(e) => e.stopPropagation()}>
              {/* 草藥紋理背景 */}
              <div className="fg-texture"></div>
              {/* 角落裝飾 */}
              <div className="fg-corner-tr"></div>
              <div className="fg-corner-bl"></div>

              {/* 標題區 */}
              <div className="fg-header">
                <p className="fg-eyebrow">本草 · 同探藥方</p>
                <h3 id="fg-stage-title" className="fg-title">跟猜階段</h3>
                <div className="fg-title-line"></div>
              </div>

              {/* 猜牌資訊區塊 */}
              <div className="fg-guess-info">
                <p className="fg-guess-text">
                  {gameState.players.find(p => p.id === followGuessData.guessingPlayerId)?.name || '玩家'} 猜測蓋牌是：
                </p>
                <div className="fg-color-pills">
                  {followGuessData.guessedColors.map((color, idx) => (
                    <span key={idx} className={`fg-color-pill fg-color-${color}`}>
                      <span className="fg-herb-illustration" aria-hidden="true"><HerbArt color={color} /></span>
                      <span className="fg-herb-label">
                      {color === 'red' ? '紅色藥草' :
                       color === 'yellow' ? '黃色藥草' :
                       color === 'green' ? '綠色藥草' :
                       color === 'blue' ? '藍色藥草' : color}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* 玩家決策狀態列表 */}
              <div className="fg-status-section">
                <h4 className="fg-status-title">玩家決策狀態</h4>
                <div className="fg-player-list">
                  {/* 猜牌者 */}
                  <div className="fg-player-item fg-guesser">
                    <div className="fg-player-info">
                      <div className="fg-avatar fg-avatar-gold">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                      <div className="fg-player-details">
                        <span className="fg-player-name">
                          {gameState.players.find(p => p.id === followGuessData.guessingPlayerId)?.name || '玩家'}
                        </span>
                        <span className="fg-badge fg-badge-guesser">猜牌者</span>
                      </div>
                    </div>
                    <div className="fg-status fg-status-initiated">
                      <span className="material-symbols-outlined">check_circle</span>
                      發起猜測
                    </div>
                  </div>

                  {/* 其他玩家按順序 */}
                  {followGuessData.decisionOrder?.map((playerId) => {
                    const player = gameState.players.find(p => p.id === playerId);
                    const decision = followGuessData.decisions?.[playerId];
                    const isCurrentDecider = followGuessData.currentDeciderId === playerId;
                    const isMe = playerId === myPlayer?.id;

                    return (
                      <div
                        key={playerId}
                        className={`fg-player-item ${isCurrentDecider ? 'fg-current-decider' : ''} ${decision ? '' : 'fg-waiting'}`}
                      >
                        <div className="fg-player-info">
                          <div className={`fg-avatar ${isCurrentDecider ? 'fg-avatar-orange' : ''}`}>
                            <span className="material-symbols-outlined">person</span>
                          </div>
                          <span className="fg-player-name">
                            {player?.name || playerId}
                            {isMe && ' (你)'}
                          </span>
                        </div>
                        {isCurrentDecider && !decision && (
                          <div className="fg-status fg-status-deciding">
                            <span className="fg-deciding-dot"></span>
                            決定中...
                          </div>
                        )}
                        {decision === 'follow' && (
                          <div className="fg-status fg-status-follow">跟隨</div>
                        )}
                        {decision === 'pass' && (
                          <div className="fg-status fg-status-pass">不跟</div>
                        )}
                        {!isCurrentDecider && !decision && (
                          <div className="fg-status fg-status-waiting">等待中</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 自己需要決定時顯示按鈕 */}
              {followGuessData.currentDeciderId === myPlayer?.id && (
                <div className="fg-action-area">
                  <div className="fg-action-prompt">
                    <p className="fg-prompt-title">輪到你決定！</p>
                    <p className="fg-prompt-desc">
                      跟對 <span className="fg-score-plus">+1 分</span>，跟錯 <span className="fg-score-minus">-1 分</span> 並退出當局
                    </p>
                  </div>
                  <div className="fg-buttons">
                    <button
                      className="fg-btn fg-btn-pass"
                      onClick={() => handleFollowGuess(false)}
                    >
                      <span className="material-symbols-outlined">cancel</span>
                      不跟
                    </button>
                    <button
                      className="fg-btn fg-btn-follow"
                      onClick={() => handleFollowGuess(true)}
                    >
                      <span className="material-symbols-outlined">check_circle</span>
                      跟猜
                    </button>
                  </div>
                </div>
              )}

              {/* 自己是猜牌者 */}
              {followGuessData.guessingPlayerId === myPlayer?.id && (
                <p className="fg-waiting-text">等待其他玩家按順序決定是否跟猜...</p>
              )}

              {/* 自己已決定 */}
              {followGuessData.decisions?.[myPlayer?.id] &&
               followGuessData.guessingPlayerId !== myPlayer?.id && (
                <p className="fg-waiting-text">
                  你選擇了「{followGuessData.decisions[myPlayer?.id] === 'follow' ? '跟猜' : '不跟'}」，等待其他玩家...
                </p>
              )}

              {/* 還沒輪到自己 */}
              {!followGuessData.decisions?.[myPlayer?.id] &&
               followGuessData.currentDeciderId !== myPlayer?.id &&
               followGuessData.guessingPlayerId !== myPlayer?.id &&
               followGuessData.decisionOrder?.includes(myPlayer?.id) && (
                <p className="fg-waiting-text">還沒輪到你，請等待...</p>
              )}
            </div>
          </div>
        )}

        {/* 局結束 / 猜牌結果面板 - 工單 0133 / 工單 0172 重構 */}
        {showRoundEnd && guessResultData && (
          <div className="modal-overlay gr-ledger-overlay">
            <div className="modal-content gr-modal gr-ledger" role="dialog" aria-modal="true" aria-labelledby="gr-result-title" onClick={(e) => e.stopPropagation()}>
              {/* 紋理背景 */}
              <div className="gr-texture"></div>

              {/* 結算演出：牌桌物件 → 結果 → 個人得失分 */}
              <div className={`gr-header ${guessResultData.isCorrect ? 'is-victory' : 'is-miss'}`}>
                <div className="gr-round-meta"><span>第 {gameState.currentRound || 1} 局</span><span>本草 · HERBALISM</span></div>
                <div className="gr-result-scene" aria-hidden="true">
                  <img src={`${process.env.PUBLIC_URL}/images/tabletop/result-apothecary-vignette.webp`} alt="" draggable="false" />
                  <div className="gr-scene-sigil">{guessResultData.isCorrect ? '解' : '失'}</div>
                </div>
                <div className="gr-outcome-copy">
                  <p className="gr-outcome-kicker">{guessResultData.isCorrect ? '藥方已解' : '藥方未明'}</p>
                  <h1 id="gr-result-title" className={`gr-title ${guessResultData.isCorrect ? 'gr-title-correct' : 'gr-title-wrong'}`}>
                    {guessResultData.isCorrect ? '猜對了！' : '猜錯了！'}
                  </h1>
                  <p className="gr-ledger-caption">{guessResultData.isCorrect ? '線索相合，真相揭曉。' : '蓋牌仍藏著未解的線索。'}</p>
                </div>
                <div className="gr-personal-score" aria-label="你的本次得失分">
                  <span>你的本次得分</span>
                  <strong className={(guessResultData.scoreChanges[myPlayer?.id] || 0) < 0 ? 'is-negative' : ''}>
                    {(guessResultData.scoreChanges[myPlayer?.id] || 0) > 0 ? '+' : ''}{guessResultData.scoreChanges[myPlayer?.id] || 0}
                  </strong><span>分</span>
                </div>
              </div>

              <div className="console-result-body">
              {/* 工單 0172：蓋牌顯示區 — 只在猜對且有蓋牌資料時顯示 */}
              {guessResultData.isCorrect && guessResultData.hiddenCards && (
                <div className="gr-hidden-cards">
                  <p className="gr-hidden-label">蓋牌是：</p>
                  <div className="gr-cards-row">
                    {guessResultData.hiddenCards.map((card, index) => {
                      const colorConfig = {
                        red: { bg: '#E53E3E', name: '紅' },
                        yellow: { bg: '#D69E2E', name: '黃' },
                        green: { bg: '#43A047', name: '綠' },
                        blue: { bg: '#1E88E5', name: '藍' }
                      };
                      const config = colorConfig[card.color] || colorConfig.green;
                      return (
                        <div key={index} className="gr-card-pill gr-reveal-card" style={{'--reveal-ink':config.bg, animationDelay:`${index * 180}ms`}}>
                          <div className="gr-reveal-back" aria-hidden="true">本草</div>
                          <div className="gr-reveal-front"><HerbArt color={card.color} card={card} /><span>{herbForCard(card)?.name || config.name}</span></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 分數變化區塊 */}
              <details className="gr-section gr-changes-section">
                <summary className="gr-section-title">查看本次得失</summary>
                <div className="gr-card-list">
                  {Object.entries(guessResultData.scoreChanges).map(([playerId, change]) => {
                    const player = gameState.players.find(p => p.id === playerId);
                    const isGuesser = playerId === guessResultData.guessingPlayerId;
                    const isFollower = guessResultData.followingPlayers?.includes(playerId);
                    return (
                      <div key={playerId} className="gr-score-item">
                        <div className="gr-player-info">
                          <div className={`gr-avatar ${change > 0 ? 'gr-avatar-positive' : 'gr-avatar-neutral'}`}>
                            <span aria-hidden="true">{(player?.name || '客').slice(0, 1)}</span>
                          </div>
                          <div className="gr-player-details">
                            <p className="gr-player-name">
                              {player?.name || playerId}
                              {isGuesser && <span className="gr-role-tag gr-role-guesser">(猜牌者)</span>}
                              {isFollower && <span className="gr-role-tag gr-role-follower">(跟猜)</span>}
                            </p>
                            <p className="gr-player-desc">
                              {isGuesser ? (guessResultData.isCorrect ? '猜對獲得加分' : '猜錯扣分') :
                               isFollower ? (change > 0 ? '跟猜成功' : '跟猜失敗') : '未猜測'}
                            </p>
                          </div>
                        </div>
                        <div className={`gr-score-change ${change > 0 ? 'gr-score-positive' : change < 0 ? 'gr-score-negative' : ''}`}>
                          {change > 0 ? `+${change}` : change}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>

              {/* 預測結果 */}
              {guessResultData.predictionResults && guessResultData.predictionResults.length > 0 && (
                <PredictionResult
                  predictionResults={guessResultData.predictionResults}
                  players={gameState.players}
                  hiddenCards={guessResultData.hiddenCards}
                />
              )}

              {/* 目前分數區塊 */}
              <div className="gr-section gr-standing-section">
                <h3 className="gr-section-title">
                  <span className="material-symbols-outlined">leaderboard</span>
                  目前分數
                </h3>
                <div className="gr-card-list">
                  {[...gameState.players]
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map((player, index) => (
                      <div key={player.id} className={`gr-ranking-item ${player.id === myPlayer?.id ? 'is-self' : ''}`} >
                        <div className="gr-ranking-info">
                          <span className="gr-rank-number">{player.name?.slice(0, 1) || index + 1}</span>
                          <p className="gr-rank-name">{player.name}</p>
                          {(player.score || 0) >= 7 && (
                            <span className="gr-winner-badge">勝利！</span>
                          )}
                        </div>
                        <div className="gr-rank-score">{player.score || 0}</div>
                      </div>
                    ))}
                </div>
              </div>

              {/* 遊戲結束宣告 */}
              {gameState.gamePhase === GAME_PHASE_FINISHED && (
                <div className="gr-winner-announcement">
                  恭喜 <span className="gr-winner-name">{gameState.players.find(p => p.id === gameState.winner)?.name || '獲勝者'}</span> 獲勝！
                </div>
              )}

              </div>
              {/* 工單 0207：底部按鈕區 — 所有玩家都顯示確認按鈕 */}
              <div className="gr-actions">
                <p className="gr-ledger-footnote">確認後返回牌桌</p>
                {gameState.gamePhase === GAME_PHASE_FINISHED ? (
                  /* 遊戲結束：所有人看到「離開房間」 */
                  <button className="gr-btn gr-btn-secondary" onClick={handleLeaveRoom}>
                    <span>離開房間</span>
                    <span className="material-symbols-outlined">logout</span>
                  </button>
                ) : (
                  /* 所有情況：所有玩家都顯示「確定」按鈕 */
                  <button className="gr-btn gr-btn-primary" onClick={handleConfirmGuessResult}>
                    <span>確定</span>
                    <span className="material-symbols-outlined">check</span>
                  </button>
                )}
              </div>

              {/* 底部裝飾線 */}
              <div className="gr-bottom-line"></div>
            </div>
          </div>
        )}

        {/* 工單 0210：重連覆蓋層 */}
        {isReconnecting && (
          <div className="gr-reconnecting-overlay">
            <div className="gr-reconnecting-content">
              <div className="gr-reconnecting-spinner"></div>
              <p>重新連線中...</p>
            </div>
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <div className="error-message" role="alert">
            {error}
            <button onClick={() => setError('')} className="close-error">×</button>
          </div>
        )}

        {/* 版本資訊 */}
        <VersionInfo />
      </div>
    );
  }

  // 其他階段（如 finished）：渲染原有 UI
  return (
    <div className="game-room">
      {/* 頂部區域：遊戲資訊 */}
      <header className="game-room-header">
        <div className="game-info">
          <h1>遊戲房間</h1>
          <span className="game-id">房間ID: {gameId}</span>
          <span className="game-phase">{getGamePhaseText()}</span>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={handleLeaveRoom}
          >
            離開房間
          </button>
        </div>
      </header>

      {/* 主要遊戲區域 */}
      <main className="game-room-main">
        {/* 左側：遊戲狀態 */}
        <aside className="status-sidebar">
          <GameStatusContainer showHistory={true} />

          {/* 等待中時顯示開始按鈕 */}
          {gameState.gamePhase === GAME_PHASE_WAITING && myPlayer?.isHost && (
            <button
              className="btn btn-primary start-game-btn"
              onClick={handleStartGame}
              disabled={gameState.players.length < 3 || isLoading}
            >
              {isLoading ? '啟動中...' : `開始遊戲 (${gameState.players.length}/${gameState.maxPlayers || 4})`}
            </button>
          )}

          {/* 等待中非房主提示 */}
          {gameState.gamePhase === GAME_PHASE_WAITING && !myPlayer?.isHost && (
            <p className="waiting-host">等待房主開始遊戲...</p>
          )}
        </aside>

        {/* 中央：遊戲桌面 */}
        <section className="game-board-area">
          <GameBoard
            currentPlayerId={myPlayer?.id}
            isGuessing={isGuessing}
            canSelectColorCard={canAct && !onlyGuess && !showQuestionFlow}
            myDisabledCardId={myLastColorCardId}
            cardMarkers={colorCardMarkers}
            onColorCardSelect={handleColorCardSelect}
            onDisabledCardClick={handleDisabledCardClick}
          />

          {/* 遊戲結束資訊 */}
          {gameState.gamePhase === GAME_PHASE_FINISHED && (
            <div className="game-over-info">
              {gameState.winner ? (
                <p className="winner-message">
                  獲勝者: {gameState.players.find(p => p.id === gameState.winner)?.name || '未知'}
                </p>
              ) : (
                <p className="no-winner-message">遊戲結束，沒有獲勝者</p>
              )}
            </div>
          )}
        </section>

        {/* 右側：玩家列表 */}
        <aside className="players-sidebar">
          <h2>玩家列表</h2>
          <ul className="player-list">
            {gameState.players.map((player, index) => {
              const isAI = isAIPlayer(player);
              const isAIThinking = isAI && currentAIId === player.id && aiThinking;
              const isCurrentTurn = index === gameState.currentPlayerIndex;

              return (
                <li
                  key={player.id}
                  className={`player-item ${isCurrentTurn ? 'current-turn' : ''} ${player.isActive === false ? 'eliminated' : ''} ${isAI ? 'ai-player' : ''} ${isAIThinking ? 'ai-turn' : ''}`}
                >
                  <span className="player-name">
                    {player.name}
                    {player.isHost && ' (房主)'}
                    {player.id === myPlayer?.id && ' (我)'}
                    {player.difficulty && <small className="table-ai-level"> · {{easy: '簡單', medium: '中等', hard: '困難'}[player.difficulty]}</small>}
                    {isAI && <span className="ai-badge">🤖 AI</span>}
                  </span>
                  <span className="player-score">{player.score || 0} 分</span>
                  <span className="player-cards">
                    {player.hand ? `${player.hand.length} 張牌` : ''}
                  </span>
                  {isCurrentTurn && player.isActive !== false && (
                    <span className="turn-indicator">輪到此玩家</span>
                  )}
                  {player.isActive === false && (
                    <span className="eliminated-badge">已退出</span>
                  )}
                  {isAIThinking && (
                    <AIThinkingIndicator
                      isThinking={true}
                      size="small"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </aside>
      </main>

      {/* 底部區域：自己的手牌和操作按鈕 */}
      <footer className="game-room-footer">
        {/* 自己的手牌 */}
        <div className="my-hand-section">
          <PlayerHand
            cards={myPlayer?.hand || []}
            title="我的手牌"
            selectable={false}
          />
        </div>

        {/* 操作按鈕 */}
        {gameState.gamePhase === GAME_PHASE_PLAYING && (
          <div className="action-buttons">
            {canAct && !onlyGuess && (
              <p className="action-hint">點擊上方顏色牌開始問牌，或直接猜牌</p>
            )}
            {canAct && (
              <button
                className={`btn ${onlyGuess ? 'btn-danger' : 'btn-secondary'}`}
                onClick={handleOpenGuess}
                disabled={isLoading}
              >
                猜牌
                {onlyGuess && <span className="must-guess-hint">（必須猜牌）</span>}
              </button>
            )}
            {!canAct && currentPlayer && myPlayer?.isActive !== false && (
              <p className="waiting-turn">等待 {currentPlayer.name} 的回合...</p>
            )}
            {myPlayer?.isActive === false && (
              <p className="eliminated-message">你本局不能再主動行動；手牌保密，仍須回應其他玩家問牌與交牌。</p>
            )}
          </div>
        )}
      </footer>

      {/* 舊版問牌介面 Modal（保留作為備用） */}
      {showQuestionCard && (
        <div className="modal-overlay" onClick={handleCloseQuestion}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <QuestionCard
              players={gameState.players}
              currentPlayerId={myPlayer?.id}
              currentPlayerHand={myPlayer?.hand || []}
              onSubmit={handleQuestionSubmit}
              onCancel={handleCloseQuestion}
              isOpen={showQuestionCard}
              isLoading={isLoading}
              questionResult={questionResult}
              onResultClose={handleCloseQuestion}
            />
          </div>
        </div>
      )}

      {/* 新版問牌流程 Modal（工單 0074：先選顏色牌） */}
      {showQuestionFlow && selectedColorCard && (
        <QuestionFlow
          selectedCard={selectedColorCard}
          players={gameState.players}
          currentPlayerId={myPlayer?.id}
          currentPlayerHand={myPlayer?.hand || []}
          onSubmit={handleQuestionFlowSubmit}
          onCancel={handleQuestionFlowCancel}
          isLoading={isLoading}
        />
      )}

      {/* 猜牌介面 Modal */}
      {showGuessCard && (
        <TreasureGuessDialog onClose={handleCloseGuess} busy={isLoading}>
            <GuessCard
              onSubmit={handleGuessSubmit}
              onCancel={handleCloseGuess}
              isOpen={showGuessCard}
              isLoading={isLoading}
              guessResult={guessResult}
              onResultClose={handleCloseGuess}
              hiddenCards={hiddenCardsForGuess}
              canViewAnswer={true}
            />
        </TreasureGuessDialog>
      )}

      {/* 預測介面 Modal（工單 0071：問牌後選擇預測） */}
      {showPrediction && isMyTurn() && (
        <div className="modal-overlay">
          <div className="modal-content prediction-modal" onClick={(e) => e.stopPropagation()}>
            <Prediction
              onEndTurn={handleEndTurn}
              isLoading={predictionLoading}
            />
          </div>
        </div>
      )}

      {/* 等待問牌玩家結束回合 */}
      {gameState.gamePhase === GAME_PHASE_POST_QUESTION && !isMyTurn() && !cardGiveNotification && !localQuestionRequest && !publicTransfer && (
        <div className="waiting-overlay">
          <div className="waiting-message">
            <p>等待 {getCurrentPlayer()?.name || '對方'} 結束回合...</p>
          </div>
        </div>
      )}

      {/* 給牌通知 Modal（工單 0072：私密訊息給被要牌玩家） */}
      {cardGiveNotification && (
        <div className="modal-overlay">
          <div className="modal-content card-give-notification-modal" onClick={(e) => e.stopPropagation()}>
            <CardGiveNotification
              notification={cardGiveNotification}
              onConfirm={handleCloseCardGiveNotification}
            />
          </div>
        </div>
      )}

      {/* 顏色選擇介面 Modal（被要牌玩家選擇給哪種顏色） */}
      {showColorChoice && colorChoiceData && (
        <div className="modal-overlay">
          <div className="modal-content color-choice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="color-choice-card">
              <h3>選擇要給的顏色</h3>
              <p className="color-choice-message">
                {gameState.players.find(p => p.id === colorChoiceData.askingPlayerId)?.name || '對方'}
                使用「其中一種顏色全部」方式向你要牌
              </p>
              {/* 根據可選顏色數量顯示不同訊息 */}
              {colorChoiceData.availableColors?.length === 0 ? (
                <>
                  <p>你沒有這兩種顏色的牌。</p>
                  <div className="color-choice-buttons">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleColorChoice('none')}
                    >
                      確認（無牌可給）
                    </button>
                  </div>
                </>
              ) : colorChoiceData.availableColors?.length === 1 ? (
                <>
                  <p>請確認給出你有的顏色：</p>
                  <div className="color-choice-buttons">
                    {colorChoiceData.colors.map(color => {
                      const isAvailable = colorChoiceData.availableColors?.includes(color);
                      return (
                        <button
                          key={color}
                          className={`btn btn-color color-${color} ${!isAvailable ? 'disabled' : ''}`}
                          onClick={() => isAvailable && handleColorChoice(color)}
                          disabled={!isAvailable}
                        >
                          {color === 'red' ? '紅色' :
                           color === 'yellow' ? '黃色' :
                           color === 'green' ? '綠色' :
                           color === 'blue' ? '藍色' : color}
                          {!isAvailable && ' (無)'}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <p>請選擇要給哪種顏色的全部牌：</p>
                  <div className="color-choice-buttons">
                    {colorChoiceData.colors.map(color => (
                      <button
                        key={color}
                        className={`btn btn-color color-${color}`}
                        onClick={() => handleColorChoice(color)}
                      >
                        {color === 'red' ? '紅色' :
                         color === 'yellow' ? '黃色' :
                         color === 'green' ? '綠色' :
                         color === 'blue' ? '藍色' : color}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 等待顏色選擇提示 */}
      {waitingForColorChoice && colorChoiceInfo && colorChoiceInfo.targetPlayerId !== myPlayer?.id && !publicTransfer && (
        <div className="waiting-overlay">
          <div className="waiting-message">
            <p>等待 {gameState.players.find(p => p.id === colorChoiceInfo.targetPlayerId)?.name || '對方'} 選擇要給哪種顏色...</p>
          </div>
        </div>
      )}

      {/* 禁用牌警告（工單 0075） */}
      {disabledCardWarning && (
        <div className="warning-message" role="alert">
          {disabledCardWarning}
          <button onClick={() => setDisabledCardWarning(null)} className="close-warning">×</button>
        </div>
      )}

      {/* 工單 0150：遊戲不存在全螢幕提示 */}
      {gameNotExist && (
        <div className="game-not-exist-overlay">
          <div className="game-not-exist-card">
            <span className="material-symbols-outlined game-not-exist-icon">cloud_off</span>
            <h2 className="game-not-exist-title">遊戲連線中斷</h2>
            <p className="game-not-exist-desc">遊戲房間已不存在，可能是伺服器重啟或連線逾時。</p>
            <p className="game-not-exist-countdown">{redirectCountdown} 秒後自動返回大廳...</p>
            <button
              className="game-not-exist-btn"
              onClick={() => {
                dispatch(resetGame());
                navigate('/');
              }}
            >
              <span className="material-symbols-outlined">home</span>
              立即返回
            </button>
          </div>
        </div>
      )}

      {/* 錯誤訊息（排除「遊戲不存在」，因為有專屬 UI） */}
      {error && error !== '遊戲不存在' && (
        <div className="error-message" role="alert">
          {error}
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}

      {/* 工單 0112: 版本資訊 */}
      <VersionInfo />
    </div>
  );
}

export default GameRoom;
