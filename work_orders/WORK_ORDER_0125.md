# 工單 0125：BUG 修復 - 遊戲進行中顏色牌禁用邏輯缺失

## 問題描述

在工單 0124 重新設計遊戲進行中 UI 時，新的 playing stage UI 沒有實作以下功能：

1. **上回合選過的牌禁用功能**：玩家上回合選過的顏色組合牌應該在當前回合被禁用
2. **顏色牌玩家標記功能**：顯示其他玩家選過的顏色牌標記
3. **點擊禁用牌警告功能**：點擊禁用的牌應該顯示警告訊息

## 問題根因

新的 playing stage UI（GameRoom.js 第 903-918 行）直接渲染顏色組合牌，沒有使用：
- `myLastColorCardId` 狀態來禁用上回合選過的牌
- `colorCardMarkers` 狀態來顯示玩家標記
- `handleDisabledCardClick` 處理函數來顯示警告

## 原有邏輯位置

- 狀態定義：`myLastColorCardId`（第 112 行）、`colorCardMarkers`（第 113 行）
- 狀態更新：`setMyLastColorCardId`（第 520 行）、`setColorCardMarkers`（第 522-528 行）
- 舊 UI 使用：`myDisabledCardId={myLastColorCardId}`（第 1337 行）

## 修復方案

在新的 playing stage UI 中加入以下邏輯：

```jsx
{colorCombinations.map((combo) => {
  const isDisabledBySelf = combo.id === myLastColorCardId;
  const marker = colorCardMarkers[combo.id];
  const isDisabled = !canAct || onlyGuess || isDisabledBySelf;

  return (
    <div
      key={combo.id}
      className={`playing-inquiry-card ${isDisabled ? 'disabled' : ''} ${isDisabledBySelf ? 'disabled-by-self' : ''}`}
      onClick={() => {
        if (isDisabledBySelf) {
          handleDisabledCardClick();
        } else if (canAct && !onlyGuess) {
          handleColorCardSelect({ id: combo.id, colors: combo.colors });
        }
      }}
    >
      {/* 卡牌內容 */}
      {marker && (
        <div className={`playing-inquiry-card-marker ${marker.playerId === myPlayer?.id ? 'is-me' : ''}`}>
          {marker.playerName}
        </div>
      )}
    </div>
  );
})}
```

## 技術實作

### 檔案變更
1. **GameRoom.js** - 新增禁用邏輯和標記顯示
2. **GameRoom.css** - 新增 `disabled-by-self` 和 `playing-inquiry-card-marker` 樣式
3. **GameRoom.test.js** - 更新測試驗證修復

## 驗收標準

1. 上回合選過的顏色牌應該被禁用（不能點擊）
2. 被禁用的牌應該顯示特殊樣式（如灰色+禁止圖示）
3. 點擊被禁用的牌應該顯示警告訊息「你上回合已選過這張牌」
4. 顏色牌上應該顯示其他玩家的標記
5. 新局開始時禁用狀態應該重置
6. 所有測試通過

## 優先級
高（功能缺失）

## 相關工單
- 工單 0074：新版問牌流程
- 工單 0075：顏色牌選擇記錄
- 工單 0124：遊戲進行中階段 UI 重新設計
