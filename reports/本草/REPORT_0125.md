# 完成報告 0125：BUG 修復 - 遊戲進行中顏色牌禁用邏輯缺失

## 工單
WORK_ORDER_0125.md

## 完成狀態
已完成

## 問題描述
在工單 0124 重新設計遊戲進行中 UI 時，新的 playing stage UI 沒有實作顏色牌禁用邏輯：
1. 上回合選過的牌禁用功能缺失
2. 顏色牌玩家標記功能缺失
3. 點擊禁用牌警告功能缺失

## 修復內容

### 1. GameRoom.js
在顏色組合牌渲染邏輯中加入：
- `isDisabledBySelf` 判斷：檢查 `combo.id === myLastColorCardId`
- `marker` 判斷：從 `colorCardMarkers[combo.id]` 取得標記
- 點擊邏輯：禁用的牌調用 `handleDisabledCardClick()`，可選的牌調用 `handleColorCardSelect()`
- 禁用遮罩：顯示 `block` 圖示
- 玩家標記：顯示選過該牌的玩家名稱

### 2. GameRoom.css
新增樣式：
- `.playing-inquiry-card { position: relative; }` - 讓子元素定位
- `.playing-inquiry-card.disabled-by-self` - 禁用牌的樣式
- `.playing-inquiry-card-disabled-overlay` - 禁用遮罩（黑色半透明 + block 圖示）
- `.playing-inquiry-card-marker` - 玩家標記（底部標籤）
- `.playing-inquiry-card-marker.is-me` - 自己的標記（綠色背景）

### 3. GameRoom.test.js
新增測試：
- 初始狀態應有 6 張可選的顏色組合牌
- 非自己回合時所有顏色牌應該被禁用
- 顏色牌應該可以點擊打開問牌流程

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       61 passed, 61 total
```

## 完成日期
2026-01-26
