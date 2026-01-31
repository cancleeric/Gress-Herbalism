# 報告書 0133：猜牌結果對話框 UI 重新設計

## 工作單編號
0133

## 完成日期
2026-01-26

## 完成內容摘要

根據 Stitch 設計稿，重新設計猜牌結果對話框（猜對了/猜錯了），延續中國風草藥主題設計風格。

### 主要變更

1. **頂部標題區**
   - 猜對：badge 圖示 + 綠色「猜對了！」
   - 猜錯：close 圖示 + 紅色「猜錯了！」
   - 標題字體 32px 粗體

2. **蓋牌顯示區**
   - 金色標籤「蓋牌是：」
   - 顏色標籤使用五行元素命名：
     - 紅色 → 火 (Red) + local_fire_department 圖示
     - 黃色 → 土 (Yellow) + energy_savings_leaf 圖示
     - 綠色 → 木 (Green) + eco 圖示
     - 藍色 → 水 (Blue) + water_drop 圖示

3. **分數變化區塊**
   - 標題帶 analytics 圖示
   - 卡片樣式列表（sub-card 背景）
   - 玩家頭像 + 名稱 + 角色標籤
   - 說明文字（猜對獲得加分/未猜測等）
   - 分數變化（正數綠色，負數紅色）

4. **目前分數區塊**
   - 標題帶 leaderboard 圖示
   - 排名列表（依分數高低排序）
   - 勝利者顯示紅色「勝利！」標籤

5. **底部區域**
   - 遊戲未結束：「下一局」按鈕（綠色）
   - 遊戲結束：「恭喜 XXX 獲勝！」+ 「離開房間」按鈕

6. **移除重複代碼**
   - 移除第二個 return 語句中的重複對話框

### 檔案變更

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `GameRoom.js` | 修改 | 更新猜牌結果對話框 UI，移除重複代碼 |
| `GameRoom.css` | 修改 | 新增 gr- 前綴樣式（約 300 行） |
| `08-guess-result.html` | 新增 | Stitch 設計稿 |
| `WORK_ORDER_0133.md` | 新增 | 工作單 |

## 測試結果

```
PASS src/components/GameRoom/GameRoom.test.js
  GameRoom - 工作單 0016, 0017, 0020, 0022, 0124, 0125, 0126, 0133

Test Suites: 1 passed, 1 total
Tests:       61 passed, 61 total
```

## 設計風格

- 配色：
  - off-white: #F5F1E6（背景）
  - herbal-gold: #bb9c63（金色）
  - deep-green: #2f7f34（綠色）
  - soft-red: #e83b3e（紅色）
  - sub-card: #efeadc（卡片背景）
- Material Symbols 圖示
- 圓角、陰影效果
- 中國風紋理背景
