/**
 * 遊戲房間組件
 *
 * @module GameRoom
 * @description 遊戲進行時的主要介面，整合 GameBoard、PlayerHand、QuestionCard、GuessCard、GameStatus 等子組件
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  updateGameState,
  resetGame
} from '../../store/gameStore';
import useAIPlayers from '../../hooks/useAIPlayers';
import LocalGameController from '../../controllers/LocalGameController';
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
  startGame as socketStartGame,
  sendGameAction,
  requestRevealHiddenCards,
  leaveRoom,
  submitColorChoice,
  submitFollowGuessResponse,
  startNextRound,
  endTurn
} from '../../services/socketService';
import {
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  GAME_PHASE_FINISHED,
  GAME_PHASE_FOLLOW_GUESSING,
  GAME_PHASE_ROUND_END,
  GAME_PHASE_POST_QUESTION
} from '../../shared/constants';
import GameBoard from '../GameBoard/GameBoard';
import PlayerHand from '../PlayerHand/PlayerHand';
import QuestionCard from '../QuestionCard/QuestionCard';
import GuessCard from '../GuessCard/GuessCard';
import { GameStatusContainer } from '../GameStatus/GameStatus';
import Prediction from '../Prediction/Prediction';
import { PredictionResult } from '../Prediction';
import CardGiveNotification from '../CardGiveNotification/CardGiveNotification';
import QuestionFlow from '../QuestionFlow/QuestionFlow';
import { clearCurrentRoom } from '../../utils/localStorage';
import './GameRoom.css';

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
  const aiConfig = location.state?.aiConfig || null;
  const isLocalMode = aiConfig !== null;

  // 從 Redux store 取得遊戲狀態
  const gameState = useSelector((state) => ({
    storeGameId: state.gameId,
    players: state.players,
    currentPlayerIndex: state.currentPlayerIndex,
    gamePhase: state.gamePhase,
    winner: state.winner,
    hiddenCards: state.hiddenCards,
    gameHistory: state.gameHistory,
    currentPlayerId: state.currentPlayerId,
    maxPlayers: state.maxPlayers
  }));

  // 本地遊戲控制器（單人模式專用）
  const localControllerRef = useRef(null);

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
    onAIAction: useCallback((action, aiInstance) => {
      if (localControllerRef.current) {
        localControllerRef.current.handleAction(action);
      }
    }, [])
  });

  // 本地狀態
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

    // 創建人類玩家
    const humanPlayer = {
      id: 'human-1',
      name: location.state?.playerName || '玩家1',
      isAI: false,
      isHost: true
    };

    // 創建 AI 玩家實例（使用 aiPlayers 中的實例）
    const allPlayers = [humanPlayer, ...aiPlayers];

    // 創建本地控制器
    const controller = new LocalGameController({
      players: allPlayers,
      onStateChange: (newState) => {
        console.log('[GameRoom] 本地狀態變更:', newState.gamePhase);
        dispatch(updateGameState({
          ...newState,
          currentPlayerId: humanPlayer.id
        }));
      },
      onEvent: (event) => {
        console.log('[GameRoom] 本地事件:', event.type);

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
          setShowFollowGuessPanel(false);
          setGuessResultData({
            isCorrect: event.isCorrect,
            scoreChanges: event.scoreChanges,
            hiddenCards: event.hiddenCards,
            guessingPlayerId: event.guessingPlayerId,
            followingPlayers: event.followingPlayers,
            predictionResults: event.predictionResults || []
          });
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

    // 延遲執行 AI 決策（避免立即執行）
    const timerId = setTimeout(() => {
      console.log('[GameRoom] 觸發 AI 回合:', currentPlayer.name);
      handleAITurn(currentPlayer);
    }, 500);

    return () => clearTimeout(timerId);
  }, [isLocalMode, gameState.currentPlayerIndex, gameState.gamePhase, getCurrentPlayer, isAIPlayer, handleAITurn]);

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
    });

    // 監聽錯誤
    const unsubError = onError(({ message }) => {
      setError(message);
      setIsLoading(false);
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
    const unsubWaiting = onWaitingForColorChoice(({ targetPlayerId, askingPlayerId }) => {
      setWaitingForColorChoice(true);
      setColorChoiceInfo({ targetPlayerId, askingPlayerId });
    });

    // 監聽顏色選擇結果
    const unsubColorResult = onColorChoiceResult(({ targetPlayerId, chosenColor, cardsTransferred }) => {
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
    const unsubGuessResult = onGuessResult(({ isCorrect, scoreChanges, hiddenCards, guessingPlayerId, followingPlayers, predictionResults }) => {
      setShowFollowGuessPanel(false);
      setGuessResultData({ isCorrect, scoreChanges, hiddenCards, guessingPlayerId, followingPlayers, predictionResults });
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
      setCardGiveNotification(notification);
    });

    return () => {
      unsubGameState();
      unsubError();
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
    };
  }, [dispatch, isLocalMode]);

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
    dispatch(resetGame());
    navigate('/');
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
      // 多人模式：請求查看蓋牌
      const myPlayer = getMyPlayer();
      if (myPlayer && gameId) {
        requestRevealHiddenCards(gameId, myPlayer.id);
      }
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

  const myPlayer = getMyPlayer();
  const currentPlayer = getCurrentPlayer();
  const canAct = isMyTurn() && gameState.gamePhase === GAME_PHASE_PLAYING && myPlayer?.isActive !== false;
  const onlyGuess = mustGuess();

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
            {gameState.players.map((player, index) => (
              <li
                key={player.id}
                className={`player-item ${index === gameState.currentPlayerIndex ? 'current-turn' : ''} ${player.isActive === false ? 'eliminated' : ''}`}
              >
                <span className="player-name">
                  {player.name}
                  {player.isHost && ' (房主)'}
                  {player.id === myPlayer?.id && ' (我)'}
                </span>
                <span className="player-score">{player.score || 0} 分</span>
                <span className="player-cards">
                  {player.hand ? `${player.hand.length} 張牌` : ''}
                </span>
                {index === gameState.currentPlayerIndex && player.isActive !== false && (
                  <span className="turn-indicator">輪到此玩家</span>
                )}
                {player.isActive === false && (
                  <span className="eliminated-badge">已退出</span>
                )}
              </li>
            ))}
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
              <p className="eliminated-message">你已退出遊戲，等待結果...</p>
            )}
          </div>
        )}
      </footer>

      {/* 舊版問牌介面 Modal（保留作為備用） */}
      {showQuestionCard && (
        <div className="modal-overlay" onClick={handleCloseQuestion}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <QuestionCard
              players={gameState.players.filter(p => p.isActive !== false)}
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
          players={gameState.players.filter(p => p.isActive !== false)}
          currentPlayerId={myPlayer?.id}
          currentPlayerHand={myPlayer?.hand || []}
          onSubmit={handleQuestionFlowSubmit}
          onCancel={handleQuestionFlowCancel}
          isLoading={isLoading}
        />
      )}

      {/* 猜牌介面 Modal */}
      {showGuessCard && (
        <div className="modal-overlay" onClick={handleCloseGuess}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </div>
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
      {gameState.gamePhase === GAME_PHASE_POST_QUESTION && !isMyTurn() && !cardGiveNotification && (
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
      {waitingForColorChoice && colorChoiceInfo && (
        <div className="waiting-overlay">
          <div className="waiting-message">
            <p>等待 {gameState.players.find(p => p.id === colorChoiceInfo.targetPlayerId)?.name || '對方'} 選擇要給哪種顏色...</p>
          </div>
        </div>
      )}

      {/* 跟猜面板 Modal */}
      {showFollowGuessPanel && followGuessData && (
        <div className="modal-overlay">
          <div className="modal-content follow-guess-modal" onClick={(e) => e.stopPropagation()}>
            <div className="follow-guess-card">
              <h3>跟猜階段</h3>
              <p className="guess-info">
                <strong>{gameState.players.find(p => p.id === followGuessData.guessingPlayerId)?.name || '玩家'}</strong>
                {' '}猜測蓋牌是：
                <span className="guessed-colors">
                  {followGuessData.guessedColors.map(color => (
                    <span key={color} className={`color-badge color-${color}`}>
                      {color === 'red' ? '紅' :
                       color === 'yellow' ? '黃' :
                       color === 'green' ? '綠' :
                       color === 'blue' ? '藍' : color}
                    </span>
                  ))}
                </span>
              </p>

              {/* 決定順序顯示 */}
              <div className="follow-guess-order">
                <h4>決定順序</h4>
                <ul className="decision-order-list">
                  {/* 猜牌者 */}
                  <li className="decision-item guesser">
                    <span className="player-label">
                      {gameState.players.find(p => p.id === followGuessData.guessingPlayerId)?.name || '玩家'}
                    </span>
                    <span className="decision-badge guesser-badge">猜牌者</span>
                  </li>
                  {/* 其他玩家按順序 */}
                  {followGuessData.decisionOrder?.map((playerId, index) => {
                    const player = gameState.players.find(p => p.id === playerId);
                    const decision = followGuessData.decisions?.[playerId];
                    const isCurrentDecider = followGuessData.currentDeciderId === playerId;
                    return (
                      <li key={playerId} className={`decision-item ${isCurrentDecider ? 'current-decider' : ''}`}>
                        <span className="order-number">{index + 1}.</span>
                        <span className="player-label">{player?.name || playerId}</span>
                        {isCurrentDecider && !decision && (
                          <span className="decision-badge deciding">決定中...</span>
                        )}
                        {decision === 'follow' && (
                          <span className="decision-badge followed">跟猜</span>
                        )}
                        {decision === 'pass' && (
                          <span className="decision-badge declined">不跟</span>
                        )}
                        {!isCurrentDecider && !decision && (
                          <span className="decision-badge waiting">等待中</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* 自己需要決定時顯示按鈕（只有輪到自己時才能點） */}
              {followGuessData.currentDeciderId === myPlayer?.id && (
                <div className="follow-guess-buttons">
                  <p className="decision-prompt">輪到你決定！跟對 +1 分，跟錯 -1 分並退出當局</p>
                  <button
                    className="btn btn-success"
                    onClick={() => handleFollowGuess(true)}
                  >
                    跟猜
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleFollowGuess(false)}
                  >
                    不跟
                  </button>
                </div>
              )}

              {/* 自己是猜牌者 */}
              {followGuessData.guessingPlayerId === myPlayer?.id && (
                <p className="waiting-others">等待其他玩家按順序決定是否跟猜...</p>
              )}

              {/* 自己已決定 */}
              {followGuessData.decisions?.[myPlayer?.id] &&
               followGuessData.guessingPlayerId !== myPlayer?.id && (
                <p className="already-decided">
                  你選擇了「{followGuessData.decisions[myPlayer?.id] === 'follow' ? '跟猜' : '不跟'}」，等待其他玩家...
                </p>
              )}

              {/* 還沒輪到自己 */}
              {!followGuessData.decisions?.[myPlayer?.id] &&
               followGuessData.currentDeciderId !== myPlayer?.id &&
               followGuessData.guessingPlayerId !== myPlayer?.id &&
               followGuessData.decisionOrder?.includes(myPlayer?.id) && (
                <p className="waiting-turn">還沒輪到你，請等待...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 局結束 / 猜牌結果面板 */}
      {showRoundEnd && guessResultData && (
        <div className="modal-overlay">
          <div className="modal-content round-end-modal" onClick={(e) => e.stopPropagation()}>
            <div className="round-end-card">
              <h3>{guessResultData.isCorrect ? '猜對了！' : '猜錯了！'}</h3>

              {/* 顯示蓋牌 */}
              <div className="hidden-cards-reveal">
                <p>蓋牌是：</p>
                <div className="hidden-cards">
                  {guessResultData.hiddenCards.map((card, index) => (
                    <span key={index} className={`card-badge color-${card.color}`}>
                      {card.color === 'red' ? '紅' :
                       card.color === 'yellow' ? '黃' :
                       card.color === 'green' ? '綠' :
                       card.color === 'blue' ? '藍' : card.color}
                    </span>
                  ))}
                </div>
              </div>

              {/* 分數變化 */}
              <div className="score-changes">
                <h4>分數變化</h4>
                <ul className="score-list">
                  {Object.entries(guessResultData.scoreChanges).map(([playerId, change]) => {
                    const player = gameState.players.find(p => p.id === playerId);
                    return (
                      <li key={playerId} className={change > 0 ? 'score-up' : change < 0 ? 'score-down' : ''}>
                        {player?.name || playerId}：
                        <span className="score-change">
                          {change > 0 ? `+${change}` : change}
                        </span>
                        {playerId === guessResultData.guessingPlayerId && ' (猜牌者)'}
                        {guessResultData.followingPlayers.includes(playerId) && ' (跟猜)'}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* 預測結算（工單 0071） */}
              {guessResultData.predictionResults && guessResultData.predictionResults.length > 0 && (
                <PredictionResult
                  predictionResults={guessResultData.predictionResults}
                  players={gameState.players}
                  hiddenCards={guessResultData.hiddenCards}
                />
              )}

              {/* 目前分數 */}
              <div className="current-scores">
                <h4>目前分數</h4>
                <ul className="score-list">
                  {gameState.players.map(player => (
                    <li key={player.id}>
                      {player.name}：{player.score || 0} 分
                      {(player.score || 0) >= 7 && <span className="winner-badge">勝利！</span>}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 下一局按鈕 */}
              {gameState.gamePhase !== GAME_PHASE_FINISHED && (
                <button
                  className="btn btn-primary"
                  onClick={handleStartNextRound}
                >
                  開始下一局
                </button>
              )}

              {/* 遊戲結束 */}
              {gameState.gamePhase === GAME_PHASE_FINISHED && (
                <div className="game-finished">
                  <p className="winner-announcement">
                    恭喜 {gameState.players.find(p => p.id === gameState.winner)?.name || '獲勝者'} 獲勝！
                  </p>
                  <button
                    className="btn btn-secondary"
                    onClick={handleLeaveRoom}
                  >
                    離開房間
                  </button>
                </div>
              )}
            </div>
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

      {/* 錯誤訊息 */}
      {error && (
        <div className="error-message" role="alert">
          {error}
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}
    </div>
  );
}

export default GameRoom;
