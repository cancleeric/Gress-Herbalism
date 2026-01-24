# 工作單 0063

**日期：** 2026-01-24

**工作單標題：** 後端單元測試建置

**工單主旨：** 提升測試覆蓋率 - 建立後端服務層單元測試

**分類：** 測試

---

## 目標

為後端服務建立完整的單元測試，確保核心業務邏輯的正確性。

## 背景

目前後端完全沒有測試覆蓋，存在以下風險：
- 重構時無法確認功能是否正常
- 無法快速驗證 bug 修復
- 缺乏程式碼品質保障

## 測試範圍

### 1. 測試環境設置

```bash
cd backend
npm install --save-dev jest supertest
```

**package.json 新增：**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": [
      "**/*.js",
      "!node_modules/**",
      "!coverage/**"
    ]
  }
}
```

### 2. friendService.js 測試

**測試檔案：** `backend/services/friendService.test.js`

**測試案例：**
- [ ] 新增好友請求
- [ ] 接受好友請求
- [ ] 拒絕好友請求
- [ ] 取得好友清單
- [ ] 移除好友
- [ ] 重複請求處理
- [ ] 無效用戶處理

### 3. invitationService.js 測試

**測試檔案：** `backend/services/invitationService.test.js`

**測試案例：**
- [ ] 發送遊戲邀請
- [ ] 接受邀請
- [ ] 拒絕邀請
- [ ] 邀請過期處理
- [ ] 重複邀請處理
- [ ] 邀請人離線處理

### 4. presenceService.js 測試

**測試檔案：** `backend/services/presenceService.test.js`

**測試案例：**
- [ ] 用戶上線狀態更新
- [ ] 用戶離線狀態更新
- [ ] 取得線上用戶清單
- [ ] 心跳機制測試
- [ ] 斷線重連處理

## Mock 策略

```javascript
// 資料庫 Mock 範例
jest.mock('../db/supabase', () => ({
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  }))
}));

// Socket.io Mock 範例
const mockSocket = {
  id: 'test-socket-id',
  emit: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
  to: jest.fn(() => ({ emit: jest.fn() }))
};
```

## 驗收標準

- [ ] 所有服務檔案都有對應的測試檔案
- [ ] 測試覆蓋率達到 80% 以上
- [ ] 所有測試案例通過
- [ ] CI/CD 整合測試指令
- [ ] 測試報告可正常生成
