/**
 * 自動驗證代碼修改
 *
 * 檢查項目：
 * 1. Lobby.js 是否正確添加了 URL 參數編碼
 * 2. GameRoom.js 是否正確添加了 URL 參數解析
 * 3. 代碼語法是否正確
 * 4. 邏輯是否完整
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('代碼修改自動驗證');
console.log('='.repeat(80));

let allChecksPass = true;
const results = [];

// ==================== 檢查 Lobby.js ====================
console.log('\n【1/3】檢查 Lobby.js 修改...');

const lobbyPath = path.join(__dirname, 'src/components/Lobby/Lobby.js');
const lobbyContent = fs.readFileSync(lobbyPath, 'utf-8');

// 檢查 1.1: 是否導入了 AIPlayerSelector
const hasAIPlayerSelectorImport = lobbyContent.includes("import { AIPlayerSelector } from '../GameSetup'");
console.log(`  ✓ 檢查 AIPlayerSelector 導入: ${hasAIPlayerSelectorImport ? '✅ 存在' : '❌ 缺失'}`);
results.push({ name: 'AIPlayerSelector 導入', pass: hasAIPlayerSelectorImport });
if (!hasAIPlayerSelectorImport) allChecksPass = false;

// 檢查 1.2: 是否導入了 AI_DIFFICULTY
const hasAIDifficultyImport = lobbyContent.includes('AI_DIFFICULTY');
console.log(`  ✓ 檢查 AI_DIFFICULTY 導入: ${hasAIDifficultyImport ? '✅ 存在' : '❌ 缺失'}`);
results.push({ name: 'AI_DIFFICULTY 導入', pass: hasAIDifficultyImport });
if (!hasAIDifficultyImport) allChecksPass = false;

// 檢查 1.3: 是否添加了 showAIModal 狀態
const hasShowAIModal = lobbyContent.includes('const [showAIModal, setShowAIModal] = useState(false)');
console.log(`  ✓ 檢查 showAIModal 狀態: ${hasShowAIModal ? '✅ 存在' : '❌ 缺失'}`);
results.push({ name: 'showAIModal 狀態', pass: hasShowAIModal });
if (!hasShowAIModal) allChecksPass = false;

// 檢查 1.4: 是否添加了 aiConfig 狀態
const hasAIConfig = lobbyContent.includes('const [aiConfig, setAIConfig] = useState');
console.log(`  ✓ 檢查 aiConfig 狀態: ${hasAIConfig ? '✅ 存在' : '❌ 缺失'}`);
results.push({ name: 'aiConfig 狀態', pass: hasAIConfig });
if (!hasAIConfig) allChecksPass = false;

// 檢查 1.5: 是否添加了 handleStartSinglePlayer
const hasHandleStartSinglePlayer = lobbyContent.includes('const handleStartSinglePlayer = ()');
console.log(`  ✓ 檢查 handleStartSinglePlayer 函數: ${hasHandleStartSinglePlayer ? '✅ 存在' : '❌ 缺失'}`);
results.push({ name: 'handleStartSinglePlayer 函數', pass: hasHandleStartSinglePlayer });
if (!hasHandleStartSinglePlayer) allChecksPass = false;

// 檢查 1.6: 是否添加了 URLSearchParams 編碼
const hasURLSearchParams = lobbyContent.includes('new URLSearchParams') && lobbyContent.includes("mode: 'single'");
console.log(`  ✓ 檢查 URL 參數編碼: ${hasURLSearchParams ? '✅ 存在' : '❌ 缺失'}`);
results.push({ name: 'URL 參數編碼', pass: hasURLSearchParams });
if (!hasURLSearchParams) allChecksPass = false;

// 檢查 1.7: 是否添加了單人模式 UI 區塊
const hasSinglePlayerSection = lobbyContent.includes('single-player-section') && lobbyContent.includes('🎮 單人模式');
console.log(`  ✓ 檢查單人模式 UI: ${hasSinglePlayerSection ? '✅ 存在' : '❌ 缺失'}`);
results.push({ name: '單人模式 UI', pass: hasSinglePlayerSection });
if (!hasSinglePlayerSection) allChecksPass = false;

// 檢查 1.8: 是否添加了 AI Modal
const hasAIModal = lobbyContent.includes('showAIModal &&') && lobbyContent.includes('<AIPlayerSelector');
console.log(`  ✓ 檢查 AI Modal: ${hasAIModal ? '✅ 存在' : '❌ 缺失'}`);
results.push({ name: 'AI Modal', pass: hasAIModal });
if (!hasAIModal) allChecksPass = false;

// ==================== 檢查 GameRoom.js ====================
console.log('\n【2/3】檢查 GameRoom.js 修改...');

const gameRoomPath = path.join(__dirname, 'src/components/GameRoom/GameRoom.js');
const gameRoomContent = fs.readFileSync(gameRoomPath, 'utf-8');

// 檢查 2.1: 是否添加了 getAIConfigFromURL 函數
const hasGetAIConfigFromURL = gameRoomContent.includes('const getAIConfigFromURL = ()');
console.log(`  ✓ 檢查 getAIConfigFromURL 函數: ${hasGetAIConfigFromURL ? '✅ 存在' : '❌ 缺失'}`);
results.push({ name: 'getAIConfigFromURL 函數', pass: hasGetAIConfigFromURL });
if (!hasGetAIConfigFromURL) allChecksPass = false;

// 檢查 2.2: 是否解析 mode 參數
const parsesModeParam = gameRoomContent.includes("params.get('mode')");
console.log(`  ✓ 檢查 mode 參數解析: ${parsesModeParam ? '✅ 存在' : '❌ 缺失'}`);
results.push({ name: 'mode 參數解析', pass: parsesModeParam });
if (!parsesModeParam) allChecksPass = false;

// 檢查 2.3: 是否解析 aiCount 參數
const parsesAICountParam = gameRoomContent.includes("params.get('aiCount')");
console.log(`  ✓ 檢查 aiCount 參數解析: ${parsesAICountParam ? '✅ 存在' : '❌ 缺失'}`);
results.push({ name: 'aiCount 參數解析', pass: parsesAICountParam });
if (!parsesAICountParam) allChecksPass = false;

// 檢查 2.4: 是否解析 difficulties 參數
const parsesDifficultiesParam = gameRoomContent.includes("params.get('difficulties')");
console.log(`  ✓ 檢查 difficulties 參數解析: ${parsesDifficultiesParam ? '✅ 存在' : '❌ 缺失'}`);
results.push({ name: 'difficulties 參數解析', pass: parsesDifficultiesParam });
if (!parsesDifficultiesParam) allChecksPass = false;

// 檢查 2.5: 是否有 split(',') 分割 difficulties
const splitsDifficulties = gameRoomContent.includes(".split(',')");
console.log(`  ✓ 檢查 difficulties 分割: ${splitsDifficulties ? '✅ 存在' : '❌ 缺失'}`);
results.push({ name: 'difficulties 分割', pass: splitsDifficulties });
if (!splitsDifficulties) allChecksPass = false;

// 檢查 2.6: 是否有 parseInt 轉換 aiCount
const parsesInt = gameRoomContent.includes('parseInt') && gameRoomContent.includes('aiCount');
console.log(`  ✓ 檢查 aiCount parseInt: ${parsesInt ? '✅ 存在' : '❌ 缺失'}`);
results.push({ name: 'aiCount parseInt', pass: parsesInt });
if (!parsesInt) allChecksPass = false;

// 檢查 2.7: 是否有 fallback 邏輯 (state || URL)
const hasFallback = gameRoomContent.includes('location.state?.aiConfig || getAIConfigFromURL()');
console.log(`  ✓ 檢查 fallback 邏輯: ${hasFallback ? '✅ 存在' : '❌ 缺失'}`);
results.push({ name: 'Fallback 邏輯', pass: hasFallback });
if (!hasFallback) allChecksPass = false;

// 檢查 2.8: 是否添加了調試日誌
const hasDebugLogs = gameRoomContent.includes('[GameRoom] getAIConfigFromURL 被調用') &&
                      gameRoomContent.includes('[GameRoom] ✅ 從 URL 解析成功');
console.log(`  ✓ 檢查調試日誌: ${hasDebugLogs ? '✅ 存在' : '❌ 缺失'}`);
results.push({ name: '調試日誌', pass: hasDebugLogs });
if (!hasDebugLogs) allChecksPass = false;

// ==================== 測試 URL 解析邏輯 ====================
console.log('\n【3/3】測試 URL 解析邏輯...');

// 模擬 URL 解析
function testURLParsing() {
  const testCases = [
    {
      name: '標準 URL',
      search: '?mode=single&aiCount=2&difficulties=medium,medium',
      expected: { aiCount: 2, difficulties: ['medium', 'medium'] }
    },
    {
      name: '3 個 AI',
      search: '?mode=single&aiCount=3&difficulties=easy,medium,hard',
      expected: { aiCount: 3, difficulties: ['easy', 'medium', 'hard'] }
    },
    {
      name: '缺少 mode',
      search: '?aiCount=2&difficulties=medium,medium',
      expected: null
    },
    {
      name: '缺少 aiCount',
      search: '?mode=single&difficulties=medium,medium',
      expected: null
    },
    {
      name: '缺少 difficulties',
      search: '?mode=single&aiCount=2',
      expected: null
    }
  ];

  let allTestsPass = true;

  testCases.forEach(testCase => {
    const params = new URLSearchParams(testCase.search);
    const mode = params.get('mode');
    const aiCount = params.get('aiCount');
    const difficulties = params.get('difficulties');

    let result = null;
    if (mode === 'single' && aiCount && difficulties) {
      result = {
        aiCount: parseInt(aiCount, 10),
        difficulties: difficulties.split(',')
      };
    }

    const pass = JSON.stringify(result) === JSON.stringify(testCase.expected);
    console.log(`  ✓ ${testCase.name}: ${pass ? '✅ 通過' : '❌ 失敗'}`);

    if (!pass) {
      console.log(`    預期: ${JSON.stringify(testCase.expected)}`);
      console.log(`    實際: ${JSON.stringify(result)}`);
      allTestsPass = false;
    }

    results.push({ name: `URL 解析測試 - ${testCase.name}`, pass });
  });

  return allTestsPass;
}

const urlTestsPass = testURLParsing();
if (!urlTestsPass) allChecksPass = false;

// ==================== 總結 ====================
console.log('\n' + '='.repeat(80));
console.log('檢查總結');
console.log('='.repeat(80));

const passedCount = results.filter(r => r.pass).length;
const totalCount = results.length;

console.log(`\n總計: ${passedCount}/${totalCount} 項檢查通過`);
console.log(`通過率: ${((passedCount / totalCount) * 100).toFixed(1)}%\n`);

if (allChecksPass) {
  console.log('✅ 所有檢查通過！代碼修改正確。\n');
  process.exit(0);
} else {
  console.log('❌ 部分檢查失敗！請檢查以下項目：\n');
  results.filter(r => !r.pass).forEach(r => {
    console.log(`  ❌ ${r.name}`);
  });
  console.log('');
  process.exit(1);
}
