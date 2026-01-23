# 桌遊網頁版專案

## 專案概述

這是一款3-4人玩的推理桌遊網頁版，玩家需要透過問牌和推理來猜測桌面上的兩張蓋牌顏色。

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

## 遊戲規則

詳細遊戲規則請參考：
- [遊戲規則完整說明](./docs/GAME_RULES.md)
- [規則快速參考](./docs/RULES_QUICK_REFERENCE.md)

## 開發進度

專案開發按照工作單進行，詳細工作單請參考 [work_orders/](./work_orders/) 目錄。

## 專案規劃

詳細專案規劃請參考 [PROJECT_PLAN.md](./PROJECT_PLAN.md)

## 授權

本專案為個人專案。
