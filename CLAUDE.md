# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

這是一款 3-4 人推理桌遊的網頁版實作。玩家透過問牌和推理來猜測桌面上兩張蓋牌的顏色。

## 常用指令

### 前端
```bash
cd frontend
npm install          # 安裝依賴
npm start            # 開發模式 (localhost:3000)
npm run build        # 建置生產版本
npm test             # 執行測試
```

### 後端
```bash
cd backend
npm install          # 安裝依賴
npm start            # 啟動伺服器
npm run dev          # 開發模式 (nodemon)
```

## 架構概述

- **frontend/**: React 18 + Redux 前端應用
- **backend/**: Node.js + Express 後端服務
- **shared/**: 前後端共用的常數和工具函數（如 `constants.js`）
- **docs/**: 遊戲規則文檔
- **work_orders/**: 工作單管理
- **reports/**: 完成報告

## 遊戲核心常數

所有遊戲常數定義在 `shared/constants.js`：
- 牌組配置：紅2、黃3、綠4、藍5（共14張）
- 玩家數量：3-4人
- 蓋牌數量：2張
- 問牌類型：三種方式（各一張、全部、給一張要全部）
- 遊戲階段：waiting / playing / followGuessing / roundEnd / finished
- 勝利分數：7分
- 猜牌得分：+3分
- 跟猜正確：+1分
- 跟猜錯誤：-1分（最低0分）

## 工作單系統

專案使用工作單管理開發進度：
- 工作單：`work_orders/WORK_ORDER_XXXX.md`
- 完成報告：`reports/REPORT_XXXX.md`
- 規則參考：`WORK_ORDER_RULES.md`

## 關鍵遊戲規則（開發時須注意）

1. **計分制**：遊戲進行多局，首位達到 7 分的玩家獲勝
2. **問牌機制**：先選兩個顏色 → 選目標玩家 → 選要牌方式
3. **「其中一種顏色全部」選擇權**：如果被要牌的玩家兩種顏色都有，由被要牌的玩家選擇給哪種
4. **玩家必須誠實給牌**：有多少給多少，不能拒絕
5. **猜牌者可查看答案**：猜牌時可以看到蓋牌實際顏色
6. **跟猜機制**：當有玩家猜牌時，其他玩家按順位決定是否跟猜
7. **跟猜得分**：跟對 +1 分，跟錯 -1 分且退出當局
8. **只剩一人時強制猜牌**：不能選擇問牌
9. **猜錯處理**：猜牌玩家和跟猜玩家都退出當局，當局繼續或結束進入下一局

詳細規則請參考 `docs/GAME_RULES.md`
