# 完成報告 0221

## 工作單編號
0221

## 完成日期
2026-01-31

## 完成內容摘要

### 重組共用常數目錄結構

建立以下檔案結構：

```
shared/constants/
├── common.js      # 共用常數（遊戲類型等）
├── herbalism.js   # 本草常數（從 constants.js 遷移）
├── evolution.js   # 演化論常數（空模板）
└── index.js       # 統一匯出
```

### common.js 內容

```javascript
const GAME_TYPES = {
  HERBALISM: 'herbalism',
  EVOLUTION: 'evolution'
};

const GAME_TYPE_NAMES = {
  [GAME_TYPES.HERBALISM]: '本草 Herbalism',
  [GAME_TYPES.EVOLUTION]: '演化論：物種起源'
};
```

### index.js 統一匯出

```javascript
module.exports = {
  ...common,
  herbalism,
  evolution,
  ...herbalism  // 向後相容
};
```

## 遇到的問題與解決方案

1. **問題**：herbalism.js 使用 ES6 export 語法
   **解決**：轉換為 CommonJS 格式（const + module.exports）

## 測試結果
```bash
node -e "const constants = require('./shared/constants'); console.log(Object.keys(constants));"
# 成功載入所有常數
```

## 下一步計劃
執行工單 0222（更新常數引用路徑）- 已透過相容層完成
