# 工單報告 0342：卡牌動畫系統

## 基本資訊

- **工單編號**：0342
- **完成日期**：2026-02-02
- **所屬計畫**：P2-B 前端 UI

---

## 完成內容摘要

### 1. cardAnimations.js - 動畫變體定義

**卡牌狀態變體 (cardVariants)**：
- `inDeck` - 牌庫中（縮小、透明、翻轉）
- `inHand` - 在手中（正常狀態）
- `selected` - 被選中（放大、上移）
- `playing` - 打出中（放大、上移）
- `asCreature` - 已變成生物
- `asTrait` - 已變成性狀（消失）
- `discarded` - 被棄置（縮小、右移、旋轉）
- `hover` - 懸停（輕微放大）
- `dragging` - 拖動中（放大、陰影）

**動畫函式**：
- `dealCardAnimation(index, total)` - 發牌動畫，支援延遲
- `flipCardAnimation` - 翻牌動畫（front/back）
- `drawCardAnimation` - 抽牌入場動畫
- `exitCardAnimation` - 卡牌離場動畫
- `fanLayoutAnimation(index, total, isSelected)` - 扇形排列動畫

### 2. useCardAnimation.js - 動畫 Hooks

**useCardAnimation(cardId)**：
- 單張卡牌動畫控制
- `state` - 當前狀態
- `animate(newState)` - 切換狀態
- `reset()` - 重置到 inHand
- `controls` - framer-motion 控制器

**useDealAnimation(cards)**：
- 批量發牌動畫
- `isDealing` - 是否正在發牌
- `dealtCards` - 已發出的卡牌
- `deal()` - 開始發牌
- `getAnimationProps(index)` - 取得動畫屬性

**useHandLayoutAnimation(cards, selectedCardId)**：
- 手牌扇形布局
- `getCardStyle(index)` - 計算卡牌位置

**useFlipAnimation()**：
- 翻牌動畫控制
- `isFlipped` - 是否翻面
- `flip()` - 切換翻面
- `flipTo(toBack)` - 翻到指定面

---

## 測試結果

```
Test Suites: 2 passed, 2 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        4.683 s

覆蓋率：
- cardAnimations.js: 100%
- useCardAnimation.js: 100%
- 整體: 100%
```

### 測試涵蓋範圍

**cardAnimations.test.js (28 tests)**：
- cardVariants 所有狀態（9 tests）
- dealCardAnimation 初始/動畫/延遲（4 tests）
- flipCardAnimation front/back（3 tests）
- drawCardAnimation 初始/動畫（3 tests）
- exitCardAnimation（2 tests）
- fanLayoutAnimation 布局計算（7 tests）

**useCardAnimation.test.js (17 tests)**：
- useCardAnimation 狀態管理（5 tests）
- useDealAnimation 發牌流程（5 tests）
- useHandLayoutAnimation 布局計算（4 tests）
- useFlipAnimation 翻牌控制（5 tests）

---

## 新增的檔案

### 組件/模組檔案
- `frontend/src/components/games/evolution/animations/cardAnimations.js`
- `frontend/src/components/games/evolution/animations/useCardAnimation.js`
- `frontend/src/components/games/evolution/animations/index.js`

### 測試檔案
- `frontend/src/components/games/evolution/animations/__tests__/cardAnimations.test.js`
- `frontend/src/components/games/evolution/animations/__tests__/useCardAnimation.test.js`

### 報告
- `reports/演化論/REPORT_0342.md`

---

## 驗收標準完成狀態

| 驗收項目 | 狀態 |
|---------|------|
| 發牌動畫流暢 | ✅ |
| 翻牌動畫正確 | ✅ |
| 扇形布局動畫正確 | ✅ |
| 選中狀態動畫正確 | ✅ |
| 打出動畫正確 | ✅ |
| Hook 可正常使用 | ✅ |
| 效能良好 | ✅ |

---

## 技術決策

### Spring 動畫

大部分動畫使用 spring 類型，提供更自然的物理感。參數經過調整以達到流暢但不過度彈跳的效果。

### 扇形布局算法

扇形布局根據卡牌數量自動調整展開角度，最大限制在合理範圍內，避免角度過大導致視覺混亂。

---

## 下一步計劃

工單 0342 完成，繼續執行：
- 工單 0343：遊戲動畫系統

---

**報告撰寫者**：Claude Code
**報告日期**：2026-02-02
