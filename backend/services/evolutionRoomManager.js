/**
 * 演化論遊戲房間管理器
 *
 * @module services/evolutionRoomManager
 * @description 管理演化論遊戲房間的創建、加入、遊戲邏輯處理
 * 工單 0261
 */

const evolutionGameLogic = require('../logic/evolution/gameLogic');
const { GAME_PHASES } = require('../../shared/constants/evolution');

class EvolutionRoomManager {
  constructor() {
    this.rooms = new Map();
    this.playerRooms = new Map(); // playerId -> roomId 對應
  }

  /**
   * 工單 0285：輔助函數 - 在玩家列表中查找玩家
   * 支援使用 id 或 firebaseUid 查找
   * @param {Array} players - 玩家列表
   * @param {string} identifier - 玩家 ID 或 Firebase UID
   * @returns {object|undefined} 找到的玩家
   */
  findPlayer(players, identifier) {
    return players.find(p => p.id === identifier || p.firebaseUid === identifier);
  }

  /**
   * 工單 0285：輔助函數 - 在玩家列表中查找玩家索引
   * 支援使用 id 或 firebaseUid 查找
   * @param {Array} players - 玩家列表
   * @param {string} identifier - 玩家 ID 或 Firebase UID
   * @returns {number} 玩家索引，找不到返回 -1
   */
  findPlayerIndex(players, identifier) {
    return players.findIndex(p => p.id === identifier || p.firebaseUid === identifier);
  }

  /**
   * 生成房間 ID
   */
  generateRoomId() {
    return `evo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * 創建新房間
   * @param {string} roomName - 房間名稱
   * @param {number} maxPlayers - 最大玩家數（2-4）
   * @param {string} hostId - 房主 Socket ID
   * @param {object} hostPlayer - 房主玩家資訊
   * @returns {object} 房間資訊
   */
  createRoom(roomName, maxPlayers, hostId, hostPlayer) {
    const roomId = this.generateRoomId();

    const room = {
      id: roomId,
      name: roomName || `${hostPlayer.name}的房間`,
      maxPlayers: Math.min(Math.max(maxPlayers || 4, 2), 4),
      hostId: hostId,
      hostPlayerId: hostPlayer.id,
      gameType: 'evolution',
      phase: 'waiting',
      players: [{
        ...hostPlayer,
        socketId: hostId,
        isHost: true,
        isReady: false
      }],
      gameState: null,
      createdAt: Date.now()
    };

    this.rooms.set(roomId, room);
    this.playerRooms.set(hostPlayer.id, roomId);

    console.log(`[演化論] 創建房間: ${roomId}, 房主: ${hostPlayer.name}`);
    return room;
  }

  /**
   * 加入房間
   * @param {string} roomId - 房間 ID
   * @param {string} socketId - Socket ID
   * @param {object} player - 玩家資訊
   * @returns {object} 結果
   */
  joinRoom(roomId, socketId, player) {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { success: false, error: '房間不存在' };
    }

    if (room.phase !== 'waiting') {
      return { success: false, error: '遊戲已開始' };
    }

    if (room.players.length >= room.maxPlayers) {
      return { success: false, error: '房間已滿' };
    }

    // 工單 0285：檢查是否已在房間中（可能是重連）
    // 支援使用 id 或 firebaseUid 查找
    const existingIndex = this.findPlayerIndex(room.players, player.id) !== -1
      ? this.findPlayerIndex(room.players, player.id)
      : this.findPlayerIndex(room.players, player.firebaseUid);
    if (existingIndex !== -1) {
      // 更新 socketId
      room.players[existingIndex].socketId = socketId;
      return {
        success: true,
        player: room.players[existingIndex],
        room,
        isReconnect: true
      };
    }

    const newPlayer = {
      ...player,
      socketId,
      isHost: false,
      isReady: false
    };

    room.players.push(newPlayer);
    this.playerRooms.set(player.id, roomId);

    console.log(`[演化論] 玩家加入: ${player.name} -> ${roomId}`);
    return { success: true, player: newPlayer, room };
  }

  /**
   * 離開房間
   * @param {string} roomId - 房間 ID
   * @param {string} playerId - 玩家 ID
   * @returns {object} 結果
   */
  leaveRoom(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false };

    // 工單 0285：支援使用 id 或 firebaseUid 查找
    const playerIndex = this.findPlayerIndex(room.players, playerId);
    if (playerIndex === -1) return { success: false };

    const player = room.players[playerIndex];
    room.players.splice(playerIndex, 1);
    this.playerRooms.delete(playerId);

    // 房間空了，刪除房間
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      console.log(`[演化論] 房間已刪除: ${roomId}`);
      return { success: true, roomDeleted: true };
    }

    // 房主離開，轉移房主
    if (player.isHost && room.players.length > 0) {
      room.players[0].isHost = true;
      room.hostId = room.players[0].socketId;
      room.hostPlayerId = room.players[0].id;
    }

    console.log(`[演化論] 玩家離開: ${player.name} <- ${roomId}`);
    return { success: true, room };
  }

  /**
   * 設定玩家準備狀態
   */
  setReady(roomId, playerId, isReady) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false };

    // 工單 0285：支援使用 id 或 firebaseUid 查找
    const player = this.findPlayer(room.players, playerId);
    if (!player) return { success: false };

    player.isReady = isReady;
    return { success: true, room };
  }

  /**
   * 開始遊戲
   * @param {string} roomId - 房間 ID
   * @param {string} hostPlayerId - 發起者玩家 ID
   * @returns {object} 結果
   */
  startGame(roomId, hostPlayerId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: '房間不存在' };
    }

    // 工單 0285：驗證是否為房主（支援 id 或 firebaseUid）
    const hostPlayer = this.findPlayer(room.players, hostPlayerId);
    if (!hostPlayer || !hostPlayer.isHost) {
      return { success: false, error: '只有房主可以開始遊戲' };
    }

    // 檢查玩家數量
    if (room.players.length < 2) {
      return { success: false, error: '至少需要 2 位玩家' };
    }

    // 工單 0298：初始化遊戲狀態
    // gameLogic.initGame 期望參數格式為 [{ id, name }]
    const gamePlayers = room.players.map(p => ({
      id: p.id,
      name: p.name
    }));

    const initResult = evolutionGameLogic.initGame(gamePlayers);

    if (!initResult.success) {
      return { success: false, error: initResult.error || '遊戲初始化失敗' };
    }

    room.gameState = initResult.gameState;

    // 開始遊戲（從 waiting 進入 evolution）
    room.gameState = evolutionGameLogic.startGame(room.gameState);
    room.phase = room.gameState.phase;

    console.log(`[演化論] 遊戲開始: ${roomId}, 玩家數: ${room.players.length}`);
    return { success: true, gameState: this.getClientGameState(room) };
  }

  /**
   * 處理遊戲動作
   * @param {string} roomId - 房間 ID
   * @param {string} playerId - 玩家 ID
   * @param {object} action - 動作物件
   * @returns {object} 結果
   */
  processAction(roomId, playerId, action) {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState) {
      return { success: false, error: '遊戲不存在' };
    }

    // 工單 0285：查找玩家的實際 ID（遊戲邏輯使用 player.id）
    const player = this.findPlayer(room.players, playerId);
    const actualPlayerId = player ? player.id : playerId;

    const result = evolutionGameLogic.processAction(room.gameState, actualPlayerId, action);

    if (result.success) {
      // 更新房間階段
      room.phase = room.gameState.phase;

      return {
        success: true,
        data: result.data,
        gameState: this.getClientGameState(room),
        chainEffects: result.chainEffects || null
      };
    }

    return { success: false, error: result.error };
  }

  /**
   * 處理攻擊回應
   */
  resolveAttack(roomId, playerId, response) {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState) {
      return { success: false, error: '遊戲不存在' };
    }

    // 假設 gameLogic 有 resolveAttack 方法
    const result = evolutionGameLogic.processAction(room.gameState, playerId, {
      type: 'defenseResponse',
      response
    });

    return {
      ...result,
      gameState: this.getClientGameState(room)
    };
  }

  /**
   * 取得房間列表
   * @returns {Array} 可加入的房間列表
   */
  getRoomList() {
    const rooms = [];
    this.rooms.forEach((room, roomId) => {
      if (room.phase === 'waiting') {
        rooms.push({
          id: roomId,
          name: room.name,
          playerCount: room.players.length,
          maxPlayers: room.maxPlayers,
          gameType: 'evolution',
          hostName: room.players.find(p => p.isHost)?.name || '未知'
        });
      }
    });
    return rooms;
  }

  /**
   * 取得房間資訊
   */
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  /**
   * 根據玩家 ID 取得房間
   */
  getRoomByPlayerId(playerId) {
    const roomId = this.playerRooms.get(playerId);
    return roomId ? this.rooms.get(roomId) : null;
  }

  /**
   * 處理玩家斷線
   */
  handleDisconnect(socketId) {
    // 找出該 socket 對應的房間和玩家
    for (const [roomId, room] of this.rooms.entries()) {
      const player = room.players.find(p => p.socketId === socketId);
      if (player) {
        console.log(`[演化論] 玩家斷線: ${player.name} in ${roomId}`);

        if (room.phase === 'waiting') {
          // 等待中直接移除
          return this.leaveRoom(roomId, player.id);
        } else {
          // 遊戲中標記斷線
          player.isDisconnected = true;
          player.disconnectedAt = Date.now();
          return { success: true, room, player, isInGame: true };
        }
      }
    }
    return { success: false };
  }

  /**
   * 取得客戶端遊戲狀態（隱藏敏感資訊）
   */
  getClientGameState(room) {
    if (!room.gameState) return null;

    const state = room.gameState;

    return {
      phase: state.phase,
      round: state.round,
      currentTurn: state.currentTurn,
      turnOrder: state.turnOrder,
      foodPool: state.foodPool,
      deckCount: state.deck?.length || 0,
      discardCount: state.discard?.length || 0,
      diceResult: state.diceResult,
      players: Object.fromEntries(
        Object.entries(state.players).map(([id, player]) => [
          id,
          {
            id: player.id,
            name: player.name,
            creatures: player.creatures,
            hand: player.hand.length, // 只顯示數量
            hasPassed: player.hasPassed,
            score: player.score
          }
        ])
      ),
      pendingAttack: state.pendingAttack,
      scores: state.scores,
      gameResult: state.gameResult
    };
  }

  /**
   * 取得特定玩家的完整遊戲狀態（包含手牌）
   */
  getPlayerGameState(room, playerId) {
    if (!room.gameState) return null;

    const clientState = this.getClientGameState(room);
    const playerData = room.gameState.players[playerId];

    if (playerData) {
      clientState.players[playerId] = {
        ...clientState.players[playerId],
        hand: playerData.hand // 完整手牌資訊
      };
    }

    return clientState;
  }
}

// 匯出單例
const evolutionRoomManager = new EvolutionRoomManager();
module.exports = evolutionRoomManager;
