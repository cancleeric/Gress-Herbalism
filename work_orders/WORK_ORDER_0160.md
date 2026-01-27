# 工作單 0160

**建立日期**: 2026-01-27

**優先級**: P0 (嚴重)

**標題**: 修復 useAIPlayers 無限循環

---

## 一、工作目標

修復 `useAIPlayers.js` hook 中的無限循環問題，確保 AI 玩家只在配置實際變更時才重新初始化。

---

## 二、問題描述

### 現象
瀏覽器控制台出現以下錯誤：
```
Warning: Maximum update depth exceeded. This can happen when a component
calls setState inside useEffect, but useEffect either doesn't have a
dependency array, or one of the dependencies changes on every render.
```

### 根本原因
```javascript
// useAIPlayers.js:37-65
useEffect(() => {
  // ...創建 AI 玩家...
  setAIPlayers(players);  // 觸發重新渲染
}, [aiConfig]);  // aiConfig 是每次渲染創建的新物件引用
```

`aiConfig` 是從 GameRoom 傳入的物件，每次 GameRoom 渲染時都會創建新的物件引用。即使內容相同，引用變化也會觸發 useEffect，造成無限循環。

### 影響
- 瀏覽器卡頓或當機
- 測試超時失敗
- 單人模式無法正常運作

---

## 三、實施計畫

### 3.1 修改檔案
- `frontend/src/hooks/useAIPlayers.js`

### 3.2 修改內容

**方案：使用原始值作為依賴**

```javascript
// 修改前
useEffect(() => {
  if (!aiConfig || !aiConfig.aiCount || aiConfig.aiCount === 0) {
    setAIPlayers([]);
    aiPlayersRef.current = [];
    return;
  }
  // ...創建 AI 玩家...
  setAIPlayers(players);
  aiPlayersRef.current = players;
}, [aiConfig]);

// 修改後
// 將物件序列化為穩定的字串依賴
const difficultiesKey = aiConfig?.difficulties
  ? JSON.stringify(aiConfig.difficulties)
  : '';

useEffect(() => {
  if (!aiConfig || !aiConfig.aiCount || aiConfig.aiCount === 0) {
    setAIPlayers([]);
    aiPlayersRef.current = [];
    return;
  }

  // 創建 AI 玩家實例
  const players = [];
  for (let i = 0; i < aiConfig.aiCount; i++) {
    const difficulty = aiConfig.difficulties?.[i] || 'medium';
    const aiPlayer = createAIPlayer(
      `ai-${i + 1}`,
      null,
      difficulty
    );
    players.push(aiPlayer);
  }

  setAIPlayers(players);
  aiPlayersRef.current = players;

  console.log(`[AI] 初始化 ${aiConfig.aiCount} 個 AI 玩家`, players.map(p => ({
    id: p.id,
    name: p.name,
    difficulty: p.difficulty
  })));
}, [aiConfig?.aiCount, difficultiesKey]);
```

### 3.3 替代方案（如主方案有問題）

使用 useRef 追蹤已初始化狀態：
```javascript
const initializedRef = useRef(false);
const prevConfigRef = useRef(null);

useEffect(() => {
  // 深度比較配置是否真的變了
  const configString = JSON.stringify(aiConfig);
  if (prevConfigRef.current === configString) {
    return;
  }
  prevConfigRef.current = configString;

  // 原有的初始化邏輯...
}, [aiConfig]);
```

---

## 四、測試計畫

### 4.1 單元測試
修改 `useAIPlayers.test.js`：
```javascript
describe('useAIPlayers 穩定性', () => {
  test('相同配置內容不應重複初始化 AI 玩家', () => {
    const createAISpy = jest.spyOn(aiModule, 'createAIPlayer');

    const { rerender } = renderHook(
      ({ aiConfig }) => useAIPlayers({ aiConfig, gameState: {} }),
      { initialProps: { aiConfig: { aiCount: 2, difficulties: ['easy', 'medium'] } } }
    );

    // 第一次渲染應該創建 2 個 AI
    expect(createAISpy).toHaveBeenCalledTimes(2);

    // 重新渲染（即使 aiConfig 是新物件，內容相同）
    rerender({ aiConfig: { aiCount: 2, difficulties: ['easy', 'medium'] } });

    // 不應該再次創建
    expect(createAISpy).toHaveBeenCalledTimes(2);
  });

  test('配置變更時應重新初始化 AI 玩家', () => {
    const createAISpy = jest.spyOn(aiModule, 'createAIPlayer');

    const { rerender } = renderHook(
      ({ aiConfig }) => useAIPlayers({ aiConfig, gameState: {} }),
      { initialProps: { aiConfig: { aiCount: 2, difficulties: ['easy', 'medium'] } } }
    );

    expect(createAISpy).toHaveBeenCalledTimes(2);

    // 變更配置
    rerender({ aiConfig: { aiCount: 3, difficulties: ['easy', 'medium', 'hard'] } });

    // 應該重新創建
    expect(createAISpy).toHaveBeenCalledTimes(5);  // 2 + 3
  });
});
```

### 4.2 整合測試
- 在 GameRoom 中測試單人模式不會造成無限渲染

### 4.3 手動測試
- 啟動單人模式遊戲
- 確認瀏覽器不會卡頓
- 確認 AI 玩家正確初始化

---

## 五、驗收標準

1. 單人模式遊戲可正常啟動
2. 瀏覽器控制台無 "Maximum update depth exceeded" 警告
3. useAIPlayers.test.js 測試全部通過
4. AI 玩家只在配置真正變更時才重新初始化

---

## 六、風險評估

| 風險 | 可能性 | 影響 | 緩解措施 |
|------|--------|------|----------|
| JSON.stringify 效能問題 | 低 | 低 | difficulties 陣列很小 |
| 漏比較某些配置項 | 中 | 中 | 完整測試驗證 |

---

## 七、相關工單

- 依賴: 無
- 被依賴: 0161 (E2E 測試基礎設施)

---

*工單建立時間: 2026-01-27*
