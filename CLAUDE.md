# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

Nicholas Game 是一個多遊戲平台，目前支援以下遊戲：
- **本草 Herbalism**：3-4 人推理桌遊，玩家透過問牌和推理來猜測桌面上兩張蓋牌的顏色（已完成）
- **演化論：物種起源**：2-4 人策略卡牌遊戲（後端邏輯已完成，前端整合中）

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

### 模組化多遊戲架構

```
frontend/src/
├── components/
│   ├── common/              # 共用組件（Login、Lobby、Profile 等）
│   └── games/
│       ├── herbalism/       # 本草遊戲組件
│       └── evolution/       # 演化論遊戲組件
└── store/
    ├── herbalism/           # 本草狀態管理
    └── evolution/           # 演化論狀態管理

backend/
├── logic/
│   ├── herbalism/           # 本草遊戲邏輯
│   └── evolution/           # 演化論遊戲邏輯
│       ├── cardLogic.js     # 卡牌系統
│       ├── creatureLogic.js # 生物系統
│       ├── feedingLogic.js  # 進食系統
│       ├── phaseLogic.js    # 階段系統
│       ├── gameLogic.js     # 主邏輯
│       └── index.js         # 統一匯出
└── services/                # 共用服務

shared/constants/
├── common.js                # 共用常數
├── herbalism.js             # 本草常數
└── evolution.js             # 演化論常數（19種性狀、84張卡牌）
```

## 演化論遊戲常數

定義在 `shared/constants/evolution.js`：
- 玩家數量：2-4人
- 卡牌總數：84張雙面卡
- 遊戲階段：演化 / 食物供給 / 進食 / 滅絕
- 性狀類型：19種
- 計分：生物 +2分、性狀 +1分 + 食量加成

### 性狀分類

| 類別 | 性狀 |
|------|------|
| 肉食相關 | 肉食、腐食、銳目 |
| 防禦相關 | 偽裝、穴居、毒液、水生、敏捷、巨化、斷尾、擬態 |
| 進食相關 | 脂肪組織、冬眠、寄生蟲、掠奪 |
| 互動相關 | 溝通、合作、共生 |
| 特殊能力 | 踐踏 |

## 演化論遊戲規則重點

1. **雙面卡系統**：每張卡可當生物或性狀使用
2. **四階段回合**：演化 → 食物供給 → 進食 → 滅絕
3. **肉食攻擊**：肉食生物必須攻擊其他生物獲得食物
4. **互動性狀**：溝通、合作、共生需連結兩隻生物
5. **遊戲結束**：牌庫空後的最後一回合結束時計分

詳細規則請參考 `docs/演化論/GAME_RULES_EVOLUTION.md`

## 本草遊戲核心常數

定義在 `shared/constants/herbalism.js`：
- 牌組配置：紅2、黃3、綠4、藍5（共14張）
- 玩家數量：3-4人
- 蓋牌數量：2張
- 勝利分數：7分
- 猜牌得分：+3分
- 跟猜正確：+1分 / 跟猜錯誤：-1分（最低0分）

詳細規則請參考 `docs/本草/GAME_RULES.md`

## 工作單系統

專案使用工作單管理開發進度：
- 工作單：`work_orders/<遊戲>/WORK_ORDER_XXXX.md`
- 完成報告：`reports/<遊戲>/REPORT_XXXX.md`
- 規則參考：`WORK_ORDER_RULES.md`

### 演化論工單（0228-0271）

| 階段 | 工單範圍 | 狀態 |
|------|----------|------|
| 基礎架構 | 0228-0232 | ✓ 完成 |
| 性狀系統 | 0233-0251 | ✓ 完成 |
| 前端組件 | 0252-0259 | 基礎版完成 |
| 平台整合 | 0260-0263 | 部分完成 |
| 資料庫統計 | 0264-0266 | 待實作 |
| 測試優化 | 0267-0271 | 待補充 |
