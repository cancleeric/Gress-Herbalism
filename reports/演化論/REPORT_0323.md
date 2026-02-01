# 完成報告 0323

## 編號
0323

## 日期
2026-02-01

## 工作單標題
重構卡牌系統支援擴充包

## 完成摘要

成功將卡牌系統重構為模組化結構，支援擴充包定義自己的卡牌。新增 `Card` 類別和 `CardFactory` 工廠，實現雙面卡機制。

## 實作內容

### 1. 卡牌定義 (`cards/definitions.js`)

**21 種卡牌配對**（共 84 張）：

| 類別 | 卡牌 ID | 正面 | 背面 | 數量 |
|------|---------|------|------|------|
| 肉食 | BASE_001 | 肉食 | 肉食 | 4 |
| 肉食 | BASE_002 | 肉食 | 脂肪組織 | 4 |
| 防禦 | BASE_003~010 | 各防禦性狀 | 脂肪組織 | 32 |
| 進食 | BASE_011~014 | 各進食性狀 | 脂肪組織/肉食 | 16 |
| 互動 | BASE_015~017 | 溝通/合作/共生 | 同正面 | 12 |
| 特殊 | BASE_018~019 | 腐食/銳目 | 脂肪組織 | 8 |
| 踐踏 | BASE_020~021 | 踐踏 | 脂肪組織/肉食 | 8 |

**工具函數**：
- `getTotalCardCount()` - 計算總卡牌數
- `getCardDefinition()` - 根據 ID 取得定義
- `getCardsByTrait()` - 根據性狀搜尋相關卡牌
- `validateCardDefinitions()` - 驗證定義完整性

### 2. 卡牌類別 (`cards/cardFactory.js`)

**Card 類別**：
```javascript
class Card {
  id           // 卡牌定義 ID
  instanceId   // 唯一實例 ID
  frontTrait   // 正面性狀
  backTrait    // 背面性狀
  expansion    // 所屬擴充包
  selectedSide // 選擇的面 ('front' | 'back' | null)

  selectSide(side)      // 選擇使用哪一面
  getSelectedTrait()    // 取得選擇的性狀
  getFrontTraitInfo()   // 取得正面性狀資訊
  getBackTraitInfo()    // 取得背面性狀資訊
  isSameBothSides()     // 檢查是否雙面相同
  toJSON() / fromJSON() // 序列化支援
}
```

**CardFactory 類別**：
```javascript
class CardFactory {
  createCard(cardDef)     // 建立單張卡牌
  createCards(cardDef)    // 建立多張相同卡牌
  createDeck(definitions) // 建立完整牌庫
  shuffle(deck)           // 洗牌 (Fisher-Yates)
  createShuffledDeck()    // 建立並洗牌
}
```

### 3. 擴充包整合

更新 `shared/expansions/base/index.js`：
- 匯出新版卡牌模組
- 新增 `createDeck()` 和 `createShuffledDeck()` 方法
- 新增 `validate()` 驗證方法
- 保留向後相容舊版 `cards.js`

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       42 passed, 42 total
```

**測試覆蓋**：
- Card Definitions: 11 個測試
- Card 類別: 15 個測試
- CardFactory: 10 個測試
- 預設工廠實例: 2 個測試
- 整合測試: 4 個測試

## 產出檔案

| 檔案 | 說明 |
|------|------|
| `shared/expansions/base/cards/definitions.js` | 卡牌定義（21 種配對、84 張） |
| `shared/expansions/base/cards/cardFactory.js` | Card 類別和 CardFactory |
| `shared/expansions/base/cards/index.js` | 模組入口 |
| `shared/expansions/base/cards/__tests__/cards.test.js` | 單元測試（42 個） |
| `shared/expansions/base/index.js` | 更新擴充包入口 |

## 驗收標準達成

- [x] `BASE_CARDS` 定義完整，共 84 張卡
- [x] `Card` 類別支援雙面選擇
- [x] `CardFactory` 可建立完整牌庫
- [x] 卡牌實例 ID 唯一
- [x] `BaseExpansion` 匯出完整卡牌模組
- [x] 所有單元測試通過（42 個）
- [x] 向後相容舊版 cards.js

## 備註

- `backend/logic/evolution/cardLogic.js` 重構將在後續工單完成
- 本工單專注於 shared 層的卡牌系統模組化
- 雙面卡設計允許玩家靈活選擇策略
- 序列化支援便於遊戲狀態儲存/還原
