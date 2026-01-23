# 本草 Herbalism - 桌遊網頁版

## 專案概述

這是一款 3-4 人玩的推理桌遊網頁版，玩家需要透過問牌和推理來猜測桌面上的兩張蓋牌顏色。第一個正確猜出蓋牌顏色的玩家獲勝。

### 遊戲特色

- **14 張牌**：紅色 2 張、黃色 3 張、綠色 4 張、藍色 5 張
- **2 張蓋牌**：遊戲開始時抽出，作為猜測目標
- **三種問牌方式**：靈活的問牌策略
- **推理遊戲**：透過問牌收集資訊，推斷蓋牌顏色

## 專案結構

```
gress/
├── frontend/                    # 前端應用
│   ├── src/
│   │   ├── components/         # React 組件
│   │   ├── services/           # API 服務層
│   │   ├── store/             # Redux 狀態管理
│   │   ├── utils/              # 工具函數
│   │   ├── styles/            # 樣式文件
│   │   └── App.js             # 主應用入口
│   ├── public/                 # 靜態資源
│   └── package.json
│
├── backend/                     # 後端服務（可選）
│   ├── routes/                 # API 路由
│   ├── models/                # 數據模型
│   ├── services/              # 業務邏輯
│   └── package.json
│
├── shared/                     # 共享代碼
│   └── constants.js           # 遊戲常數定義
│
├── docs/                       # 文檔
│   ├── GAME_RULES.md          # 遊戲規則完整說明
│   └── RULES_QUICK_REFERENCE.md  # 規則快速參考
│
├── work_orders/                # 工作單
│   └── WORK_ORDER_XXXX.md     # 工作單檔案
│
└── README.md                   # 本檔案
```

## 安裝步驟

### 前端

```bash
cd frontend
npm install
```

### 後端（如需要）

```bash
cd backend
npm install
```

## 執行方式

### 前端開發模式

```bash
cd frontend
npm start
```

應用程式將在 `http://localhost:3000` 啟動。

### 前端建置

```bash
cd frontend
npm run build
```

### 後端（如需要）

```bash
cd backend
npm start
# 或開發模式
npm run dev
```

## 技術棧

### 前端
- **框架**: React 18.2.0
- **狀態管理**: Redux 4.2.1
- **路由**: React Router 6.20.0
- **建置工具**: Create React App

### 後端（可選）
- **框架**: Node.js + Express
- **開發工具**: Nodemon

## 開發進度

專案開發按照工作單進行，詳細工作單請參考 [work_orders/](./work_orders/) 目錄。

## 專案規劃

詳細專案規劃請參考 [PROJECT_PLAN.md](./PROJECT_PLAN.md)

## 測試

### 執行測試

```bash
cd frontend
npm test
```

### 執行測試並生成覆蓋率報告

```bash
cd frontend
npm test -- --coverage --watchAll=false
```

當前測試狀態：**476 個測試全部通過**

## 文檔

- [遊戲規則完整說明](./docs/GAME_RULES.md)
- [規則快速參考](./docs/RULES_QUICK_REFERENCE.md)
- [開發指南](./docs/DEVELOPMENT.md)
- [架構說明](./docs/ARCHITECTURE.md)
- [API 文檔](./docs/API.md)
- [部署指南](./docs/DEPLOYMENT.md)

## 授權

本專案為個人專案。
