# AI 模組測試

此目錄包含 AI 模組的所有測試檔案。

## 測試檔案結構

```
__tests__/
├── AIPlayer.test.js           # AIPlayer 類別測試
├── InformationTracker.test.js # 資訊追蹤器測試
├── ProbabilityCalculator.test.js # 概率計算器測試
├── DecisionMaker.test.js      # 決策執行器測試
├── strategies/
│   ├── EasyStrategy.test.js   # 簡單難度策略測試
│   ├── MediumStrategy.test.js # 中等難度策略測試
│   └── HardStrategy.test.js   # 困難難度策略測試
└── integration/
    ├── MediumAI.integration.test.js # 中等難度整合測試
    └── HardAI.integration.test.js   # 困難難度整合測試
```

## 執行測試

```bash
# 執行所有 AI 測試
npm test -- --testPathPattern=ai/

# 執行特定測試檔案
npm test -- AIPlayer.test.js

# 執行測試並顯示覆蓋率
npm test -- --coverage --testPathPattern=ai/
```

## 測試規範

1. 每個類別都應有對應的單元測試
2. 測試應涵蓋正常情況和邊界條件
3. 策略測試應驗證決策的有效性
4. 整合測試應驗證完整遊戲流程
