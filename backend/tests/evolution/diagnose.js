/**
 * 演化論遊戲 - 診斷測試腳本
 *
 * 此腳本用於診斷核心模組的問題
 * 執行方式：node backend/tests/evolution/diagnose.js
 *
 * @工單編號 0296
 */

// 輸出格式化
function log(title, data) {
  console.log('\n' + '='.repeat(50));
  console.log(`【${title}】`);
  console.log('='.repeat(50));
  if (typeof data === 'object') {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(data);
  }
}

function pass(msg) {
  console.log(`✅ PASS: ${msg}`);
}

function fail(msg, error) {
  console.log(`❌ FAIL: ${msg}`);
  if (error) console.log(`   錯誤: ${error}`);
}

// ==================== 開始診斷 ====================

console.log('\n🔍 演化論遊戲核心模組診斷\n');
console.log('執行時間:', new Date().toISOString());

let totalTests = 0;
let passedTests = 0;

// ==================== 測試 1: 常數載入 ====================

log('測試 1: 常數載入', '檢查 shared/constants/evolution.js');

try {
  const constants = require('../../../shared/constants/evolution');
  totalTests++;

  // 檢查 GAME_PHASES
  if (constants.GAME_PHASES && constants.GAME_PHASES.WAITING) {
    pass('GAME_PHASES 正確載入');
    passedTests++;
    console.log('   GAME_PHASES:', Object.keys(constants.GAME_PHASES));
  } else {
    fail('GAME_PHASES 未正確載入');
  }

  totalTests++;
  // 檢查 TRAIT_TYPES
  if (constants.TRAIT_TYPES && constants.TRAIT_TYPES.CARNIVORE) {
    pass('TRAIT_TYPES 正確載入');
    passedTests++;
    console.log('   性狀數量:', Object.keys(constants.TRAIT_TYPES).length);
  } else {
    fail('TRAIT_TYPES 未正確載入');
  }

  totalTests++;
  // 檢查 TRAIT_DEFINITIONS
  if (constants.TRAIT_DEFINITIONS && constants.TRAIT_DEFINITIONS.carnivore) {
    pass('TRAIT_DEFINITIONS 正確載入');
    passedTests++;
    console.log('   肉食定義:', constants.TRAIT_DEFINITIONS.carnivore);
  } else {
    fail('TRAIT_DEFINITIONS 未正確載入');
  }

  totalTests++;
  // 檢查 getTraitInfo
  if (typeof constants.getTraitInfo === 'function') {
    const info = constants.getTraitInfo('carnivore');
    if (info && info.name === '肉食') {
      pass('getTraitInfo 正常運作');
      passedTests++;
      console.log('   返回結果:', info);
      console.log('   foodBonus:', info.foodBonus);
    } else {
      fail('getTraitInfo 返回異常', JSON.stringify(info));
    }
  } else {
    fail('getTraitInfo 不是函數');
  }

} catch (error) {
  fail('常數載入失敗', error.message);
  console.log('   完整錯誤:', error.stack);
}

// ==================== 測試 2: cardLogic ====================

log('測試 2: cardLogic', '檢查卡牌邏輯');

try {
  const cardLogic = require('../../logic/evolution/cardLogic');

  totalTests++;
  // 測試 createDeck
  const deck = cardLogic.createDeck();
  if (deck && deck.length === 84) {
    pass('createDeck 正確生成 84 張牌');
    passedTests++;
  } else {
    fail('createDeck 牌數異常', `實際數量: ${deck?.length}`);
  }

  totalTests++;
  // 測試 getTraitInfo
  const traitInfo = cardLogic.getTraitInfo('carnivore');
  if (traitInfo && traitInfo.foodBonus !== undefined) {
    pass('getTraitInfo 返回包含 foodBonus');
    passedTests++;
    console.log('   foodBonus:', traitInfo.foodBonus);
  } else {
    fail('getTraitInfo 缺少 foodBonus', JSON.stringify(traitInfo));
  }

  totalTests++;
  // 測試 validateTraitPlacement - 一般情況
  const mockCreature = {
    id: 'c1',
    ownerId: 'player1',
    traits: []
  };
  const result1 = cardLogic.validateTraitPlacement(mockCreature, 'carnivore', 'player1');
  if (result1 && result1.valid === true) {
    pass('validateTraitPlacement 一般性狀驗證正確');
    passedTests++;
  } else {
    fail('validateTraitPlacement 一般性狀驗證失敗', result1?.reason);
  }

  totalTests++;
  // 測試 validateTraitPlacement - 寄生蟲
  const mockOpponentCreature = {
    id: 'c2',
    ownerId: 'player2',
    traits: []
  };
  const result2 = cardLogic.validateTraitPlacement(mockOpponentCreature, 'parasite', 'player1');
  if (result2 && result2.valid === true) {
    pass('validateTraitPlacement 寄生蟲驗證正確（可放對手）');
    passedTests++;
  } else {
    fail('validateTraitPlacement 寄生蟲驗證失敗', result2?.reason);
  }

  totalTests++;
  // 測試 validateTraitPlacement - 互動性狀
  const mockCreature2 = {
    id: 'c3',
    ownerId: 'player1',
    traits: [],
    interactionLinks: []
  };
  const result3 = cardLogic.validateTraitPlacement(mockCreature, 'communication', 'player1', mockCreature2);
  if (result3 && result3.valid === true) {
    pass('validateTraitPlacement 互動性狀驗證正確');
    passedTests++;
  } else {
    fail('validateTraitPlacement 互動性狀驗證失敗', result3?.reason);
  }

} catch (error) {
  fail('cardLogic 載入或執行失敗', error.message);
  console.log('   完整錯誤:', error.stack);
}

// ==================== 測試 3: creatureLogic ====================

log('測試 3: creatureLogic', '檢查生物邏輯');

try {
  const creatureLogic = require('../../logic/evolution/creatureLogic');

  totalTests++;
  // 測試 createCreature
  const creature = creatureLogic.createCreature('player1', 'card_001');
  if (creature && creature.id && creature.traits && Array.isArray(creature.traits)) {
    pass('createCreature 正確創建生物');
    passedTests++;
    console.log('   生物 ID:', creature.id);
    console.log('   初始食量:', creature.foodNeeded);
  } else {
    fail('createCreature 創建失敗', JSON.stringify(creature));
  }

  totalTests++;
  // 測試 addTrait
  const addResult = creatureLogic.addTrait(creature, 'carnivore', 'card_002', 'player1');
  console.log('   addTrait 結果:', JSON.stringify(addResult, null, 2));

  if (addResult && addResult.success === true) {
    pass('addTrait 返回成功');
    passedTests++;

    totalTests++;
    if (addResult.creature.traits.length > 0) {
      pass('addTrait 實際添加了性狀');
      passedTests++;
      console.log('   性狀數量:', addResult.creature.traits.length);
      console.log('   性狀:', addResult.creature.traits[0]);
      console.log('   新食量:', addResult.creature.foodNeeded);
    } else {
      fail('addTrait 返回成功但性狀未添加', `traits.length = ${addResult.creature.traits.length}`);
    }
  } else {
    fail('addTrait 返回失敗', addResult?.reason);
  }

} catch (error) {
  fail('creatureLogic 載入或執行失敗', error.message);
  console.log('   完整錯誤:', error.stack);
}

// ==================== 測試 4: gameLogic ====================

log('測試 4: gameLogic', '檢查遊戲邏輯');

try {
  const gameLogic = require('../../logic/evolution/gameLogic');

  totalTests++;
  // 測試 initGame
  const players = [
    { id: 'player1', name: '玩家1' },
    { id: 'player2', name: '玩家2' }
  ];

  const initResult = gameLogic.initGame(players);
  console.log('   initGame 結果:');
  console.log('   - success:', initResult.success);
  console.log('   - error:', initResult.error);

  if (initResult && initResult.success === true) {
    pass('initGame 返回成功');
    passedTests++;

    const gs = initResult.gameState;
    console.log('   gameState 檢查:');
    console.log('   - phase:', gs.phase);
    console.log('   - round:', gs.round);
    console.log('   - deck length:', gs.deck?.length);
    console.log('   - players:', Object.keys(gs.players || {}));

    totalTests++;
    if (gs.phase !== undefined) {
      pass('phase 已定義');
      passedTests++;
    } else {
      fail('phase 為 undefined');
    }

    totalTests++;
    if (gs.deck && gs.deck.length > 0) {
      pass('deck 正確初始化');
      passedTests++;
    } else {
      fail('deck 初始化異常', `length: ${gs.deck?.length}`);
    }

    totalTests++;
    if (gs.players && Object.keys(gs.players).length === 2) {
      pass('players 正確初始化');
      passedTests++;

      // 檢查手牌
      const p1 = gs.players['player1'];
      console.log('   - player1 手牌數:', p1?.hand?.length);
    } else {
      fail('players 初始化異常');
    }

  } else {
    fail('initGame 返回失敗', initResult?.error);
  }

  totalTests++;
  // 測試 getGameState
  if (initResult.success) {
    try {
      const viewState = gameLogic.getGameState(initResult.gameState, 'player1');
      pass('getGameState 執行成功');
      passedTests++;
    } catch (e) {
      fail('getGameState 拋出錯誤', e.message);
    }
  }

} catch (error) {
  fail('gameLogic 載入或執行失敗', error.message);
  console.log('   完整錯誤:', error.stack);
}

// ==================== 測試 5: evolutionRoomManager ====================

log('測試 5: evolutionRoomManager', '檢查房間管理器');

try {
  const roomManager = require('../../services/evolutionRoomManager');

  // 清除之前的測試狀態
  roomManager.rooms.clear();
  roomManager.playerRooms.clear();

  totalTests++;
  // 測試創建房間
  const hostPlayer = { id: 'p1', name: '房主', firebaseUid: 'uid1' };
  const room = roomManager.createRoom('測試房間', 4, 'socket1', hostPlayer);
  if (room && room.id) {
    pass('createRoom 正確創建房間');
    passedTests++;
    console.log('   房間 ID:', room.id);
  } else {
    fail('createRoom 創建失敗');
  }

  totalTests++;
  // 測試加入房間
  const player2 = { id: 'p2', name: '玩家2', firebaseUid: 'uid2' };
  const joinResult = roomManager.joinRoom(room.id, 'socket2', player2);
  if (joinResult.success) {
    pass('joinRoom 加入成功');
    passedTests++;
    console.log('   玩家數:', joinResult.room.players.length);
  } else {
    fail('joinRoom 加入失敗', joinResult.error);
  }

  totalTests++;
  // 測試開始遊戲
  const startResult = roomManager.startGame(room.id, 'p1');
  console.log('   startGame 結果:');
  console.log('   - success:', startResult.success);
  console.log('   - error:', startResult.error);

  if (startResult.success) {
    pass('startGame 遊戲開始成功');
    passedTests++;

    totalTests++;
    const updatedRoom = roomManager.getRoom(room.id);
    if (updatedRoom.gameState && updatedRoom.gameState.phase) {
      pass('gameState 已正確初始化');
      passedTests++;
      console.log('   - phase:', updatedRoom.gameState.phase);
      console.log('   - round:', updatedRoom.gameState.round);
      console.log('   - players:', Object.keys(updatedRoom.gameState.players));
    } else {
      fail('gameState 初始化異常');
    }
  } else {
    fail('startGame 遊戲開始失敗', startResult.error);
  }

  // 清理
  roomManager.rooms.clear();
  roomManager.playerRooms.clear();

} catch (error) {
  fail('evolutionRoomManager 載入或執行失敗', error.message);
  console.log('   完整錯誤:', error.stack);
}

// ==================== 診斷結果 ====================

log('診斷結果', `通過 ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);

if (passedTests === totalTests) {
  console.log('\n🎉 所有測試通過！核心模組運作正常。\n');
} else {
  console.log('\n⚠️  發現問題，請檢查失敗的測試項目。\n');

  console.log('建議修復方向:');
  if (passedTests < totalTests * 0.5) {
    console.log('- 檢查模組引用路徑是否正確');
    console.log('- 確認 Node.js 版本相容性');
  }
  console.log('- 檢查失敗測試的具體錯誤訊息');
  console.log('- 參考 BUG_FIX_PLAN_EVOLUTION_CORE.md 進行修復');
}
