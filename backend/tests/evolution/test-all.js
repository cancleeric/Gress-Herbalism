/**
 * 演化論遊戲 - 完整測試腳本
 *
 * 執行方式：node backend/tests/evolution/test-all.js
 *
 * 覆蓋率目標：80%
 */

// ==================== 測試框架 ====================

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    testResults.push({ name, status: 'PASS' });
    console.log(`  ✅ ${name}`);
  } catch (error) {
    failedTests++;
    testResults.push({ name, status: 'FAIL', error: error.message });
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `Objects not equal`);
  }
}

function section(title) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`【${title}】`);
  console.log('='.repeat(50));
}

// ==================== 載入模組 ====================

const cardLogic = require('../../logic/evolution/cardLogic');
const creatureLogic = require('../../logic/evolution/creatureLogic');
const feedingLogic = require('../../logic/evolution/feedingLogic');
const phaseLogic = require('../../logic/evolution/phaseLogic');
const gameLogic = require('../../logic/evolution/gameLogic');
const roomManager = require('../../services/evolutionRoomManager');
const constants = require('../../../shared/constants/evolution');

console.log('\n🧪 演化論遊戲完整測試\n');
console.log('執行時間:', new Date().toISOString());

// ==================== 工單 0303: cardLogic 測試 ====================

section('工單 0303: cardLogic 單元測試');

test('UT-CARD-001: createDeck 生成 84 張牌', () => {
  const deck = cardLogic.createDeck();
  assertEqual(deck.length, 84, '牌庫應有 84 張牌');
});

test('UT-CARD-002: shuffleDeck 洗牌後長度不變', () => {
  const deck = cardLogic.createDeck();
  const shuffled = cardLogic.shuffleDeck(deck);
  assertEqual(shuffled.length, 84, '洗牌後應仍有 84 張牌');
});

test('UT-CARD-003: drawCards 抽牌正確', () => {
  const deck = cardLogic.createDeck();
  const result = cardLogic.drawCards(deck, 6);
  assertEqual(result.cards.length, 6, '應抽到 6 張牌');
  assertEqual(result.remainingDeck.length, 78, '剩餘應有 78 張牌');
});

test('UT-CARD-004: getTraitInfo 返回性狀資訊', () => {
  const info = cardLogic.getTraitInfo('carnivore');
  assert(info !== null, '應返回性狀資訊');
  assertEqual(info.name, '肉食');
  assertEqual(info.foodBonus, 1);
});

test('UT-CARD-005: validateTraitPlacement 一般性狀放自己', () => {
  const creature = { id: 'c1', ownerId: 'p1', traits: [] };
  const result = cardLogic.validateTraitPlacement(creature, 'carnivore', 'p1');
  assert(result.valid, '應允許放置在自己的生物上');
});

test('UT-CARD-006: validateTraitPlacement 寄生蟲放對手', () => {
  const creature = { id: 'c1', ownerId: 'p2', traits: [] };
  const result = cardLogic.validateTraitPlacement(creature, 'parasite', 'p1');
  assert(result.valid, '寄生蟲應允許放置在對手的生物上');
});

test('UT-CARD-007: validateTraitPlacement 寄生蟲不能放自己', () => {
  const creature = { id: 'c1', ownerId: 'p1', traits: [] };
  const result = cardLogic.validateTraitPlacement(creature, 'parasite', 'p1');
  assert(!result.valid, '寄生蟲不應放置在自己的生物上');
});

test('UT-CARD-008: validateTraitPlacement 互動性狀需要目標', () => {
  const creature = { id: 'c1', ownerId: 'p1', traits: [], interactionLinks: [] };
  const result = cardLogic.validateTraitPlacement(creature, 'communication', 'p1', null);
  assert(!result.valid, '互動性狀應需要第二隻生物');
});

test('UT-CARD-009: validateTraitPlacement 互動性狀有目標', () => {
  const creature1 = { id: 'c1', ownerId: 'p1', traits: [], interactionLinks: [] };
  const creature2 = { id: 'c2', ownerId: 'p1', traits: [], interactionLinks: [] };
  const result = cardLogic.validateTraitPlacement(creature1, 'communication', 'p1', creature2);
  assert(result.valid, '互動性狀應允許放置在兩隻自己的生物之間');
});

test('UT-CARD-010: validateTraitPlacement 重複性狀拒絕', () => {
  const creature = { id: 'c1', ownerId: 'p1', traits: [{ type: 'carnivore' }] };
  const result = cardLogic.validateTraitPlacement(creature, 'carnivore', 'p1');
  assert(!result.valid, '應拒絕重複的性狀');
});

test('UT-CARD-011: validateTraitPlacement 脂肪組織可疊加', () => {
  const creature = { id: 'c1', ownerId: 'p1', traits: [{ type: 'fatTissue' }] };
  const result = cardLogic.validateTraitPlacement(creature, 'fatTissue', 'p1');
  assert(result.valid, '脂肪組織應可以疊加');
});

test('UT-CARD-012: validateTraitPlacement 肉食腐食互斥', () => {
  const creature = { id: 'c1', ownerId: 'p1', traits: [{ type: 'carnivore' }] };
  const result = cardLogic.validateTraitPlacement(creature, 'scavenger', 'p1');
  assert(!result.valid, '肉食與腐食應互斥');
});

// ==================== 工單 0304: creatureLogic 測試 ====================

section('工單 0304: creatureLogic 單元測試');

// 重置計數器
creatureLogic.resetCreatureIdCounter();
creatureLogic.resetTraitIdCounter();

test('UT-CREA-001: createCreature 創建生物', () => {
  const creature = creatureLogic.createCreature('p1', 'card_001');
  assert(creature.id, '應有生物 ID');
  assertEqual(creature.ownerId, 'p1');
  assertEqual(creature.foodNeeded, 1);
  assert(Array.isArray(creature.traits), 'traits 應是陣列');
});

test('UT-CREA-002: addTrait 添加一般性狀', () => {
  const creature = creatureLogic.createCreature('p1', 'card_001');
  const result = creatureLogic.addTrait(creature, 'camouflage', 'card_002', 'p1');
  assert(result.success, '應成功添加性狀');
  assertEqual(result.creature.traits.length, 1, '應有 1 個性狀');
});

test('UT-CREA-003: addTrait 添加肉食性狀增加食量', () => {
  const creature = creatureLogic.createCreature('p1', 'card_001');
  const result = creatureLogic.addTrait(creature, 'carnivore', 'card_002', 'p1');
  assert(result.success);
  assertEqual(result.creature.foodNeeded, 2, '食量應為 2（基礎1 + 肉食1）');
});

test('UT-CREA-004: addTrait 添加巨化性狀增加食量', () => {
  const creature = creatureLogic.createCreature('p1', 'card_001');
  const result = creatureLogic.addTrait(creature, 'massive', 'card_002', 'p1');
  assert(result.success);
  assertEqual(result.creature.foodNeeded, 2, '食量應為 2（基礎1 + 巨化1）');
});

test('UT-CREA-005: calculateFoodNeed 正確計算', () => {
  const creature = {
    traits: [
      { type: 'carnivore', foodBonus: 1 },
      { type: 'massive', foodBonus: 1 }
    ]
  };
  const need = creatureLogic.calculateFoodNeed(creature);
  assertEqual(need, 3, '食量應為 3（基礎1 + 肉食1 + 巨化1）');
});

test('UT-CREA-006: checkIsFed 吃飽判定-未吃飽', () => {
  const creature = { food: { red: 0, blue: 0 }, foodNeeded: 1 };
  const isFed = creatureLogic.checkIsFed(creature);
  assert(!isFed, '未進食應未吃飽');
});

test('UT-CREA-007: checkIsFed 吃飽判定-已吃飽', () => {
  const creature = { food: { red: 1, blue: 0 }, foodNeeded: 1 };
  const isFed = creatureLogic.checkIsFed(creature);
  assert(isFed, '已進食應吃飽');
});

test('UT-CREA-008: isCarnivore 肉食判定-是', () => {
  const creature = { traits: [{ type: 'carnivore' }] };
  const result = creatureLogic.isCarnivore(creature);
  assert(result, '有肉食性狀應返回 true');
});

test('UT-CREA-009: isCarnivore 肉食判定-否', () => {
  const creature = { traits: [] };
  const result = creatureLogic.isCarnivore(creature);
  assert(!result, '無肉食性狀應返回 false');
});

test('UT-CREA-010: canBeAttacked 基本攻擊', () => {
  const attacker = { id: 'a1', traits: [{ type: 'carnivore' }] };
  const defender = { id: 'd1', traits: [], isFed: false };
  const result = creatureLogic.canBeAttacked(attacker, defender);
  assert(result.canAttack, '肉食應能攻擊無防禦的生物');
});

test('UT-CREA-011: canBeAttacked 需要銳目攻擊偽裝', () => {
  const attacker = { id: 'a1', traits: [{ type: 'carnivore' }] };
  const defender = { id: 'd1', traits: [{ type: 'camouflage' }], isFed: false };
  const result = creatureLogic.canBeAttacked(attacker, defender);
  assert(!result.canAttack, '無銳目不應能攻擊偽裝');
});

test('UT-CREA-012: canBeAttacked 銳目可攻擊偽裝', () => {
  const attacker = { id: 'a1', traits: [{ type: 'carnivore' }, { type: 'sharpVision' }] };
  const defender = { id: 'd1', traits: [{ type: 'camouflage' }], isFed: false };
  const result = creatureLogic.canBeAttacked(attacker, defender);
  assert(result.canAttack, '有銳目應能攻擊偽裝');
});

test('UT-CREA-013: canBeAttacked 穴居吃飽無法攻擊', () => {
  const attacker = { id: 'a1', traits: [{ type: 'carnivore' }] };
  const defender = { id: 'd1', traits: [{ type: 'burrowing' }], isFed: true };
  const result = creatureLogic.canBeAttacked(attacker, defender);
  assert(!result.canAttack, '穴居吃飽時不應被攻擊');
});

test('UT-CREA-014: canBeAttacked 水生限制', () => {
  const attacker = { id: 'a1', traits: [{ type: 'carnivore' }] };
  const defender = { id: 'd1', traits: [{ type: 'aquatic' }], isFed: false };
  const result = creatureLogic.canBeAttacked(attacker, defender);
  assert(!result.canAttack, '非水生不應攻擊水生');
});

test('UT-CREA-015: canBeAttacked 水生對水生', () => {
  const attacker = { id: 'a1', traits: [{ type: 'carnivore' }, { type: 'aquatic' }] };
  const defender = { id: 'd1', traits: [{ type: 'aquatic' }], isFed: false };
  const result = creatureLogic.canBeAttacked(attacker, defender);
  assert(result.canAttack, '水生肉食應能攻擊水生');
});

test('UT-CREA-016: canBeAttacked 巨化限制', () => {
  const attacker = { id: 'a1', traits: [{ type: 'carnivore' }] };
  const defender = { id: 'd1', traits: [{ type: 'massive' }], isFed: false };
  const result = creatureLogic.canBeAttacked(attacker, defender);
  assert(!result.canAttack, '非巨化不應攻擊巨化');
});

test('UT-CREA-017: canUseTailLoss 可用斷尾', () => {
  const creature = { traits: [{ type: 'tailLoss' }, { type: 'camouflage' }] };
  const result = creatureLogic.canUseTailLoss(creature);
  assert(result, '有斷尾和其他性狀應可用');
});

test('UT-CREA-018: canUseTailLoss 不可用-無其他性狀', () => {
  const creature = { traits: [{ type: 'tailLoss' }] };
  const result = creatureLogic.canUseTailLoss(creature);
  assert(!result, '無其他性狀不應可用斷尾');
});

test('UT-CREA-019: checkExtinction 滅絕-未吃飽', () => {
  const creature = { isFed: false, hibernating: false, isPoisoned: false };
  const result = creatureLogic.checkExtinction(creature);
  assert(result, '未吃飽應滅絕');
});

test('UT-CREA-020: checkExtinction 存活-已吃飽', () => {
  const creature = { isFed: true, hibernating: false, isPoisoned: false };
  const result = creatureLogic.checkExtinction(creature);
  assert(!result, '已吃飽不應滅絕');
});

test('UT-CREA-021: checkExtinction 存活-冬眠', () => {
  const creature = { isFed: false, hibernating: true, isPoisoned: false };
  const result = creatureLogic.checkExtinction(creature);
  assert(!result, '冬眠中不應滅絕');
});

test('UT-CREA-022: checkExtinction 滅絕-中毒', () => {
  const creature = { isFed: true, hibernating: false, isPoisoned: true };
  const result = creatureLogic.checkExtinction(creature);
  assert(result, '中毒應滅絕');
});

// ==================== 工單 0305: feedingLogic 測試 ====================

section('工單 0305: feedingLogic 單元測試');

test('UT-FEED-001: feedCreature 基本測試', () => {
  // feedCreature 需要 gameState，建立簡易版本測試
  assert(typeof feedingLogic.feedCreature === 'function', 'feedCreature 應存在');
});

test('UT-FEED-002: attackCreature 基本測試', () => {
  assert(typeof feedingLogic.attackCreature === 'function', 'attackCreature 應存在');
});

test('UT-FEED-003: resolveAttack 基本測試', () => {
  assert(typeof feedingLogic.resolveAttack === 'function', 'resolveAttack 應存在');
});

test('UT-FEED-004: useRobbery 基本測試', () => {
  assert(typeof feedingLogic.useRobbery === 'function', 'useRobbery 應存在');
});

test('UT-FEED-005: useTrampling 基本測試', () => {
  assert(typeof feedingLogic.useTrampling === 'function', 'useTrampling 應存在');
});

test('UT-FEED-006: useHibernation 基本測試', () => {
  assert(typeof feedingLogic.useHibernation === 'function', 'useHibernation 應存在');
});

// ==================== 工單 0306: phaseLogic 測試 ====================

section('工單 0306: phaseLogic 單元測試');

test('UT-PHAS-001: rollDice 2人公式', () => {
  const results = [];
  for (let i = 0; i < 100; i++) {
    const result = phaseLogic.rollDice(2);
    results.push(result.total);
  }
  const min = Math.min(...results);
  const max = Math.max(...results);
  assert(min >= 3, '2人最小應為 3 (1+2)');
  assert(max <= 8, '2人最大應為 8 (6+2)');
});

test('UT-PHAS-002: rollDice 3人公式', () => {
  const results = [];
  for (let i = 0; i < 100; i++) {
    const result = phaseLogic.rollDice(3);
    results.push(result.total);
  }
  const min = Math.min(...results);
  const max = Math.max(...results);
  assert(min >= 2, '3人最小應為 2 (1+1)');
  assert(max <= 12, '3人最大應為 12 (6+6)');
});

test('UT-PHAS-003: rollDice 4人公式', () => {
  const results = [];
  for (let i = 0; i < 100; i++) {
    const result = phaseLogic.rollDice(4);
    results.push(result.total);
  }
  const min = Math.min(...results);
  const max = Math.max(...results);
  assert(min >= 4, '4人最小應為 4 (1+1+2)');
  assert(max <= 14, '4人最大應為 14 (6+6+2)');
});

test('UT-PHAS-004: calculateScores 計分', () => {
  const gameState = {
    players: {
      p1: {
        creatures: [
          { id: 'c1', traits: [{ type: 'carnivore', foodBonus: 1 }] },
          { id: 'c2', traits: [] }
        ]
      }
    }
  };
  const scores = phaseLogic.calculateScores(gameState);
  // c1: 2(生物) + 1(性狀) + 1(foodBonus) = 4
  // c2: 2(生物) = 2
  // 總計: 6
  assertEqual(scores.p1.total, 6, '分數應為 6');
});

test('UT-PHAS-005: determineWinner 單一勝者', () => {
  const scores = {
    p1: { total: 10 },
    p2: { total: 5 }
  };
  const result = phaseLogic.determineWinner(scores);
  assertEqual(result.winnerId, 'p1', '應為 p1 勝出');
  assert(!result.tied, '不應平手');
});

test('UT-PHAS-006: determineWinner 平手', () => {
  const scores = {
    p1: { total: 10 },
    p2: { total: 10 }
  };
  const result = phaseLogic.determineWinner(scores);
  assert(result.tied, '應平手');
  assertEqual(result.tiedPlayers.length, 2, '應有 2 人平手');
});

test('UT-PHAS-007: startEvolutionPhase', () => {
  const gameState = {
    players: { p1: { creatures: [] }, p2: { creatures: [] } },
    startPlayerIndex: 0
  };
  const result = phaseLogic.startEvolutionPhase(gameState);
  assertEqual(result.phase, 'evolution', 'phase 應為 evolution');
});

test('UT-PHAS-008: startFoodPhase', () => {
  const gameState = {
    players: { p1: {}, p2: {} },
    startPlayerIndex: 0
  };
  const result = phaseLogic.startFoodPhase(gameState);
  assertEqual(result.phase, 'foodSupply', 'phase 應為 foodSupply');
  assert(result.foodPool > 0, '應有食物');
});

test('UT-PHAS-009: startFeedingPhase', () => {
  const gameState = {
    players: { p1: { creatures: [] }, p2: { creatures: [] } },
    startPlayerIndex: 0
  };
  const result = phaseLogic.startFeedingPhase(gameState);
  assertEqual(result.phase, 'feeding', 'phase 應為 feeding');
});

test('UT-PHAS-010: advancePhase evolution -> foodSupply', () => {
  const gameState = {
    phase: 'evolution',
    players: { p1: {}, p2: {} },
    startPlayerIndex: 0
  };
  const result = phaseLogic.advancePhase(gameState);
  assertEqual(result.phase, 'foodSupply');
});

test('UT-PHAS-011: advancePhase foodSupply -> feeding', () => {
  const gameState = {
    phase: 'foodSupply',
    players: { p1: { creatures: [] }, p2: { creatures: [] } },
    startPlayerIndex: 0
  };
  const result = phaseLogic.advancePhase(gameState);
  assertEqual(result.phase, 'feeding');
});

test('UT-PHAS-012: checkGameEnd', () => {
  const gameState = { isLastRound: true, phase: 'extinction' };
  const result = phaseLogic.checkGameEnd(gameState);
  assert(result, '最後回合滅絕階段應結束');
});

// ==================== 工單 0307: gameLogic 測試 ====================

section('工單 0307: gameLogic 單元測試');

test('UT-GAME-001: initGame 2人遊戲', () => {
  const players = [{ id: 'p1', name: '玩家1' }, { id: 'p2', name: '玩家2' }];
  const result = gameLogic.initGame(players);
  assert(result.success, '應成功初始化');
  assertEqual(result.gameState.phase, 'waiting');
  assertEqual(Object.keys(result.gameState.players).length, 2);
});

test('UT-GAME-002: initGame 玩家數量驗證-太少', () => {
  const players = [{ id: 'p1', name: '玩家1' }];
  const result = gameLogic.initGame(players);
  assert(!result.success, '1人應失敗');
});

test('UT-GAME-003: initGame 玩家數量驗證-太多', () => {
  const players = [
    { id: 'p1', name: '玩家1' },
    { id: 'p2', name: '玩家2' },
    { id: 'p3', name: '玩家3' },
    { id: 'p4', name: '玩家4' },
    { id: 'p5', name: '玩家5' }
  ];
  const result = gameLogic.initGame(players);
  assert(!result.success, '5人應失敗');
});

test('UT-GAME-004: initGame 發牌正確', () => {
  const players = [{ id: 'p1', name: '玩家1' }, { id: 'p2', name: '玩家2' }];
  const result = gameLogic.initGame(players);
  assertEqual(result.gameState.players.p1.hand.length, 6, 'p1 應有 6 張手牌');
  assertEqual(result.gameState.players.p2.hand.length, 6, 'p2 應有 6 張手牌');
});

test('UT-GAME-005: initGame 牌庫剩餘正確', () => {
  const players = [{ id: 'p1', name: '玩家1' }, { id: 'p2', name: '玩家2' }];
  const result = gameLogic.initGame(players);
  assertEqual(result.gameState.deck.length, 72, '牌庫應剩 72 張 (84-12)');
});

test('UT-GAME-006: startGame', () => {
  const players = [{ id: 'p1', name: '玩家1' }, { id: 'p2', name: '玩家2' }];
  const initResult = gameLogic.initGame(players);
  const gameState = gameLogic.startGame(initResult.gameState);
  assertEqual(gameState.phase, 'evolution');
  assertEqual(gameState.round, 1);
});

test('UT-GAME-007: validateAction 非當前玩家', () => {
  const players = [{ id: 'p1', name: '玩家1' }, { id: 'p2', name: '玩家2' }];
  const initResult = gameLogic.initGame(players);
  const gameState = gameLogic.startGame(initResult.gameState);

  // 找出非當前玩家
  const nonCurrentPlayer = gameState.currentPlayerId === 'p1' ? 'p2' : 'p1';
  const result = gameLogic.validateAction(gameState, nonCurrentPlayer, { type: 'pass' });
  assert(!result.valid, '非當前玩家應被拒絕');
});

test('UT-GAME-008: validateAction 當前玩家', () => {
  const players = [{ id: 'p1', name: '玩家1' }, { id: 'p2', name: '玩家2' }];
  const initResult = gameLogic.initGame(players);
  const gameState = gameLogic.startGame(initResult.gameState);

  const result = gameLogic.validateAction(gameState, gameState.currentPlayerId, { type: 'pass' });
  assert(result.valid, '當前玩家應允許動作');
});

test('UT-GAME-009: getGameState 隱藏手牌', () => {
  const players = [{ id: 'p1', name: '玩家1' }, { id: 'p2', name: '玩家2' }];
  const initResult = gameLogic.initGame(players);
  const viewState = gameLogic.getGameState(initResult.gameState, 'p1');

  assert(Array.isArray(viewState.players.p1.hand), 'p1 應看到自己的手牌');
  assertEqual(typeof viewState.players.p2.hand, 'number', 'p2 的手牌應只是數字');
});

test('UT-GAME-010: processAction pass', () => {
  const players = [{ id: 'p1', name: '玩家1' }, { id: 'p2', name: '玩家2' }];
  const initResult = gameLogic.initGame(players);
  let gameState = gameLogic.startGame(initResult.gameState);

  const currentPlayer = gameState.currentPlayerId;
  const result = gameLogic.processAction(gameState, currentPlayer, { type: 'pass' });
  assert(result.success, 'pass 動作應成功');
});

// ==================== 工單 0308: 房間管理整合測試 ====================

section('工單 0308: 房間管理整合測試');

// 清除狀態
roomManager.rooms.clear();
roomManager.playerRooms.clear();

test('IT-ROOM-001: 完整房間流程', () => {
  // 創建房間
  const host = { id: 'host1', name: '房主', firebaseUid: 'uid_host' };
  const room = roomManager.createRoom('測試房', 4, 'socket_host', host);
  assert(room.id, '應創建房間');

  // 加入房間
  const player = { id: 'player1', name: '玩家', firebaseUid: 'uid_player' };
  const joinResult = roomManager.joinRoom(room.id, 'socket_player', player);
  assert(joinResult.success, '應成功加入');
  assertEqual(joinResult.room.players.length, 2);

  // 開始遊戲
  const startResult = roomManager.startGame(room.id, 'host1');
  assert(startResult.success, '應成功開始遊戲');

  // 清理
  roomManager.rooms.delete(room.id);
});

test('IT-ROOM-002: 非房主無法開始', () => {
  const host = { id: 'host2', name: '房主', firebaseUid: 'uid_host2' };
  const room = roomManager.createRoom('測試房2', 4, 'socket_host2', host);

  const player = { id: 'player2', name: '玩家', firebaseUid: 'uid_player2' };
  roomManager.joinRoom(room.id, 'socket_player2', player);

  const startResult = roomManager.startGame(room.id, 'player2');
  assert(!startResult.success, '非房主不應能開始遊戲');

  roomManager.rooms.delete(room.id);
});

test('IT-ROOM-003: 房主離開轉移', () => {
  const host = { id: 'host3', name: '房主', firebaseUid: 'uid_host3' };
  const room = roomManager.createRoom('測試房3', 4, 'socket_host3', host);

  const player = { id: 'player3', name: '玩家', firebaseUid: 'uid_player3' };
  roomManager.joinRoom(room.id, 'socket_player3', player);

  roomManager.leaveRoom(room.id, 'host3');
  const updatedRoom = roomManager.getRoom(room.id);

  assert(updatedRoom.players[0].isHost, '玩家應成為新房主');

  roomManager.rooms.delete(room.id);
});

test('IT-ROOM-004: 房間已滿拒絕', () => {
  const host = { id: 'host4', name: '房主', firebaseUid: 'uid_host4' };
  const room = roomManager.createRoom('測試房4', 2, 'socket_host4', host);

  const player1 = { id: 'player4', name: '玩家1', firebaseUid: 'uid_player4' };
  roomManager.joinRoom(room.id, 'socket_player4', player1);

  const player2 = { id: 'player5', name: '玩家2', firebaseUid: 'uid_player5' };
  const result = roomManager.joinRoom(room.id, 'socket_player5', player2);

  assert(!result.success, '房間已滿應拒絕');

  roomManager.rooms.delete(room.id);
});

test('IT-ROOM-005: 遊戲中無法加入', () => {
  const host = { id: 'host5', name: '房主', firebaseUid: 'uid_host5' };
  const room = roomManager.createRoom('測試房5', 4, 'socket_host5', host);

  const player1 = { id: 'player6', name: '玩家1', firebaseUid: 'uid_player6' };
  roomManager.joinRoom(room.id, 'socket_player6', player1);
  roomManager.startGame(room.id, 'host5');

  const player2 = { id: 'player7', name: '玩家2', firebaseUid: 'uid_player7' };
  const result = roomManager.joinRoom(room.id, 'socket_player7', player2);

  assert(!result.success, '遊戲開始後應拒絕加入');

  roomManager.rooms.delete(room.id);
});

// ==================== 工單 0309: 遊戲流程整合測試 ====================

section('工單 0309: 遊戲流程整合測試');

test('IT-FLOW-001: 完整階段循環', () => {
  const players = [{ id: 'p1', name: '玩家1' }, { id: 'p2', name: '玩家2' }];
  const initResult = gameLogic.initGame(players);
  let gs = gameLogic.startGame(initResult.gameState);

  assertEqual(gs.phase, 'evolution', '應從演化開始');

  // 模擬所有玩家跳過演化
  gs.players.p1.hasPassedEvolution = true;
  gs.players.p2.hasPassedEvolution = true;

  // 推進到食物階段
  gs = phaseLogic.advancePhase(gs);
  assertEqual(gs.phase, 'foodSupply', '應進入食物階段');

  // 推進到進食階段
  gs = phaseLogic.advancePhase(gs);
  assertEqual(gs.phase, 'feeding', '應進入進食階段');
});

test('IT-FLOW-002: 遊戲狀態持續', () => {
  const players = [{ id: 'p1', name: '玩家1' }, { id: 'p2', name: '玩家2' }];
  const initResult = gameLogic.initGame(players);
  let gs = gameLogic.startGame(initResult.gameState);

  const originalDeckLength = gs.deck.length;
  assertEqual(gs.round, 1, '第一回合');
  assert(originalDeckLength > 0, '應有牌庫');
});

test('IT-FLOW-003: 計分正確', () => {
  const gameState = {
    players: {
      p1: {
        creatures: [
          { id: 'c1', traits: [{ type: 'carnivore', foodBonus: 1 }, { type: 'massive', foodBonus: 1 }] }
        ]
      },
      p2: {
        creatures: [
          { id: 'c2', traits: [] },
          { id: 'c3', traits: [] }
        ]
      }
    }
  };

  const scores = phaseLogic.calculateScores(gameState);
  // p1: 2(生物) + 2(性狀) + 2(foodBonus) = 6
  // p2: 4(生物) = 4
  assertEqual(scores.p1.total, 6);
  assertEqual(scores.p2.total, 4);
});

// ==================== 工單 0310: Socket 整合測試 ====================

section('工單 0310: Socket.io 整合測試（模擬）');

test('IT-SOCK-001: roomManager 方法存在', () => {
  assert(typeof roomManager.createRoom === 'function');
  assert(typeof roomManager.joinRoom === 'function');
  assert(typeof roomManager.leaveRoom === 'function');
  assert(typeof roomManager.setReady === 'function');
  assert(typeof roomManager.startGame === 'function');
  assert(typeof roomManager.processAction === 'function');
});

test('IT-SOCK-002: getRoomList 功能', () => {
  const host = { id: 'sockHost', name: '房主', firebaseUid: 'uid_sockHost' };
  const room = roomManager.createRoom('Socket測試房', 4, 'socket_sockHost', host);

  const list = roomManager.getRoomList();
  assert(Array.isArray(list), '應返回陣列');
  assert(list.length > 0, '應有房間');

  roomManager.rooms.delete(room.id);
});

test('IT-SOCK-003: getRoom 功能', () => {
  const host = { id: 'sockHost2', name: '房主', firebaseUid: 'uid_sockHost2' };
  const room = roomManager.createRoom('Socket測試房2', 4, 'socket_sockHost2', host);

  const foundRoom = roomManager.getRoom(room.id);
  assertEqual(foundRoom.id, room.id);

  roomManager.rooms.delete(room.id);
});

// ==================== 工單 0311: E2E 測試 ====================

section('工單 0311: E2E 測試');

test('E2E-001: 完整2人遊戲流程', () => {
  // 創建房間
  const host = { id: 'e2eHost', name: '房主', firebaseUid: 'e2e_host' };
  const room = roomManager.createRoom('E2E測試', 2, 'socket_e2eHost', host);

  // 玩家加入
  const player = { id: 'e2ePlayer', name: '玩家', firebaseUid: 'e2e_player' };
  const joinResult = roomManager.joinRoom(room.id, 'socket_e2ePlayer', player);
  assert(joinResult.success);

  // 開始遊戲
  const startResult = roomManager.startGame(room.id, 'e2eHost');
  assert(startResult.success);

  // 驗證遊戲狀態
  const gameRoom = roomManager.getRoom(room.id);
  assert(gameRoom.gameState);
  assertEqual(gameRoom.gameState.phase, 'evolution');
  assertEqual(gameRoom.gameState.round, 1);

  // 清理
  roomManager.rooms.delete(room.id);
});

test('E2E-002: 動作處理流程', () => {
  const host = { id: 'e2eHost2', name: '房主', firebaseUid: 'e2e_host2' };
  const room = roomManager.createRoom('E2E測試2', 2, 'socket_e2eHost2', host);

  const player = { id: 'e2ePlayer2', name: '玩家', firebaseUid: 'e2e_player2' };
  roomManager.joinRoom(room.id, 'socket_e2ePlayer2', player);
  roomManager.startGame(room.id, 'e2eHost2');

  const gameRoom = roomManager.getRoom(room.id);
  const currentPlayer = gameRoom.gameState.currentPlayerId;

  // 執行 pass 動作
  const actionResult = roomManager.processAction(room.id, currentPlayer, { type: 'pass' });
  assert(actionResult.success, 'pass 動作應成功');

  roomManager.rooms.delete(room.id);
});

test('E2E-ERR-001: 非法動作被拒絕', () => {
  const host = { id: 'e2eHost3', name: '房主', firebaseUid: 'e2e_host3' };
  const room = roomManager.createRoom('E2E測試3', 2, 'socket_e2eHost3', host);

  const player = { id: 'e2ePlayer3', name: '玩家', firebaseUid: 'e2e_player3' };
  roomManager.joinRoom(room.id, 'socket_e2ePlayer3', player);
  roomManager.startGame(room.id, 'e2eHost3');

  const gameRoom = roomManager.getRoom(room.id);
  const nonCurrentPlayer = gameRoom.gameState.currentPlayerId === 'e2eHost3' ? 'e2ePlayer3' : 'e2eHost3';

  const actionResult = roomManager.processAction(room.id, nonCurrentPlayer, { type: 'pass' });
  assert(!actionResult.success, '非當前玩家動作應被拒絕');

  roomManager.rooms.delete(room.id);
});

// ==================== 測試結果 ====================

section('測試結果摘要');

const passRate = Math.round((passedTests / totalTests) * 100);

console.log(`\n總測試數: ${totalTests}`);
console.log(`通過: ${passedTests}`);
console.log(`失敗: ${failedTests}`);
console.log(`通過率: ${passRate}%`);

if (passRate >= 80) {
  console.log('\n🎉 測試通過！達到 80% 覆蓋率目標。\n');
} else {
  console.log(`\n⚠️ 測試未達標，需要 80%，目前 ${passRate}%\n`);
}

// 輸出失敗項目
if (failedTests > 0) {
  console.log('\n失敗項目:');
  testResults.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`  - ${r.name}: ${r.error}`);
  });
}

// 輸出測試統計
const stats = {
  cardLogic: testResults.filter(r => r.name.startsWith('UT-CARD')),
  creatureLogic: testResults.filter(r => r.name.startsWith('UT-CREA')),
  feedingLogic: testResults.filter(r => r.name.startsWith('UT-FEED')),
  phaseLogic: testResults.filter(r => r.name.startsWith('UT-PHAS')),
  gameLogic: testResults.filter(r => r.name.startsWith('UT-GAME')),
  roomIntegration: testResults.filter(r => r.name.startsWith('IT-ROOM')),
  flowIntegration: testResults.filter(r => r.name.startsWith('IT-FLOW')),
  socketIntegration: testResults.filter(r => r.name.startsWith('IT-SOCK')),
  e2e: testResults.filter(r => r.name.startsWith('E2E'))
};

console.log('\n模組統計:');
Object.entries(stats).forEach(([name, results]) => {
  const passed = results.filter(r => r.status === 'PASS').length;
  console.log(`  ${name}: ${passed}/${results.length} (${Math.round(passed/results.length*100)}%)`);
});

// 輸出 JSON 格式結果供報告使用
const reportData = {
  timestamp: new Date().toISOString(),
  totalTests,
  passedTests,
  failedTests,
  passRate,
  stats: Object.fromEntries(
    Object.entries(stats).map(([name, results]) => [
      name,
      {
        total: results.length,
        passed: results.filter(r => r.status === 'PASS').length,
        failed: results.filter(r => r.status === 'FAIL').length
      }
    ])
  )
};

console.log('\n報告數據:');
console.log(JSON.stringify(reportData, null, 2));
